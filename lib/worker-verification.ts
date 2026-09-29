import prisma from './db';

export interface VerificationCheckResult {
  isAadhaarVerified: boolean;
  isBankVerified: boolean;
  isProfileComplete: boolean;
  isEligibleForVerified: boolean;
  status: 'VERIFIED' | 'PENDING_REVIEW' | 'ONBOARDING' | 'REJECTED' | 'SUSPENDED';
  missingRequirements: string[];
}

/**
 * Centralized business logic to evaluate worker verification status.
 * Worker status must NEVER be decided by the frontend alone.
 * 
 * Aadhaar Verified (Cashfree)
 * + Bank Verified (Cashfree)
 * + Required profile info satisfied (Name, category, city)
 * = Worker can become VERIFIED
 */
export async function evaluateWorkerVerification(
  workerId: string
): Promise<VerificationCheckResult> {
  const worker = await prisma.workerProfile.findUnique({
    where: { id: workerId },
    include: {
      aadhaarVerif: true,
      bankVerif: true,
      primaryCategory: true,
      documents: true,
    },
  });

  if (!worker) {
    throw new Error(`Worker profile not found for ID: ${workerId}`);
  }

  const isAadhaarVerified = worker.aadhaarVerif?.status === 'VERIFIED' || worker.identityVerified;
  const isBankVerified = worker.bankVerif?.status === 'VERIFIED';
  const isProfileComplete = Boolean(
    worker.fullName?.trim() &&
    worker.primaryCategoryId &&
    worker.city?.trim()
  );

  const missingRequirements: string[] = [];
  if (!worker.fullName?.trim()) missingRequirements.push('Full Legal Name');
  if (!worker.primaryCategoryId) missingRequirements.push('Primary Trade Category');
  if (!worker.city?.trim()) missingRequirements.push('Service City / Location');
  if (!isAadhaarVerified) missingRequirements.push('Cashfree Aadhaar Identity Verification');
  if (!isBankVerified) missingRequirements.push('Cashfree Bank Account Verification');

  const isEligibleForVerified = isAadhaarVerified && isBankVerified && isProfileComplete;

  let computedStatus: VerificationCheckResult['status'] = worker.status as any;

  if (worker.status === 'SUSPENDED') {
    computedStatus = 'SUSPENDED';
  } else if (worker.status === 'REJECTED') {
    computedStatus = 'REJECTED';
  } else if (isEligibleForVerified) {
    computedStatus = 'VERIFIED';
  } else if (isProfileComplete || isAadhaarVerified || isBankVerified) {
    computedStatus = 'PENDING_REVIEW';
  } else {
    computedStatus = 'ONBOARDING';
  }

  return {
    isAadhaarVerified,
    isBankVerified,
    isProfileComplete,
    isEligibleForVerified,
    status: computedStatus,
    missingRequirements,
  };
}

/**
 * Atomically updates worker status based on verification evaluation
 */
export async function syncWorkerVerificationStatus(workerId: string): Promise<string> {
  const evaluation = await evaluateWorkerVerification(workerId);

  await prisma.workerProfile.update({
    where: { id: workerId },
    data: {
      identityVerified: evaluation.isAadhaarVerified,
      bankVerified: evaluation.isBankVerified,
      status: evaluation.status,
    },
  });

  return evaluation.status;
}

export interface IdentityMatchResult {
  outcome: 'VERIFIED' | 'MANUAL_REVIEW' | 'FAILED';
  nameMatch: boolean;
  dobMatch: boolean | null;
  reason?: string;
}

/**
 * Server-side identity validation helper for matching verified identity details against registration info.
 */
export function validateIdentityMatch(
  workerFullName: string,
  workerDob: Date | string | null | undefined,
  cashfreeUserDetails?: {
    name?: string;
    dob?: string;
    gender?: string;
    mobile?: string;
  }
): IdentityMatchResult {
  if (!cashfreeUserDetails || !cashfreeUserDetails.name) {
    return {
      outcome: 'MANUAL_REVIEW',
      nameMatch: false,
      dobMatch: null,
      reason: 'Identity details from Cashfree were incomplete.',
    };
  }

  const cleanWorker = workerFullName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanVerified = cashfreeUserDetails.name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanWorker || !cleanVerified) {
    return {
      outcome: 'MANUAL_REVIEW',
      nameMatch: false,
      dobMatch: null,
      reason: 'Name was missing or blank.',
    };
  }

  // Name matching evaluation
  const workerTokens = cleanWorker.split(' ').filter(Boolean);
  const verifiedTokens = cleanVerified.split(' ').filter(Boolean);

  const isExact = cleanWorker === cleanVerified;
  const isSubstring = cleanWorker.includes(cleanVerified) || cleanVerified.includes(cleanWorker);
  
  const workerTokensInVerified = workerTokens.every((token) => verifiedTokens.includes(token));
  const verifiedTokensInWorker = verifiedTokens.every((token) => workerTokens.includes(token));
  const hasTokenMatch = workerTokensInVerified || verifiedTokensInWorker;

  const nameMatch = isExact || isSubstring || hasTokenMatch;

  // DOB matching evaluation (if available)
  let dobMatch: boolean | null = null;

  if (workerDob && cashfreeUserDetails.dob) {
    let wDobStr = '';
    if (workerDob instanceof Date) {
      wDobStr = workerDob.toISOString().split('T')[0];
    } else {
      wDobStr = String(workerDob).split('T')[0];
    }

    const rawCfDob = cashfreeUserDetails.dob.trim();
    let cfDobStr = '';
    if (/^\d{2}-\d{2}-\d{4}$/.test(rawCfDob)) {
      const [dd, mm, yyyy] = rawCfDob.split('-');
      cfDobStr = `${yyyy}-${mm}-${dd}`;
    } else {
      cfDobStr = rawCfDob;
    }

    if (wDobStr && cfDobStr) {
      dobMatch = wDobStr === cfDobStr;
    }
  }

  if (!nameMatch) {
    return {
      outcome: 'FAILED',
      nameMatch: false,
      dobMatch,
      reason: `Name mismatch: Registered name "${workerFullName}" does not match verified name "${cashfreeUserDetails.name}".`,
    };
  }

  if (dobMatch === false) {
    return {
      outcome: 'MANUAL_REVIEW',
      nameMatch: true,
      dobMatch: false,
      reason: 'Name matched but Date of Birth does not match.',
    };
  }

  return {
    outcome: 'VERIFIED',
    nameMatch: true,
    dobMatch,
    reason: 'Identity details matched successfully.',
  };
}

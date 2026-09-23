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

  const isAadhaarVerified = worker.aadhaarVerif?.status === 'VERIFIED';
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

import prisma from '../lib/db';
import { evaluateWorkerVerification, syncWorkerVerificationStatus } from '../lib/worker-verification';

async function diagnose() {
  console.log("====================================================");
  console.log("--- DIAGNOSING WORKER: teamwizranger@gmail.com ---");
  console.log("====================================================\n");

  const email = 'teamwizranger@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      workerProfile: {
        include: {
          aadhaarVerif: true,
          bankVerif: true,
          primaryCategory: true,
          skills: { include: { service: true, category: true } },
          serviceAreas: true,
          documents: true,
        },
      },
    },
  });

  if (!user || !user.workerProfile) {
    console.log("❌ USER OR WORKER PROFILE NOT FOUND!");
    return;
  }

  const worker = user.workerProfile;

  console.log("1. USER & WORKER DATABASE RECORD:");
  console.log(`   User ID: ${user.id}`);
  console.log(`   Worker Profile ID: ${worker.id}`);
  console.log(`   User Status: ${user.status}`);
  console.log(`   Worker Profile Status: ${worker.status}`);
  console.log(`   identityVerified: ${worker.identityVerified}`);
  console.log(`   bankVerified: ${worker.bankVerified}`);
  console.log(`   skillVerified: ${worker.skillVerified}`);
  console.log(`   isAvailable: ${worker.isAvailable}`);
  console.log(`   Location: ${worker.city}, ${worker.state} (${worker.latitude}, ${worker.longitude})`);
  console.log(`   Primary Category: ${worker.primaryCategory?.name} (${worker.primaryCategory?.slug})`);

  console.log("\n2. VERIFICATION RECORDS:");
  console.log(`   Aadhaar Record:`, worker.aadhaarVerif ? {
    id: worker.aadhaarVerif.id,
    status: worker.aadhaarVerif.status,
    maskedAadhaar: worker.aadhaarVerif.maskedAadhaar,
    verifiedAt: worker.aadhaarVerif.verifiedAt,
  } : "NONE (null)");

  console.log(`   Bank Record:`, worker.bankVerif ? {
    id: worker.bankVerif.id,
    status: worker.bankVerif.status,
    maskedAccountNo: worker.bankVerif.maskedAccountNo,
    bankName: worker.bankVerif.bankName,
    verifiedAt: worker.bankVerif.verifiedAt,
  } : "NONE (null)");

  console.log("\n3. EVALUATE WORKER VERIFICATION:");
  const evaluation = await evaluateWorkerVerification(worker.id);
  console.log(evaluation);

  console.log("\n4. SYNC WORKER VERIFICATION STATUS:");
  const syncedStatus = await syncWorkerVerificationStatus(worker.id);
  console.log(`   Synced Status: ${syncedStatus}`);

  console.log("\n5. CUSTOMER SEARCH ELIGIBILITY CHECK:");
  const isEligibleInDB = 
    worker.status === 'VERIFIED' &&
    worker.isAvailable === true &&
    worker.primaryCategoryId !== null;

  console.log(`   Status is VERIFIED? ${worker.status === 'VERIFIED'}`);
  console.log(`   isAvailable is TRUE? ${worker.isAvailable}`);
  console.log(`   Primary category set? ${worker.primaryCategoryId !== null}`);
  console.log(`   Overall DB Search Eligibility: ${isEligibleInDB ? 'PASS ✅' : 'FAIL ❌'}`);
}

diagnose()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

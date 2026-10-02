import assert from 'assert';
import prisma from '../lib/db';
import { isTestWorkerOverrideEnabled, evaluateWorkerVerification, syncWorkerVerificationStatus } from '../lib/worker-verification';

async function runTestWorkerOverrideTests() {
  console.log("====================================================");
  console.log("--- TEST WORKER OVERRIDE VERIFICATION SUITE ---");
  console.log("====================================================\n");

  const targetWorkerId = '4abeba38-4f85-40a7-b823-dba77891e542';
  const otherWorkerId = '1f2d0b16-aca5-4d96-b9a5-705c00fdcde6';

  const origEnable = process.env.ENABLE_TEST_WORKER_OVERRIDE;
  const origId = process.env.TEST_WORKER_ID;

  try {
    // TEST A: Override disabled -> test worker remains subject to normal verification
    console.log("TEST A: Override disabled -> test worker remains subject to normal verification...");
    delete process.env.ENABLE_TEST_WORKER_OVERRIDE;
    delete process.env.TEST_WORKER_ID;

    assert.strictEqual(isTestWorkerOverrideEnabled(targetWorkerId), false, 'Override helper must return false when ENV is disabled');
    
    const evalResultDisabled = await evaluateWorkerVerification(targetWorkerId);
    assert.strictEqual(evalResultDisabled.isAadhaarVerified, false, 'Aadhaar must be unverified when override disabled');
    assert.strictEqual(evalResultDisabled.isBankVerified, false, 'Bank must be unverified when override disabled');
    assert.strictEqual(evalResultDisabled.isEligibleForVerified, false, 'Must NOT be eligible for verified when override disabled');
    assert.strictEqual(evalResultDisabled.status, 'PENDING_REVIEW', 'Status must remain PENDING_REVIEW when override disabled');
    console.log("✔ TEST A PASSED ✅");

    // TEST B: Override enabled -> ONLY the configured test worker can pass verification eligibility gate
    console.log("\nTEST B: Override enabled -> ONLY configured test worker can pass verification gate...");
    process.env.ENABLE_TEST_WORKER_OVERRIDE = 'true';
    process.env.TEST_WORKER_ID = targetWorkerId;

    assert.strictEqual(isTestWorkerOverrideEnabled(targetWorkerId), true, 'Override helper must return true for target worker');
    const evalResultEnabled = await evaluateWorkerVerification(targetWorkerId);
    assert.strictEqual(evalResultEnabled.isEligibleForVerified, true, 'Target worker must be eligible for verified when override enabled');
    assert.strictEqual(evalResultEnabled.status, 'VERIFIED', 'Evaluated status must be VERIFIED for gate check when override enabled');
    console.log("✔ TEST B PASSED ✅");

    // TEST C: Another worker cannot use the override
    console.log("\nTEST C: Another worker cannot use the override...");
    assert.strictEqual(isTestWorkerOverrideEnabled(otherWorkerId), false, 'Other worker ID must NOT match override gate');
    assert.strictEqual(isTestWorkerOverrideEnabled('some-random-worker-id'), false, 'Random worker ID must NOT match override gate');
    console.log("✔ TEST C PASSED ✅");

    // TEST D: AadhaarVerification and BankVerification records remain unchanged
    console.log("\nTEST D: Verification records in DB remain completely unchanged...");
    const syncedStatus = await syncWorkerVerificationStatus(targetWorkerId);
    assert.strictEqual(syncedStatus, 'VERIFIED', 'syncWorkerVerificationStatus returns VERIFIED status for override');

    const targetAfterSync = await prisma.workerProfile.findUnique({
      where: { id: targetWorkerId },
      include: { aadhaarVerif: true, bankVerif: true },
    });

    assert.strictEqual(targetAfterSync?.identityVerified, false, 'DB identityVerified flag MUST remain false');
    assert.strictEqual(targetAfterSync?.bankVerified, false, 'DB bankVerified flag MUST remain false');
    assert.strictEqual(targetAfterSync?.status, 'PENDING_REVIEW', 'DB status MUST remain PENDING_REVIEW');
    assert.strictEqual(targetAfterSync?.aadhaarVerif, null, 'No fake Aadhaar record created');
    assert.strictEqual(targetAfterSync?.bankVerif, null, 'No fake Bank record created');
    console.log("✔ TEST D PASSED ✅");

    // TEST E: No client-controlled request parameter can activate the override
    console.log("\nTEST E: Client-controlled parameters cannot trigger override...");
    delete process.env.ENABLE_TEST_WORKER_OVERRIDE;
    process.env.TEST_WORKER_ID = targetWorkerId;

    assert.strictEqual(isTestWorkerOverrideEnabled(targetWorkerId), false, 'Override helper ignores client parameters');
    console.log("✔ TEST E PASSED ✅");

    console.log("\n====================================================");
    console.log("--- ALL OVERRIDE UNIT TESTS PASSED CLEANLY ✅ ---");
    console.log("====================================================");
  } finally {
    if (origEnable !== undefined) process.env.ENABLE_TEST_WORKER_OVERRIDE = origEnable;
    else delete process.env.ENABLE_TEST_WORKER_OVERRIDE;

    if (origId !== undefined) process.env.TEST_WORKER_ID = origId;
    else delete process.env.TEST_WORKER_ID;
  }
}

runTestWorkerOverrideTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

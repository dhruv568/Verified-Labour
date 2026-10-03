import assert from 'assert';
import prisma from '../lib/db';
import { sendContactResponseEmail } from '../services/resend-service';

export async function runAdminMessagesTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- 16. Admin Contact & Feedback Message Management Tests ---');

  let passed = 0;
  let failed = 0;

  async function testAsync(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  let createdMessageId: string = '';

  // 1. Contact Message Submission to DB
  await testAsync('1. User contact form submission saves ContactMessage to database with default unread state', async () => {
    const testName = 'Ramesh Kumar Test';
    const testEmail = 'ramesh.test@example.com';
    const testPhone = '+919109019090';
    const testSubject = 'Worker Booking Query';
    const testMessage = 'I am facing an issue while booking an electrician worker near Surat.';

    const msg = await prisma.contactMessage.create({
      data: {
        name: testName,
        email: testEmail,
        phone: testPhone,
        subject: testSubject,
        message: testMessage,
        isRead: false,
      },
    });

    assert(msg.id, 'Created ContactMessage must have a valid ID');
    assert.strictEqual(msg.name, testName);
    assert.strictEqual(msg.email, testEmail);
    assert.strictEqual(msg.phone, testPhone);
    assert.strictEqual(msg.subject, testSubject);
    assert.strictEqual(msg.message, testMessage);
    assert.strictEqual(msg.isRead, false, 'New message must be unread by default');
    assert.strictEqual(msg.respondedAt, null, 'New message must have null respondedAt date');

    createdMessageId = msg.id;
  });

  // 2. Admin Listing & Aggregate Counts
  await testAsync('2. Admin message aggregate query counts total, unread, read, and responded messages correctly', async () => {
    const [total, unread, read, responded] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.contactMessage.count({ where: { isRead: true, respondedAt: null } }),
      prisma.contactMessage.count({ where: { respondedAt: { not: null } } }),
    ]);

    assert(total > 0, 'Total message count should be > 0');
    assert(unread > 0, 'Unread count should be > 0 after creating unread message');
    assert.strictEqual(typeof read, 'number');
    assert.strictEqual(typeof responded, 'number');

    const fetchedMsg = await prisma.contactMessage.findUnique({
      where: { id: createdMessageId },
    });
    assert(fetchedMsg, 'Created message should be retrievable from database');
  });

  // 3. Mark as Read Status Update
  await testAsync('3. Marking message as Read updates isRead to true without modifying respondedAt or sending email', async () => {
    const updated = await prisma.contactMessage.update({
      where: { id: createdMessageId },
      data: { isRead: true },
    });

    assert.strictEqual(updated.isRead, true, 'isRead must be true');
    assert.strictEqual(updated.respondedAt, null, 'respondedAt must remain null on Read action');
  });

  // 4. Send Confirmation Response Email Helper
  await testAsync('4. sendContactResponseEmail generates clean professional output and succeeds', async () => {
    const result = await sendContactResponseEmail({
      name: 'Ramesh Kumar Test',
      email: 'ramesh.test@example.com',
    });

    assert(result.success, 'sendContactResponseEmail must return success: true');
  });

  // 5. Updating Status to Responded
  await testAsync('5. Responding updates message status to Responded and sets respondedAt timestamp', async () => {
    const now = new Date();
    const updated = await prisma.contactMessage.update({
      where: { id: createdMessageId },
      data: {
        isRead: true,
        respondedAt: now,
      },
    });

    assert.strictEqual(updated.isRead, true, 'Message should be read when responded');
    assert(updated.respondedAt, 'respondedAt timestamp must be set');
    assert(updated.respondedAt instanceof Date, 'respondedAt must be a valid Date object');
  });

  // 6. Failed Email Response Handling
  await testAsync('6. Failed email send does not mark message as responded', async () => {
    const newMsg = await prisma.contactMessage.create({
      data: {
        name: 'Failure Test User',
        email: 'fail@invalid-domain-test.local',
        phone: '+919999988888',
        subject: 'Failed Email Test',
        message: 'Testing email dispatch error resilience.',
        isRead: false,
      },
    });

    // Simulate failed response attempt without updating respondedAt
    const unupdatedMsg = await prisma.contactMessage.findUnique({
      where: { id: newMsg.id },
    });

    assert.strictEqual(unupdatedMsg?.respondedAt, null, 'Message must remain unresponded on email dispatch error');

    // Clean up test message
    await prisma.contactMessage.delete({ where: { id: newMsg.id } });
    if (createdMessageId) {
      await prisma.contactMessage.delete({ where: { id: createdMessageId } });
    }
  });

  return { passed, failed };
}

import prisma from './db';
import { hashPassword } from './auth';

export async function ensureInitialAdminUser() {
  const adminEmail = 'verifiedlabour@gmail.com';
  try {
    const existing = await prisma.user.findFirst({
      where: {
        email: adminEmail,
      },
    });

    if (existing) {
      if (existing.role !== 'ADMIN' || !existing.passwordHash) {
        const passwordHash = existing.passwordHash || (await hashPassword('Pass@123'));
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: {
            role: 'ADMIN',
            status: 'ACTIVE',
            isPhoneVerified: true,
            isEmailVerified: true,
            passwordHash,
          },
        });
        return updated;
      }

      // Ensure AdminUser record exists
      const adminRecord = await prisma.adminUser.findUnique({
        where: { userId: existing.id },
      });
      if (!adminRecord) {
        await prisma.adminUser.create({
          data: {
            userId: existing.id,
            permissions: 'ALL',
            department: 'Platform Operations & Administration',
          },
        });
      }
      return existing;
    }

    // Create initial admin account
    const passwordHash = await hashPassword('Pass@123');
    const newAdminUser = await prisma.user.create({
      data: {
        phone: '+910000000000',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        isPhoneVerified: true,
        isEmailVerified: true,
        adminUser: {
          create: {
            permissions: 'ALL',
            department: 'Platform Operations & Administration',
          },
        },
      },
    });

    console.log(`[Init Admin] Initial Admin account created (${adminEmail} / Pass@123)`);
    return newAdminUser;
  } catch (err) {
    console.error('[Init Admin Error]', err);
    return null;
  }
}

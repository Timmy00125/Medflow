import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@telemed.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists!');
    return;
  }

  const hashedPassword = await argon2.hash(adminPassword);

  await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Super System Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Super Admin created with email: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

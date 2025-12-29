import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin';

  if (!email || !password) {
    console.error('Usage: ts-node scripts/create-admin.ts <email> <password> [name]');
    console.error('Example: ts-node scripts/create-admin.ts admin@soapbox.com SecurePass123 "Admin User"');
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: { 
        password: hashedPassword,
        name,
        emailVerified: new Date(), // Mark as verified for admin users
      },
      create: { 
        email, 
        password: hashedPassword,
        name,
        emailVerified: new Date(), // Mark as verified for admin users
      },
    });

    console.log('✅ User created/updated successfully!');
    console.log('-----------------------------------');
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`ID: ${user.id}`);
    console.log(`Created: ${user.createdAt}`);
    console.log('-----------------------------------');
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

main()
  .finally(() => prisma.$disconnect());


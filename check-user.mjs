import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: 'admin@isodisplay.local'
      },
      select: {
        id: true,
        email: true,
        username: true,
        // Don't log password for security
      }
    });

    if (user) {
      console.log('Admin user found:');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Username:', user.username);
      console.log('\nNote: Default password should be "password" based on seed data');
    } else {
      console.log('No admin user found with email: admin@isodisplay.local');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
import { prisma } from '../src/lib/prisma';

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
    },
  });
  
  console.log('Users in database:');
  users.forEach(user => {
    console.log(`- ID: ${user.id}, Email: ${user.email}, Username: ${user.username}`);
  });
  
  await prisma.$disconnect();
}

checkUsers().catch(console.error);
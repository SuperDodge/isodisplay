import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function getContentIds() {
  try {
    const content = await prisma.content.findMany({
      select: {
        id: true,
        name: true,
        backgroundColor: true
      }
    });
    
    console.log('Content items:');
    content.forEach(item => {
      console.log(`- ${item.name}: ID=${item.id}, backgroundColor=${item.backgroundColor}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getContentIds();
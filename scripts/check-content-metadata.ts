import { prisma } from '../src/lib/prisma';

async function checkContentMetadata() {
  const content = await prisma.content.findMany({
    where: {
      deletedAt: null,
    },
    take: 1,
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  console.log('Latest content:');
  content.forEach(item => {
    console.log(`\nContent: ${item.name}`);
    console.log(`- ID: ${item.id}`);
    console.log(`- Background Color: ${item.backgroundColor}`);
    console.log(`- Metadata:`, JSON.stringify(item.metadata, null, 2));
  });
  
  await prisma.$disconnect();
}

checkContentMetadata().catch(console.error);
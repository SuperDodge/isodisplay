import { prisma } from '../src/lib/prisma';

async function checkThumbnails() {
  const content = await prisma.content.findMany({
    where: {
      deletedAt: null,
    },
    take: 1,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      thumbnails: true,
    },
  });
  
  console.log('Latest content:');
  content.forEach(item => {
    console.log(`\nContent: ${item.name}`);
    console.log(`- ID: ${item.id}`);
    console.log(`- File Path: ${item.filePath}`);
    console.log(`- Thumbnails:`);
    item.thumbnails.forEach(thumb => {
      console.log(`  - Size: ${thumb.size}, Path: ${thumb.filePath}`);
    });
  });
  
  await prisma.$disconnect();
}

checkThumbnails().catch(console.error);
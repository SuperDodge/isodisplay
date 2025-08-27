import { prisma } from '../src/lib/prisma';

async function checkContentPath() {
  const content = await prisma.content.findFirst({
    where: {
      id: '17d50d5e-faa7-4221-afc2-71f857386688'
    },
    include: {
      thumbnails: true
    }
  });
  
  if (content) {
    console.log('Content:', content.name);
    console.log('File Path:', content.filePath);
    console.log('Background:', content.backgroundColor);
    console.log('Metadata:', content.metadata);
    console.log('\nThumbnails:');
    content.thumbnails.forEach(thumb => {
      console.log(`- ${thumb.size}: ${thumb.filePath}`);
    });
  } else {
    console.log('Content not found');
  }
  
  await prisma.$disconnect();
}

checkContentPath().catch(console.error);
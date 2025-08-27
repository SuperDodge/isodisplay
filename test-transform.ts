import { PrismaClient } from './src/generated/prisma/index.js';
import { databaseToApiContent } from './src/lib/transformers/api-transformers.js';

const prisma = new PrismaClient();

async function test() {
  const content = await prisma.content.findFirst({
    where: { name: { contains: 'Isomer' }},
    orderBy: { createdAt: 'desc' },
    include: { 
      thumbnails: {
        where: { 
          OR: [
            { size: 'display' },
            { size: 'medium' }
          ]
        },
        orderBy: {
          size: 'asc'
        },
        take: 1,
      }
    }
  });
  
  console.log('Raw content from DB:');
  console.log('ID:', content?.id);
  console.log('Name:', content?.name);
  console.log('Thumbnails:', content?.thumbnails);
  
  if (content) {
    const transformed = databaseToApiContent(content);
    console.log('\nTransformed content:');
    console.log(JSON.stringify({
      id: transformed.id,
      name: transformed.name,
      thumbnailUrl: transformed.thumbnailUrl,
      thumbnails: transformed.thumbnails
    }, null, 2));
  }
  
  await prisma.$disconnect();
}

test().catch(console.error);
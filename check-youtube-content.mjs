import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkYoutubeContent() {
  try {
    const youtubeContent = await prisma.content.findMany({
      where: {
        type: 'YOUTUBE'
      },
      select: {
        id: true,
        name: true,
        type: true,
        metadata: true,
        filePath: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log('YouTube Content in Database:');
    console.log('============================');
    
    if (youtubeContent.length === 0) {
      console.log('No YouTube content found in the database.');
    } else {
      youtubeContent.forEach((content, index) => {
        console.log(`\n${index + 1}. ${content.name || 'NO NAME'}`);
        console.log(`   ID: ${content.id}`);
        console.log(`   Created: ${content.createdAt}`);
        console.log(`   Video ID: ${content.metadata?.videoId || 'N/A'}`);
        console.log(`   Thumbnail: ${content.metadata?.thumbnailUrl || 'N/A'}`);
      });
    }
  } catch (error) {
    console.error('Error fetching YouTube content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkYoutubeContent();
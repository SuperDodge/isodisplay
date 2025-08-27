import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function testAnalytics() {
  try {
    console.log('Testing analytics queries...');
    
    const displayCount = await prisma.display.count();
    console.log('Total displays:', displayCount);
    
    const contentCount = await prisma.content.count({
      where: { deletedAt: null }
    });
    console.log('Total content:', contentCount);
    
    const playlists = await prisma.playlist.findMany({
      where: { isActive: true },
      include: {
        items: true,
        displays: true
      }
    });
    console.log('Active playlists:', playlists.length);
    
    // Check if displays relation exists
    if (playlists.length > 0) {
      console.log('First playlist displays:', playlists[0].displays);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAnalytics();
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function restoreTransitionDurations() {
  try {
    // Update all playlist items with transition duration of 1 back to 1000
    // Since the database stores milliseconds, 1000ms = 1 second
    const result = await prisma.playlistItem.updateMany({
      where: {
        transitionDuration: 1
      },
      data: {
        transitionDuration: 1000 // 1000 milliseconds = 1 second
      }
    });

    console.log(`✅ Restored ${result.count} playlist items to correct transition duration (1000ms = 1 second)`);
    
    // Show updated items
    const items = await prisma.playlistItem.findMany({
      include: {
        content: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    console.log('\nUpdated Playlist Items:');
    console.log('========================');
    items.forEach((item) => {
      const durationInSeconds = item.transitionDuration / 1000;
      console.log(`${item.content?.name || 'Unknown'}: Transition ${item.transitionType} (${item.transitionDuration}ms = ${durationInSeconds}s)`);
    });

  } catch (error) {
    console.error('Error restoring transition durations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreTransitionDurations();
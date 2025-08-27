import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function fixTransitionDurations() {
  try {
    // Update all playlist items with transition duration of 1000 to 1
    const result = await prisma.playlistItem.updateMany({
      where: {
        transitionDuration: 1000
      },
      data: {
        transitionDuration: 1 // 1 second instead of 1000 seconds
      }
    });

    console.log(`✅ Fixed ${result.count} playlist items with incorrect transition duration`);
    
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
      console.log(`${item.content?.name || 'Unknown'}: Transition ${item.transitionType} (${item.transitionDuration}s)`);
    });

  } catch (error) {
    console.error('Error fixing transition durations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTransitionDurations();
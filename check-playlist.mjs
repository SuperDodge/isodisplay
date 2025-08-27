import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkPlaylist() {
  try {
    // Find the display
    const display = await prisma.display.findFirst({
      where: {
        urlSlug: 's-fFCzQRg9'
      },
      include: {
        playlist: {
          include: {
            items: {
              include: {
                content: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });

    if (!display) {
      console.log('Display not found');
      return;
    }

    console.log('Display:', display.name);
    console.log('Display ID:', display.id);
    console.log('Playlist:', display.playlist?.name || 'No playlist');
    
    if (display.playlist && display.playlist.items) {
      console.log('\nPlaylist Items:');
      console.log('================');
      display.playlist.items.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.content?.name || 'Unknown'}`);
        console.log(`   Content Type: ${item.content?.type}`);
        console.log(`   Item Duration: ${item.duration} seconds`);
        console.log(`   Content Duration: ${item.content?.duration} seconds`);
        console.log(`   Order: ${item.order}`);
        console.log(`   Transition: ${item.transitionType} (${item.transitionDuration}s)`);
      });
    } else {
      console.log('No playlist items found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlaylist();
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  // Get the display with playlist
  const display = await prisma.display.findFirst({
    where: {
      urlSlug: 'sRQo-oOv0t'
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
  
  console.log('Display:', {
    id: display?.id,
    name: display?.name,
    urlSlug: display?.urlSlug,
    hasPlaylist: !!display?.playlist,
    playlistName: display?.playlist?.name,
    itemCount: display?.playlist?.items?.length || 0
  });
  
  if (display?.playlist?.items?.[0]) {
    const item = display.playlist.items[0];
    console.log('\nFirst playlist item:', {
      id: item.id,
      contentId: item.contentId,
      duration: item.duration,
      transitionType: item.transitionType,
      content: {
        id: item.content?.id,
        name: item.content?.name,
        type: item.content?.type,
        filePath: item.content?.filePath
      }
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
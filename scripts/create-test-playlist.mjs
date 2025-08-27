import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function createTestPlaylist() {
  try {
    // Get first user for createdBy field
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('No user found. Please create a user first.');
      return;
    }
    
    const playlist = await prisma.playlist.create({
      data: {
        name: 'Test Playlist for Thumbnails',
        description: 'Playlist for testing thumbnail display',
        isActive: true,
        createdBy: user.id
      }
    });
    
    console.log(`Created playlist: ${playlist.name}`);
    console.log(`Playlist ID: ${playlist.id}`);
    console.log(`\nEdit URL: http://localhost:3000/playlists/${playlist.id}/edit`);
    console.log('\nPlease navigate to this URL in your browser to test the thumbnail display.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPlaylist();
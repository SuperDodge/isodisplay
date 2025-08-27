import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function getPlaylistId() {
  try {
    const playlist = await prisma.playlist.findFirst({});
    
    if (playlist) {
      console.log(`Playlist ID: ${playlist.id}`);
      console.log(`Playlist Name: ${playlist.name}`);
      console.log(`\nEdit URL: http://localhost:3000/playlists/${playlist.id}/edit`);
    } else {
      console.log('No active playlist found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getPlaylistId();
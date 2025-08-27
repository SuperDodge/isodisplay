import { PrismaClient } from '../src/generated/prisma/index.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function exportSeedData() {
  console.log('Exporting current database as seed data...');
  
  try {
    // Export all content
    const content = await prisma.content.findMany({
      where: { deletedAt: null },
      include: {
        thumbnails: true
      }
    });
    
    // Export all playlists
    const playlists = await prisma.playlist.findMany({
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    // Export all displays
    const displays = await prisma.display.findMany();
    
    // Export users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        password: true,  // We'll keep the hashed password for seed data
        permissions: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // Create seed data structure
    const seedData = {
      users: users,
      content: content.map(item => ({
        ...item,
        fileSize: item.fileSize ? item.fileSize.toString() : null,
        thumbnails: item.thumbnails.map(thumb => ({
          ...thumb,
          fileSize: thumb.fileSize ? thumb.fileSize.toString() : null
        }))
      })),
      playlists: playlists.map(playlist => ({
        ...playlist,
        items: playlist.items.map(item => ({
          ...item,
          contentId: item.contentId
        }))
      })),
      displays
    };
    
    // Write to seed data file
    const seedDataPath = path.join(__dirname, '..', 'prisma', 'seed-data.json');
    await fs.writeFile(
      seedDataPath,
      JSON.stringify(seedData, null, 2),
      'utf-8'
    );
    
    console.log(`✓ Exported seed data to ${seedDataPath}`);
    console.log(`  - ${content.length} content items`);
    console.log(`  - ${playlists.length} playlists`);
    console.log(`  - ${displays.length} displays`);
    console.log(`  - ${users.length} users`);
    
  } catch (error) {
    console.error('Error exporting seed data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportSeedData();
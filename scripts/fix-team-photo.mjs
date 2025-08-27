import { PrismaClient } from '../src/generated/prisma/index.js';
import { promises as fs } from 'fs';

const prisma = new PrismaClient();

async function fixTeamPhoto() {
  console.log('Fixing Team Photo...');
  
  try {
    // Find the Team Photo content
    const teamPhoto = await prisma.content.findFirst({
      where: {
        name: 'Team Photo - 2024'
      }
    });
    
    if (!teamPhoto) {
      console.log('Team Photo content not found');
      return;
    }
    
    console.log('Found Team Photo:', teamPhoto.id);
    
    // Update the file path to the correct one
    await prisma.content.update({
      where: { id: teamPhoto.id },
      data: {
        filePath: '/uploads/2025/08/images/9117b6aa-e1be-4963-b0d8-85901401bd80/1756150131951-1756150131939-Isomer.jpg'
      }
    });
    
    console.log('Updated file path');
    
    // Add the display thumbnail
    const displayThumbPath = 'uploads/2025/08/images/9117b6aa-e1be-4963-b0d8-85901401bd80/thumbnails/d42baffc-fa4b-4f69-bd1c-ffd524ac3ebc/display-thumb.jpg';
    const fullPath = `/Users/sronnie/Documents/Coding/IsoDisplay/${displayThumbPath}`;
    
    const stats = await fs.stat(fullPath);
    
    const thumbnail = await prisma.fileThumbnail.create({
      data: {
        contentId: teamPhoto.id,
        size: 'display',
        width: 640,
        height: 360,
        filePath: displayThumbPath,
        fileSize: BigInt(stats.size),
        format: 'jpg'
      }
    });
    
    console.log('Created display thumbnail entry');
    console.log('\nTeam Photo fix complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTeamPhoto();
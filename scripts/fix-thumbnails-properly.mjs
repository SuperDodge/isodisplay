import { PrismaClient } from '../src/generated/prisma/index.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function fixThumbnailsProperly() {
  console.log('Properly fixing thumbnail assignments...');
  
  try {
    // First, clear all existing thumbnail entries to start fresh
    console.log('Clearing existing thumbnail entries...');
    await prisma.fileThumbnail.deleteMany({});
    console.log('Cleared all existing thumbnails');
    
    // Get all image content
    const contents = await prisma.content.findMany({
      where: {
        deletedAt: null,
        type: 'IMAGE'
      }
    });
    
    console.log(`Found ${contents.length} image content items`);
    
    const thumbsDir = path.join(__dirname, '..', 'uploads/2025/08/images/9117b6aa-e1be-4963-b0d8-85901401bd80/thumbnails');
    const thumbSubDirs = await fs.readdir(thumbsDir);
    
    // Map each content to its thumbnail directory by matching the filename timestamp
    for (const content of contents) {
      console.log(`\nProcessing: ${content.name}`);
      console.log(`  File: ${content.filePath}`);
      
      if (!content.filePath) {
        console.log('  ⚠ No file path');
        continue;
      }
      
      // Extract the timestamp prefix from the filename
      const fileName = path.basename(content.filePath);
      const timestamp = fileName.split('-').slice(0, 2).join('-');
      console.log(`  Looking for thumbnails with timestamp: ${timestamp}`);
      
      // Find the thumbnail directory that contains files with this timestamp
      let matchedThumbDir = null;
      
      for (const subDir of thumbSubDirs) {
        const thumbDirPath = path.join(thumbsDir, subDir);
        const thumbFiles = await fs.readdir(thumbDirPath);
        
        // Check if any file in this directory has the matching timestamp
        const hasMatch = thumbFiles.some(file => file.startsWith(timestamp));
        
        if (hasMatch) {
          matchedThumbDir = subDir;
          console.log(`  Found matching thumbnail directory: ${subDir}`);
          break;
        }
      }
      
      if (!matchedThumbDir) {
        console.log('  ⚠ No matching thumbnail directory found');
        continue;
      }
      
      // Check if display thumbnail exists
      const displayThumbPath = path.join(thumbsDir, matchedThumbDir, 'display-thumb.jpg');
      
      try {
        const stats = await fs.stat(displayThumbPath);
        
        // Create the FileThumbnail entry with the correct path
        const relativePath = `uploads/2025/08/images/9117b6aa-e1be-4963-b0d8-85901401bd80/thumbnails/${matchedThumbDir}/display-thumb.jpg`;
        
        const thumbnail = await prisma.fileThumbnail.create({
          data: {
            contentId: content.id,
            size: 'display',
            width: 640,
            height: 360,
            filePath: relativePath,
            fileSize: BigInt(stats.size),
            format: 'jpg'
          }
        });
        
        console.log(`  ✓ Created display thumbnail entry`);
      } catch (err) {
        console.log('  ⚠ Display thumbnail file not found');
      }
    }
    
    console.log('\nThumbnail fix complete!');
  } catch (error) {
    console.error('Error fixing thumbnails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixThumbnailsProperly();
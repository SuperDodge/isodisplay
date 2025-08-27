import { PrismaClient } from '../src/generated/prisma/index.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function fixDisplayThumbnails() {
  console.log('Starting display thumbnail fix...');
  
  try {
    // Get all content
    const contents = await prisma.content.findMany({
      where: {
        deletedAt: null,
        type: 'IMAGE'
      },
      include: {
        thumbnails: true
      }
    });
    
    console.log(`Found ${contents.length} image content items`);
    
    for (const content of contents) {
      console.log(`\nProcessing: ${content.name}`);
      
      // Check if display thumbnail already exists in DB
      const hasDisplayThumb = content.thumbnails.some(t => t.size === 'display');
      if (hasDisplayThumb) {
        console.log('  ✓ Display thumbnail already registered');
        continue;
      }
      
      // Construct the expected display thumbnail path
      if (!content.filePath) {
        console.log('  ⚠ No file path, skipping');
        continue;
      }
      
      // Parse the file path to get the directory
      const filePath = content.filePath.replace(/^\//, ''); // Remove leading slash if present
      const fileDir = path.dirname(filePath);
      const baseDir = path.join(__dirname, '..', fileDir);
      
      // Look for thumbnails directory
      const thumbDir = path.join(baseDir, 'thumbnails');
      
      try {
        const thumbSubDirs = await fs.readdir(thumbDir);
        console.log(`  Checking ${thumbSubDirs.length} thumbnail directories`);
        
        for (const subDir of thumbSubDirs) {
          const displayThumbPath = path.join(thumbDir, subDir, 'display-thumb.jpg');
          
          try {
            const stats = await fs.stat(displayThumbPath);
            
            if (stats.isFile()) {
              console.log(`  Found display thumbnail at: ${displayThumbPath}`);
              
              // Create relative path for database
              const relativePath = path.relative(path.join(__dirname, '..'), displayThumbPath);
              
              // Create the FileThumbnail entry
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
              
              console.log(`  ✓ Created display thumbnail entry: ${thumbnail.id}`);
              break; // Found and created, move to next content
            }
          } catch (err) {
            // File doesn't exist, continue checking other subdirs
          }
        }
      } catch (err) {
        console.log(`  ⚠ No thumbnails directory found`);
      }
    }
    
    console.log('\nDisplay thumbnail fix complete!');
  } catch (error) {
    console.error('Error fixing display thumbnails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDisplayThumbnails();
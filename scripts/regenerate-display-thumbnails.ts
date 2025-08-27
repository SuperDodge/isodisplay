#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';
import { generateDisplayThumbnail } from '../src/lib/upload/image-processor';
import path from 'path';
import { promises as fs } from 'fs';

async function regenerateDisplayThumbnails() {
  console.log('Starting display thumbnail regeneration...');
  
  try {
    // Find all image content
    const imageContent = await prisma.content.findMany({
      where: {
        type: 'IMAGE',
        deletedAt: null,
      },
      include: {
        thumbnails: true,
      },
    });
    
    console.log(`Found ${imageContent.length} images to process`);
    
    const uploadsBasePath = '/Users/sronnie/Documents/Coding/IsoDisplay/uploads';
    
    for (const content of imageContent) {
      try {
        // Check if display thumbnail already exists
        const displayThumb = content.thumbnails.find(t => t.size === 'display');
        if (displayThumb) {
          console.log(`Display thumbnail already exists for ${content.name}, skipping...`);
          continue;
        }
        
        console.log(`Processing ${content.name}...`);
        console.log(`  File path: ${content.filePath}`);
        console.log(`  Background: ${content.backgroundColor || '#000000'}`);
        
        // Construct the full source path
        let sourcePath = content.filePath;
        if (!sourcePath.startsWith('/')) {
          // If it's a relative path, prepend the uploads base path
          sourcePath = path.join(uploadsBasePath, sourcePath.replace(/^uploads\//, ''));
        }
        
        // Check if source file exists
        try {
          await fs.access(sourcePath);
        } catch (error) {
          console.error(`  ✗ Source file not found: ${sourcePath}`);
          continue;
        }
        
        // Create output directory structure
        const relativePath = content.filePath.replace(/^uploads\//, '').replace(/^\/uploads\//, '');
        const contentDir = path.dirname(relativePath);
        const outputDir = path.join(uploadsBasePath, contentDir, 'thumbnails');
        
        // Ensure directory exists
        await fs.mkdir(outputDir, { recursive: true });
        
        // Generate unique filename for display thumbnail
        const baseName = path.basename(content.fileName, path.extname(content.fileName));
        const displayThumbName = `${baseName}-display.jpg`;
        const displayThumbPath = path.join(outputDir, displayThumbName);
        
        console.log(`  Generating thumbnail at: ${displayThumbPath}`);
        
        // Generate thumbnail with proper background
        await generateDisplayThumbnail(
          sourcePath,
          displayThumbPath,
          content.backgroundColor || '#000000',
          'contain',  // Use contain mode to show letterbox/pillarbox
          100         // 100% size within the frame
        );
        
        // Get the relative path for database storage
        const dbPath = displayThumbPath.substring(displayThumbPath.indexOf('/uploads/') + 1);
        
        // Save to database
        const stats = await fs.stat(displayThumbPath);
        await prisma.fileThumbnail.create({
          data: {
            contentId: content.id,
            size: 'display',
            width: 640,
            height: 360,
            filePath: dbPath,
            fileSize: BigInt(stats.size),
            format: 'jpg',
          },
        });
        
        console.log(`  ✓ Generated display thumbnail for ${content.name}`);
      } catch (error) {
        console.error(`  ✗ Failed to process ${content.name}:`, error);
      }
    }
    
    console.log('\n✅ Display thumbnail regeneration complete!');
  } catch (error) {
    console.error('Error during regeneration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
regenerateDisplayThumbnails();
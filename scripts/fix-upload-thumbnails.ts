#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';
import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';

async function fixUploadThumbnails() {
  try {
    // Get uploaded images without thumbnails
    const content = await prisma.content.findMany({
      where: {
        type: 'IMAGE',
        processingStatus: 'FAILED',
        filePath: {
          startsWith: 'uploads/'
        }
      }
    });
    
    console.log(`Found ${content.length} images to fix`);
    
    for (const item of content) {
      console.log(`\nProcessing ${item.name}...`);
      
      const filePath = item.filePath;
      const outputDir = path.join(path.dirname(filePath), 'thumbnails');
      
      // Create thumbnails directory
      await fs.mkdir(outputDir, { recursive: true });
      
      // Generate display thumbnail
      const displayThumbPath = path.join(outputDir, 'display-thumb.jpg');
      
      await sharp(filePath)
        .resize(640, 360, {
          fit: 'contain',
          background: item.backgroundColor || '#000000',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(displayThumbPath);
      
      console.log(`✓ Created display thumbnail at ${displayThumbPath}`);
      
      // Save to database
      const stats = await fs.stat(displayThumbPath);
      
      // Check if thumbnail already exists
      const existing = await prisma.fileThumbnail.findFirst({
        where: {
          contentId: item.id,
          size: 'display'
        }
      });
      
      if (!existing) {
        await prisma.fileThumbnail.create({
          data: {
            contentId: item.id,
            size: 'display',
            width: 640,
            height: 360,
            filePath: displayThumbPath,
            fileSize: BigInt(stats.size),
            format: 'jpg'
          }
        });
        console.log('✓ Saved thumbnail to database');
      }
      
      // Update status
      await prisma.content.update({
        where: { id: item.id },
        data: {
          processingStatus: 'COMPLETED'
        }
      });
      
      console.log('✓ Updated status to COMPLETED');
    }
    
    console.log('\nAll thumbnails fixed!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUploadThumbnails();
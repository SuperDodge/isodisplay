#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';
import { processImage, generateDisplayThumbnail } from '../src/lib/upload/image-processor';
import path from 'path';
import { promises as fs } from 'fs';

async function generateThumbnailsForUpload() {
  try {
    // Get the most recent uploaded image
    const latestContent = await prisma.content.findFirst({
      where: {
        type: 'IMAGE',
        deletedAt: null,
        processingStatus: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!latestContent) {
      console.log('No pending images to process');
      return;
    }
    
    console.log(`Processing thumbnails for ${latestContent.name}...`);
    console.log(`File path: ${latestContent.filePath}`);
    
    // Process the image
    const outputDir = path.join(path.dirname(latestContent.filePath), 'thumbnails');
    await fs.mkdir(outputDir, { recursive: true });
    
    try {
      // Generate standard thumbnails
      const result = await processImage(latestContent.filePath, outputDir);
      
      console.log('Generated thumbnails:', Object.keys(result.thumbnails));
      
      // Save thumbnails to database
      for (const [size, thumbPath] of Object.entries(result.thumbnails)) {
        const stats = await fs.stat(thumbPath);
        await prisma.fileThumbnail.create({
          data: {
            contentId: latestContent.id,
            size,
            width: size === 'small' ? 200 : size === 'medium' ? 800 : 1920,
            height: size === 'small' ? 200 : size === 'medium' ? 800 : 1080,
            filePath: thumbPath,
            fileSize: BigInt(stats.size),
            format: 'webp',
          },
        });
        console.log(`✓ Saved ${size} thumbnail`);
      }
      
      // Generate display thumbnail
      const displayThumbPath = path.join(outputDir, 'display-thumb.jpg');
      await generateDisplayThumbnail(
        latestContent.filePath,
        displayThumbPath,
        latestContent.backgroundColor || '#000000'
      );
      
      const displayStats = await fs.stat(displayThumbPath);
      await prisma.fileThumbnail.create({
        data: {
          contentId: latestContent.id,
          size: 'display',
          width: 640,
          height: 360,
          filePath: displayThumbPath,
          fileSize: BigInt(displayStats.size),
          format: 'jpg',
        },
      });
      console.log('✓ Saved display thumbnail');
      
      // Update content status
      await prisma.content.update({
        where: { id: latestContent.id },
        data: {
          processingStatus: 'COMPLETED',
          metadata: result.metadata
        }
      });
      
      console.log('✓ Processing complete!');
    } catch (error) {
      console.error('Error processing image:', error);
      await prisma.content.update({
        where: { id: latestContent.id },
        data: {
          processingStatus: 'FAILED',
          processingError: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateThumbnailsForUpload();
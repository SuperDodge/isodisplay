#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

async function createPlaceholderThumbnails() {
  console.log('Creating placeholder thumbnails for existing content...');
  
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = './public/uploads';
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(path.join(uploadsDir, 'thumbnails'), { recursive: true });
    
    // Get all content without thumbnails
    const content = await prisma.content.findMany({
      where: {
        thumbnails: {
          none: {}
        }
      }
    });
    
    console.log(`Found ${content.length} content items without thumbnails`);
    
    for (const item of content) {
      console.log(`Creating placeholder for ${item.name}...`);
      
      // Generate a placeholder image with text
      const placeholderPath = path.join(uploadsDir, 'thumbnails', `${item.id}-placeholder.jpg`);
      
      // Create a 640x360 placeholder with the content type
      const svg = `
        <svg width="640" height="360" xmlns="http://www.w3.org/2000/svg">
          <rect width="640" height="360" fill="${item.backgroundColor || '#1a1a1a'}"/>
          <text x="320" y="160" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" text-anchor="middle" opacity="0.3">
            ${item.type}
          </text>
          <text x="320" y="200" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" text-anchor="middle" opacity="0.5">
            ${item.name}
          </text>
        </svg>
      `;
      
      await sharp(Buffer.from(svg))
        .jpeg({ quality: 85 })
        .toFile(placeholderPath);
      
      // Create database record for the thumbnail
      await prisma.fileThumbnail.create({
        data: {
          contentId: item.id,
          size: 'display',
          width: 640,
          height: 360,
          filePath: `/uploads/thumbnails/${item.id}-placeholder.jpg`,
          fileSize: BigInt(5000), // Approximate size
          format: 'jpg'
        }
      });
      
      console.log(`✓ Created placeholder thumbnail for ${item.name}`);
    }
    
    console.log('Placeholder thumbnail creation complete!');
  } catch (error) {
    console.error('Error creating placeholders:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createPlaceholderThumbnails();
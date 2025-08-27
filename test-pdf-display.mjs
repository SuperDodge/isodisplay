import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function testPDFDisplay() {
  try {
    // Get the most recent PDF content with thumbnails
    const pdfContent = await prisma.content.findFirst({
      where: { 
        type: 'PDF',
        thumbnails: {
          some: {}  // Has at least one thumbnail
        }
      },
      include: {
        thumbnails: {
          where: { 
            OR: [
              { size: 'display' },
              { size: 'medium' }
            ]
          },
          orderBy: {
            size: 'asc'
          },
          take: 1,
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!pdfContent) {
      console.log('No PDF content with thumbnails found');
      return;
    }

    console.log('\n=== Raw Database Content ===');
    console.log('Name:', pdfContent.name);
    console.log('Type:', pdfContent.type);
    console.log('Thumbnails:', pdfContent.thumbnails);

    // Simulate the transformer logic
    let thumbnailUrl = undefined;
    if (pdfContent.thumbnails && pdfContent.thumbnails.length > 0) {
      const thumbnail = pdfContent.thumbnails.find(t => t.size === 'display') || 
                       pdfContent.thumbnails.find(t => t.size === 'medium') ||
                       pdfContent.thumbnails[0];
      
      if (thumbnail?.filePath) {
        // Handle absolute paths
        if (thumbnail.filePath.includes('/uploads/')) {
          const uploadsIndex = thumbnail.filePath.indexOf('/uploads/');
          const relativePath = thumbnail.filePath.substring(uploadsIndex + '/uploads/'.length);
          thumbnailUrl = `/api/files/${relativePath}`;
        }
      }
    }
    
    console.log('\n=== Transformed Thumbnail URL ===');
    console.log('ThumbnailUrl:', thumbnailUrl);
    
    // Test if URL is accessible
    if (thumbnailUrl) {
      console.log('\n=== Testing URL ===');
      console.log('Full URL:', `http://localhost:3000${thumbnailUrl}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPDFDisplay();
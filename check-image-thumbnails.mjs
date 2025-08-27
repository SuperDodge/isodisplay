import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkImageThumbnails() {
  try {
    // Get the most recent image content
    const imageContent = await prisma.content.findFirst({
      where: { type: 'IMAGE' },
      include: {
        thumbnails: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!imageContent) {
      console.log('No image content found');
      return;
    }

    console.log('\n=== Image Content ===');
    console.log('Name:', imageContent.name);
    console.log('ID:', imageContent.id);
    console.log('FilePath:', imageContent.filePath);
    console.log('Created:', imageContent.createdAt);
    console.log('\n=== Thumbnails ===');
    console.log('Count:', imageContent.thumbnails.length);
    
    if (imageContent.thumbnails.length > 0) {
      for (const thumb of imageContent.thumbnails) {
        console.log(`\n${thumb.size}:`);
        console.log('  Path:', thumb.filePath);
        console.log('  Size:', thumb.fileSize.toString(), 'bytes');
        console.log('  Dimensions:', `${thumb.width}x${thumb.height}`);
      }
    }

    // Check how the path would be transformed
    if (imageContent.thumbnails.length > 0) {
      const displayThumb = imageContent.thumbnails.find(t => t.size === 'display');
      if (displayThumb) {
        console.log('\n=== Path Transformation ===');
        console.log('Original:', displayThumb.filePath);
        
        if (displayThumb.filePath.includes('/uploads/')) {
          const uploadsIndex = displayThumb.filePath.indexOf('/uploads/');
          const relativePath = displayThumb.filePath.substring(uploadsIndex + '/uploads/'.length);
          const apiUrl = `/api/files/${relativePath}`;
          console.log('API URL:', apiUrl);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImageThumbnails();
import { prisma } from '../src/lib/prisma';
import { generateDisplayThumbnail } from '../src/lib/upload/image-processor';
import path from 'path';

async function regenerateThumbnails() {
  console.log('Regenerating thumbnails for all content...');
  
  const content = await prisma.content.findMany({
    where: {
      deletedAt: null,
      type: 'IMAGE'
    }
  });
  
  for (const item of content) {
    console.log(`\nProcessing: ${item.name}`);
    console.log(`- Background: ${item.backgroundColor}`);
    console.log(`- Metadata:`, item.metadata);
    
    if (item.filePath) {
      const outputDir = path.join(path.dirname(item.filePath), 'thumbnails');
      const displayThumbPath = path.join(outputDir, 'display-thumb.jpg');
      
      const metadata = (item.metadata as any) || {};
      
      try {
        await generateDisplayThumbnail(
          item.filePath,
          displayThumbPath,
          item.backgroundColor || '#000000',
          metadata.imageScale || 'contain',
          metadata.imageSize || 100
        );
        console.log(`✓ Regenerated thumbnail for ${item.name}`);
      } catch (error) {
        console.error(`✗ Failed to regenerate thumbnail for ${item.name}:`, error);
      }
    }
  }
  
  await prisma.$disconnect();
}

regenerateThumbnails().catch(console.error);
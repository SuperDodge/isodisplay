import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function updateContentMetadata() {
  try {
    // Get all image content
    const images = await prisma.content.findMany({
      where: {
        type: 'IMAGE',
        deletedAt: null
      }
    });

    console.log(`Found ${images.length} images to update`);

    // Update each image with proper metadata
    for (const image of images) {
      const updatedMetadata = {
        ...(image.metadata || {}),
        imageSize: 50,  // Set to 50% size for logos
        imageScale: 'contain'
      };

      // Different background colors for different brand images
      let backgroundColor = '#252c3a'; // Default brand gray
      
      if (image.name.includes('Orange')) {
        backgroundColor = '#f56600'; // Brand orange background
      } else if (image.name.includes('White')) {
        backgroundColor = '#252c3a'; // Gray background for white logos
      } else if (image.name.includes('Grey')) {
        backgroundColor = '#ffffff'; // White background for grey logos
      }

      await prisma.content.update({
        where: { id: image.id },
        data: {
          metadata: updatedMetadata,
          backgroundColor: backgroundColor
        }
      });

      console.log(`Updated ${image.name}:`);
      console.log(`  - Background: ${backgroundColor}`);
      console.log(`  - Image size: ${updatedMetadata.imageSize}%`);
      console.log(`  - Image scale: ${updatedMetadata.imageScale}`);
    }

    // Update PDFs with proper metadata
    const pdfs = await prisma.content.findMany({
      where: {
        type: 'PDF',
        deletedAt: null
      }
    });

    console.log(`\nFound ${pdfs.length} PDFs to update`);

    for (const pdf of pdfs) {
      const updatedMetadata = {
        ...(pdf.metadata || {}),
        pdfSize: 100,
        pdfScale: 'contain'
      };

      await prisma.content.update({
        where: { id: pdf.id },
        data: {
          metadata: updatedMetadata,
          backgroundColor: '#000000' // Black background for PDFs
        }
      });

      console.log(`Updated ${pdf.name}`);
    }

    console.log('\n✅ Content metadata updated successfully!');
  } catch (error) {
    console.error('Error updating content metadata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateContentMetadata();
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkPDFThumbnails() {
  try {
    // Get all PDF content
    const pdfContent = await prisma.content.findMany({
      where: { type: 'PDF' },
      include: {
        thumbnails: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('\n=== PDF Content in Database ===');
    for (const content of pdfContent) {
      console.log(`\nPDF: ${content.name}`);
      console.log(`  ID: ${content.id}`);
      console.log(`  Created: ${content.createdAt}`);
      console.log(`  FilePath: ${content.filePath}`);
      console.log(`  Thumbnails: ${content.thumbnails.length}`);
      
      if (content.thumbnails.length > 0) {
        console.log('  Thumbnail details:');
        for (const thumb of content.thumbnails) {
          console.log(`    - ${thumb.size}: ${thumb.filePath}`);
        }
      }
    }

    // Check if there are any PDF thumbnails at all
    const pdfThumbnails = await prisma.fileThumbnail.findMany({
      where: {
        content: {
          type: 'PDF'
        }
      },
      include: {
        content: {
          select: { name: true, id: true }
        }
      }
    });

    console.log(`\n=== Total PDF Thumbnails in Database: ${pdfThumbnails.length} ===`);
    for (const thumb of pdfThumbnails) {
      console.log(`  ${thumb.content.name} (${thumb.size}): ${thumb.filePath}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPDFThumbnails();
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function updateBackgroundColor() {
  try {
    // Update the background color for testing
    const result = await prisma.content.update({
      where: {
        id: '4b965c3b-d48a-4c81-a7a0-1c3e9e2a7c8f' // Isomer Brand Signature - Grey
      },
      data: {
        backgroundColor: '#3498db' // Nice blue color
      }
    });
    
    console.log('Updated content:', result.name, 'with backgroundColor:', result.backgroundColor);
    
    // Also update another one
    const result2 = await prisma.content.update({
      where: {
        id: 'e8f3c2d1-9a7b-4e5f-8d6c-1b2a3f4e5d6c' // Isomer Brandmark - Orange
      },
      data: {
        backgroundColor: '#e74c3c' // Nice red color
      }
    });
    
    console.log('Updated content:', result2.name, 'with backgroundColor:', result2.backgroundColor);
    
  } catch (error) {
    console.error('Error updating background colors:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBackgroundColor();
import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function fixBackgroundColors() {
  try {
    // Update background colors to match the brand
    const updates = [
      { id: '6771e8c1-1dbd-4e20-a58e-1a29d351448c', name: 'Isomer Brand Signature - Grey', backgroundColor: '#252c3a' }, // Brand gray
      { id: 'fb163e2a-ec50-46df-aa06-e387e577a852', name: 'Isomer Brandmark - Orange', backgroundColor: '#f56600' }, // Brand orange  
      { id: '858d9e5c-0bc6-4101-a54e-a5638ebabeb6', name: 'Isomer Brand Signature - Orange', backgroundColor: '#f56600' }, // Brand orange
      { id: '0f700c0a-68b8-4631-9d56-ccebf5fb109f', name: 'Isomer Brand Signature - White', backgroundColor: '#08209a' }, // Brand blue for white logos
      { id: '83c9e1d6-1fed-40ca-9f10-b6d65f5382ad', name: 'Isomer Brandmark - White', backgroundColor: '#08209a' }, // Brand blue
      { id: 'b115a834-148c-4416-8ca1-0f2d59a79b52', name: 'Isomer Brandmark - Grey', backgroundColor: '#252c3a' }, // Brand gray
      { id: '946b5f97-65e7-42c4-9622-84cc88d4bdf3', name: "We're #BuiltDifferent!", backgroundColor: '#c5e0ea' }, // Brand light blue
      { id: 'e8985ab1-0f4d-4445-9719-aca427043550', name: 'Team Photo - 2024', backgroundColor: '#000000' } // Keep black for photo
    ];
    
    for (const update of updates) {
      const result = await prisma.content.update({
        where: { id: update.id },
        data: { backgroundColor: update.backgroundColor }
      });
      console.log(`✓ Updated ${result.name}: backgroundColor=${result.backgroundColor}`);
    }
    
    console.log('\n✅ All background colors updated successfully!');
    console.log('The displays should now show the correct brand colors behind each content item.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBackgroundColors();
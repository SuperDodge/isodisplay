#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';

async function checkContent() {
  try {
    const content = await prisma.content.findMany({
      include: {
        thumbnails: true,
      },
      take: 5,
    });
    
    console.log('Content in database:');
    content.forEach(item => {
      console.log(`\n${item.name}:`);
      console.log(`  Type: ${item.type}`);
      console.log(`  File Path: ${item.filePath || 'N/A'}`);
      console.log(`  Thumbnails: ${item.thumbnails.length}`);
      item.thumbnails.forEach(thumb => {
        console.log(`    - ${thumb.size}: ${thumb.filePath}`);
      });
    });
    
    const totalContent = await prisma.content.count();
    console.log(`\nTotal content items: ${totalContent}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContent();
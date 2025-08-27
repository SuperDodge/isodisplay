#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';

async function checkUploads() {
  const content = await prisma.content.findMany({
    where: { type: 'IMAGE' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      filePath: true,
      processingStatus: true,
      createdAt: true,
      thumbnails: true
    }
  });
  
  content.forEach(c => {
    console.log('\n' + c.name);
    console.log('  Path:', c.filePath);
    console.log('  Status:', c.processingStatus);
    console.log('  Thumbnails:', c.thumbnails.length);
  });
  
  await prisma.$disconnect();
}

checkUploads();
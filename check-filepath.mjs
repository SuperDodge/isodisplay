import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const content = await prisma.content.findFirst({
    select: {
      id: true,
      name: true,
      filePath: true,
    }
  });
  
  console.log('Content record:', content);
  
  if (content?.filePath) {
    console.log('Full filePath:', content.filePath);
    console.log('Split by /uploads/:', content.filePath.split('/uploads/'));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
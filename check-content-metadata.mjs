import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const content = await prisma.content.findFirst({
    where: {
      name: {
        contains: 'Isomer'
      }
    },
    select: {
      id: true,
      name: true,
      backgroundColor: true,
      metadata: true,
      cropSettings: true
    }
  });
  
  console.log('Content settings:', content);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
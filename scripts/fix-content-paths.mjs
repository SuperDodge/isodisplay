import { PrismaClient } from '../src/generated/prisma/index.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function fixContentPaths() {
  console.log('Fixing content file paths...');
  
  try {
    // Get all image content
    const contents = await prisma.content.findMany({
      where: {
        deletedAt: null,
        type: 'IMAGE'
      }
    });
    
    console.log(`Found ${contents.length} image content items`);
    
    const uploadsDir = path.join(__dirname, '..', 'uploads/2025/08/images/9117b6aa-e1be-4963-b0d8-85901401bd80');
    const files = await fs.readdir(uploadsDir);
    
    for (const content of contents) {
      console.log(`\nChecking: ${content.name}`);
      console.log(`  Current path: ${content.filePath}`);
      
      // Extract just the filename from the path
      const fileName = path.basename(content.filePath || '');
      
      // Check if this file exists
      const fullPath = path.join(uploadsDir, fileName);
      try {
        await fs.access(fullPath);
        console.log('  ✓ File exists');
      } catch (err) {
        console.log('  ✗ File not found, searching for similar...');
        
        // Try to find a file with similar name pattern
        let foundFile = null;
        
        // Search based on content name
        const searchTerms = content.name.toLowerCase()
          .replace('isomer brandmark', 'brandmark')
          .replace('isomer brand signature', 'signature')
          .replace('team photo', 'team')
          .replace(' - ', '-')
          .replace(' ', '-');
        
        for (const file of files) {
          const fileLower = file.toLowerCase();
          
          // Check if this is likely the right file based on name patterns
          if (
            (content.name.includes('Brandmark - Orange') && fileLower.includes('brandmark') && fileLower.includes('orange')) ||
            (content.name.includes('Brandmark - Grey') && fileLower.includes('brandmark') && fileLower.includes('grey')) ||
            (content.name.includes('Brandmark - White') && fileLower.includes('brandmark') && !fileLower.includes('orange') && !fileLower.includes('grey')) ||
            (content.name.includes('Signature - Orange') && fileLower.includes('signature') && fileLower.includes('orange')) ||
            (content.name.includes('Signature - Grey') && fileLower.includes('signature') && fileLower.includes('grey')) ||
            (content.name.includes('Signature - White') && fileLower.includes('signature') && !fileLower.includes('orange') && !fileLower.includes('grey')) ||
            (content.name.includes('Team Photo') && fileLower.includes('team'))
          ) {
            foundFile = file;
            break;
          }
        }
        
        if (foundFile) {
          console.log(`  Found matching file: ${foundFile}`);
          const newPath = `/uploads/2025/08/images/9117b6aa-e1be-4963-b0d8-85901401bd80/${foundFile}`;
          
          await prisma.content.update({
            where: { id: content.id },
            data: { filePath: newPath }
          });
          
          console.log(`  ✓ Updated path to: ${newPath}`);
        } else {
          console.log('  ⚠ No matching file found');
        }
      }
    }
    
    console.log('\nFile path fix complete!');
  } catch (error) {
    console.error('Error fixing file paths:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixContentPaths();
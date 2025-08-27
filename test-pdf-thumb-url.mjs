import fetch from 'node-fetch';
import fs from 'fs/promises';

// Get the thumbnail URL we tested earlier
const thumbnailUrl = 'http://localhost:3000/api/files/2025/08/documents/9117b6aa-e1be-4963-b0d8-85901401bd80/thumbnails/display-thumb.jpg';

async function testThumbnail() {
  try {
    console.log('Fetching thumbnail from:', thumbnailUrl);
    
    const response = await fetch(thumbnailUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch thumbnail:', response.status, response.statusText);
      return;
    }
    
    const buffer = await response.buffer();
    console.log('Thumbnail size:', buffer.length, 'bytes');
    
    // Save to a test file to verify it's an image
    const testPath = '/tmp/test-pdf-thumb.jpg';
    await fs.writeFile(testPath, buffer);
    console.log('Thumbnail saved to:', testPath);
    
    // Verify it's a valid JPEG
    const header = buffer.slice(0, 3);
    if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
      console.log('✅ Valid JPEG image');
    } else {
      console.log('❌ Not a valid JPEG');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testThumbnail();
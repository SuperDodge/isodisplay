import { generateDisplayThumbnail } from '../src/lib/upload/image-processor';
import path from 'path';

async function regenerateSingleThumbnail() {
  const filePath = 'uploads/2025/08/images/cc82ac07-2d1e-420e-873c-1c54ff184886/1756067278678-1756067278664-Isomer Project Group-signature-for grey bg.png';
  const outputPath = 'uploads/2025/08/images/cc82ac07-2d1e-420e-873c-1c54ff184886/thumbnails/display-thumb.jpg';
  
  console.log('Regenerating thumbnail with:');
  console.log('- Background: #252c3a');
  console.log('- Scale: contain');
  console.log('- Size: 80%');
  
  try {
    await generateDisplayThumbnail(
      filePath,
      outputPath,
      '#252c3a',
      'contain',
      80
    );
    console.log('✓ Thumbnail regenerated successfully');
  } catch (error) {
    console.error('✗ Failed to regenerate thumbnail:', error);
  }
}

regenerateSingleThumbnail().catch(console.error);
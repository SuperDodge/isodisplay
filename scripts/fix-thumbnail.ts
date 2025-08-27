import sharp from 'sharp';
import path from 'path';

async function generateDisplayThumbnail(
  inputPath: string,
  outputPath: string,
  backgroundColor: string = '#000000',
  imageScale: 'contain' | 'cover' | 'fill' = 'contain',
  imageSize: number = 100
): Promise<void> {
  try {
    // Parse the background color for sharp
    const bgColor = backgroundColor.startsWith('#') 
      ? backgroundColor 
      : '#000000';
    
    // Always create a 640x360 canvas with the background color
    const canvas = sharp({
      create: {
        width: 640,
        height: 360,
        channels: 3,
        background: bgColor
      }
    });
    
    // Get the input image metadata to calculate proper sizing
    const metadata = await sharp(inputPath).metadata();
    const inputWidth = metadata.width || 640;
    const inputHeight = metadata.height || 360;
    
    let resizedImage: Buffer;
    
    if (imageScale === 'cover') {
      // Cover: scale image to cover entire canvas, crop if necessary
      const scale = Math.max(640 / inputWidth, 360 / inputHeight);
      const scaledWidth = Math.round(inputWidth * scale);
      const scaledHeight = Math.round(inputHeight * scale);
      
      resizedImage = await sharp(inputPath)
        .resize(scaledWidth, scaledHeight, {
          fit: 'fill'
        })
        .toBuffer();
    } else if (imageScale === 'fill') {
      // Fill: stretch image to fill entire canvas
      resizedImage = await sharp(inputPath)
        .resize(640, 360, {
          fit: 'fill'
        })
        .toBuffer();
    } else {
      // Contain: fit image within canvas, apply size percentage
      const canvasAspect = 640 / 360;
      const imageAspect = inputWidth / inputHeight;
      
      let targetWidth, targetHeight;
      
      if (imageAspect > canvasAspect) {
        // Image is wider - fit to width
        targetWidth = Math.round(640 * (imageSize / 100));
        targetHeight = Math.round(targetWidth / imageAspect);
      } else {
        // Image is taller - fit to height
        targetHeight = Math.round(360 * (imageSize / 100));
        targetWidth = Math.round(targetHeight * imageAspect);
      }
      
      // Ensure we don't exceed the canvas size even at 100%
      if (targetWidth > 640) {
        targetWidth = 640;
        targetHeight = Math.round(targetWidth / imageAspect);
      }
      if (targetHeight > 360) {
        targetHeight = 360;
        targetWidth = Math.round(targetHeight * imageAspect);
      }
      
      resizedImage = await sharp(inputPath)
        .resize(targetWidth, targetHeight, {
          fit: 'fill',
          withoutEnlargement: true
        })
        .toBuffer();
    }
    
    // Composite the resized image onto the canvas
    await canvas
      .composite([{
        input: resizedImage,
        gravity: 'center'
      }])
      .jpeg({ quality: 85, progressive: true })
      .toFile(outputPath);
      
    console.log('✓ Thumbnail generated successfully');
  } catch (error) {
    console.error('Error generating display thumbnail:', error);
  }
}

async function main() {
  const filePath = 'uploads/2025/08/images/cc82ac07-2d1e-420e-873c-1c54ff184886/1756067278678-1756067278664-Isomer Project Group-signature-for grey bg.png';
  const outputPath = 'uploads/2025/08/images/cc82ac07-2d1e-420e-873c-1c54ff184886/thumbnails/display-thumb.jpg';
  
  console.log('Regenerating thumbnail with:');
  console.log('- Background: #252c3a');
  console.log('- Scale: contain');
  console.log('- Size: 80%');
  
  await generateDisplayThumbnail(
    filePath,
    outputPath,
    '#252c3a',
    'contain',
    80
  );
}

main().catch(console.error);
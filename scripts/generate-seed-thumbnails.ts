import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';

async function generatePlaceholderImage(
  outputPath: string,
  text: string,
  backgroundColor: string = '#252c3a',
  textColor: string = '#ffffff'
) {
  const width = 1920;
  const height = 1080;
  
  // Create SVG with text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
      <text 
        x="50%" 
        y="50%" 
        text-anchor="middle" 
        dominant-baseline="middle" 
        font-family="Arial, sans-serif" 
        font-size="72" 
        fill="${textColor}"
      >
        ${text}
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 90 })
    .toFile(outputPath);
  
  console.log(`Created placeholder: ${outputPath}`);
}

async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  size: { width: number; height: number }
) {
  await sharp(inputPath)
    .resize(size.width, size.height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    })
    .jpeg({ quality: 85 })
    .toFile(outputPath);
  
  console.log(`Created thumbnail: ${outputPath}`);
}

async function main() {
  // Ensure upload directories exist
  const uploadsDir = './uploads';
  await fs.mkdir(uploadsDir, { recursive: true });
  
  // Generate placeholder images for seed content
  const placeholders = [
    { name: 'logo.png', text: 'Company Logo' },
    { name: 'background.jpg', text: 'Background Image' },
    { name: 'promo.jpg', text: 'Special Promotion' },
    { name: 'video.mp4.jpg', text: 'Product Video' },
    { name: 'menu.pdf.jpg', text: 'Menu Display' },
  ];
  
  for (const placeholder of placeholders) {
    const imagePath = path.join(uploadsDir, placeholder.name);
    await generatePlaceholderImage(imagePath, placeholder.text);
    
    // Generate display thumbnail (16:9 with letterboxing)
    const thumbDir = path.join(uploadsDir, 'thumbnails');
    await fs.mkdir(thumbDir, { recursive: true });
    
    const thumbPath = path.join(thumbDir, `display-${placeholder.name}`);
    await generateThumbnail(imagePath, thumbPath, { width: 640, height: 360 });
  }
  
  console.log('Seed thumbnails generated successfully!');
}

main().catch(console.error);
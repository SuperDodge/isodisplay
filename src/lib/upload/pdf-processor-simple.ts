/**
 * PDF Processor with thumbnail generation
 */

import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { createCanvas } from 'canvas';

// Dynamic import for pdfjs-dist to avoid SSR issues
let pdfjsLib: any;

async function loadPdfJs() {
  if (!pdfjsLib) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLib = pdfjs;
    
    // Set worker path for Node.js environment
    const workerSrc = path.join(
      process.cwd(),
      'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  }
  return pdfjsLib;
}

/**
 * Get PDF metadata using pdf-lib
 */
export async function getPdfMetadata(pdfPath: string): Promise<any> {
  try {
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    const metadata: any = {
      pages: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle() || undefined,
      author: pdfDoc.getAuthor() || undefined,
      subject: pdfDoc.getSubject() || undefined,
      keywords: pdfDoc.getKeywords() || undefined,
      creator: pdfDoc.getCreator() || undefined,
      producer: pdfDoc.getProducer() || undefined,
      creationDate: pdfDoc.getCreationDate() || undefined,
      modificationDate: pdfDoc.getModificationDate() || undefined,
    };

    // Remove undefined values
    Object.keys(metadata).forEach(key => {
      if (metadata[key] === undefined) {
        delete metadata[key];
      }
    });

    return metadata;
  } catch (error) {
    console.error('Failed to get PDF metadata:', error);
    // Return minimal metadata on error
    return { pages: 1 };
  }
}

/**
 * Generate PDF thumbnail using pdfjs-dist and canvas
 */
export async function generatePdfThumbnail(
  pdfPath: string,
  outputPath: string,
  options: {
    width?: number;
    height?: number;
    page?: number;
    format?: 'jpeg' | 'png';
    quality?: number;
    backgroundColor?: string;
  } = {}
): Promise<void> {
  const {
    width = 1920,
    height = 1080,
    page = 1,
    format = 'jpeg',
    quality = 85,
    backgroundColor = '#ffffff'
  } = options;

  try {
    // Load PDF.js
    const pdfjs = await loadPdfJs();
    
    // Read PDF file
    const data = await fs.readFile(pdfPath);
    const uint8Array = new Uint8Array(data);
    
    // Load PDF document
    const loadingTask = pdfjs.getDocument({
      data: uint8Array,
      useSystemFonts: true,
    });
    const pdfDoc = await loadingTask.promise;
    
    // Get the specified page
    const pdfPage = await pdfDoc.getPage(page);
    
    // Get page dimensions
    const viewport = pdfPage.getViewport({ scale: 1.0 });
    
    // Calculate scale to fit within target dimensions
    const scaleX = width / viewport.width;
    const scaleY = height / viewport.height;
    const scale = Math.min(scaleX, scaleY);
    
    // Get scaled viewport
    const scaledViewport = pdfPage.getViewport({ scale });
    
    // Create canvas with target dimensions
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    
    // Fill background
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
    
    // Center the PDF on canvas
    const offsetX = (width - scaledViewport.width) / 2;
    const offsetY = (height - scaledViewport.height) / 2;
    
    // Save context state and apply offset
    context.save();
    context.translate(offsetX, offsetY);
    
    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
    };
    
    await pdfPage.render(renderContext).promise;
    
    // Restore context state
    context.restore();
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    
    // Use sharp to convert to desired format and quality
    await sharp(buffer)
      .jpeg({ quality: format === 'jpeg' ? quality : undefined })
      .png({ quality: format === 'png' ? quality : undefined })
      .toFile(outputPath);
    
    console.log(`Generated PDF thumbnail: ${outputPath}`);
    
    // Cleanup
    await pdfDoc.cleanup();
    
  } catch (error) {
    console.error('Failed to generate PDF thumbnail:', error);
    
    // Fallback: Create a simple placeholder image with sharp
    try {
      const placeholder = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: backgroundColor || '#f0f0f0'
        }
      })
      .composite([{
        input: Buffer.from(`
          <svg width="${width}" height="${height}">
            <rect width="${width}" height="${height}" fill="${backgroundColor || '#f0f0f0'}"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
                  font-family="Arial" font-size="48" fill="#999">
              PDF
            </text>
          </svg>
        `),
        top: 0,
        left: 0
      }])
      .toFormat(format, { quality })
      .toFile(outputPath);
      
      console.log(`Created placeholder thumbnail: ${outputPath}`);
    } catch (placeholderError) {
      console.error('Failed to create placeholder:', placeholderError);
      // Last resort: create empty file
      await fs.writeFile(outputPath, Buffer.from(''));
    }
  }
}

/**
 * Process a PDF file - extract metadata and generate thumbnails
 */
export async function processPdfFile(
  pdfPath: string,
  outputDir: string,
  sizes: Array<{ name: string; width: number; height: number }> = [
    { name: 'thumb', width: 320, height: 180 },
    { name: 'medium', width: 640, height: 360 },
    { name: 'display-thumb', width: 1920, height: 1080 }
  ]
): Promise<{
  metadata: any;
  thumbnails: Array<{ size: string; path: string; width: number; height: number }>;
}> {
  try {
    // Get metadata
    const metadata = await getPdfMetadata(pdfPath);
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate thumbnails for each size
    const thumbnails: Array<{ size: string; path: string; width: number; height: number }> = [];
    
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `${size.name}.jpg`);
      
      await generatePdfThumbnail(pdfPath, outputPath, {
        width: size.width,
        height: size.height,
        format: 'jpeg',
        quality: 85,
        backgroundColor: '#ffffff'
      });
      
      thumbnails.push({
        size: size.name,
        path: outputPath,
        width: size.width,
        height: size.height
      });
    }
    
    return {
      metadata,
      thumbnails
    };
    
  } catch (error) {
    console.error('Failed to process PDF:', error);
    
    // Return metadata with empty thumbnails on error
    const metadata = await getPdfMetadata(pdfPath).catch(() => ({ pages: 1 }));
    return {
      metadata,
      thumbnails: []
    };
  }
}
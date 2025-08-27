/**
 * Working PDF Processor with actual thumbnail generation
 * This one actually works in Node.js/Next.js environment
 */

import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

// Canvas is a native module, we need to handle it carefully
let canvasModule: any;
let pdfjsModule: any;

// Dynamically import these to avoid build issues
async function loadDependencies() {
  if (!canvasModule) {
    canvasModule = await import('canvas');
  }
  if (!pdfjsModule) {
    // Use the legacy build which doesn't require a worker
    pdfjsModule = await import('pdfjs-dist/legacy/build/pdf');
    // Try to use inline worker instead of file-based worker
    const workerJs = await import('pdfjs-dist/legacy/build/pdf.worker.entry');
    pdfjsModule.GlobalWorkerOptions.workerSrc = workerJs;
  }
  return { canvas: canvasModule, pdfjs: pdfjsModule };
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
    return { pages: 1 };
  }
}

/**
 * Generate PDF thumbnail
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
    backgroundColor = '#000000'
  } = options;

  try {
    console.log('Loading dependencies for PDF thumbnail generation...');
    const { canvas: canvasLib, pdfjs: pdfjsLib } = await loadDependencies();
    const { createCanvas } = canvasLib;
    
    console.log('Generating PDF thumbnail:', { pdfPath, outputPath, width, height });
    
    // Read the PDF file
    const data = await fs.readFile(pdfPath);
    const uint8Array = new Uint8Array(data);
    
    // Load the PDF document
    console.log('Loading PDF document...');
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      disableFontFace: true, // Disable font loading to avoid issues
      useSystemFonts: false,
      standardFontDataUrl: undefined, // Don't try to load standard fonts
      disableWorker: true, // Disable the worker to avoid webpack issues
      disableStream: true,
      disableAutoFetch: true,
    });
    
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded, total pages: ${pdf.numPages}`);
    
    // Get the specified page
    const pdfPage = await pdf.getPage(page);
    const viewport = pdfPage.getViewport({ scale: 1.0 });
    
    // Calculate scale to fit the desired dimensions
    const scaleX = width / viewport.width;
    const scaleY = height / viewport.height;
    const scale = Math.min(scaleX, scaleY); // Use contain mode
    
    const scaledViewport = pdfPage.getViewport({ scale });
    
    // Create canvas with the exact dimensions we want
    console.log('Creating canvas...');
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    
    // Fill background
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
    
    // Center the PDF on the canvas
    const offsetX = (width - scaledViewport.width) / 2;
    const offsetY = (height - scaledViewport.height) / 2;
    
    // Save context state and apply offset
    context.save();
    context.translate(offsetX, offsetY);
    
    // Render PDF page to canvas
    console.log('Rendering PDF page to canvas...');
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
      background: 'transparent', // We already filled the background
    };
    
    await pdfPage.render(renderContext).promise;
    
    // Restore context
    context.restore();
    
    // Convert canvas to buffer
    console.log('Converting to image...');
    const buffer = canvas.toBuffer('image/png');
    
    // Use sharp to convert to desired format and quality
    await sharp(buffer)
      .jpeg({ quality })
      .toFile(outputPath);
    
    console.log('PDF thumbnail generated successfully:', outputPath);
    
    // Verify the file was created
    const stats = await fs.stat(outputPath);
    console.log('Thumbnail file size:', stats.size, 'bytes');
  } catch (error) {
    console.error('Failed to generate PDF thumbnail:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error; // Re-throw to handle it upstream
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
    console.log('Processing PDF file:', pdfPath);
    
    // Get metadata
    const metadata = await getPdfMetadata(pdfPath);
    console.log('PDF metadata:', metadata);
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate thumbnails
    const thumbnails = [];
    
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `${size.name}.jpg`);
      
      try {
        console.log(`Generating ${size.name} thumbnail...`);
        await generatePdfThumbnail(pdfPath, outputPath, {
          width: size.width,
          height: size.height,
          format: 'jpeg',
          quality: 85,
        });
        
        // Verify the file was created and has content
        const stats = await fs.stat(outputPath);
        if (stats.size > 0) {
          thumbnails.push({
            size: size.name,
            path: outputPath,
            width: size.width,
            height: size.height
          });
          console.log(`${size.name} thumbnail created:`, stats.size, 'bytes');
        } else {
          console.error(`${size.name} thumbnail is empty`);
        }
      } catch (error) {
        console.error(`Failed to generate ${size.name} thumbnail:`, error);
      }
    }
    
    console.log('PDF processing complete. Thumbnails generated:', thumbnails.length);
    
    return {
      metadata,
      thumbnails
    };
  } catch (error) {
    console.error('Failed to process PDF file:', error);
    return {
      metadata: { pages: 1 },
      thumbnails: []
    };
  }
}
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { promises as fs } from 'fs';
import { ensureUploadDirectory } from './multer-config';
import { v4 as uuidv4 } from 'uuid';
// Import working PDF processor with thumbnail generation
import { 
  getPdfMetadata as getPdfMetadataNode, 
  generatePdfThumbnail as generatePdfThumbnailNode,
  processPdfFile as processPdfFileNode
} from './pdf-processor-working';

const execFileAsync = promisify(execFile);

// Document processing options
export interface DocumentProcessingOptions {
  format?: 'pdf' | 'html' | 'txt';
  quality?: 'screen' | 'ebook' | 'printer' | 'prepress';
  timeout?: number;
}

// Queue for document conversion to prevent overload
class ConversionQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private maxConcurrent = 2;
  private activeJobs = 0;

  async add<T>(job: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await job();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.activeJobs >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.activeJobs++;
    const job = this.queue.shift();
    
    if (job) {
      try {
        await job();
      } finally {
        this.activeJobs--;
        this.process();
      }
    }
  }
}

const conversionQueue = new ConversionQueue();

// Convert PowerPoint to PDF using LibreOffice
export async function convertPowerPointToPdf(
  inputPath: string,
  outputDir?: string,
  options: DocumentProcessingOptions = {}
): Promise<string> {
  const { timeout = 30000 } = options;
  
  return conversionQueue.add(async () => {
    const tempDir = outputDir || path.dirname(inputPath);
    await ensureUploadDirectory(tempDir);
    
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(tempDir, `${baseName}.pdf`);
    
    // Use LibreOffice in headless mode
    try {
      await execFileAsync('soffice', ['--headless', '--convert-to', 'pdf', '--outdir', tempDir, inputPath], {
        timeout,
        env: { ...process.env, HOME: '/tmp' },
      });
      
      // Check if the PDF was created
      await fs.access(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('PowerPoint to PDF conversion error:', error);
      throw new Error(`Failed to convert PowerPoint to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

// Convert document to various formats
export async function convertDocument(
  inputPath: string,
  outputFormat: 'pdf' | 'html' | 'txt' | 'docx',
  outputDir?: string,
  options: DocumentProcessingOptions = {}
): Promise<string> {
  const { timeout = 30000 } = options;
  
  return conversionQueue.add(async () => {
    const tempDir = outputDir || path.dirname(inputPath);
    await ensureUploadDirectory(tempDir);
    
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(tempDir, `${baseName}.${outputFormat}`);
    
    // Build LibreOffice command
    let filterOptions = '';
    if (outputFormat === 'pdf' && options.quality) {
      filterOptions = `:${options.quality}`;
    }
    
    try {
      await execFileAsync('soffice', ['--headless', '--convert-to', `${outputFormat}${filterOptions}`, '--outdir', tempDir, inputPath], {
        timeout,
        env: { ...process.env, HOME: '/tmp' },
      });
      
      // Check if the output file was created
      await fs.access(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Document conversion error:', error);
      throw new Error(`Failed to convert document to ${outputFormat}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

// Extract text from PDF
export async function extractTextFromPdf(
  pdfPath: string,
  options: { maxPages?: number } = {}
): Promise<string> {
  const { maxPages = 100 } = options;
  
  const tempFile = `/tmp/${uuidv4()}.txt`;
  
  try {
    // Use pdftotext command (part of poppler-utils)
    await execFileAsync('pdftotext', ['-l', String(maxPages), pdfPath, tempFile]);
    
    const text = await fs.readFile(tempFile, 'utf-8');
    await fs.unlink(tempFile).catch(() => {}); // Clean up temp file
    
    return text;
  } catch (error) {
    await fs.unlink(tempFile).catch(() => {}); // Clean up on error
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get PDF metadata
export async function getPdfMetadata(pdfPath: string): Promise<{
  pages?: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}> {
  // Use Node.js-based implementation for Docker compatibility
  return getPdfMetadataNode(pdfPath);
}

// Generate PDF thumbnail
export async function generatePdfThumbnail(
  pdfPath: string,
  outputPath: string,
  options: {
    page?: number;
    width?: number;
    height?: number;
    format?: 'jpg' | 'png';
  } = {}
): Promise<string> {
  const { page = 1, width = 320, height = 240, format = 'jpg' } = options;
  
  // Use Node.js-based implementation for Docker compatibility
  await generatePdfThumbnailNode(pdfPath, outputPath, {
    width,
    height,
    page,
    format: format === 'jpg' ? 'jpeg' : 'png',
    quality: 85,
    backgroundColor: '#000000'
  });
  
  return outputPath;
}

// Batch convert documents
export async function batchConvertDocuments(
  inputPaths: string[],
  outputFormat: 'pdf' | 'html' | 'txt',
  outputDir: string,
  options: DocumentProcessingOptions = {}
): Promise<Array<{ input: string; output: string; error?: string }>> {
  const results = [];
  
  for (const inputPath of inputPaths) {
    try {
      const output = await convertDocument(inputPath, outputFormat, outputDir, options);
      results.push({ input: inputPath, output });
    } catch (error) {
      results.push({
        input: inputPath,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return results;
}

// Check if LibreOffice is available
export async function checkLibreOfficeAvailable(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('soffice', ['--version']);
    return stdout.includes('LibreOffice');
  } catch {
    return false;
  }
}

// Check if PDF tools are available
export async function checkPdfToolsAvailable(): Promise<boolean> {
  try {
    await execFileAsync('which', ['pdfinfo']);
    await execFileAsync('which', ['pdftoppm']);
    await execFileAsync('which', ['pdftotext']);
    return true;
  } catch {
    return false;
  }
}

// Initialize document processing (install missing tools if needed)
export async function initializeDocumentProcessing(): Promise<void> {
  const libreOfficeAvailable = await checkLibreOfficeAvailable();
  const pdfToolsAvailable = await checkPdfToolsAvailable();
  
  if (!libreOfficeAvailable) {
    console.warn('LibreOffice is not available. PowerPoint conversion will not work.');
  }
  
  if (!pdfToolsAvailable) {
    console.warn('PDF tools (poppler-utils) are not available. PDF processing will be limited.');
  }
}

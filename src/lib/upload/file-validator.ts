import { NextRequest } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileTypeFromBuffer, fileTypeFromFile } from 'file-type';
import { ALLOWED_FILE_TYPES, FILE_SIZE_LIMITS } from './multer-config';

const execFileAsync = promisify(execFile);

// File validation result
export interface FileValidationResult {
  valid: boolean;
  mimeType?: string;
  actualType?: string;
  size?: number;
  hash?: string;
  virusScanResult?: 'clean' | 'infected' | 'error' | 'skipped';
  errors: string[];
  warnings: string[];
}

// Magic number signatures for common file types
const MAGIC_NUMBERS: Record<string, Buffer> = {
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]),
  'image/png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  'image/gif': Buffer.from([0x47, 0x49, 0x46]),
  'application/pdf': Buffer.from([0x25, 0x50, 0x44, 0x46]),
  'video/mp4': Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]),
};

// Validate file using magic numbers
export async function validateFileMagicNumber(
  filePath: string,
  expectedMimeType: string
): Promise<boolean> {
  try {
    const fileType = await fileTypeFromFile(filePath);
    
    if (!fileType) {
      return false;
    }
    
    // Check if the detected type matches expected
    if (fileType.mime === expectedMimeType) {
      return true;
    }
    
    // Special cases for similar types
    const acceptableTypes: Record<string, string[]> = {
      'image/jpeg': ['image/jpg'],
      'image/heic': ['image/heif'],
    };
    
    if (acceptableTypes[expectedMimeType]?.includes(fileType.mime)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Magic number validation error:', error);
    return false;
  }
}

// Calculate file hash for integrity checking
export async function calculateFileHash(
  filePath: string,
  algorithm: string = 'sha256'
): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  const hash = crypto.createHash(algorithm);
  hash.update(fileBuffer);
  return hash.digest('hex');
}

// Scan file for viruses using ClamAV
export async function scanFileForViruses(
  filePath: string,
  options: { timeout?: number; quarantinePath?: string } = {}
): Promise<{ clean: boolean; virus?: string }> {
  const { timeout = 30000, quarantinePath = '/tmp/quarantine' } = options;
  
  try {
    // Check if ClamAV is available
    await execFileAsync('which', ['clamscan']);
    
    // Run virus scan
    const { stdout } = await execFileAsync('clamscan', ['--no-summary', filePath], { timeout });
    
    // Parse scan results
    if (stdout.includes('OK')) {
      return { clean: true };
    } else if (stdout.includes('FOUND')) {
      // Extract virus name
      const virusMatch = stdout.match(/: (.+) FOUND/);
      const virusName = virusMatch ? virusMatch[1] : 'Unknown virus';
      
      // Move to quarantine if path provided
      if (quarantinePath) {
        await fs.mkdir(quarantinePath, { recursive: true });
        const quarantineFile = path.join(
          quarantinePath,
          `${Date.now()}-${path.basename(filePath)}`
        );
        await fs.rename(filePath, quarantineFile);
      }
      
      return { clean: false, virus: virusName };
    }
    
    return { clean: true };
  } catch (error) {
    // ClamAV not available or scan failed
    console.warn('Virus scanning not available:', error);
    return { clean: true }; // Assume clean if scanner not available
  }
}

// Validate file name for security issues
export function validateFileName(fileName: string): {
  valid: boolean;
  sanitized: string;
  issues: string[];
} {
  const issues: string[] = [];
  let sanitized = fileName;
  
  // Check for path traversal attempts
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    issues.push('File name contains path traversal characters');
    sanitized = sanitized.replace(/\.\./g, '').replace(/[\/\\]/g, '_');
  }
  
  // Check for null bytes
  if (fileName.includes('\0')) {
    issues.push('File name contains null bytes');
    sanitized = sanitized.replace(/\0/g, '');
  }
  
  // Check for control characters
  if (/[\x00-\x1f\x7f]/.test(fileName)) {
    issues.push('File name contains control characters');
    sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, '');
  }
  
  // Limit file name length
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    issues.push(`File name exceeds ${maxLength} characters`);
    const ext = path.extname(sanitized);
    const nameWithoutExt = path.basename(sanitized, ext);
    sanitized = nameWithoutExt.substring(0, maxLength - ext.length) + ext;
  }
  
  // Remove or replace problematic characters
  const problematicChars = /[<>:"|?*]/g;
  if (problematicChars.test(sanitized)) {
    issues.push('File name contains problematic characters');
    sanitized = sanitized.replace(problematicChars, '_');
  }
  
  return {
    valid: issues.length === 0,
    sanitized,
    issues,
  };
}

// Comprehensive file validation
export async function validateFile(
  filePath: string,
  options: {
    expectedMimeType?: string;
    maxSize?: number;
    scanForViruses?: boolean;
    validateMagicNumber?: boolean;
    calculateHash?: boolean;
  } = {}
): Promise<FileValidationResult> {
  const result: FileValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };
  
  try {
    // Get file stats
    const stats = await fs.stat(filePath);
    result.size = stats.size;
    
    // Check file size
    const maxSize = options.maxSize || FILE_SIZE_LIMITS.video;
    if (stats.size > maxSize) {
      result.valid = false;
      result.errors.push(`File size (${stats.size} bytes) exceeds maximum allowed (${maxSize} bytes)`);
    }
    
    // Validate magic number if requested
    if (options.validateMagicNumber && options.expectedMimeType) {
      const isValidMagic = await validateFileMagicNumber(filePath, options.expectedMimeType);
      if (!isValidMagic) {
        result.valid = false;
        result.errors.push('File type does not match expected MIME type');
      }
      
      const fileType = await fileTypeFromFile(filePath);
      if (fileType) {
        result.actualType = fileType.mime;
      }
    }
    
    // Calculate hash if requested
    if (options.calculateHash) {
      result.hash = await calculateFileHash(filePath);
    }
    
    // Scan for viruses if requested
    if (options.scanForViruses) {
      const scanResult = await scanFileForViruses(filePath);
      if (!scanResult.clean) {
        result.valid = false;
        result.errors.push(`Virus detected: ${scanResult.virus}`);
        result.virusScanResult = 'infected';
      } else {
        result.virusScanResult = 'clean';
      }
    } else {
      result.virusScanResult = 'skipped';
    }
    
    // Check file name
    const fileName = path.basename(filePath);
    const nameValidation = validateFileName(fileName);
    if (!nameValidation.valid) {
      result.warnings.push(...nameValidation.issues);
    }
    
  } catch (error) {
    result.valid = false;
    result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (result.virusScanResult === undefined) {
      result.virusScanResult = 'error';
    }
  }
  
  return result;
}

// Middleware for validating uploaded files
export async function fileValidationMiddleware(
  req: NextRequest,
  file: Express.Multer.File
): Promise<FileValidationResult> {
  // Validate based on file type
  const mimeType = file.mimetype;
  const category = mimeType.startsWith('image/') ? 'image' :
                  mimeType.startsWith('video/') ? 'video' : 'document';
  
  const maxSize = FILE_SIZE_LIMITS[category as keyof typeof FILE_SIZE_LIMITS];
  
  return validateFile(file.path, {
    expectedMimeType: mimeType,
    maxSize,
    scanForViruses: true,
    validateMagicNumber: true,
    calculateHash: true,
  });
}

// Batch validate files
export async function batchValidateFiles(
  filePaths: string[],
  options: Parameters<typeof validateFile>[1] = {}
): Promise<FileValidationResult[]> {
  return Promise.all(
    filePaths.map(filePath => validateFile(filePath, options))
  );
}

// Check if ClamAV is available
export async function checkClamAvAvailable(): Promise<boolean> {
  try {
    await execFileAsync('clamscan', ['--version']);
    return true;
  } catch {
    return false;
  }
}

// Initialize virus scanner
export async function initializeVirusScanner(): Promise<void> {
  const clamAvAvailable = await checkClamAvAvailable();
  if (!clamAvAvailable) {
    console.warn('ClamAV is not available. Virus scanning will be skipped.');
    return;
  }
  // Attempt to update virus database, but ignore failures
  try {
    await execFileAsync('freshclam', []);
    console.log('ClamAV virus database updated');
  } catch {
    console.warn('Failed to update ClamAV database');
  }
}

// Clean up quarantined files older than specified days
export async function cleanupQuarantine(
  quarantinePath: string = '/tmp/quarantine',
  daysOld: number = 30
): Promise<number> {
  try {
    const files = await fs.readdir(quarantinePath);
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(quarantinePath, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Quarantine cleanup error:', error);
    return 0;
  }
}

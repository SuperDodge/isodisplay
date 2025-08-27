import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import { env } from '@/lib/env';

// Allowed file types and their MIME types
export const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  
  // Videos
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/ogg': ['.ogv'],
  
  // Documents
  'application/pdf': ['.pdf'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
};

// File size limits by type (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 50 * 1024 * 1024, // 50MB
  video: 500 * 1024 * 1024, // 500MB
  document: 100 * 1024 * 1024, // 100MB
};

// Get file type category
function getFileCategory(mimetype: string): 'image' | 'video' | 'document' | 'unknown' {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'application/pdf' || 
      mimetype.includes('powerpoint') || 
      mimetype.includes('presentation')) return 'document';
  return 'unknown';
}

// Generate unique filename
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const ext = path.extname(sanitizedName);
  const nameWithoutExt = path.basename(sanitizedName, ext);
  
  return `${timestamp}-${randomString}-${nameWithoutExt}${ext}`;
}

// Create upload directory structure
export async function ensureUploadDirectory(subPath: string): Promise<string> {
  // Use absolute path to avoid issues with Next.js working directories
  const basePath = path.isAbsolute(env.FILE_STORAGE_PATH) 
    ? env.FILE_STORAGE_PATH 
    : '/Users/sronnie/Documents/Coding/IsoDisplay/uploads';
  const uploadPath = path.join(basePath, subPath);
  await fs.mkdir(uploadPath, { recursive: true });
  return uploadPath;
}

// Disk storage configuration
const diskStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const category = getFileCategory(file.mimetype);
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      // Create directory structure: /uploads/{year}/{month}/{category}/
      const uploadPath = await ensureUploadDirectory(
        path.join(year.toString(), month, category)
      );
      
      cb(null, uploadPath);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const fileName = generateFileName(file.originalname);
    cb(null, fileName);
  },
});

// Memory storage configuration (for processing before saving)
const memoryStorage = multer.memoryStorage();

// File filter
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  // Check if MIME type is allowed
  if (ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// Create multer instance for disk storage
export const uploadToDisk = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE || FILE_SIZE_LIMITS.video, // Use max limit as default
  },
});

// Create multer instance for memory storage (for processing)
export const uploadToMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE || FILE_SIZE_LIMITS.video,
  },
});

// Middleware for checking file size based on type
export function validateFileSize(req: any, file: Express.Multer.File, cb: any) {
  const category = getFileCategory(file.mimetype);
  const limit = FILE_SIZE_LIMITS[category as keyof typeof FILE_SIZE_LIMITS];
  
  if (limit && file.size > limit) {
    cb(new Error(`File size exceeds limit for ${category} files (max: ${limit / 1024 / 1024}MB)`));
  } else {
    cb(null, true);
  }
}

// Custom multer configuration with size validation
export const uploadWithValidation = multer({
  storage: diskStorage,
  fileFilter: (req, file, cb) => {
    // First check file type
    fileFilter(req, file, (err, result) => {
      if (err) return cb(err);
      if (!result) return cb(null, false);
      
      // Then validate size
      validateFileSize(req, file, cb);
    });
  },
});

// Export configuration for different upload scenarios
export const uploadConfigs = {
  // Single file upload
  single: (fieldName: string = 'file') => uploadWithValidation.single(fieldName),
  
  // Multiple files upload
  multiple: (fieldName: string = 'files', maxCount: number = 10) => 
    uploadWithValidation.array(fieldName, maxCount),
  
  // Multiple fields upload
  fields: (fields: multer.Field[]) => uploadWithValidation.fields(fields),
  
  // Memory upload for processing
  memory: {
    single: (fieldName: string = 'file') => uploadToMemory.single(fieldName),
    multiple: (fieldName: string = 'files', maxCount: number = 10) => 
      uploadToMemory.array(fieldName, maxCount),
  },
};

// Helper to get file extension from MIME type
export function getExtensionFromMimeType(mimeType: string): string {
  const extensions = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES];
  return extensions ? extensions[0] : '';
}

// Helper to validate file buffer (for memory uploads)
export async function validateFileBuffer(
  buffer: Buffer,
  expectedMimeType: string
): Promise<boolean> {
  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const fileType = await fileTypeFromBuffer(buffer);
    
    if (!fileType) return false;
    
    // Check if detected MIME matches expected
    return fileType.mime === expectedMimeType;
  } catch (error) {
    console.error('Error validating file buffer:', error);
    return false;
  }
}
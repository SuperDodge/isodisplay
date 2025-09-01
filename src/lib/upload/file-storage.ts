import { promises as fs } from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { prisma } from '@/lib/prisma';
import { Content, FileThumbnail, FileVersion, ProcessingStatus, ContentType } from '@/generated/prisma';
import { calculateFileHash } from './file-validator';
import { processImage, THUMBNAIL_SIZES, generateDisplayThumbnail } from './image-processor';
import { generateVideoThumbnails, getVideoMetadata } from './video-processor';
import { convertPowerPointToPdf, getPdfMetadata, generatePdfThumbnail } from './document-processor';
import { processPdfFile as processPdfFileNode } from './pdf-processor-working';
import { env } from '@/lib/env';

// File storage metadata
export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  pages?: number;
  format?: string;
  codec?: string;
  bitrate?: number;
  [key: string]: any;
}

// Storage service class
export class FileStorageService {
  private basePath: string;

  constructor(basePath?: string) {
    // Use local uploads directory for development
    // For Next.js, we need to handle both local dev and production environments
    if (basePath) {
      this.basePath = basePath;
    } else if (process.env.FILE_STORAGE_PATH) {
      // If absolute path provided, use it directly
      if (path.isAbsolute(process.env.FILE_STORAGE_PATH)) {
        this.basePath = process.env.FILE_STORAGE_PATH;
      } else {
        // For relative paths, resolve from the actual project root
        // In Next.js, the app runs from different working directories
        this.basePath = path.join(process.cwd() === '/app' ? '/Users/sronnie/Documents/Coding/IsoDisplay' : process.cwd(), process.env.FILE_STORAGE_PATH);
      }
    } else {
      // Default to uploads directory in project root
      // Handle the /app working directory issue in development
      const projectRoot = process.cwd() === '/app' ? '/Users/sronnie/Documents/Coding/IsoDisplay' : process.cwd();
      this.basePath = path.join(projectRoot, 'uploads');
    }
    console.log('FileStorageService initialized with basePath:', this.basePath);
  }

  // Get storage path for a file
  private getStoragePath(
    category: string,
    userId: string,
    fileName: string
  ): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return path.join(
      this.basePath,
      year.toString(),
      month,
      category,
      userId,
      fileName
    );
  }

  // Store uploaded file and create database record
  async storeFile(
    file: Express.Multer.File,
    userId: string,
    options: {
      title?: string;
      description?: string;
      backgroundColor?: string;
      imageScale?: string;
      imageSize?: number;
      pdfScale?: string;
      pdfSize?: number;
    } = {}
  ): Promise<Content> {
    try {
      console.log('FileStorage - userId received:', userId);
      // Calculate file hash for deduplication
      const fileHash = await calculateFileHash(file.path);
      
      // Check if file already exists
      const existingContent = await prisma.content.findFirst({
        where: {
          fileHash,
          deletedAt: null,
        },
      });
      
      if (existingContent) {
        // File already exists, return existing content
        await fs.unlink(file.path); // Remove duplicate file
        return existingContent;
      }
      
      // Determine content type
      const contentType = this.getContentType(file.mimetype);
      
      // Get file category for storage
      const category = this.getFileCategory(file.mimetype);
      
      // Generate final storage path
      const fileName = `${Date.now()}-${file.filename}`;
      const storagePath = this.getStoragePath(category, userId, fileName);
      console.log('Storage path generated:', storagePath);
      console.log('Directory to create:', path.dirname(storagePath));
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(storagePath), { recursive: true });
      
      // Move file to final location
      await fs.rename(file.path, storagePath);
      
      // Create content record
      const content = await prisma.content.create({
        data: {
          name: options.title || file.originalname,
          fileName: file.originalname,
          type: contentType,
          filePath: storagePath,
          fileSize: BigInt(file.size),
          mimeType: file.mimetype,
          originalName: file.originalname,
          fileHash,
          backgroundColor: options.backgroundColor,
          duration: options.duration, // Store default duration for images and PDFs
          metadata: (options.imageScale || options.imageSize || options.pdfScale || options.pdfSize) ? { 
            imageScale: options.imageScale,
            imageSize: options.imageSize,
            pdfScale: options.pdfScale,
            pdfSize: options.pdfSize
          } : undefined,
          processingStatus: ProcessingStatus.PENDING,
          storageLocation: 'local',
          uploadedBy: userId,
          createdBy: userId,
        },
      });
      
      // Queue file for processing
      this.processFileAsync(content.id, storagePath, file.mimetype).catch(
        (error) => {
          console.error(`Failed to process file ${content.id}:`, error);
          this.updateProcessingStatus(
            content.id,
            ProcessingStatus.FAILED,
            error.message
          );
        }
      );
      
      return content;
    } catch (error) {
      // Clean up file on error
      await fs.unlink(file.path).catch(() => {});
      throw error;
    }
  }

  // Process file asynchronously
  private async processFileAsync(
    contentId: string,
    filePath: string,
    mimeType: string
  ): Promise<void> {
    console.log('Processing file async:', { contentId, filePath, mimeType });
    // Update status to processing
    await this.updateProcessingStatus(contentId, ProcessingStatus.PROCESSING);
    
    // Get existing metadata to preserve imageScale and imageSize
    const existingContent = await prisma.content.findUnique({ 
      where: { id: contentId },
      select: { metadata: true }
    });
    const existingMetadata = (existingContent?.metadata as any) || {};
    
    const metadata: FileMetadata = { ...existingMetadata };
    const thumbnailsCreated: FileThumbnail[] = [];
    
    try {
      if (mimeType.startsWith('image/')) {
        // Process image
        // Ensure we're using absolute paths
        const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.join('/Users/sronnie/Documents/Coding/IsoDisplay', filePath);
        // Create unique thumbnail directory for this image using content ID
        const outputDir = path.join(path.dirname(absoluteFilePath), 'thumbnails', contentId);
        console.log('Thumbnail output directory:', outputDir);
        
        // Ensure thumbnails directory exists
        await fs.mkdir(outputDir, { recursive: true });
        
        const result = await processImage(absoluteFilePath, outputDir);
        
        metadata.width = result.metadata.width;
        metadata.height = result.metadata.height;
        metadata.format = result.metadata.format;
        
        // Generate display-accurate thumbnail (16:9 with letterboxing/pillarboxing)
        const displayThumbPath = path.join(outputDir, 'display-thumb.jpg');
        const content = await prisma.content.findUnique({ where: { id: contentId } });
        await generateDisplayThumbnail(
          absoluteFilePath, 
          displayThumbPath,
          content?.backgroundColor || '#000000',
          metadata.imageScale || 'contain',
          metadata.imageSize || 100
        );
        
        // Save thumbnails to database
        for (const [size, thumbPath] of Object.entries(result.thumbnails)) {
          const stats = await fs.stat(thumbPath);
          const dimensions = THUMBNAIL_SIZES[size as keyof typeof THUMBNAIL_SIZES];
          
          const thumbnail = await prisma.fileThumbnail.create({
            data: {
              contentId,
              size,
              width: dimensions.width,
              height: dimensions.height,
              filePath: thumbPath,
              fileSize: BigInt(stats.size),
              format: 'webp',
            },
          });
          thumbnailsCreated.push(thumbnail);
        }
        
        // Save display thumbnail
        const displayThumbStats = await fs.stat(displayThumbPath);
        await prisma.fileThumbnail.create({
          data: {
            contentId,
            size: 'display',
            width: 640,
            height: 360,
            filePath: displayThumbPath,
            fileSize: BigInt(displayThumbStats.size),
            format: 'jpg',
          },
        });
      } else if (mimeType.startsWith('video/')) {
        // Process video
        console.log('Processing video file:', filePath);
        const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.join('/Users/sronnie/Documents/Coding/IsoDisplay', filePath);
        const videoMetadata = await getVideoMetadata(absoluteFilePath);
        console.log('Video metadata:', videoMetadata);
        metadata.width = videoMetadata.width;
        metadata.height = videoMetadata.height;
        metadata.duration = videoMetadata.duration;
        metadata.codec = videoMetadata.codec;
        metadata.bitrate = videoMetadata.bitrate;
        
        // Generate video thumbnails with unique directory for this video
        const outputDir = path.join(path.dirname(absoluteFilePath), 'thumbnails', contentId);
        console.log('Creating thumbnail directory:', outputDir);
        await fs.mkdir(outputDir, { recursive: true });
        const thumbnails = await generateVideoThumbnails(absoluteFilePath, outputDir, {
          thumbnailCount: 3,
          thumbnailSize: '320x240',
        });
        
        // Save first thumbnail as the main thumbnail
        if (thumbnails.length > 0) {
          const stats = await fs.stat(thumbnails[0]);
          await prisma.fileThumbnail.create({
            data: {
              contentId,
              size: 'medium',
              width: 320,
              height: 240,
              filePath: thumbnails[0],
              fileSize: BigInt(stats.size),
              format: 'jpg',
            },
          });
          
          // Generate display-accurate thumbnail for video
          // For videos, we need to create a proper 16:9 thumbnail that shows how it will appear on screen
          const displayThumbPath = path.join(outputDir, 'display-thumb.jpg');
          const content = await prisma.content.findUnique({ where: { id: contentId } });
          
          // Create a 640x360 (16:9) thumbnail from the video directly
          // This will properly show letterboxing/pillarboxing as it appears on the display
          await new Promise<void>((resolve, reject) => {
            ffmpeg(absoluteFilePath)
              .seekInput(videoMetadata.duration ? videoMetadata.duration * 0.3 : 2) // Get frame at 30% of video
              .outputOptions([
                '-vframes', '1',
                '-vf', 'scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2:black',
                '-q:v', '2'
              ])
              .output(displayThumbPath)
              .on('end', resolve)
              .on('error', reject)
              .run();
          });
          
          // Save display thumbnail
          const displayThumbStats = await fs.stat(displayThumbPath);
          await prisma.fileThumbnail.create({
            data: {
              contentId,
              size: 'display',
              width: 640,
              height: 360,
              filePath: displayThumbPath,
              fileSize: BigInt(displayThumbStats.size),
              format: 'jpg',
            },
          });
        }
      } else if (mimeType === 'application/pdf') {
        // Process PDF using the working processor
        console.log('Processing PDF with working processor...');
        // Create unique thumbnail directory for this PDF using content ID
        const outputDir = path.join(path.dirname(filePath), 'thumbnails', contentId);
        const result = await processPdfFileNode(filePath, outputDir);
        
        console.log('PDF processing result:', {
          metadata: result.metadata,
          thumbnailCount: result.thumbnails.length,
          thumbnails: result.thumbnails
        });
        
        // Add metadata
        metadata.pages = result.metadata.pages;
        metadata.title = result.metadata.title;
        metadata.author = result.metadata.author;
        
        // Save thumbnails to database
        console.log('Saving PDF thumbnails to database:', result.thumbnails.length);
        for (const thumb of result.thumbnails) {
          console.log('Saving thumbnail:', thumb);
          try {
            const stats = await fs.stat(thumb.path);
            const thumbnailData = {
              contentId,
              size: thumb.size === 'display-thumb' ? 'display' : thumb.size,
              width: thumb.width,
              height: thumb.height,
              filePath: thumb.path,
              fileSize: BigInt(stats.size),
              format: 'jpg',
            };
            console.log('Creating thumbnail in DB with data:', thumbnailData);
            const created = await prisma.fileThumbnail.create({
              data: thumbnailData,
            });
            console.log('Thumbnail created in DB:', created);
            thumbnailsCreated.push({ 
              id: created.id, 
              contentId, 
              size: thumb.size, 
              width: thumb.width, 
              height: thumb.height, 
              filePath: thumb.path, 
              fileSize: BigInt(stats.size), 
              format: 'jpg', 
              createdAt: new Date() 
            } as FileThumbnail);
          } catch (thumbnailError) {
            console.error('Failed to save thumbnail to database:', thumbnailError);
          }
        }
        console.log('PDF thumbnails saved to database');
      } else if (
        mimeType.includes('powerpoint') ||
        mimeType.includes('presentation')
      ) {
        // Convert PowerPoint to PDF
        const pdfPath = await convertPowerPointToPdf(filePath);
        const pdfMetadata = await getPdfMetadata(pdfPath);
        metadata.pages = pdfMetadata.pages;
        
        // Generate thumbnail from converted PDF
        const outputDir = path.join(path.dirname(filePath), 'thumbnails');
        await fs.mkdir(outputDir, { recursive: true });
        const thumbPath = path.join(outputDir, 'thumb.jpg');
        
        await generatePdfThumbnail(pdfPath, thumbPath);
        const stats = await fs.stat(thumbPath);
        
        await prisma.fileThumbnail.create({
          data: {
            contentId,
            size: 'medium',
            width: 320,
            height: 240,
            filePath: thumbPath,
            fileSize: BigInt(stats.size),
            format: 'jpg',
          },
        });
        
        // Update file path to PDF
        await prisma.content.update({
          where: { id: contentId },
          data: { filePath: pdfPath },
        });
      }
      
      // Update content with metadata and duration
      // For videos, use the actual duration from metadata
      // For images and PDFs, keep the user-specified duration
      const existingContent = await prisma.content.findUnique({ 
        where: { id: contentId },
        select: { duration: true, type: true }
      });
      
      await prisma.content.update({
        where: { id: contentId },
        data: {
          metadata: metadata as any,
          // Only update duration for videos, keep existing for images/PDFs
          duration: mimeType.startsWith('video/') 
            ? (metadata.duration ? Math.round(metadata.duration) : null)
            : existingContent?.duration,
          processingStatus: ProcessingStatus.COMPLETED,
        },
      });
    } catch (error) {
      // Clean up any created thumbnails on error
      for (const thumbnail of thumbnailsCreated) {
        await fs.unlink(thumbnail.filePath).catch(() => {});
        await prisma.fileThumbnail.delete({
          where: { id: thumbnail.id },
        }).catch(() => {});
      }
      
      throw error;
    }
  }

  // Update processing status
  private async updateProcessingStatus(
    contentId: string,
    status: ProcessingStatus,
    error?: string
  ): Promise<void> {
    await prisma.content.update({
      where: { id: contentId },
      data: {
        processingStatus: status,
        processingError: error,
      },
    });
  }

  // Get content type from MIME type
  private getContentType(mimeType: string): ContentType {
    if (mimeType.startsWith('image/')) return ContentType.IMAGE;
    if (mimeType.startsWith('video/')) return ContentType.VIDEO;
    if (mimeType === 'application/pdf') return ContentType.PDF;
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation'))
      return ContentType.PDF; // PowerPoint converts to PDF
    return ContentType.IMAGE; // Default
  }

  // Get file category
  private getFileCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    return 'documents';
  }

  // Create file version
  async createFileVersion(
    contentId: string,
    file: Express.Multer.File,
    userId: string,
    changes?: string
  ): Promise<FileVersion> {
    // Get current content
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    
    if (!content) {
      throw new Error('Content not found');
    }
    
    // Determine next version number
    const nextVersion = content.versions[0] ? content.versions[0].version + 1 : 1;
    
    // Calculate file hash
    const fileHash = await calculateFileHash(file.path);
    
    // Create version record
    const version = await prisma.fileVersion.create({
      data: {
        contentId,
        version: nextVersion,
        filePath: file.path,
        fileSize: BigInt(file.size),
        fileHash,
        changes,
        uploadedById: userId,
      },
    });
    
    // Update main content with new file
    await prisma.content.update({
      where: { id: contentId },
      data: {
        filePath: file.path,
        fileSize: BigInt(file.size),
        fileHash,
        processingStatus: ProcessingStatus.PENDING,
      },
    });
    
    // Reprocess the file
    this.processFileAsync(contentId, file.path, file.mimetype).catch((error) => {
      console.error(`Failed to process file version ${version.id}:`, error);
      this.updateProcessingStatus(
        contentId,
        ProcessingStatus.FAILED,
        error.message
      );
    });
    
    return version;
  }

  // Delete content and associated files
  async deleteContent(contentId: string, hardDelete: boolean = false): Promise<void> {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { thumbnails: true, versions: true },
    });
    
    if (!content) {
      throw new Error('Content not found');
    }
    
    if (hardDelete) {
      // Delete physical files
      if (content.filePath) {
        await fs.unlink(content.filePath).catch(() => {});
      }
      
      // Delete thumbnails
      for (const thumbnail of content.thumbnails) {
        await fs.unlink(thumbnail.filePath).catch(() => {});
      }
      
      // Delete version files
      for (const version of content.versions) {
        await fs.unlink(version.filePath).catch(() => {});
      }
      
      // Delete from database
      await prisma.content.delete({ where: { id: contentId } });
    } else {
      // Soft delete
      await prisma.content.update({
        where: { id: contentId },
        data: { deletedAt: new Date() },
      });
    }
  }

  // Clean up orphaned files
  async cleanupOrphanedFiles(): Promise<number> {
    // Find all content marked as deleted more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const deletedContent = await prisma.content.findMany({
      where: {
        deletedAt: { lt: thirtyDaysAgo },
      },
      include: { thumbnails: true, versions: true },
    });
    
    let deletedCount = 0;
    
    for (const content of deletedContent) {
      try {
        await this.deleteContent(content.id, true);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to cleanup content ${content.id}:`, error);
      }
    }
    
    return deletedCount;
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    totalSize: bigint;
    fileCount: number;
    byType: Record<string, { count: number; size: bigint }>;
  }> {
    const contents = await prisma.content.findMany({
      where: { deletedAt: null },
      select: { type: true, fileSize: true },
    });
    
    const stats = {
      totalSize: BigInt(0),
      fileCount: contents.length,
      byType: {} as Record<string, { count: number; size: bigint }>,
    };
    
    for (const content of contents) {
      if (content.fileSize) {
        stats.totalSize += content.fileSize;
        
        if (!stats.byType[content.type]) {
          stats.byType[content.type] = { count: 0, size: BigInt(0) };
        }
        
        stats.byType[content.type].count++;
        stats.byType[content.type].size += content.fileSize;
      }
    }
    
    return stats;
  }
}

// Export factory function to create instances with proper path
export function getFileStorageService(): FileStorageService {
  // Use absolute path to avoid issues with Next.js working directories
  const absolutePath = '/Users/sronnie/Documents/Coding/IsoDisplay/uploads';
  return new FileStorageService(absolutePath);
}

// Export singleton for backward compatibility
export const fileStorage = getFileStorageService();
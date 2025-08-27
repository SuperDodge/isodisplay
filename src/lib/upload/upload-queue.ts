import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { ProcessingStatus } from '@/generated/prisma';

// Upload status
export enum UploadStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Upload job interface
export interface UploadJob {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  userId: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  retryCount: number;
  maxRetries: number;
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: number;
  tempPath?: string;
  finalPath?: string;
  contentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chunked upload manager
export class ChunkedUploadManager {
  private uploads: Map<string, UploadJob> = new Map();
  private chunkDir: string = '/tmp/uploads/chunks';
  private maxChunkSize: number = 5 * 1024 * 1024; // 5MB chunks
  private maxRetries: number = 3;

  constructor() {
    this.ensureChunkDirectory();
  }

  private async ensureChunkDirectory() {
    await fs.mkdir(this.chunkDir, { recursive: true });
  }

  // Initialize new upload
  async initializeUpload(
    fileName: string,
    fileSize: number,
    mimeType: string,
    userId: string
  ): Promise<UploadJob> {
    const uploadId = uuidv4();
    const totalChunks = Math.ceil(fileSize / this.maxChunkSize);
    
    const job: UploadJob = {
      id: uploadId,
      fileName,
      fileSize,
      mimeType,
      userId,
      status: UploadStatus.PENDING,
      progress: 0,
      retryCount: 0,
      maxRetries: this.maxRetries,
      chunkSize: this.maxChunkSize,
      totalChunks,
      uploadedChunks: 0,
      tempPath: path.join(this.chunkDir, uploadId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create temp directory for chunks
    await fs.mkdir(job.tempPath!, { recursive: true });
    
    this.uploads.set(uploadId, job);
    
    // Save to database for persistence
    await this.saveJobToDatabase(job);
    
    return job;
  }

  // Upload chunk
  async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunkData: Buffer
  ): Promise<{ success: boolean; progress: number; error?: string }> {
    const job = this.uploads.get(uploadId);
    
    if (!job) {
      return { success: false, progress: 0, error: 'Upload job not found' };
    }

    try {
      // Update status
      job.status = UploadStatus.UPLOADING;
      job.updatedAt = new Date();

      // Save chunk to temp directory
      const chunkPath = path.join(job.tempPath!, `chunk_${chunkIndex}`);
      await fs.writeFile(chunkPath, chunkData);
      
      // Update progress
      job.uploadedChunks++;
      job.progress = (job.uploadedChunks / job.totalChunks) * 100;
      
      // Check if all chunks uploaded
      if (job.uploadedChunks === job.totalChunks) {
        await this.assembleChunks(uploadId);
      }
      
      // Update in database
      await this.updateJobInDatabase(job);
      
      return { success: true, progress: job.progress };
    } catch (error) {
      console.error(`Error uploading chunk ${chunkIndex} for ${uploadId}:`, error);
      
      job.retryCount++;
      job.error = error instanceof Error ? error.message : 'Unknown error';
      
      if (job.retryCount >= job.maxRetries) {
        job.status = UploadStatus.FAILED;
      }
      
      await this.updateJobInDatabase(job);
      
      return {
        success: false,
        progress: job.progress,
        error: job.error,
      };
    }
  }

  // Assemble chunks into final file
  private async assembleChunks(uploadId: string): Promise<void> {
    const job = this.uploads.get(uploadId);
    
    if (!job) {
      throw new Error('Upload job not found');
    }

    try {
      job.status = UploadStatus.PROCESSING;
      
      // Create final file path
      const uploadDir = `/tmp/uploads/complete`;
      await fs.mkdir(uploadDir, { recursive: true });
      job.finalPath = path.join(uploadDir, `${uploadId}_${job.fileName}`);
      
      // Create write stream for final file
      const chunks: Buffer[] = [];
      
      // Read and combine all chunks
      for (let i = 0; i < job.totalChunks; i++) {
        const chunkPath = path.join(job.tempPath!, `chunk_${i}`);
        const chunkData = await fs.readFile(chunkPath);
        chunks.push(chunkData);
      }
      
      // Write combined file
      await fs.writeFile(job.finalPath, Buffer.concat(chunks));
      
      // Clean up chunks
      await this.cleanupChunks(uploadId);
      
      // Mark as completed
      job.status = UploadStatus.COMPLETED;
      job.progress = 100;
      
      await this.updateJobInDatabase(job);
    } catch (error) {
      console.error(`Error assembling chunks for ${uploadId}:`, error);
      job.status = UploadStatus.FAILED;
      job.error = error instanceof Error ? error.message : 'Unknown error';
      await this.updateJobInDatabase(job);
      throw error;
    }
  }

  // Clean up chunk files
  private async cleanupChunks(uploadId: string): Promise<void> {
    const job = this.uploads.get(uploadId);
    
    if (!job || !job.tempPath) return;
    
    try {
      await fs.rm(job.tempPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Error cleaning up chunks for ${uploadId}:`, error);
    }
  }

  // Resume interrupted upload
  async resumeUpload(uploadId: string): Promise<UploadJob | null> {
    // Try to load from database
    const savedJob = await this.loadJobFromDatabase(uploadId);
    
    if (!savedJob) {
      return null;
    }
    
    // Check which chunks are already uploaded
    const uploadedChunks = await this.getUploadedChunks(uploadId);
    savedJob.uploadedChunks = uploadedChunks.length;
    savedJob.progress = (savedJob.uploadedChunks / savedJob.totalChunks) * 100;
    
    // Reset retry count for resume
    savedJob.retryCount = 0;
    savedJob.status = UploadStatus.PENDING;
    
    this.uploads.set(uploadId, savedJob);
    
    return savedJob;
  }

  // Get list of uploaded chunks
  private async getUploadedChunks(uploadId: string): Promise<number[]> {
    const job = this.uploads.get(uploadId) || await this.loadJobFromDatabase(uploadId);
    
    if (!job || !job.tempPath) {
      return [];
    }
    
    try {
      const files = await fs.readdir(job.tempPath);
      const chunks = files
        .filter(f => f.startsWith('chunk_'))
        .map(f => parseInt(f.replace('chunk_', '')))
        .sort((a, b) => a - b);
      
      return chunks;
    } catch (error) {
      return [];
    }
  }

  // Cancel upload
  async cancelUpload(uploadId: string): Promise<void> {
    const job = this.uploads.get(uploadId);
    
    if (!job) return;
    
    job.status = UploadStatus.CANCELLED;
    job.updatedAt = new Date();
    
    // Clean up files
    await this.cleanupChunks(uploadId);
    
    if (job.finalPath) {
      try {
        await fs.unlink(job.finalPath);
      } catch (error) {
        console.error(`Error deleting final file for ${uploadId}:`, error);
      }
    }
    
    // Update database
    await this.updateJobInDatabase(job);
    
    // Remove from memory
    this.uploads.delete(uploadId);
  }

  // Get upload status
  getUploadStatus(uploadId: string): UploadJob | undefined {
    return this.uploads.get(uploadId);
  }

  // Get all uploads for user
  getUserUploads(userId: string): UploadJob[] {
    return Array.from(this.uploads.values()).filter(job => job.userId === userId);
  }

  // Save job to database for persistence
  private async saveJobToDatabase(job: UploadJob): Promise<void> {
    // In a real implementation, this would save to a database table
    // For now, we'll save to a JSON file
    const jobsFile = path.join(this.chunkDir, 'jobs.json');
    
    try {
      let jobs: Record<string, UploadJob> = {};
      
      try {
        const data = await fs.readFile(jobsFile, 'utf-8');
        jobs = JSON.parse(data);
      } catch (error) {
        // File doesn't exist yet
      }
      
      jobs[job.id] = job;
      
      await fs.writeFile(jobsFile, JSON.stringify(jobs, null, 2));
    } catch (error) {
      console.error('Error saving job to database:', error);
    }
  }

  // Update job in database
  private async updateJobInDatabase(job: UploadJob): Promise<void> {
    await this.saveJobToDatabase(job);
  }

  // Load job from database
  private async loadJobFromDatabase(uploadId: string): Promise<UploadJob | null> {
    const jobsFile = path.join(this.chunkDir, 'jobs.json');
    
    try {
      const data = await fs.readFile(jobsFile, 'utf-8');
      const jobs = JSON.parse(data);
      
      const job = jobs[uploadId];
      if (job) {
        // Convert date strings back to Date objects
        job.createdAt = new Date(job.createdAt);
        job.updatedAt = new Date(job.updatedAt);
        return job;
      }
    } catch (error) {
      console.error('Error loading job from database:', error);
    }
    
    return null;
  }

  // Clean up old uploads
  async cleanupOldUploads(maxAgeHours: number = 24): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);
    
    let cleanedCount = 0;
    
    for (const [uploadId, job] of this.uploads.entries()) {
      if (job.updatedAt < cutoffTime && 
          (job.status === UploadStatus.FAILED || 
           job.status === UploadStatus.CANCELLED ||
           job.status === UploadStatus.COMPLETED)) {
        
        await this.cleanupChunks(uploadId);
        
        if (job.finalPath && job.status !== UploadStatus.COMPLETED) {
          try {
            await fs.unlink(job.finalPath);
          } catch (error) {
            console.error(`Error deleting file for ${uploadId}:`, error);
          }
        }
        
        this.uploads.delete(uploadId);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  // Retry failed upload
  async retryUpload(uploadId: string): Promise<boolean> {
    const job = this.uploads.get(uploadId);
    
    if (!job || job.status !== UploadStatus.FAILED) {
      return false;
    }
    
    if (job.retryCount >= job.maxRetries) {
      return false;
    }
    
    // Reset status and increment retry count
    job.status = UploadStatus.PENDING;
    job.retryCount++;
    job.error = undefined;
    job.updatedAt = new Date();
    
    await this.updateJobInDatabase(job);
    
    return true;
  }
}

// Export singleton instance
export const uploadQueue = new ChunkedUploadManager();
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { promises as fs } from 'fs';
// Removed ensureUploadDirectory import - using fs.mkdir directly

// Video processing options
export interface VideoProcessingOptions {
  thumbnailCount?: number;
  thumbnailSize?: string;
  format?: 'jpg' | 'png';
  quality?: number;
}

// Video metadata interface
export interface VideoMetadata {
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  codec?: string;
  bitrate?: number;
  size?: number;
}

// Set FFmpeg path if needed (for Docker)
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

// Extract video metadata
export function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === 'video'
      );

      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      const parseFps = (s?: string): number => {
        if (!s) return 0;
        if (s.includes('/')) {
          const [n, d] = s.split('/').map((v) => Number(v));
          if (!isFinite(n) || !isFinite(d) || d === 0) return 0;
          return n / d;
        }
        const n = Number(s);
        return isFinite(n) ? n : 0;
      };

      resolve({
        duration: metadata.format.duration,
        width: videoStream.width,
        height: videoStream.height,
        fps: parseFps(videoStream.r_frame_rate),
        codec: videoStream.codec_name,
        bitrate: metadata.format.bit_rate ? parseInt(metadata.format.bit_rate) : undefined,
        size: metadata.format.size ? parseInt(metadata.format.size) : undefined,
      });
    });
  });
}

// Generate video thumbnail at specific timestamp
export function generateVideoThumbnail(
  videoPath: string,
  outputPath: string,
  timestamp: number | string = '10%',
  size: string = '320x240'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(videoPath);

    // If timestamp is a percentage, calculate actual time
    if (typeof timestamp === 'string' && timestamp.endsWith('%')) {
      command.on('codecData', (data) => {
        const duration = parseInt(data.duration.replace(/:/g, ''));
        const percentage = parseInt(timestamp.replace('%', ''));
        const actualTime = Math.floor((duration * percentage) / 100);
        
        command
          .seekInput(actualTime)
          .outputOptions([
            '-vframes', '1',
            '-an',
            '-s', size,
            '-ss', String(actualTime),
          ]);
      });
    } else {
      command
        .seekInput(timestamp as number)
        .outputOptions([
          '-vframes', '1',
          '-an',
          '-s', size,
          '-ss', String(timestamp),
        ]);
    }

    command
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

// Generate multiple thumbnails from video
export async function generateVideoThumbnails(
  videoPath: string,
  outputDir: string,
  options: VideoProcessingOptions = {}
): Promise<string[]> {
  const {
    thumbnailCount = 4,
    thumbnailSize = '320x240',
    format = 'jpg',
    quality = 2,
  } = options;

  // Ensure the output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  const metadata = await getVideoMetadata(videoPath);
  const duration = metadata.duration || 0;
  const baseName = path.basename(videoPath, path.extname(videoPath));
  const thumbnails: string[] = [];

  // For the first thumbnail (main thumbnail), pick a random frame between 20% and 80% of the video
  // This avoids blank frames at the beginning or credits at the end
  const randomPosition = 0.2 + (Math.random() * 0.6); // Random value between 0.2 and 0.8
  const mainThumbnailTimestamp = duration * randomPosition;
  
  // Generate main thumbnail at random position
  const mainOutputPath = path.join(
    outputDir,
    `${baseName}-thumb-1.${format}`
  );
  
  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(mainThumbnailTimestamp)
      .outputOptions([
        '-vframes', '1',
        '-an',
        '-s', thumbnailSize,
        '-q:v', String(quality),
      ])
      .output(mainOutputPath)
      .on('end', () => {
        thumbnails.push(mainOutputPath);
        resolve();
      })
      .on('error', reject)
      .run();
  });

  // Generate additional thumbnails at equal intervals (if requested)
  for (let i = 1; i < thumbnailCount; i++) {
    const timestamp = (duration * (i + 1)) / (thumbnailCount + 1);
    const outputPath = path.join(
      outputDir,
      `${baseName}-thumb-${i + 1}.${format}`
    );

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(timestamp)
        .outputOptions([
          '-vframes', '1',
          '-an',
          '-s', thumbnailSize,
          '-q:v', String(quality),
        ])
        .output(outputPath)
        .on('end', () => {
          thumbnails.push(outputPath);
          resolve();
        })
        .on('error', reject)
        .run();
    });
  }

  return thumbnails;
}

// Create animated GIF from video
export function createGifFromVideo(
  videoPath: string,
  outputPath: string,
  options: {
    startTime?: number;
    duration?: number;
    width?: number;
    fps?: number;
  } = {}
): Promise<string> {
  const { startTime = 0, duration = 3, width = 320, fps = 10 } = options;

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(startTime)
      .duration(duration)
      .outputOptions([
        '-vf',
        `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
        '-loop',
        '0',
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

// Extract frame at specific timestamp
export function extractVideoFrame(
  videoPath: string,
  outputPath: string,
  timestamp: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(timestamp)
      .outputOptions(['-vframes', '1', '-an'])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

// Create video preview sprite (multiple frames in one image)
export async function createVideoSprite(
  videoPath: string,
  outputPath: string,
  options: {
    columns?: number;
    rows?: number;
    width?: number;
    height?: number;
    interval?: number;
  } = {}
): Promise<string> {
  const {
    columns = 5,
    rows = 5,
    width = 160,
    height = 90,
    interval = 1,
  } = options;

  const totalFrames = columns * rows;
  const tempDir = path.join(path.dirname(outputPath), 'temp_frames');
  await fs.mkdir(tempDir, { recursive: true });

  try {
    // Extract frames
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          '-vf',
          `fps=1/${interval},scale=${width}:${height},tile=${columns}x${rows}`,
        ])
        .frames(totalFrames)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Clean up temp directory
    await fs.rmdir(tempDir, { recursive: true });

    return outputPath;
  } catch (error) {
    // Clean up on error
    await fs.rmdir(tempDir, { recursive: true }).catch(() => {});
    throw error;
  }
}

// Validate video codec and format
export async function validateVideoFormat(
  videoPath: string,
  allowedCodecs: string[] = ['h264', 'hevc', 'vp8', 'vp9']
): Promise<{ valid: boolean; message?: string }> {
  try {
    const metadata = await getVideoMetadata(videoPath);
    
    if (!metadata.codec) {
      return { valid: false, message: 'Could not determine video codec' };
    }

    if (!allowedCodecs.includes(metadata.codec)) {
      return {
        valid: false,
        message: `Video codec ${metadata.codec} is not supported. Allowed codecs: ${allowedCodecs.join(', ')}`,
      };
    }

    // Check resolution
    if (metadata.width && metadata.height) {
      if (metadata.width > 3840 || metadata.height > 2160) {
        return {
          valid: false,
          message: `Video resolution (${metadata.width}x${metadata.height}) exceeds 4K limit`,
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : 'Video validation failed',
    };
  }
}

// Optimize video for web streaming
export function optimizeVideoForWeb(
  inputPath: string,
  outputPath: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    videoBitrate?: string;
    audioBitrate?: string;
    preset?: string;
  } = {}
): Promise<string> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    videoBitrate = '2M',
    audioBitrate = '128k',
    preset = 'medium',
  } = options;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', preset,
        '-crf', '23',
        '-c:a', 'aac',
        '-b:v', videoBitrate,
        '-b:a', audioBitrate,
        '-movflags', '+faststart',
        '-vf', `scale='min(${maxWidth},iw)':min'(${maxHeight},ih)':force_original_aspect_ratio=decrease`,
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .on('progress', (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      })
      .run();
  });
}

// Get video duration in seconds
export async function getVideoDuration(videoPath: string): Promise<number> {
  const metadata = await getVideoMetadata(videoPath);
  return metadata.duration || 0;
}

// Check if file is a valid video
export function isValidVideo(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        resolve(false);
        return;
      }

      const hasVideoStream = metadata.streams.some(
        (stream) => stream.codec_type === 'video'
      );
      resolve(hasVideoStream);
    });
  });
}

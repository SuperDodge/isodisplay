import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { ContentType } from '@/generated/prisma';
import { z } from 'zod';
import { fetchYouTubeVideoInfoWithAPI } from '@/lib/youtube-api';
import { generateDisplayThumbnailFromUrl } from '@/lib/upload/image-processor';
import path from 'path';
import { promises as fs } from 'fs';

// Validation schema for YouTube content
const YouTubeContentSchema = z.object({
  url: z.string().min(1, 'YouTube URL is required'),
  videoId: z.string().min(1, 'Video ID is required'),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().nullable().optional(),
  duration: z.number().int().nonnegative().optional(),
  thumbnailUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !await hasPermission('CONTENT_CREATE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user exists in the database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    if (!dbUser) {
      // If user doesn't exist, try to find by email
      const userByEmail = await prisma.user.findUnique({
        where: { email: user.email }
      });
      
      if (!userByEmail) {
        return NextResponse.json({ error: 'User account not found. Please log out and log in again.' }, { status: 401 });
      }
      
      // Use the correct user ID from the database
      user.id = userByEmail.id;
    }

    const body = await request.json();
    
    // Validate request body
    const validation = YouTubeContentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { url, videoId, name, description, duration, thumbnailUrl } = validation.data;

    // Check if this YouTube video already exists
    const existing = await prisma.content.findFirst({
      where: {
        type: ContentType.YOUTUBE,
        metadata: {
          path: ['videoId'],
          equals: videoId,
        },
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This YouTube video has already been added' },
        { status: 409 }
      );
    }

    // Fetch actual video metadata from YouTube
    console.log('Fetching YouTube video info for ID:', videoId);
    const videoInfo = await fetchYouTubeVideoInfoWithAPI(videoId);
    console.log('YouTube API response:', videoInfo);
    
    // Use fetched data or fallback to provided data
    let actualDuration = duration;
    let actualName = name;
    let actualDescription = description;
    let finalThumbnailUrl = thumbnailUrl || `https://img.youtube.com/vi/${videoId}/2.jpg`;
    
    if (videoInfo) {
      // If user didn't specify a custom duration (or set it to 0 for full play)
      // use the actual video duration for display purposes
      if (duration === 0 || duration === undefined || duration === null) {
        actualDuration = videoInfo.duration; // Store actual duration
      }
      
      // Use fetched title if no custom name provided
      console.log('Checking name:', name, 'vs YouTube title:', videoInfo.title);
      if (!name || name === `YouTube - ${videoId}` || name === 'YouTube Video') {
        actualName = videoInfo.title;
        console.log('Using YouTube title:', actualName);
      }
      
      // Use fetched description if none provided
      if (!description && videoInfo.description) {
        actualDescription = videoInfo.description.substring(0, 500); // Limit description length
      }
      
      // Use fetched thumbnail
      if (videoInfo.thumbnailUrl) {
        finalThumbnailUrl = videoInfo.thumbnailUrl;
      }
    }
    
    // Create the YouTube content entry
    const content = await prisma.content.create({
      data: {
        name: actualName,
        description: actualDescription,
        type: ContentType.YOUTUBE,
        filePath: url, // Store the YouTube URL as the file path
        metadata: {
          videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          thumbnailUrl: finalThumbnailUrl,
          source: 'youtube',
          // Store the actual video duration for reference
          actualVideoDuration: videoInfo?.duration || 0,
          // If user set a custom duration, store it separately
          customDuration: duration !== undefined && duration !== null && duration !== 0 ? duration : null,
          // Flag to indicate if we should play the full video
          playFullVideo: !duration || duration === 0,
        },
        // Store the actual duration for playlist calculations
        // If user set a custom duration (not 0), use that, otherwise use actual video duration
        duration: (duration && duration > 0) ? duration : (videoInfo?.duration || null),
        mimeType: 'video/youtube',
        uploadedBy: user.id,
        createdBy: user.id,
        processingStatus: 'COMPLETED', // YouTube videos don't need processing
      },
    });

    // Generate a proper display thumbnail with correct letterboxing/pillarboxing
    // Create a directory for YouTube thumbnails
    const projectRoot = process.cwd() === '/app' ? '/Users/sronnie/Documents/Coding/IsoDisplay' : process.cwd();
    const youtubeThumbnailDir = path.join(projectRoot, 'uploads', 'youtube-thumbnails');
    await fs.mkdir(youtubeThumbnailDir, { recursive: true });
    
    // Generate display thumbnail filename
    const displayThumbFilename = `${videoId}-display-${Date.now()}.jpg`;
    const displayThumbPath = path.join(youtubeThumbnailDir, displayThumbFilename);
    
    // Generate the properly formatted display thumbnail
    try {
      await generateDisplayThumbnailFromUrl(
        finalThumbnailUrl,
        displayThumbPath,
        '#000000'
      );
      console.log('Generated display thumbnail for YouTube video:', displayThumbPath);
    } catch (thumbError) {
      console.error('Failed to generate display thumbnail, using original URL:', thumbError);
    }
    
    // Create multiple thumbnail entries for different sizes
    const thumbnailSizes = [
      { size: 'display', url: displayThumbPath, width: 640, height: 360, isLocal: true },
      { size: 'medium', url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, width: 320, height: 180, isLocal: false },
      { size: 'small', url: `https://img.youtube.com/vi/${videoId}/default.jpg`, width: 120, height: 90, isLocal: false },
    ];

    for (const thumb of thumbnailSizes) {
      let fileSize = BigInt(0);
      
      // If it's a local file, get the actual file size
      if (thumb.isLocal) {
        try {
          const stats = await fs.stat(thumb.url);
          fileSize = BigInt(stats.size);
        } catch (e) {
          console.error('Failed to get file size for local thumbnail:', e);
        }
      }
      
      await prisma.fileThumbnail.create({
        data: {
          contentId: content.id,
          size: thumb.size,
          width: thumb.width,
          height: thumb.height,
          filePath: thumb.url,
          fileSize: fileSize,
          format: 'jpg',
        },
      });
    }

    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    console.error('Error adding YouTube content:', error);
    return NextResponse.json(
      { error: 'Failed to add YouTube video' },
      { status: 500 }
    );
  }
}
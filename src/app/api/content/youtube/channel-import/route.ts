import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { ContentType } from '@/generated/prisma';
import { fetchYouTubeVideoInfoWithAPI } from '@/lib/youtube-api';
import { generateDisplayThumbnailFromUrl } from '@/lib/upload/image-processor';
import path from 'path';
import { promises as fs } from 'fs';

// IsoMerc channel details
const CHANNEL_ID = 'UCvjfQYM3sfSwfAn0cu4wBMA'; // @isomerpg channel ID (verified 2025)
const CHANNEL_HANDLE = '@isomerpg';

// Helper to fetch channel videos using YouTube API
async function fetchChannelVideos() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.error('YouTube API key not configured');
    return [];
  }

  try {
    // Fetch channel's uploaded videos playlist
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${apiKey}`
    );
    
    if (!channelResponse.ok) {
      console.error('Failed to fetch channel info');
      return [];
    }

    const channelData = await channelResponse.json();
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    
    if (!uploadsPlaylistId) {
      console.error('No uploads playlist found');
      return [];
    }

    // Fetch videos from uploads playlist (max 50 most recent)
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`
    );

    if (!videosResponse.ok) {
      console.error('Failed to fetch videos');
      return [];
    }

    const videosData = await videosResponse.json();
    return videosData.items || [];
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    return [];
  }
}

// GET - Check for new videos to import
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !await hasPermission('CONTENT_CREATE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all existing YouTube videos from database
    const existingVideos = await prisma.content.findMany({
      where: {
        type: ContentType.YOUTUBE,
        deletedAt: null,
      },
      select: {
        metadata: true,
      },
    });

    // Extract video IDs from existing content
    const existingVideoIds = new Set(
      existingVideos
        .map(content => (content.metadata as any)?.videoId)
        .filter(Boolean)
    );

    // Fetch channel videos
    const channelVideos = await fetchChannelVideos();
    
    // Filter out already imported videos
    const newVideos = channelVideos
      .filter(item => {
        const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
        return videoId && !existingVideoIds.has(videoId);
      })
      .map(item => ({
        videoId: item.contentDetails?.videoId || item.snippet?.resourceId?.videoId,
        title: item.snippet?.title || 'Untitled Video',
        description: item.snippet?.description || '',
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || 
                      item.snippet?.thumbnails?.medium?.url ||
                      item.snippet?.thumbnails?.default?.url,
        publishedAt: item.snippet?.publishedAt,
      }));

    return NextResponse.json({
      videos: newVideos,
      existingCount: existingVideoIds.size,
      totalChannelVideos: channelVideos.length,
    });
  } catch (error) {
    console.error('Error checking channel videos:', error);
    return NextResponse.json(
      { error: 'Failed to check channel videos' },
      { status: 500 }
    );
  }
}

// POST - Import batch of videos
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
      const userByEmail = await prisma.user.findUnique({
        where: { email: user.email }
      });
      
      if (!userByEmail) {
        return NextResponse.json({ error: 'User account not found' }, { status: 401 });
      }
      
      user.id = userByEmail.id;
    }

    const body = await request.json();
    const { videos } = body;

    if (!Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json({ error: 'No videos to import' }, { status: 400 });
    }

    const imported = [];
    const failed = [];

    for (const video of videos) {
      try {
        // Check if already exists
        const existing = await prisma.content.findFirst({
          where: {
            type: ContentType.YOUTUBE,
            metadata: {
              path: ['videoId'],
              equals: video.videoId,
            },
            deletedAt: null,
          },
        });

        if (existing) {
          continue; // Skip if already exists
        }

        // Fetch full video info
        const videoInfo = await fetchYouTubeVideoInfoWithAPI(video.videoId);
        
        // Create content entry with actual video duration
        const actualDuration = videoInfo?.duration || 0;
        const content = await prisma.content.create({
          data: {
            name: videoInfo?.title || video.title,
            description: videoInfo?.description?.substring(0, 500) || video.description?.substring(0, 500),
            type: ContentType.YOUTUBE,
            filePath: `https://www.youtube.com/watch?v=${video.videoId}`,
            metadata: {
              videoId: video.videoId,
              embedUrl: `https://www.youtube.com/embed/${video.videoId}`,
              thumbnailUrl: videoInfo?.thumbnailUrl || video.thumbnailUrl,
              source: 'youtube',
              actualVideoDuration: actualDuration,
              duration: actualDuration, // Store actual duration in metadata too
              playFullVideo: true,
              importedFromChannel: true,
              channelHandle: CHANNEL_HANDLE,
            },
            duration: actualDuration, // Store actual video duration
            mimeType: 'video/youtube',
            uploadedBy: user.id,
            createdBy: user.id,
            processingStatus: 'COMPLETED',
          },
        });

        // Generate a proper display thumbnail with correct letterboxing/pillarboxing
        const youtubeThumbnailUrl = videoInfo?.thumbnailUrl || video.thumbnailUrl || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
        const projectRoot = process.cwd() === '/app' ? '/Users/sronnie/Documents/Coding/IsoDisplay' : process.cwd();
        const youtubeThumbnailDir = path.join(projectRoot, 'uploads', 'youtube-thumbnails');
        await fs.mkdir(youtubeThumbnailDir, { recursive: true });
        
        const displayThumbFilename = `${video.videoId}-display-${Date.now()}.jpg`;
        const displayThumbPath = path.join(youtubeThumbnailDir, displayThumbFilename);
        
        let finalDisplayThumbPath = displayThumbPath;
        try {
          await generateDisplayThumbnailFromUrl(
            youtubeThumbnailUrl,
            displayThumbPath,
            '#000000'
          );
          console.log('Generated display thumbnail for YouTube video:', displayThumbPath);
        } catch (thumbError) {
          console.error('Failed to generate display thumbnail, using original URL:', thumbError);
          finalDisplayThumbPath = youtubeThumbnailUrl;
        }
        
        // Create thumbnails
        const thumbnailSizes = [
          { size: 'display', url: finalDisplayThumbPath, width: 640, height: 360, isLocal: finalDisplayThumbPath === displayThumbPath },
          { size: 'medium', url: `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`, width: 320, height: 180, isLocal: false },
          { size: 'small', url: `https://img.youtube.com/vi/${video.videoId}/default.jpg`, width: 120, height: 90, isLocal: false },
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

        imported.push({ id: content.id, name: content.name });
      } catch (error) {
        console.error(`Failed to import video ${video.videoId}:`, error);
        failed.push({ videoId: video.videoId, title: video.title, error: error.message });
      }
    }

    return NextResponse.json({
      imported: imported.length,
      failed: failed.length,
      details: {
        imported,
        failed
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error importing channel videos:', error);
    return NextResponse.json(
      { error: 'Failed to import videos' },
      { status: 500 }
    );
  }
}
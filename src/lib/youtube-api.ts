/**
 * YouTube API Service
 * Fetches video metadata from YouTube
 */

interface YouTubeVideoInfo {
  title: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  description?: string;
}

/**
 * Parse ISO 8601 duration to seconds
 * YouTube returns duration in ISO 8601 format (e.g., "PT4M13S" = 4 minutes 13 seconds)
 */
function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch video information from YouTube using oEmbed API
 * This doesn't require an API key and provides basic info
 */
export async function fetchYouTubeVideoInfo(videoId: string): Promise<YouTubeVideoInfo | null> {
  try {
    // First try to get basic info via oEmbed (no API key required)
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    console.log('Fetching YouTube oEmbed data from:', oEmbedUrl);
    const oEmbedResponse = await fetch(oEmbedUrl);
    
    if (!oEmbedResponse.ok) {
      console.error('Failed to fetch YouTube oEmbed data:', oEmbedResponse.status, oEmbedResponse.statusText);
      return null;
    }
    
    const oEmbedData = await oEmbedResponse.json();
    
    // Try to fetch additional metadata using noembed service which provides duration
    try {
      const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
      console.log('Fetching noembed data from:', noembedUrl);
      const noembedResponse = await fetch(noembedUrl);
      
      if (noembedResponse.ok) {
        const noembedData = await noembedResponse.json();
        console.log('Noembed data received:', noembedData);
        
        return {
          title: noembedData.title || oEmbedData.title || 'Untitled',
          duration: noembedData.duration || 0, // noembed provides duration in seconds
          thumbnailUrl: noembedData.thumbnail_url || oEmbedData.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          description: noembedData.description
        };
      } else {
        console.error('Failed to fetch noembed data:', noembedResponse.status);
      }
    } catch (error) {
      console.warn('Failed to fetch noembed data, using oEmbed only:', error);
    }
    
    // Fallback to oEmbed data only (no duration available)
    return {
      title: oEmbedData.title || 'Untitled',
      duration: 0, // Duration not available from oEmbed
      thumbnailUrl: oEmbedData.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      description: undefined
    };
    
  } catch (error) {
    console.error('Error fetching YouTube video info:', error);
    return null;
  }
}

/**
 * Fetch video information using YouTube Data API v3
 * Requires YOUTUBE_API_KEY environment variable
 */
export async function fetchYouTubeVideoInfoWithAPI(videoId: string): Promise<YouTubeVideoInfo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  console.log('fetchYouTubeVideoInfoWithAPI called with videoId:', videoId);
  console.log('API Key available:', !!apiKey);
  
  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY not configured, falling back to oEmbed');
    return fetchYouTubeVideoInfo(videoId);
  }
  
  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
    console.log('Making request to YouTube API:', apiUrl.replace(apiKey, 'REDACTED'));
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error('YouTube API error:', response.status, response.statusText);
      const errorBody = await response.text();
      console.error('Error response body:', errorBody);
      // Fallback to oEmbed
      return fetchYouTubeVideoInfo(videoId);
    }
    
    const data = await response.json();
    console.log('YouTube API data received:', data);
    
    if (!data.items || data.items.length === 0) {
      console.error('Video not found:', videoId);
      return null;
    }
    
    const video = data.items[0];
    const duration = parseISO8601Duration(video.contentDetails.duration);
    
    return {
      title: video.snippet.title,
      duration: duration,
      thumbnailUrl: video.snippet.thumbnails.maxres?.url || 
                    video.snippet.thumbnails.high?.url || 
                    video.snippet.thumbnails.medium?.url ||
                    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      description: video.snippet.description
    };
    
  } catch (error) {
    console.error('Error fetching YouTube video info with API:', error);
    // Fallback to oEmbed
    return fetchYouTubeVideoInfo(videoId);
  }
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}
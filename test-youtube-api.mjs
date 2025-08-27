import { config } from 'dotenv';
config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const videoId = 'GLS0VkwGrRY'; // Test video ID

console.log('Testing YouTube API with video ID:', videoId);
console.log('API Key available:', !!YOUTUBE_API_KEY);
console.log('API Key value:', YOUTUBE_API_KEY);

if (!YOUTUBE_API_KEY) {
  console.error('YOUTUBE_API_KEY is not set in environment variables!');
  process.exit(1);
}

const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;

try {
  console.log('\nMaking request to YouTube API...');
  const response = await fetch(apiUrl);
  
  console.log('Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Error response:', errorBody);
  } else {
    const data = await response.json();
    console.log('\nYouTube API Response:');
    console.log('=====================');
    
    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      console.log('Title:', video.snippet.title);
      console.log('Duration:', video.contentDetails.duration);
      console.log('Description:', video.snippet.description.substring(0, 100) + '...');
      console.log('Thumbnail:', video.snippet.thumbnails.high?.url);
    } else {
      console.log('No video found with ID:', videoId);
    }
  }
} catch (error) {
  console.error('Error calling YouTube API:', error);
}
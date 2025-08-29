#!/usr/bin/env node
import fetch from 'node-fetch';

const CHANNEL_ID = 'UCvjfQYM3sfSwfAn0cu4wBMA';
const API_KEY = 'AIzaSyAUAgu9_3GMNVA2Iw6KxnpCciabmqkzYIQ';

async function testYouTubeImport() {
  console.log('Testing YouTube Channel Import for @isomerpg\n');
  console.log(`Channel ID: ${CHANNEL_ID}\n`);
  
  // Test fetching channel info
  console.log('1. Fetching channel info...');
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;
  const channelResponse = await fetch(channelUrl);
  const channelData = await channelResponse.json();
  
  if (!channelData.items || channelData.items.length === 0) {
    console.error('❌ Channel not found!');
    return;
  }
  
  const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
  console.log(`✅ Found uploads playlist: ${uploadsPlaylistId}\n`);
  
  // Test fetching videos
  console.log('2. Fetching channel videos...');
  const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=10&key=${API_KEY}`;
  const videosResponse = await fetch(videosUrl);
  const videosData = await videosResponse.json();
  
  if (!videosData.items || videosData.items.length === 0) {
    console.error('❌ No videos found!');
    return;
  }
  
  console.log(`✅ Found ${videosData.items.length} videos:\n`);
  
  videosData.items.forEach((item, index) => {
    const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
    const title = item.snippet?.title || 'Untitled';
    console.log(`   ${index + 1}. ${title}`);
    console.log(`      Video ID: ${videoId}`);
    console.log(`      Published: ${item.snippet?.publishedAt}\n`);
  });
  
  console.log('✅ YouTube API test successful!');
  console.log('\nThe channel import route should now work correctly with the updated channel ID.');
}

testYouTubeImport().catch(console.error);
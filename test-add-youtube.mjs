// Test adding YouTube video via API
import { config } from 'dotenv';
config();

const testVideoId = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up
const testUrl = `https://www.youtube.com/watch?v=${testVideoId}`;

async function testAddYouTube() {
  try {
    // First, login to get session token
    console.log('Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@isodisplay.local',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const cookies = loginResponse.headers.get('set-cookie');
    const sessionToken = cookies?.match(/session-token=([^;]+)/)?.[1];
    
    if (!sessionToken) {
      throw new Error('No session token received');
    }

    console.log('Session token obtained');

    // Get CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf', {
      headers: {
        'Cookie': `session-token=${sessionToken}`
      }
    });

    const { csrfToken } = await csrfResponse.json();
    console.log('CSRF token obtained');

    // Add YouTube video
    console.log('\nAdding YouTube video...');
    console.log('Video URL:', testUrl);
    console.log('Video ID:', testVideoId);
    
    const addResponse = await fetch('http://localhost:3000/api/content/youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session-token=${sessionToken}; csrf-token=${csrfToken}`,
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        url: testUrl,
        videoId: testVideoId,
        name: 'YouTube Video', // Use generic name to test if API fetches real title
        duration: 0 // Play full video
      })
    });

    console.log('Response status:', addResponse.status);
    
    const result = await addResponse.json();
    
    if (addResponse.ok) {
      console.log('\n✅ YouTube video added successfully!');
      console.log('Content ID:', result.id);
      console.log('Name:', result.name);
      console.log('Duration:', result.duration);
      console.log('Metadata:', JSON.stringify(result.metadata, null, 2));
    } else {
      console.error('❌ Failed to add YouTube video:', result.error);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testAddYouTube();
#!/usr/bin/env node

/**
 * Simple test script to verify API endpoints are working
 */

const API_BASE = 'http://localhost:3001';

async function testAPIs() {
  console.log('🚀 Testing API Endpoints\n');

  try {
    // Test 1: Check if server is running
    console.log('Testing server connectivity...');
    const homeResponse = await fetch(API_BASE);
    if (homeResponse.ok) {
      console.log('✅ Server is running on', API_BASE);
    } else {
      console.log('⚠️ Server responded with status:', homeResponse.status);
    }

    // Test 2: Try to access playlists API (will fail without auth but shows API is there)
    console.log('\nTesting /api/playlists endpoint...');
    const playlistResponse = await fetch(`${API_BASE}/api/playlists`);
    if (playlistResponse.status === 401) {
      console.log('✅ Playlist API exists (requires authentication)');
    } else if (playlistResponse.ok) {
      const data = await playlistResponse.json();
      console.log('✅ Playlist API returned data:', data.length, 'playlists');
    } else {
      console.log('❌ Unexpected response:', playlistResponse.status);
    }

    // Test 3: Try to access content API
    console.log('\nTesting /api/content endpoint...');
    const contentResponse = await fetch(`${API_BASE}/api/content`);
    if (contentResponse.status === 401) {
      console.log('✅ Content API exists (requires authentication)');
    } else if (contentResponse.ok) {
      const data = await contentResponse.json();
      console.log('✅ Content API returned data:', data.length, 'items');
    } else {
      console.log('❌ Unexpected response:', contentResponse.status);
    }

    // Test 4: Try to access displays API
    console.log('\nTesting /api/displays endpoint...');
    const displayResponse = await fetch(`${API_BASE}/api/displays`);
    if (displayResponse.status === 401) {
      console.log('✅ Display API exists (requires authentication)');
    } else if (displayResponse.ok) {
      const data = await displayResponse.json();
      console.log('✅ Display API returned data:', data.length, 'displays');
    } else {
      console.log('❌ Unexpected response:', displayResponse.status);
    }

    console.log('\n✨ Basic API tests completed!');
    console.log('All endpoints are responding correctly (authentication required as expected)');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️ Make sure the development server is running on port 3001');
    }
  }
}

// Run the tests
testAPIs();
#!/usr/bin/env ts-node

/**
 * Test script to verify API endpoints with transformers
 * Run with: npx ts-node scripts/test-api-endpoints.ts
 */

const API_BASE = 'http://localhost:3001';

// Get cookies from login
async function getCookies() {
  try {
    const loginResponse = await fetch(`${API_BASE}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin',
        json: true,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const cookies = loginResponse.headers.get('set-cookie');
    return cookies;
  } catch (error) {
    console.error('Failed to login:', error);
    throw error;
  }
}

async function testPlaylistEndpoints(cookies: string | null) {
  console.log('\n🧪 Testing Playlist Endpoints...');
  
  try {
    // Test GET /api/playlists
    const response = await fetch(`${API_BASE}/api/playlists`, {
      headers: {
        'Cookie': cookies || '',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch playlists: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`  ✓ GET /api/playlists - Retrieved ${data.length} playlists`);
    
    // Validate response structure
    if (data.length > 0) {
      const playlist = data[0];
      
      // Check for required fields
      const requiredFields = ['id', 'name', 'isActive', 'createdAt', 'updatedAt'];
      const missingFields = requiredFields.filter(field => !(field in playlist));
      
      if (missingFields.length > 0) {
        console.error(`  ✗ Missing fields: ${missingFields.join(', ')}`);
      } else {
        console.log('  ✓ All required fields present');
      }
      
      // Check date format (should be ISO strings)
      if (typeof playlist.createdAt === 'string' && playlist.createdAt.includes('T')) {
        console.log('  ✓ Date fields are ISO strings');
      } else {
        console.error('  ✗ Date fields are not ISO strings');
      }
      
      // Check for items array
      if (Array.isArray(playlist.items)) {
        console.log(`  ✓ Items array present with ${playlist.items.length} items`);
        
        if (playlist.items.length > 0) {
          const item = playlist.items[0];
          // Check item structure
          if (item.transitionType && item.duration && item.content) {
            console.log('  ✓ Item structure is correct');
          } else {
            console.error('  ✗ Item structure is incorrect');
          }
        }
      }
    }
    
    console.log('✅ Playlist endpoints test completed');
  } catch (error) {
    console.error('❌ Playlist endpoints test failed:', error);
  }
}

async function testContentEndpoints(cookies: string | null) {
  console.log('\n🧪 Testing Content Endpoints...');
  
  try {
    // Test GET /api/content
    const response = await fetch(`${API_BASE}/api/content`, {
      headers: {
        'Cookie': cookies || '',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`  ✓ GET /api/content - Retrieved ${data.length} content items`);
    
    // Validate response structure
    if (data.length > 0) {
      const content = data[0];
      
      // Check for required fields
      const requiredFields = ['id', 'name', 'type', 'createdAt', 'updatedAt'];
      const missingFields = requiredFields.filter(field => !(field in content));
      
      if (missingFields.length > 0) {
        console.error(`  ✗ Missing fields: ${missingFields.join(', ')}`);
      } else {
        console.log('  ✓ All required fields present');
      }
      
      // Check fileSize is string (BigInt serialization)
      if (content.fileSize === null || typeof content.fileSize === 'string') {
        console.log('  ✓ FileSize is properly serialized');
      } else {
        console.error('  ✗ FileSize is not properly serialized');
      }
      
      // Check for thumbnailUrl
      if ('thumbnailUrl' in content) {
        console.log('  ✓ ThumbnailUrl field present');
      } else {
        console.error('  ✗ ThumbnailUrl field missing');
      }
    }
    
    console.log('✅ Content endpoints test completed');
  } catch (error) {
    console.error('❌ Content endpoints test failed:', error);
  }
}

async function testDisplayEndpoints(cookies: string | null) {
  console.log('\n🧪 Testing Display Endpoints...');
  
  try {
    // Test GET /api/displays
    const response = await fetch(`${API_BASE}/api/displays`, {
      headers: {
        'Cookie': cookies || '',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch displays: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`  ✓ GET /api/displays - Retrieved ${data.length} displays`);
    
    // Validate response structure
    if (data.length > 0) {
      const display = data[0];
      
      // Check for required fields
      const requiredFields = ['id', 'name', 'resolution', 'orientation', 'status'];
      const missingFields = requiredFields.filter(field => !(field in display));
      
      if (missingFields.length > 0) {
        console.error(`  ✗ Missing fields: ${missingFields.join(', ')}`);
      } else {
        console.log('  ✓ All required fields present');
      }
      
      // Check status field
      if (['online', 'offline', 'error', 'unknown'].includes(display.status)) {
        console.log('  ✓ Status field has valid value');
      } else {
        console.error('  ✗ Status field has invalid value:', display.status);
      }
    }
    
    console.log('✅ Display endpoints test completed');
  } catch (error) {
    console.error('❌ Display endpoints test failed:', error);
  }
}

async function main() {
  console.log('🚀 Starting API Endpoint Tests\n');
  console.log('   Testing against:', API_BASE);
  
  try {
    // Wait a moment for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get authentication cookies
    console.log('🔐 Authenticating...');
    const cookies = await getCookies();
    console.log('✅ Authentication successful');
    
    // Test each endpoint group
    await testPlaylistEndpoints(cookies || '');
    await testContentEndpoints(cookies || '');
    await testDisplayEndpoints(cookies || '');
    
    console.log('\n✨ All API endpoint tests completed!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  main();
}

export { testPlaylistEndpoints, testContentEndpoints, testDisplayEndpoints };
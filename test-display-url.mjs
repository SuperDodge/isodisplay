#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:3000';

// Read cookies and parse from Netscape format
const cookiesFile = path.join(__dirname, 'test-cookies.txt');
const cookiesContent = fs.readFileSync(cookiesFile, 'utf-8');
const cookieLines = cookiesContent.split('\n').filter(line => !line.startsWith('#') && line.trim());
const cookies = cookieLines.map(line => {
  const parts = line.split('\t');
  return `${parts[5]}=${parts[6]}`;
}).join('; ');

// Read CSRF token
const csrfFile = path.join(__dirname, 'csrf.txt');
const csrfToken = fs.readFileSync(csrfFile, 'utf-8').trim();

async function testDisplayCreation() {
  console.log('🧪 Testing Display Creation and URL Generation\n');

  try {
    // Create a test display
    console.log('1️⃣ Creating test display...');
    const createResponse = await fetch(`${BASE_URL}/api/displays`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        name: 'Test Display ' + new Date().toISOString().slice(11, 19),
        location: 'Test Location',
        resolution: '1920x1080',
        orientation: 'LANDSCAPE',
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create display: ${createResponse.status} - ${errorText}`);
    }

    const createdDisplay = await createResponse.json();
    console.log('✅ Display created successfully');
    console.log('   ID:', createdDisplay.id);
    console.log('   Name:', createdDisplay.name);
    console.log('   URL Slug:', createdDisplay.urlSlug);
    console.log('   Unique URL:', createdDisplay.uniqueUrl);
    
    // Verify the display URL is not undefined
    if (!createdDisplay.urlSlug && !createdDisplay.uniqueUrl) {
      console.error('❌ ERROR: Display URL is undefined!');
      process.exit(1);
    }

    // Fetch all displays to verify
    console.log('\n2️⃣ Fetching all displays to verify...');
    const listResponse = await fetch(`${BASE_URL}/api/displays`, {
      headers: {
        'Cookie': cookies,
        'X-CSRF-Token': csrfToken,
      },
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to fetch displays: ${listResponse.status}`);
    }

    const displays = await listResponse.json();
    const ourDisplay = displays.find(d => d.id === createdDisplay.id);
    
    if (!ourDisplay) {
      console.error('❌ ERROR: Created display not found in list!');
      process.exit(1);
    }

    console.log('✅ Display found in list');
    console.log('   List URL Slug:', ourDisplay.urlSlug);
    console.log('   List Unique URL:', ourDisplay.uniqueUrl);
    
    // Generate the display URL
    const displayUrl = `${BASE_URL}/display/${ourDisplay.uniqueUrl || ourDisplay.urlSlug}`;
    console.log('\n3️⃣ Generated Display URL:');
    console.log('   ', displayUrl);
    
    if (displayUrl.includes('undefined')) {
      console.error('❌ ERROR: Display URL contains "undefined"!');
      process.exit(1);
    }

    // Clean up - delete the test display
    console.log('\n4️⃣ Cleaning up test display...');
    const deleteResponse = await fetch(`${BASE_URL}/api/displays/${createdDisplay.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': cookies,
        'X-CSRF-Token': csrfToken,
      },
    });

    if (deleteResponse.ok) {
      console.log('✅ Test display deleted');
    } else {
      console.log('⚠️ Warning: Could not delete test display');
    }

    console.log('\n🎉 All tests passed! Display URL generation is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testDisplayCreation();
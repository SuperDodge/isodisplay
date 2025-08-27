import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3000';

async function login() {
  // Get CSRF token first
  const loginPageRes = await fetch(`${API_URL}/auth/login`);
  const loginPageText = await loginPageRes.text();
  
  // Extract CSRF token
  const csrfMatch = loginPageText.match(/name="csrfToken" value="([^"]+)"/);
  if (!csrfMatch) {
    throw new Error('Could not extract CSRF token');
  }
  const csrfToken = csrfMatch[1];
  
  // Get cookies from login page
  const cookies = loginPageRes.headers.raw()['set-cookie']
    ?.map(cookie => cookie.split(';')[0])
    .join('; ') || '';
  
  // Login with credentials
  const loginRes = await fetch(`${API_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies
    },
    body: new URLSearchParams({
      email: 'admin@isodisplay.local',
      password: 'admin123',
      csrfToken: csrfToken,
      redirect: 'false',
      callbackUrl: API_URL,
      json: 'true'
    })
  });

  // Get session cookies
  const sessionCookies = loginRes.headers.raw()['set-cookie']
    ?.map(cookie => cookie.split(';')[0])
    .join('; ') || cookies;
  
  return sessionCookies;
}

async function uploadPDF(cookies) {
  const pdfPath = path.join(__dirname, '../public/test.pdf');
  
  const form = new FormData();
  form.append('file', fs.createReadStream(pdfPath), 'test.pdf');
  form.append('type', 'PDF');
  form.append('displayOrder', '1');
  form.append('backgroundColor', '#ffffff');
  form.append('pdfScale', 'fit');
  form.append('pdfSize', 'standard');
  
  try {
    const response = await fetch(`${API_URL}/api/content/upload`, {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Cookie': cookies
      },
      body: form
    });
    
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      const data = JSON.parse(result);
      console.log('\n✅ PDF uploaded successfully!');
      console.log('Content ID:', data.id);
      console.log('File path:', data.filePath);
      console.log('Thumbnails:', data.thumbnails);
    }
  } catch (error) {
    console.error('Upload error:', error.message);
  }
}

async function main() {
  try {
    console.log('Logging in...');
    const cookies = await login();
    console.log('Login successful!\n');
    
    console.log('Uploading PDF...');
    await uploadPDF(cookies);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3000';

// Simulate an admin session for testing
async function uploadPDF() {
  const pdfPath = path.join(__dirname, '../public/test.pdf');
  
  const form = new FormData();
  form.append('file', fs.createReadStream(pdfPath), 'test.pdf');
  form.append('type', 'PDF');
  form.append('displayOrder', '1');
  form.append('backgroundColor', '#ffffff');
  form.append('pdfScale', 'fit');
  form.append('pdfSize', 'standard');
  
  try {
    // For testing, we'll bypass auth and directly call the upload endpoint
    const response = await fetch(`${API_URL}/api/content/upload`, {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        // Add a mock session for testing (this won't work in production)
        'x-test-mode': 'true',
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
    console.error('Stack:', error.stack);
  }
}

uploadPDF();
import fetch from 'node-fetch';
import fs from 'fs';

const cookies = fs.readFileSync('clean-cookies.txt', 'utf-8').trim();
const csrfToken = fs.readFileSync('clean-csrf.txt', 'utf-8').trim();

async function testClockUpdate() {
  try {
    // First get displays
    const getResp = await fetch('http://localhost:3000/api/displays', {
      headers: {
        'Cookie': cookies
      }
    });
    
    const displays = await getResp.json();
    if (!displays.length) {
      console.log('No displays found');
      return;
    }
    
    const display = displays[0];
    console.log('Testing update on display:', display.id, display.name);
    
    // Update with clock settings
    const updateResp = await fetch(`http://localhost:3000/api/displays/${display.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        clockSettings: {
          enabled: true,
          position: 'top-right',
          size: 'medium',
          format: '12h',
          showSeconds: true,
          showDate: true,
          opacity: 80,
          color: '#FFFFFF',
          backgroundColor: '#000000',
          fontFamily: 'digital',
          offsetX: 20,
          offsetY: 20
        }
      })
    });
    
    console.log('Update response status:', updateResp.status);
    const result = await updateResp.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.clockSettings) {
      console.log('Clock settings saved successfully!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testClockUpdate();

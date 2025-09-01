import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Gate debug page behind env flag and disallow in production by default
  const enabled = process.env.ENABLE_DEBUG_SIGNIN === 'true';
  if (!enabled || process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Debug Sign In</title>
    </head>
    <body style="background: #1a1a1a; color: white; padding: 20px; font-family: monospace;">
      <h1>Debug NextAuth Sign In</h1>
      <form id="loginForm">
        <div style="margin: 10px 0;">
          <label>Email: <input type="email" id="email" value="admin@isodisplay.local" style="margin-left: 10px; padding: 5px;"></label>
        </div>
        <div style="margin: 10px 0;">
          <label>Password: <input type="password" id="password" value="admin123" style="margin-left: 10px; padding: 5px;"></label>
        </div>
        <button type="submit" style="margin: 10px 0; padding: 10px 20px;">Sign In</button>
      </form>
      <pre id="output" style="background: #333; padding: 10px; margin-top: 20px; border-radius: 5px;"></pre>
      
      <script type="module">
        const output = document.getElementById('output');
        const form = document.getElementById('loginForm');
        
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          output.textContent = 'Signing in...\\n';
          
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          
          // Get CSRF token
          const csrfResponse = await fetch('/api/auth/csrf');
          const csrfData = await csrfResponse.json();
          output.textContent += 'CSRF Token: ' + csrfData.csrfToken + '\\n\\n';
          
          // Try to sign in
          const formData = new URLSearchParams();
          formData.append('email', email);
          formData.append('password', password);
          formData.append('csrfToken', csrfData.csrfToken);
          formData.append('json', 'true');
          
          output.textContent += 'Sending credentials...\\n';
          output.textContent += 'Form data: ' + formData.toString() + '\\n\\n';
          
          const response = await fetch('/api/auth/callback/credentials', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
            redirect: 'manual'
          });
          
          output.textContent += 'Response status: ' + response.status + '\\n';
          output.textContent += 'Response headers:\\n';
          for (const [key, value] of response.headers) {
            output.textContent += '  ' + key + ': ' + value + '\\n';
          }
          
          if (response.status === 200 || response.status === 302) {
            const text = await response.text();
            output.textContent += '\\nResponse body: ' + text + '\\n';
            
            // Check session
            const sessionResponse = await fetch('/api/auth/session');
            const sessionData = await sessionResponse.json();
            output.textContent += '\\nSession data: ' + JSON.stringify(sessionData, null, 2) + '\\n';
          }
        });
      </script>
    </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

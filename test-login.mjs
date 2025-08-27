import { signIn } from 'next-auth/react';

// This will test the signIn function directly
async function testLogin() {
  console.log('Testing NextAuth signIn...');
  
  try {
    const result = await signIn('credentials', {
      email: 'admin@isodisplay.local',
      password: 'admin123',
      redirect: false,
    });
    
    console.log('SignIn result:', result);
  } catch (error) {
    console.error('SignIn error:', error);
  }
}

// Can't run this directly since it needs browser context
console.log(`
To test login, open browser console at http://localhost:3000/auth/login and run:

fetch('/api/auth/signin/credentials', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@isodisplay.local',
    password: 'admin123',
    redirect: false
  })
}).then(r => r.json()).then(console.log)
`);
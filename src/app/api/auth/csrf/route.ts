import { NextResponse } from 'next/server';
import { setCSRFToken } from '@/lib/security/csrf-server';

export async function GET() {
  try {
    const token = await setCSRFToken();
    return NextResponse.json({ csrfToken: token });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
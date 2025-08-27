import { NextRequest, NextResponse } from 'next/server';

// This route is just for compatibility - the actual WebSocket server
// is initialized in the custom server or through the WebSocket service
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'WebSocket server is running through custom server',
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    note: 'Connect using Socket.IO client to the root URL with path="/socket.io"'
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'WebSocket connections must be established through Socket.IO client'
  }, { status: 400 });
}
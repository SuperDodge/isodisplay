import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Attempt to resolve worker from node_modules
    const projectRoot = process.cwd();
    const candidatePaths = [
      path.join(projectRoot, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js'),
      path.join(projectRoot, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.js'),
    ];

    let workerPath: string | null = null;
    for (const p of candidatePaths) {
      try {
        await fs.access(p);
        workerPath = p;
        break;
      } catch {}
    }

    if (!workerPath) {
      return NextResponse.json({ error: 'PDF worker not found' }, { status: 404 });
    }

    const code = await fs.readFile(workerPath);
    return new NextResponse(code, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load PDF worker' }, { status: 500 });
  }
}


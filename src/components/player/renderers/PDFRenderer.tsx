'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PlaylistItem } from '@/types/playlist';
import { FileText } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker (ESM friendly)
// This resolves to a valid URL for the worker at runtime
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface PDFRendererProps {
  item: PlaylistItem;
}

export function PDFRenderer({ item }: PDFRendererProps) {
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get the PDF URL from content object or fallback to API endpoint
  const pdfUrl = item.content?.fileUrl || `/api/content/${item.contentId}/file`;

  // Get background color and display settings
  const backgroundColor = item.backgroundColor || item.content?.backgroundColor || '#000000';

  const [dimensions, setDimensions] = useState<{width: number; height: number}>({width: 0, height: 0});

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // Compute scale to fit page into container while preserving aspect ratio
  const computeScale = () => {
    if (!pageSize) return 1;
    const { width: cw, height: ch } = dimensions;
    if (!cw || !ch) return 1;
    const sx = cw / pageSize.width;
    const sy = ch / pageSize.height;
    return Math.min(sx, sy);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden" style={{ backgroundColor }}>
      {!pdfUrl && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <FileText className="w-16 h-16 mx-auto mb-4 text-white/50" />
            <div className="text-xl">No PDF provided</div>
          </div>
        </div>
      )}
      {!!pdfUrl && (
        <Document
          file={pdfUrl}
          onLoadError={(e) => setError(e?.message || 'Failed to load PDF')}
          loading={
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center text-white">
                <FileText className="w-16 h-16 mx-auto mb-4 text-white/50 animate-pulse" />
                <div className="text-xl">Loading PDF...</div>
              </div>
            </div>
          }
          className="w-full h-full"
        >
          <Page
            pageNumber={1}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onLoadSuccess={(page) => {
              const viewport = page.getViewport({ scale: 1 });
              setPageSize({ width: viewport.width, height: viewport.height });
            }}
            scale={computeScale()}
            className="!w-full !h-full flex items-center justify-center"
          />
        </Document>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <FileText className="w-16 h-16 mx-auto mb-4 text-white/50" />
            <div className="text-xl mb-2">Unable to load PDF</div>
            <div className="text-sm text-white/70">{item.title}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PDFRenderer;

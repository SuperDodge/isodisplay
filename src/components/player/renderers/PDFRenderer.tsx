'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PlaylistItem } from '@/types/playlist';
import { FileText } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker (ESM friendly)
// This resolves to a valid URL for the worker at runtime
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// Use CDN worker as a robust default in Next dev/prod without extra config
// Use CDN worker that matches the API version to prevent version mismatch
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFRendererProps {
  item: PlaylistItem;
}

export function PDFRenderer({ item }: PDFRendererProps) {
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);

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

  // Read PDF display preferences from metadata
  const meta = item.content?.metadata || {};
  const pdfScale: 'contain' | 'cover' | 'fill' = (meta.pdfScale as any) || 'contain';
  const pdfSize: number = typeof meta.pdfSize === 'number' ? meta.pdfSize : 100;
  const autoPaging: boolean = meta.pdfAutoPaging !== undefined ? !!meta.pdfAutoPaging : true;
  const pagesSpec: string | undefined = typeof meta.pdfPages === 'string' ? meta.pdfPages : undefined;
  const perPageDuration: number = typeof meta.pdfPageDuration === 'number'
    ? meta.pdfPageDuration
    : (item.duration || 10);

  // Parse pages spec like "1,3-5"
  const parsePages = useCallback((spec: string | undefined, total: number): number[] => {
    if (!total) return [1];
    if (!spec || !spec.trim()) return Array.from({ length: total }, (_, i) => i + 1);
    const result: number[] = [];
    for (const part of spec.split(',')) {
      const p = part.trim();
      if (!p) continue;
      if (p.includes('-')) {
        const [aStr, bStr] = p.split('-');
        let a = parseInt(aStr, 10); let b = parseInt(bStr, 10);
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        if (a < 1) a = 1; if (b > total) b = total;
        if (a > b) [a, b] = [b, a];
        for (let i = a; i <= b; i++) result.push(i);
      } else {
        let n = parseInt(p, 10);
        if (Number.isFinite(n)) {
          if (n < 1) n = 1; if (n > total) n = total;
          result.push(n);
        }
      }
    }
    return result.length ? Array.from(new Set(result)) : [1];
  }, []);

  const pages = parsePages(pagesSpec, numPages);
  const pageNumber = pages[Math.min(pageIndex, Math.max(0, pages.length - 1))] || 1;

  // Compute scale to fit/cover page into container while preserving aspect ratio
  const computeScale = () => {
    if (!pageSize) return 1;
    const { width: cw, height: ch } = dimensions;
    if (!cw || !ch) return 1;
    const sx = cw / pageSize.width;
    const sy = ch / pageSize.height;
    let base = pdfScale === 'cover' || pdfScale === 'fill' ? Math.max(sx, sy) : Math.min(sx, sy);
    if (pdfScale === 'contain' && pdfSize && pdfSize > 0 && pdfSize <= 100) {
      base = base * (pdfSize / 100);
    }
    return base;
  };

  // Auto-paging timer
  useEffect(() => {
    if (!autoPaging || pages.length <= 1) return;
    const ms = Math.max(0.5, perPageDuration) * 1000;
    const t = setInterval(() => {
      setPageIndex((i) => (i + 1) % pages.length);
    }, ms);
    return () => clearInterval(t);
  }, [autoPaging, perPageDuration, pages.length]);

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
          onLoadError={(e) => {
            const msg = (e as any)?.message || 'Failed to load PDF';
            // eslint-disable-next-line no-console
            console.error('PDF load error:', msg, 'URL:', pdfUrl);
            setError(msg);
          }}
          onLoadSuccess={(doc) => setNumPages(doc.numPages)}
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
            pageNumber={pageNumber}
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

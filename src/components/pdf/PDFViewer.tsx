'use client';

import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import { Input } from '@/components/ui/input';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface PDFViewerProps {
  url: string;
  page?: number;
  scale?: number;
  onPageChange?: (page: number) => void;
  onDocumentLoad?: (numPages: number) => void;
  renderTextLayer?: boolean;
  renderAnnotationLayer?: boolean;
}

export function PDFViewer({
  url,
  page = 1,
  scale = 1.0,
  onPageChange,
  onDocumentLoad,
  renderTextLayer = false,
  renderAnnotationLayer = false,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(page);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageRendering, setPageRendering] = useState(false);
  const pageRenderingRef = useRef(false);
  const pageNumPending = useRef<number | null>(null);

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        
        if (onDocumentLoad) {
          onDocumentLoad(pdf.numPages);
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();

    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [url]);

  // Render page
  const renderPage = async (pageNum: number) => {
    if (!pdfDocument || !canvasRef.current) return;

    pageRenderingRef.current = true;
    setPageRendering(true);

    try {
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      pageRenderingRef.current = false;
      setPageRendering(false);

      // Check if there's a pending page to render
      if (pageNumPending.current !== null) {
        const pendingPage = pageNumPending.current;
        pageNumPending.current = null;
        renderPage(pendingPage);
      }
    } catch (err) {
      console.error('Error rendering page:', err);
      pageRenderingRef.current = false;
      setPageRendering(false);
    }
  };

  // Queue page rendering
  const queueRenderPage = (pageNum: number) => {
    if (pageRenderingRef.current) {
      pageNumPending.current = pageNum;
    } else {
      renderPage(pageNum);
    }
  };

  // Handle page changes
  useEffect(() => {
    if (pdfDocument && currentPage > 0 && currentPage <= numPages) {
      queueRenderPage(currentPage);
    }
  }, [currentPage, pdfDocument, scale]);

  // Update current page when prop changes
  useEffect(() => {
    if (page !== currentPage && page > 0 && page <= numPages) {
      setCurrentPage(page);
    }
  }, [page]);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      if (onPageChange) {
        onPageChange(newPage);
      }
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      if (onPageChange) {
        onPageChange(newPage);
      }
    }
  };

  const goToPage = (pageNum: number) => {
    if (pageNum > 0 && pageNum <= numPages) {
      setCurrentPage(pageNum);
      if (onPageChange) {
        onPageChange(pageNum);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white/5 rounded-lg">
        <div className="text-white">Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-500/10 rounded-lg">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto bg-white/5 rounded-lg p-4">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="border border-white/20 shadow-lg"
          />
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg mt-4">
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex items-center gap-2 text-white">
          <Input
            type="number"
            min="1"
            max={numPages}
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
            className="w-16 text-center !h-8"
          />
          <span>/</span>
          <span>{numPages}</span>
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= numPages}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default PDFViewer;
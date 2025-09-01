'use client';

import { useState, useEffect } from 'react';
import { PlaylistItem } from '@/types/playlist';
import { FileText } from 'lucide-react';

interface PDFRendererProps {
  item: PlaylistItem;
}

export function PDFRenderer({ item }: PDFRendererProps) {
  const [error, setError] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  
  // Get the PDF URL from content object or fallback to API endpoint
  const pdfUrl = item.content?.fileUrl || `/api/content/${item.contentId}/file`;
  
  // Get background color and display settings
  const backgroundColor = item.backgroundColor || item.content?.backgroundColor || '#000000';
  
  useEffect(() => {
    // Reset state when item changes
    setError(false);
    setShowPdf(false);
    
    // Set a small delay to show loading state, then display PDF
    const timer = setTimeout(() => {
      setShowPdf(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [item.contentId]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor }}>
        <div className="text-center text-white">
          <FileText className="w-16 h-16 mx-auto mb-4 text-white/50" />
          <div className="text-xl mb-2">Unable to load PDF</div>
          <div className="text-sm text-white/70">{item.title}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor }}>
      {!showPdf && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <FileText className="w-16 h-16 mx-auto mb-4 text-white/50 animate-pulse" />
            <div className="text-xl">Loading PDF...</div>
          </div>
        </div>
      )}
      {showPdf && (
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-fit`}
          className="absolute inset-0 w-full h-full border-0"
          title={item.title}
          style={{
            backgroundColor: 'white'
          }}
        />
      )}
    </div>
  );
}

export default PDFRenderer;
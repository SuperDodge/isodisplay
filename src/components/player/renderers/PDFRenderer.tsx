'use client';

import { useState, useEffect } from 'react';
import { PlaylistItem } from '@/types/playlist';

interface PDFRendererProps {
  item: PlaylistItem;
}

export function PDFRenderer({ item }: PDFRendererProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Get crop settings if available
  const cropSettings = item.cropSettings;
  
  // In production, this would render the PDF with pdfjs
  // For now, we'll show a placeholder
  const pdfUrl = `/api/pdf/${item.contentId}`;

  return (
    <div className="w-full h-full bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl mb-4">PDF Document</div>
        <div className="text-xl text-gray-600">{item.title}</div>
        {cropSettings && (
          <div className="text-sm text-gray-500 mt-2">
            Page {cropSettings.pageNumber || currentPage}
          </div>
        )}
      </div>
    </div>
  );
}

export default PDFRenderer;
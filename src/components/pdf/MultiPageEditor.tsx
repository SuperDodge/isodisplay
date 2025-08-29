'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Copy, Paste, RotateCw } from 'lucide-react';
import { CropSettings } from './CropSelector';
import { Input } from '@/components/ui/input';

export interface PageSettings {
  pageNumber: number;
  crop?: CropSettings;
  zoom?: number;
  rotation?: number;
  notes?: string;
}

export interface MultiPageEditorProps {
  totalPages: number;
  currentPage: number;
  pageSettings: Map<number, PageSettings>;
  onPageChange: (page: number) => void;
  onSettingsChange: (page: number, settings: PageSettings) => void;
  onBulkApply?: (pages: number[], settings: Partial<PageSettings>) => void;
}

export function MultiPageEditor({
  totalPages,
  currentPage,
  pageSettings,
  onPageChange,
  onSettingsChange,
  onBulkApply,
}: MultiPageEditorProps) {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [copiedSettings, setCopiedSettings] = useState<Partial<PageSettings> | null>(null);
  const [pageRange, setPageRange] = useState({ start: 1, end: totalPages });
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Get current page settings
  const currentSettings = pageSettings.get(currentPage) || {
    pageNumber: currentPage,
  };

  // Generate page thumbnails grid
  const generatePageGrid = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Handle page selection for bulk actions
  const togglePageSelection = (page: number) => {
    const newSelection = new Set(selectedPages);
    if (newSelection.has(page)) {
      newSelection.delete(page);
    } else {
      newSelection.add(page);
    }
    setSelectedPages(newSelection);
  };

  // Select all pages
  const selectAllPages = () => {
    const allPages = new Set<number>();
    for (let i = 1; i <= totalPages; i++) {
      allPages.add(i);
    }
    setSelectedPages(allPages);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  // Select page range
  const selectPageRange = () => {
    const rangePages = new Set<number>();
    for (let i = pageRange.start; i <= pageRange.end && i <= totalPages; i++) {
      rangePages.add(i);
    }
    setSelectedPages(rangePages);
  };

  // Copy current page settings
  const copyCurrentSettings = () => {
    if (currentSettings) {
      const { crop, zoom, rotation } = currentSettings;
      setCopiedSettings({ crop, zoom, rotation });
    }
  };

  // Paste settings to selected pages
  const pasteToSelected = () => {
    if (copiedSettings && selectedPages.size > 0 && onBulkApply) {
      onBulkApply(Array.from(selectedPages), copiedSettings);
      clearSelection();
    }
  };

  // Apply rotation to selected pages
  const rotateSelected = (degrees: number) => {
    if (selectedPages.size > 0 && onBulkApply) {
      const pages = Array.from(selectedPages);
      pages.forEach(page => {
        const settings = pageSettings.get(page) || { pageNumber: page };
        const currentRotation = settings.rotation || 0;
        onSettingsChange(page, {
          ...settings,
          rotation: (currentRotation + degrees) % 360,
        });
      });
    }
  };

  // Navigate pages
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="bg-white/10 rounded-lg p-4">
      {/* Page Navigation */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">Page Navigation</h3>
        
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-white">Page</span>
            <Input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-16 text-center !h-8"
            />
            <span className="text-white">of {totalPages}</span>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Page Thumbnails */}
        <div className="flex gap-2 justify-center">
          {generatePageGrid().map(page => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`relative w-12 h-16 rounded border-2 transition ${
                page === currentPage
                  ? 'border-brand-orange-500 bg-brand-orange-500/20'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className="text-white text-xs">{page}</span>
              {pageSettings.has(page) && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
              {selectedPages.has(page) && (
                <div className="absolute inset-0 bg-brand-orange-500/30 rounded" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Page Settings */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">Current Page Settings</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-white/70">Crop:</span>
            <span className="text-white ml-2">
              {currentSettings.crop
                ? `${currentSettings.crop.width.toFixed(1)}% × ${currentSettings.crop.height.toFixed(1)}%`
                : 'None'}
            </span>
          </div>
          <div>
            <span className="text-white/70">Zoom:</span>
            <span className="text-white ml-2">
              {currentSettings.zoom ? `${(currentSettings.zoom * 100).toFixed(0)}%` : '100%'}
            </span>
          </div>
          <div>
            <span className="text-white/70">Rotation:</span>
            <span className="text-white ml-2">
              {currentSettings.rotation || 0}°
            </span>
          </div>
          <div>
            <span className="text-white/70">Notes:</span>
            <span className="text-white ml-2">
              {currentSettings.notes || 'None'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={copyCurrentSettings}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition"
          >
            <Copy className="w-4 h-4" />
            Copy Settings
          </button>
          
          {copiedSettings && (
            <div className="text-green-400 text-sm flex items-center">
              Settings copied!
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      <div>
        <button
          onClick={() => setShowBulkActions(!showBulkActions)}
          className="text-white font-semibold mb-3 hover:text-brand-orange-500 transition"
        >
          Bulk Actions {showBulkActions ? '−' : '+'}
        </button>
        
        {showBulkActions && (
          <div className="space-y-4">
            {/* Page Selection */}
            <div>
              <p className="text-white/70 text-sm mb-2">Select Pages:</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={selectAllPages}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition"
                >
                  Clear
                </button>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageRange.start}
                    onChange={(e) => setPageRange({ ...pageRange, start: parseInt(e.target.value) || 1 })}
                    className="w-16 text-center !h-8 text-sm"
                  />
                  <span className="text-white">to</span>
                  <Input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageRange.end}
                    onChange={(e) => setPageRange({ ...pageRange, end: parseInt(e.target.value) || totalPages })}
                    className="w-16 text-center !h-8 text-sm"
                  />
                  <button
                    onClick={selectPageRange}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition"
                  >
                    Select Range
                  </button>
                </div>
              </div>
              <p className="text-white/70 text-sm mt-2">
                {selectedPages.size} page(s) selected
              </p>
            </div>

            {/* Bulk Operations */}
            {selectedPages.size > 0 && (
              <div className="flex gap-2 flex-wrap">
                {copiedSettings && (
                  <button
                    onClick={pasteToSelected}
                    className="flex items-center gap-2 px-3 py-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded transition"
                  >
                    <Paste className="w-4 h-4" />
                    Paste to Selected
                  </button>
                )}
                <button
                  onClick={() => rotateSelected(90)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition"
                >
                  <RotateCw className="w-4 h-4" />
                  Rotate 90°
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MultiPageEditor;
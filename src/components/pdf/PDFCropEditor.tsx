'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Undo2, Redo2, RotateCcw, Save, Download, Upload, Grid } from 'lucide-react';
import PDFViewer from './PDFViewer';
import CropSelector from './CropSelector';
import ZoomControls from './ZoomControls';
import PreviewDisplay from './PreviewDisplay';
import MultiPageEditor from './MultiPageEditor';
import { cropSettingsManager, ContentCropSettings } from '@/lib/pdf/crop-settings-manager';
import { PageSettings } from './MultiPageEditor';
import { CropSettings } from './CropSelector';

interface PDFCropEditorProps {
  contentId: string;
  pdfUrl: string;
  onSave?: (settings: ContentCropSettings) => void;
}

export function PDFCropEditor({ contentId, pdfUrl, onSave }: PDFCropEditorProps) {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSettings, setPageSettings] = useState<Map<number, PageSettings>>(new Map());
  const [currentCrop, setCurrentCrop] = useState<CropSettings | undefined>();
  const [currentZoom, setCurrentZoom] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  
  // Undo/Redo history
  const [history, setHistory] = useState<ContentCropSettings[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistorySize = 50;
  
  // Refs for keyboard shortcuts
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Load existing settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await cropSettingsManager.loadCropSettings(contentId);
      if (settings) {
        const pageSettingsMap = new Map<number, PageSettings>();
        settings.pageSettings.forEach(ps => {
          pageSettingsMap.set(ps.pageNumber, ps);
        });
        setPageSettings(pageSettingsMap);
        setBackgroundColor(settings.globalSettings?.backgroundColor || '#000000');
        
        // Load current page settings
        const currentPageSettings = pageSettingsMap.get(currentPage);
        if (currentPageSettings) {
          setCurrentCrop(currentPageSettings.crop);
          setCurrentZoom(currentPageSettings.zoom || 1);
        }
      }
    };
    
    loadSettings();
  }, [contentId]);
  
  // Add to history
  const addToHistory = useCallback((settings: ContentCropSettings) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(settings);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [historyIndex]);
  
  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousSettings = history[historyIndex - 1];
      applySettings(previousSettings);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);
  
  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextSettings = history[historyIndex + 1];
      applySettings(nextSettings);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);
  
  // Reset all settings
  const resetAll = useCallback(() => {
    const emptySettings: ContentCropSettings = {
      contentId,
      globalSettings: {
        aspectRatio: 16 / 9,
        backgroundColor: '#000000',
        defaultZoom: 1,
      },
      pageSettings: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    applySettings(emptySettings);
    addToHistory(emptySettings);
  }, [contentId, addToHistory]);
  
  // Reset current page
  const resetCurrentPage = useCallback(() => {
    const newPageSettings = new Map(pageSettings);
    newPageSettings.delete(currentPage);
    setPageSettings(newPageSettings);
    setCurrentCrop(undefined);
    setCurrentZoom(1);
    
    // Save to history
    const settings = getCurrentSettings();
    addToHistory(settings);
  }, [currentPage, pageSettings, addToHistory]);
  
  // Apply settings from history
  const applySettings = (settings: ContentCropSettings) => {
    const pageSettingsMap = new Map<number, PageSettings>();
    settings.pageSettings.forEach(ps => {
      pageSettingsMap.set(ps.pageNumber, ps);
    });
    setPageSettings(pageSettingsMap);
    setBackgroundColor(settings.globalSettings?.backgroundColor || '#000000');
    
    // Update current page display
    const currentPageSettings = pageSettingsMap.get(currentPage);
    if (currentPageSettings) {
      setCurrentCrop(currentPageSettings.crop);
      setCurrentZoom(currentPageSettings.zoom || 1);
    } else {
      setCurrentCrop(undefined);
      setCurrentZoom(1);
    }
  };
  
  // Get current settings as ContentCropSettings
  const getCurrentSettings = (): ContentCropSettings => {
    const pageSettingsArray = Array.from(pageSettings.values());
    
    return {
      contentId,
      globalSettings: {
        aspectRatio: 16 / 9,
        backgroundColor,
        defaultZoom: 1,
      },
      pageSettings: pageSettingsArray,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    // Save current page settings before switching
    if (currentCrop || currentZoom !== 1) {
      const newPageSettings = new Map(pageSettings);
      newPageSettings.set(currentPage, {
        pageNumber: currentPage,
        crop: currentCrop,
        zoom: currentZoom,
      });
      setPageSettings(newPageSettings);
    }
    
    // Load new page settings
    setCurrentPage(page);
    const newPageSettings = pageSettings.get(page);
    if (newPageSettings) {
      setCurrentCrop(newPageSettings.crop);
      setCurrentZoom(newPageSettings.zoom || 1);
    } else {
      setCurrentCrop(undefined);
      setCurrentZoom(1);
    }
  };
  
  // Handle settings change
  const handleSettingsChange = (page: number, settings: PageSettings) => {
    const newPageSettings = new Map(pageSettings);
    newPageSettings.set(page, settings);
    setPageSettings(newPageSettings);
    
    if (page === currentPage) {
      setCurrentCrop(settings.crop);
      setCurrentZoom(settings.zoom || 1);
    }
    
    // Add to history
    const currentSettings = getCurrentSettings();
    addToHistory(currentSettings);
  };
  
  // Handle bulk apply
  const handleBulkApply = (pages: number[], settings: Partial<PageSettings>) => {
    const newPageSettings = new Map(pageSettings);
    
    pages.forEach(page => {
      const existing = newPageSettings.get(page) || { pageNumber: page };
      newPageSettings.set(page, {
        ...existing,
        ...settings,
      });
    });
    
    setPageSettings(newPageSettings);
    
    // Update current page if affected
    if (pages.includes(currentPage)) {
      const updated = newPageSettings.get(currentPage);
      if (updated) {
        setCurrentCrop(updated.crop);
        setCurrentZoom(updated.zoom || 1);
      }
    }
    
    // Add to history
    const currentSettings = getCurrentSettings();
    addToHistory(currentSettings);
  };
  
  // Save settings
  const saveSettings = async () => {
    const settings = getCurrentSettings();
    await cropSettingsManager.saveCropSettings(contentId, settings);
    
    if (onSave) {
      onSave(settings);
    }
  };
  
  // Export settings
  const exportSettings = () => {
    const settings = getCurrentSettings();
    const json = cropSettingsManager.exportSettings(settings);
    
    // Create download link
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crop-settings-${contentId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Import settings
  const importSettings = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const settings = cropSettingsManager.importSettings(json);
        settings.contentId = contentId; // Override content ID
        applySettings(settings);
        addToHistory(settings);
      } catch (error) {
        console.error('Failed to import settings:', error);
      }
    };
    reader.readAsText(file);
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Check if we're in an input field
      if ((e.target as HTMLElement).tagName === 'INPUT') {
        return;
      }
      
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
      
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveSettings();
      }
      
      // R: Reset current page
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        resetCurrentPage();
      }
      
      // G: Toggle guides
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        setShowGuides(prev => !prev);
      }
      
      // Arrow keys: Navigate pages
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        handlePageChange(currentPage - 1);
      }
      if (e.key === 'ArrowRight' && currentPage < totalPages) {
        handlePageChange(currentPage + 1);
      }
      
      // +/-: Zoom
      if (e.key === '+' || e.key === '=') {
        setCurrentZoom(prev => Math.min(prev + 0.25, 4));
      }
      if (e.key === '-' || e.key === '_') {
        setCurrentZoom(prev => Math.max(prev - 0.25, 0.25));
      }
    };
    
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [currentPage, totalPages, undo, redo, resetCurrentPage]);
  
  return (
    <div ref={containerRef} className="min-h-screen bg-brand-gray-900 p-4">
      {/* Header Toolbar */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl p-4 border border-white/20 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">PDF Crop Editor</h1>
          
          <div className="flex items-center gap-4">
            {/* Undo/Redo */}
            <div className="flex gap-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition disabled:opacity-50"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-5 h-5" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition disabled:opacity-50"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-5 h-5" />
              </button>
            </div>
            
            {/* Reset */}
            <div className="flex gap-2">
              <button
                onClick={resetCurrentPage}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition"
                title="Reset Current Page (R)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={resetAll}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition"
              >
                Reset All
              </button>
            </div>
            
            {/* Guides Toggle */}
            <button
              onClick={() => setShowGuides(!showGuides)}
              className={`p-2 rounded transition ${
                showGuides
                  ? 'bg-brand-orange-500 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Toggle Guides (G)"
            >
              <Grid className="w-5 h-5" />
            </button>
            
            {/* Import/Export */}
            <div className="flex gap-2">
              <label className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition cursor-pointer">
                <Upload className="w-5 h-5" />
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importSettings(file);
                  }}
                />
              </label>
              <button
                onClick={exportSettings}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition"
                title="Export Settings"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
            
            {/* Save */}
            <button
              onClick={saveSettings}
              className="flex items-center gap-2 px-4 py-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded transition"
              title="Save (Ctrl+S)"
            >
              <Save className="w-5 h-5" />
              Save
            </button>
          </div>
        </div>
        
        {/* Keyboard Shortcuts Help */}
        <div className="mt-4 text-xs text-white/50">
          Shortcuts: Ctrl+Z (Undo) | Ctrl+Shift+Z (Redo) | Ctrl+S (Save) | R (Reset Page) | G (Guides) | ←→ (Navigate) | +/- (Zoom)
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PDF Viewer and Crop Selector */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl p-4 border border-white/20">
            <PDFViewer
              url={pdfUrl}
              page={currentPage}
              scale={currentZoom}
              onPageChange={handlePageChange}
              onDocumentLoad={setTotalPages}
            />
          </div>
          
          <ZoomControls
            currentZoom={currentZoom}
            onZoomChange={setCurrentZoom}
          />
        </div>
        
        {/* Controls and Preview */}
        <div className="space-y-4">
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl p-4 border border-white/20">
            <PreviewDisplay
              sourceImage={pdfUrl}
              cropSettings={currentCrop}
              zoom={currentZoom}
              showGuides={showGuides}
              backgroundColor={backgroundColor}
            />
          </div>
          
          <MultiPageEditor
            totalPages={totalPages}
            currentPage={currentPage}
            pageSettings={pageSettings}
            onPageChange={handlePageChange}
            onSettingsChange={handleSettingsChange}
            onBulkApply={handleBulkApply}
          />
        </div>
      </div>
    </div>
  );
}

export default PDFCropEditor;
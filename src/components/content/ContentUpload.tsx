'use client';

import { useState, useRef } from 'react';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { useCSRF } from '@/hooks/useCSRF';
import { getCSRFHeaders } from '@/lib/security/csrf';

interface ContentUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ContentUpload({ onClose, onSuccess }: ContentUploadProps) {
  const { csrfToken } = useCSRF();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [imageScale, setImageScale] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [imageSize, setImageSize] = useState<number>(100);
  const [imageDuration, setImageDuration] = useState<number>(10); // Default 10 seconds for images
  const [pdfScale, setPdfScale] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [pdfSize, setPdfSize] = useState<number>(100);
  const [pdfDuration, setPdfDuration] = useState<number>(15); // Default 15 seconds for PDFs
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ].join(',');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    setErrors([]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
    setErrors([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setErrors([]);
    const uploadErrors: string[] = [];
    let successCount = 0;

    // Ensure CSRF token meta is present (fetch if missing)
    try {
      const meta = document.querySelector('meta[name="csrf-token"]');
      if (!meta) {
        const res = await fetch('/api/auth/csrf');
        if (res.ok) {
          const data = await res.json();
          if (data?.csrfToken) {
            const m = document.createElement('meta');
            m.name = 'csrf-token';
            m.content = data.csrfToken;
            document.head.appendChild(m);
          }
        }
      }
    } catch {}

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      
      // Add background color, scale, and duration for image files
      if (file.type.startsWith('image/')) {
        formData.append('backgroundColor', backgroundColor);
        formData.append('imageScale', imageScale);
        formData.append('imageSize', imageSize.toString());
        formData.append('duration', imageDuration.toString());
      }
      
      // Add background color, scale, and duration for PDF files
      if (file.type === 'application/pdf') {
        formData.append('backgroundColor', backgroundColor);
        formData.append('pdfScale', pdfScale);
        formData.append('pdfSize', pdfSize.toString());
        formData.append('duration', pdfDuration.toString());
      }

      try {
        // Track upload progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }
        });

        // Create promise for upload
        const uploadPromise = new Promise<void>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              successCount++;
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          };
          xhr.onerror = () => reject(new Error('Upload failed'));
        });

        xhr.open('POST', '/api/content/upload');
        xhr.withCredentials = true;
        // Include CSRF token for security middleware
        const headers = getCSRFHeaders();
        const token = headers['x-csrf-token'] || csrfToken || '';
        if (token) {
          xhr.setRequestHeader('x-csrf-token', token);
        }
        xhr.send(formData);

        await uploadPromise;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        uploadErrors.push(`${file.name}: ${error instanceof Error ? error.message : 'Upload failed'}`);
      }
    }

    setUploading(false);
    setUploadProgress({});

    if (uploadErrors.length > 0) {
      setErrors(uploadErrors);
    }

    if (successCount > 0) {
      if (successCount === files.length) {
        onSuccess();
      } else {
        // Partial success
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white/[0.02] backdrop-blur-xl backdrop-saturate-150 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-white/20">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Upload Content</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-brand-orange-500/50 transition cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-white/50 mx-auto mb-4" />
            <p className="text-white mb-2">Drop files here or click to browse</p>
            <p className="text-white/50 text-sm">
              Supported: Images, Videos, PDFs, PowerPoint
            </p>
            <p className="text-white/50 text-sm mt-1">
              Max file size: 500MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-white font-semibold mb-3">Selected Files ({files.length})</h3>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <File className="w-5 h-5 text-white/70" />
                    <div className="flex-1">
                      <p className="text-white text-sm truncate">{file.name}</p>
                      <p className="text-white/50 text-xs">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  
                  {uploadProgress[file.name] !== undefined ? (
                    <div className="w-32">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-orange-500 transition-all duration-300"
                          style={{ width: `${uploadProgress[file.name]}%` }}
                        />
                      </div>
                      <p className="text-white/50 text-xs mt-1 text-center">
                        {Math.round(uploadProgress[file.name])}%
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="p-1 hover:bg-white/5 backdrop-blur-sm rounded transition-all"
                      disabled={uploading}
                    >
                      <X className="w-4 h-4 text-white/70" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Image Display Settings */}
          {files.some(file => file.type.startsWith('image/')) && (
            <div className="mt-6 space-y-4 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <h3 className="text-white font-semibold">Image Display Settings</h3>
              
              {/* Background Color Picker */}
              <div className="space-y-2">
                <label className="text-white text-sm">Background Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border-2 border-white/10"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-white/50 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>

              {/* Image Scale Options */}
              <div className="space-y-2">
                <label className="text-white text-sm">Image Scale</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setImageScale('contain')}
                    className={`px-3 py-2 rounded-lg border transition ${
                      imageScale === 'contain'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10 transition-all'
                    }`}
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageScale('cover')}
                    className={`px-3 py-2 rounded-lg border transition ${
                      imageScale === 'cover'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10 transition-all'
                    }`}
                  >
                    Fill
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageScale('fill')}
                    className={`px-3 py-2 rounded-lg border transition ${
                      imageScale === 'fill'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10 transition-all'
                    }`}
                  >
                    Stretch
                  </button>
                </div>
                <p className="text-white/50 text-xs mt-1">
                  {imageScale === 'contain' && 'Image will fit within display, maintaining aspect ratio'}
                  {imageScale === 'cover' && 'Image will fill display, cropping if necessary'}
                  {imageScale === 'fill' && 'Image will stretch to fill entire display'}
                </p>
              </div>

              {/* Image Size Slider (only for Fit mode) */}
              {imageScale === 'contain' && (
                <div className="space-y-2">
                  <label className="text-white text-sm">
                    Image Size: {imageSize}%
                  </label>
                  <div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={imageSize}
                      onChange={(e) => setImageSize(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #f56600 0%, #f56600 ${imageSize}%, rgba(255, 255, 255, 0.1) ${imageSize}%, rgba(255, 255, 255, 0.1) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-white/50 mt-1">
                      <span>10%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Default Display Duration */}
              <div className="space-y-2">
                <label className="text-white text-sm">Default Display Duration (seconds)</label>
                <input
                  type="number"
                  value={imageDuration}
                  onChange={(e) => setImageDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="300"
                  className="w-full px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-white/50 focus:bg-white/10 transition-all"
                  placeholder="10"
                />
                <p className="text-white/50 text-xs">
                  Default time to display this image in playlists (can be changed per playlist)
                </p>
              </div>
            </div>
          )}

          {/* PDF Display Settings */}
          {files.some(file => file.type === 'application/pdf') && (
            <div className="mt-6 space-y-4 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <h3 className="text-white font-semibold">PDF Display Settings</h3>
              
              {/* Background Color Picker */}
              <div className="space-y-2">
                <label className="text-white text-sm">Background Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border-2 border-white/10"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-white/50 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>

              {/* PDF Scale Options */}
              <div className="space-y-2">
                <label className="text-white text-sm">PDF Scale</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPdfScale('contain')}
                    className={`px-3 py-2 rounded-lg border transition ${
                      pdfScale === 'contain'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10 transition-all'
                    }`}
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfScale('cover')}
                    className={`px-3 py-2 rounded-lg border transition ${
                      pdfScale === 'cover'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10 transition-all'
                    }`}
                  >
                    Fill
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfScale('fill')}
                    className={`px-3 py-2 rounded-lg border transition ${
                      pdfScale === 'fill'
                        ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                        : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10 transition-all'
                    }`}
                  >
                    Stretch
                  </button>
                </div>
                <p className="text-white/50 text-xs mt-1">
                  {pdfScale === 'contain' && 'PDF will fit within display, maintaining aspect ratio'}
                  {pdfScale === 'cover' && 'PDF will fill display, cropping if necessary'}
                  {pdfScale === 'fill' && 'PDF will stretch to fill entire display'}
                </p>
              </div>

              {/* PDF Size Slider (only for Fit mode) */}
              {pdfScale === 'contain' && (
                <div className="space-y-2">
                  <label className="text-white text-sm">
                    PDF Size: {pdfSize}%
                  </label>
                  <div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={pdfSize}
                      onChange={(e) => setPdfSize(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #f56600 0%, #f56600 ${pdfSize}%, rgba(255, 255, 255, 0.1) ${pdfSize}%, rgba(255, 255, 255, 0.1) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-white/50 mt-1">
                      <span>10%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Default Display Duration for PDFs */}
              <div className="space-y-2">
                <label className="text-white text-sm">Default Display Duration (seconds per page)</label>
                <input
                  type="number"
                  value={pdfDuration}
                  onChange={(e) => setPdfDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="300"
                  className="w-full px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-white/50 focus:bg-white/10 transition-all"
                  placeholder="15"
                />
                <p className="text-white/50 text-xs">
                  Default time to display each PDF page in playlists (can be changed per playlist)
                </p>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-300 font-semibold mb-2">Upload Errors</p>
                  <ul className="space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-red-200 text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg backdrop-blur-sm transition-all"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className="px-6 py-2 bg-brand-orange-500/90 hover:bg-brand-orange-600 text-white rounded-lg backdrop-blur-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={files.length === 0 || uploading}
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

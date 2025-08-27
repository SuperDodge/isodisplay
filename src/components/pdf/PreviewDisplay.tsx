'use client';

import { useEffect, useRef, useState } from 'react';
import { CropSettings } from './CropSelector';

export interface PreviewDisplayProps {
  sourceImage: string | HTMLCanvasElement;
  cropSettings?: CropSettings;
  zoom?: number;
  aspectRatio?: number;
  showGuides?: boolean;
  backgroundColor?: string;
}

export function PreviewDisplay({
  sourceImage,
  cropSettings,
  zoom = 1,
  aspectRatio = 16 / 9,
  showGuides = true,
  backgroundColor = '#000000',
}: PreviewDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    // Calculate preview dimensions based on container
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        let width = containerWidth;
        let height = width / aspectRatio;
        
        if (height > containerHeight) {
          height = containerHeight;
          width = height * aspectRatio;
        }
        
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [aspectRatio]);

  useEffect(() => {
    const renderPreview = async () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Set canvas dimensions
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load and draw image
      if (typeof sourceImage === 'string') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          drawCroppedImage(ctx, img, canvas.width, canvas.height);
        };
        
        img.src = sourceImage;
      } else if (sourceImage instanceof HTMLCanvasElement) {
        drawCroppedImage(ctx, sourceImage, canvas.width, canvas.height);
      }
    };

    const drawCroppedImage = (
      ctx: CanvasRenderingContext2D,
      source: HTMLImageElement | HTMLCanvasElement,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      let sx = 0;
      let sy = 0;
      let sWidth = source.width;
      let sHeight = source.height;

      // Apply crop settings if provided
      if (cropSettings) {
        if (cropSettings.unit === '%') {
          sx = (source.width * cropSettings.x) / 100;
          sy = (source.height * cropSettings.y) / 100;
          sWidth = (source.width * cropSettings.width) / 100;
          sHeight = (source.height * cropSettings.height) / 100;
        } else {
          sx = cropSettings.x;
          sy = cropSettings.y;
          sWidth = cropSettings.width;
          sHeight = cropSettings.height;
        }
      }

      // Apply zoom
      const scaledWidth = sWidth * zoom;
      const scaledHeight = sHeight * zoom;

      // Calculate position to center the image
      const dx = (canvasWidth - scaledWidth) / 2;
      const dy = (canvasHeight - scaledHeight) / 2;

      // Draw the image
      ctx.drawImage(
        source,
        sx,
        sy,
        sWidth,
        sHeight,
        dx,
        dy,
        scaledWidth,
        scaledHeight
      );

      // Draw guides if enabled
      if (showGuides) {
        drawGuides(ctx, canvasWidth, canvasHeight);
      }
    };

    const drawGuides = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      // Draw rule of thirds guides
      const thirdWidth = width / 3;
      const thirdHeight = height / 3;

      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(thirdWidth, 0);
      ctx.lineTo(thirdWidth, height);
      ctx.moveTo(thirdWidth * 2, 0);
      ctx.lineTo(thirdWidth * 2, height);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, thirdHeight);
      ctx.lineTo(width, thirdHeight);
      ctx.moveTo(0, thirdHeight * 2);
      ctx.lineTo(width, thirdHeight * 2);
      ctx.stroke();

      // Reset line dash
      ctx.setLineDash([]);

      // Draw safe area (90% of screen)
      const safeMargin = width * 0.05;
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.strokeRect(
        safeMargin,
        safeMargin,
        width - safeMargin * 2,
        height - safeMargin * 2
      );
    };

    renderPreview();
  }, [sourceImage, cropSettings, zoom, dimensions, backgroundColor, showGuides]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-white font-semibold mb-2">16:9 Display Preview</h3>
        <p className="text-white/70 text-sm">
          Resolution: {dimensions.width.toFixed(0)} × {dimensions.height.toFixed(0)}
        </p>
      </div>
      
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full"
          style={{
            width: dimensions.width,
            height: dimensions.height,
          }}
        />
      </div>

      <div className="mt-4 p-3 bg-white/5 rounded-lg">
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
          <span>Aspect Ratio: {aspectRatio.toFixed(2)}</span>
          <span>{showGuides ? 'Guides: On' : 'Guides: Off'}</span>
        </div>
      </div>
    </div>
  );
}

export default PreviewDisplay;
'use client';

import { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: 'px' | '%';
}

export interface CropSelectorProps {
  imageUrl: string;
  initialCrop?: CropSettings;
  aspectRatio?: number;
  onCropChange?: (crop: CropSettings) => void;
  onCropComplete?: (crop: CropSettings) => void;
  locked?: boolean;
}

export function CropSelector({
  imageUrl,
  initialCrop,
  aspectRatio = 16 / 9,
  onCropChange,
  onCropComplete,
  locked = false,
}: CropSelectorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Initialize crop when image loads
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    
    if (initialCrop) {
      setCrop(initialCrop as Crop);
    } else {
      // Center crop with aspect ratio
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspectRatio,
          width,
          height
        ),
        width,
        height
      );
      setCrop(crop);
    }
    setImageLoaded(true);
  };

  // Handle crop changes
  const handleCropChange = (newCrop: Crop) => {
    setCrop(newCrop);
    
    if (onCropChange && imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      
      // Convert to percentage for storage
      const cropSettings: CropSettings = {
        x: (newCrop.x / naturalWidth) * 100,
        y: (newCrop.y / naturalHeight) * 100,
        width: (newCrop.width / naturalWidth) * 100,
        height: (newCrop.height / naturalHeight) * 100,
        unit: '%',
      };
      
      onCropChange(cropSettings);
    }
  };

  // Handle crop complete
  const handleCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
    
    if (onCropComplete && imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      
      // Convert to percentage for storage
      const cropSettings: CropSettings = {
        x: (crop.x / naturalWidth) * 100,
        y: (crop.y / naturalHeight) * 100,
        width: (crop.width / naturalWidth) * 100,
        height: (crop.height / naturalHeight) * 100,
        unit: '%',
      };
      
      onCropComplete(cropSettings);
    }
  };

  // Generate cropped image preview
  const getCroppedImage = (): string | null => {
    if (!completedCrop || !imgRef.current) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return canvas.toDataURL('image/jpeg');
  };

  return (
    <div className="relative">
      <ReactCrop
        crop={crop}
        onChange={(c) => handleCropChange(c)}
        onComplete={(c) => handleCropComplete(c)}
        aspect={aspectRatio}
        disabled={locked}
        className="max-w-full"
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Crop preview"
          onLoad={onImageLoad}
          className="max-w-full h-auto"
          style={{ maxHeight: '70vh' }}
        />
      </ReactCrop>

      {/* Crop Info */}
      {imageLoaded && crop && (
        <div className="absolute top-4 right-4 bg-black/75 text-white p-3 rounded-lg text-sm">
          <div>X: {Math.round(crop.x)}px</div>
          <div>Y: {Math.round(crop.y)}px</div>
          <div>W: {Math.round(crop.width)}px</div>
          <div>H: {Math.round(crop.height)}px</div>
          <div className="mt-2 text-xs text-white/70">
            Aspect: {aspectRatio.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}

export default CropSelector;
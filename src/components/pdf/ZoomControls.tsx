'use client';

import { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';

export interface ZoomControlsProps {
  currentZoom: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  onZoomChange: (zoom: number) => void;
  presets?: number[];
}

export function ZoomControls({
  currentZoom,
  minZoom = 0.25,
  maxZoom = 4,
  zoomStep = 0.25,
  onZoomChange,
  presets = [0.5, 0.75, 1, 1.25, 1.5, 2],
}: ZoomControlsProps) {
  const [customZoom, setCustomZoom] = useState(currentZoom.toString());

  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoom + zoomStep, maxZoom);
    onZoomChange(newZoom);
    setCustomZoom(newZoom.toString());
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom - zoomStep, minZoom);
    onZoomChange(newZoom);
    setCustomZoom(newZoom.toString());
  };

  const handleFitToScreen = () => {
    onZoomChange(1);
    setCustomZoom('1');
  };

  const handlePresetClick = (preset: number) => {
    onZoomChange(preset);
    setCustomZoom(preset.toString());
  };

  const handleCustomZoomChange = (value: string) => {
    setCustomZoom(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= minZoom && numValue <= maxZoom) {
      onZoomChange(numValue);
    }
  };

  const handleCustomZoomBlur = () => {
    const numValue = parseFloat(customZoom);
    if (isNaN(numValue) || numValue < minZoom || numValue > maxZoom) {
      setCustomZoom(currentZoom.toString());
    }
  };

  const zoomPercentage = Math.round(currentZoom * 100);

  return (
    <div className="flex items-center gap-4 p-4 bg-white/10 rounded-lg">
      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        disabled={currentZoom <= minZoom}
        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="Zoom Out"
      >
        <ZoomOut className="w-5 h-5" />
      </button>

      {/* Zoom Slider */}
      <input
        type="range"
        min={minZoom}
        max={maxZoom}
        step={zoomStep / 4}
        value={currentZoom}
        onChange={(e) => {
          const value = parseFloat(e.target.value);
          onZoomChange(value);
          setCustomZoom(value.toString());
        }}
        className="w-32 accent-brand-orange-500"
      />

      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        disabled={currentZoom >= maxZoom}
        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="Zoom In"
      >
        <ZoomIn className="w-5 h-5" />
      </button>

      {/* Current Zoom Display */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customZoom}
          onChange={(e) => handleCustomZoomChange(e.target.value)}
          onBlur={handleCustomZoomBlur}
          className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-center text-sm"
        />
        <span className="text-white text-sm">({zoomPercentage}%)</span>
      </div>

      {/* Separator */}
      <div className="h-8 w-px bg-white/20" />

      {/* Preset Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-white/70 text-sm">Presets:</span>
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            className={`px-3 py-1 rounded text-sm transition ${
              Math.abs(currentZoom - preset) < 0.01
                ? 'bg-brand-orange-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {Math.round(preset * 100)}%
          </button>
        ))}
      </div>

      {/* Fit to Screen Button */}
      <button
        onClick={handleFitToScreen}
        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition"
        title="Fit to Screen"
      >
        <Maximize className="w-5 h-5" />
      </button>
    </div>
  );
}

export default ZoomControls;
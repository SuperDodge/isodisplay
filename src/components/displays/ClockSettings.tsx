'use client';

import { useState, useEffect } from 'react';
import { Clock, Move, Palette, Type } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { FilterableSelect } from '@/components/ui/filterable-select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface ClockConfig {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  size: 'small' | 'medium' | 'large' | 'extra-large';
  format: '12h' | '24h';
  showSeconds: boolean;
  showDate: boolean;
  opacity: number; // 0-100
  color: string; // hex color
  backgroundColor: string; // hex color with alpha
  fontFamily: 'system' | 'digital' | 'mono';
  offsetX: number; // pixels from edge
  offsetY: number; // pixels from edge
}

interface ClockSettingsProps {
  settings: ClockConfig;
  onChange: (settings: ClockConfig) => void;
  resolution?: string;
}

const DEFAULT_SETTINGS: ClockConfig = {
  enabled: false,
  position: 'top-right',
  size: 'medium',
  format: '12h',
  showSeconds: true,
  showDate: false,
  opacity: 80,
  color: '#FFFFFF',
  backgroundColor: '#000000',
  fontFamily: 'digital',
  offsetX: 20,
  offsetY: 20,
};

const POSITION_OPTIONS = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'bottom-center', label: 'Bottom Center' },
];

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra Large' },
];

const FONT_OPTIONS = [
  { value: 'system', label: 'System Default' },
  { value: 'digital', label: 'Digital Clock' },
  { value: 'mono', label: 'Monospace' },
];

export function ClockSettings({ settings, onChange, resolution = '1920x1080' }: ClockSettingsProps) {
  const [localSettings, setLocalSettings] = useState<ClockConfig>({
    ...DEFAULT_SETTINGS,
    ...settings,
  });

  useEffect(() => {
    setLocalSettings({
      ...DEFAULT_SETTINGS,
      ...settings,
    });
  }, [settings]);

  const handleChange = (updates: Partial<ClockConfig>) => {
    const newSettings = { ...localSettings, ...updates };
    setLocalSettings(newSettings);
    onChange(newSettings);
  };

  return (
    <div className="space-y-4">
      {/* Enable/Disable Clock */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/70" />
          <Label htmlFor="clock-enabled" className="text-white">
            Enable Floating Clock
          </Label>
        </div>
        <Switch
          id="clock-enabled"
          checked={localSettings.enabled}
          onCheckedChange={(checked) => handleChange({ enabled: checked })}
        />
      </div>

      {localSettings.enabled && (
        <Card className="bg-white/5 border-white/20 p-4 space-y-4">
          {/* Position and Layout */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70 text-sm flex items-center gap-2 mb-2">
                <Move className="w-3 h-3" />
                Position
              </Label>
              <FilterableSelect
                value={localSettings.position}
                onValueChange={(value) => handleChange({ position: value as ClockConfig['position'] })}
                options={POSITION_OPTIONS}
                placeholder="Select position"
                searchPlaceholder="Search positions..."
                triggerClassName="bg-white/10 border-white/20 text-white text-sm"
                emptyMessage="No positions found."
              />
            </div>

            <div>
              <Label className="text-white/70 text-sm flex items-center gap-2 mb-2">
                <Type className="w-3 h-3" />
                Size
              </Label>
              <FilterableSelect
                value={localSettings.size}
                onValueChange={(value) => handleChange({ size: value as ClockConfig['size'] })}
                options={SIZE_OPTIONS}
                placeholder="Select size"
                searchPlaceholder="Search sizes..."
                triggerClassName="bg-white/10 border-white/20 text-white text-sm"
                emptyMessage="No sizes found."
              />
            </div>
          </div>

          {/* Format Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70 text-sm mb-2">Time Format</Label>
              <FilterableSelect
                value={localSettings.format}
                onValueChange={(value) => handleChange({ format: value as ClockConfig['format'] })}
                options={[
                  { value: '12h', label: '12 Hour (AM/PM)' },
                  { value: '24h', label: '24 Hour' },
                ]}
                placeholder="Select format"
                searchPlaceholder="Search formats..."
                triggerClassName="bg-white/10 border-white/20 text-white text-sm"
                emptyMessage="No formats found."
              />
            </div>

            <div>
              <Label className="text-white/70 text-sm mb-2">Font Style</Label>
              <FilterableSelect
                value={localSettings.fontFamily}
                onValueChange={(value) => handleChange({ fontFamily: value as ClockConfig['fontFamily'] })}
                options={FONT_OPTIONS}
                placeholder="Select font"
                searchPlaceholder="Search fonts..."
                triggerClassName="bg-white/10 border-white/20 text-white text-sm"
                emptyMessage="No fonts found."
              />
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white/70 text-sm">Show Seconds</Label>
              <Switch
                checked={localSettings.showSeconds}
                onCheckedChange={(checked) => handleChange({ showSeconds: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-white/70 text-sm">Show Date</Label>
              <Switch
                checked={localSettings.showDate}
                onCheckedChange={(checked) => handleChange({ showDate: checked })}
              />
            </div>
          </div>

          {/* Opacity */}
          <div>
            <Label className="text-white/70 text-sm flex items-center gap-2 mb-2">
              <Palette className="w-3 h-3" />
              Opacity: {localSettings.opacity}%
            </Label>
            <Slider
              value={[localSettings.opacity]}
              onValueChange={([value]) => handleChange({ opacity: value })}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Offset from edges */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70 text-sm mb-2">
                Horizontal Offset: {localSettings.offsetX}px
              </Label>
              <Slider
                value={[localSettings.offsetX]}
                onValueChange={([value]) => handleChange({ offsetX: value })}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-white/70 text-sm mb-2">
                Vertical Offset: {localSettings.offsetY}px
              </Label>
              <Slider
                value={[localSettings.offsetY]}
                onValueChange={([value]) => handleChange({ offsetY: value })}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Preview */}
          <ClockPreview settings={localSettings} resolution={resolution} />
        </Card>
      )}
    </div>
  );
}

// Clock Preview Component
function ClockPreview({ settings, resolution }: { settings: ClockConfig; resolution: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      hour: settings.format === '12h' ? 'numeric' : '2-digit',
      minute: '2-digit',
      ...(settings.showSeconds && { second: '2-digit' }),
      ...(settings.format === '12h' && { hour12: true }),
    };
    return time.toLocaleTimeString('en-US', options);
  };

  const formatDate = () => {
    return time.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFontSize = () => {
    switch (settings.size) {
      case 'small': return 'text-sm';
      case 'medium': return 'text-lg';
      case 'large': return 'text-2xl';
      case 'extra-large': return 'text-4xl';
      default: return 'text-lg';
    }
  };

  const getFontFamily = () => {
    switch (settings.fontFamily) {
      case 'digital': return 'font-mono tracking-wider';
      case 'mono': return 'font-mono';
      case 'system': return 'font-sans';
      default: return 'font-sans';
    }
  };

  const getPosition = () => {
    const base = 'absolute';
    switch (settings.position) {
      case 'top-left': return `${base} top-2 left-2`;
      case 'top-right': return `${base} top-2 right-2`;
      case 'bottom-left': return `${base} bottom-2 left-2`;
      case 'bottom-right': return `${base} bottom-2 right-2`;
      case 'top-center': return `${base} top-2 left-1/2 -translate-x-1/2`;
      case 'bottom-center': return `${base} bottom-2 left-1/2 -translate-x-1/2`;
      default: return `${base} top-2 right-2`;
    }
  };

  return (
    <div className="mt-4">
      <Label className="text-white/70 text-sm mb-2">Preview</Label>
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
        
        {/* Clock Display */}
        <div
          className={`${getPosition()} ${getFontSize()} ${getFontFamily()} text-white p-2 rounded-md transition-all duration-300`}
          style={{
            opacity: settings.opacity / 100,
            backgroundColor: `${settings.backgroundColor}40`,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div>{formatTime()}</div>
          {settings.showDate && (
            <div className="text-xs opacity-80">{formatDate()}</div>
          )}
        </div>

        {/* TV Content Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
          Display Content
        </div>
      </div>
    </div>
  );
}

export default ClockSettings;
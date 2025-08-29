'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DurationInputProps {
  value: number; // in seconds
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: 'seconds' | 'mmss' | 'auto';
  showButtons?: boolean;
  className?: string;
  disabled?: boolean;
}

export function DurationInput({
  value,
  onChange,
  min = 1,
  max = 3600,
  step = 1,
  format = 'auto',
  showButtons = true,
  className = '',
  disabled = false,
}: DurationInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Format seconds to display string
  const formatDuration = useCallback((seconds: number): string => {
    if (format === 'seconds') {
      return seconds.toString();
    }

    if (format === 'mmss' || (format === 'auto' && seconds >= 60)) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    return seconds.toString();
  }, [format]);

  // Parse input string to seconds
  const parseDuration = useCallback((input: string): number | null => {
    // Remove whitespace
    input = input.trim();

    // Check for mm:ss format
    if (input.includes(':')) {
      const parts = input.split(':');
      if (parts.length !== 2) return null;

      const mins = parseInt(parts[0]);
      const secs = parseInt(parts[1]);

      if (isNaN(mins) || isNaN(secs)) return null;
      if (secs >= 60) return null;

      return mins * 60 + secs;
    }

    // Parse as seconds
    const seconds = parseInt(input);
    if (isNaN(seconds)) return null;

    return seconds;
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    if (!isEditing) {
      setInputValue(formatDuration(value));
    }
  }, [value, isEditing, formatDuration]);

  // Validate and update value
  const handleChange = useCallback((newValue: string) => {
    setInputValue(newValue);
    setError('');

    // Don't validate while typing
    if (!newValue) {
      setError('Duration is required');
      return;
    }

    const parsed = parseDuration(newValue);
    if (parsed === null) {
      setError('Invalid format. Use seconds or mm:ss');
      return;
    }

    if (parsed < min) {
      setError(`Minimum duration is ${min} seconds`);
      return;
    }

    if (parsed > max) {
      setError(`Maximum duration is ${max} seconds`);
      return;
    }

    // Valid value - update parent
    onChange(parsed);
  }, [min, max, onChange, parseDuration]);

  // Handle blur event
  const handleBlur = useCallback(() => {
    setIsEditing(false);

    if (!inputValue) {
      setInputValue(formatDuration(value));
      setError('');
      return;
    }

    const parsed = parseDuration(inputValue);
    if (parsed === null || parsed < min || parsed > max) {
      // Reset to original value
      setInputValue(formatDuration(value));
      setError('');
    } else {
      // Update to formatted value
      setInputValue(formatDuration(parsed));
      if (parsed !== value) {
        onChange(parsed);
      }
    }
  }, [inputValue, value, min, max, onChange, parseDuration, formatDuration]);

  // Handle increment/decrement
  const handleIncrement = useCallback(() => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  }, [value, step, max, onChange]);

  const handleDecrement = useCallback(() => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  }, [value, step, min, onChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    } else if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }, [handleIncrement, handleDecrement]);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showButtons && (
        <Button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
        >
          <Minus className="w-3 h-3" />
        </Button>
      )}

      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`w-20 !h-10 px-2 text-center bg-white/10 border-white/20 text-white text-sm ${
            error ? 'border-red-500' : ''
          }`}
          placeholder="0:00"
        />
        
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-400 whitespace-nowrap z-10 bg-brand-gray-900 px-2 py-1 rounded">
            {error}
          </div>
        )}
      </div>

      {showButtons && (
        <Button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
        >
          <Plus className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

export default DurationInput;
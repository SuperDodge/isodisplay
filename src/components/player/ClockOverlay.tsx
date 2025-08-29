'use client';

import { useState, useEffect } from 'react';
import type { ClockConfig } from '../displays/ClockSettings';

interface ClockOverlayProps {
  settings: ClockConfig;
}

export function ClockOverlay({ settings }: ClockOverlayProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!settings.enabled) return;
    
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [settings.enabled]);

  if (!settings.enabled) {
    return null;
  }

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
      year: 'numeric',
    });
  };

  const getFontSize = () => {
    switch (settings.size) {
      case 'small': return '1.5rem';
      case 'medium': return '2.5rem';
      case 'large': return '3.5rem';
      case 'extra-large': return '5rem';
      default: return '2.5rem';
    }
  };

  const getFontFamily = () => {
    switch (settings.fontFamily) {
      case 'digital': 
        return '"Courier New", Courier, monospace';
      case 'mono': 
        return 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';
      case 'system': 
      default:
        return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    }
  };

  const getPosition = () => {
    const offsetX = `${settings.offsetX}px`;
    const offsetY = `${settings.offsetY}px`;
    
    switch (settings.position) {
      case 'top-left': 
        return { top: offsetY, left: offsetX };
      case 'top-right': 
        return { top: offsetY, right: offsetX };
      case 'bottom-left': 
        return { bottom: offsetY, left: offsetX };
      case 'bottom-right': 
        return { bottom: offsetY, right: offsetX };
      case 'top-center': 
        return { 
          top: offsetY, 
          left: '50%', 
          transform: 'translateX(-50%)' 
        };
      case 'bottom-center': 
        return { 
          bottom: offsetY, 
          left: '50%', 
          transform: 'translateX(-50%)' 
        };
      default: 
        return { top: offsetY, right: offsetX };
    }
  };

  return (
    <div
      className="clock-overlay"
      style={{
        position: 'fixed',
        ...getPosition(),
        opacity: settings.opacity / 100,
        fontFamily: getFontFamily(),
        fontSize: getFontSize(),
        color: settings.color || '#FFFFFF',
        backgroundColor: `${settings.backgroundColor || '#000000'}66`,
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        pointerEvents: 'none',
        userSelect: 'none',
        textAlign: 'center',
        lineHeight: 1.2,
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ fontWeight: 'bold' }}>{formatTime()}</div>
      {settings.showDate && (
        <div style={{ 
          fontSize: '0.5em', 
          opacity: 0.8, 
          marginTop: '0.25rem' 
        }}>
          {formatDate()}
        </div>
      )}
    </div>
  );
}

export default ClockOverlay;
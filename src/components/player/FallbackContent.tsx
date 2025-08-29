'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Wifi, Image, FileText, Video, RefreshCw } from 'lucide-react';

interface FallbackContentProps {
  type: 'no-content' | 'loading-error' | 'network-error' | 'format-error' | 'timeout' | 'websocket-disconnected';
  message?: string;
  displayName?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
  autoRetrySeconds?: number;
  isConnected?: boolean;
}

export function FallbackContent({ 
  type, 
  message, 
  displayName,
  onRetry,
  showRetryButton = false,
  autoRetrySeconds,
  isConnected = false
}: FallbackContentProps) {
  const [timeRemaining, setTimeRemaining] = useState(autoRetrySeconds || 0);

  // Auto-retry countdown
  useEffect(() => {
    if (autoRetrySeconds && onRetry) {
      setTimeRemaining(autoRetrySeconds);
      
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onRetry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [autoRetrySeconds, onRetry]);

  const getIcon = () => {
    switch (type) {
      case 'no-content':
        return <Image className="w-16 h-16 text-gray-400" />;
      case 'loading-error':
        return <AlertTriangle className="w-16 h-16 text-orange-500" />;
      case 'network-error':
        return <Wifi className="w-16 h-16 text-red-500" />;
      case 'format-error':
        return <FileText className="w-16 h-16 text-yellow-500" />;
      case 'timeout':
        return <Clock className="w-16 h-16 text-brand-orange-500" />;
      case 'websocket-disconnected':
        return <Wifi className="w-16 h-16 text-red-500" />;
      default:
        return <AlertTriangle className="w-16 h-16 text-gray-500" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'no-content':
        return 'No Content Available';
      case 'loading-error':
        return 'Content Loading Error';
      case 'network-error':
        return 'Network Connection Error';
      case 'format-error':
        return 'Unsupported Content Format';
      case 'timeout':
        return 'Loading Timeout';
      case 'websocket-disconnected':
        return 'Connection Lost';
      default:
        return 'Display Error';
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'no-content':
        return 'This display has no content assigned. Please assign a playlist from the admin interface.';
      case 'loading-error':
        return 'The content could not be loaded. Please check that all media files are accessible and try again.';
      case 'network-error':
        return 'Unable to connect to the server. Please check your network connection and try again.';
      case 'format-error':
        return 'The content format is not supported by this display. Please use supported formats (images, videos, PDFs).';
      case 'timeout':
        return 'Content loading timed out. This may be due to large file sizes or slow network connection.';
      case 'websocket-disconnected':
        return 'Real-time connection to the server has been lost. Some features may not work properly.';
      default:
        return 'An error occurred while displaying content.';
    }
  };

  const getCurrentTime = () => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(new Date());
  };

  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Special simplified display for no-content - matches ISOMER BRAND SIGNATURE - GREY
  if (type === 'no-content') {
    return (
      <div className="min-h-screen bg-gray-800 flex flex-col items-center justify-center text-white relative">
        {/* Main Logo/Brand - Isomer style */}
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="text-7xl font-bold tracking-wider text-white mb-2">
              ISOMER
            </div>
            <div className="text-2xl tracking-widest text-white/80">
              DIGITAL SIGNAGE
            </div>
          </div>
        </div>

        {/* Bottom message */}
        <div className="pb-8">
          <p className="text-sm text-white/60">
            No Playlist Assigned to this Display
          </p>
        </div>

        {/* WebSocket connection indicator - top right */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className={`w-2 h-2 rounded-full ${
              isConnected 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-red-500'
            }`}></span>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Regular fallback content for other error types
  return (
    <div className="min-h-screen bg-brand-gray-900 flex items-center justify-center text-white relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto p-8 text-center space-y-8 relative z-10">
        {/* Icon */}
        <div className="flex justify-center">
          {getIcon()}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold">
          {getTitle()}
        </h1>

        {/* Message */}
        <p className="text-xl text-gray-300 leading-relaxed max-w-lg mx-auto">
          {message || getDefaultMessage()}
        </p>

        {/* Display name */}
        {displayName && (
          <div className="text-lg text-gray-400">
            Display: <span className="text-white font-medium">{displayName}</span>
          </div>
        )}

        {/* Auto-retry countdown */}
        {autoRetrySeconds && timeRemaining > 0 && (
          <div className="flex items-center justify-center gap-3 text-brand-orange-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Retrying in {timeRemaining} seconds...</span>
          </div>
        )}

        {/* Manual retry button */}
        {showRetryButton && onRetry && !timeRemaining && (
          <button
            onClick={onRetry}
            className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white py-3 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}

        {type === 'network-error' && (
          <div className="bg-gray-800/50 rounded-lg p-6 text-left space-y-3">
            <h3 className="text-lg font-semibold text-red-400">Troubleshooting:</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Check network cable connection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Verify WiFi connection if wireless</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Confirm server is accessible</span>
              </li>
            </ul>
          </div>
        )}

        {/* Current time */}
        <div className="text-2xl font-mono text-gray-400 border-t border-gray-800 pt-6">
          {currentTime}
        </div>

        {/* Branding */}
        <div className="text-sm text-gray-500">
          IsoDisplay Digital Signage
        </div>
      </div>

      {/* Corner indicators */}
      <div className="absolute top-4 left-4 text-xs text-gray-500">
        Status: {type.replace('-', ' ').toUpperCase()}
      </div>
      
      <div className="absolute top-4 right-4 flex items-center gap-4 text-xs text-gray-500">
        {/* WebSocket connection indicator */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            isConnected 
              ? 'bg-green-500 animate-pulse' 
              : 'bg-red-500'
          }`}></span>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <span>{new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
}

export default FallbackContent;
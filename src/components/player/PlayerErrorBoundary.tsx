'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { errorReporter } from '@/lib/services/error-reporter';

interface Props {
  children: ReactNode;
  displayId: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  connectionStatus: 'online' | 'offline' | 'checking';
}

class PlayerErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      connectionStatus: 'online'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Player error boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report error to backend
    errorReporter.reportPlayerError(
      this.props.displayId,
      error,
      errorInfo.componentStack
    );

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry if within retry limit
    if (this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }

    // Check connection status
    this.checkConnectionStatus();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // Reset error state if displayId changes (new display loaded)
    if (prevProps.displayId !== this.props.displayId && this.state.hasError) {
      this.resetErrorState();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  checkConnectionStatus = async () => {
    this.setState({ connectionStatus: 'checking' });
    
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        this.setState({ connectionStatus: 'online' });
      } else {
        this.setState({ connectionStatus: 'offline' });
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      this.setState({ connectionStatus: 'offline' });
    }
  };

  scheduleRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.setState({ isRetrying: true });

    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }));
      
      this.retry();
    }, this.retryDelay);
  };

  retry = () => {
    console.log(`Retrying... (Attempt ${this.state.retryCount + 1}/${this.maxRetries})`);
    this.resetErrorState();
  };

  resetErrorState = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false
    });
  };

  handleManualRetry = () => {
    this.setState({ retryCount: 0 });
    this.retry();
  };

  handleRefreshPage = () => {
    window.location.reload();
  };

  getErrorMessage = (error: Error | null): string => {
    if (!error) return 'An unknown error occurred';

    // Network-related errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Network connection error. Please check your internet connection.';
    }

    // Playlist-related errors
    if (error.message.includes('playlist') || error.message.includes('content')) {
      return 'Content loading error. The playlist or media files may be unavailable.';
    }

    // WebSocket-related errors
    if (error.message.includes('websocket') || error.message.includes('socket')) {
      return 'Real-time connection error. Some features may not work properly.';
    }

    // Media playback errors
    if (error.message.includes('video') || error.message.includes('audio') || error.message.includes('media')) {
      return 'Media playback error. The content format may not be supported.';
    }

    // PDF rendering errors
    if (error.message.includes('pdf') || error.message.includes('PDF')) {
      return 'PDF rendering error. The document may be corrupted or unsupported.';
    }

    // Generic error
    return error.message || 'An unexpected error occurred in the display player.';
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.getErrorMessage(this.state.error);
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <div className="max-w-md mx-auto p-8 text-center space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-red-400">
              Display Error
            </h1>

            {/* Error Message */}
            <p className="text-gray-300 leading-relaxed">
              {errorMessage}
            </p>

            {/* Connection Status */}
            <div className="flex items-center justify-center gap-2 text-sm">
              {this.state.connectionStatus === 'online' ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-400">Connected</span>
                </>
              ) : this.state.connectionStatus === 'offline' ? (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-400">Offline</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-yellow-500" />
                  <span className="text-yellow-400">Checking connection...</span>
                </>
              )}
            </div>

            {/* Retry Information */}
            {this.state.isRetrying && (
              <div className="flex items-center justify-center gap-2 text-sm text-yellow-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Retrying in {Math.ceil(this.retryDelay / 1000)} seconds...</span>
              </div>
            )}

            {/* Retry Count */}
            {this.state.retryCount > 0 && (
              <p className="text-sm text-gray-400">
                Retry attempts: {this.state.retryCount}/{this.maxRetries}
              </p>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {canRetry && !this.state.isRetrying && (
                <button
                  onClick={this.handleManualRetry}
                  className="w-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              )}

              <button
                onClick={this.handleRefreshPage}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Refresh Page
              </button>

              <button
                onClick={this.checkConnectionStatus}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
              >
                Check Connection
              </button>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mt-6">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-4 bg-gray-900 rounded text-xs text-red-300 overflow-auto max-h-40">
                  <div className="font-bold">Error:</div>
                  <div className="mb-2">{this.state.error.toString()}</div>
                  {this.state.errorInfo && (
                    <>
                      <div className="font-bold">Stack Trace:</div>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            {/* Display Info */}
            <div className="text-xs text-gray-500 border-t border-gray-800 pt-4">
              Display ID: {this.props.displayId}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PlayerErrorBoundary;
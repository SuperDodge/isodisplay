/**
 * Error reporting service for tracking and logging display errors
 */

interface ErrorReport {
  displayId: string;
  displayName?: string;
  errorType: 'player' | 'network' | 'content' | 'websocket' | 'system';
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  userAgent: string;
  url: string;
}

class ErrorReporter {
  private static instance: ErrorReporter;
  private errorQueue: ErrorReport[] = [];
  private isOnline = true;
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushErrors();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      // Flush errors every 30 seconds if online
      this.flushInterval = setInterval(() => {
        if (this.isOnline && this.errorQueue.length > 0) {
          this.flushErrors();
        }
      }, 30000);
    }
  }

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  /**
   * Report an error to the backend
   */
  async reportError(
    displayId: string,
    errorType: ErrorReport['errorType'],
    error: Error | string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const errorReport: ErrorReport = {
      displayId,
      errorType,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    // Add to queue
    this.errorQueue.push(errorReport);

    // Try to send immediately if online
    if (this.isOnline) {
      await this.flushErrors();
    }
  }

  /**
   * Send queued errors to the backend
   */
  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];

    try {
      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors: errorsToSend }),
      });

      if (!response.ok) {
        // Put errors back in queue if sending failed
        this.errorQueue.unshift(...errorsToSend);
        console.error('Failed to send error reports:', response.statusText);
      }
    } catch (error) {
      // Put errors back in queue if network error
      this.errorQueue.unshift(...errorsToSend);
      console.error('Failed to send error reports:', error);
    }
  }

  /**
   * Report a player error
   */
  reportPlayerError(displayId: string, error: Error, componentStack?: string): void {
    this.reportError(displayId, 'player', error, {
      componentStack,
      errorBoundary: true
    });
  }

  /**
   * Report a network error
   */
  reportNetworkError(displayId: string, url: string, statusCode?: number): void {
    this.reportError(displayId, 'network', `Network error: ${url}`, {
      url,
      statusCode,
      online: this.isOnline
    });
  }

  /**
   * Report a content loading error
   */
  reportContentError(displayId: string, contentUrl: string, contentType: string, error: string): void {
    this.reportError(displayId, 'content', error, {
      contentUrl,
      contentType,
      timestamp: Date.now()
    });
  }

  /**
   * Report a WebSocket error
   */
  reportWebSocketError(displayId: string, event: string, error: string): void {
    this.reportError(displayId, 'websocket', error, {
      event,
      connectionState: this.isOnline ? 'online' : 'offline'
    });
  }

  /**
   * Get error statistics for a display
   */
  getErrorStats(displayId: string): {
    total: number;
    byType: Record<string, number>;
  } {
    const displayErrors = this.errorQueue.filter(e => e.displayId === displayId);
    const byType: Record<string, number> = {};

    displayErrors.forEach(error => {
      byType[error.errorType] = (byType[error.errorType] || 0) + 1;
    });

    return {
      total: displayErrors.length,
      byType
    };
  }

  /**
   * Clear error queue
   */
  clearQueue(): void {
    this.errorQueue = [];
  }

  /**
   * Cleanup on unmount
   */
  cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushErrors();
  }
}

export const errorReporter = ErrorReporter.getInstance();
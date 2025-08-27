// Performance optimizations specifically for Raspberry Pi hardware
// These optimizations help reduce memory usage and improve rendering performance

export interface PerformanceConfig {
  // Memory management
  maxCacheSize: number; // MB
  maxConcurrentImages: number;
  maxImageResolution: { width: number; height: number };
  
  // Rendering optimizations
  useHardwareAcceleration: boolean;
  enableImageCompression: boolean;
  compressionQuality: number; // 0-100
  
  // Resource management
  enableResourceCleanup: boolean;
  cleanupInterval: number; // seconds
  maxIdleTime: number; // seconds before cleanup
  
  // Network optimizations
  enablePrefetching: boolean;
  maxConcurrentDownloads: number;
  connectionTimeout: number; // milliseconds
  
  // Display optimizations
  enableVsync: boolean;
  targetFrameRate: number;
  enableReducedMotion: boolean;
}

// Default configuration for different Pi models
export const PI_CONFIGS: Record<string, PerformanceConfig> = {
  'pi-zero': {
    maxCacheSize: 64,
    maxConcurrentImages: 2,
    maxImageResolution: { width: 1920, height: 1080 },
    useHardwareAcceleration: false,
    enableImageCompression: true,
    compressionQuality: 70,
    enableResourceCleanup: true,
    cleanupInterval: 30,
    maxIdleTime: 60,
    enablePrefetching: false,
    maxConcurrentDownloads: 1,
    connectionTimeout: 10000,
    enableVsync: false,
    targetFrameRate: 30,
    enableReducedMotion: true
  },
  'pi-3': {
    maxCacheSize: 128,
    maxConcurrentImages: 3,
    maxImageResolution: { width: 1920, height: 1080 },
    useHardwareAcceleration: true,
    enableImageCompression: true,
    compressionQuality: 80,
    enableResourceCleanup: true,
    cleanupInterval: 60,
    maxIdleTime: 120,
    enablePrefetching: true,
    maxConcurrentDownloads: 2,
    connectionTimeout: 8000,
    enableVsync: true,
    targetFrameRate: 30,
    enableReducedMotion: false
  },
  'pi-4': {
    maxCacheSize: 256,
    maxConcurrentImages: 4,
    maxImageResolution: { width: 3840, height: 2160 },
    useHardwareAcceleration: true,
    enableImageCompression: false,
    compressionQuality: 90,
    enableResourceCleanup: true,
    cleanupInterval: 120,
    maxIdleTime: 300,
    enablePrefetching: true,
    maxConcurrentDownloads: 3,
    connectionTimeout: 5000,
    enableVsync: true,
    targetFrameRate: 60,
    enableReducedMotion: false
  },
  'pi-5': {
    maxCacheSize: 512,
    maxConcurrentImages: 6,
    maxImageResolution: { width: 3840, height: 2160 },
    useHardwareAcceleration: true,
    enableImageCompression: false,
    compressionQuality: 95,
    enableResourceCleanup: true,
    cleanupInterval: 180,
    maxIdleTime: 600,
    enablePrefetching: true,
    maxConcurrentDownloads: 4,
    connectionTimeout: 5000,
    enableVsync: true,
    targetFrameRate: 60,
    enableReducedMotion: false
  },
  'default': {
    maxCacheSize: 128,
    maxConcurrentImages: 3,
    maxImageResolution: { width: 1920, height: 1080 },
    useHardwareAcceleration: true,
    enableImageCompression: true,
    compressionQuality: 80,
    enableResourceCleanup: true,
    cleanupInterval: 60,
    maxIdleTime: 120,
    enablePrefetching: true,
    maxConcurrentDownloads: 2,
    connectionTimeout: 8000,
    enableVsync: true,
    targetFrameRate: 30,
    enableReducedMotion: false
  }
};

class PerformanceOptimizer {
  private config: PerformanceConfig;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private cacheSize: number = 0; // Current cache size in bytes
  private lastCleanup: number = Date.now();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private preloadQueue: Set<string> = new Set();
  private activeDownloads: number = 0;

  constructor(deviceType?: string) {
    this.config = PI_CONFIGS[deviceType || 'default'] || PI_CONFIGS['default'];
    this.initializeOptimizations();
  }

  private initializeOptimizations() {
    // Set up hardware acceleration hints
    if (this.config.useHardwareAcceleration) {
      this.enableHardwareAcceleration();
    }

    // Start cleanup interval
    if (this.config.enableResourceCleanup) {
      this.startCleanupInterval();
    }

    // Apply CSS optimizations
    this.applyCSSOptimizations();

    // Set up memory monitoring
    this.setupMemoryMonitoring();
  }

  private enableHardwareAcceleration() {
    // Apply hardware acceleration styles to body
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        * {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        img, video {
          image-rendering: optimizeSpeed;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: optimize-contrast;
          transform: translateZ(0);
        }
        
        .transition-container {
          will-change: transform, opacity;
          transform: translateZ(0);
        }
      `;
      document.head.appendChild(style);
    }
  }

  private applyCSSOptimizations() {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        /* Performance optimizations for Pi hardware */
        * {
          ${this.config.enableReducedMotion ? 'animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;' : ''}
        }
        
        /* Optimize rendering */
        img {
          image-rendering: ${this.config.useHardwareAcceleration ? 'auto' : 'pixelated'};
          max-width: ${this.config.maxImageResolution.width}px;
          max-height: ${this.config.maxImageResolution.height}px;
        }
        
        /* Reduce GPU load */
        .player-container {
          ${this.config.enableVsync ? 'contain: layout style paint;' : ''}
        }
      `;
      document.head.appendChild(style);
    }
  }

  private startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval * 1000);
  }

  private setupMemoryMonitoring() {
    if ('performance' in window && 'memory' in (window.performance as any)) {
      setInterval(() => {
        const memory = (window.performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        
        if (usedMB > this.config.maxCacheSize * 0.8) {
          console.warn('High memory usage detected, performing cleanup');
          this.performCleanup();
        }
      }, 10000); // Check every 10 seconds
    }
  }

  // Image optimization and caching
  async optimizeAndCacheImage(url: string, maxWidth?: number, maxHeight?: number): Promise<HTMLImageElement> {
    const cacheKey = `${url}-${maxWidth || 'auto'}-${maxHeight || 'auto'}`;
    
    // Return cached image if available
    if (this.imageCache.has(cacheKey)) {
      const cached = this.imageCache.get(cacheKey)!;
      return cached;
    }

    // Check if we can start a new download
    if (this.activeDownloads >= this.config.maxConcurrentDownloads) {
      throw new Error('Too many concurrent downloads');
    }

    this.activeDownloads++;

    try {
      const img = await this.loadOptimizedImage(url, maxWidth, maxHeight);
      
      // Add to cache if there's space
      if (this.imageCache.size < this.config.maxConcurrentImages) {
        this.imageCache.set(cacheKey, img);
        this.cacheSize += this.estimateImageSize(img);
      }
      
      return img;
    } finally {
      this.activeDownloads--;
    }
  }

  private async loadOptimizedImage(url: string, maxWidth?: number, maxHeight?: number): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        reject(new Error(`Image load timeout: ${url}`));
      }, this.config.connectionTimeout);

      img.onload = () => {
        clearTimeout(timeout);
        
        // Resize if necessary
        if (this.shouldResizeImage(img, maxWidth, maxHeight)) {
          const resized = this.resizeImage(img, maxWidth, maxHeight);
          resolve(resized);
        } else {
          resolve(img);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  }

  private shouldResizeImage(img: HTMLImageElement, maxWidth?: number, maxHeight?: number): boolean {
    const maxW = maxWidth || this.config.maxImageResolution.width;
    const maxH = maxHeight || this.config.maxImageResolution.height;
    
    return img.naturalWidth > maxW || img.naturalHeight > maxH;
  }

  private resizeImage(img: HTMLImageElement, maxWidth?: number, maxHeight?: number): HTMLImageElement {
    const maxW = maxWidth || this.config.maxImageResolution.width;
    const maxH = maxHeight || this.config.maxImageResolution.height;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Calculate optimal dimensions
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    
    // Draw resized image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Create new image from canvas
    const resizedImg = new Image();
    resizedImg.src = canvas.toDataURL('image/jpeg', this.config.compressionQuality / 100);
    
    return resizedImg;
  }

  private estimateImageSize(img: HTMLImageElement): number {
    // Rough estimation: width * height * 4 bytes (RGBA)
    return img.naturalWidth * img.naturalHeight * 4;
  }

  // Preloading with queue management
  async preloadImage(url: string): Promise<void> {
    if (!this.config.enablePrefetching) return;
    
    if (this.preloadQueue.has(url)) return;
    
    this.preloadQueue.add(url);
    
    try {
      await this.optimizeAndCacheImage(url);
    } catch (error) {
      console.warn('Preload failed:', url, error);
    } finally {
      this.preloadQueue.delete(url);
    }
  }

  // Resource cleanup
  private performCleanup() {
    const now = Date.now();
    const maxAge = this.config.maxIdleTime * 1000;
    
    // Clear old cache entries
    for (const [key, img] of this.imageCache.entries()) {
      if (now - this.lastCleanup > maxAge) {
        this.imageCache.delete(key);
        this.cacheSize -= this.estimateImageSize(img);
      }
    }
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
    
    this.lastCleanup = now;
    
    console.log(`Cleanup performed. Cache size: ${this.imageCache.size} images, ${Math.round(this.cacheSize / 1024 / 1024)}MB`);
  }

  // Get performance statistics
  getPerformanceStats() {
    return {
      cacheSize: this.imageCache.size,
      cacheSizeMB: Math.round(this.cacheSize / 1024 / 1024),
      activeDownloads: this.activeDownloads,
      preloadQueueSize: this.preloadQueue.size,
      config: this.config,
      memory: 'performance' in window && 'memory' in (window.performance as any) 
        ? {
            used: Math.round((window.performance as any).memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round((window.performance as any).memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round((window.performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
          }
        : null
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart cleanup interval if changed
    if (newConfig.cleanupInterval && this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.startCleanupInterval();
    }
  }

  // Detect device type from user agent
  static detectDeviceType(): string {
    if (typeof navigator === 'undefined') return 'default';
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('raspberry')) {
      if (userAgent.includes('pi 5')) return 'pi-5';
      if (userAgent.includes('pi 4')) return 'pi-4';
      if (userAgent.includes('pi 3')) return 'pi-3';
      if (userAgent.includes('pi zero')) return 'pi-zero';
      return 'pi-4'; // Default to Pi 4 for unknown Pi models
    }
    
    // Detect by available RAM/CPU (rough estimation)
    if ('deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory <= 1) return 'pi-zero';
      if (memory <= 2) return 'pi-3';
      if (memory <= 4) return 'pi-4';
      return 'pi-5';
    }
    
    return 'default';
  }

  // Cleanup on destroy
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.imageCache.clear();
    this.preloadQueue.clear();
    this.cacheSize = 0;
  }
}

// Global performance optimizer instance
let globalOptimizer: PerformanceOptimizer | null = null;

export function getPerformanceOptimizer(): PerformanceOptimizer {
  if (!globalOptimizer) {
    const deviceType = PerformanceOptimizer.detectDeviceType();
    globalOptimizer = new PerformanceOptimizer(deviceType);
    
    console.log(`Performance optimizer initialized for device: ${deviceType}`);
  }
  
  return globalOptimizer;
}

export { PerformanceOptimizer };
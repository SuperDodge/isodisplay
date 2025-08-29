// Performance optimization utilities for Raspberry Pi hardware

import { useState, useEffect, useCallback } from 'react';

interface PerformanceConfig {
  enableGPUAcceleration: boolean;
  enablePreloading: boolean;
  enableMemoryOptimization: boolean;
  enableQualityDegradation: boolean;
  maxPreloadItems: number;
  memoryThreshold: number; // MB
  frameRateThreshold: number; // FPS
  qualityLevels: {
    high: QualitySettings;
    medium: QualitySettings;
    low: QualitySettings;
  };
}

interface QualitySettings {
  imageQuality: number; // 0-100
  transitionDuration: number; // ms
  enableAnimations: boolean;
  enableShadows: boolean;
  enableBlur: boolean;
  maxResolution: { width: number; height: number };
}

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  gpuUsage?: number;
  frameDrops: number;
  renderTime: number;
}

class PerformanceOptimizer {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private currentQuality: 'high' | 'medium' | 'low';
  private frameTimestamps: number[] = [];
  private rafId: number | null = null;
  private observers: Set<(metrics: PerformanceMetrics) => void> = new Set();

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      enableGPUAcceleration: true,
      enablePreloading: true,
      enableMemoryOptimization: true,
      enableQualityDegradation: true,
      maxPreloadItems: 2,
      memoryThreshold: 256, // 256MB for Pi
      frameRateThreshold: 30,
      qualityLevels: {
        high: {
          imageQuality: 100,
          transitionDuration: 1000,
          enableAnimations: true,
          enableShadows: true,
          enableBlur: true,
          maxResolution: { width: 1920, height: 1080 },
        },
        medium: {
          imageQuality: 80,
          transitionDuration: 500,
          enableAnimations: true,
          enableShadows: false,
          enableBlur: false,
          maxResolution: { width: 1280, height: 720 },
        },
        low: {
          imageQuality: 60,
          transitionDuration: 200,
          enableAnimations: false,
          enableShadows: false,
          enableBlur: false,
          maxResolution: { width: 854, height: 480 },
        },
      },
      ...config,
    };

    this.metrics = {
      fps: 60,
      memoryUsage: 0,
      cpuUsage: 0,
      frameDrops: 0,
      renderTime: 0,
    };

    this.currentQuality = 'high';
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window !== 'undefined') {
      this.startFrameRateMonitoring();
      this.startMemoryMonitoring();
      this.applyGPUOptimizations();
    }
  }

  private startFrameRateMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFPS = (currentTime: number) => {
      frameCount++;
      this.frameTimestamps.push(currentTime);

      // Keep only last 60 frames
      if (this.frameTimestamps.length > 60) {
        this.frameTimestamps.shift();
      }

      // Calculate FPS every second
      if (currentTime - lastTime >= 1000) {
        this.metrics.fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;

        // Check for frame drops
        this.detectFrameDrops();

        // Auto-adjust quality if needed
        if (this.config.enableQualityDegradation) {
          this.adjustQualityBasedOnPerformance();
        }

        // Notify observers
        this.notifyObservers();
      }

      this.rafId = requestAnimationFrame(measureFPS);
    };

    this.rafId = requestAnimationFrame(measureFPS);
  }

  private detectFrameDrops() {
    if (this.frameTimestamps.length < 2) return;

    let drops = 0;
    for (let i = 1; i < this.frameTimestamps.length; i++) {
      const delta = this.frameTimestamps[i] - this.frameTimestamps[i - 1];
      if (delta > 33.33) { // More than 2 frames at 60fps
        drops++;
      }
    }
    this.metrics.frameDrops = drops;
  }

  private startMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          this.metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1048576); // Convert to MB
        }
      }, 5000);
    }
  }

  private adjustQualityBasedOnPerformance() {
    const { fps, memoryUsage, frameDrops } = this.metrics;

    // Downgrade quality if performance is poor
    if (fps < 20 || frameDrops > 10 || memoryUsage > this.config.memoryThreshold) {
      if (this.currentQuality === 'high') {
        this.setQuality('medium');
      } else if (this.currentQuality === 'medium') {
        this.setQuality('low');
      }
    }
    // Upgrade quality if performance improves
    else if (fps > 50 && frameDrops < 2 && memoryUsage < this.config.memoryThreshold * 0.7) {
      if (this.currentQuality === 'low') {
        this.setQuality('medium');
      } else if (this.currentQuality === 'medium') {
        this.setQuality('high');
      }
    }
  }

  private applyGPUOptimizations() {
    if (!this.config.enableGPUAcceleration) return;

    // Add GPU acceleration hints to document
    const style = document.createElement('style');
    style.textContent = `
      .gpu-accelerated {
        will-change: transform, opacity;
        transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        perspective: 1000px;
      }
      
      .gpu-transition {
        transform: translate3d(0, 0, 0);
        -webkit-transform: translate3d(0, 0, 0);
      }
      
      /* Optimize for Pi's VideoCore GPU */
      video, img, canvas {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      }
      
      /* Disable expensive effects in low quality mode */
      .quality-low * {
        box-shadow: none !important;
        text-shadow: none !important;
        filter: none !important;
        backdrop-filter: none !important;
      }
      
      .quality-medium * {
        backdrop-filter: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  public setQuality(level: 'high' | 'medium' | 'low') {
    this.currentQuality = level;
    document.body.className = document.body.className.replace(/quality-\w+/, '');
    document.body.classList.add(`quality-${level}`);
    
    // Dispatch custom event for components to react
    window.dispatchEvent(new CustomEvent('qualitychange', { 
      detail: { 
        level, 
        settings: this.config.qualityLevels[level] 
      } 
    }));
  }

  public getQualitySettings(): QualitySettings {
    return this.config.qualityLevels[this.currentQuality];
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers() {
    this.observers.forEach(callback => callback(this.getMetrics()));
  }

  public optimizeImage(src: string, quality?: 'high' | 'medium' | 'low'): string {
    const level = quality || this.currentQuality;
    const settings = this.config.qualityLevels[level];
    
    // Add quality parameters to image URL if it's a local image
    if (src.startsWith('/') || src.startsWith('http')) {
      const url = new URL(src, window.location.origin);
      url.searchParams.set('q', settings.imageQuality.toString());
      url.searchParams.set('w', settings.maxResolution.width.toString());
      url.searchParams.set('h', settings.maxResolution.height.toString());
      return url.toString();
    }
    
    return src;
  }

  public preloadContent(urls: string[]): Promise<void[]> {
    if (!this.config.enablePreloading) return Promise.resolve([]);

    const preloadPromises = urls.slice(0, this.config.maxPreloadItems).map(url => {
      return new Promise<void>((resolve, reject) => {
        // Skip YouTube URLs and external URLs from preloading
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          resolve(); // Don't preload YouTube content
          return;
        }

        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to preload ${url}`));
          img.src = this.optimizeImage(url);
        } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error(`Failed to preload ${url}`));
          video.src = url;
        } else if (url.startsWith('/') || url.startsWith('http')) {
          // Only preload local content or same-origin URLs
          fetch(url, { method: 'HEAD' })
            .then(() => resolve())
            .catch(() => resolve()); // Don't fail the whole preload if one URL fails
        } else {
          resolve(); // Skip unknown content types
        }
      });
    });

    return Promise.all(preloadPromises);
  }

  public cleanupMemory() {
    if (!this.config.enableMemoryOptimization) return;

    // Force garbage collection if available (requires --expose-gc flag)
    if (typeof (global as any).gc === 'function') {
      (global as any).gc();
    }

    // Clear image cache
    const images = document.querySelectorAll('img[src]');
    images.forEach((img: HTMLImageElement, index) => {
      // Keep only visible images
      const rect = img.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (!isVisible && index > 10) {
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      }
    });

    // Clear video elements not in use
    const videos = document.querySelectorAll('video');
    videos.forEach((video: HTMLVideoElement) => {
      if (video.paused && !video.classList.contains('active')) {
        video.src = '';
        video.load();
      }
    });
  }

  public destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.observers.clear();
  }
}

// Singleton instance
let performanceOptimizer: PerformanceOptimizer | null = null;

export function getPerformanceOptimizer(config?: Partial<PerformanceConfig>): PerformanceOptimizer {
  if (!performanceOptimizer) {
    performanceOptimizer = new PerformanceOptimizer(config);
  }
  return performanceOptimizer;
}

// React hook for performance optimization
export function usePerformanceOptimization() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    cpuUsage: 0,
    frameDrops: 0,
    renderTime: 0,
  });

  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    const optimizer = getPerformanceOptimizer();
    
    // Subscribe to metrics updates
    const unsubscribe = optimizer.subscribe(setMetrics);
    
    // Listen for quality changes
    const handleQualityChange = (event: CustomEvent) => {
      setQuality(event.detail.level);
    };
    
    window.addEventListener('qualitychange', handleQualityChange as EventListener);
    
    return () => {
      unsubscribe();
      window.removeEventListener('qualitychange', handleQualityChange as EventListener);
    };
  }, []);

  return {
    metrics,
    quality,
    optimizer: getPerformanceOptimizer(),
  };
}

// Utility functions for Raspberry Pi specific optimizations
export const piOptimizations = {
  // Enable hardware video decoding
  enableHardwareDecoding(video: HTMLVideoElement) {
    video.setAttribute('playsinline', 'true');
    video.setAttribute('muted', 'true');
    video.setAttribute('x-webkit-airplay', 'allow');
    // Force GPU decoding on Chromium
    if ('webkitDecodedFrameCount' in video) {
      video.setAttribute('x5-video-player-type', 'h5');
      video.setAttribute('x5-video-player-fullscreen', 'true');
    }
  },

  // Optimize canvas for Pi's GPU
  optimizeCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    });
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      (ctx as any).webkitImageSmoothingEnabled = false;
      (ctx as any).mozImageSmoothingEnabled = false;
    }
    return ctx;
  },

  // Check if running on Raspberry Pi
  isRaspberryPi(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('raspbian') || 
           userAgent.includes('armv7l') || 
           userAgent.includes('armv8l') ||
           userAgent.includes('aarch64');
  },

  // Get recommended settings for Pi model
  getRecommendedSettings(): Partial<PerformanceConfig> {
    // Detect Pi model based on available memory
    const memory = (performance as any).memory?.jsHeapSizeLimit || 0;
    const memoryGB = memory / (1024 * 1024 * 1024);

    if (memoryGB < 1) {
      // Pi Zero or Pi 1
      return {
        maxPreloadItems: 1,
        memoryThreshold: 128,
        frameRateThreshold: 24,
        enableBlur: false,
        enableShadows: false,
      };
    } else if (memoryGB < 2) {
      // Pi 2 or Pi 3
      return {
        maxPreloadItems: 2,
        memoryThreshold: 256,
        frameRateThreshold: 30,
      };
    } else {
      // Pi 4 or Pi 5
      return {
        maxPreloadItems: 3,
        memoryThreshold: 512,
        frameRateThreshold: 30,
      };
    }
  },
};

export default PerformanceOptimizer;
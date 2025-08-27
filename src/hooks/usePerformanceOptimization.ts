'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getPerformanceOptimizer, PerformanceOptimizer, PerformanceConfig } from '@/lib/performance/pi-optimizations';

interface PerformanceStats {
  cacheSize: number;
  cacheSizeMB: number;
  activeDownloads: number;
  preloadQueueSize: number;
  config: PerformanceConfig;
  memory: {
    used: number;
    total: number;
    limit: number;
  } | null;
  frameRate?: number;
  lastFrameTime?: number;
}

export function usePerformanceOptimization() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isOptimized, setIsOptimized] = useState(false);
  const optimizerRef = useRef<PerformanceOptimizer | null>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());
  const frameRateRef = useRef(0);

  // Initialize optimizer
  useEffect(() => {
    optimizerRef.current = getPerformanceOptimizer();
    setIsOptimized(true);

    // Start frame rate monitoring
    const monitorFrameRate = () => {
      frameCountRef.current++;
      const now = Date.now();
      const elapsed = now - lastFrameTimeRef.current;
      
      if (elapsed >= 1000) {
        frameRateRef.current = Math.round((frameCountRef.current * 1000) / elapsed);
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }
      
      requestAnimationFrame(monitorFrameRate);
    };
    
    requestAnimationFrame(monitorFrameRate);

    return () => {
      if (optimizerRef.current) {
        optimizerRef.current.destroy();
      }
    };
  }, []);

  // Update stats periodically
  useEffect(() => {
    if (!optimizerRef.current) return;

    const updateStats = () => {
      if (optimizerRef.current) {
        const performanceStats = optimizerRef.current.getPerformanceStats();
        setStats({
          ...performanceStats,
          frameRate: frameRateRef.current,
          lastFrameTime: lastFrameTimeRef.current
        });
      }
    };

    updateStats(); // Initial update
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isOptimized]);

  // Optimize image loading
  const optimizeImage = useCallback(async (url: string, maxWidth?: number, maxHeight?: number): Promise<HTMLImageElement> => {
    if (!optimizerRef.current) {
      throw new Error('Performance optimizer not initialized');
    }
    
    return optimizerRef.current.optimizeAndCacheImage(url, maxWidth, maxHeight);
  }, []);

  // Preload images
  const preloadImage = useCallback(async (url: string): Promise<void> => {
    if (!optimizerRef.current) return;
    
    return optimizerRef.current.preloadImage(url);
  }, []);

  // Preload multiple images
  const preloadImages = useCallback(async (urls: string[]): Promise<void> => {
    if (!optimizerRef.current) return;
    
    const promises = urls.map(url => preloadImage(url));
    await Promise.allSettled(promises);
  }, [preloadImage]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<PerformanceConfig>) => {
    if (!optimizerRef.current) return;
    
    optimizerRef.current.updateConfig(newConfig);
  }, []);

  // Check if device needs optimization
  const needsOptimization = useCallback((): boolean => {
    if (!stats) return true;
    
    return (
      stats.memory ? stats.memory.used > stats.memory.limit * 0.8 : false ||
      stats.frameRate ? stats.frameRate < stats.config.targetFrameRate * 0.8 : false ||
      stats.cacheSizeMB > stats.config.maxCacheSize * 0.9
    );
  }, [stats]);

  // Get optimization recommendations
  const getOptimizationRecommendations = useCallback((): string[] => {
    if (!stats) return [];
    
    const recommendations: string[] = [];
    
    if (stats.memory && stats.memory.used > stats.memory.limit * 0.8) {
      recommendations.push('High memory usage detected. Consider reducing cache size or image quality.');
    }
    
    if (stats.frameRate && stats.frameRate < stats.config.targetFrameRate * 0.8) {
      recommendations.push('Low frame rate detected. Consider enabling reduced motion or hardware acceleration.');
    }
    
    if (stats.cacheSizeMB > stats.config.maxCacheSize * 0.9) {
      recommendations.push('Cache size approaching limit. Consider reducing max concurrent images.');
    }
    
    if (stats.activeDownloads >= stats.config.maxConcurrentDownloads) {
      recommendations.push('Maximum concurrent downloads reached. Some content may load slowly.');
    }
    
    return recommendations;
  }, [stats]);

  // Apply automatic optimizations
  const applyAutoOptimizations = useCallback(() => {
    if (!stats || !optimizerRef.current) return;
    
    const newConfig: Partial<PerformanceConfig> = {};
    
    // Reduce quality if memory is high
    if (stats.memory && stats.memory.used > stats.memory.limit * 0.8) {
      newConfig.compressionQuality = Math.max(50, stats.config.compressionQuality - 10);
      newConfig.maxConcurrentImages = Math.max(1, stats.config.maxConcurrentImages - 1);
    }
    
    // Enable reduced motion if frame rate is low
    if (stats.frameRate && stats.frameRate < stats.config.targetFrameRate * 0.7) {
      newConfig.enableReducedMotion = true;
      newConfig.targetFrameRate = Math.max(15, stats.config.targetFrameRate - 5);
    }
    
    // Reduce concurrent downloads if performance is poor
    if (stats.frameRate && stats.frameRate < 20) {
      newConfig.maxConcurrentDownloads = Math.max(1, stats.config.maxConcurrentDownloads - 1);
    }
    
    if (Object.keys(newConfig).length > 0) {
      updateConfig(newConfig);
      console.log('Applied automatic optimizations:', newConfig);
    }
  }, [stats, updateConfig]);

  // Force cleanup
  const forceCleanup = useCallback(() => {
    if (!optimizerRef.current) return;
    
    // Trigger immediate cleanup through private method access
    (optimizerRef.current as any).performCleanup();
  }, []);

  return {
    stats,
    isOptimized,
    optimizeImage,
    preloadImage,
    preloadImages,
    updateConfig,
    needsOptimization,
    getOptimizationRecommendations,
    applyAutoOptimizations,
    forceCleanup
  };
}

// Hook for monitoring device performance
export function useDevicePerformance() {
  const [deviceInfo, setDeviceInfo] = useState<{
    type: string;
    memory?: number;
    cores?: number;
    connection?: string;
    battery?: number;
  } | null>(null);
  
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    fps: number;
    memoryUsage: number;
    networkSpeed: number;
    cpuUsage?: number;
  } | null>(null);

  useEffect(() => {
    // Detect device information
    const detectDevice = () => {
      const info: any = {
        type: PerformanceOptimizer.detectDeviceType()
      };

      // Device memory
      if ('deviceMemory' in navigator) {
        info.memory = (navigator as any).deviceMemory;
      }

      // CPU cores
      if ('hardwareConcurrency' in navigator) {
        info.cores = navigator.hardwareConcurrency;
      }

      // Network connection
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        info.connection = connection.effectiveType;
      }

      // Battery level
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          info.battery = Math.round(battery.level * 100);
        });
      }

      setDeviceInfo(info);
    };

    detectDevice();

    // Monitor performance metrics
    let frameCount = 0;
    let lastTime = Date.now();
    
    const updateMetrics = () => {
      frameCount++;
      const now = Date.now();
      
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        
        const metrics: any = {
          fps,
          memoryUsage: 0,
          networkSpeed: 0
        };

        // Memory usage
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          metrics.memoryUsage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
        }

        // Network speed (rough estimate based on connection)
        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
          metrics.networkSpeed = connection.downlink || 0;
        }

        setPerformanceMetrics(metrics);
        
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(updateMetrics);
    };
    
    requestAnimationFrame(updateMetrics);
  }, []);

  return {
    deviceInfo,
    performanceMetrics
  };
}
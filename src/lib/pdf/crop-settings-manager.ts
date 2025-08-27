import { prisma } from '@/lib/prisma';
import { CropSettings } from '@/components/pdf/CropSelector';
import { PageSettings } from '@/components/pdf/MultiPageEditor';

export interface ContentCropSettings {
  contentId: string;
  globalSettings?: {
    aspectRatio?: number;
    backgroundColor?: string;
    defaultZoom?: number;
  };
  pageSettings: PageSettings[];
  createdAt: Date;
  updatedAt: Date;
}

export class CropSettingsManager {
  // Save crop settings to database
  async saveCropSettings(
    contentId: string,
    settings: Partial<ContentCropSettings>
  ): Promise<void> {
    try {
      const cropData = {
        globalSettings: settings.globalSettings || {},
        pageSettings: settings.pageSettings || [],
        updatedAt: new Date(),
      };

      await prisma.content.update({
        where: { id: contentId },
        data: {
          cropSettings: cropData as any,
        },
      });
    } catch (error) {
      console.error('Error saving crop settings:', error);
      throw new Error('Failed to save crop settings');
    }
  }

  // Load crop settings from database
  async loadCropSettings(contentId: string): Promise<ContentCropSettings | null> {
    try {
      const content = await prisma.content.findUnique({
        where: { id: contentId },
        select: { cropSettings: true },
      });

      if (!content || !content.cropSettings) {
        return null;
      }

      const settings = content.cropSettings as any;
      
      return {
        contentId,
        globalSettings: settings.globalSettings || {},
        pageSettings: settings.pageSettings || [],
        createdAt: settings.createdAt || new Date(),
        updatedAt: settings.updatedAt || new Date(),
      };
    } catch (error) {
      console.error('Error loading crop settings:', error);
      return null;
    }
  }

  // Update page-specific settings
  async updatePageSettings(
    contentId: string,
    pageNumber: number,
    settings: Partial<PageSettings>
  ): Promise<void> {
    const currentSettings = await this.loadCropSettings(contentId);
    
    const pageSettings = currentSettings?.pageSettings || [];
    const existingIndex = pageSettings.findIndex(p => p.pageNumber === pageNumber);
    
    if (existingIndex >= 0) {
      pageSettings[existingIndex] = {
        ...pageSettings[existingIndex],
        ...settings,
        pageNumber,
      };
    } else {
      pageSettings.push({
        pageNumber,
        ...settings,
      } as PageSettings);
    }

    await this.saveCropSettings(contentId, {
      ...currentSettings,
      pageSettings,
    });
  }

  // Bulk update settings for multiple pages
  async bulkUpdatePageSettings(
    contentId: string,
    pageNumbers: number[],
    settings: Partial<PageSettings>
  ): Promise<void> {
    const currentSettings = await this.loadCropSettings(contentId);
    const pageSettings = currentSettings?.pageSettings || [];

    pageNumbers.forEach(pageNumber => {
      const existingIndex = pageSettings.findIndex(p => p.pageNumber === pageNumber);
      
      if (existingIndex >= 0) {
        pageSettings[existingIndex] = {
          ...pageSettings[existingIndex],
          ...settings,
          pageNumber,
        };
      } else {
        pageSettings.push({
          pageNumber,
          ...settings,
        } as PageSettings);
      }
    });

    await this.saveCropSettings(contentId, {
      ...currentSettings,
      pageSettings,
    });
  }

  // Export settings as JSON
  exportSettings(settings: ContentCropSettings): string {
    return JSON.stringify(settings, null, 2);
  }

  // Import settings from JSON
  importSettings(jsonString: string): ContentCropSettings {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Validate structure
      if (!parsed.contentId || !Array.isArray(parsed.pageSettings)) {
        throw new Error('Invalid settings format');
      }
      
      return parsed as ContentCropSettings;
    } catch (error) {
      throw new Error('Failed to parse settings JSON');
    }
  }

  // Generate preview data for display
  generatePreviewData(
    settings: ContentCropSettings,
    pageNumber: number
  ): {
    crop?: CropSettings;
    zoom?: number;
    rotation?: number;
    backgroundColor?: string;
  } {
    const pageSettings = settings.pageSettings.find(p => p.pageNumber === pageNumber);
    const globalSettings = settings.globalSettings || {};

    return {
      crop: pageSettings?.crop,
      zoom: pageSettings?.zoom || globalSettings.defaultZoom || 1,
      rotation: pageSettings?.rotation || 0,
      backgroundColor: globalSettings.backgroundColor || '#000000',
    };
  }

  // Calculate optimal crop for aspect ratio
  calculateOptimalCrop(
    sourceWidth: number,
    sourceHeight: number,
    targetAspectRatio: number = 16 / 9
  ): CropSettings {
    const sourceAspect = sourceWidth / sourceHeight;
    
    let cropWidth: number;
    let cropHeight: number;
    
    if (sourceAspect > targetAspectRatio) {
      // Source is wider, crop horizontally
      cropHeight = sourceHeight;
      cropWidth = cropHeight * targetAspectRatio;
    } else {
      // Source is taller, crop vertically
      cropWidth = sourceWidth;
      cropHeight = cropWidth / targetAspectRatio;
    }
    
    // Center the crop
    const x = (sourceWidth - cropWidth) / 2;
    const y = (sourceHeight - cropHeight) / 2;
    
    return {
      x: (x / sourceWidth) * 100,
      y: (y / sourceHeight) * 100,
      width: (cropWidth / sourceWidth) * 100,
      height: (cropHeight / sourceHeight) * 100,
      unit: '%',
    };
  }

  // Clone settings from one content to another
  async cloneSettings(
    sourceContentId: string,
    targetContentId: string
  ): Promise<void> {
    const sourceSettings = await this.loadCropSettings(sourceContentId);
    
    if (!sourceSettings) {
      throw new Error('Source settings not found');
    }
    
    await this.saveCropSettings(targetContentId, {
      ...sourceSettings,
      contentId: targetContentId,
    });
  }

  // Reset all settings for content
  async resetSettings(contentId: string): Promise<void> {
    await prisma.content.update({
      where: { id: contentId },
      data: {
        cropSettings: null,
      },
    });
  }
}

// Export singleton instance
export const cropSettingsManager = new CropSettingsManager();
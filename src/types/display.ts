export interface Display {
  id: string;
  name: string;
  description?: string;
  location?: string;
  uniqueUrl: string;
  resolution: Resolution;
  orientation: Orientation;
  assignedPlaylistId?: string;
  assignedPlaylist?: any;
  status: DisplayStatus;
  lastSeen?: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
  settings?: DisplaySettings;
  clockSettings?: any; // JSON clock configuration
}

export type Resolution = '1920x1080' | '1080x1920' | '3840x2160' | '2160x3840' | 'custom';
export type Orientation = 'LANDSCAPE' | 'PORTRAIT';
export type DisplayStatus = 'online' | 'offline' | 'unknown' | 'error';

export interface DisplaySettings {
  brightness?: number; // 0-100
  volume?: number; // 0-100
  scheduleEnabled?: boolean;
  schedule?: {
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    daysOfWeek: number[]; // 0-6, Sunday-Saturday
  };
  refreshInterval?: number; // seconds
  errorReporting?: boolean;
  debugMode?: boolean;
}

export interface CreateDisplayInput {
  name: string;
  location?: string;
  resolution?: Resolution;
  orientation?: Orientation;
  assignedPlaylistId?: string;
  clockSettings?: any;
}

export interface UpdateDisplayInput {
  name?: string;
  location?: string;
  resolution?: Resolution;
  orientation?: Orientation;
  assignedPlaylistId?: string | null;
  clockSettings?: any;
}

export const RESOLUTION_OPTIONS = [
  { value: '1920x1080', label: 'Full HD (1920×1080)' },
  { value: '1080x1920', label: 'Full HD Portrait (1080×1920)' },
  { value: '3840x2160', label: '4K (3840×2160)' },
  { value: '2160x3840', label: '4K Portrait (2160×3840)' },
  { value: 'custom', label: 'Custom Resolution' },
];
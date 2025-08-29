export type TransitionEffect = 
  | 'cut' 
  | 'fade' 
  | 'crossfade' 
  | 'dissolve' 
  | 'wipe' 
  | 'zoom' 
  | 'push' 
  | 'slide-over' 
  | 'iris' 
  | 'morph' 
  | 'burn' 
  | 'barn-doors' 
  | 'page-roll' 
  | 'peel';

export interface PlaylistItem {
  id: string;
  contentId: string;
  order: number;
  duration: number; // in seconds
  transition: TransitionEffect;
  transitionDuration: number; // in seconds
  title: string;
  thumbnail?: string;
  contentType: 'image' | 'video' | 'pdf';
  cropSettings?: any; // Will be replaced with actual crop settings type
  backgroundColor?: string;
  imageScale?: 'contain' | 'cover' | 'fill';
  imageSize?: number;
  content?: {
    fileUrl: string;
    backgroundColor?: string;
    metadata?: {
      imageSize?: number;
      imageScale?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  items: PlaylistItem[];
  totalDuration: number; // calculated field
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  sharedWith: string[]; // user IDs
  tags?: string[];
  displays?: { id: string; name: string; urlSlug: string }[]; // displays using this playlist
  creator?: { id: string; username: string; }; // creator user info
}

export const TRANSITION_EFFECTS: { value: TransitionEffect; label: string; description: string }[] = [
  { value: 'cut', label: 'Cut', description: 'Instant transition' },
  { value: 'fade', label: 'Fade', description: 'Fade to black then fade in' },
  { value: 'crossfade', label: 'Crossfade', description: 'Smooth blend between content' },
  { value: 'dissolve', label: 'Dissolve', description: 'Pixel dissolve effect' },
  { value: 'wipe', label: 'Wipe', description: 'Wipe across screen' },
  { value: 'zoom', label: 'Zoom', description: 'Zoom in/out transition' },
  { value: 'push', label: 'Push', description: 'Push previous content off screen' },
  { value: 'slide-over', label: 'Slide Over', description: 'Slide new content over' },
  { value: 'iris', label: 'Iris', description: 'Circle iris transition' },
  { value: 'morph', label: 'Morph', description: 'Morph between shapes' },
  { value: 'burn', label: 'Burn', description: 'Burn effect transition' },
  { value: 'barn-doors', label: 'Barn Doors', description: 'Split screen doors' },
  { value: 'page-roll', label: 'Page Roll', description: 'Page roll effect' },
  { value: 'peel', label: 'Peel', description: 'Peel away effect' },
];
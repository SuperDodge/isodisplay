'use client';

import { useState } from 'react';
import { Permission } from '@/generated/prisma';
import { 
  Shield, 
  Image, 
  Monitor, 
  Users as UsersIcon, 
  Settings,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UserPermissionsPanelProps {
  permissions: Permission[];
  onChange: (permissions: Permission[]) => void;
  disabled?: boolean;
}

// Permission categories with descriptions
const PERMISSION_CATEGORIES = {
  'Content Management': {
    icon: Image,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    permissions: [
      { 
        key: 'CONTENT_CREATE' as Permission,
        label: 'Create Content',
        description: 'Upload and add new media files'
      },
      {
        key: 'CONTENT_UPDATE' as Permission,
        label: 'Edit Content',
        description: 'Modify existing media properties and metadata'
      },
      {
        key: 'CONTENT_DELETE' as Permission,
        label: 'Delete Content',
        description: 'Remove media files from the system'
      },
      {
        key: 'CONTENT_VIEW' as Permission,
        label: 'View Content',
        description: 'Browse and preview media library'
      }
    ]
  },
  'Display Management': {
    icon: Monitor,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    permissions: [
      {
        key: 'DISPLAY_CREATE' as Permission,
        label: 'Create Displays',
        description: 'Add new display devices to the system'
      },
      {
        key: 'DISPLAY_UPDATE' as Permission,
        label: 'Edit Displays',
        description: 'Modify display settings and configurations'
      },
      {
        key: 'DISPLAY_DELETE' as Permission,
        label: 'Delete Displays',
        description: 'Remove displays from the system'
      },
      {
        key: 'DISPLAY_CONTROL' as Permission,
        label: 'Control Displays',
        description: 'Remote control display playback and settings'
      },
      {
        key: 'DISPLAY_VIEW' as Permission,
        label: 'View Displays',
        description: 'View display status and information'
      }
    ]
  },
  'Playlist Management': {
    icon: Shield,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    permissions: [
      {
        key: 'PLAYLIST_CREATE' as Permission,
        label: 'Create Playlists',
        description: 'Build new content playlists'
      },
      {
        key: 'PLAYLIST_UPDATE' as Permission,
        label: 'Edit Playlists',
        description: 'Modify playlist items and settings'
      },
      {
        key: 'PLAYLIST_DELETE' as Permission,
        label: 'Delete Playlists',
        description: 'Remove playlists from the system'
      },
      {
        key: 'PLAYLIST_VIEW' as Permission,
        label: 'View Playlists',
        description: 'Browse and preview playlists'
      }
    ]
  },
  'User Management': {
    icon: UsersIcon,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    permissions: [
      {
        key: 'USER_CREATE' as Permission,
        label: 'Create Users',
        description: 'Add new user accounts'
      },
      {
        key: 'USER_UPDATE' as Permission,
        label: 'Edit Users',
        description: 'Modify user details and status'
      },
      {
        key: 'USER_DELETE' as Permission,
        label: 'Delete Users',
        description: 'Remove user accounts'
      },
      {
        key: 'USER_CONTROL' as Permission,
        label: 'Control Users',
        description: 'Manage user permissions and access levels'
      }
    ]
  },
  'System Settings': {
    icon: Settings,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    permissions: [
      {
        key: 'ADMIN' as Permission,
        label: 'Administrator',
        description: 'Full system access and control'
      }
    ]
  }
};

// Role presets
const ROLE_PRESETS = {
  admin: {
    name: 'Administrator',
    description: 'Full system access',
    permissions: Object.values(Permission)
  },
  manager: {
    name: 'Manager',
    description: 'Manage content and displays',
    permissions: [
      'CONTENT_CREATE', 'CONTENT_UPDATE', 'CONTENT_DELETE', 'CONTENT_VIEW',
      'DISPLAY_CREATE', 'DISPLAY_UPDATE', 'DISPLAY_CONTROL', 'DISPLAY_VIEW',
      'PLAYLIST_CREATE', 'PLAYLIST_UPDATE', 'PLAYLIST_DELETE', 'PLAYLIST_VIEW'
    ] as Permission[]
  },
  viewer: {
    name: 'Viewer',
    description: 'View-only access',
    permissions: [
      'CONTENT_VIEW', 'DISPLAY_VIEW', 'PLAYLIST_VIEW'
    ] as Permission[]
  }
};

export function UserPermissionsPanel({ 
  permissions, 
  onChange, 
  disabled = false 
}: UserPermissionsPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(PERMISSION_CATEGORIES))
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const togglePermission = (permission: Permission) => {
    if (disabled) return;
    
    const newPermissions = permissions.includes(permission)
      ? permissions.filter(p => p !== permission)
      : [...permissions, permission];
    
    onChange(newPermissions);
  };

  const applyPreset = (preset: typeof ROLE_PRESETS.admin) => {
    if (disabled) return;
    onChange(preset.permissions);
  };

  const hasAllInCategory = (categoryPermissions: typeof PERMISSION_CATEGORIES['Content Management']['permissions']) => {
    return categoryPermissions.every(p => permissions.includes(p.key));
  };

  const toggleAllInCategory = (categoryPermissions: typeof PERMISSION_CATEGORIES['Content Management']['permissions']) => {
    if (disabled) return;
    
    const hasAll = hasAllInCategory(categoryPermissions);
    const categoryKeys = categoryPermissions.map(p => p.key);
    
    if (hasAll) {
      // Remove all permissions from this category
      onChange(permissions.filter(p => !categoryKeys.includes(p)));
    } else {
      // Add all permissions from this category
      const newPermissions = [...permissions];
      categoryKeys.forEach(key => {
        if (!newPermissions.includes(key)) {
          newPermissions.push(key);
        }
      });
      onChange(newPermissions);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions / Role Presets */}
      <div>
        <h3 className="text-sm font-medium text-white/70 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
              disabled={disabled}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {preset.name}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange([])}
            disabled={disabled}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Permission Categories */}
      <div className="space-y-3">
        {Object.entries(PERMISSION_CATEGORIES).map(([category, config]) => {
          const Icon = config.icon;
          const isExpanded = expandedCategories.has(category);
          const hasAll = hasAllInCategory(config.permissions);
          const hasSome = config.permissions.some(p => permissions.includes(p.key));
          
          return (
            <div 
              key={category}
              className={`rounded-lg border ${config.bgColor} border-white/20 overflow-hidden`}
            >
              {/* Category Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <span className="font-medium text-white">{category}</span>
                  <span className="text-xs text-white/50">
                    ({config.permissions.filter(p => permissions.includes(p.key)).length}/{config.permissions.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllInCategory(config.permissions);
                    }}
                    disabled={disabled}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    {hasAll ? (
                      <ToggleRight className="w-5 h-5 text-brand-orange-500" />
                    ) : hasSome ? (
                      <ToggleLeft className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-white/50" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  )}
                </div>
              </div>

              {/* Permission Items */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2 border-t border-white/10">
                  {config.permissions.map(perm => (
                    <div
                      key={perm.key}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => togglePermission(perm.key)}
                          disabled={disabled}
                          className="flex items-center"
                        >
                          {permissions.includes(perm.key) ? (
                            <ToggleRight className="w-6 h-6 text-brand-orange-500" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-white/30" />
                          )}
                        </button>
                        <div>
                          <div className="text-white font-medium">{perm.label}</div>
                          <div className="text-white/50 text-xs">{perm.description}</div>
                        </div>
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-white/30" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Permission key: {perm.key}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-3 bg-white/5 rounded-lg border border-white/20">
        <div className="text-sm text-white/70">
          <span className="font-medium">{permissions.length}</span> permissions selected
          {permissions.includes('ADMIN' as Permission) && (
            <span className="ml-2 text-orange-400">(Administrator - Full Access)</span>
          )}
        </div>
      </div>
    </div>
  );
}
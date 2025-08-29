'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  FileImage,
  ListVideo,
  MonitorPlay,
  UserRoundCog,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Cog,
  Menu,
  X
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
}

const navItems: NavItem[] = [
  {
    name: 'Content',
    href: '/content',
    icon: FileImage,
    permission: 'CONTENT_CREATE',
  },
  {
    name: 'Playlists',
    href: '/playlists',
    icon: ListVideo,
    permission: 'PLAYLIST_CREATE',
  },
  {
    name: 'Displays',
    href: '/displays',
    icon: MonitorPlay,
    permission: 'DISPLAY_CONTROL',
  },
];

const adminItems: NavItem[] = [
  {
    name: 'Admin',
    href: '/admin',
    icon: Cog,
    permission: 'USER_CONTROL',
  },
  {
    name: 'Users',
    href: '/users',
    icon: UserRoundCog,
    permission: 'USER_CONTROL',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show sidebar on public display pages or auth pages
  if (pathname?.startsWith('/display/') || pathname?.startsWith('/auth/')) {
    return null;
  }

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return user?.permissions?.includes(permission as any);
  };

  const isActive = (href: string) => {
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-brand-orange-500 rounded-lg border border-brand-orange-600 lg:hidden"
      >
        {mobileOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-brand-orange-500 border-r border-brand-orange-600 transition-all duration-300 z-40 ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <Link href="/displays" className="flex items-center pl-1 pr-3">
                <div className="w-10 h-10 relative flex-shrink-0 mr-1">
                  <img
                    src="/brandmark.png"
                    alt="IsoDisplay"
                    width={40}
                    height={40}
                    className="object-contain w-full h-full"
                  />
                </div>
                {!collapsed && (
                  <div className="sidebar-brand-text">
                    <span className="brand-large">I</span>
                    <span className="brand-small">SO</span>
                    <span className="brand-large">D</span>
                    <span className="brand-small">ISPLAY</span>
                  </div>
                )}
              </Link>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:block p-1.5 transition-opacity hover:opacity-100 opacity-70"
              >
                {collapsed ? (
                  <ChevronRight className="w-5 h-5 text-white hover:text-white transition-colors" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-white hover:text-white transition-colors" />
                )}
              </button>
            </div>
          </div>
          
          {/* Separator below header */}
          <div className="mx-4 my-4 border-t border-brand-orange-600" />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                if (!hasPermission(item.permission)) return null;
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      active
                        ? 'bg-brand-gray-900 text-white shadow-lg'
                        : 'text-white/90 hover:bg-brand-gray-900/50 hover:text-white'
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className="w-6 h-6 flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Admin Section */}
            {adminItems.some(item => hasPermission(item.permission)) && (
              <>
                <div className="my-4 border-t border-brand-orange-600" />
                <div className="space-y-1">
                  {adminItems.map((item) => {
                    if (!hasPermission(item.permission)) return null;
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          active
                            ? 'bg-brand-gray-900 text-white shadow-lg'
                            : 'text-white/90 hover:bg-brand-gray-900/50 hover:text-white'
                        }`}
                        title={collapsed ? item.name : undefined}
                      >
                        <Icon className="w-6 h-6 flex-shrink-0" />
                        {!collapsed && <span>{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </nav>

          {/* User Info */}
          {user && (
            <>
              <div className="mx-4 my-4 border-t border-brand-orange-600" />
              <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{user.username}</p>
                    <p className="text-white/50 text-xs truncate">{user.email}</p>
                  </div>
                )}
              </div>
            </div>
            </>
          )}

          {/* Logout */}
          <div className="mx-4 my-4 border-t border-brand-orange-600" />
          <div className="p-4">
            <Link
              href="/auth/logout"
              className="flex items-center gap-3 px-3 py-2 text-white/90 hover:bg-brand-gray-900/50 hover:text-white rounded-lg transition"
              title={collapsed ? 'Logout' : undefined}
            >
              <LogOut className="w-6 h-6 flex-shrink-0" />
              {!collapsed && <span>Logout</span>}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
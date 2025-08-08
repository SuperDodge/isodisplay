

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Display } from "@/api/entities";
import {
  Monitor,
  PlayCircle,
  FolderOpen,
  Settings,
  Upload,
  Users,
  LogOut,
  Menu,
  X,
  Tv
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [displays, setDisplays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLayoutData();
  }, []);

  const loadLayoutData = async () => {
    try {
      const [userData, displaysData] = await Promise.all([
        User.me(),
        Display.list()
      ]);
      setUser(userData);
      setDisplays(displaysData);
    } catch (error) {
      console.log("User not authenticated or error loading data");
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  const navigationItems = [
    {
      title: "Dashboard",
      url: createPageUrl("Dashboard"),
      icon: Monitor,
      description: "Overview & Analytics",
      permission: null
    },
    {
      title: "Content Library",
      url: createPageUrl("ContentLibrary"),
      icon: FolderOpen,
      description: "Manage Media Files",
      permission: "can_edit_content"
    },
    {
      title: "Playlists",
      url: createPageUrl("Playlists"),
      icon: PlayCircle,
      description: "Create & Schedule",
      permission: "can_create_playlists"
    },
    {
      title: "Upload Content",
      url: createPageUrl("Upload"),
      icon: Upload,
      description: "Add New Media",
      permission: "can_edit_content"
    },
    {
      title: "Displays",
      url: createPageUrl("Displays"),
      icon: Tv,
      description: "Manage Displays",
      permission: "can_manage_displays"
    },
    {
      title: "Users",
      url: createPageUrl("Users"),
      icon: Users,
      description: "Manage Users",
      permission: "can_manage_users"
    }
  ];

  // Filter navigation items based on user permissions
  const visibleNavItems = navigationItems.filter(item => {
    if (!item.permission) return true;
    if (!user) return false;
    return user.is_admin || user.permissions?.[item.permission];
  });

  // Don't show sidebar on display page
  if (currentPageName === "Display") {
    return <div className="min-h-screen bg-black">{children}</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }
          .hexagon-pattern {
            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='m36 34v-12l-12-7-12 7v12l12 7z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          }
        `}</style>
        <div className="hexagon-pattern absolute inset-0 opacity-10"></div>
        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center relative z-10">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">IsoDisplay</h1>
          <p className="text-gray-300 mb-8">Professional Digital Signage Management</p>
          <Button 
            onClick={() => User.login()} 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg border-none transition-all duration-300 shadow-lg"
          >
            <Users className="w-5 h-5 mr-2" />
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
        body {
          font-family: 'Inter', sans-serif;
        }
        .hexagon-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='m36 34v-12l-12-7-12 7v12l12 7z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }
        .glass-effect {
          background: rgba(30, 41, 59, 0.7) !important;
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        /* Force orange sidebar styles */
        [data-sidebar="sidebar"] {
          background: rgba(245, 102, 0, 0.85) !important;
          backdrop-filter: blur(12px) !important;
          border-right: 1px solid rgba(255, 165, 0, 0.3) !important;
        }
        [data-sidebar="sidebar"] * {
          color: white !important;
        }
        [data-sidebar="sidebar"] [data-sidebar="header"] {
          border-bottom: 1px solid rgba(255, 165, 0, 0.3) !important;
          background: transparent !important;
        }
        [data-sidebar="sidebar"] [data-sidebar="footer"] {
          border-top: 1px solid rgba(255, 165, 0, 0.3) !important;
          background: transparent !important;
        }
        [data-sidebar="sidebar"] [data-sidebar="content"] {
          background: transparent !important;
        }
        [data-sidebar="sidebar"] [data-sidebar="menu-button"]:hover {
          background: rgba(255, 255, 255, 0.2) !important;
        }
        [data-sidebar="sidebar"] [data-sidebar="menu-button"][data-active="true"] {
          background: rgba(255, 255, 255, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.4) !important;
        }
      `}</style>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
          <div className="hexagon-pattern absolute inset-0 opacity-10"></div>
          <Sidebar data-sidebar="sidebar">
            <SidebarHeader data-sidebar="header" className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-white">IsoDisplay</h2>
                  <p className="text-xs text-orange-100 font-medium">Digital Signage Platform</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent data-sidebar="content" className="p-3">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-orange-100 uppercase tracking-wider px-3 py-3">
                  Management
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {visibleNavItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          data-sidebar="menu-button"
                          data-active={location.pathname === item.url}
                          className="transition-all duration-200 rounded-lg px-4 py-5 border border-transparent text-white"
                        >
                          <Link to={item.url} className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            <div>
                              <div className="font-medium">{item.title}</div>
                              <div className="text-xs opacity-75">{item.description}</div>
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup className="mt-8">
                <SidebarGroupLabel className="text-xs font-semibold text-orange-100 uppercase tracking-wider px-3 py-3">
                  Live Displays
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="px-3 py-2 space-y-2">
                    {displays.filter(d => d.is_active).map(display => (
                      <Link 
                        key={display.id}
                        to={`${createPageUrl("Display")}?display=${display.id}`} 
                        target="_blank"
                        className="block p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shadow-sm border border-white/20">
                            <Monitor className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{display.name}</div>
                            <div className="text-xs text-orange-100">{display.location || 'Open Display'}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {displays.filter(d => d.is_active).length === 0 && (
                      <div className="text-center text-xs text-orange-100 p-4">No active displays configured.</div>
                    )}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter data-sidebar="footer" className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 ring-2 ring-white/30">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} />
                    <AvatarFallback className="bg-white/20 text-white text-sm border border-white/30">
                      {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{user.full_name}</p>
                    <p className="text-xs text-orange-100 truncate">
                      {user.is_admin ? 'Administrator' : 'User'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-orange-100 hover:text-white hover:bg-white/20 border-none"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col relative z-10">
            <header className="bg-slate-800/70 border-b border-white/10 px-6 py-4 md:hidden backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <SidebarTrigger className="hover:bg-white/10 p-2 rounded-lg transition-colors duration-200 text-white" />
                <h1 className="text-xl font-bold text-white">IsoDisplay</h1>
              </div>
            </header>

            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}


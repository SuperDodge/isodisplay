
import React, { useState, useEffect, useRef } from "react";
import { ContentItem } from "@/api/entities";
import { Playlist } from "@/api/entities";
import { Display as DisplayEntity } from "@/api/entities"; // Renamed import
import { DisplaySettings } from "@/api/entities";
import { Clock } from "lucide-react";

export default function Display() {
  const [currentContent, setCurrentContent] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displaySettings, setDisplaySettings] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use refs to store timer IDs and prevent cleanup issues
  const refreshIntervalRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    console.log('Display component mounted, loading settings...');
    loadDisplaySettings();
    
    // Set up refresh interval
    // The interval is initially set to 30 seconds (30000 ms).
    // The refresh_interval from display settings will be used to update this interval after settings are loaded.
    refreshIntervalRef.current = setInterval(() => {
      console.log('Refreshing display settings...');
      loadDisplaySettings();
    }, 30000); // Default to 30 seconds, will be updated by actual setting later
    
    // Cleanup function
    return () => {
      console.log('Display component unmounting...');
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // This effect handles updating the refresh interval if displaySettings.refresh_interval changes
    if (displaySettings?.refresh_interval) {
        const newInterval = displaySettings.refresh_interval * 1000; // Convert seconds to milliseconds
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }
        refreshIntervalRef.current = setInterval(() => {
            console.log('Refreshing display settings based on new interval:', newInterval / 1000, 's');
            loadDisplaySettings();
        }, newInterval);
    }
  }, [displaySettings?.refresh_interval]);

  useEffect(() => {
    if (playlist && playlist.content_items && playlist.content_items.length > 0) {
      console.log('Playlist loaded, starting content playback');
      setCurrentIndex(0); // Start from the beginning
    } else if (playlist) {
      console.log('Playlist loaded but no content items:', playlist);
      setIsLoading(false);
    }
  }, [playlist]);

  useEffect(() => {
    if (playlist && playlist.content_items && playlist.content_items.length > 0) {
      console.log('Playing content at index:', currentIndex);
      playNextContent();
    }
  }, [currentIndex, playlist]); // Added playlist to dependencies for robustness

  useEffect(() => {
    // Clear existing timer when timeLeft changes or this effect re-runs for other dependencies
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
    }

    if (timeLeft > 0) {
      console.log(`Time left: ${timeLeft}s`);
      countdownTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setTimeLeft(prev => prev - 1);
        }
      }, 1000);
    } else if (timeLeft === 0 && currentContent && playlist && playlist.content_items) {
      // Logic for advancing or restarting content
      if (playlist.content_items.length > 1) {
        // Move to next content only when timer reaches 0 and we have multiple items
        console.log('Timer finished, moving to next content');
        const nextIndex = (currentIndex + 1) % playlist.content_items.length;
        console.log(`Moving from index ${currentIndex} to ${nextIndex}`);
        if (isMountedRef.current) {
          setCurrentIndex(nextIndex);
        }
      } else if (playlist.content_items.length === 1) {
        // For single item playlists, restart the same content
        console.log('Single item playlist, restarting content');
        const item = playlist.content_items[0];
        const duration = item.duration || item.content.duration || 10;
        setTimeLeft(duration);
      }
    }

    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [timeLeft, currentContent, playlist, currentIndex]);

  const loadDisplaySettings = async () => {
    if (!isMountedRef.current) return;
    
    try {
      console.log('Loading display settings...');
      setError(null);
      
      const urlParams = new URLSearchParams(window.location.search);
      const displayId = urlParams.get('display');
      console.log('Display ID from URL:', displayId);
      
      let activePlaylistId = null;
      let currentSettings = null;

      if (displayId) {
        console.log('Loading display with ID:', displayId);
        // Use .filter to specifically query for the display by ID
        const displays = await DisplayEntity.filter({ id: displayId });
        console.log('Filtered displays:', displays);
        
        if (displays.length > 0 && isMountedRef.current) {
          const display = displays[0]; // Get the first (and likely only) result
          activePlaylistId = display.active_playlist_id;
          currentSettings = {
            display_name: display.name,
            background_color: display.background_color || '#000000',
            show_clock: display.show_clock || false,
            clock_position: display.clock_position || 'top-right',
            refresh_interval: display.refresh_interval || 300 // Default to 300 seconds if not set
          };
          console.log('Display settings:', currentSettings);
          console.log('Active playlist ID:', activePlaylistId);
        } else {
          console.log('Display not found');
          setError('Display not found');
          setIsLoading(false); // Added setIsLoading(false) here as per outline
          return; // Exit early if display not found
        }
      } else {
        // Fallback to global DisplaySettings if no specific display ID
        console.log('No display ID, loading global settings...');
        const settings = await DisplaySettings.list();
        console.log('Global settings list:', settings); // Adjusted console log
        
        if (settings.length > 0 && isMountedRef.current) {
          currentSettings = settings[0];
          activePlaylistId = currentSettings.active_playlist_id;
          console.log('Global settings found:', currentSettings); // Adjusted console log
          console.log('Active playlist ID:', activePlaylistId);
        }
      }
      
      if (activePlaylistId && isMountedRef.current) {
        console.log('Loading playlist with ID:', activePlaylistId); // Adjusted console log
        // Use .filter to specifically query for the playlist by ID
        const playlists = await Playlist.filter({ id: activePlaylistId });
        console.log('Filtered playlists:', playlists); // Adjusted console log
        
        if (playlists.length > 0 && isMountedRef.current) {
          const activePlaylist = playlists[0]; // Get the first (and likely only) result
          const playlistWithContent = await loadPlaylistContent(activePlaylist);
          if (isMountedRef.current) {
            setPlaylist(playlistWithContent);
            setDisplaySettings(currentSettings);
          }
        } else {
          console.log('Active playlist not found');
          setError('Active playlist not found');
          setDisplaySettings(currentSettings);
          // Do not set isLoading to false here, it will be handled at the end of the try/catch
        }
      } else {
        console.log('No active playlist ID found');
        setError('No active playlist is assigned to this display.');
        setDisplaySettings(currentSettings);
        // Do not set isLoading to false here, it will be handled at the end of the try/catch
      }
    } catch (error) {
      console.error('Error loading display settings:', error);
      setError(error.message);
    }
    // Ensure isLoading is always set to false when the loading process completes, regardless of success or failure.
    if (isMountedRef.current) {
      setIsLoading(false);
    }
  };

  const loadPlaylistContent = async (playlistData) => {
    if (!isMountedRef.current) return playlistData;
    
    try {
      console.log('Loading content for playlist:', playlistData.name);
      
      if (!playlistData.content_items || playlistData.content_items.length === 0) {
        console.log('Playlist has no content items');
        return { ...playlistData, content_items: [] };
      }
      
      // Load all content items once for efficient lookup
      const allContent = await ContentItem.list();
      // Create a map for O(1) lookup of content items by their ID
      const contentMap = new Map(allContent.map(item => [item.id, item]));
      
      // Hydrate playlist content items with actual content data
      const hydratedContentItems = playlistData.content_items.map(item => ({
        ...item,
        content: contentMap.get(item.content_id) // Get content from the map
      })).filter(item => item.content); // Filter out items where the content was not found
      
      console.log('Loaded content items:', hydratedContentItems);
      
      if (hydratedContentItems.length === 0) {
        console.log("Playlist content could not be loaded or is inactive.");
        setError(`No valid content found for playlist "${playlistData.name}".`);
      }

      return {
        ...playlistData,
        content_items: hydratedContentItems
      };
    } catch (error) {
      console.error('Error loading playlist content:', error);
      setError(`Error loading content for playlist: ${error.message}`);
      return playlistData; // Return original playlist data if error occurs
    }
  };

  const playNextContent = () => {
    if (!playlist || !playlist.content_items || playlist.content_items.length === 0 || !isMountedRef.current) {
      console.log('Cannot play content: no playlist or content items');
      // If there's no playlist or content, and we're not loading, set currentContent to null to show default message
      if (!isLoading) {
         setCurrentContent(null);
      }
      return;
    }
    
    const item = playlist.content_items[currentIndex];
    console.log('Playing content item at index', currentIndex, ':', item);
    
    if (item && item.content && isMountedRef.current) {
      setCurrentContent(item.content);
      // Use item.duration if available, otherwise item.content.duration, fallback to 10 seconds
      const duration = item.duration || item.content.duration || 10;
      console.log(`Setting timer for ${duration} seconds for content: ${item.content.title}`);
      setTimeLeft(duration);
      setIsLoading(false);
      setError(null);
    } else {
      console.log('Invalid content item, skipping to next');
      // If the current item is invalid, try to advance to the next one immediately
      const nextIndex = (currentIndex + 1) % playlist.content_items.length;
      if (isMountedRef.current && nextIndex !== currentIndex) { // Avoid infinite loop if only one invalid item
          setCurrentIndex(nextIndex);
      } else if (isMountedRef.current) {
          // If no next valid item, or only one invalid item, just set loading to false to display error/empty state
          setIsLoading(false);
          setError("No valid content found in playlist.");
      }
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full text-white">
          <div className="text-center">
            <div className="w-24 h-24 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">Loading Content...</h2>
            <p className="text-lg opacity-75">Preparing your display</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-white">
          <div className="text-center p-8 bg-red-900/20 rounded-lg">
            <h2 className="text-3xl font-bold mb-4 text-red-400">Display Error</h2>
            <p className="text-lg opacity-80 mb-4 font-mono bg-black/30 p-4 rounded">{error}</p>
            <p className="text-sm opacity-50">Please check your configuration in the admin dashboard.</p>
          </div>
        </div>
      );
    }

    if (!currentContent) {
      return (
        <div className="flex items-center justify-center h-full text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Digital Signage Display</h2>
            <p className="text-lg opacity-75 mb-8">No active playlist found or no content to display</p>
            <p className="text-sm opacity-50">Configure your playlist in the admin dashboard</p>
          </div>
        </div>
      );
    }

    switch (currentContent.type) {
      case 'image':
        return (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: currentContent.background_color || '#000000' }}
          >
            <img
              src={currentContent.content}
              alt={currentContent.title}
              className="object-contain"
              style={{ 
                width: `${currentContent.image_width || 100}%`,
                height: '100%',
                imageRendering: '-webkit-optimize-contrast'
              }}
            />
          </div>
        );
      
      case 'video':
        return (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: currentContent.background_color || '#000000' }}
          >
            <video
              src={currentContent.content}
              autoPlay
              muted
              loop
              className="max-w-full max-h-full object-contain"
              style={{ imageRendering: '-webkit-optimize-contrast' }}
            />
          </div>
        );
      
      case 'webpage':
        return (
          <iframe
            src={currentContent.content}
            className="w-full h-full border-none"
            title={currentContent.title}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        );
      
      case 'youtube':
        // YouTube embeds often require specific URL formats for autoplay and embed.
        // Ensure currentContent.content is already formatted correctly, e.g., using embed URL.
        const youtubeEmbedUrl = currentContent.content.includes("embed") 
                                ? currentContent.content 
                                : `https://www.youtube.com/embed/${currentContent.content.split('v=')[1]?.split('&')[0]}?autoplay=1&mute=1&loop=1&playlist=${currentContent.content.split('v=')[1]?.split('&')[0]}`;
        return (
          <iframe
            src={youtubeEmbedUrl}
            className="w-full h-full border-none"
            title={currentContent.title}
            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      
      case 'text':
        return (
          <div className="flex items-center justify-center h-full p-16 text-center">
            <div className="max-w-4xl">
              <h1 
                className="text-6xl font-bold mb-8 leading-tight"
                style={{ 
                  color: currentContent.text_color || '#ffffff',
                  fontSize: currentContent.font_size === 'small' ? '2rem' : 
                            currentContent.font_size === 'medium' ? '3rem' :
                            currentContent.font_size === 'large' ? '4rem' : '5rem'
                }}
              >
                {currentContent.title}
              </h1>
              <div 
                className="text-2xl leading-relaxed whitespace-pre-wrap"
                style={{ 
                  color: currentContent.text_color || '#ffffff',
                  opacity: 0.9 
                }}
              >
                {currentContent.content}
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Unsupported Content Type</h2>
              <p className="text-lg opacity-75">{currentContent.type}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      className="w-screen h-screen overflow-hidden relative"
      style={{ 
        backgroundColor: currentContent?.type === 'text' ? currentContent.background_color || '#000000' : displaySettings?.background_color || '#000000',
        cursor: 'none'
      }}
    >
      {/* Main Content */}
      <div className="w-full h-full">
        {renderContent()}
      </div>

      {/* Clock Overlay */}
      {displaySettings?.show_clock && (
        <div 
          className={`absolute p-6 z-10`}
          style={{
            top: displaySettings.clock_position.includes('top') ? '2rem' : 'auto',
            bottom: displaySettings.clock_position.includes('bottom') ? '2rem' : 'auto',
            left: displaySettings.clock_position.includes('left') ? '2rem' : 'auto',
            right: displaySettings.clock_position.includes('right') ? '2rem' : 'auto'
          }}
        >
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-6 py-4 text-white">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6" />
              <span className="text-2xl font-bold font-mono">
                {new Date().toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </span>
            </div>
            <div className="text-sm opacity-75 mt-1">
              {new Date().toLocaleDateString([], {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

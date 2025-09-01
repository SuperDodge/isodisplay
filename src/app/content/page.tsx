'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ContentGrid } from '@/components/content/ContentGrid';
import { ContentFilters } from '@/components/content/ContentFilters';
import { ContentUpload } from '@/components/content/ContentUpload';
import { ContentEditModal } from '@/components/content/ContentEditModal';
import { YouTubeAddModal } from '@/components/content/YouTubeAddModal';
import { Permission, ContentType } from '@/generated/prisma';
import { Upload, Search, AlertTriangle, Youtube, FileImage } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCSRF } from '@/hooks/useCSRF';
import { apiToFrontendContent } from '@/lib/transformers/api-transformers';

export default function ContentLibraryPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { secureFetch } = useCSRF();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all' as ContentType | 'all',
    sortBy: 'createdAt' as 'createdAt' | 'name' | 'fileSize',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  const [showUpload, setShowUpload] = useState(false);
  const [showYouTubeAdd, setShowYouTubeAdd] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user && !user.permissions?.includes('CONTENT_CREATE')) {
      router.push('/unauthorized');
      return;
    }
    fetchContent();
  }, [user, authLoading, isAuthenticated, router, filters]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.type !== 'all') params.append('type', filters.type);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/content?${params}`);
      if (!response.ok) throw new Error('Failed to fetch content');
      const data = await response.json();
      // Transform API responses to frontend format
      const transformedContent = Array.isArray(data)
        ? data.map(apiToFrontendContent)
        : [];
      setContent(transformedContent);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    setUploadSuccessToast(true);
    
    // Hide toast after 4 seconds
    setTimeout(() => {
      setUploadSuccessToast(false);
    }, 4000);
    
    // Add a small delay to allow thumbnail processing to complete
    setTimeout(() => {
      fetchContent();
    }, 1500); // 1.5 second delay
  };

  const handleYouTubeSuccess = () => {
    setShowYouTubeAdd(false);
    fetchContent();
  };


  const handleEdit = (item: any) => {
    setEditingContent(item);
  };

  const handleDelete = async (itemId: string) => {
    try {
      const response = await secureFetch(`/api/content/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete content');
      
      fetchContent();
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handleEditSuccess = () => {
    setEditingContent(null);
    fetchContent();
  };

  const handleDeleteClick = () => {
    if (selectedItems.length === 0) return;
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteConfirmOpen(false);
    
    try {
      const response = await fetch('/api/content/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedItems }),
      });
      
      if (!response.ok) throw new Error('Failed to delete content');
      
      setSelectedItems([]);
      fetchContent();
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <FileImage className="w-12 h-12 text-brand-orange-500" />
              <div>
                <h1 className="text-4xl font-bold text-white uppercase tracking-wide font-['Made_Tommy']">Content Library</h1>
                <p className="text-white/70">Upload and manage media content for your displays</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowYouTubeAdd(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-200"
              >
                <Youtube className="w-5 h-5" />
                Add YouTube
              </button>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-6 py-3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-semibold rounded-lg transition duration-200"
              >
                <Upload className="w-5 h-5" />
                Upload Content
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search content..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10"
              />
            </div>

            {/* Filters */}
            <ContentFilters
              filters={filters}
              onFiltersChange={setFilters}
            />

          </div>

          {/* Selection Actions */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-brand-orange-500/20 rounded-lg border border-brand-orange-500/50 flex items-center justify-between">
              <span className="text-white">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedItems([])}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Display */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl p-6 border border-white/20">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Loading content...</div>
            </div>
          ) : content.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/70">
              <p className="mb-4">No content found</p>
              <button
                onClick={() => setShowUpload(true)}
                className="px-6 py-3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-semibold rounded-lg transition"
              >
                Upload First Content
              </button>
            </div>
          ) : (
            <ContentGrid
              content={content}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <ContentUpload
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* YouTube Add Modal */}
      {showYouTubeAdd && (
        <YouTubeAddModal
          onClose={() => setShowYouTubeAdd(false)}
          onSuccess={handleYouTubeSuccess}
        />
      )}

      {/* Edit Modal */}
      {editingContent && (
        <ContentEditModal
          content={editingContent}
          onClose={() => setEditingContent(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-red-500/20 backdrop-blur-md border-red-500/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white text-lg">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <span style={{ 
                fontFamily: 'Made Tommy, sans-serif', 
                fontWeight: 'bold', 
                textTransform: 'uppercase', 
                letterSpacing: '0.01em' 
              }}>
                Delete Content
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-300 pt-2 font-body">
              Are you sure you want to delete {selectedItems.length} selected item{selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="text-white hover:bg-white/10 hover:text-white font-body"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white font-body"
            >
              Delete {selectedItems.length} Item{selectedItems.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Success Toast */}
      {uploadSuccessToast && (
        <div 
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 backdrop-blur-md rounded-lg shadow-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top"
        >
          <div className="w-6 h-6 text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <span className="text-white font-bold">Content uploaded successfully! Processing thumbnails...</span>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { ContentItem } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Image,
  Video,
  Globe,
  Youtube,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  Grid,
  List
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ContentDialog from "../components/content/ContentDialog";

export default function ContentLibrary() {
  const [contentItems, setContentItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadContentItems();
  }, []);

  useEffect(() => {
    filterContent();
  }, [contentItems, searchTerm, filterType]);

  useEffect(() => {
    if (contentItems.length > 0) {
      const params = new URLSearchParams(location.search);
      const editId = params.get('edit');
      if (editId) {
        const itemToEdit = contentItems.find(item => item.id === editId);
        if (itemToEdit) {
          handleEditContent(itemToEdit);
          // Remove the query param from the URL to avoid re-opening on refresh
          navigate(createPageUrl('ContentLibrary'), { replace: true });
        }
      }
    }
  }, [contentItems, location.search, navigate]);

  const loadContentItems = async () => {
    try {
      const items = await ContentItem.list('-created_date');
      setContentItems(items);
    } catch (error) {
      console.error('Error loading content:', error);
    }
    setIsLoading(false);
  };

  const filterContent = () => {
    let filtered = contentItems;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    setFilteredItems(filtered);
  };

  const deleteContent = async (id) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await ContentItem.delete(id);
        loadContentItems();
      } catch (error) {
        console.error('Error deleting content:', error);
      }
    }
  };

  const toggleActive = async (item) => {
    try {
      await ContentItem.update(item.id, {
        is_active: !item.is_active
      });
      loadContentItems();
    } catch (error) {
      console.error('Error updating content:', error);
    }
  };

  const handleEditContent = (content) => {
    setSelectedContent(content);
    setShowContentDialog(true);
  };

  const handleContentSave = () => {
    // Reload the content list to refresh thumbnails with updated settings
    loadContentItems();
  };

  const getContentIcon = (type) => {
    const icons = {
      image: Image,
      video: Video,
      webpage: Globe,
      youtube: Youtube,
      text: FileText,
      pdf: FileText
    };
    return icons[type] || FileText;
  };

  const getTypeColor = (type) => {
    const colors = {
      image: 'bg-green-500/20 text-green-400',
      video: 'bg-purple-500/20 text-purple-400',
      webpage: 'bg-blue-500/20 text-blue-400',
      youtube: 'bg-red-500/20 text-red-400',
      text: 'bg-yellow-500/20 text-yellow-400',
      pdf: 'bg-orange-500/20 text-orange-400'
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400';
  };

  const generateThumbnail = (item) => {
    switch (item.type) {
      case 'image':
        return (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: item.background_color || '#000000' }}
          >
            <img
              src={item.content}
              alt={item.title}
              className="max-w-full max-h-full object-contain"
              style={{
                width: `${item.image_width || 100}%`,
                height: '100%'
              }}
            />
          </div>
        );

      case 'video':
        return (
          <div
            className="w-full h-full flex items-center justify-center relative"
            style={{ backgroundColor: item.background_color || '#000000' }}
          >
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="max-w-full max-h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-white">
                <Video className="w-12 h-12 mb-2 opacity-75" />
                <span className="text-sm font-medium">{item.title}</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                <Video className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div
            className="w-full h-full flex items-center justify-center p-2"
            style={{
              backgroundColor: item.background_color || '#ffffff',
              color: item.text_color || '#000000'
            }}
          >
            <div className="text-center overflow-hidden">
              <h3
                className="font-bold mb-1 line-clamp-2"
                style={{
                  fontSize: item.font_size === 'small' ? '8px' :
                            item.font_size === 'medium' ? '10px' :
                            item.font_size === 'large' ? '12px' : '14px'
                }}
              >
                {item.title}
              </h3>
              <p
                className="text-xs line-clamp-3"
                style={{ opacity: 0.9 }}
              >
                {item.content}
              </p>
            </div>
          </div>
        );

      case 'webpage':
        return (
          <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center p-2 text-blue-800">
            <Globe className="w-12 h-12 mb-2" />
            <span className="text-xs font-medium text-center line-clamp-2">{item.title}</span>
            <span className="text-xs opacity-75 mt-1">Webpage</span>
          </div>
        );

      case 'youtube':
        return (
          <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center p-2 text-red-800 relative">
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <Youtube className="w-12 h-12 mb-2" />
                <span className="text-xs font-medium text-center line-clamp-2">{item.title}</span>
              </>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <Youtube className="w-6 h-6 text-white ml-1" />
              </div>
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-full bg-orange-50 flex flex-col items-center justify-center p-2 text-orange-800">
            <FileText className="w-12 h-12 mb-2" />
            <span className="text-xs font-medium text-center line-clamp-2">{item.title}</span>
            <span className="text-xs opacity-75 mt-1">
              PDF {item.pdf_page && `(Page ${item.pdf_page})`}
            </span>
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-2 text-gray-600">
            <FileText className="w-12 h-12 mb-2" />
            <span className="text-xs font-medium text-center line-clamp-2">{item.title}</span>
          </div>
        );
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredItems.map((item) => {
        const IconComponent = getContentIcon(item.type);
        return (
          <Card
            key={item.id}
            className="group glass-effect hover:border-white/20 transition-all duration-300 cursor-pointer"
            onClick={() => handleEditContent(item)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-800/70 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-gray-300" />
                  </div>
                  <Badge className={getTypeColor(item.type)}>
                    {item.type}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:bg-white/10">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-effect text-white border-white/20">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditContent(item); }} className="hover:bg-white/10">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleActive(item); }} className="hover:bg-white/10">
                      <Eye className="w-4 h-4 mr-2" />
                      {item.is_active ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteContent(item.id); }} className="text-red-400 hover:bg-red-500/20 hover:text-red-300">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Thumbnail Preview */}
              <div className="w-full aspect-video mb-4 rounded-lg overflow-hidden bg-slate-800/70 border-2 border-white/10">
                {generateThumbnail(item)}
              </div>

              <CardTitle className="text-lg font-semibold text-white line-clamp-2">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.description && (
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{item.duration}s duration</span>
                <div className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-green-400' : 'bg-gray-500'}`} />
              </div>
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-white/10 text-gray-300 border-white/20">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-white/10 text-gray-300 border-white/20">
                      +{item.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredItems.map((item) => {
        const IconComponent = getContentIcon(item.type);
        return (
          <Card
            key={item.id}
            className="glass-effect hover:border-white/20 transition-all duration-300 cursor-pointer"
            onClick={() => handleEditContent(item)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-800/70 rounded-xl flex items-center justify-center border border-white/10">
                  <IconComponent className="w-6 h-6 text-gray-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{item.title}</h3>
                      {item.description && (
                        <p className="text-gray-300 mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge className={getTypeColor(item.type)}>
                        {item.type}
                      </Badge>
                      <span className="text-sm text-gray-400">{item.duration}s</span>
                      <div className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="text-gray-300 hover:bg-white/10">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-effect text-white border-white/20">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditContent(item); }} className="hover:bg-white/10">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleActive(item); }} className="hover:bg-white/10">
                            <Eye className="w-4 h-4 mr-2" />
                            {item.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteContent(item.id); }} className="text-red-400 hover:bg-red-500/20 hover:text-red-300">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-white/10 text-gray-300 border-white/20">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-slate-800/70 rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-slate-800/70 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="glass-effect animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-slate-800/70 rounded mb-4"></div>
                <div className="h-4 bg-slate-800/70 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-800/70 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Content Library</h1>
            <p className="text-gray-300">Manage your digital signage media files</p>
          </div>
          <Link to={createPageUrl("Upload")}>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-lg transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 glass-effect rounded-2xl p-6 shadow-lg">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white focus:border-orange-500">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="glass-effect text-white border-white/20">
                <SelectItem value="all" className="hover:bg-white/10">All Types</SelectItem>
                <SelectItem value="image" className="hover:bg-white/10">Images</SelectItem>
                <SelectItem value="video" className="hover:bg-white/10">Videos</SelectItem>
                <SelectItem value="webpage" className="hover:bg-white/10">Webpages</SelectItem>
                <SelectItem value="youtube" className="hover:bg-white/10">YouTube</SelectItem>
                <SelectItem value="text" className="hover:bg-white/10">Text</SelectItem>
                <SelectItem value="pdf" className="hover:bg-white/10">PDFs</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-lg bg-slate-800/70 border-white/10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={`rounded-r-none transition-colors duration-200 ${
                  viewMode === 'grid' ? 'bg-white text-slate-900' : 'text-white hover:bg-white/20'
                }`}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={`rounded-l-none transition-colors duration-200 ${
                  viewMode === 'list' ? 'bg-white text-slate-900' : 'text-white hover:bg-white/20'
                }`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-800/70 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
              <FileText className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {contentItems.length === 0 ? 'No content yet' : 'No results found'}
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {contentItems.length === 0
                ? 'Start building your digital signage library by uploading your first content item'
                : 'Try adjusting your search terms or filters'
              }
            </p>
            {contentItems.length === 0 && (
              <Link to={createPageUrl("Upload")}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white border-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload First Content
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-300">
                Showing {filteredItems.length} of {contentItems.length} items
              </p>
            </div>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </>
        )}

        {/* Content Edit Dialog */}
        <ContentDialog
          content={selectedContent}
          isOpen={showContentDialog}
          onClose={() => {
            setShowContentDialog(false);
            setSelectedContent(null);
          }}
          onSave={handleContentSave}
        />
      </div>
    </div>
  );
}


import React, { useState, useEffect } from "react";
import { ContentItem } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Save, 
  X, 
  Plus, 
  Image, 
  Video, 
  Globe, 
  Youtube, 
  FileText,
  Palette,
  Type,
  Maximize2
} from "lucide-react";

export default function ContentDialog({ content, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 10,
    tags: [],
    background_color: '#ffffff',
    text_color: '#000000',
    font_size: 'large',
    pdf_page: 1,
    image_width: 100 // New field for image width percentage
  });
  const [currentTag, setCurrentTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title || '',
        description: content.description || '',
        duration: content.duration || 10,
        tags: content.tags || [],
        background_color: content.background_color || '#ffffff',
        text_color: content.text_color || '#000000',
        font_size: content.font_size || 'large',
        pdf_page: content.pdf_page || 1,
        image_width: content.image_width || 100
      });
    }
  }, [content]);

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const updatedContent = {
        ...content,
        ...formData
      };
      
      await ContentItem.update(content.id, updatedContent);
      onSave(); // This will trigger the content list refresh in the parent component
      onClose();
    } catch (error) {
      console.error('Error updating content:', error);
    }
    
    setIsSaving(false);
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

  if (!content) return null;

  const IconComponent = getContentIcon(content.type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-effect border-white/20 text-white">
        <DialogHeader className="border-b border-white/10 pb-6">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">Edit Content</span>
                <Badge className={getTypeColor(content.type)}>
                  {content.type}
                </Badge>
              </div>
              <p className="text-gray-300 text-sm mt-1">Modify the properties and settings for this content item</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 pt-6">
          {/* Content Preview */}
          <div className="p-6 glass-effect rounded-2xl border border-white/10">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-orange-400" />
              Content Preview
            </h4>
            <div className="aspect-video w-full rounded-xl border border-white/20 overflow-hidden flex items-center justify-center bg-black/30">
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: content.type === 'text' ? formData.background_color : (content.type === 'image' ? formData.background_color : 'transparent') }}
              >
                {content.type === 'image' && (
                  <img 
                    src={content.content} 
                    alt={content.title}
                    className="object-contain"
                    style={{ 
                      width: `${formData.image_width}%`,
                      height: '100%'
                    }}
                  />
                )}
                {content.type === 'video' && (
                  <video 
                    src={content.content} 
                    className="w-full h-full object-contain"
                    controls
                  />
                )}
                {content.type === 'text' && (
                  <div 
                    className="p-6 text-center w-full h-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: formData.background_color,
                      color: formData.text_color,
                      fontSize: formData.font_size === 'small' ? '14px' : 
                                formData.font_size === 'medium' ? '18px' :
                                formData.font_size === 'large' ? '24px' : '32px'
                    }}
                  >
                    <div className="max-w-full overflow-hidden">
                      <h3 className="font-bold mb-2">{formData.title}</h3>
                      <p className="whitespace-pre-wrap">{content.content}</p>
                    </div>
                  </div>
                )}
                {content.type === 'pdf' && (
                  <div className="text-center p-4">
                    <FileText className="w-20 h-20 text-orange-400 mx-auto mb-3" />
                    <p className="font-bold text-white text-lg">PDF Document</p>
                    <p className="text-gray-300">Page {formData.pdf_page}</p>
                  </div>
                )}
                {(content.type === 'webpage' || content.type === 'youtube') && (
                  <div className="text-center p-4">
                    <IconComponent className="w-20 h-20 text-gray-400 mx-auto mb-3" />
                    <p className="font-bold text-white text-lg">{content.type === 'webpage' ? 'Webpage' : 'YouTube Video'}</p>
                    <p className="text-gray-300 truncate max-w-xs">{content.content}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title" className="text-white font-medium">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <Label htmlFor="duration" className="text-white font-medium">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 10 }))}
                className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-white font-medium">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
              rows={3}
            />
          </div>

          {/* Type-specific settings */}
          {content.type === 'image' && (
            <div className="space-y-6 p-6 glass-effect rounded-2xl border border-green-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Image className="w-6 h-6 text-green-400" />
                <h4 className="font-bold text-green-400 text-lg">Image Display Settings</h4>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="background_color" className="text-white font-medium">Background Color</Label>
                  <div className="flex gap-3 mt-2">
                    <input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-14 h-12 rounded-lg border-2 border-white/20 cursor-pointer"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-green-500"
                    />
                  </div>
                  <p className="text-sm text-green-400 mt-2">
                    Background color for transparent images (PNG, GIF)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="image_width" className="text-white font-medium flex justify-between">
                    <span>Image Width</span>
                    <span className="text-green-400 font-mono">{formData.image_width}%</span>
                  </Label>
                  <div className="flex gap-3 mt-2 items-center">
                    <Slider
                      id="image_width"
                      min={10}
                      max={100}
                      step={1}
                      value={[formData.image_width]}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, image_width: value[0] }))}
                      className="flex-1"
                    />
                    <Maximize2 className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-sm text-green-400 mt-2">
                    Controls how much of the screen width the image occupies
                  </p>
                </div>
              </div>
            </div>
          )}

          {content.type === 'video' && (
            <div className="space-y-4 p-6 glass-effect rounded-2xl border border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Video className="w-6 h-6 text-purple-400" />
                <h4 className="font-bold text-purple-400 text-lg">Video Display Settings</h4>
              </div>
              <div>
                <Label htmlFor="background_color" className="text-white font-medium">Background Color</Label>
                <div className="flex gap-3 mt-2">
                  <input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                    className="w-14 h-12 rounded-lg border-2 border-white/20 cursor-pointer"
                  />
                  <Input
                    value={formData.background_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500"
                  />
                </div>
                <p className="text-sm text-purple-400 mt-2">
                  Background color for areas around video content
                </p>
              </div>
            </div>
          )}

          {content.type === 'text' && (
            <div className="space-y-4 p-6 glass-effect rounded-2xl border border-yellow-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Type className="w-6 h-6 text-yellow-400" />
                <h4 className="font-bold text-yellow-400 text-lg">Text Display Settings</h4>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="background_color" className="text-white font-medium">Background Color</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-12 h-10 rounded border-2 border-white/20 cursor-pointer"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-yellow-500"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="text_color" className="text-white font-medium">Text Color</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                      className="w-12 h-10 rounded border-2 border-white/20 cursor-pointer"
                    />
                    <Input
                      value={formData.text_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-yellow-500"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="font_size" className="text-white font-medium">Font Size</Label>
                  <Select
                    value={formData.font_size}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, font_size: value }))}
                  >
                    <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-white focus:border-yellow-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-effect text-white border-white/20">
                      <SelectItem value="small" className="hover:bg-white/10">Small</SelectItem>
                      <SelectItem value="medium" className="hover:bg-white/10">Medium</SelectItem>
                      <SelectItem value="large" className="hover:bg-white/10">Large</SelectItem>
                      <SelectItem value="xlarge" className="hover:bg-white/10">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {content.type === 'pdf' && (
            <div className="space-y-4 p-6 glass-effect rounded-2xl border border-orange-500/20">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-orange-400" />
                <h4 className="font-bold text-orange-400 text-lg">PDF Settings</h4>
              </div>
              <div>
                <Label htmlFor="pdf_page" className="text-white font-medium">Page Number</Label>
                <Input
                  id="pdf_page"
                  type="number"
                  min="1"
                  value={formData.pdf_page}
                  onChange={(e) => setFormData(prev => ({ ...prev, pdf_page: parseInt(e.target.value) || 1 }))}
                  className="mt-2 w-32 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
                />
                <p className="text-sm text-orange-400 mt-2">
                  Specify which page to display (leave as 1 to show full PDF)
                </p>
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <Label className="text-white font-medium">Tags</Label>
            <div className="flex gap-3 mt-2 mb-4">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500"
              />
              <Button type="button" onClick={addTag} className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} className="flex items-center gap-2 bg-white/10 text-white border border-white/20 px-3 py-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-8 border-t border-white/10">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !formData.title}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-none shadow-lg"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

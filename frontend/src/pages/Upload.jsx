
import { useState, useRef } from "react";
import { UploadFile } from "@/api/integrations";
import { ContentItem } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Upload as UploadIcon, 
  Image, 
  Video, 
  Globe, 
  Youtube, 
  FileText, 
  Plus,
  X,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 10,
    tags: [],
    pdf_page: 1,
    background_color: '#ffffff',
    text_color: '#000000',
    font_size: 'large'
  });
  const [currentTag, setCurrentTag] = useState('');
  const [contentType, setContentType] = useState('image');
  const [urlContent, setUrlContent] = useState('');
  const [textContent, setTextContent] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isPdf = file.type === 'application/pdf';
      return isImage || isVideo || isPdf;
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

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
    setIsUploading(true);

    try {
      if (contentType === 'image' || contentType === 'video' || contentType === 'pdf') {
        // For file uploads, process the first file immediately.
        if (uploadedFiles.length > 0) {
            const file = uploadedFiles[0];
            const { file_url } = await UploadFile({ file });
            
            let thumbnail = file_url;
            if (contentType === 'video') {
              // Thumbnail generation can be slow, skip for now to improve UX
              thumbnail = ''; 
            }

            await ContentItem.create({
              title: formData.title || file.name,
              type: contentType,
              content: file_url,
              duration: formData.duration,
              description: formData.description,
              tags: formData.tags,
              thumbnail: thumbnail,
              pdf_page: contentType === 'pdf' ? formData.pdf_page : undefined,
              background_color: formData.background_color,
              is_active: true
            });

            // Handle remaining files in the background without waiting
            for (let i = 1; i < uploadedFiles.length; i++) {
              const subsequentFile = uploadedFiles[i];
              UploadFile({ file: subsequentFile }).then(async ({ file_url: subsequentFileUrl }) => {
                let thumbnailForSubsequent = subsequentFileUrl;
                if (contentType === 'video') {
                  thumbnailForSubsequent = ''; 
                }
                await ContentItem.create({
                  title: formData.title || subsequentFile.name,
                  type: contentType,
                  content: subsequentFileUrl,
                  duration: formData.duration,
                  description: formData.description,
                  tags: formData.tags,
                  thumbnail: thumbnailForSubsequent,
                  pdf_page: contentType === 'pdf' ? formData.pdf_page : undefined,
                  background_color: formData.background_color,
                  is_active: true
                });
              }).catch(error => {
                console.error("Background upload error for file:", subsequentFile.name, error);
              });
            }
        }
      } else if (contentType === 'webpage' || contentType === 'youtube') {
        let processedUrl = urlContent;
        if (contentType === 'youtube') {
          // Convert YouTube URLs to embed format
          const videoId = extractYouTubeId(urlContent);
          processedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&showinfo=0&rel=0` : urlContent;
        }

        await ContentItem.create({
          title: formData.title,
          type: contentType,
          content: processedUrl,
          duration: formData.duration,
          description: formData.description,
          tags: formData.tags,
          thumbnail: contentType === 'youtube' && extractYouTubeId(urlContent) ? `https://img.youtube.com/vi/${extractYouTubeId(urlContent)}/maxresdefault.jpg` : null,
          background_color: formData.background_color, // Added background_color for webpage/youtube
          is_active: true
        });
      } else if (contentType === 'text') {
        await ContentItem.create({
          title: formData.title,
          type: 'text',
          content: textContent,
          duration: formData.duration,
          description: formData.description,
          tags: formData.tags,
          background_color: formData.background_color,
          text_color: formData.text_color,
          font_size: formData.font_size,
          is_active: true
        });
      }

      navigate(createPageUrl("ContentLibrary"));
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false); // Only set to false on error
    }
    // No need to set isUploading to false here as we are navigating away
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[1] && match[1].length === 11) ? match[1] : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-4 md:p-8 relative">
      <div className="hexagon-pattern absolute inset-0 opacity-10"></div>
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload Content</h1>
          <p className="text-gray-300">Add new media to your digital signage library</p>
        </div>

        <Card className="glass-effect border border-white/10 shadow-2xl">
          <CardHeader className="pb-6 border-b border-white/10">
            <CardTitle className="text-2xl text-white">Add New Content</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs value={contentType} onValueChange={setContentType} className="w-full">
                <TabsList className="grid grid-cols-6 w-full h-14 bg-white/5 border border-white/10">
                  <TabsTrigger value="image" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 text-gray-300 transition-all duration-200">
                    <Image className="w-4 h-4" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 text-gray-300 transition-all duration-200">
                    <Video className="w-4 h-4" />
                    Video
                  </TabsTrigger>
                  <TabsTrigger value="pdf" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 text-gray-300 transition-all duration-200">
                    <FileText className="w-4 h-4" />
                    PDF
                  </TabsTrigger>
                  <TabsTrigger value="webpage" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 text-gray-300 transition-all duration-200">
                    <Globe className="w-4 h-4" />
                    Webpage
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 text-gray-300 transition-all duration-200">
                    <Youtube className="w-4 h-4" />
                    YouTube
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 text-gray-300 transition-all duration-200">
                    <FileText className="w-4 h-4" />
                    Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="image" className="mt-6">
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                      dragActive ? 'border-orange-500 bg-orange-500/10' : 'border-white/20 hover:border-white/40'
                    } glass-effect`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Drop your images here, or click to browse
                    </h3>
                    <p className="text-gray-400 mb-4">Support for JPG, PNG, GIF, WebP</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30"
                    >
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Choose Images
                    </Button>
                  </div>
                  
                  {/* Background Color Setting for Images */}
                  <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <Label htmlFor="image_background_color" className="text-gray-300">Background Color</Label>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                        className="w-12 h-10 rounded border border-white/20 cursor-pointer"
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                        placeholder="#ffffff"
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white/20"
                      />
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Background color for images with transparency (PNG, GIF)
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="video" className="mt-6">
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                      dragActive ? 'border-orange-500 bg-orange-500/10' : 'border-white/20 hover:border-white/40'
                    } glass-effect`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Drop your videos here, or click to browse
                    </h3>
                    <p className="text-gray-400 mb-4">Support for MP4, WebM, AVI, MOV</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30"
                    >
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Choose Videos
                    </Button>
                  </div>
                  
                  {/* Background Color Setting for Videos */}
                  <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <Label htmlFor="video_background_color" className="text-gray-300">Background Color</Label>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                        className="w-12 h-10 rounded border border-white/20 cursor-pointer"
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                        placeholder="#ffffff"
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white/20"
                      />
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Background color visible around video content
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="pdf" className="mt-6">
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                      dragActive ? 'border-orange-500 bg-orange-500/10' : 'border-white/20 hover:border-white/40'
                    } glass-effect`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="application/pdf"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Drop your PDF files here, or click to browse
                    </h3>
                    <p className="text-gray-400 mb-4">Support for PDF documents</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30"
                    >
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Choose PDFs
                    </Button>
                  </div>
                  <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <Label htmlFor="pdf_page" className="text-gray-300">PDF Page (optional)</Label>
                    <Input
                      id="pdf_page"
                      type="number"
                      min="1"
                      value={formData.pdf_page}
                      onChange={(e) => setFormData(prev => ({ ...prev, pdf_page: parseInt(e.target.value) || 1 }))}
                      placeholder="Leave blank to show full PDF"
                      className="mt-2 w-32 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white/20"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      Specify a page number to display a single page. Default is 1.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="webpage" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-6 bg-white/5 rounded-xl border border-white/10">
                      <Globe className="w-8 h-8 text-orange-400" />
                      <div>
                        <h3 className="font-semibold text-white">Add Webpage Content</h3>
                        <p className="text-gray-300 text-sm">Display any website in your signage</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="webpage-url" className="text-gray-300">Website URL</Label>
                      <Input
                        id="webpage-url"
                        type="url"
                        placeholder="https://example.com"
                        value={urlContent}
                        onChange={(e) => setUrlContent(e.target.value)}
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white/20"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="youtube" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-6 bg-white/5 rounded-xl border border-white/10">
                      <Youtube className="w-8 h-8 text-orange-400" />
                      <div>
                        <h3 className="font-semibold text-white">Add YouTube Video</h3>
                        <p className="text-gray-300 text-sm">Embed YouTube videos in your playlist</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="youtube-url" className="text-gray-300">YouTube URL</Label>
                      <Input
                        id="youtube-url"
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={urlContent}
                        onChange={(e) => setUrlContent(e.target.value)}
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white/20"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-6 bg-white/5 rounded-xl border border-white/10">
                      <FileText className="w-8 h-8 text-orange-400" />
                      <div>
                        <h3 className="font-semibold text-white">Create Text Slide</h3>
                        <p className="text-gray-300 text-sm">Display custom text messages</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="text-content" className="text-gray-300">Text Content</Label>
                      <Textarea
                        id="text-content"
                        placeholder="Enter your text content here..."
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        className="mt-2 min-h-32 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white/20"
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <Label htmlFor="background_color" className="text-gray-300">Background Color</Label>
                        <div className="flex gap-2 mt-2">
                          <input
                            type="color"
                            value={formData.background_color}
                            onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                            className="w-12 h-10 rounded border border-white/20 cursor-pointer"
                          />
                          <Input
                            value={formData.background_color}
                            onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white/20"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="text_color" className="text-gray-300">Text Color</Label>
                        <div className="flex gap-2 mt-2">
                          <input
                            type="color"
                            value={formData.text_color}
                            onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                            className="w-12 h-10 rounded border border-white/20 cursor-pointer"
                          />
                          <Input
                            value={formData.text_color}
                            onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white/20"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="font_size" className="text-gray-300">Font Size</Label>
                        <Select
                          value={formData.font_size}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, font_size: value }))}
                        >
                          <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-white focus:border-orange-500 focus:bg-white/20">
                            <SelectValue placeholder="Select font size" className="text-gray-300"/>
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-white/20 text-white">
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                            <SelectItem value="xlarge">Extra Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* File List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Selected Files</h4>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 glass-effect rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        {file.type.startsWith('image/') ? (
                          <Image className="w-6 h-6 text-orange-400" />
                        ) : file.type.startsWith('video/') ? (
                          <Video className="w-6 h-6 text-orange-400" />
                        ) : file.type === 'application/pdf' ? (
                          <FileText className="w-6 h-6 text-orange-400" />
                        ) : (
                          <FileText className="w-6 h-6 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium text-white">{file.name}</p>
                          <p className="text-sm text-gray-400 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Form Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title" className="text-white">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter content title"
                    className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white/20"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration" className="text-white">Display Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 10 }))}
                    className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white/20"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for this content"
                  className="mt-2 min-h-32 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white/20"
                />
              </div>

              <div>
                <Label className="text-white">Tags</Label>
                <div className="flex gap-2 mt-2 mb-3">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white/20"
                  />
                  <Button type="button" onClick={addTag} variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-white/10 text-white border border-white/20">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-gray-400 hover:text-orange-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl("ContentLibrary"))}
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isUploading || (!uploadedFiles.length && !urlContent && !textContent)}
                  className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-lg"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Content
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

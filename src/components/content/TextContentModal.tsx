'use client';

import { useState } from 'react';
import { X, Type, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCSRF } from '@/hooks/useCSRF';

interface TextContentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function TextContentModal({ onClose, onSuccess }: TextContentModalProps) {
  const { secureFetch } = useCSRF();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    textContent: '',
    fontSize: '3rem',
    fontColor: '#ffffff',
    textAlign: 'center' as 'left' | 'center' | 'right',
    duration: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Please enter a name for the text content');
      return;
    }
    
    if (!formData.textContent.trim()) {
      setError('Please enter some text content to display');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await secureFetch('/api/content/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          content: formData.textContent,
          fontSize: formData.fontSize,
          fontColor: formData.fontColor,
          textAlign: formData.textAlign,
          duration: formData.duration,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create text content');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white/[0.02] backdrop-blur-xl backdrop-saturate-150 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border-2 border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Type className="w-6 h-6 text-brand-orange-500" />
            <h2 className="text-xl font-semibold text-white">Create Text Content</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 backdrop-blur-sm border border-red-500/50 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-300 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-white/70 text-sm">
                Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                placeholder="Enter a name for this text"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-white/70 text-sm">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                placeholder="Optional description"
                rows={2}
              />
            </div>

            {/* Text Content */}
            <div>
              <Label htmlFor="textContent" className="text-white/70 text-sm">
                Text Content *
              </Label>
              <Textarea
                id="textContent"
                value={formData.textContent}
                onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                required
                className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                placeholder="Enter the text to display"
                rows={5}
              />
            </div>

            {/* Font Size */}
            <div>
              <Label htmlFor="fontSize" className="text-white/70 text-sm">
                Font Size
              </Label>
              <Input
                id="fontSize"
                type="text"
                value={formData.fontSize}
                onChange={(e) => setFormData({ ...formData, fontSize: e.target.value })}
                className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                placeholder="3rem"
              />
              <p className="text-white/50 text-xs mt-1">
                Use CSS units like rem, em, px, or %
              </p>
            </div>

            {/* Font Color */}
            <div>
              <Label className="text-white/70 text-sm">Font Color</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={formData.fontColor}
                  onChange={(e) => setFormData({ ...formData, fontColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer border-2 border-white/10"
                />
                <Input
                  type="text"
                  value={formData.fontColor}
                  onChange={(e) => setFormData({ ...formData, fontColor: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                />
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <Label className="text-white/70 text-sm">Text Alignment</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, textAlign: 'left' })}
                  className={`px-3 py-2 rounded-lg border transition ${
                    formData.textAlign === 'left'
                      ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                      : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, textAlign: 'center' })}
                  className={`px-3 py-2 rounded-lg border transition ${
                    formData.textAlign === 'center'
                      ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                      : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  Center
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, textAlign: 'right' })}
                  className={`px-3 py-2 rounded-lg border transition ${
                    formData.textAlign === 'right'
                      ? 'bg-brand-orange-500 border-brand-orange-500 text-white'
                      : 'bg-white/5 backdrop-blur-sm border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  Right
                </button>
              </div>
            </div>

            {/* Display Duration */}
            <div>
              <Label htmlFor="duration" className="text-white/70 text-sm">
                Display Duration (seconds)
              </Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 10 })}
                className="mt-1 bg-white/5 backdrop-blur-sm border-white/10 text-white focus:bg-white/10"
                placeholder="10"
                min="1"
              />
              <p className="text-white/50 text-xs mt-1">
                How long to display this text when shown
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-white hover:bg-white/10 backdrop-blur-sm"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-brand-orange-500/90 backdrop-blur-sm hover:bg-brand-orange-600/90 text-white"
              disabled={loading || !formData.name.trim() || !formData.textContent.trim()}
            >
              {loading ? 'Creating...' : 'Create Text'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
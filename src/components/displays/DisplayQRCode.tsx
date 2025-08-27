'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode';
import { Display } from '@/types/display';

interface DisplayQRCodeProps {
  display: Display;
  isOpen: boolean;
  onClose: () => void;
}

export function DisplayQRCode({ display, isOpen, onClose }: DisplayQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/display/${display.uniqueUrl}`;

  useEffect(() => {
    generateQRCode();
  }, [display]);

  const generateQRCode = async () => {
    try {
      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(displayUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#252c3a', // brand-gray-900
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);

      // Also generate on canvas for download
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, displayUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#252c3a',
            light: '#ffffff',
          },
        });
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `display-${display.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Display QR Code - ${display.name}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .container {
                text-align: center;
                max-width: 600px;
              }
              h1 {
                font-size: 28px;
                margin-bottom: 10px;
              }
              .location {
                font-size: 18px;
                color: #666;
                margin-bottom: 30px;
              }
              .qr-code {
                margin: 30px 0;
              }
              .url {
                font-family: monospace;
                font-size: 14px;
                background: #f5f5f5;
                padding: 10px;
                border-radius: 4px;
                word-break: break-all;
                margin-bottom: 30px;
              }
              .instructions {
                text-align: left;
                background: #f9f9f9;
                padding: 20px;
                border-radius: 8px;
                margin-top: 30px;
              }
              .instructions h2 {
                font-size: 18px;
                margin-bottom: 15px;
              }
              .instructions ol {
                margin: 0;
                padding-left: 20px;
              }
              .instructions li {
                margin-bottom: 10px;
              }
              @media print {
                body {
                  min-height: auto;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${display.name}</h1>
              ${display.location ? `<div class="location">${display.location}</div>` : ''}
              <div class="qr-code">
                <img src="${qrDataUrl}" alt="QR Code" style="width: 400px; height: 400px;" />
              </div>
              <div class="url">${displayUrl}</div>
              <div class="instructions">
                <h2>Setup Instructions:</h2>
                <ol>
                  <li>Power on the Raspberry Pi display device</li>
                  <li>Ensure the device is connected to the network</li>
                  <li>Open a web browser on the device</li>
                  <li>Scan this QR code or manually enter the URL above</li>
                  <li>The display will automatically start showing the assigned playlist</li>
                  <li>For kiosk mode, press F11 to enter fullscreen</li>
                </ol>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-brand-gray-900/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white">
              Display QR Code
            </DialogTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Display Info */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">{display.name}</h2>
            {display.location && (
              <p className="text-white/70">{display.location}</p>
            )}
          </div>

          {/* QR Code */}
          <div className="flex justify-center bg-white rounded-lg p-4">
            <canvas ref={canvasRef} className="hidden" />
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR Code" className="w-80 h-80" />
            )}
          </div>

          {/* URL Display */}
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-white/70 text-sm mb-1">Display URL:</p>
            <p className="text-white font-mono text-sm break-all">{displayUrl}</p>
          </div>

          {/* Instructions */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Quick Setup Instructions:</h3>
            <ol className="space-y-2 text-white/70 text-sm list-decimal list-inside">
              <li>Power on the display device</li>
              <li>Connect to network if not already connected</li>
              <li>Scan this QR code or enter the URL manually</li>
              <li>The display will auto-configure and start playing content</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3">
            <Button
              onClick={handleDownload}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </Button>
            <Button
              onClick={handlePrint}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DisplayQRCode;
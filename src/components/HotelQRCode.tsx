import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, QrCode, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface HotelQRCodeProps {
  hotelName: string;
  hotelSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// The PUBLISHED customer URL. The QR must NEVER point at the Lovable editor
// preview origin (id-preview--*.lovable.app) — scanning that prompts a Lovable
// login. We always pin the QR to the public published origin.
const PUBLISHED_ORIGIN = 'https://nalapaka.lovable.app';

function getPublicOrigin(): string {
  if (typeof window === 'undefined') return PUBLISHED_ORIGIN;
  const host = window.location.hostname;
  // If we're inside the Lovable editor preview, force the published origin.
  if (host.includes('id-preview--') || host.includes('lovableproject.com') || host === 'localhost' || host.startsWith('127.')) {
    return PUBLISHED_ORIGIN;
  }
  return window.location.origin;
}

export function HotelQRCode({ hotelName, hotelSlug, open, onOpenChange }: HotelQRCodeProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const guestUrl = `${getPublicOrigin()}/guest/${hotelSlug}`;

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${hotelSlug}-menu-qr.png`;
    link.href = url;
    link.click();
    toast.success('QR code downloaded');
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(guestUrl);
    toast.success('Menu link copied');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            {hotelName} — Menu QR
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div ref={canvasRef} className="p-4 bg-white rounded-lg border-2 border-primary/20">
            <QRCodeCanvas
              value={guestUrl}
              size={240}
              level="H"
              includeMargin
            />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">Scan to view {hotelName} menu</p>
            <p className="text-xs text-muted-foreground break-all">{guestUrl}</p>
          </div>
          <div className="flex gap-2 w-full">
            <Button onClick={handleCopyLink} variant="outline" className="flex-1">
              <Copy className="h-4 w-4 mr-1" /> Copy Link
            </Button>
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

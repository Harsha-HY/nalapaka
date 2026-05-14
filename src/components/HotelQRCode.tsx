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
  tableNumber?: string;
}

const PUBLISHED_ORIGIN = 'https://nalapaka.lovable.app';

function getPublicOrigin(): string {
  if (typeof window === 'undefined') return PUBLISHED_ORIGIN;
  const host = window.location.hostname;
  if (host.includes('id-preview--') || host.includes('lovableproject.com') || host === 'localhost' || host.startsWith('127.')) {
    return PUBLISHED_ORIGIN;
  }
  return window.location.origin;
}

export function HotelQRCode({ hotelName, hotelSlug, open, onOpenChange, tableNumber }: HotelQRCodeProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const tablePart = tableNumber ? `/${encodeURIComponent(tableNumber)}` : '';
  const guestUrl = `${getPublicOrigin()}/guest/${hotelSlug}${tablePart}`;

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const suffix = tableNumber ? `-table-${tableNumber}` : '';
    link.download = `${hotelSlug}${suffix}-qr.png`;
    link.href = url;
    link.click();
    toast.success('QR code downloaded');
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(guestUrl);
    toast.success('Link copied');
  };

  const title = tableNumber
    ? `${hotelName} — Table ${tableNumber}`
    : `${hotelName} — Menu QR`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div ref={canvasRef} className="p-4 bg-white rounded-lg border-2 border-primary/20">
            <QRCodeCanvas value={guestUrl} size={240} level="H" includeMargin />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              {tableNumber
                ? `Place this on Table ${tableNumber}`
                : `Scan to view ${hotelName} menu`}
            </p>
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

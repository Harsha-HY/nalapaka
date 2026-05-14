import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Download, Copy, QrCode, Printer } from 'lucide-react';
import { toast } from 'sonner';

const PUBLISHED_ORIGIN = 'https://nalapaka.lovable.app';
function getPublicOrigin(): string {
  if (typeof window === 'undefined') return PUBLISHED_ORIGIN;
  const host = window.location.hostname;
  if (host.includes('id-preview--') || host.includes('lovableproject.com') || host === 'localhost' || host.startsWith('127.')) {
    return PUBLISHED_ORIGIN;
  }
  return window.location.origin;
}

interface TableQRSectionProps {
  hotelName: string;
  hotelSlug: string;
}

export function TableQRSection({ hotelName, hotelSlug }: TableQRSectionProps) {
  const [tableInput, setTableInput] = useState('');
  const [generatedTable, setGeneratedTable] = useState<string | null>(null);

  const generate = (e: React.FormEvent) => {
    e.preventDefault();
    const t = tableInput.trim();
    if (!t) {
      toast.error('Enter a table number');
      return;
    }
    setGeneratedTable(t);
  };

  const guestUrl = generatedTable
    ? `${getPublicOrigin()}/guest/${hotelSlug}/${encodeURIComponent(generatedTable)}`
    : '';

  const handleDownload = () => {
    if (!generatedTable) return;
    const canvas = document.querySelector<HTMLCanvasElement>('#table-qr-canvas canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${hotelSlug}-table-${generatedTable}-qr.png`;
    link.href = url;
    link.click();
    toast.success('QR code downloaded');
  };

  const handleCopy = async () => {
    if (!guestUrl) return;
    await navigator.clipboard.writeText(guestUrl);
    toast.success('Link copied');
  };

  const handlePrint = () => {
    if (!generatedTable) return;
    const canvas = document.querySelector<HTMLCanvasElement>('#table-qr-canvas canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const w = window.open('', '_blank', 'width=600,height=800');
    if (!w) return;
    w.document.write(`
      <html><head><title>Table ${generatedTable} QR</title>
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; }
        h1 { font-size: 24px; margin-bottom: 4px; }
        h2 { font-size: 48px; margin: 12px 0 24px; }
        img { width: 320px; height: 320px; border: 2px solid #ccc; padding: 12px; border-radius: 12px; }
        p { color: #666; margin-top: 16px; font-size: 12px; word-break: break-all; }
      </style></head><body>
        <h1>${hotelName}</h1>
        <h2>Table ${generatedTable}</h2>
        <img src="${dataUrl}" alt="QR" />
        <p>Scan to order from this table</p>
        <p>${guestUrl}</p>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <Card className="shadow-soft border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          Table QR Codes
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate a separate QR for each table. Customers scanning it will be auto-assigned to that table — no manual table entry needed.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={generate} className="flex gap-2 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="table-qr-input">Table Number</Label>
            <Input
              id="table-qr-input"
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
              placeholder="e.g. 1, 2, 3..."
              className="h-12 text-center text-lg"
            />
          </div>
          <Button type="submit" className="h-12">
            <QrCode className="h-4 w-4 mr-1" />
            Generate
          </Button>
        </form>

        {generatedTable && (
          <div className="flex flex-col items-center gap-4 pt-2 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{hotelName}</p>
              <p className="text-2xl font-bold">Table {generatedTable}</p>
            </div>
            <div id="table-qr-canvas" className="p-4 bg-white rounded-lg border-2 border-primary/20">
              <QRCodeCanvas value={guestUrl} size={240} level="H" includeMargin />
            </div>
            <p className="text-xs text-muted-foreground break-all text-center max-w-xs">{guestUrl}</p>
            <div className="flex gap-2 w-full max-w-md">
              <Button onClick={handleCopy} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
              <Button onClick={handlePrint} variant="outline" className="flex-1">
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
              <Button onClick={handleDownload} className="flex-1">
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

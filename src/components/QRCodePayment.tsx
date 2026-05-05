import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHotelContext } from '@/hooks/useHotelContext';
import { useHotelUpi, buildUpiUri } from '@/hooks/useHotelUpi';
import { AlertCircle } from 'lucide-react';

interface QRCodePaymentProps {
  amount: number;
  orderId: string;
  size?: number;
  showCard?: boolean;
  /** Override the hotel from context (e.g. for ServerDashboard which uses staff hotel anyway) */
  hotelId?: string;
}

export function QRCodePayment({ amount, orderId, size = 200, showCard = true, hotelId: hotelIdProp }: QRCodePaymentProps) {
  const { language } = useLanguage();
  const { hotelId: ctxHotelId } = useHotelContext();
  const hotelId = hotelIdProp ?? ctxHotelId ?? null;
  const { upi, loading } = useHotelUpi(hotelId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  const upiId = upi?.upi_id?.trim() || null;
  const payeeName = upi?.upi_name?.trim() || upi?.upi_bank_name?.trim() || 'Merchant';
  const upiUri = upiId ? buildUpiUri(upiId, payeeName, amount, orderId) : null;
  const scannerUrl = upi?.upi_scanner_url?.trim() || null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !upiUri) return;

    QRCode.toCanvas(
      canvas,
      upiUri,
      { width: size, margin: 2, color: { dark: '#000000', light: '#ffffff' } },
      (err) => {
        if (err) {
          console.error('QR generation error:', err);
          setError(true);
        }
      }
    );
  }, [upiUri, size]);

  const content = (
    <div className="flex flex-col items-center gap-3">
      {scannerUrl ? (
        <>
          <img
            src={scannerUrl}
            alt="Uploaded UPI scanner"
            className="rounded-lg object-contain border bg-background"
            style={{ width: size, height: size }}
          />
          <p className="text-sm text-muted-foreground text-center">
            {language === 'kn' ? `₹${amount} ಪಾವತಿಸಿ` : `Pay ₹${amount}${upiId ? ` to ${upiId}` : ''}`}
          </p>
        </>
      ) : !upiId && !loading ? (
        <div className="w-full p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex flex-col items-center text-center gap-2">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-sm text-destructive font-medium">
            {language === 'kn'
              ? 'UPI ಇನ್ನೂ ಸಂರಚಿಸಲಾಗಿಲ್ಲ'
              : 'UPI not configured for this hotel'}
          </p>
          <p className="text-xs text-muted-foreground">
            {language === 'kn'
              ? 'ಮ್ಯಾನೇಜರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ UPI ID ಸೇರಿಸಿ'
              : 'Manager: add UPI ID in Dashboard → Payment Settings'}
          </p>
        </div>
      ) : error ? (
        <div className="w-full h-[200px] flex items-center justify-center bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">QR code unavailable</p>
        </div>
      ) : (
        <>
          <canvas ref={canvasRef} className="rounded-lg" />
          <p className="text-sm text-muted-foreground text-center">
            {language === 'kn'
              ? `QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ₹${amount} ಪಾವತಿಸಿ`
              : `Scan to pay ₹${amount} to ${payeeName}`}
          </p>
        </>
      )}
    </div>
  );

  if (!showCard) return content;

  return (
    <Card className="shadow-soft border-0 bg-white dark:bg-card">
      <CardContent className="p-4">{content}</CardContent>
    </Card>
  );
}

/**
 * Build a UPI deep link for a given hotel. Returns null if hotel UPI is not configured.
 * Caller is responsible for handling the null case (e.g. show an error message).
 */
export function buildHotelUpiUri(
  hotelUpiId: string | null | undefined,
  hotelUpiName: string | null | undefined,
  amount: number,
  orderId: string
): string | null {
  if (!hotelUpiId || !hotelUpiId.trim()) return null;
  return buildUpiUri(hotelUpiId.trim(), (hotelUpiName || 'Merchant').trim(), amount, orderId);
}

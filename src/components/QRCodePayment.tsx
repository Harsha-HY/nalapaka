import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface QRCodePaymentProps {
  amount: number;
  orderId: string;
  size?: number;
  showCard?: boolean;
}

// UPI ID for payment
const UPI_ID = '8951525788@ybl';
const UPI_NAME = 'Harsha H Y';

export function QRCodePayment({ amount, orderId, size = 200, showCard = true }: QRCodePaymentProps) {
  const { language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  // Generate UPI URI
  const upiUri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=Order-${orderId.slice(0, 8)}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, upiUri, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    }, (err) => {
      if (err) {
        console.error('QR generation error:', err);
        setError(true);
      }
    });
  }, [upiUri, size]);

  const content = (
    <div className="flex flex-col items-center gap-3">
      {error ? (
        <div className="w-full h-[200px] flex items-center justify-center bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">QR code unavailable</p>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="rounded-lg"
        />
      )}
      <p className="text-sm text-muted-foreground text-center">
        {language === 'kn' 
          ? `QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ₹${amount} ಪಾವತಿಸಿ`
          : `Scan this QR code to pay ₹${amount}`
        }
      </p>
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card className="shadow-soft border-0 bg-white dark:bg-card">
      <CardContent className="p-4">
        {content}
      </CardContent>
    </Card>
  );
}

// Export the UPI URI generator for use elsewhere
export function generateUPIUri(amount: number, orderId: string): string {
  return `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=Order-${orderId.slice(0, 8)}`;
}

import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, ExternalLink } from 'lucide-react';
import { QRCodePayment, generateUPIUri } from '@/components/QRCodePayment';

interface UPIPaymentModalProps {
  open: boolean;
  onClose: () => void;
  totalAmount: number;
  orderId: string;
  onPaymentInitiated: () => void;
}

export function UPIPaymentModal({ open, onClose, totalAmount, orderId, onPaymentInitiated }: UPIPaymentModalProps) {
  const { language } = useLanguage();

  const handleUPIPayment = () => {
    // Create UPI deep link
    const upiUrl = generateUPIUri(totalAmount, orderId);
    
    // Try to open UPI app
    window.location.href = upiUrl;
    
    // Mark payment as initiated
    onPaymentInitiated();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Smartphone className="h-6 w-6" />
            {language === 'kn' ? 'ಆನ್‌ಲೈನ್ ಪಾವತಿ' : 'Pay Online'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {language === 'kn' ? 'ಒಟ್ಟು ಮೊತ್ತ' : 'Total Amount'}: ₹{totalAmount}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {/* QR Code */}
          <QRCodePayment amount={totalAmount} orderId={orderId} showCard={false} />
          
          <p className="text-center text-muted-foreground text-sm">
            {language === 'kn' 
              ? 'ಅಥವಾ ನಿಮ್ಮ UPI ಅಪ್ಲಿಕೇಶನ್ ತೆರೆಯಿರಿ' 
              : 'Or open your UPI app directly'}
          </p>
          
          <Button
            variant="outline"
            className="h-12"
            onClick={handleUPIPayment}
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            {language === 'kn' ? 'UPI ಅಪ್ಲಿಕೇಶನ್ ತೆರೆಯಿರಿ' : 'Open UPI App'}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            {language === 'kn' 
              ? 'Google Pay, PhonePe, Paytm ಅಥವಾ ಯಾವುದೇ UPI ಅಪ್ಲಿಕೇಶನ್ ಬಳಸಿ' 
              : 'Use Google Pay, PhonePe, Paytm or any UPI app'}
          </p>
          
          <div className="p-4 bg-warning/10 rounded-lg">
            <p className="text-sm text-center text-warning">
              {language === 'kn' 
                ? 'ಪಾವತಿ ಮಾಡಿದ ನಂತರ, ಮ್ಯಾನೇಜರ್ ದೃಢೀಕರಿಸುತ್ತಾರೆ' 
                : 'After payment, the manager will confirm'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

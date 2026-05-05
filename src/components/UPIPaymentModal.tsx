import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, AlertCircle } from 'lucide-react';
import { QRCodePayment, buildHotelUpiUri } from '@/components/QRCodePayment';
import { useHotelContext } from '@/hooks/useHotelContext';
import { useHotelUpi } from '@/hooks/useHotelUpi';

interface UPIPaymentModalProps {
  open: boolean;
  onClose: () => void;
  totalAmount: number;
  orderId: string;
  onPaymentInitiated: () => void;
}

export function UPIPaymentModal({ open, onClose, totalAmount, orderId, onPaymentInitiated }: UPIPaymentModalProps) {
  const { language } = useLanguage();
  const { hotelId } = useHotelContext();
  const { upi } = useHotelUpi(hotelId);

  const upiUrl = buildHotelUpiUri(upi?.upi_id, upi?.upi_name, totalAmount, orderId);
  const upiId = upi?.upi_id?.trim() || '';
  const bankName = upi?.upi_bank_name?.trim() || upi?.upi_name?.trim() || '';

  // Using <a> click rather than location.href avoids Android Chrome's
  // "unable to pay" / blocked navigation that happens when the upi:// scheme
  // is triggered from JS without a direct user-gesture link element.
  const handleAppClick = () => {
    onPaymentInitiated();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
          <QRCodePayment amount={totalAmount} orderId={orderId} showCard={false} />

          {upiUrl ? (
            <>
              <div className="rounded-lg border bg-muted/40 p-3 text-center space-y-1">
                <p className="text-sm text-muted-foreground">UPI ID</p>
                <p className="font-mono font-semibold break-all">{upiId}</p>
                {bankName && <p className="text-sm text-muted-foreground">{bankName}</p>}
              </div>

              <Button asChild className="h-12">
                <a href={upiUrl} onClick={handleAppClick} rel="noopener">
                  <Smartphone className="h-5 w-5 mr-2" />
                  {language === 'kn' ? 'ಪಾವತಿಸಲು ಮುಂದುವರಿಸಿ' : 'Proceed to Pay'}
                </a>
              </Button>
            </>
          ) : (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                {language === 'kn'
                  ? 'ಈ ಹೋಟೆಲ್‌ಗೆ UPI ಸಂರಚಿಸಲಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ನಗದು ಪಾವತಿಸಿ ಅಥವಾ ಮ್ಯಾನೇಜರ್ ಅವರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
                  : 'UPI is not set up for this hotel yet. Please pay by cash or ask the manager.'}
              </p>
            </div>
          )}

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

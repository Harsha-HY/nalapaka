import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Package } from 'lucide-react';

interface OrderTypeModalProps {
  open: boolean;
  onSelect: (type: 'dine-in' | 'parcel') => void;
}

export function OrderTypeModal({ open, onSelect }: OrderTypeModalProps) {
  const { language } = useLanguage();

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {language === 'kn' ? 'ಆರ್ಡರ್ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Select Order Type'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button
            variant="outline"
            className="h-20 text-lg flex flex-col items-center justify-center gap-2"
            onClick={() => onSelect('dine-in')}
          >
            <UtensilsCrossed className="h-8 w-8" />
            {language === 'kn' ? 'ಇಲ್ಲಿಯೇ (ಡೈನ್-ಇನ್)' : 'Here only (Dine-in)'}
          </Button>
          <Button
            variant="outline"
            className="h-20 text-lg flex flex-col items-center justify-center gap-2"
            onClick={() => onSelect('parcel')}
          >
            <Package className="h-8 w-8" />
            {language === 'kn' ? 'ಪಾರ್ಸೆಲ್ ತೆಗೆದುಕೊಳ್ಳಿ' : 'Take a Parcel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

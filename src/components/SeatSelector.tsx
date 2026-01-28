import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SeatSelectorProps {
  open: boolean;
  tableNumber: string;
  lockedSeats: string[];
  onSelect: (seats: string[]) => void;
  onClose: () => void;
}

const ALL_SEATS = ['A', 'B', 'C', 'D'];

export function SeatSelector({ open, tableNumber, lockedSeats, onSelect, onClose }: SeatSelectorProps) {
  const { language } = useLanguage();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const handleSeatToggle = (seat: string) => {
    if (lockedSeats.includes(seat)) return;
    
    setSelectedSeats(prev => 
      prev.includes(seat) 
        ? prev.filter(s => s !== seat)
        : [...prev, seat]
    );
  };

  const handleConfirm = () => {
    if (selectedSeats.length > 0) {
      onSelect(selectedSeats);
      setSelectedSeats([]);
    }
  };

  const handleClose = () => {
    setSelectedSeats([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'kn' 
              ? `ಟೇಬಲ್ ${tableNumber} - ಆಸನಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ` 
              : `Table ${tableNumber} - Select Seats`}
          </DialogTitle>
          <DialogDescription>
            {language === 'kn' 
              ? 'ನೀವು ಆಕ್ರಮಿಸಿರುವ ಆಸನಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ' 
              : 'Select the seats you are occupying'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-6">
          {ALL_SEATS.map((seat) => {
            const isLocked = lockedSeats.includes(seat);
            const isSelected = selectedSeats.includes(seat);

            return (
              <Button
                key={seat}
                variant={isSelected ? 'default' : 'outline'}
                size="lg"
                disabled={isLocked}
                onClick={() => handleSeatToggle(seat)}
                className={cn(
                  'h-20 text-2xl font-bold transition-all',
                  isLocked && 'opacity-50 bg-muted cursor-not-allowed line-through',
                  isSelected && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                {seat}
                {isLocked && (
                  <span className="block text-xs font-normal mt-1">
                    {language === 'kn' ? 'ಆಕ್ರಮಿತ' : 'Occupied'}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {lockedSeats.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            {language === 'kn' 
              ? `ಆಕ್ರಮಿತ ಆಸನಗಳು: ${lockedSeats.join(', ')}`
              : `Occupied seats: ${lockedSeats.join(', ')}`}
          </p>
        )}

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            {language === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleConfirm}
            disabled={selectedSeats.length === 0}
          >
            {language === 'kn' 
              ? `${selectedSeats.length} ಆಸನಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ` 
              : `Select ${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

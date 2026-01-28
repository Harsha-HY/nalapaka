import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLockedSeats } from '@/hooks/useLockedSeats';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableSeatModalProps {
  open: boolean;
  onSave: (tableNumber: string, seats: string[]) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const ALL_SEATS = ['A', 'B', 'C', 'D'];

export function TableSeatModal({ open, onSave, onClose, showCloseButton = false }: TableSeatModalProps) {
  const { t, language } = useLanguage();
  const { getLockedSeatsForTable, getAvailableSeats } = useLockedSeats();
  const [tableNumber, setTableNumber] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'table' | 'seats'>('table');

  const lockedSeats = tableNumber ? getLockedSeatsForTable(tableNumber) : [];
  const availableSeats = tableNumber ? getAvailableSeats(tableNumber) : ALL_SEATS;

  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) return;
    
    // Check if ALL seats are locked
    const available = getAvailableSeats(tableNumber.trim());
    if (available.length === 0) {
      setError(
        language === 'kn' 
          ? 'ಈ ಟೇಬಲ್ ತುಂಬಿದೆ. ದಯವಿಟ್ಟು ಹೋಟೆಲ್ ನಿರ್ವಹಣೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ.' 
          : 'This table is filled. Please contact hotel management.'
      );
      return;
    }
    
    setError(null);
    setStep('seats');
  };

  const handleSeatToggle = (seat: string) => {
    if (lockedSeats.includes(seat)) {
      setError(
        language === 'kn' 
          ? 'ಈ ಆಸನ ಈಗಾಗಲೇ ಆಕ್ರಮಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಂದು ಆಸನವನ್ನು ಆಯ್ಕೆಮಾಡಿ.' 
          : 'This seat is already occupied. Please select another seat.'
      );
      return;
    }
    
    setError(null);
    setSelectedSeats(prev => 
      prev.includes(seat) 
        ? prev.filter(s => s !== seat)
        : [...prev, seat]
    );
  };

  const handleConfirm = () => {
    if (selectedSeats.length > 0) {
      onSave(tableNumber.trim(), selectedSeats);
      handleReset();
    }
  };

  const handleReset = () => {
    setTableNumber('');
    setSelectedSeats([]);
    setError(null);
    setStep('table');
  };

  const handleClose = () => {
    handleReset();
    onClose?.();
  };

  const handleBack = () => {
    setSelectedSeats([]);
    setError(null);
    setStep('table');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && showCloseButton && handleClose()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => !showCloseButton && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {step === 'table' 
              ? t('enterTableNumber')
              : (language === 'kn' ? 'ಆಸನಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Select Seats')
            }
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 'table' 
              ? (language === 'kn' ? 'ನಿಮ್ಮ ಟೇಬಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ' : 'Enter your table number')
              : (language === 'kn' 
                  ? `ಟೇಬಲ್ ${tableNumber} - ನೀವು ಆಕ್ರಮಿಸಿರುವ ಆಸನಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ` 
                  : `Table ${tableNumber} - Select the seats you are occupying`)
            }
          </DialogDescription>
        </DialogHeader>
        
        {showCloseButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {step === 'table' ? (
          <form onSubmit={handleTableSubmit}>
            <div className="py-4">
              <Label htmlFor="table-number" className="sr-only">
                {t('tableNumber')}
              </Label>
              <Input
                id="table-number"
                placeholder={t('tableNumber')}
                value={tableNumber}
                onChange={(e) => {
                  setTableNumber(e.target.value);
                  setError(null);
                }}
                className="text-center text-2xl h-14"
                autoFocus
              />
              
              {error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">{error}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'kn' 
                        ? 'ದಯವಿಟ್ಟು ಹೋಟೆಲ್ ನಿರ್ವಹಣೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ.' 
                        : 'Please contact hotel management.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex-col gap-2">
              <Button type="submit" className="w-full h-12 text-lg" disabled={!tableNumber.trim()}>
                {language === 'kn' ? 'ಮುಂದುವರಿಸಿ' : 'Continue'}
              </Button>
              {showCloseButton && (
                <Button type="button" variant="outline" className="w-full" onClick={handleClose}>
                  {language === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </Button>
              )}
            </DialogFooter>
          </form>
        ) : (
          <div className="py-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
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
                      'h-20 text-2xl font-bold transition-all flex flex-col',
                      isLocked && 'opacity-50 bg-muted cursor-not-allowed',
                      isSelected && 'ring-2 ring-primary ring-offset-2'
                    )}
                  >
                    <span className={isLocked ? 'line-through' : ''}>{seat}</span>
                    {isLocked && (
                      <span className="text-xs font-normal">
                        {language === 'kn' ? 'ಆಕ್ರಮಿತ' : 'Occupied'}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
            
            {lockedSeats.length > 0 && (
              <p className="text-sm text-muted-foreground text-center mb-4">
                {language === 'kn' 
                  ? `ಆಕ್ರಮಿತ ಆಸನಗಳು: ${lockedSeats.join(', ')}`
                  : `Occupied seats: ${lockedSeats.join(', ')}`}
              </p>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleBack}>
                {language === 'kn' ? 'ಹಿಂದೆ' : 'Back'}
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleConfirm}
                disabled={selectedSeats.length === 0}
              >
                {language === 'kn' 
                  ? `${selectedSeats.length} ಆಸನ(ಗಳು)` 
                  : `${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

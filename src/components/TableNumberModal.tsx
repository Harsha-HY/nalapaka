import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLockedTables } from '@/hooks/useLockedTables';
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

interface TableNumberModalProps {
  open: boolean;
  onSave: (tableNumber: string) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function TableNumberModal({ open, onSave, onClose, showCloseButton = false }: TableNumberModalProps) {
  const { t, language } = useLanguage();
  const { isTableLocked } = useLockedTables();
  const [tableNumber, setTableNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) return;
    
    // Check if table is locked
    if (isTableLocked(tableNumber.trim())) {
      setError(
        language === 'kn' 
          ? 'ಈ ಟೇಬಲ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ / ಆಕ್ರಮಿಸಲಾಗಿದೆ.' 
          : 'This table is already registered / occupied.'
      );
      return;
    }
    
    setError(null);
    onSave(tableNumber.trim());
  };

  const handleClose = () => {
    setTableNumber('');
    setError(null);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && showCloseButton && handleClose()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => !showCloseButton && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {t('enterTableNumber')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {language === 'kn' ? 'ನಿಮ್ಮ ಟೇಬಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ' : 'Enter your table number'}
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
        
        <form onSubmit={handleSubmit}>
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
            
            {/* Error message for locked table */}
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
              {t('save')}
            </Button>
            {showCloseButton && (
              <Button type="button" variant="outline" className="w-full" onClick={handleClose}>
                {language === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

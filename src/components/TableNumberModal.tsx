import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface TableNumberModalProps {
  open: boolean;
  onSave: (tableNumber: string) => void;
}

export function TableNumberModal({ open, onSave }: TableNumberModalProps) {
  const { t } = useLanguage();
  const [tableNumber, setTableNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tableNumber.trim()) {
      onSave(tableNumber.trim());
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {t('enterTableNumber')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Label htmlFor="table-number" className="sr-only">
              {t('tableNumber')}
            </Label>
            <Input
              id="table-number"
              placeholder={t('tableNumber')}
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="text-center text-2xl h-14"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full h-12 text-lg" disabled={!tableNumber.trim()}>
              {t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

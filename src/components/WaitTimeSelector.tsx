import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Clock } from 'lucide-react';

interface WaitTimeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (minutes: number) => void;
}

export function WaitTimeSelector({ open, onClose, onSelect }: WaitTimeSelectorProps) {
  const waitTimes = [5, 10, 15];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Clock className="h-5 w-5" />
            Select Wait Time
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose the estimated time for order preparation
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          {waitTimes.map((minutes) => (
            <Button
              key={minutes}
              variant="outline"
              className="h-14 text-lg"
              onClick={() => onSelect(minutes)}
            >
              {minutes} minutes
            </Button>
          ))}
          <Button
            variant="ghost"
            className="h-12"
            onClick={() => onSelect(0)}
          >
            No wait time
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

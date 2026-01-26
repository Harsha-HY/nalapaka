import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  confirmedAt: string;
  waitTimeMinutes: number;
  compact?: boolean;
}

export function CountdownTimer({ confirmedAt, waitTimeMinutes, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const confirmed = new Date(confirmedAt).getTime();
      const endTime = confirmed + (waitTimeMinutes * 60 * 1000);
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [confirmedAt, waitTimeMinutes]);

  if (timeLeft <= 0) {
    return compact ? (
      <span className="text-green-600 font-medium">Ready!</span>
    ) : (
      <div className="flex items-center gap-2 text-green-600">
        <Clock className="h-5 w-5" />
        <span className="font-medium">Your order should be ready!</span>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  if (compact) {
    return (
      <span className="text-primary font-mono font-bold">{formattedTime}</span>
    );
  }

  return (
    <div className="flex items-center gap-2 text-primary">
      <Clock className="h-5 w-5 animate-pulse" />
      <span className="font-medium">Ready in: </span>
      <span className="font-mono text-xl font-bold">{formattedTime}</span>
    </div>
  );
}

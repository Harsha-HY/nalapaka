import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface ExtraItem {
  name: string;
  quantity: number;
  addedAt: string;
}

interface OrderExtraItemsBadgeProps {
  extraItems: ExtraItem[];
}

function getTimeAgo(addedAt: string): string | null {
  const now = new Date();
  const added = new Date(addedAt);
  const diffMs = now.getTime() - added.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins > 6) return null; // Stop showing after 6 minutes
  if (diffMins < 1) return 'just now';
  return `${diffMins}min ago`;
}

export function OrderExtraItemsBadge({ extraItems }: OrderExtraItemsBadgeProps) {
  const [, setTick] = useState(0);

  // Force re-render every 30 seconds to update time
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!extraItems || extraItems.length === 0) return null;

  const recentItems = extraItems.filter(item => getTimeAgo(item.addedAt) !== null);
  
  if (recentItems.length === 0) return null;

  return (
    <div className="mt-2 p-2 bg-accent rounded-md">
      <div className="flex items-center gap-1 mb-1">
        <Clock className="h-3 w-3" />
        <span className="text-xs font-semibold">New Items Added</span>
      </div>
      {recentItems.map((item, idx) => {
        const timeAgo = getTimeAgo(item.addedAt);
        return (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span>{item.name} × {item.quantity}</span>
            <Badge variant="secondary" className="text-xs py-0">
              {timeAgo}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

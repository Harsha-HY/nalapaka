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

// Get color for extra item based on order (1st = orange, 2nd = yellow, 3rd = blue, etc.)
function getExtraItemColor(index: number): string {
  const colors = [
    'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300', // 1st - Orange
    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300', // 2nd - Yellow
    'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300', // 3rd - Blue
    'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-300', // 4th - Purple
    'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 border-pink-300', // 5th - Pink
  ];
  return colors[index % colors.length];
}

export function OrderExtraItemsBadge({ extraItems }: OrderExtraItemsBadgeProps) {
  const [, setTick] = useState(0);

  // Force re-render every 30 seconds to update time
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!extraItems || extraItems.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-1 mb-1">
        <Clock className="h-3 w-3" />
        <span className="text-xs font-semibold">Extra Items Added</span>
      </div>
      {extraItems.map((item, idx) => {
        const timeAgo = getTimeAgo(item.addedAt);
        const colorClass = getExtraItemColor(idx);
        return (
          <div 
            key={idx} 
            className={`flex items-center justify-between text-sm p-2 rounded-md border ${colorClass}`}
          >
            <span className="font-medium">
              Extra #{idx + 1}: {item.name} × {item.quantity}
            </span>
            {timeAgo && (
              <Badge variant="outline" className="text-xs py-0 bg-background/50">
                {timeAgo}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}

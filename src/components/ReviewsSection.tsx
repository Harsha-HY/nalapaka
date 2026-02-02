import { Star, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReviews, Review } from '@/hooks/useReviews';
import { toast } from 'sonner';

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-muted-foreground text-sm">N/A</span>;
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

function AverageCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 bg-secondary/50 rounded-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center justify-center gap-1">
        <Star className={`h-4 w-4 ${value > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
        <span className="font-bold">{value > 0 ? value.toFixed(1) : '-'}</span>
      </div>
    </div>
  );
}

export function ReviewsSection() {
  const { todayReviews, todayAverages, deleteTodayReviews, isLoading } = useReviews();

  const handleClearReviews = async () => {
    if (!confirm('Are you sure you want to clear all today\'s reviews?')) return;
    
    try {
      await deleteTodayReviews();
      toast.success('Reviews cleared');
    } catch (error) {
      toast.error('Failed to clear reviews');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Today's Reviews ({todayReviews.length})
        </h2>
        {todayReviews.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearReviews}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Averages */}
      <Card className="shadow-soft border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Average Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            <AverageCard label="Food" value={todayAverages.food} />
            <AverageCard label="Service" value={todayAverages.service} />
            <AverageCard label="Hotel" value={todayAverages.hotel} />
            <AverageCard label="Website" value={todayAverages.website} />
            <AverageCard label="Overall" value={todayAverages.overall} />
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {todayReviews.length === 0 ? (
        <Card className="shadow-soft border-0">
          <CardContent className="py-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No reviews today</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {todayReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="shadow-soft border-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{review.customer_name}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Table {review.table_number}
              {review.seats.length > 0 && ` • Seats ${review.seats.join(', ')}`}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Food:</span>
            <StarRating rating={review.food_rating} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Service:</span>
            <StarRating rating={review.service_rating} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Hotel:</span>
            <StarRating rating={review.hotel_rating} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Website:</span>
            <StarRating rating={review.website_rating} />
          </div>
        </div>
        
        {review.server_name && (
          <Badge variant="outline" className="text-xs">
            Server: {review.server_name}
          </Badge>
        )}
        
        {review.review_text && (
          <div className="p-2 bg-secondary/30 rounded-lg">
            <p className="text-sm italic">"{review.review_text}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

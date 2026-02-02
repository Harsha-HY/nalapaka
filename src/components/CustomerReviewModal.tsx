import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReviews } from '@/hooks/useReviews';
import { toast } from 'sonner';

interface CustomerReviewModalProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  phoneNumber: string;
  tableNumber: string;
  seats: string[];
  serverName?: string;
  orderId?: string;
}

function StarRatingInput({ 
  value, 
  onChange, 
  label 
}: { 
  value: number; 
  onChange: (rating: number) => void; 
  label: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= value 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function CustomerReviewModal({
  open,
  onClose,
  customerName,
  phoneNumber,
  tableNumber,
  seats,
  serverName,
  orderId,
}: CustomerReviewModalProps) {
  const { language } = useLanguage();
  const { createReview } = useReviews();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratings, setRatings] = useState({
    food: 0,
    service: 0,
    hotel: 0,
    website: 0,
  });
  const [reviewText, setReviewText] = useState('');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createReview({
        order_id: orderId || null,
        customer_name: customerName,
        phone_number: phoneNumber,
        table_number: tableNumber,
        seats: seats,
        server_name: serverName || null,
        food_rating: ratings.food > 0 ? ratings.food : null,
        service_rating: ratings.service > 0 ? ratings.service : null,
        hotel_rating: ratings.hotel > 0 ? ratings.hotel : null,
        website_rating: ratings.website > 0 ? ratings.website : null,
        review_text: reviewText || null,
      });
      
      toast.success(
        language === 'kn' 
          ? 'ವಿಮರ್ಶೆಗೆ ಧನ್ಯವಾದಗಳು!' 
          : 'Thank you for your review!'
      );
      onClose();
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {language === 'kn' ? 'ನಿಮ್ಮ ಅನುಭವ ಹಂಚಿಕೊಳ್ಳಿ' : 'Share Your Experience'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {language === 'kn' 
              ? 'ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆ ನಮಗೆ ಬಹಳ ಮುಖ್ಯ' 
              : 'Your feedback helps us improve'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <StarRatingInput
            label={language === 'kn' ? 'ಆಹಾರ' : 'Food Quality'}
            value={ratings.food}
            onChange={(v) => setRatings(prev => ({ ...prev, food: v }))}
          />
          <StarRatingInput
            label={language === 'kn' ? 'ಸೇವೆ' : 'Service'}
            value={ratings.service}
            onChange={(v) => setRatings(prev => ({ ...prev, service: v }))}
          />
          <StarRatingInput
            label={language === 'kn' ? 'ಹೋಟೆಲ್' : 'Hotel Facilities'}
            value={ratings.hotel}
            onChange={(v) => setRatings(prev => ({ ...prev, hotel: v }))}
          />
          <StarRatingInput
            label={language === 'kn' ? 'ವೆಬ್‌ಸೈಟ್' : 'Website Experience'}
            value={ratings.website}
            onChange={(v) => setRatings(prev => ({ ...prev, website: v }))}
          />

          <div className="space-y-2">
            <Label>{language === 'kn' ? 'ಹೆಚ್ಚಿನ ಪ್ರತಿಕ್ರಿಯೆ (ಐಚ್ಛಿಕ)' : 'Additional Feedback (Optional)'}</Label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={language === 'kn' ? 'ನಿಮ್ಮ ಅನುಭವವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ...' : 'Share your experience...'}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleSkip}>
            {language === 'kn' ? 'ಬಿಟ್ಟುಬಿಡಿ' : 'Skip'}
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting 
              ? (language === 'kn' ? 'ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...' : 'Submitting...') 
              : (language === 'kn' ? 'ಸಲ್ಲಿಸಿ' : 'Submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

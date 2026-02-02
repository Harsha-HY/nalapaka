import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Review {
  id: string;
  order_id: string | null;
  customer_name: string;
  phone_number: string | null;
  table_number: string;
  seats: string[];
  server_name: string | null;
  food_rating: number | null;
  service_rating: number | null;
  hotel_rating: number | null;
  website_rating: number | null;
  review_text: string | null;
  created_at: string;
}

export function useReviews() {
  const { user, isManager } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!user || !isManager) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReviews((data || []) as Review[]);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isManager]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user || !isManager) return;

    const channel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isManager, fetchReviews]);

  const createReview = async (reviewData: Omit<Review, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteTodayReviews = async () => {
    if (!isManager) throw new Error('Only managers can delete reviews');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { error } = await supabase
      .from('reviews')
      .delete()
      .gte('created_at', today.toISOString());

    if (error) throw error;
    await fetchReviews();
  };

  // Get today's reviews
  const todayReviews = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return reviews.filter(r => {
      const reviewDate = new Date(r.created_at);
      reviewDate.setHours(0, 0, 0, 0);
      return reviewDate.getTime() === today.getTime();
    });
  }, [reviews]);

  // Calculate average ratings for today
  const todayAverages = useMemo(() => {
    if (todayReviews.length === 0) {
      return { food: 0, service: 0, hotel: 0, website: 0, overall: 0 };
    }

    const validFood = todayReviews.filter(r => r.food_rating !== null);
    const validService = todayReviews.filter(r => r.service_rating !== null);
    const validHotel = todayReviews.filter(r => r.hotel_rating !== null);
    const validWebsite = todayReviews.filter(r => r.website_rating !== null);

    const food = validFood.length > 0 
      ? validFood.reduce((sum, r) => sum + (r.food_rating || 0), 0) / validFood.length 
      : 0;
    const service = validService.length > 0 
      ? validService.reduce((sum, r) => sum + (r.service_rating || 0), 0) / validService.length 
      : 0;
    const hotel = validHotel.length > 0 
      ? validHotel.reduce((sum, r) => sum + (r.hotel_rating || 0), 0) / validHotel.length 
      : 0;
    const website = validWebsite.length > 0 
      ? validWebsite.reduce((sum, r) => sum + (r.website_rating || 0), 0) / validWebsite.length 
      : 0;

    const overall = (food + service + hotel + website) / 4;

    return { food, service, hotel, website, overall };
  }, [todayReviews]);

  return {
    reviews,
    todayReviews,
    todayAverages,
    isLoading,
    createReview,
    deleteTodayReviews,
    refreshReviews: fetchReviews,
  };
}

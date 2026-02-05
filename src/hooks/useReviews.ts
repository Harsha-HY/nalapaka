import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type ReviewRow = Database['public']['Tables']['reviews']['Row'];
type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

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

// Convert database row to Review type
function toReview(row: ReviewRow): Review {
  return {
    ...row,
    seats: row.seats || [],
  };
}

export function useReviews() {
  const { user, isManager } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!user) return;
    
    // Only managers can view all reviews
    if (!isManager) {
      setReviews([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReviews((data || []).map(toReview));
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

  // Create review - this can be called by any authenticated user (customer)
  const createReview = async (reviewData: {
    order_id?: string | null;
    customer_name: string;
    phone_number?: string | null;
    table_number: string;
    seats?: string[];
    server_name?: string | null;
    food_rating?: number | null;
    service_rating?: number | null;
    hotel_rating?: number | null;
    website_rating?: number | null;
    review_text?: string | null;
  }) => {
    if (!user) throw new Error('User not authenticated');
    
    const insertData: ReviewInsert = {
      customer_name: reviewData.customer_name,
      table_number: reviewData.table_number,
      order_id: reviewData.order_id || null,
      phone_number: reviewData.phone_number || null,
      seats: reviewData.seats || [],
      server_name: reviewData.server_name || null,
      food_rating: reviewData.food_rating ?? null,
      service_rating: reviewData.service_rating ?? null,
      hotel_rating: reviewData.hotel_rating ?? null,
      website_rating: reviewData.website_rating ?? null,
      review_text: reviewData.review_text || null,
    };
    
    const { data, error } = await supabase
      .from('reviews')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return toReview(data);
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

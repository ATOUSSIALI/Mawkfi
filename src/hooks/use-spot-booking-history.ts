
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';
import { BookingHistoryItem } from '@/components/parking/SpotBookingHistory';

export function useSpotBookingHistory(spotId: string | null | undefined) {
  const [bookingHistory, setBookingHistory] = useState<BookingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!spotId) {
      setBookingHistory([]);
      return;
    }

    const fetchBookingHistory = async () => {
      setIsLoading(true);

      try {
        // Define date range (last 7 days)
        const today = startOfDay(new Date());
        const sevenDaysAgo = subDays(today, 7);
        
        // Format dates for query
        const fromDate = format(sevenDaysAgo, 'yyyy-MM-dd');
        const toDate = format(today, 'yyyy-MM-dd');
        
        // Query the bookings table to get booking counts by date
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('start_time')
          .eq('parking_slot_id', spotId)
          .gte('start_time', fromDate)
          .lte('start_time', toDate);
          
        if (error) {
          console.error('Error fetching booking history:', error);
          setBookingHistory([]);
          return;
        }
        
        // Process the data to get the counts by date
        const bookingsByDate: Record<string, number> = {};
        
        bookings.forEach(booking => {
          const bookingDate = format(new Date(booking.start_time), 'yyyy-MM-dd');
          
          if (bookingsByDate[bookingDate]) {
            bookingsByDate[bookingDate] += 1;
          } else {
            bookingsByDate[bookingDate] = 1;
          }
        });
        
        // Convert the record to our expected format
        const historyItems: BookingHistoryItem[] = Object.entries(bookingsByDate).map(([date, count]) => ({
          date,
          bookings: count,
        }));
        
        setBookingHistory(historyItems);
      } catch (error) {
        console.error('Error in booking history fetch:', error);
        setBookingHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingHistory();
  }, [spotId]);

  return {
    bookingHistory,
    isLoading
  };
}

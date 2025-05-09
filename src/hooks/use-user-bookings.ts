
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled' | 'all';

export interface Booking {
  id: string;
  parkingName: string;
  spotLabel: string;
  address: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  isActive: boolean;
  bookingCode: string;
  parkingSlotId: string;
  parkingLocationId: string;
}

export function useUserBookings(status: BookingStatus = 'all') {
  const { toast } = useToast();
  
  // Set up the query
  const {
    data: bookings,
    isLoading,
    refetch,
    error
  } = useQuery({
    queryKey: ['bookings', status],
    queryFn: async () => {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Authentication required to view bookings');
      }
      
      // Modify the query to handle status as a separate column
      const { data, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          parking_locations(name, address),
          parking_slots(slot_label)
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .then(result => {
          // Filter by status in JavaScript if needed
          if (status !== 'all' && result.data) {
            result.data = result.data.filter(b => {
              // Derive status from other fields if not present
              const bookingStatus = b.status || 
                (b.is_active ? 'upcoming' : 'completed');
              return bookingStatus === status;
            });
          }
          return result;
        });
      
      if (bookingsError) throw bookingsError;
      
      if (!data) return [];
      
      // Transform the data to match our Booking interface
      return data.map(booking => ({
        id: booking.id,
        parkingName: booking.parking_locations?.name || 'Unknown Location',
        spotLabel: booking.parking_slots?.slot_label || 'Unknown Spot',
        address: booking.parking_locations?.address || 'Unknown Address',
        startTime: booking.start_time,
        endTime: booking.end_time,
        duration: booking.duration_hours,
        price: Number(booking.total_price),
        // Handle missing status field by deriving from is_active
        status: booking.status || (booking.is_active ? 'upcoming' : 'completed'),
        isActive: booking.is_active,
        bookingCode: booking.booking_code,
        parkingSlotId: booking.parking_slot_id,
        parkingLocationId: booking.parking_location_id
      }));
    }
  });
  
  // Setup subscription for real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings'
      }, () => {
        refetch();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);
  
  // Handle error display
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading bookings',
        description: (error as Error).message || 'Could not load your bookings',
        variant: 'destructive'
      });
    }
  }, [error, toast]);
  
  return {
    bookings: bookings || [],
    isLoading,
    refetch,
    error
  };
}

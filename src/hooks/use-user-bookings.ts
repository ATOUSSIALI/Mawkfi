
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useCallback } from 'react';
import { BookingStatus, Booking } from '@/types/booking';

export function useUserBookings(status: BookingStatus = 'all') {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

      // Get current time for filtering
      const now = new Date().toISOString();

      // Fetch all bookings for the user
      const { data, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          parking_locations(name, address),
          parking_slots(slot_label)
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Process and filter bookings based on status and time
      const processedData = data?.map(booking => {
        // Determine the actual status based on time and stored status
        let actualStatus = booking.status || 'completed';

        // If booking is active, determine if it's upcoming or active based on time
        if (booking.is_active) {
          if (booking.end_time < now) {
            // Booking has ended but wasn't marked as completed
            actualStatus = 'completed';
          } else if (booking.start_time > now) {
            // Booking hasn't started yet
            actualStatus = 'upcoming';
          } else {
            // Booking is currently active
            actualStatus = 'active';
          }
        } else {
          // Use the stored status or default to completed
          actualStatus = booking.status || 'completed';
        }

        return {
          ...booking,
          actualStatus
        };
      }) || [];

      // Filter by status if needed
      const filteredData = status === 'all'
        ? processedData
        : processedData.filter(b => {
            // For 'upcoming', include both 'upcoming' and 'active' bookings that haven't ended
            if (status === 'upcoming') {
              return (b.actualStatus === 'upcoming' || b.actualStatus === 'active' || b.actualStatus === 'reserved') &&
                     b.end_time > now;
            }
            return b.actualStatus === status;
          });

      if (!filteredData.length) return [];

      // Transform the data to match our Booking interface
      return filteredData.map(booking => ({
        id: booking.id,
        parkingName: booking.parking_locations?.name || 'Unknown Location',
        spotLabel: booking.parking_slots?.slot_label || 'Unknown Spot',
        address: booking.parking_locations?.address || 'Unknown Address',
        startTime: booking.start_time,
        endTime: booking.end_time,
        duration: booking.duration_hours,
        price: Number(booking.total_price),
        // Use the actual status we determined above
        status: booking.actualStatus as BookingStatus,
        isActive: booking.is_active,
        bookingCode: booking.booking_code,
        parkingSlotId: booking.parking_slot_id,
        parkingLocationId: booking.parking_location_id
      }));
    }
  });

  // Function to invalidate bookings cache
  const invalidateBookings = useCallback(() => {
    // Invalidate all booking queries to ensure all tabs are updated
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  }, [queryClient]);

  // Setup subscription for real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, (payload) => {
        console.log('Booking change detected:', payload);
        invalidateBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invalidateBookings]);

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
    error,
    invalidateBookings
  };
}

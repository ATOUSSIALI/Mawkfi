
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export interface ParkingLocation {
  id: string;
  name: string;
  address: string;
  image_url: string | null;
  hourly_price: number;
  total_spots: number;
  available_spots: number | null;
  created_at: string;
  updated_at: string;
  description?: string;
}

export interface ParkingSpot {
  id: string;
  label: string;
  is_occupied: boolean;
  reserved_until: string | null;
  status: 'available' | 'occupied' | 'reserved';
  reservation_info?: string;
  active_booking_id?: string;
}

// Create a QueryClient instance
const queryClient = new QueryClient();

export function useParkingDetails(parkingId: string) {
  const { toast } = useToast();

  const {
    data: parkingDetails,
    isLoading: isLoadingDetails,
    error: detailsError
  } = useQuery({
    queryKey: ['parking-details', parkingId],
    queryFn: async (): Promise<ParkingLocation | null> => {
      const { data, error } = await supabase
        .from('parking_locations')
        .select('*')
        .eq('id', parkingId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!parkingId,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: "Failed to load parking details",
          variant: "destructive"
        });
      }
    }
  });

  const {
    data: spots = [],
    isLoading: isLoadingSpots,
    error: spotsError
  } = useQuery({
    queryKey: ['parking-spots', parkingId],
    queryFn: async (): Promise<ParkingSpot[]> => {
      // First get all parking slots
      const { data: slotsData, error: slotsError } = await supabase
        .from('parking_slots')
        .select('id, slot_label, is_occupied, reserved_until')
        .eq('parking_location_id', parkingId)
        .order('slot_label', { ascending: true });

      if (slotsError) throw slotsError;

      // Get current time
      const now = new Date().toISOString();

      // Get all active bookings for this parking location
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, parking_slot_id, start_time, end_time')
        .eq('parking_location_id', parkingId)
        .eq('is_active', true)
        .gte('end_time', now);

      if (bookingsError) throw bookingsError;

      // Map slots with booking information
      return slotsData.map(spot => {
        // Find active booking for this spot
        const activeBooking = bookingsData?.find(booking =>
          booking.parking_slot_id === spot.id
        );

        let status: 'available' | 'occupied' | 'reserved' = 'available';
        let reservationInfo = '';

        if (activeBooking) {
          const endTime = new Date(activeBooking.end_time);
          status = 'reserved';
          reservationInfo = `Reserved until ${format(endTime, 'h:mm a')}`;

          // If booking has started and is currently active
          const startTime = new Date(activeBooking.start_time);
          const currentTime = new Date();
          if (startTime <= currentTime) {
            status = 'occupied';
          }
        } else if (spot.is_occupied) {
          // Fallback to is_occupied if no active booking found
          // This should be rare after our refactoring
          status = 'occupied';
        }

        return {
          id: spot.id,
          label: spot.slot_label,
          is_occupied: status === 'occupied',
          reserved_until: activeBooking?.end_time || spot.reserved_until,
          status: status,
          reservation_info: reservationInfo,
          active_booking_id: activeBooking?.id
        };
      });
    },
    enabled: !!parkingId,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: "Failed to load parking spots",
          variant: "destructive"
        });
      }
    }
  });

  const isLoading = isLoadingDetails || isLoadingSpots;
  const error = detailsError || spotsError;

  // Added refresh function to manually trigger refetches
  const refreshData = async () => {
    await Promise.all([
      // Refetch both queries
      queryClient.refetchQueries({ queryKey: ['parking-details', parkingId] }),
      queryClient.refetchQueries({ queryKey: ['parking-spots', parkingId] })
    ]);
  };

  return {
    parkingDetails,
    spots,
    isLoading,
    error,
    refreshData
  };
}

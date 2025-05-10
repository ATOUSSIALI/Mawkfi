
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  status: 'available' | 'occupied';
}

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
      const { data, error } = await supabase
        .from('parking_slots')
        .select('id, slot_label, is_occupied, reserved_until')
        .eq('parking_location_id', parkingId)
        .order('slot_label', { ascending: true });
        
      if (error) throw error;
      
      return data.map(spot => ({
        id: spot.id,
        label: spot.slot_label,
        is_occupied: spot.is_occupied,
        reserved_until: spot.reserved_until,
        status: spot.is_occupied ? 'occupied' : 'available'
      }));
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
      // @ts-ignore - types issue with queryClient refetch
      queryClient.refetchQueries({ queryKey: ['parking-details', parkingId] }),
      // @ts-ignore - types issue with queryClient refetch  
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

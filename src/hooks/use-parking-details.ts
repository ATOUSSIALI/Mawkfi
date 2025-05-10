
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
}

export interface ParkingSpot {
  id: string;
  label: string;
  is_occupied: boolean;
  reserved_until: string | null;
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
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to load parking details",
        variant: "destructive"
      });
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
        reserved_until: spot.reserved_until
      }));
    },
    enabled: !!parkingId,
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to load parking spots",
        variant: "destructive"
      });
    }
  });
  
  const isLoading = isLoadingDetails || isLoadingSpots;
  const error = detailsError || spotsError;

  return {
    parkingDetails,
    spots,
    isLoading,
    error
  };
}

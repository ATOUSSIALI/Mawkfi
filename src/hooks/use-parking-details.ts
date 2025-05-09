
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { checkAndExpireOverdueBookings } from '@/utils/bookingScheduler';
import { useEffect } from 'react';

export interface ParkingLocation {
  id: string;
  name: string;
  address: string;
  hourly_price: number;
  image_url: string | null;
  description: string | null;
  available_spots: number;
  total_spots: number;
}

export interface ParkingSpot {
  id: string;
  label: string;
  status: 'available' | 'occupied' | 'selected' | 'reserved';
}

export function useParkingDetails(parkingId: string | undefined) {
  // Check and expire overdue bookings when hook is initialized
  useEffect(() => {
    checkAndExpireOverdueBookings();
  }, []);

  const { 
    data: parkingLot, 
    isLoading: isLoadingParking,
    refetch: refetchParkingLot
  } = useQuery({
    queryKey: ['parkingLocation', parkingId],
    queryFn: async () => {
      if (!parkingId) throw new Error('No parking ID provided');
      
      const { data, error } = await supabase
        .from('parking_locations')
        .select('*')
        .eq('id', parkingId)
        .single();
        
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        address: data.address,
        hourly_price: Number(data.hourly_price),
        image_url: data.image_url,
        description: data.description || "Located in a convenient area with easy access and secure facilities.",
        available_spots: data.available_spots,
        total_spots: data.total_spots
      } as ParkingLocation;
    },
    enabled: !!parkingId
  });

  const { 
    data: spots = [], 
    isLoading: isLoadingSpots,
    refetch: refetchSpots
  } = useQuery({
    queryKey: ['parkingSpots', parkingId],
    queryFn: async () => {
      if (!parkingId) throw new Error('No parking ID provided');
      
      const { data, error } = await supabase
        .from('parking_slots')
        .select('*')
        .eq('parking_location_id', parkingId);
        
      if (error) throw error;
      
      // Correctly map is_occupied to status
      return data.map(slot => ({
        id: slot.id,
        label: slot.slot_label,
        status: slot.is_occupied ? 'occupied' as const : 'available' as const
      }));
    },
    enabled: !!parkingId
  });

  // Setup subscription for real-time updates
  useEffect(() => {
    if (!parkingId) return;
    
    const channel = supabase
      .channel('parking-details-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'parking_slots',
        filter: `parking_location_id=eq.${parkingId}`
      }, () => {
        refetchSpots();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'parking_locations',
        filter: `id=eq.${parkingId}`
      }, () => {
        refetchParkingLot();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [parkingId, refetchSpots, refetchParkingLot]);

  const refreshData = async () => {
    await Promise.all([refetchParkingLot(), refetchSpots()]);
  };

  return {
    parkingLot,
    spots,
    isLoading: isLoadingParking || isLoadingSpots,
    refreshData
  };
}

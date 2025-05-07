
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/ui-components/PageContainer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SpotStatus } from '@/components/parking/ParkingSpotGrid';
import ParkingHeader from '@/components/parking/ParkingHeader';
import ParkingInfo from '@/components/parking/ParkingInfo';
import ParkingSpotSelection from '@/components/parking/ParkingSpotSelection';
import DurationSelector from '@/components/parking/DurationSelector';
import PaymentSummary from '@/components/parking/PaymentSummary';
import { useQuery } from '@tanstack/react-query';
import { useParkingBooking } from '@/hooks/use-parking-booking';
import { checkAndExpireOverdueBookings } from '@/utils/bookingScheduler';
import { useWallet } from '@/contexts/WalletContext';
import WalletBalanceDisplay from '@/components/payment/WalletBalanceDisplay';
import { RefreshCw } from 'lucide-react';

interface ParkingLocation {
  id: string;
  name: string;
  address: string;
  hourly_price: number;
  image_url: string | null;
  description?: string;
  available_spots: number;
  total_spots: number;
}

interface ParkingSpot {
  id: string;
  label: string;
  status: SpotStatus;
}

const ParkingDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { bookSpot, isProcessing } = useParkingBooking();
  const { balance } = useWallet();
  
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [duration, setDuration] = useState(1); // Default 1 hour
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check and expire overdue bookings when page loads
  useEffect(() => {
    checkAndExpireOverdueBookings();
  }, []);

  const { 
    data: parkingLot, 
    isLoading: isLoadingParking,
    refetch: refetchParkingLot
  } = useQuery({
    queryKey: ['parkingLocation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parking_locations')
        .select('*')
        .eq('id', id)
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
      };
    },
    enabled: !!id
  });

  const { 
    data: spots = [], 
    isLoading: isLoadingSpots,
    refetch: refetchSpots
  } = useQuery({
    queryKey: ['parkingSpots', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parking_slots')
        .select('*')
        .eq('parking_location_id', id);
        
      if (error) throw error;
      
      return data.map(slot => ({
        id: slot.id,
        label: slot.slot_label,
        status: slot.is_occupied ? 'occupied' as SpotStatus : 'available' as SpotStatus
      }));
    },
    enabled: !!id
  });
  
  // Set up realtime subscription for parking spots changes
  useEffect(() => {
    if (!id) return;
    
    const channel = supabase
      .channel('parking-details-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'parking_slots',
        filter: `parking_location_id=eq.${id}`
      }, () => {
        // When a slot changes, refresh the spots data
        refetchSpots();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'parking_locations',
        filter: `id=eq.${id}`
      }, () => {
        // When the parking location updates (e.g. available_spots changes), refresh it
        refetchParkingLot();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refetchSpots, refetchParkingLot]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchParkingLot(), refetchSpots()]);
    setIsRefreshing(false);
  };
  
  const isLoading = isLoadingParking || isLoadingSpots;
  
  const handleSpotSelect = (spotId: string) => {
    setSelectedSpotId(spotId === selectedSpotId ? null : spotId);
  };
  
  const handleProceedToPayment = async () => {
    if (!selectedSpotId || !parkingLot) return;
    
    const selectedSpot = spots.find(spot => spot.id === selectedSpotId);
    if (!selectedSpot) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a parking spot.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    navigate('/payment', { 
      state: { 
        parkingLotId: parkingLot.id,
        parkingLotName: parkingLot.name,
        spotId: selectedSpotId,
        spotLabel: selectedSpot?.label,
        duration,
        price: parkingLot.hourly_price * duration,
      } 
    });
  };
  
  const calculateTotalPrice = parkingLot ? parkingLot.hourly_price * duration : 0;
  const hasSufficientFunds = balance >= calculateTotalPrice;
  
  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-6 text-center">
          <p className="text-muted-foreground">Loading parking details...</p>
        </div>
      </PageContainer>
    );
  }
  
  if (!parkingLot) {
    return (
      <PageContainer>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Parking lot not found</p>
          <Button className="mt-4" onClick={() => navigate('/parking')}>
            Back to Parking List
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer className="pb-20">
      <ParkingHeader 
        name={parkingLot.name} 
        address={parkingLot.address}
        description={parkingLot.description}
        imageUrl={parkingLot.image_url}
      />
      
      <div className="flex justify-between items-center mb-2">
        <WalletBalanceDisplay variant="compact" />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      
      <ParkingInfo 
        hourlyPrice={parkingLot.hourly_price}
        availableSpots={parkingLot.available_spots}
        totalSpots={parkingLot.total_spots}
      />
      
      <ParkingSpotSelection
        spots={spots}
        selectedSpotId={selectedSpotId}
        onSpotSelect={handleSpotSelect}
        isLoading={isLoading}
      />
      
      {selectedSpotId && (
        <div className="mt-6 space-y-4">
          <DurationSelector 
            duration={duration} 
            setDuration={setDuration} 
          />
          
          <PaymentSummary
            spotLabel={spots.find(s => s.id === selectedSpotId)?.label}
            duration={duration}
            hourlyPrice={parkingLot.hourly_price}
            onProceedToPayment={handleProceedToPayment}
          />
          
          {!hasSufficientFunds && (
            <div className="text-destructive text-sm text-center">
              Insufficient wallet balance. You need {calculateTotalPrice} DZD for this booking.
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default ParkingDetailsPage;

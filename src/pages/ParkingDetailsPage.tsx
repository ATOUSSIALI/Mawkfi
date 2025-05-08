
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/ui-components/PageContainer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useParkingBooking } from '@/hooks/use-parking-booking';
import { useWallet } from '@/contexts/WalletContext';
import { useParkingDetails } from '@/hooks/use-parking-details';
import { useSpotVerifier } from '@/components/parking/SpotVerifier';
import ParkingHeader from '@/components/parking/ParkingHeader';
import ParkingInfo from '@/components/parking/ParkingInfo';
import ParkingSpotSelection from '@/components/parking/ParkingSpotSelection';
import ParkingDetailsHeader from '@/components/parking/ParkingDetailsHeader';
import ParkingBookingForm from '@/components/parking/ParkingBookingForm';

const ParkingDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { bookSpot, isProcessing } = useParkingBooking();
  const { balance } = useWallet();
  
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [duration, setDuration] = useState(1); // Default 1 hour
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    parkingLot,
    spots,
    isLoading,
    refreshData
  } = useParkingDetails(id);

  const { verifySpotAvailability, isVerifying } = useSpotVerifier({
    onSpotUnavailable: () => setSelectedSpotId(null),
    refetchSpots: async () => refreshData()
  });
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
    
    // Clear selected spot if it's no longer available
    if (selectedSpotId) {
      const spot = spots.find(s => s.id === selectedSpotId);
      if (spot && spot.status === 'occupied') {
        setSelectedSpotId(null);
        toast({
          title: "Spot no longer available",
          description: `The spot ${spot.label} has been taken. Please select another spot.`,
          variant: "destructive"
        });
      }
    }
  };
  
  const handleSpotSelect = (spotId: string) => {
    setSelectedSpotId(spotId === selectedSpotId ? null : spotId);
  };
  
  const handleProceedToPayment = async () => {
    if (!selectedSpotId || !parkingLot) return;
    
    // Verify user is logged in
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
    
    // Verify spot is still available
    const selectedSpot = spots.find(spot => spot.id === selectedSpotId);
    if (!selectedSpot) return;
    
    const isAvailable = await verifySpotAvailability(selectedSpotId, selectedSpot.label);
    if (!isAvailable) return;
    
    // Check wallet balance
    const calculateTotalPrice = parkingLot.hourly_price * duration;
    if (balance < calculateTotalPrice) {
      toast({
        title: "Insufficient Balance",
        description: "Please top up your wallet to proceed with booking.",
        variant: "destructive"
      });
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
  
  const selectedSpot = selectedSpotId 
    ? spots.find(s => s.id === selectedSpotId)
    : undefined;
  
  return (
    <PageContainer className="pb-20">
      <ParkingHeader 
        name={parkingLot.name} 
        address={parkingLot.address}
        description={parkingLot.description}
        imageUrl={parkingLot.image_url}
      />
      
      <ParkingDetailsHeader
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      
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
        <ParkingBookingForm
          selectedSpot={selectedSpot}
          spots={spots}
          duration={duration}
          setDuration={setDuration}
          hourlyPrice={parkingLot.hourly_price}
          walletBalance={balance}
          onProceedToPayment={handleProceedToPayment}
          isProcessing={isVerifying || isProcessing}
        />
      )}
    </PageContainer>
  );
};

export default ParkingDetailsPage;


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

interface ParkingLocation {
  id: string;
  name: string;
  address: string;
  hourly_price: number;
  image_url: string | null;
  description?: string;
  availableSpots: number;
  totalSpots: number;
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
  
  const [parkingLot, setParkingLot] = useState<ParkingLocation | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [duration, setDuration] = useState(1); // Default 1 hour

  useEffect(() => {
    const fetchParkingDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch parking location details
        const { data: parkingData, error: parkingError } = await supabase
          .from('parking_locations')
          .select('*')
          .eq('id', id)
          .single();
          
        if (parkingError) {
          throw parkingError;
        }

        // Fetch all parking slots for this location
        const { data: slotsData, error: slotsError } = await supabase
          .from('parking_slots')
          .select('*')
          .eq('parking_location_id', id);
          
        if (slotsError) {
          throw slotsError;
        }

        // Count available spots
        const availableSpots = slotsData.filter(slot => !slot.is_occupied).length;
        
        // Set up parking location data
        setParkingLot({
          id: parkingData.id,
          name: parkingData.name,
          address: parkingData.address,
          hourly_price: Number(parkingData.hourly_price),
          image_url: parkingData.image_url,
          description: "Located in a convenient area with easy access and secure facilities.",
          availableSpots,
          totalSpots: parkingData.total_spots
        });
        
        // Set up parking spots data
        const formattedSpots: ParkingSpot[] = slotsData.map(slot => ({
          id: slot.id,
          label: slot.slot_label,
          status: slot.is_occupied ? 'occupied' : 'available'
        }));
        
        setSpots(formattedSpots);
      } catch (error: any) {
        console.error('Error fetching parking details:', error);
        toast({
          title: "Error loading parking details",
          description: error.message || "Please try again later.",
          variant: "destructive"
        });
        navigate('/parking');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchParkingDetails();
    }
  }, [id, navigate, toast]);
  
  const handleSpotSelect = (spotId: string) => {
    setSelectedSpotId(spotId === selectedSpotId ? null : spotId);
  };
  
  const handleProceedToPayment = () => {
    if (!selectedSpotId || !parkingLot) return;
    
    const selectedSpot = spots.find(spot => spot.id === selectedSpotId);
    
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
  
  return (
    <PageContainer className="pb-20">
      <ParkingHeader 
        name={parkingLot.name} 
        address={parkingLot.address}
        description={parkingLot.description}
        imageUrl={parkingLot.image_url}
      />
      
      <ParkingInfo 
        hourlyPrice={parkingLot.hourly_price}
        availableSpots={parkingLot.availableSpots}
        totalSpots={parkingLot.totalSpots}
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
        </div>
      )}
    </PageContainer>
  );
};

export default ParkingDetailsPage;

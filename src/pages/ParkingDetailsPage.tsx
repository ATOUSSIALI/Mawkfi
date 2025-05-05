
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/ui-components/PageContainer';
import ParkingSpotGrid, { SpotStatus } from '@/components/parking/ParkingSpotGrid';
import { Button } from '@/components/ui/button';
import { MapPin, CreditCard, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      {parkingLot?.image_url && (
        <div className="h-48 -mx-4 mb-4 overflow-hidden rounded-b-lg">
          <img 
            src={parkingLot.image_url} 
            alt={parkingLot.name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <h1 className="text-xl font-bold mb-2">{parkingLot?.name}</h1>
      
      <div className="flex items-center text-muted-foreground mb-4">
        <MapPin size={16} className="mr-1" />
        <p className="text-sm">{parkingLot?.address}</p>
      </div>
      
      <p className="text-sm mb-6">{parkingLot?.description}</p>
      
      <div className="bg-secondary rounded-lg p-4 flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Price per hour</p>
          <p className="text-xl font-bold text-primary">{parkingLot?.hourly_price} DZD</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-xl font-bold">{parkingLot?.availableSpots}/{parkingLot?.totalSpots}</p>
        </div>
      </div>
      
      <h2 className="font-semibold mb-4">Select a Parking Spot</h2>
      
      {!isLoading && parkingLot && (
        <ParkingSpotGrid 
          spots={spots} 
          onSpotSelect={handleSpotSelect}
          selectedSpotId={selectedSpotId || undefined}
        />
      )}
      
      {selectedSpotId && (
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="font-medium mb-2">Select Duration</h3>
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((hours) => (
                <button
                  key={hours}
                  onClick={() => setDuration(hours)}
                  className={`flex-1 py-2 px-4 rounded-md border text-center ${
                    duration === hours 
                      ? 'bg-primary text-white border-primary' 
                      : 'border-border bg-card'
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <p>Spot</p>
              <p className="font-medium">{spots.find(s => s.id === selectedSpotId)?.label}</p>
            </div>
            <div className="flex justify-between">
              <p>Duration</p>
              <p className="font-medium">{duration} hour{duration > 1 ? 's' : ''}</p>
            </div>
            <div className="flex justify-between">
              <p>Price</p>
              <p className="font-bold text-primary">{parkingLot?.hourly_price * duration} DZD</p>
            </div>
          </div>
          
          <Button 
            className="w-full btn-primary"
            onClick={handleProceedToPayment}
          >
            Proceed to Payment
          </Button>
        </div>
      )}
    </PageContainer>
  );
};

export default ParkingDetailsPage;

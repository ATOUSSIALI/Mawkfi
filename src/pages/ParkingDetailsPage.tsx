
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/ui-components/PageContainer';
import ParkingSpotGrid from '@/components/parking/ParkingSpotGrid';
import { Button } from '@/components/ui/button';
import { MapPin, CreditCard, Clock } from 'lucide-react';
import { SpotStatus } from '@/components/parking/ParkingSpotGrid';

// Mock data - would normally come from API/Supabase
const parkingLots = {
  '1': {
    id: '1',
    name: 'Central Parking Algiers',
    address: 'Rue Didouche Mourad, Algiers',
    price: 150, // DZD per hour
    availableSpots: 12,
    totalSpots: 20,
    description: 'Located in the heart of Algiers, this parking lot offers easy access to central businesses and attractions.',
  },
  '2': {
    id: '2',
    name: 'Medina Parking',
    address: 'Boulevard Front de Mer, Algiers',
    price: 120,
    availableSpots: 5,
    totalSpots: 30,
    description: 'Convenient parking near the Medina with security personnel and CCTV surveillance.',
  },
  '3': {
    id: '3',
    name: 'Bab El Oued Plaza',
    address: 'Bab El Oued, Algiers',
    price: 100,
    availableSpots: 8,
    totalSpots: 15,
    description: 'Affordable parking near Bab El Oued shopping area.',
  },
  '4': {
    id: '4',
    name: 'Casbah Parking',
    address: 'Casbah District, Algiers',
    price: 180,
    availableSpots: 3,
    totalSpots: 10,
    description: 'Premium secure parking in the historic Casbah district.',
  },
  '5': {
    id: '5',
    name: 'Hydra Center',
    address: 'Hydra, Algiers',
    price: 200,
    availableSpots: 20,
    totalSpots: 25,
    description: 'Modern parking facility in the upscale Hydra neighborhood.',
  },
};

const generateParkingSpots = (totalSpots: number, availableSpots: number) => {
  const spots = [];
  const rows = ['A', 'B', 'C', 'D', 'E'];
  
  let availableCount = availableSpots;
  
  for (let i = 0; i < totalSpots; i++) {
    const row = rows[Math.floor(i / 4)];
    const number = (i % 4) + 1;
    const label = `${row}${number}`;
    
    // Randomly determine if spot is available, but ensure we have exactly availableSpots available
    let status: SpotStatus = 'occupied';
    if (availableCount > 0 && Math.random() > 0.4) {
      status = 'available';
      availableCount--;
    }
    
    spots.push({
      id: `spot-${i}`,
      label,
      status,
    });
  }
  
  // If we still have available spots to allocate, convert some occupied spots to available
  if (availableCount > 0) {
    const occupiedSpots = spots.filter(spot => spot.status === 'occupied');
    for (let i = 0; i < Math.min(availableCount, occupiedSpots.length); i++) {
      occupiedSpots[i].status = 'available';
    }
  }
  
  return spots;
};

const ParkingDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const parkingLot = id && parkingLots[id as keyof typeof parkingLots];
  
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [duration, setDuration] = useState(1); // Default 1 hour
  
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
  
  const spots = generateParkingSpots(parkingLot.totalSpots, parkingLot.availableSpots);
  
  const handleSpotSelect = (spotId: string) => {
    setSelectedSpotId(spotId === selectedSpotId ? null : spotId);
  };
  
  const handleProceedToPayment = () => {
    if (!selectedSpotId) return;
    
    const selectedSpot = spots.find(spot => spot.id === selectedSpotId);
    
    navigate('/payment', { 
      state: { 
        parkingLotId: parkingLot.id,
        parkingLotName: parkingLot.name,
        spotId: selectedSpotId,
        spotLabel: selectedSpot?.label,
        duration,
        price: parkingLot.price * duration,
      } 
    });
  };
  
  return (
    <PageContainer className="pb-20">
      <h1 className="text-xl font-bold mb-2">{parkingLot.name}</h1>
      
      <div className="flex items-center text-muted-foreground mb-4">
        <MapPin size={16} className="mr-1" />
        <p className="text-sm">{parkingLot.address}</p>
      </div>
      
      <p className="text-sm mb-6">{parkingLot.description}</p>
      
      <div className="bg-secondary rounded-lg p-4 flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Price per hour</p>
          <p className="text-xl font-bold text-primary">{parkingLot.price} DZD</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-xl font-bold">{parkingLot.availableSpots}/{parkingLot.totalSpots}</p>
        </div>
      </div>
      
      <h2 className="font-semibold mb-4">Select a Parking Spot</h2>
      
      <ParkingSpotGrid 
        spots={spots} 
        onSpotSelect={handleSpotSelect}
        selectedSpotId={selectedSpotId || undefined}
      />
      
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
              <p className="font-bold text-primary">{parkingLot.price * duration} DZD</p>
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

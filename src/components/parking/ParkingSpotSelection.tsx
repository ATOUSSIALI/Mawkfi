
import React from 'react';
import ParkingSpotGrid, { SpotStatus } from '@/components/parking/ParkingSpotGrid';
import { Badge } from '@/components/ui/badge';

interface ParkingSpot {
  id: string;
  label: string;
  status: SpotStatus;
}

interface ParkingSpotSelectionProps {
  spots: ParkingSpot[];
  selectedSpotId: string | null;
  onSpotSelect: (spotId: string) => void;
  isLoading: boolean;
}

const ParkingSpotSelection = ({
  spots,
  selectedSpotId,
  onSpotSelect,
  isLoading
}: ParkingSpotSelectionProps) => {
  if (isLoading) {
    return <div className="text-center py-4">Loading parking spots...</div>;
  }
  
  const availableCount = spots.filter(spot => spot.status === 'available').length;
  const occupiedCount = spots.filter(spot => spot.status === 'occupied').length;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Select a Parking Spot</h2>
        <div className="flex space-x-2">
          <Badge variant="outline" className="bg-white border-primary text-primary">
            {availableCount} Available
          </Badge>
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            {occupiedCount} Occupied
          </Badge>
        </div>
      </div>
      
      <ParkingSpotGrid 
        spots={spots} 
        onSpotSelect={onSpotSelect}
        selectedSpotId={selectedSpotId || undefined}
      />
    </div>
  );
};

export default ParkingSpotSelection;

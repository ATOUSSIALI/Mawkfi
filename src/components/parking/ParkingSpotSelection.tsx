
import React from 'react';
import ParkingSpotGrid, { SpotStatus } from '@/components/parking/ParkingSpotGrid';

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
  
  return (
    <div>
      <h2 className="font-semibold mb-4">Select a Parking Spot</h2>
      
      <ParkingSpotGrid 
        spots={spots} 
        onSpotSelect={onSpotSelect}
        selectedSpotId={selectedSpotId || undefined}
      />
    </div>
  );
};

export default ParkingSpotSelection;

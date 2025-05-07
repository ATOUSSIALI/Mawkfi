
import React from 'react';
import ParkingSpotGrid, { SpotStatus } from '@/components/parking/ParkingSpotGrid';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-md" />
          ))}
        </div>
      </div>
    );
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
      
      {spots.length > 0 ? (
        <ParkingSpotGrid 
          spots={spots} 
          onSpotSelect={onSpotSelect}
          selectedSpotId={selectedSpotId || undefined}
        />
      ) : (
        <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed">
          <p className="text-muted-foreground">No parking spots available</p>
        </div>
      )}
      
      {selectedSpotId && (
        <div className="mt-3 text-sm text-center text-muted-foreground">
          <p>Selected spot: {spots.find(s => s.id === selectedSpotId)?.label}</p>
        </div>
      )}
    </div>
  );
};

export default ParkingSpotSelection;

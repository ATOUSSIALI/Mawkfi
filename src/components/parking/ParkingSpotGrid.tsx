
import React from 'react';
import { cn } from '@/lib/utils';

export type SpotStatus = 'available' | 'occupied' | 'selected' | 'disabled';

interface ParkingSpot {
  id: string;
  label: string;
  status: SpotStatus;
}

interface ParkingSpotGridProps {
  spots: ParkingSpot[];
  onSpotSelect: (spotId: string) => void;
  selectedSpotId?: string;
}

const ParkingSpotGrid = ({ spots, onSpotSelect, selectedSpotId }: ParkingSpotGridProps) => {
  const getSpotColor = (status: SpotStatus, id: string): string => {
    if (id === selectedSpotId) return "bg-primary text-white border-primary";
    
    switch (status) {
      case 'available':
        return "bg-white border-primary text-primary hover:bg-primary/10";
      case 'occupied':
        return "bg-muted text-muted-foreground cursor-not-allowed";
      case 'disabled':
        return "bg-secondary text-secondary-foreground cursor-not-allowed";
      default:
        return "bg-white";
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center mb-6">
        <div className="bg-secondary w-3/4 h-8 rounded-md flex items-center justify-center text-sm font-medium">
          Entrance
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {spots.map((spot) => (
          <button
            key={spot.id}
            onClick={() => spot.status === 'available' && onSpotSelect(spot.id)}
            disabled={spot.status !== 'available' && spot.id !== selectedSpotId}
            className={cn(
              "h-14 flex items-center justify-center rounded border-2 transition-colors relative",
              getSpotColor(spot.status, spot.id)
            )}
            title={spot.status === 'occupied' ? "This spot is already occupied" : 
                  spot.status === 'available' ? "Available spot" : ""}
          >
            {spot.label}
            {spot.status === 'occupied' && (
              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full m-1"></div>
            )}
            {id === selectedSpotId && (
              <div className="absolute bottom-1 left-0 right-0 text-xs font-medium">Selected</div>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-6 flex justify-center space-x-4">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-white border-2 border-primary mr-2"></div>
          <span className="text-xs">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-primary mr-2"></div>
          <span className="text-xs">Selected</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-muted mr-2"></div>
          <span className="text-xs">Occupied</span>
        </div>
      </div>
    </div>
  );
};

export default ParkingSpotGrid;

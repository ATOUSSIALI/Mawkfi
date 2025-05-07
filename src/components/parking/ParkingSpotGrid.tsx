
import React from 'react';
import { cn } from '@/lib/utils';

export type SpotStatus = 'available' | 'occupied' | 'selected' | 'reserved';

interface ParkingSpot {
  id: string;
  label: string;
  status: SpotStatus;
}

interface ParkingSpotGridProps {
  spots: ParkingSpot[];
  onSpotSelect?: (spotId: string) => void;
  selectedSpotId?: string;
  className?: string;
}

const ParkingSpotGrid = ({
  spots,
  onSpotSelect,
  selectedSpotId,
  className
}: ParkingSpotGridProps) => {
  const getSpotStyles = (status: SpotStatus, isSelected: boolean): string => {
    const baseStyles = "flex items-center justify-center rounded-lg p-3 text-center transition-colors";
    
    if (isSelected) {
      return cn(baseStyles, "bg-primary text-white border-2 border-primary");
    }
    
    switch (status) {
      case 'available':
        return cn(baseStyles, "bg-white border border-primary/30 text-primary hover:bg-primary/10 cursor-pointer");
      case 'occupied':
        return cn(baseStyles, "bg-muted text-muted-foreground border border-muted-foreground/20 cursor-not-allowed");
      case 'reserved':
        return cn(baseStyles, "bg-amber-100 text-amber-700 border border-amber-300 cursor-not-allowed");
      default:
        return baseStyles;
    }
  };

  return (
    <div className={cn("grid grid-cols-3 sm:grid-cols-4 gap-3", className)}>
      {spots.map((spot) => (
        <div
          key={spot.id}
          className={getSpotStyles(spot.status, spot.id === selectedSpotId)}
          onClick={() => {
            if (spot.status === 'available' && onSpotSelect) {
              onSpotSelect(spot.id);
            }
          }}
          aria-disabled={spot.status !== 'available'}
        >
          {spot.label}
        </div>
      ))}
    </div>
  );
};

export default ParkingSpotGrid;

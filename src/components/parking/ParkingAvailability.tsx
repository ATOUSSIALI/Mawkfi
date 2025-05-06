
import React from 'react';
import { cn } from '@/lib/utils';

interface ParkingAvailabilityProps {
  availableSpots: number;
  totalSpots: number;
  className?: string;
}

const ParkingAvailability = ({
  availableSpots,
  totalSpots,
  className
}: ParkingAvailabilityProps) => {
  const availability = totalSpots > 0 ? (availableSpots / totalSpots) * 100 : 0;
  
  let availabilityColor = 'bg-red-500';
  if (availability > 20) availabilityColor = 'bg-orange-500';
  if (availability > 50) availabilityColor = 'bg-primary';
  
  return (
    <div className={cn(className)}>
      <div className="flex justify-between text-sm mb-1">
        <span>Availability</span>
        <span className={availability > 50 ? 'text-primary' : availability > 20 ? 'text-orange-500' : 'text-red-500'}>
          {availableSpots} / {totalSpots} spots
        </span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div 
          className={`${availabilityColor} h-2 rounded-full`} 
          style={{ width: `${availability}%` }}
        />
      </div>
    </div>
  );
};

export default ParkingAvailability;

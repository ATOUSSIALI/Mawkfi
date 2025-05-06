
import React from 'react';

interface ParkingInfoProps {
  hourlyPrice: number;
  availableSpots: number;
  totalSpots: number;
}

const ParkingInfo = ({
  hourlyPrice,
  availableSpots,
  totalSpots
}: ParkingInfoProps) => {
  return (
    <div className="bg-secondary rounded-lg p-4 flex justify-between items-center mb-6">
      <div>
        <p className="text-sm text-muted-foreground">Price per hour</p>
        <p className="text-xl font-bold text-primary">{hourlyPrice} DZD</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Available</p>
        <p className="text-xl font-bold">{availableSpots}/{totalSpots}</p>
      </div>
    </div>
  );
};

export default ParkingInfo;

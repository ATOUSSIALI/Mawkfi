
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ParkingInfoProps {
  hourlyPrice: number;
  availableSpots: number;
  totalSpots: number;
  className?: string;
}

const ParkingInfo = ({
  hourlyPrice,
  availableSpots,
  totalSpots,
  className
}: ParkingInfoProps) => {
  return (
    <Card className={cn("bg-secondary mb-6", className)}>
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">Price per hour</p>
          <p className="text-xl font-bold text-primary">{hourlyPrice} DZD</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-xl font-bold">{availableSpots}/{totalSpots}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParkingInfo;

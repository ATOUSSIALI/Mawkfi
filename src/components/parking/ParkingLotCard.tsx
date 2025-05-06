
import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ParkingAvailability from '@/components/parking/ParkingAvailability';
import ParkingImage from '@/components/parking/ParkingImage';

interface ParkingLotCardProps {
  id: string;
  name: string;
  address: string;
  price: number; // in DZD
  availableSpots: number;
  totalSpots: number;
  imageUrl?: string;
  className?: string;
}

const ParkingLotCard = ({
  id,
  name,
  address,
  price,
  availableSpots,
  totalSpots,
  imageUrl,
  className
}: ParkingLotCardProps) => {
  return (
    <div className={cn("bg-card rounded-lg shadow overflow-hidden card-hover", className)}>
      <ParkingImage imageUrl={imageUrl} name={name} height="h-36" />
      
      <div className="p-4">
        <div className="flex justify-between">
          <h3 className="text-lg font-semibold">{name}</h3>
          <span className="text-primary font-bold">{price} DZD/hr</span>
        </div>
        
        <div className="flex items-center mt-2 text-muted-foreground">
          <MapPin size={16} className="mr-1" />
          <p className="text-sm">{address}</p>
        </div>
        
        <ParkingAvailability 
          availableSpots={availableSpots} 
          totalSpots={totalSpots} 
          className="mt-4"
        />
        
        <div className="mt-4">
          <Link to={`/parking/${id}`}>
            <Button className="w-full">Select Spot</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ParkingLotCard;

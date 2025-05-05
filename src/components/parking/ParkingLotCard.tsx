
import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
  const availability = totalSpots > 0 ? (availableSpots / totalSpots) * 100 : 0;
  
  let availabilityColor = 'bg-red-500';
  if (availability > 20) availabilityColor = 'bg-orange-500';
  if (availability > 50) availabilityColor = 'bg-primary';
  
  return (
    <div className={cn("bg-card rounded-lg shadow overflow-hidden card-hover", className)}>
      <div className="h-36 bg-secondary relative">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground">No image available</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between">
          <h3 className="text-lg font-semibold">{name}</h3>
          <span className="text-primary font-bold">{price} DZD/hr</span>
        </div>
        
        <div className="flex items-center mt-2 text-muted-foreground">
          <MapPin size={16} className="mr-1" />
          <p className="text-sm">{address}</p>
        </div>
        
        <div className="mt-4">
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


import React from 'react';
import { MapPin } from 'lucide-react';

interface ParkingHeaderProps {
  name: string;
  address: string;
  description?: string;
  imageUrl?: string | null;
}

const ParkingHeader = ({
  name,
  address,
  description,
  imageUrl
}: ParkingHeaderProps) => {
  return (
    <>
      {imageUrl && (
        <div className="h-48 -mx-4 mb-4 overflow-hidden rounded-b-lg">
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <h1 className="text-xl font-bold mb-2">{name}</h1>
      
      <div className="flex items-center text-muted-foreground mb-4">
        <MapPin size={16} className="mr-1" />
        <p className="text-sm">{address}</p>
      </div>
      
      {description && <p className="text-sm mb-6">{description}</p>}
    </>
  );
};

export default ParkingHeader;

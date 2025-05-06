
import React from 'react';
import { cn } from '@/lib/utils';

interface ParkingImageProps {
  imageUrl?: string | null;
  name: string;
  height?: string;
  className?: string;
}

const ParkingImage = ({
  imageUrl,
  name,
  height = "h-48",
  className
}: ParkingImageProps) => {
  return (
    <div className={cn(`${height} bg-secondary relative`, className)}>
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
  );
};

export default ParkingImage;

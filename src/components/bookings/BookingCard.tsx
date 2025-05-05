
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BookingDetails {
  id: string;
  parkingName: string;
  spotLabel: string;
  address: string;
  startTime: string;
  endTime: string;
  duration: number; // in hours
  price: number; // total price in DZD
  status: 'active' | 'completed' | 'cancelled';
}

interface BookingCardProps {
  booking: BookingDetails;
}

const BookingCard = ({ booking }: BookingCardProps) => {
  const statusColors = {
    active: 'bg-primary',
    completed: 'bg-muted',
    cancelled: 'bg-destructive',
  };
  
  const statusText = {
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{booking.parkingName}</h3>
            <p className="text-sm text-muted-foreground">Spot {booking.spotLabel}</p>
          </div>
          <div className={`${statusColors[booking.status]} px-2 py-1 rounded text-xs text-white`}>
            {statusText[booking.status]}
          </div>
        </div>
        
        <div className="flex items-center mt-2 text-sm text-muted-foreground">
          <MapPin size={14} className="mr-1" />
          <span>{booking.address}</span>
        </div>
        
        <div className="flex mt-3 justify-between">
          <div className="flex items-center text-sm">
            <Calendar size={14} className="mr-1" />
            <span>{booking.startTime.split(' ')[0]}</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock size={14} className="mr-1" />
            <span>
              {booking.startTime.split(' ')[1]} - {booking.endTime.split(' ')[1]}
            </span>
          </div>
        </div>
        
        <div className="mt-2 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">{booking.duration} hours</p>
            <p className="text-lg font-bold text-primary">{booking.price} DZD</p>
          </div>
          
          {booking.status === 'active' && (
            <Link to={`/booking/${booking.id}`}>
              <Button variant="outline" size="sm">View QR Code</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCard;

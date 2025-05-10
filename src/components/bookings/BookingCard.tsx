
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useParkingBooking } from '@/hooks/use-parking-booking';
import { useToast } from '@/hooks/use-toast';
import { Booking } from '@/types/booking';

interface BookingCardProps {
  booking: Booking;
  onStatusChange?: () => void;
  onClick?: () => void;
}

const BookingCard = ({ booking, onStatusChange, onClick }: BookingCardProps) => {
  const { cancelBooking, isProcessing } = useParkingBooking();
  const { toast } = useToast();
  
  const statusColors = {
    upcoming: 'bg-primary',
    completed: 'bg-muted',
    cancelled: 'bg-destructive',
  };
  
  const statusText = {
    upcoming: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  // Check if the booking is cancellable (only upcoming bookings)
  const isCancellable = booking.status === 'upcoming';
  
  // Format dates for display
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };
  
  const startDateTime = formatDateTime(booking.startTime);
  const endDateTime = formatDateTime(booking.endTime);
  
  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!booking.parkingSlotId) {
      toast({
        title: "Cancellation Error",
        description: "Could not find parking spot information",
        variant: "destructive"
      });
      return;
    }
    
    const result = await cancelBooking(booking.id, booking.parkingSlotId);
    
    if (result.success) {
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled",
      });
      
      // Trigger refetch of bookings if callback provided
      if (onStatusChange) {
        onStatusChange();
      }
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden" onClick={onClick}>
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
            <span>{startDateTime.date}</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock size={14} className="mr-1" />
            <span>
              {startDateTime.time} - {endDateTime.time}
            </span>
          </div>
        </div>
        
        <div className="mt-2 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">{booking.duration} hours</p>
            <p className="text-lg font-bold text-primary">{booking.price} DZD</p>
          </div>
          
          <div className="space-x-2">
            {isCancellable && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelBooking();
                }}
                disabled={isProcessing}
              >
                {isProcessing ? 'Cancelling...' : 'Cancel'}
              </Button>
            )}
            
            {booking.status === 'upcoming' && (
              <Link to={`/booking/${booking.id}`} onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" size="sm">View Details</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;

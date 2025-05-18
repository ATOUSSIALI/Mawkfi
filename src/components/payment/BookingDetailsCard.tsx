
import React from 'react';
import { Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface BookingDetailsCardProps {
  parkingLotName: string;
  spotLabel: string;
  duration: number;
  price: number;
  startTime?: string;
  endTime?: string;
}

const BookingDetailsCard = ({
  parkingLotName,
  spotLabel,
  duration,
  price,
  startTime,
  endTime
}: BookingDetailsCardProps) => {
  // Format dates for display if provided
  const formattedStartTime = startTime ? format(new Date(startTime), 'PPP p') : null;
  const formattedEndTime = endTime ? format(new Date(endTime), 'PPP p') : null;
  return (
    <div className="bg-card rounded-lg border p-4 mb-6">
      <h2 className="font-semibold mb-2">Booking Details</h2>

      <div className="space-y-2">
        <div className="flex justify-between">
          <p className="text-muted-foreground">Parking</p>
          <p className="font-medium">{parkingLotName}</p>
        </div>

        <div className="flex justify-between">
          <p className="text-muted-foreground">Spot</p>
          <p className="font-medium">{spotLabel}</p>
        </div>

        {formattedStartTime && formattedEndTime ? (
          <>
            <div className="flex justify-between">
              <p className="text-muted-foreground">Start Time</p>
              <div className="flex items-center">
                <Calendar size={16} className="mr-1 text-primary" />
                <p className="font-medium">{formattedStartTime}</p>
              </div>
            </div>

            <div className="flex justify-between">
              <p className="text-muted-foreground">End Time</p>
              <div className="flex items-center">
                <Calendar size={16} className="mr-1 text-primary" />
                <p className="font-medium">{formattedEndTime}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-between">
            <p className="text-muted-foreground">Duration</p>
            <div className="flex items-center">
              <Clock size={16} className="mr-1 text-primary" />
              <p className="font-medium">{duration.toFixed(1)} hour{duration !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        <div className="border-t mt-2 pt-2 flex justify-between">
          <p className="font-medium">Total</p>
          <p className="font-bold text-primary">{price} DZD</p>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsCard;


import React from 'react';
import ParkingSpotGrid, { SpotStatus } from '@/components/parking/ParkingSpotGrid';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CircleCheck } from 'lucide-react';
import SpotBookingHistory from '@/components/parking/SpotBookingHistory';
import { useSpotBookingHistory } from '@/hooks/use-spot-booking-history';

interface ParkingSpot {
  id: string;
  label: string;
  status: SpotStatus;
}

interface ParkingSpotSelectionProps {
  spots: ParkingSpot[];
  selectedSpotId: string | null;
  onSpotSelect: (spotId: string) => void;
  isLoading: boolean;
}

const ParkingSpotSelection = ({
  spots,
  selectedSpotId,
  onSpotSelect,
  isLoading
}: ParkingSpotSelectionProps) => {
  const selectedSpot = spots.find(spot => spot.id === selectedSpotId);
  const { bookingHistory, isLoading: isHistoryLoading } = useSpotBookingHistory(selectedSpotId);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-md" />
          ))}
        </div>
      </div>
    );
  }
  
  const availableCount = spots.filter(spot => spot.status === 'available').length;
  const occupiedCount = spots.filter(spot => spot.status === 'occupied').length;
  
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Select a Parking Spot</h2>
        <div className="flex space-x-2">
          <Badge variant="outline" className="bg-white border-primary text-primary">
            {availableCount} Available
          </Badge>
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            {occupiedCount} Occupied
          </Badge>
        </div>
      </div>
      
      {spots.length > 0 ? (
        <>
          <div className="bg-sky-50 border border-sky-100 rounded-md p-3 mb-4 text-sm text-sky-700 flex items-start">
            <CircleCheck className="h-5 w-5 text-sky-500 mr-2 mt-0.5 flex-shrink-0" />
            <p>Tap on an available spot to select it for booking. Selected spots will be highlighted.</p>
          </div>
          
          <ParkingSpotGrid 
            spots={spots} 
            onSpotSelect={onSpotSelect}
            selectedSpotId={selectedSpotId || undefined}
          />
          
          {/* Show spot booking history for selected spot */}
          {selectedSpotId && selectedSpot && (
            <SpotBookingHistory 
              spotId={selectedSpotId}
              spotLabel={selectedSpot.label}
              bookingHistory={bookingHistory}
              isLoading={isHistoryLoading}
            />
          )}
        </>
      ) : (
        <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed">
          <p className="text-muted-foreground">No parking spots available</p>
        </div>
      )}
      
      {selectedSpotId && (
        <div className="mt-3 py-2 text-sm font-medium text-center text-green-700 bg-green-50 rounded-md">
          <p>Selected spot: <span className="font-bold">{spots.find(s => s.id === selectedSpotId)?.label}</span></p>
        </div>
      )}
      
      {!selectedSpotId && spots.length > 0 && (
        <div className="mt-3 py-2 text-sm text-center text-amber-700 bg-amber-50 rounded-md">
          <p>Please select an available spot to continue</p>
        </div>
      )}
    </div>
  );
};

export default ParkingSpotSelection;

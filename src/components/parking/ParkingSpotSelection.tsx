
import React from 'react';
import ParkingSpotGrid, { SpotStatus } from '@/components/parking/ParkingSpotGrid';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CircleCheck } from 'lucide-react';
import SpotBookingHistory from '@/components/parking/SpotBookingHistory';
import { useSpotBookingHistory } from '@/hooks/use-spot-booking-history';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ParkingSpot {
  id: string;
  label: string;
  status: SpotStatus;
  reserved_until?: string | null;
  reserved_by?: string | null;
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
  
  // Calculate available spots correctly
  const availableSpots = spots.filter(spot => spot.status === 'available');
  const availableCount = availableSpots.length;
  const occupiedCount = spots.filter(spot => spot.status === 'occupied').length;
  const hasAvailableSpots = availableCount > 0;
  
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Select a Parking Spot</h2>
        <div className="flex space-x-2">
          {hasAvailableSpots && (
            <Badge variant="outline" className="bg-white border-primary text-primary">
              {availableCount} Available
            </Badge>
          )}
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            {occupiedCount} Occupied
          </Badge>
        </div>
      </div>
      
      {spots.length === 0 ? (
        <Alert className="mb-4">
          <AlertDescription>
            No parking spots found for this location. Please try another parking location.
          </AlertDescription>
        </Alert>
      ) : !hasAvailableSpots ? (
        <Alert className="mb-4">
          <AlertDescription>
            No parking spots are available for this location. Please try another parking location.
          </AlertDescription>
        </Alert>
      ) : (
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
      )}
      
      {selectedSpotId && (
        <div className="mt-3 py-2 text-sm font-medium text-center text-green-700 bg-green-50 rounded-md">
          <p>Selected spot: <span className="font-bold">{spots.find(s => s.id === selectedSpotId)?.label}</span></p>
        </div>
      )}
      
      {!selectedSpotId && hasAvailableSpots && (
        <div className="mt-3 py-2 text-sm text-center text-amber-700 bg-amber-50 rounded-md">
          <p>Please select an available spot to continue</p>
        </div>
      )}
    </div>
  );
};

export default ParkingSpotSelection;

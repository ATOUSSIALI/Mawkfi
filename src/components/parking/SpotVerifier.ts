import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface UseSpotVerifierProps {
  onSpotUnavailable: () => void;
  refetchSpots: () => Promise<any>;
}

export function useSpotVerifier({ onSpotUnavailable, refetchSpots }: UseSpotVerifierProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const verifySpotAvailability = async (
    spotId: string,
    spotLabel: string,
    desiredStartTime: string,
    desiredEndTime: string
  ): Promise<boolean> => {
    if (!spotId) return false;

    setIsVerifying(true);

    try {
      // Check if the spot is currently occupied
      const { data: spotData, error: spotError } = await supabase
        .from('parking_slots')
        .select('is_occupied')
        .eq('id', spotId)
        .single();

      if (spotError) throw spotError;

      // Check for overlapping bookings
      const { data: overlappingBookings, error } = await supabase
        .from('bookings')
        .select('id, start_time, end_time')
        .eq('parking_slot_id', spotId)
        .eq('is_active', true)
        .or(
          `and(start_time.lte.${desiredEndTime},end_time.gte.${desiredStartTime})`
        );

      if (error) throw error;

      if (overlappingBookings.length > 0) {
        // Format the conflicting time range for better user feedback
        const conflictingBooking = overlappingBookings[0];
        const conflictStart = new Date(conflictingBooking.start_time);
        const conflictEnd = new Date(conflictingBooking.end_time);

        const formattedStart = format(conflictStart, 'h:mm a');
        const formattedEnd = format(conflictEnd, 'h:mm a');

        toast({
          title: 'Spot Already Booked',
          description: `The spot ${spotLabel} is already booked from ${formattedStart} to ${formattedEnd}.`,
          variant: 'destructive',
        });

        await refetchSpots();
        onSpotUnavailable();
        return false;
      }

      // If the spot is marked as occupied but has no active bookings, it might be a data inconsistency
      if (spotData.is_occupied && overlappingBookings.length === 0) {
        toast({
          title: 'Spot Currently Occupied',
          description: `The spot ${spotLabel} is currently occupied.`,
          variant: 'destructive',
        });

        await refetchSpots();
        onSpotUnavailable();
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Error verifying spot availability:', error);
      toast({
        title: 'Verification Error',
        description: 'Could not verify spot availability. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verifySpotAvailability,
    isVerifying,
  };
}

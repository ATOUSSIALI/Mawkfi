
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { checkAndExpireOverdueBookings } from '@/utils/bookingScheduler';
import { BookingDetails } from '@/components/payment/PaymentPageContent';
import { format } from 'date-fns';

interface PaymentSpotCheckerProps {
  bookingDetails: BookingDetails;
  onSpotAvailabilityChange: (isAvailable: boolean) => void;
  onCheckingStateChange: (isChecking: boolean) => void;
}

export const useSpotAvailabilityChecker = (
  spotId: string | undefined,
  spotLabel: string | undefined
) => {
  const [isSpotAvailable, setIsSpotAvailable] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkAvailability = async () => {
    if (!spotId) return true;

    setIsChecking(true);
    try {
      // First check and expire overdue bookings
      await checkAndExpireOverdueBookings();

      // Get the current time and calculate end time based on duration
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (bookingDetails.duration * 60 * 60 * 1000));

      // Check for overlapping bookings
      const { data: overlappingBookings, error } = await supabase
        .from('bookings')
        .select('id, start_time, end_time')
        .eq('parking_slot_id', spotId)
        .eq('is_active', true)
        .or(
          `and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`
        );

      if (error) throw error;

      // Check if the spot is currently occupied
      const { data: spotData, error: spotError } = await supabase
        .from('parking_slots')
        .select('is_occupied')
        .eq('id', spotId)
        .single();

      if (spotError) throw spotError;

      // Determine if the spot is available
      const isAvailable = !spotData.is_occupied && overlappingBookings.length === 0;
      setIsSpotAvailable(isAvailable);

      if (!isAvailable && spotLabel) {
        if (overlappingBookings.length > 0) {
          // Format the conflicting time range for better user feedback
          const conflictingBooking = overlappingBookings[0];
          const conflictStart = new Date(conflictingBooking.start_time);
          const conflictEnd = new Date(conflictingBooking.end_time);

          const formattedStart = format(conflictStart, 'h:mm a');
          const formattedEnd = format(conflictEnd, 'h:mm a');

          toast({
            title: "Spot Already Booked",
            description: `The spot ${spotLabel} is already booked from ${formattedStart} to ${formattedEnd}.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Spot Taken",
            description: `Someone just booked spot ${spotLabel}. Please select another spot.`,
            variant: "destructive"
          });
        }
      }

      return isAvailable;
    } catch (error) {
      console.error('Error checking spot availability:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isSpotAvailable,
    isChecking,
    checkAvailability
  };
};

const PaymentSpotChecker = ({
  bookingDetails,
  onSpotAvailabilityChange,
  onCheckingStateChange
}: PaymentSpotCheckerProps) => {
  const { isSpotAvailable, isChecking, checkAvailability } = useSpotAvailabilityChecker(
    bookingDetails.spotId,
    bookingDetails.spotLabel
  );

  // Update parent components with current state
  useEffect(() => {
    onSpotAvailabilityChange(isSpotAvailable);
  }, [isSpotAvailable, onSpotAvailabilityChange]);

  useEffect(() => {
    onCheckingStateChange(isChecking);
  }, [isChecking, onCheckingStateChange]);

  // Check if spot is still available when component loads and every 15 seconds
  useEffect(() => {
    if (bookingDetails.spotId) {
      checkAvailability();

      // Set up polling to check availability every 15 seconds
      const intervalId = setInterval(checkAvailability, 15000);

      return () => clearInterval(intervalId);
    }
  }, [bookingDetails.spotId]);

  // This component doesn't render anything visible
  return null;
};

export default PaymentSpotChecker;

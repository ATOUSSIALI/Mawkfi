
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { checkAndExpireOverdueBookings } from '@/utils/bookingScheduler';
import { BookingDetails } from '@/components/payment/PaymentPageContent';

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
      
      const { data, error } = await supabase
        .from('parking_slots')
        .select('is_occupied')
        .eq('id', spotId)
        .single();
          
      if (error) throw error;
      
      // If spot is already occupied, set flag to false
      const isAvailable = !data.is_occupied;
      setIsSpotAvailable(isAvailable);
      
      if (!isAvailable && spotLabel) {
        toast({
          title: "Spot Taken",
          description: `Someone just booked spot ${spotLabel}. Please select another spot.`,
          variant: "destructive"
        });
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


import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';

interface BookingParams {
  parkingLotId: string;
  parkingLotName: string;
  spotId: string;
  spotLabel: string;
  duration: number;
  price: number;
  userId: string;
}

export function useParkingBooking() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { deductBalance } = useWallet();

  const bookSpot = async (params: BookingParams) => {
    const { 
      parkingLotId, 
      spotId, 
      duration, 
      price,
      userId
    } = params;

    setIsProcessing(true);
    
    try {
      // Calculate start and end times
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
      
      // Generate booking code
      const bookingCode = 'BKG' + Math.floor(100000 + Math.random() * 900000);
      
      // Create a booking record
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          parking_location_id: parkingLotId,
          parking_slot_id: spotId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_hours: duration,
          total_price: price,
          booking_code: bookingCode,
          is_active: true
        })
        .select('id')
        .single();
        
      if (bookingError) {
        throw bookingError;
      }
      
      // Update the parking slot to mark it as occupied
      const { error: slotError } = await supabase
        .from('parking_slots')
        .update({ is_occupied: true })
        .eq('id', spotId);
        
      if (slotError) {
        throw slotError;
      }
      
      // Deduct the amount from the user's wallet
      await deductBalance(price, `Parking reservation at spot ${params.spotLabel}`);
      
      return {
        success: true,
        bookingId: bookingData.id,
        bookingCode,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };
    } catch (error: any) {
      console.error('Error booking spot:', error);
      toast({
        title: "Booking Error",
        description: error.message || "Failed to book parking spot. Please try again.",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelBooking = async (bookingId: string, spotId: string) => {
    setIsProcessing(true);
    
    try {
      // Update the booking to mark it as inactive
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ is_active: false })
        .eq('id', bookingId);
        
      if (bookingError) {
        throw bookingError;
      }
      
      // Update the parking slot to mark it as unoccupied
      const { error: slotError } = await supabase
        .from('parking_slots')
        .update({ is_occupied: false })
        .eq('id', spotId);
        
      if (slotError) {
        throw slotError;
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Cancellation Error",
        description: error.message || "Failed to cancel booking. Please try again.",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    bookSpot,
    cancelBooking,
    isProcessing
  };
}

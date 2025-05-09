
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { scheduleBookingExpiration } from '@/utils/bookingScheduler';

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
      userId,
      spotLabel
    } = params;

    setIsProcessing(true);
    
    try {
      // Verify spot is still available
      const { data: spotData, error: spotError } = await supabase
        .from('parking_slots')
        .select('is_occupied')
        .eq('id', spotId)
        .single();
        
      if (spotError) throw spotError;
      
      if (spotData.is_occupied) {
        return {
          success: false,
          error: { message: `Spot ${spotLabel} is already occupied` }
        };
      }
      
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
      
      // Update the parking slot to mark it as occupied with reservation details
      const { error: slotError } = await supabase
        .from('parking_slots')
        .update({ 
          is_occupied: true,
          reserved_until: endTime.toISOString(),
          reserved_by: userId
        })
        .eq('id', spotId);
        
      if (slotError) {
        // If we fail to update the slot, we should cancel the booking
        await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingData.id);
          
        throw slotError;
      }
      
      // Deduct the amount from the user's wallet
      const paymentResult = await deductBalance(price, `Parking reservation at spot ${params.spotLabel}`);
      
      if (!paymentResult) {
        // If payment fails, revert the slot update and delete the booking
        await supabase
          .from('parking_slots')
          .update({ 
            is_occupied: false,
            reserved_until: null,
            reserved_by: null
          })
          .eq('id', spotId);
          
        await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingData.id);
          
        throw new Error("Payment failed");
      }
      
      // Schedule the booking to expire automatically
      scheduleBookingExpiration(
        bookingData.id,
        spotId,
        endTime.toISOString()
      );
      
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
        .update({ 
          is_occupied: false,
          reserved_until: null,
          reserved_by: null
        })
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


import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { BookingParams, BookingResult, CancellationResult } from '@/types/booking';
import { createBooking, cancelBooking as cancelBookingService } from '@/services/booking-service';

export function useParkingBooking() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { deductBalance } = useWallet();

  const bookSpot = async (params: BookingParams): Promise<BookingResult> => {
    setIsProcessing(true);
    
    try {
      // Deduct the amount from the user's wallet
      const paymentResult = await deductBalance(params.price, `Parking reservation at spot ${params.spotLabel}`);
      
      if (!paymentResult) {
        throw new Error("Payment failed");
      }
      
      // Create the booking
      const bookingResult = await createBooking(params);
      
      if (!bookingResult.success) {
        // If booking fails, we should refund the user
        // This would be handled in a real application
        throw bookingResult.error || new Error("Failed to create booking");
      }
      
      return bookingResult;
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

  const cancelBooking = async (bookingId: string, spotId: string): Promise<CancellationResult> => {
    setIsProcessing(true);
    
    try {
      const result = await cancelBookingService(bookingId, spotId);
      
      if (!result.success) {
        throw result.error || new Error("Failed to cancel booking");
      }
      
      return result;
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

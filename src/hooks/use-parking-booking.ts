
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { useQueryClient } from '@tanstack/react-query';
import { BookingParams, BookingResult, CancellationResult } from '@/types/booking';
import { createBooking, cancelBooking as cancelBookingService } from '@/services/booking-service';

export function useParkingBooking() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { refreshBalance } = useWallet();
  const queryClient = useQueryClient();

  const bookSpot = async (params: BookingParams): Promise<BookingResult> => {
    setIsProcessing(true);

    try {
      // Call the booking service
      const bookingResult = await createBooking(params);

      if (!bookingResult.success) {
        throw bookingResult.error || new Error("Failed to create booking");
      }

      // Refresh the wallet balance after successful booking
      refreshBalance();

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

      // If booking was successfully cancelled, refresh wallet balance to show refund
      refreshBalance();

      // Invalidate all booking queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['bookings'] });

      // Show toast with refund information if available
      if (result.refunded) {
        toast({
          title: "Booking Cancelled",
          description: `Your booking has been cancelled and ${result.refunded} DZD has been refunded to your wallet.`
        });
      } else {
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been cancelled successfully."
        });
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

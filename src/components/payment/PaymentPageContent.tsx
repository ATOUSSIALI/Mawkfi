
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { useParkingBooking } from '@/hooks/use-parking-booking';
import { supabase } from '@/integrations/supabase/client';
import BookingDetailsCard from '@/components/payment/BookingDetailsCard';
import UnavailableSpotAlert from '@/components/payment/UnavailableSpotAlert';
import WalletCard from '@/components/payment/WalletCard';
import WalletBalanceAlert from '@/components/parking/WalletBalanceAlert';
import PaymentActionButton from '@/components/payment/PaymentActionButton';

export interface BookingDetails {
  parkingLotId: string;
  parkingLotName: string;
  spotId: string;
  spotLabel: string;
  duration: number;
  price: number;
  startTime?: string;
  endTime?: string;
}

interface PaymentPageContentProps {
  bookingDetails: BookingDetails;
  isSpotStillAvailable: boolean;
  isCheckingAvailability: boolean;
  isProcessing: boolean;
}

const PaymentPageContent = ({
  bookingDetails,
  isSpotStillAvailable,
  isCheckingAvailability,
  isProcessing
}: PaymentPageContentProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance, refreshBalance } = useWallet();
  const { bookSpot } = useParkingBooking();

  const handleAddFunds = () => {
    toast({
      title: "Add Funds",
      description: "This feature would normally open a dialog to add funds to your wallet.",
    });
    refreshBalance();
  };

  const handleMakePayment = async () => {
    // Get current time and calculate end time based on duration
    const startTime = bookingDetails.startTime ? new Date(bookingDetails.startTime) : new Date();
    const endTime = bookingDetails.endTime ? new Date(bookingDetails.endTime) :
                   new Date(startTime.getTime() + (bookingDetails.duration * 60 * 60 * 1000));

    // Check for overlapping bookings
    const { data: overlappingBookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, start_time, end_time')
      .eq('parking_slot_id', bookingDetails.spotId)
      .eq('is_active', true)
      .or(
        `and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`
      );

    if (bookingError) {
      toast({
        title: "Error",
        description: "Failed to verify spot availability.",
        variant: "destructive"
      });
      return;
    }

    if (overlappingBookings.length > 0) {
      toast({
        title: "Spot No Longer Available",
        description: "This parking spot has been booked for the selected time range.",
        variant: "destructive"
      });
      return;
    }

    // Verify spot is still available right before booking
    const { data, error } = await supabase
      .from('parking_slots')
      .select('is_occupied, slot_label')
      .eq('id', bookingDetails.spotId)
      .single();

    if (error || data.is_occupied) {
      toast({
        title: "Spot No Longer Available",
        description: "This parking spot has just been taken. Please select another spot.",
        variant: "destructive"
      });
      return;
    }

    if (balance < bookingDetails.price) {
      toast({
        title: "Insufficient Funds",
        description: "Please add more funds to your wallet to complete this booking.",
        variant: "destructive"
      });
      return;
    }

    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a parking spot.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    try {
      const bookingResult = await bookSpot({
        userId: user.id,
        parkingLotId: bookingDetails.parkingLotId,
        parkingLotName: bookingDetails.parkingLotName,
        spotId: bookingDetails.spotId,
        spotLabel: bookingDetails.spotLabel,
        duration: bookingDetails.duration,
        price: bookingDetails.price,
        startTime: bookingDetails.startTime,
        endTime: bookingDetails.endTime
      });

      if (!bookingResult.success) {
        // Handle specific booking failure reasons
        if (bookingResult.error?.message?.includes('occupied')) {
          toast({
            title: "Spot Taken",
            description: "Someone just booked this spot. Please select another one.",
            variant: "destructive"
          });
          return;
        } else if (bookingResult.error?.message?.includes('Insufficient funds')) {
          toast({
            title: "Insufficient Funds",
            description: bookingResult.error.message,
            variant: "destructive"
          });
          return;
        }
        throw new Error(bookingResult.error?.message || "Failed to create booking");
      }

      // Refresh balance to show updated wallet amount
      refreshBalance();

      // Navigate to confirmation page with booking details
      navigate('/booking/confirmation', {
        state: {
          ...bookingDetails,
          bookingId: bookingResult.bookingId,
          bookingCode: bookingResult.bookingCode,
          startTime: bookingResult.startTime,
          endTime: bookingResult.endTime,
          status: 'upcoming'
        }
      });
    } catch (error: any) {
      toast({
        title: "Booking Error",
        description: error.message || "Failed to book parking spot.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Payment</h1>

      {!isSpotStillAvailable && <UnavailableSpotAlert />}

      <BookingDetailsCard
        parkingLotName={bookingDetails.parkingLotName}
        spotLabel={bookingDetails.spotLabel}
        duration={bookingDetails.duration}
        price={bookingDetails.price}
        startTime={bookingDetails.startTime}
        endTime={bookingDetails.endTime}
      />

      <div className="mb-6">
        <h2 className="font-semibold mb-2">Pay with Wallet</h2>
        <WalletCard onAddFunds={handleAddFunds} />

        {balance < bookingDetails.price && (
          <WalletBalanceAlert
            currentBalance={balance}
            requiredAmount={bookingDetails.price}
          />
        )}
      </div>

      <PaymentActionButton
        price={bookingDetails.price}
        isProcessing={isProcessing}
        isCheckingAvailability={isCheckingAvailability}
        isSpotAvailable={isSpotStillAvailable}
        onClick={handleMakePayment}
        disabled={isProcessing || balance < bookingDetails.price || !isSpotStillAvailable || isCheckingAvailability}
      />

      <p className="text-sm text-muted-foreground text-center mt-4">
        By proceeding, you agree to our terms and conditions for parking reservations.
      </p>
    </>
  );
};

export default PaymentPageContent;

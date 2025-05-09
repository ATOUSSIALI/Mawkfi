
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/ui-components/PageContainer';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { useParkingBooking } from '@/hooks/use-parking-booking';
import { supabase } from '@/integrations/supabase/client';
import { checkAndExpireOverdueBookings } from '@/utils/bookingScheduler';
import BookingDetailsCard from '@/components/payment/BookingDetailsCard';
import InvalidBookingAlert from '@/components/payment/InvalidBookingAlert';
import UnavailableSpotAlert from '@/components/payment/UnavailableSpotAlert';
import WalletCard from '@/components/payment/WalletCard';
import WalletBalanceAlert from '@/components/parking/WalletBalanceAlert';
import PaymentActionButton from '@/components/payment/PaymentActionButton';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance, refreshBalance } = useWallet();
  const { bookSpot, isProcessing } = useParkingBooking();
  const [isSpotStillAvailable, setIsSpotStillAvailable] = useState(true);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  
  // Get booking details from location state
  const bookingDetails = location.state || {
    parkingLotId: '1',
    parkingLotName: 'Central Parking Algiers',
    spotId: 'spot-1',
    spotLabel: 'A1',
    duration: 1,
    price: 150,
  };
  
  // Check if spot is still available when page loads and every 15 seconds
  useEffect(() => {
    // First check and expire overdue bookings
    checkAndExpireOverdueBookings();
    
    // Then check if this specific spot is still available
    const checkSpotAvailability = async () => {
      setIsCheckingAvailability(true);
      try {
        const { data, error } = await supabase
          .from('parking_slots')
          .select('is_occupied')
          .eq('id', bookingDetails.spotId)
          .single();
          
        if (error) throw error;
        
        // If spot is already occupied, set flag to false
        setIsSpotStillAvailable(!data.is_occupied);
        
        if (data.is_occupied) {
          toast({
            title: "Spot Taken",
            description: `Someone just booked spot ${bookingDetails.spotLabel}. Please select another spot.`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error checking spot availability:', error);
      } finally {
        setIsCheckingAvailability(false);
      }
    };
    
    if (bookingDetails.spotId) {
      checkSpotAvailability();
      
      // Set up polling to check availability every 15 seconds
      const intervalId = setInterval(checkSpotAvailability, 15000);
      
      return () => clearInterval(intervalId);
    }
  }, [bookingDetails.spotId, bookingDetails.spotLabel, toast]);
  
  const handleAddFunds = () => {
    toast({
      title: "Add Funds",
      description: "This feature would normally open a dialog to add funds to your wallet.",
    });
    refreshBalance();
  };
  
  const handleMakePayment = async () => {
    // Verify spot is still available right before booking
    setIsCheckingAvailability(true);
    const { data, error } = await supabase
      .from('parking_slots')
      .select('is_occupied, slot_label')
      .eq('id', bookingDetails.spotId)
      .single();
      
    setIsCheckingAvailability(false);
      
    if (error || data.is_occupied) {
      toast({
        title: "Spot No Longer Available",
        description: "This parking spot has just been taken. Please select another spot.",
        variant: "destructive"
      });
      setIsSpotStillAvailable(false);
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
        price: bookingDetails.price
      });
      
      if (!bookingResult.success) {
        // Handle specific booking failure reasons
        if (bookingResult.error?.message?.includes('occupied')) {
          setIsSpotStillAvailable(false);
          toast({
            title: "Spot Taken",
            description: "Someone just booked this spot. Please select another one.",
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
  
  // If we're redirected without proper booking details
  if (!bookingDetails || !bookingDetails.spotId) {
    return (
      <PageContainer>
        <InvalidBookingAlert />
      </PageContainer>
    );
  }
  
  return (
    <PageContainer className="pb-20">
      <h1 className="text-2xl font-bold mb-6">Payment</h1>
      
      {!isSpotStillAvailable && <UnavailableSpotAlert />}
      
      <BookingDetailsCard 
        parkingLotName={bookingDetails.parkingLotName}
        spotLabel={bookingDetails.spotLabel}
        duration={bookingDetails.duration}
        price={bookingDetails.price}
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
    </PageContainer>
  );
};

export default PaymentPage;

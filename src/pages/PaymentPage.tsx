
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/ui-components/PageContainer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import WalletCard from '@/components/payment/WalletCard';
import { useWallet } from '@/contexts/WalletContext';
import { useParkingBooking } from '@/hooks/use-parking-booking';
import { supabase } from '@/integrations/supabase/client';
import { checkAndExpireOverdueBookings } from '@/utils/bookingScheduler';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import WalletBalanceDisplay from '@/components/payment/WalletBalanceDisplay';

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
  
  // Check if spot is still available when page loads
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
      } catch (error) {
        console.error('Error checking spot availability:', error);
        toast({
          title: "Error",
          description: "Could not verify spot availability. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsCheckingAvailability(false);
      }
    };
    
    if (bookingDetails.spotId) {
      checkSpotAvailability();
    }
  }, [bookingDetails.spotId, toast]);
  
  const handleAddFunds = () => {
    toast({
      title: "Add Funds",
      description: "This feature would normally open a dialog to add funds to your wallet.",
    });
    refreshBalance();
  };
  
  const handleMakePayment = async () => {
    // Verify spot is still available right before booking
    const { data, error } = await supabase
      .from('parking_slots')
      .select('is_occupied')
      .eq('id', bookingDetails.spotId)
      .single();
      
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
      
      // Navigate to confirmation page with booking details
      navigate('/booking/confirmation', {
        state: {
          ...bookingDetails,
          bookingId: bookingResult.bookingId,
          bookingCode: bookingResult.bookingCode,
          startTime: bookingResult.startTime,
          endTime: bookingResult.endTime,
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
        <div className="text-center py-8">
          <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid Booking</h1>
          <p className="text-muted-foreground mb-6">No parking spot was selected.</p>
          <Button onClick={() => navigate('/parking')}>
            Find Parking
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer className="pb-20">
      <h1 className="text-2xl font-bold mb-6">Payment</h1>
      
      {!isSpotStillAvailable && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Spot Unavailable</AlertTitle>
          <AlertDescription>
            This parking spot is no longer available. Please go back and select another spot.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="bg-card rounded-lg border p-4 mb-6">
        <h2 className="font-semibold mb-2">Booking Details</h2>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <p className="text-muted-foreground">Parking</p>
            <p className="font-medium">{bookingDetails.parkingLotName}</p>
          </div>
          
          <div className="flex justify-between">
            <p className="text-muted-foreground">Spot</p>
            <p className="font-medium">{bookingDetails.spotLabel}</p>
          </div>
          
          <div className="flex justify-between">
            <p className="text-muted-foreground">Duration</p>
            <div className="flex items-center">
              <Clock size={16} className="mr-1 text-primary" />
              <p className="font-medium">{bookingDetails.duration} hour{bookingDetails.duration > 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <div className="border-t mt-2 pt-2 flex justify-between">
            <p className="font-medium">Total</p>
            <p className="font-bold text-primary">{bookingDetails.price} DZD</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Pay with Wallet</h2>
        <WalletCard onAddFunds={handleAddFunds} />
        
        {balance < bookingDetails.price && (
          <p className="text-destructive text-sm mt-2">
            Insufficient balance. Please add funds to continue.
          </p>
        )}
      </div>
      
      <Button 
        className="w-full btn-primary"
        onClick={handleMakePayment}
        disabled={isProcessing || balance < bookingDetails.price || !isSpotStillAvailable || isCheckingAvailability}
      >
        {isProcessing ? (
          <span className="flex items-center">
            Processing...
          </span>
        ) : isCheckingAvailability ? (
          <span className="flex items-center">
            Checking availability...
          </span>
        ) : !isSpotStillAvailable ? (
          <span className="flex items-center">
            Spot Unavailable
          </span>
        ) : (
          <span className="flex items-center">
            Pay {bookingDetails.price} DZD
          </span>
        )}
      </Button>
      
      <p className="text-sm text-muted-foreground text-center mt-4">
        By proceeding, you agree to our terms and conditions for parking reservations.
      </p>
    </PageContainer>
  );
};

export default PaymentPage;

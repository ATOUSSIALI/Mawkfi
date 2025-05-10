
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageContainer from '@/components/ui-components/PageContainer';
import { useParkingBooking } from '@/hooks/use-parking-booking';
import InvalidBookingAlert from '@/components/payment/InvalidBookingAlert';
import PaymentSpotChecker from '@/components/payment/PaymentSpotChecker';
import PaymentPageContent, { BookingDetails } from '@/components/payment/PaymentPageContent';

const PaymentPage = () => {
  const location = useLocation();
  const { isProcessing } = useParkingBooking();
  const [isSpotStillAvailable, setIsSpotStillAvailable] = useState(true);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  
  // Get booking details from location state
  const defaultBookingDetails = {
    parkingLotId: '1',
    parkingLotName: 'Central Parking Algiers',
    spotId: 'spot-1',
    spotLabel: 'A1',
    duration: 1,
    price: 150,
  };
  
  const bookingDetails = location.state as BookingDetails || defaultBookingDetails;
  
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
      <PaymentSpotChecker
        bookingDetails={bookingDetails}
        onSpotAvailabilityChange={setIsSpotStillAvailable}
        onCheckingStateChange={setIsCheckingAvailability}
      />
      
      <PaymentPageContent
        bookingDetails={bookingDetails}
        isSpotStillAvailable={isSpotStillAvailable}
        isCheckingAvailability={isCheckingAvailability}
        isProcessing={isProcessing}
      />
    </PageContainer>
  );
};

export default PaymentPage;

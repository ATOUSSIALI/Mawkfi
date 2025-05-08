
import React from 'react';
import DurationSelector from '@/components/parking/DurationSelector';
import PaymentSummary from '@/components/parking/PaymentSummary';
import WalletBalanceAlert from '@/components/parking/WalletBalanceAlert';
import { ParkingSpot } from '@/hooks/use-parking-details';

interface ParkingBookingFormProps {
  selectedSpot: ParkingSpot | undefined;
  spots: ParkingSpot[];
  duration: number;
  setDuration: (duration: number) => void;
  hourlyPrice: number;
  walletBalance: number;
  onProceedToPayment: () => void;
  isProcessing: boolean;
}

const ParkingBookingForm: React.FC<ParkingBookingFormProps> = ({
  selectedSpot,
  spots,
  duration,
  setDuration,
  hourlyPrice,
  walletBalance,
  onProceedToPayment,
  isProcessing
}) => {
  if (!selectedSpot) return null;
  
  const calculateTotalPrice = hourlyPrice * duration;
  const hasSufficientFunds = walletBalance >= calculateTotalPrice;
  
  return (
    <div className="mt-6 space-y-4">
      <DurationSelector 
        duration={duration} 
        setDuration={setDuration} 
      />
      
      <PaymentSummary
        spotLabel={selectedSpot.label}
        duration={duration}
        hourlyPrice={hourlyPrice}
        onProceedToPayment={onProceedToPayment}
        isProcessing={isProcessing}
      />
      
      {!hasSufficientFunds && (
        <WalletBalanceAlert
          currentBalance={walletBalance}
          requiredAmount={calculateTotalPrice}
        />
      )}
    </div>
  );
};

export default ParkingBookingForm;

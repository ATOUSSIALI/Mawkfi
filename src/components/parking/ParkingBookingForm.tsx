
import React, { useState, useEffect } from 'react';
import DurationSelector from '@/components/parking/DurationSelector';
import PaymentSummary from '@/components/parking/PaymentSummary';
import WalletBalanceAlert from '@/components/parking/WalletBalanceAlert';
import DateTimeSelector from '@/components/parking/DateTimeSelector';
import { ParkingSpot } from '@/hooks/use-parking-details';
import { addHours } from 'date-fns';

interface ParkingBookingFormProps {
  selectedSpot: ParkingSpot | undefined;
  spots: ParkingSpot[];
  duration: number;
  setDuration: (duration: number) => void;
  hourlyPrice: number;
  walletBalance: number;
  onProceedToPayment: (startTime: Date, endTime: Date) => void;
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
  // State for date/time selection
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(addHours(new Date(), duration));

  // Update end time when duration changes
  useEffect(() => {
    setEndTime(addHours(startTime, duration));
  }, [duration, startTime]);

  // Only render if there's a selected spot and it's available
  if (!selectedSpot) return null;

  const calculateTotalPrice = hourlyPrice * duration;
  const hasSufficientFunds = walletBalance >= calculateTotalPrice;

  const handleProceedToPayment = () => {
    onProceedToPayment(startTime, endTime);
  };

  return (
    <div className="mt-6 space-y-4">
      <DateTimeSelector
        startTime={startTime}
        endTime={endTime}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
        minDuration={1}
        maxDuration={24}
      />

      <DurationSelector
        duration={duration}
        setDuration={setDuration}
      />

      <PaymentSummary
        spotLabel={selectedSpot.label}
        duration={duration}
        hourlyPrice={hourlyPrice}
        onProceedToPayment={handleProceedToPayment}
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

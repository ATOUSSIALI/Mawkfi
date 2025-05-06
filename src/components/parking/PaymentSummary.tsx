
import React from 'react';
import { Button } from '@/components/ui/button';

interface PaymentSummaryProps {
  spotLabel?: string;
  duration: number;
  hourlyPrice: number;
  onProceedToPayment: () => void;
}

const PaymentSummary = ({
  spotLabel,
  duration,
  hourlyPrice,
  onProceedToPayment
}: PaymentSummaryProps) => {
  return (
    <div className="space-y-4">
      <div className="bg-secondary rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <p>Spot</p>
          <p className="font-medium">{spotLabel}</p>
        </div>
        <div className="flex justify-between">
          <p>Duration</p>
          <p className="font-medium">{duration} hour{duration > 1 ? 's' : ''}</p>
        </div>
        <div className="flex justify-between">
          <p>Price</p>
          <p className="font-bold text-primary">{hourlyPrice * duration} DZD</p>
        </div>
      </div>
      
      <Button 
        className="w-full btn-primary"
        onClick={onProceedToPayment}
      >
        Proceed to Payment
      </Button>
    </div>
  );
};

export default PaymentSummary;


import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface PaymentSummaryProps {
  spotLabel?: string;
  duration: number;
  hourlyPrice: number;
  onProceedToPayment: () => void;
  isProcessing?: boolean;
}

const PaymentSummary = ({
  spotLabel,
  duration,
  hourlyPrice,
  onProceedToPayment,
  isProcessing = false
}: PaymentSummaryProps) => {
  const totalPrice = hourlyPrice * duration;
  
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
          <p className="font-bold text-primary">{totalPrice} DZD</p>
        </div>
      </div>
      
      <Button 
        className="w-full bg-primary hover:bg-primary/90 text-white shadow-md transition-all py-6 font-semibold text-base"
        onClick={onProceedToPayment}
        disabled={isProcessing}
        size="lg"
      >
        {isProcessing ? 'Processing...' : 'Book Now'}
        {!isProcessing && <ArrowRight className="ml-2" />}
      </Button>
    </div>
  );
};

export default PaymentSummary;

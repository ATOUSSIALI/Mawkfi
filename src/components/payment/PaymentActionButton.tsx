
import React from 'react';
import { Button } from '@/components/ui/button';

interface PaymentActionButtonProps {
  price: number;
  isProcessing: boolean;
  isCheckingAvailability: boolean;
  isSpotAvailable: boolean;
  onClick: () => void;
  disabled: boolean;
}

const PaymentActionButton = ({
  price,
  isProcessing,
  isCheckingAvailability,
  isSpotAvailable,
  onClick,
  disabled
}: PaymentActionButtonProps) => {
  let buttonText = `Pay ${price} DZD`;
  
  if (isProcessing) {
    buttonText = "Processing...";
  } else if (isCheckingAvailability) {
    buttonText = "Checking availability...";
  } else if (!isSpotAvailable) {
    buttonText = "Spot Unavailable";
  }
  
  return (
    <Button 
      className="w-full btn-primary"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="flex items-center">
        {buttonText}
      </span>
    </Button>
  );
};

export default PaymentActionButton;

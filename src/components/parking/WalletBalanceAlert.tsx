
import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

interface WalletBalanceAlertProps {
  currentBalance: number;
  requiredAmount: number;
}

const WalletBalanceAlert = ({ currentBalance, requiredAmount }: WalletBalanceAlertProps) => {
  if (currentBalance >= requiredAmount) {
    return null;
  }
  
  const shortfall = requiredAmount - currentBalance;
  
  return (
    <Alert className="mt-4 bg-amber-50 border-amber-200">
      <Wallet className="h-5 w-5 text-amber-500" />
      <AlertTitle className="text-amber-700 text-base">Insufficient Balance</AlertTitle>
      <AlertDescription className="text-amber-600">
        <p className="mb-3">
          You need <strong>{shortfall.toLocaleString()} DZD</strong> more in your wallet to complete this booking.
        </p>
        <Link to="/wallet" className="block w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-amber-700 border-amber-300 hover:bg-amber-100 font-medium"
          >
            Top Up Wallet Now
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
};

export default WalletBalanceAlert;

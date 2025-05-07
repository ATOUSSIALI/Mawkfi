
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
      <Wallet className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-700">Insufficient Balance</AlertTitle>
      <AlertDescription className="text-amber-600">
        <p className="mb-2">
          You need {shortfall} DZD more in your wallet to complete this booking.
        </p>
        <Link to="/wallet">
          <Button variant="outline" size="sm" className="text-amber-700 border-amber-300 hover:bg-amber-100">
            Top Up Wallet
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
};

export default WalletBalanceAlert;


import React from 'react';
import { useWallet } from '@/contexts/WalletContext';

const WalletBalanceCard = () => {
  const { balance, isLoading } = useWallet();
  
  return (
    <div className="bg-primary/5 rounded-lg p-6 mb-6 text-center">
      <p className="text-muted-foreground mb-1">Current Balance</p>
      <h2 className="text-3xl font-bold text-primary">{isLoading ? '...' : `${balance} DZD`}</h2>
    </div>
  );
};

export default WalletBalanceCard;

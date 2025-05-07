
import React from 'react';
import TopUpCard from './TopUpCard';
import WithdrawCard from './WithdrawCard';

const WalletFunctionsGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <TopUpCard />
      <WithdrawCard />
    </div>
  );
};

export default WalletFunctionsGrid;

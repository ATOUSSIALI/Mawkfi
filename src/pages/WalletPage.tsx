
import React from 'react';
import PageContainer from '@/components/ui-components/PageContainer';
import WalletBalanceCard from '@/components/wallet/WalletBalanceCard';
import WalletFunctionsGrid from '@/components/wallet/WalletFunctionsGrid';
import RecentTransactions from '@/components/wallet/RecentTransactions';

const WalletPage = () => {
  return (
    <PageContainer className="pb-20">
      <h1 className="text-2xl font-bold mb-6">Wallet</h1>
      <WalletBalanceCard />
      <WalletFunctionsGrid />
      <RecentTransactions />
    </PageContainer>
  );
};

export default WalletPage;

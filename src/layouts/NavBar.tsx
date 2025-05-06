
import React from 'react';
import Logo from '@/components/ui-components/Logo';
import { Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import WalletBalanceDisplay from '@/components/payment/WalletBalanceDisplay';

const NavBar = () => {
  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between h-16 px-4">
        <Link to="/dashboard">
          <Logo size="sm" />
        </Link>
        
        <Link to="/wallet" className="flex items-center bg-secondary px-3 py-1.5 rounded-full">
          <Wallet size={16} className="mr-2 text-primary" />
          <WalletBalanceDisplay variant="compact" />
        </Link>
      </div>
    </header>
  );
};

export default NavBar;

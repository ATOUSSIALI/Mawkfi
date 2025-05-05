
import React from 'react';
import Logo from '@/components/ui-components/Logo';
import { Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

const NavBar = () => {
  // Mock wallet balance - in real app would come from user state/context
  const walletBalance = 2500;

  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between h-16 px-4">
        <Link to="/dashboard">
          <Logo size="sm" />
        </Link>
        
        <Link to="/wallet" className="flex items-center bg-secondary px-3 py-1.5 rounded-full">
          <Wallet size={16} className="mr-2 text-primary" />
          <span className="font-medium">{walletBalance} DZD</span>
        </Link>
      </div>
    </header>
  );
};

export default NavBar;

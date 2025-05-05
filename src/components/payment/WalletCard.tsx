
import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

interface WalletCardProps {
  balance: number;
  onAddFunds: () => void;
}

const WalletCard = ({ balance, onAddFunds }: WalletCardProps) => {
  return (
    <div className="bg-gradient-to-r from-primary to-green-600 rounded-lg p-4 text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">My Wallet</h3>
        <Wallet size={20} />
      </div>
      
      <div className="mb-4">
        <p className="text-sm opacity-80">Current Balance</p>
        <p className="text-2xl font-bold">{balance.toLocaleString()} DZD</p>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full bg-white/20 backdrop-blur-sm border-white/40 hover:bg-white/30"
        onClick={onAddFunds}
      >
        Add Funds
      </Button>
    </div>
  );
};

export default WalletCard;

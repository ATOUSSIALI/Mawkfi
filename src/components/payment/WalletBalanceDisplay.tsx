
import React from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface WalletBalanceDisplayProps {
  className?: string;
  variant?: 'default' | 'compact';
}

const WalletBalanceDisplay = ({ 
  className,
  variant = 'default'
}: WalletBalanceDisplayProps) => {
  const { balance, isLoading } = useWallet();

  if (isLoading) {
    return (
      <div className={cn("flex items-center", className)}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span>Loading balance...</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <span className={cn("font-medium", className)}>{balance.toLocaleString()} DZD</span>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-sm text-muted-foreground">Balance</span>
      <span className="font-medium">{balance.toLocaleString()} DZD</span>
    </div>
  );
};

export default WalletBalanceDisplay;

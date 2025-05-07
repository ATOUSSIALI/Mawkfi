
import React from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface WalletBalanceDisplayProps {
  className?: string;
  variant?: 'default' | 'compact';
  showRefreshButton?: boolean;
}

const WalletBalanceDisplay = ({ 
  className,
  variant = 'default',
  showRefreshButton = false
}: WalletBalanceDisplayProps) => {
  const { balance, isLoading, refreshBalance } = useWallet();

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
      <div className={cn("flex items-center", className)}>
        <span className="font-medium">{balance.toLocaleString()} DZD</span>
        {showRefreshButton && (
          <button 
            onClick={() => refreshBalance()}
            className="ml-2 text-xs text-primary hover:underline"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-sm text-muted-foreground">Balance</span>
      <div className="flex items-center">
        <span className="font-medium">{balance.toLocaleString()} DZD</span>
        {showRefreshButton && (
          <button 
            onClick={() => refreshBalance()}
            className="ml-2 text-xs text-primary hover:underline"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
};

export default WalletBalanceDisplay;

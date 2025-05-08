
import React from 'react';
import { Button } from '@/components/ui/button';
import WalletBalanceDisplay from '@/components/payment/WalletBalanceDisplay';
import { RefreshCw } from 'lucide-react';

interface ParkingDetailsHeaderProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

const ParkingDetailsHeader: React.FC<ParkingDetailsHeaderProps> = ({
  onRefresh,
  isRefreshing
}) => {
  return (
    <div className="flex justify-between items-center mb-2">
      <WalletBalanceDisplay variant="compact" />
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onRefresh} 
        disabled={isRefreshing}
        className="flex items-center gap-1"
      >
        <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </Button>
    </div>
  );
};

export default ParkingDetailsHeader;

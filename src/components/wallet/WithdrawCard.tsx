
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';

const WithdrawCard = () => {
  const [amount, setAmount] = useState<number | "">("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { balance, deductBalance } = useWallet();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numeric input
    if (value === "" || /^\d+$/.test(value)) {
      setAmount(value === "" ? "" : Number(value));
    }
  };
  
  const handleWithdraw = async () => {
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw.",
        variant: "destructive",
      });
      return;
    }
    
    if (Number(amount) > balance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough funds to withdraw this amount.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    const success = await deductBalance(Number(amount), "Withdrew funds from wallet");
    
    if (success) {
      setAmount("");
    }
    
    setIsProcessing(false);
  };
  
  return (
    <div className="bg-card rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-2">Withdraw Funds</h2>
      
      <div className="mb-4">
        <label htmlFor="withdraw-amount" className="block text-sm text-muted-foreground mb-1">
          Amount (DZD)
        </label>
        <Input
          id="withdraw-amount"
          type="text"
          placeholder="Enter amount"
          value={amount}
          onChange={handleInputChange}
        />
      </div>
      
      <Button 
        className="w-full" 
        variant="outline"
        onClick={handleWithdraw} 
        disabled={!amount || amount <= 0 || Number(amount) > balance || isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Withdraw Funds'}
      </Button>
    </div>
  );
};

export default WithdrawCard;


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';

const TopUpCard = () => {
  const [amount, setAmount] = useState<number | "">("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { addFunds } = useWallet();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numeric input
    if (value === "" || /^\d+$/.test(value)) {
      setAmount(value === "" ? "" : Number(value));
    }
  };
  
  const handleTopUp = async () => {
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to add.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    const success = await addFunds(Number(amount), "Added funds via top-up");
    
    if (success) {
      setAmount("");
    }
    
    setIsProcessing(false);
  };
  
  return (
    <div className="bg-card rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-2">Add Funds</h2>
      
      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm text-muted-foreground mb-1">
          Amount (DZD)
        </label>
        <Input
          id="amount"
          type="text"
          placeholder="Enter amount"
          value={amount}
          onChange={handleInputChange}
        />
      </div>
      
      <Button 
        className="w-full" 
        onClick={handleTopUp} 
        disabled={!amount || amount <= 0 || isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Add Funds'}
      </Button>
    </div>
  );
};

export default TopUpCard;


import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WalletContextType {
  balance: number;
  refreshBalance: () => Promise<void>;
  addFunds: (amount: number, description: string) => Promise<boolean>;
  deductBalance: (amount: number, description: string) => Promise<boolean>;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType>({
  balance: 0,
  refreshBalance: async () => {},
  addFunds: async () => false,
  deductBalance: async () => false,
  isLoading: false,
});

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const refreshBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setBalance(0);
        return;
      }
      
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', user.id)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setBalance(Number(data.balance));
      }
    } catch (error: any) {
      console.error('Error fetching wallet balance:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addFunds = async (amount: number, description: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add funds",
          variant: "destructive",
        });
        return false;
      }
      
      // Call the add_funds database function
      const { error } = await supabase.rpc('add_funds', {
        amount_to_add: amount,
        user_id_input: user.id,
        description_input: description || "Added funds to wallet"
      });
      
      if (error) {
        throw error;
      }
      
      // Refresh the balance after adding funds
      await refreshBalance();
      
      toast({
        title: "Success",
        description: `${amount} DZD added to your wallet`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Error adding funds:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add funds",
        variant: "destructive",
      });
      return false;
    }
  };

  const deductBalance = async (amount: number, description: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to make a payment",
          variant: "destructive",
        });
        return false;
      }
      
      // Call the withdraw_funds database function
      const { error } = await supabase.rpc('withdraw_funds', {
        amount_to_withdraw: amount,
        user_id_input: user.id,
        description_input: description || "Payment from wallet"
      });
      
      if (error) {
        throw error;
      }
      
      // Refresh the balance after deducting funds
      await refreshBalance();
      
      toast({
        title: "Payment Successful",
        description: `${amount} DZD deducted from your wallet`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Error making payment:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    refreshBalance();
  }, []);

  return (
    <WalletContext.Provider value={{ balance, refreshBalance, addFunds, deductBalance, isLoading }}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;

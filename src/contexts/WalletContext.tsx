
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WalletContextType {
  balance: number;
  isLoading: boolean;
  error: Error | null;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchWalletBalance = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Fetch wallet balance
      const { data, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', user.id)
        .single();
        
      if (walletError) {
        throw walletError;
      }
      
      if (data) {
        setBalance(Number(data.balance));
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch wallet balance'));
      toast({
        title: "Error loading wallet",
        description: "Couldn't fetch your wallet balance.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWalletBalance();

    // Set up subscription to wallet changes
    const subscription = supabase
      .channel('wallet-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wallets' },
        (payload) => {
          // Check if the update is for the current user's wallet
          fetchWalletBalance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        balance,
        isLoading,
        error,
        refreshBalance: fetchWalletBalance
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

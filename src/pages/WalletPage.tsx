
import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/ui-components/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/contexts/WalletContext';

// Mock transaction type
interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'payment';
  description: string;
  date: string;
}

const WalletPage = () => {
  const { toast } = useToast();
  const { balance, refreshBalance } = useWallet();
  
  // Mock wallet data - would normally come from user context/state
  const [amount, setAmount] = useState<number | ''>('');
  const [showAddFundsForm, setShowAddFundsForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoadingTransactions(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('No authenticated user found');
        }
        
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        if (data) {
          const formattedTransactions: Transaction[] = data.map(tx => ({
            id: tx.id,
            amount: Number(tx.amount),
            type: tx.type as 'deposit' | 'withdrawal' | 'payment',
            description: tx.description || '',
            date: new Date(tx.created_at).toLocaleString(),
          }));
          
          setTransactions(formattedTransactions);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };
    
    fetchTransactions();
  }, []);
  
  const handleAddFunds = async () => {
    const addAmount = Number(amount);
    
    if (!addAmount || addAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to add.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Start a transaction
      await supabase.rpc('add_funds', { 
        amount_to_add: addAmount,
        user_id_input: user.id,
        description_input: 'Added funds'
      });
      
      // Refresh wallet balance
      await refreshBalance();
      
      // Show success message
      toast({
        title: "Funds Added",
        description: `${addAmount} DZD has been added to your wallet.`,
      });
      
      // Reset form
      setAmount('');
      setShowAddFundsForm(false);
      
      // Refresh transactions
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        const formattedTransactions: Transaction[] = data.map(tx => ({
          id: tx.id,
          amount: Number(tx.amount),
          type: tx.type as 'deposit' | 'withdrawal' | 'payment',
          description: tx.description || '',
          date: new Date(tx.created_at).toLocaleString(),
        }));
        
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      toast({
        title: "Error",
        description: "Failed to add funds. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleWithdraw = async () => {
    const withdrawAmount = Number(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw.",
        variant: "destructive"
      });
      return;
    }
    
    if (withdrawAmount > balance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough funds to withdraw this amount.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Start a transaction
      await supabase.rpc('withdraw_funds', { 
        amount_to_withdraw: withdrawAmount,
        user_id_input: user.id,
        description_input: 'Funds withdrawal'
      });
      
      // Refresh wallet balance
      await refreshBalance();
      
      // Show success message
      toast({
        title: "Funds Withdrawn",
        description: `${withdrawAmount} DZD has been withdrawn from your wallet.`,
      });
      
      // Reset form
      setAmount('');
      setShowWithdrawForm(false);
      
      // Refresh transactions
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        const formattedTransactions: Transaction[] = data.map(tx => ({
          id: tx.id,
          amount: Number(tx.amount),
          type: tx.type as 'deposit' | 'withdrawal' | 'payment',
          description: tx.description || '',
          date: new Date(tx.created_at).toLocaleString(),
        }));
        
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      toast({
        title: "Error",
        description: "Failed to withdraw funds. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <PageContainer className="pb-20">
      <h1 className="text-2xl font-bold mb-6">Wallet</h1>
      
      <div className="bg-gradient-to-r from-primary to-green-600 rounded-lg p-6 text-white mb-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-semibold">My Balance</h2>
          <Wallet size={24} />
        </div>
        
        <div className="mb-6">
          <p className="text-sm opacity-80">Available Funds</p>
          <p className="text-3xl font-bold">{balance.toLocaleString()} DZD</p>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            className="flex-1 bg-white/20 backdrop-blur-sm border-white/40 hover:bg-white/30"
            onClick={() => {
              setShowAddFundsForm(true);
              setShowWithdrawForm(false);
            }}
          >
            <Plus size={16} className="mr-1" />
            Add Funds
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1 bg-white/20 backdrop-blur-sm border-white/40 hover:bg-white/30"
            onClick={() => {
              setShowWithdrawForm(true);
              setShowAddFundsForm(false);
            }}
          >
            Withdraw
          </Button>
        </div>
      </div>
      
      {showAddFundsForm && (
        <div className="bg-card rounded-lg border p-4 mb-6">
          <h3 className="font-medium mb-4">Add Funds</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount (DZD)
              </label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
              />
            </div>
            
            <div className="flex space-x-3">
              <Button 
                className="flex-1"
                onClick={handleAddFunds}
              >
                Add Funds
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setAmount('');
                  setShowAddFundsForm(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {showWithdrawForm && (
        <div className="bg-card rounded-lg border p-4 mb-6">
          <h3 className="font-medium mb-4">Withdraw Funds</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="withdraw-amount" className="text-sm font-medium">
                Amount (DZD)
              </label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
              />
            </div>
            
            <div className="flex space-x-3">
              <Button 
                className="flex-1"
                onClick={handleWithdraw}
              >
                Withdraw
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setAmount('');
                  setShowWithdrawForm(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="in">Money In</TabsTrigger>
          <TabsTrigger value="out">Money Out</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-3">
          {isLoadingTransactions ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="in" className="space-y-3">
          {isLoadingTransactions ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : transactions
            .filter(t => t.type === 'deposit')
            .map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
        </TabsContent>
        
        <TabsContent value="out" className="space-y-3">
          {isLoadingTransactions ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : transactions
            .filter(t => t.type === 'withdrawal' || t.type === 'payment')
            .map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const isIncoming = transaction.type === 'deposit';
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="text-primary" size={18} />;
      case 'withdrawal':
        return <ArrowUpRight className="text-destructive" size={18} />;
      case 'payment':
        return <ArrowUpRight className="text-orange-500" size={18} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="flex items-center p-3 rounded-md border">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
        {getTransactionIcon(transaction.type)}
      </div>
      
      <div className="flex-1">
        <p className="font-medium">{transaction.description}</p>
        <p className="text-xs text-muted-foreground">{transaction.date}</p>
      </div>
      
      <div className={isIncoming ? 'text-primary font-semibold' : 'text-destructive font-semibold'}>
        {isIncoming ? '+' : '-'}{transaction.amount} DZD
      </div>
    </div>
  );
};

export default WalletPage;

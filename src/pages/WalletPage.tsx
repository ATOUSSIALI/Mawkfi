
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/ui-components/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, PlusCircle, MinusCircle, ChevronRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useWallet } from '@/contexts/WalletContext';

interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  description: string | null;
  created_at: string;
}

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

const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
  const isDeposit = transaction.type === 'deposit';
  
  return (
    <div className="py-3">
      <div className="flex justify-between">
        <div className="flex items-center">
          <div className={`p-2 rounded-full mr-3 ${isDeposit ? 'bg-primary/10' : 'bg-destructive/10'}`}>
            {isDeposit ? (
              <PlusCircle size={18} className="text-primary" />
            ) : (
              <MinusCircle size={18} className="text-destructive" />
            )}
          </div>
          <div>
            <p className="font-medium">{transaction.description || (isDeposit ? 'Added Funds' : 'Withdrawal')}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-bold ${isDeposit ? 'text-primary' : 'text-destructive'}`}>
            {isDeposit ? '+' : '-'}{transaction.amount} DZD
          </p>
        </div>
      </div>
    </div>
  );
};

const RecentTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return;
        }
        
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (error) {
          throw error;
        }
        
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);
  
  const handleViewAll = () => {
    navigate('/transactions');
  };
  
  if (isLoading) {
    return (
      <div className="mt-6 bg-card rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Recent Transactions</h2>
        <div className="text-center py-4">
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-6 bg-card rounded-lg border p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        <Button variant="ghost" size="sm" onClick={handleViewAll} className="text-primary p-0">
          View All
        </Button>
      </div>
      
      {transactions.length > 0 ? (
        <div className="divide-y">
          {transactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <Clock className="mx-auto text-muted-foreground mb-2" size={24} />
          <p className="text-muted-foreground">No transactions yet</p>
        </div>
      )}
    </div>
  );
};

const WalletPage = () => {
  const { balance, isLoading } = useWallet();
  
  return (
    <PageContainer className="pb-20">
      <h1 className="text-2xl font-bold mb-6">Wallet</h1>
      
      <div className="bg-primary/5 rounded-lg p-6 mb-6 text-center">
        <p className="text-muted-foreground mb-1">Current Balance</p>
        <h2 className="text-3xl font-bold text-primary">{isLoading ? '...' : `${balance} DZD`}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <TopUpCard />
        <WithdrawCard />
      </div>
      
      <RecentTransactions />
    </PageContainer>
  );
};

export default WalletPage;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Clock } from 'lucide-react';
import TransactionItem, { Transaction } from './TransactionItem';

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
        
        // Fix the type error by ensuring the data conforms to the Transaction type
        setTransactions((data || []).map(item => ({
          ...item,
          type: item.type as 'deposit' | 'withdrawal' // Cast to the correct type
        })));
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

export default RecentTransactions;

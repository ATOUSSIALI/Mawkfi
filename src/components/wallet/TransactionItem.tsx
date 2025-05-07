
import React from 'react';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  description: string | null;
  created_at: string;
}

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem = ({ transaction }: TransactionItemProps) => {
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

export default TransactionItem;

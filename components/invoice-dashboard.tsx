'use client';

import { useState } from 'react';
import { InvoiceSummary } from './invoice-summary';
import { TransactionsTable } from './transactions-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Transaction = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string | null;
  type: string;
};

type Invoice = {
  reference: string;
  totalAmount: number;
  transactions: Transaction[];
};

export function InvoiceDashboard({ invoice }: { invoice: Invoice }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <InvoiceSummary 
        invoice={invoice} 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory} 
      />
      
      <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>
            Todas as despesas extraídas da fatura {invoice.reference}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable 
            transactions={invoice.transactions} 
            selectedCategory={selectedCategory} 
            onSelectCategory={setSelectedCategory} 
          />
        </CardContent>
      </Card>
    </div>
  );
}

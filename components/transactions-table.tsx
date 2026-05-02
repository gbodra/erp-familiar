'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { MagnifyingGlass } from '@phosphor-icons/react';

type Transaction = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string | null;
  type: string;
};

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.description.toLowerCase().includes(term) ||
      (t.category && t.category.toLowerCase().includes(term))
    );
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(date));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            type="search"
            placeholder="Buscar por nome ou categoria..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
            <TableRow>
              <TableHead className="w-[100px]">Data</TableHead>
              <TableHead>Estabelecimento</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                  Nenhuma transação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{formatDate(tx.date)}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50">
                      {tx.category || 'Outros'}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${tx.type === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
                    {tx.type === 'CREDIT' ? '+' : ''}{formatCurrency(tx.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

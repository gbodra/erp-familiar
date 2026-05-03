'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { ArrowDown, ArrowUp, CreditCard, Receipt } from '@phosphor-icons/react';

type Transaction = {
  amount: number;
  type: string;
  category: string | null;
  description: string;
};

type Invoice = {
  totalAmount: number;
  transactions: Transaction[];
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

import { useState, useEffect } from 'react';

export function InvoiceSummary({ 
  invoice,
  selectedCategory,
  onSelectCategory
}: { 
  invoice: Invoice;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredTransactions = selectedCategory
    ? invoice.transactions.filter(t => (t.category || 'Outros') === selectedCategory)
    : invoice.transactions;

  // Compute totals
  const totalDebits = filteredTransactions
    .filter((t) => t.type === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCredits = filteredTransactions
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const displayTotalAmount = selectedCategory ? totalDebits - totalCredits : invoice.totalAmount;

  // Compute Categories for Chart
  const categoryMap = invoice.transactions
    .filter((t) => t.type === 'DEBIT')
    .reduce((acc, t) => {
      const cat = t.category || 'Outros';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Compute Top Establishments
  const establishmentsMap = invoice.transactions
    .filter((t) => t.type === 'DEBIT')
    .reduce((acc, t) => {
      let name = t.description;
      const lowerDesc = name.toLowerCase();
      
      // Aplicar regra de nome de loja
      if (lowerDesc.includes('shopee')) name = 'Shopee';
      else if (lowerDesc.includes('temu')) name = 'Temu';
      else if (lowerDesc.includes('mercado livre') || lowerDesc.includes('mercadopago')) name = 'Mercado Livre';
      else if (lowerDesc.includes('aliexpress')) name = 'AliExpress';
      else if (lowerDesc.includes('ifood')) name = 'iFood';
      else if (lowerDesc.includes('uber')) name = 'Uber';
      else {
        // Limpeza basica removendo sufixos apos asterisco e numeros
        name = name.split('*')[0].replace(/\d+/g, '').trim();
      }

      acc[name] = (acc[name] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topEstablishments = Object.entries(establishmentsMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {selectedCategory ? `Total: ${selectedCategory}` : 'Valor Total da Fatura'}
            </CardTitle>
            <Receipt size={24} className="text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(displayTotalAmount)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total de Gastos (Débitos)</CardTitle>
            <ArrowUp size={24} className="text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(totalDebits)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total de Créditos/Pagamentos</CardTitle>
            <ArrowDown size={24} className="text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(totalCredits)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="md:col-span-2 shadow-sm border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {categoryData.length > 0 ? (
            isMounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(data) => {
                      const clickedCat = data.name;
                      onSelectCategory(selectedCategory === clickedCat ? null : clickedCat);
                    }}
                    className="cursor-pointer"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          opacity: selectedCategory ? (selectedCategory === entry.name ? 1 : 0.3) : 1,
                        }}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7' }}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            ) : null
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              Sem dados suficientes
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-1 shadow-sm border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard size={20} />
            Top 5 Estabelecimentos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {topEstablishments.map((est, idx) => (
              <li key={idx} className="p-4 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]" title={est.name}>{est.name}</span>
                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">{formatCurrency(est.value)}</span>
              </li>
            ))}
            {topEstablishments.length === 0 && (
              <li className="p-4 text-center text-sm text-zinc-500">Nenhum gasto registrado</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

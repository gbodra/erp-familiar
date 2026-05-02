import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadInvoiceModal } from '@/components/upload-invoice-modal';
import { prisma } from '@/lib/prisma';
import { TransactionsTable } from '@/components/transactions-table';
import { InvoiceSummary } from '@/components/invoice-summary';

export const metadata: Metadata = {
  title: 'Cartão de Crédito - Família ERP',
};

export default async function CreditCardPage() {
  // Fetch the most recent invoice
  const latestInvoice = await prisma.invoice.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      transactions: {
        orderBy: { date: 'desc' }
      }
    }
  });

  return (
    <div className="flex-1 p-8 pt-6 overflow-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Cartão de Crédito</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Acompanhe e analise as faturas da família.</p>
        </div>
        <UploadInvoiceModal />
      </div>

      {!latestInvoice ? (
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-zinc-300 dark:text-zinc-700 mb-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Nenhuma fatura importada</h3>
            <p className="text-zinc-500 mt-2 max-w-md">
              Clique no botão "Importar Fatura" no topo da página para carregar o PDF do Itaú ou C6 Bank.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Fatura Referência: {latestInvoice.reference}</span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold">{latestInvoice.bank}</span>
          </div>

          <InvoiceSummary invoice={latestInvoice} />
          
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Transações</CardTitle>
              <CardDescription>
                Todas as despesas extraídas da fatura {latestInvoice.reference}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsTable transactions={latestInvoice.transactions} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

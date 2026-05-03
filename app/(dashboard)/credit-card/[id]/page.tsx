import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { InvoiceDashboard } from '@/components/invoice-dashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Detalhes da Fatura - Família ERP',
};

export default async function InvoiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: resolvedParams.id },
    include: {
      transactions: {
        orderBy: { date: 'desc' }
      }
    }
  });

  if (!invoice) {
    notFound();
  }

  return (
    <div className="flex-1 p-8 pt-6 overflow-auto">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          <Link href="/credit-card">
            <ArrowLeft className="mr-2" size={16} />
            Voltar para Faturas
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
              Fatura {invoice.reference}
              <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-semibold border border-zinc-200 dark:border-zinc-700">
                {invoice.bank}
              </span>
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Visão detalhada das transações deste mês.</p>
          </div>
        </div>
      </div>

      <InvoiceDashboard invoice={invoice} />
    </div>
  );
}

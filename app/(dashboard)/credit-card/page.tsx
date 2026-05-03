import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadInvoiceModal } from '@/components/upload-invoice-modal';
import { prisma } from '@/lib/prisma';
import { InvoicesTable } from '@/components/invoices-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Cartão de Crédito - Família ERP',
};

export default async function CreditCardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const pageSize = 10;
  
  const where: any = {};
  if (session?.user?.role !== 'ADMIN') {
    where.userId = session?.user?.id;
  }

  const [invoices, totalCount] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        reference: true,
        bank: true,
        totalAmount: true,
        createdAt: true,
        status: true,
      }
    }),
    prisma.invoice.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);


  return (
    <div className="flex-1 p-8 pt-6 overflow-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Cartões de Crédito</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gerencie suas faturas importadas.</p>
        </div>
        <UploadInvoiceModal />
      </div>

      <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Faturas Importadas</CardTitle>
          <CardDescription>
            Todas as faturas processadas no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesTable invoices={invoices} />
          
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link href={`/credit-card?page=${page - 1}`}>Anterior</Link>
                ) : (
                  <span>Anterior</span>
                )}
              </Button>
              <div className="text-sm text-zinc-500">
                Página {page} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <Link href={`/credit-card?page=${page + 1}`}>Próxima</Link>
                ) : (
                  <span>Próxima</span>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

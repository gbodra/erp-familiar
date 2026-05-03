'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Trash } from '@phosphor-icons/react';
import { deleteInvoice } from '@/lib/invoice-actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type InvoiceSummary = {
  id: string;
  reference: string;
  bank: string;
  totalAmount: number;
  createdAt: Date;
};

interface InvoicesTableProps {
  invoices: InvoiceSummary[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    const result = await deleteInvoice(id);
    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
    setIsDeleting(null);
  };

  const handleView = (id: string) => {
    router.push(`/credit-card/${id}`);
  };

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed">
        <p className="text-zinc-500">Nenhuma fatura encontrada.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Referência</TableHead>
            <TableHead>Banco</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="group">
              <TableCell>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {invoice.reference}
                </div>
              </TableCell>
              <TableCell>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                  {invoice.bank}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(invoice.totalAmount)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleView(invoice.id)}
                    title="Ver detalhes"
                  >
                    <Eye size={18} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        disabled={isDeleting === invoice.id}
                        title="Excluir fatura"
                      >
                        <Trash size={18} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta fatura? Todas as transações associadas serão permanentemente perdidas. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(invoice.id)}
                          className="bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-600"
                        >
                          Excluir Fatura
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

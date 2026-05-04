'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Trash, SpinnerGap, PencilSimple, Check, X } from '@phosphor-icons/react';
import { deleteInvoice, updateInvoiceReference } from '@/lib/invoice-actions';
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
  status: string;
};

interface InvoicesTableProps {
  invoices: InvoiceSummary[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Polling logic
  useEffect(() => {
    const hasPending = invoices.some((inv) => inv.status === 'PENDING');
    if (hasPending) {
      const intervalId = setInterval(() => {
        router.refresh();
      }, 3000);
      return () => clearInterval(intervalId);
    }
  }, [invoices, router]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

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

  const startEditing = (invoice: InvoiceSummary) => {
    setEditingId(invoice.id);
    setEditValue(invoice.reference);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveReference = async () => {
    if (!editingId || !editValue.trim()) return;

    setIsSaving(true);
    const result = await updateInvoiceReference(editingId, editValue);
    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
    setIsSaving(false);
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveReference();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
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
            <TableRow
              key={invoice.id}
              className={`group ${invoice.status === 'PROCESSED' && editingId !== invoice.id ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50' : ''}`}
              onClick={() => {
                if (invoice.status === 'PROCESSED' && editingId !== invoice.id) {
                  handleView(invoice.id);
                }
              }}
            >
              <TableCell>
                {invoice.status === 'PENDING' ? (
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 gap-1.5">
                    <SpinnerGap size={14} className="animate-spin" />
                    Processando...
                  </div>
                ) : invoice.status === 'FAILED' ? (
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                    Falha no processamento
                  </div>
                ) : editingId === invoice.id ? (
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="h-8 w-28 text-xs sm:w-36"
                      placeholder="ex: 2025-04"
                      disabled={isSaving}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/50"
                      onClick={saveReference}
                      disabled={isSaving}
                      title="Salvar"
                    >
                      {isSaving ? (
                        <SpinnerGap size={14} className="animate-spin" />
                      ) : (
                        <Check size={16} weight="bold" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      onClick={cancelEditing}
                      disabled={isSaving}
                      title="Cancelar"
                    >
                      <X size={16} weight="bold" />
                    </Button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {invoice.reference}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(invoice);
                      }}
                      title="Editar referência"
                    >
                      <PencilSimple size={14} />
                    </Button>
                  </div>
                )}
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
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(invoice.id);
                    }}
                    title="Ver detalhes"
                    disabled={invoice.status !== 'PROCESSED'}
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
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash size={18} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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

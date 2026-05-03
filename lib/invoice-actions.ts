'use server';

import { parseCreditCardPdf } from './pdf-parser';
import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

// Background job that will process the invoice after the request returns
async function processInvoiceBackground(invoiceId: string, buffer: Buffer, bank: string) {
  try {
    const parsedData = await parseCreditCardPdf(buffer, bank as 'ITAU' | 'C6');

    if (parsedData.transactions.length === 0) {
      throw new Error('Não conseguimos extrair nenhuma transação deste PDF.');
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        reference: parsedData.reference,
        totalAmount: parsedData.totalAmount,
        status: 'PROCESSED',
        transactions: {
          create: parsedData.transactions.map((tx) => ({
            date: tx.date,
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
            category: tx.category,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error('Background processing error:', error);
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'FAILED' }
    });
  }
}

export async function uploadAndParseInvoice(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Não autorizado' };
    }

    const file = formData.get('file') as File;
    const bank = formData.get('bank') as string;

    if (!file || !bank) {
      return { error: 'Arquivo ou banco não fornecidos' };
    }

    if (file.type !== 'application/pdf') {
      return { error: 'O arquivo precisa ser um PDF.' };
    }

    // Convert standard File to Node.js Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to Database as PENDING
    const newInvoice = await prisma.invoice.create({
      data: {
        bank,
        reference: 'Processando...',
        totalAmount: 0,
        status: 'PENDING',
      },
    });

    // Start background task WITHOUT awaiting
    processInvoiceBackground(newInvoice.id, buffer, bank).catch(console.error);

    revalidatePath('/credit-card');
    return { success: true, invoiceId: newInvoice.id };

  } catch (error: any) {
    console.error('Action error:', error);
    return { error: error.message || 'Erro interno ao iniciar o processamento da fatura.' };
  }
}

export async function deleteInvoice(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Não autorizado' };
    }

    // Prisma will handle deleting transactions via cascade if configured,
    // otherwise we delete transactions manually first.
    await prisma.creditCardTransaction.deleteMany({
      where: { invoiceId: id },
    });

    await prisma.invoice.delete({
      where: { id },
    });

    revalidatePath('/credit-card');
    return { success: true };
  } catch (error: any) {
    console.error('Delete invoice error:', error);
    return { error: 'Falha ao excluir a fatura.' };
  }
}

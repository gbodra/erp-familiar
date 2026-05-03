'use server';

import { parseCreditCardPdf } from './pdf-parser';
import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

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

    // Parse the PDF
    const parsedData = await parseCreditCardPdf(buffer, bank as 'ITAU' | 'C6');

    if (parsedData.transactions.length === 0) {
      return { error: 'Não conseguimos extrair nenhuma transação deste PDF. Verifique se o formato está correto.' };
    }

    // Save to Database
    const newInvoice = await prisma.invoice.create({
      data: {
        bank,
        reference: parsedData.reference,
        totalAmount: parsedData.totalAmount,
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

    revalidatePath('/credit-card');
    return { success: true, invoiceId: newInvoice.id };

  } catch (error: any) {
    console.error('Action error:', error);
    return { error: error.message || 'Erro interno ao processar a fatura.' };
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

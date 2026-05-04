'use server';

import { parseCreditCardPdf } from './pdf-parser';
import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { GoogleGenAI, Type, Schema } from '@google/genai';

function parseCsvDate(str: string): Date | null {
  str = str.trim();
  if (!str) return null;

  // matches DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  let m = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    return new Date(Date.UTC(year, month - 1, day));
  }

  // matches YYYY-MM-DD
  m = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const day = parseInt(m[3], 10);
    return new Date(Date.UTC(year, month - 1, day));
  }

  // matches DD/MM (if year is missing)
  m = str.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = new Date().getFullYear();
    return new Date(Date.UTC(year, month - 1, day));
  }

  return null;
}

function parseCsvAmount(str: string): number | null {
  str = str.trim();
  if (!str) return null;

  let cleaned = str.replace(/[R$\s]/gi, '');

  if (cleaned.includes('.') && cleaned.includes(',')) {
    if (cleaned.indexOf('.') < cleaned.indexOf(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
    } else {
      cleaned = cleaned.replace(/,/g, '').replace(/\./g, '.');
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/,/g, '.');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function determineTransactionTypeAndCategory(desc: string) {
  const lowerDesc = desc.toLowerCase();

  const isCredit = lowerDesc.includes('estorno') || 
                   lowerDesc.includes('pagamento') || 
                   lowerDesc.includes('credito') || 
                   lowerDesc.includes('crédito');

  const type: 'CREDIT' | 'DEBIT' = isCredit ? 'CREDIT' : 'DEBIT';

  let category = 'Outros';
  if (isCredit) {
    category = 'Pagamento/Estorno';
  } else if (lowerDesc.includes('shopee')) {
    category = 'Shopee';
  } else if (lowerDesc.includes('mercado livre') || lowerDesc.includes('mercado pago')) {
    category = 'Mercado Livre';
  } else if (lowerDesc.includes('ifood')) {
    category = 'iFood';
  } else if (lowerDesc.includes('temu')) {
    category = 'Temu';
  } else if (lowerDesc.includes('uber')) {
    category = 'Uber';
  } else if (lowerDesc.includes('aliexpress')) {
    category = 'AliExpress';
  } else if (lowerDesc.includes('restaurante') || lowerDesc.includes('lanchonete') || lowerDesc.includes('food') || lowerDesc.includes('mcdonald')) {
    category = 'Alimentação';
  } else if (lowerDesc.includes('posto') || lowerDesc.includes('99app')) {
    category = 'Transporte';
  } else if (lowerDesc.includes('farmacia') || lowerDesc.includes('drogaria') || lowerDesc.includes('hospital')) {
    category = 'Saúde';
  }

  return { type, category };
}

async function classifyWithGemini(descriptions: string[]): Promise<Record<string, string>> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('A variável GEMINI_API_KEY não está configurada no ambiente.');
  }

  const ai = new GoogleGenAI({});

  const classificationSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      classifications: {
        type: Type.ARRAY,
        description: "Lista de descrições e suas respectivas categorias correspondentes.",
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ["description", "category"],
        },
      },
    },
    required: ["classifications"],
  };

  const prompt = `Você é um classificador de despesas financeiras especialista. A seguir está uma lista de descrições de transações do cartão de crédito.
Sua tarefa é atribuir a categoria correta para cada uma das descrições.

Regras importantes de categorização:
1. Para compras em plataformas como Shopee, Temu, Mercado Livre, Ifood, Uber, AliExpress, retorne o próprio nome da loja limpo (ex: 'Shopee', 'Temu', 'Mercado Livre', 'iFood', 'Uber', 'AliExpress').
2. Para outras compras, use categorias genéricas como 'Alimentação', 'Transporte', 'Saúde', 'Moradia', 'Lazer', 'Educação', 'Compras', 'Serviços', 'Outros'.
3. Retorne a resposta estritamente no formato do responseSchema fornecido.

Lista de descrições a serem classificadas:
${descriptions.map((desc) => `- ${desc}`).join('\n')}
`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: classificationSchema,
        temperature: 0.1,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Resposta vazia da API do Gemini.');
    }

    const parsedData = JSON.parse(responseText);
    const mapping: Record<string, string> = {};

    if (parsedData.classifications && Array.isArray(parsedData.classifications)) {
      for (const item of parsedData.classifications) {
        if (item && item.description && item.category) {
          mapping[item.description.trim().toLowerCase()] = item.category;
        }
      }
    }

    return mapping;
  } catch (error) {
    console.error('Erro na classificação de transações via Gemini:', error);
    return {};
  }
}

async function processInvoiceCsvBackground(invoiceId: string, text: string) {
  try {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) {
      throw new Error('O arquivo CSV está vazio.');
    }

    const sampleLines = lines.slice(0, Math.min(5, lines.length));
    let semiCount = 0;
    let commaCount = 0;
    for (const line of sampleLines) {
      semiCount += (line.match(/;/g) || []).length;
      commaCount += (line.match(/,/g) || []).length;
    }

    const separator = semiCount >= commaCount ? ';' : ',';

    const grid: string[][] = [];
    for (const line of lines) {
      const row: string[] = [];
      let inQuotes = false;
      let currentToken = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
          row.push(currentToken);
          currentToken = '';
        } else {
          currentToken += char;
        }
      }
      row.push(currentToken);
      grid.push(row.map(cell => cell.replace(/^"|"$/g, '').trim()));
    }

    if (grid.length < 2) {
      throw new Error('O arquivo CSV não contém transações suficientes.');
    }

    let dateCol = -1;
    let descCol = -1;
    let amountCol = -1;

    const firstRow = grid[0];
    for (let i = 0; i < firstRow.length; i++) {
      const header = firstRow[i].toLowerCase().trim();
      if (header.includes('data') || header.includes('date')) dateCol = i;
      if (header.includes('estabelecimento') || header.includes('descri') || header.includes('hist') || header.includes('description')) descCol = i;
      if (header.includes('valor') || header.includes('amount')) amountCol = i;
    }

    if (dateCol === -1 || descCol === -1 || amountCol === -1) {
      for (const row of grid) {
        if (row.length < 2) continue;

        for (let i = 0; i < row.length; i++) {
          const val = row[i].trim();
          if (!val) continue;

          if (dateCol === -1 && /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(val)) {
            dateCol = i;
          } else if (amountCol === -1 && /^-?[\d\s]+[,.]\d{2}$|^-?\d+$/.test(val.replace(/[R$\s]/gi, ''))) {
            amountCol = i;
          } else if (descCol === -1 && i !== dateCol && i !== amountCol && val.length > 2) {
            descCol = i;
          }
        }
      }
    }

    if (dateCol === -1 || descCol === -1 || amountCol === -1) {
      throw new Error('Não foi possível identificar as colunas de data, estabelecimento e valor no CSV.');
    }

    const transactions: any[] = [];
    const monthYearFrequency: Record<string, number> = {};

    for (let rowIndex = 1; rowIndex < grid.length; rowIndex++) {
      const row = grid[rowIndex];
      if (row.length <= Math.max(dateCol, descCol, amountCol)) continue;

      const dateStr = row[dateCol];
      const descStr = row[descCol];
      const amountStr = row[amountCol];

      if (!dateStr || !descStr || !amountStr) continue;

      const descLower = descStr.toLowerCase();
      if (
        descLower.includes('inclusao de pagamento') ||
        descLower.includes('inclusão de pagamento') ||
        descLower.includes('pagamento de fatura') ||
        descLower.includes('pagamento efetuado')
      ) {
        continue;
      }

      const date = parseCsvDate(dateStr);
      const amount = parseCsvAmount(amountStr);

      if (!date || amount === null) continue;

      const monthStr = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const yearMonth = `${date.getUTCFullYear()}-${monthStr}`;
      monthYearFrequency[yearMonth] = (monthYearFrequency[yearMonth] || 0) + 1;

      const { type, category } = determineTransactionTypeAndCategory(descStr);

      transactions.push({
        date,
        description: descStr,
        amount: Math.abs(amount),
        type,
        category,
      });
    }

    if (transactions.length === 0) {
      throw new Error('Nenhuma transação válida foi encontrada no CSV.');
    }

    // Classificar transações com o Gemini
    const uniqueDescriptions = Array.from(new Set(transactions.map(tx => tx.description.trim())));
    let classifications: Record<string, string> = {};
    if (uniqueDescriptions.length > 0) {
      try {
        classifications = await classifyWithGemini(uniqueDescriptions);
      } catch (err) {
        console.error('Falha na classificação Gemini, usando fallback:', err);
      }
    }

    // Atribuir categorias finais
    for (const tx of transactions) {
      const lowerDesc = tx.description.trim().toLowerCase();
      if (classifications[lowerDesc]) {
        tx.category = classifications[lowerDesc];
      }
    }

    let reference = '';
    let maxFreq = 0;
    for (const [ym, freq] of Object.entries(monthYearFrequency)) {
      if (freq > maxFreq) {
        maxFreq = freq;
        reference = ym;
      }
    }

    if (!reference) {
      const now = new Date();
      reference = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    const totalAmount = transactions
      .filter(tx => tx.type === 'DEBIT')
      .reduce((sum, tx) => sum + tx.amount, 0) -
      transactions
      .filter(tx => tx.type === 'CREDIT' && tx.description.toLowerCase().includes('estorno'))
      .reduce((sum, tx) => sum + tx.amount, 0);

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        reference,
        totalAmount,
        status: 'PROCESSED',
        transactions: {
          create: transactions.map((tx) => ({
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
    console.error('CSV Processing Error:', error);
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'FAILED' },
    });
  }
}

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

    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isCsv && !isPdf) {
      return { error: 'O arquivo precisa ser um PDF ou CSV.' };
    }

    // Save to Database as PENDING
    const newInvoice = await prisma.invoice.create({
      data: {
        bank,
        reference: 'Processando...',
        totalAmount: 0,
        status: 'PENDING',
        userId: session.user.id,
      },
    });

    if (isCsv) {
      const text = await file.text();
      processInvoiceCsvBackground(newInvoice.id, text).catch(console.error);
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      processInvoiceBackground(newInvoice.id, buffer, bank).catch(console.error);
    }

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

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingInvoice) {
      return { error: 'Fatura não encontrada.' };
    }

    if (session.user.role !== 'ADMIN' && existingInvoice.userId !== session.user.id) {
      return { error: 'Não autorizado para excluir esta fatura.' };
    }

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

export async function updateInvoiceReference(id: string, reference: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Não autorizado' };
    }

    if (!reference || reference.trim().length === 0) {
      return { error: 'A referência não pode ser vazia.' };
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingInvoice) {
      return { error: 'Fatura não encontrada.' };
    }

    if (session.user.role !== 'ADMIN' && existingInvoice.userId !== session.user.id) {
      return { error: 'Não autorizado para editar esta fatura.' };
    }

    await prisma.invoice.update({
      where: { id },
      data: { reference: reference.trim() },
    });

    revalidatePath('/credit-card');
    return { success: true };
  } catch (error: any) {
    console.error('Update invoice reference error:', error);
    return { error: 'Falha ao atualizar a referência da fatura.' };
  }
}

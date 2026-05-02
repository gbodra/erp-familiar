export type ParsedTransaction = {
  date: Date;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  category: string;
};

// Auto-categorization rules
const CATEGORY_RULES: Record<string, string[]> = {
  'Alimentação': ['ifood', 'restaurante', 'padaria', 'mc donalds', 'mcdonalds', 'bk', 'burger king', 'mercado', 'supermercado', 'pao de acucar', 'carrefour', 'z e d', 'bar', 'lanchonete', 'sorveteria', 'doceria'],
  'Transporte': ['uber', '99', 'posto', 'shell', 'ipiranga', 'petrobras', 'estacionamento', 'sem parar', 'conectar', 'veloe', '99app'],
  'Assinaturas & Lazer': ['netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'cinema', 'ingresso', 'sympla', 'eventim', 'apple', 'google', 'steam', 'playstation', 'xbox'],
  'Saúde & Bem-estar': ['farmacia', 'droga raia', 'drogasil', 'pague menos', 'unimed', 'sulamerica', 'hospital', 'clinica', 'smart fit', 'gympass', 'academia'],
  'Compras': ['amazon', 'mercado livre', 'shopee', 'aliexpress', 'shein', 'magalu', 'americanas', 'zara', 'renner', 'c&a', 'cea', 'riachuelo'],
  'Moradia': ['enel', 'light', 'copel', 'cemig', 'sabesp', 'ceg', 'comgas', 'condominio', 'aluguel'],
  'Educação': ['escola', 'colegio', 'faculdade', 'universidade', 'curso', 'alura', 'udemy'],
};

function guessCategory(description: string): string {
  const lowerDesc = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some((keyword) => lowerDesc.includes(keyword))) {
      return category;
    }
  }
  return 'Outros';
}

function parseAmount(amountStr: string): number {
  return parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
}

function parseDate(dateStr: string, referenceYear: number): Date {
  const [day, month] = dateStr.split('/');
  return new Date(referenceYear, parseInt(month) - 1, parseInt(day));
}

export async function parseCreditCardPdf(fileBuffer: Buffer, bank: 'ITAU' | 'C6'): Promise<{
  reference: string;
  totalAmount: number;
  transactions: ParsedTransaction[];
}> {
  try {
    // Polyfill browser globals that pdf-parse/pdf.js expects in Node.js
    const g = globalThis as any;
    if (!g.DOMMatrix) g.DOMMatrix = class DOMMatrix { constructor() {} };
    if (!g.Path2D) g.Path2D = class Path2D { constructor() {} };
    if (!g.ImageData) g.ImageData = class ImageData { constructor() {} };

    // pdf-parse v2 uses a class-based API
    const { PDFParse } = require('pdf-parse');
    
    const parser = new PDFParse({ data: new Uint8Array(fileBuffer) });
    await parser.load();
    const result = await parser.getText();
    await parser.destroy();

    // pdf-parse v2 getText() returns { pages, text, total }
    const text: string = typeof result === 'string' ? result : result.text;

    const now = new Date();
    const referenceYear = now.getFullYear();
    const referenceMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const reference = `${referenceYear}-${referenceMonth}`;

    let totalAmount = 0;
    const transactions: ParsedTransaction[] = [];

    const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

    for (const line of lines) {
      const dateMatch = line.match(/^(\d{2}\/\d{2})/);
      const amountMatch = line.match(/(-?\d{1,3}(?:\.\d{3})*,\d{2})$/);

      if (dateMatch && amountMatch) {
        const dateStr = dateMatch[1];
        const amountStr = amountMatch[1];

        const description = line.substring(dateStr.length, line.length - amountStr.length).trim();

        if (!description) continue;

        let amount = parseAmount(amountStr);
        let type: 'CREDIT' | 'DEBIT' = 'DEBIT';

        if (amount < 0 || line.includes('PAGAMENTO') || line.includes('ESTORNO') || description.toLowerCase().includes('pagamento')) {
          type = 'CREDIT';
          amount = Math.abs(amount);
        } else {
          totalAmount += amount;
        }

        transactions.push({
          date: parseDate(dateStr, referenceYear),
          description,
          amount,
          type,
          category: type === 'CREDIT' ? 'Pagamento/Estorno' : guessCategory(description),
        });
      }
    }

    return {
      reference,
      totalAmount,
      transactions,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Falha ao interpretar o arquivo PDF.');
  }
}

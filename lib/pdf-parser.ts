import { GoogleGenAI, Type, Schema } from '@google/genai';

export type ParsedTransaction = {
  date: Date;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  category: string;
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reference: {
      type: Type.STRING,
      description: "O mês e ano de referência da fatura no formato YYYY-MM, ex: '2023-10'."
    },
    totalAmount: {
      type: Type.NUMBER,
      description: "O valor líquido total final a ser pago na fatura. Ignore parcelas futuras ou saldo anterior que não afete este total exato."
    },
    transactions: {
      type: Type.ARRAY,
      description: "Lista de todas as transações (compras, pagamentos, estornos) presentes nesta fatura.",
      items: {
        type: Type.OBJECT,
        properties: {
          date: {
            type: Type.STRING,
            description: "Data da transação no formato YYYY-MM-DD. Infira o ano com base no mês e no ano de referência da fatura."
          },
          description: {
            type: Type.STRING,
            description: "Descrição ou nome do estabelecimento da transação."
          },
          amount: {
            type: Type.NUMBER,
            description: "O valor absoluto (positivo) da transação."
          },
          type: {
            type: Type.STRING,
            enum: ["CREDIT", "DEBIT"],
            description: "Tipo da transação. DEBIT para despesas/compras, CREDIT para pagamentos recebidos ou estornos."
          },
          category: {
            type: Type.STRING,
            description: "Categoria curta para a transação. Ex: Alimentação, Transporte, Saúde, Moradia, Lazer, Educação, Compras, Outros. Use 'Pagamento/Estorno' se for CREDIT."
          }
        },
        required: ["date", "description", "amount", "type", "category"]
      }
    }
  },
  required: ["reference", "totalAmount", "transactions"]
};

export async function parseCreditCardPdf(fileBuffer: Buffer, bank: 'ITAU' | 'C6'): Promise<{
  reference: string;
  totalAmount: number;
  transactions: ParsedTransaction[];
}> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('A variável GEMINI_API_KEY não está configurada no ambiente.');
  }

  try {
    const ai = new GoogleGenAI({});

    const prompt = `Você é um extrator de dados financeiros especialista. A seguir está um PDF de uma fatura de cartão de crédito do banco ${bank}.
Sua tarefa é analisar o documento e extrair os dados em formato estruturado.

Regras importantes:
1. Extraia o "totalAmount" como o valor final EXATO da fatura atual.
2. Identifique transações de estornos e classifique-os como "CREDIT". Todas as compras devem ser "DEBIT".
3. IGNORE TOTALMENTE lançamentos de "Pagamento efetuado", "Pagamento de fatura" ou recebimento de pagamentos da fatura anterior. Eles NÃO devem entrar na lista de transações.
4. Para a "description", mantenha o nome completo e exato que aparece na fatura (ex: 'SHOPEE *VivaFestas', 'GNT*TEMU 01/02'). NÃO limpe a descrição.
5. Para a "category", se for uma compra em plataformas como Shopee, Temu, Mercado Livre, Ifood, Uber, AliExpress, retorne o próprio nome da loja limpo (ex: 'Shopee', 'Temu', 'Mercado Livre'). Para outras compras, use categorias genéricas como 'Alimentação', 'Transporte', 'Serviços', etc.
6. Use o valor absoluto (positivo) para o "amount". Deduza o ano corretamente para a data (YYYY-MM-DD).
`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: fileBuffer.toString('base64')
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.1,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Resposta vazia da API do Gemini.');
    }

    const parsedData = JSON.parse(responseText);

    // Converte as datas string para objetos Date
    const transactions: ParsedTransaction[] = parsedData.transactions.map((tx: any) => {
      // Cria a data evitando problemas de timezone (assumindo meia noite UTC)
      const date = new Date(tx.date + 'T00:00:00Z');
      return {
        ...tx,
        date
      };
    });

    return {
      reference: parsedData.reference,
      totalAmount: parsedData.totalAmount,
      transactions
    };
  } catch (error: any) {
    console.error('Erro na extração de PDF via Gemini:', error);
    throw new Error('Falha ao processar a fatura com Inteligência Artificial. ' + (error.message || ''));
  }
}

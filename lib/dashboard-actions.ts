"use server"

import { prisma } from "@/lib/prisma"

export async function fetchDashboardFinancialData(startOfWeekStr: string, endOfWeekStr: string) {
  try {
    const startOfWeek = new Date(startOfWeekStr)
    const endOfWeek = new Date(endOfWeekStr)

    // Fetch transactions matching the current week
    const weeklyTransactions = await prisma.creditCardTransaction.findMany({
      where: {
        date: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      orderBy: { date: "desc" },
    })

    let displayTransactions = weeklyTransactions
    let usingFallback = false

    if (displayTransactions.length === 0) {
      displayTransactions = await prisma.creditCardTransaction.findMany({
        take: 10,
        orderBy: { date: "desc" },
      })
      usingFallback = true
    }

    // Compute metrics
    const totalDebits = displayTransactions
      .filter((t) => t.type === "DEBIT")
      .reduce((sum, t) => sum + t.amount, 0)

    const largestDebit = displayTransactions
      .filter((t) => t.type === "DEBIT")
      .reduce((max, t) => (t.amount > max ? t.amount : max), 0)

    return {
      success: true,
      totalDebits,
      largestDebit,
      transactionsCount: displayTransactions.length,
      displayTransactions,
      usingFallback,
    }
  } catch (err: any) {
    console.error("fetchDashboardFinancialData error:", err)
    return {
      success: false,
      error: err.message || "Erro desconhecido ao carregar dados financeiros",
    }
  }
}

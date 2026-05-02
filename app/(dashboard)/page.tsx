"use client"

import React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { CurrencyDollar, TrendUp, Wallet, ChartBar } from "@phosphor-icons/react"

// Mock Data
const chartData = [
  { month: "Jan", revenue: 45000, expenses: 32000 },
  { month: "Fev", revenue: 48000, expenses: 34000 },
  { month: "Mar", revenue: 51000, expenses: 31000 },
  { month: "Abr", revenue: 53000, expenses: 35000 },
  { month: "Mai", revenue: 60000, expenses: 38000 },
  { month: "Jun", revenue: 58000, expenses: 36000 },
  { month: "Jul", revenue: 62000, expenses: 40000 },
  { month: "Ago", revenue: 65000, expenses: 42000 },
  { month: "Set", revenue: 70000, expenses: 45000 },
  { month: "Out", revenue: 72000, expenses: 44000 },
  { month: "Nov", revenue: 75000, expenses: 48000 },
  { month: "Dez", revenue: 80000, expenses: 50000 },
]

const chartConfig = {
  revenue: {
    label: "Receita",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Despesas",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6 bg-zinc-50 dark:bg-zinc-950 min-h-screen font-sans">
      <div className="flex items-center justify-between space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Painel Administrativo</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <CurrencyDollar size={20} className="text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 80.000,00</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              +6.6% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem EBITDA (Mês)</CardTitle>
            <TrendUp size={20} className="text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">37.5%</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              R$ 30.000,00 EBITDA
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem EBITDA (YTD)</CardTitle>
            <ChartBar size={20} className="text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35.2%</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              +2.1% acima da meta
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas YTD</CardTitle>
            <Wallet size={20} className="text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 475.000,00</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Dentro do orçamento planejado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card className="col-span-1 shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Receitas vs Despesas (Últimos 12 Meses)</CardTitle>
            <CardDescription>
              Acompanhamento financeiro anual da família.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[400px] w-full"
            >
              <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis 
                  tickFormatter={(value) => `R$ ${value / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

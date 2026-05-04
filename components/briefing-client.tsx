"use client"

import React, { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CalendarBlank,
  TrendUp,
  Receipt,
  ArrowUp,
  ArrowsClockwise
} from "@phosphor-icons/react"
import { getCalendarEvents, syncCalComEvents } from "@/lib/calendar-actions"
import { fetchDashboardFinancialData } from "@/lib/dashboard-actions"

import { useCache } from "@/hooks/use-cache"

type BookingEvent = {
  id: string
  title: string
  startTime: string
  endTime: string
  description?: string
}

export function BriefingClient({
  sessionName,
  startOfWeekStr,
  endOfWeekStr,
  startOfWeekIso,
  endOfWeekIso,
}: {
  sessionName: string
  startOfWeekStr: string
  endOfWeekStr: string
  startOfWeekIso: string
  endOfWeekIso: string
}) {
  const [events, setEvents] = useState<BookingEvent[]>([])
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [isMounted, setIsMounted] = useState<boolean>(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Use frontend cache hook for financial data
  const { data: financialData, isLoading: isFinancialLoading } = useCache(
    `financial_${startOfWeekIso}_${endOfWeekIso}`,
    async () => {
      const res = await fetchDashboardFinancialData(startOfWeekIso, endOfWeekIso)
      if (res.success) {
        return {
          totalDebits: res.totalDebits || 0,
          largestDebit: res.largestDebit || 0,
          transactionsCount: res.transactionsCount || 0,
          displayTransactions: res.displayTransactions || [],
          usingFallback: res.usingFallback || false,
        }
      }
      throw new Error(res.error || "Erro ao carregar dados financeiros")
    },
    { ttl: 2 * 60 * 1000 }
  )

  // Use frontend cache hook for calendar events
  const { data: cachedEvents, isLoading: isEventsLoading, mutate: mutateEvents } = useCache(
    `events_${startOfWeekIso}_${endOfWeekIso}`,
    async () => {
      const dbRes = await getCalendarEvents(startOfWeekIso, endOfWeekIso)
      if (dbRes.success && dbRes.data) {
        return dbRes.data.sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
      }
      return []
    },
    { ttl: 2 * 60 * 1000 }
  )

  // When cached events update, sync with state
  useEffect(() => {
    if (cachedEvents) {
      setEvents(cachedEvents)
    }
  }, [cachedEvents])

  // Sync latest events in the background
  useEffect(() => {
    setIsSyncing(true)
    syncCalComEvents(startOfWeekIso, endOfWeekIso)
      .then((syncRes) => {
        if (syncRes.success && syncRes.data) {
          const sorted = syncRes.data.sort(
            (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          )
          setEvents(sorted)
          mutateEvents(sorted)
        }
      })
      .catch((err) => {
        console.error("Erro ao sincronizar eventos no briefing:", err)
      })
      .finally(() => {
        setIsSyncing(false)
      })
  }, [startOfWeekIso, endOfWeekIso])




  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Define dynamic greeting
  const hour = new Date().getHours()
  let greeting = "Bom dia"
  if (hour >= 12 && hour < 18) greeting = "Boa tarde"
  else if (hour >= 18 || hour < 5) greeting = "Boa noite"

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-zinc-50 dark:bg-zinc-950 min-h-screen font-sans">
      {/* Welcome & Interval banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text">
            {greeting}, {sessionName}!
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Aqui está o briefing da sua semana: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{startOfWeekStr} até {endOfWeekStr}</span>
          </p>
        </div>
        <span className="text-xs font-medium px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-full select-none">
          Família ERP Briefing
        </span>
      </div>

      {/* Metric Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Card 1: Total Gasto */}
        {isFinancialLoading || !financialData ? (
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 animate-pulse bg-white dark:bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
              <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-7 w-20 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
              <div className="h-3 w-36 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all bg-white dark:bg-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Gasto na Semana</CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 flex items-center justify-center">
                <ArrowUp size={16} className="text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(financialData.totalDebits)}</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Despesas com cartão registradas
              </p>
            </CardContent>
          </Card>
        )}

        {/* Card 2: Maior Despesa */}
        {isFinancialLoading || !financialData ? (
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 animate-pulse bg-white dark:bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
              <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-7 w-20 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
              <div className="h-3 w-36 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all bg-white dark:bg-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Maior Despesa</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center">
                <TrendUp size={16} className="text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(financialData.largestDebit)}</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Maior compra registrada
              </p>
            </CardContent>
          </Card>
        )}

        {/* Card 3: Nº de Transações */}
        {isFinancialLoading || !financialData ? (
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 animate-pulse bg-white dark:bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
              <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-7 w-20 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
              <div className="h-3 w-36 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all bg-white dark:bg-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Nº de Transações</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center">
                <Receipt size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{financialData.transactionsCount}</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {financialData.usingFallback ? "Registradas recentemente" : "Efetuadas esta semana"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Card 4: Agenda da Semana */}
        {isEventsLoading ? (
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 animate-pulse bg-white dark:bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
              <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-7 w-16 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
              <div className="h-3 w-36 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all bg-white dark:bg-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Agenda da Semana</CardTitle>
              <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center">
                {isSyncing ? (
                  <ArrowsClockwise size={16} className="text-indigo-600 dark:text-indigo-400 animate-spin" />
                ) : (
                  <CalendarBlank size={16} className="text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {events.length} {events.length === 1 ? "Evento" : "Eventos"}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {isSyncing ? "Sincronizando com Cal.com..." : "Compromissos agendados no Cal.com"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lists Container - Grid with 2 equal-sized columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Lançamentos Recentes */}
        {isFinancialLoading || !financialData ? (
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse h-[400px] flex flex-col justify-center items-center gap-2">
            <ArrowsClockwise size={24} className="text-zinc-400 animate-spin" />
            <span className="text-xs text-zinc-400 font-medium">Carregando lançamentos da semana...</span>
          </Card>
        ) : (
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 flex flex-col hover:shadow-md transition-all bg-white dark:bg-zinc-950">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 flex flex-row items-center justify-between py-3">
              <div>
                <CardTitle className="text-base font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <Receipt size={20} className="text-amber-600 dark:text-amber-400" />
                  {financialData.usingFallback ? "Lançamentos Recentes" : "Lançamentos da Semana"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {financialData.usingFallback
                    ? "Sem lançamentos na semana atual. Exibindo os últimos 10 registrados."
                    : "Lista de despesas no período atual"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto max-h-[400px] divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
              {financialData.displayTransactions.length > 0 ? (
                financialData.displayTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 transition-all select-text">
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate" title={tx.description}>
                        {tx.description}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{formatDate(tx.date)}</span>
                        {tx.category && (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded text-[11px] font-medium border border-zinc-200/60 dark:border-zinc-700">
                              {tx.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-sm font-bold ${tx.type === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {tx.type === 'CREDIT' ? '+ ' : ''}
                        {formatCurrency(tx.amount)}
                      </span>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium">
                        {tx.type === 'DEBIT' ? 'DÉBITO' : 'CRÉDITO'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center h-full min-h-[250px]">
                  <Receipt size={32} className="opacity-40 mb-2 text-zinc-400" />
                  <p className="text-sm font-medium">Nenhuma transação encontrada.</p>
                  <p className="text-xs opacity-75 mt-0.5">As compras do seu cartão de crédito serão listadas aqui.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Right Column: Agenda & Compromissos */}
        {isEventsLoading ? (
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse h-[400px] flex flex-col justify-center items-center gap-2">
            <ArrowsClockwise size={24} className="text-zinc-400 animate-spin" />
            <span className="text-xs text-zinc-400 font-medium">Carregando compromissos...</span>
          </Card>
        ) : (
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 flex flex-col hover:shadow-md transition-all bg-white dark:bg-zinc-950">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 flex flex-row items-center justify-between py-3">
              <div>
                <CardTitle className="text-base font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <CalendarBlank size={20} className="text-blue-600 dark:text-blue-400" />
                  Agenda & Compromissos ({events.length})
                </CardTitle>
                <CardDescription className="text-xs">Eventos sincronizados do Cal.com</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto max-h-[400px] divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
              {events.length > 0 ? (
                events.map((ev) => (
                  <div key={ev.id} className="p-4 flex flex-col gap-1.5 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 transition-all border-l-4 border-l-blue-500 select-text">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 break-words leading-snug">
                        {ev.title}
                      </span>
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/60 shrink-0">
                        CONFIRMADO
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      <span className="font-medium">
                        {formatDate(new Date(ev.startTime))} • {formatTime(ev.startTime)} - {formatTime(ev.endTime)}
                      </span>
                    </div>
                    {ev.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800 p-2 rounded-md mt-1 font-normal select-text break-words">
                        {ev.description}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center h-full min-h-[250px]">
                  <CalendarBlank size={32} className="opacity-40 mb-2 text-zinc-400" />
                  <p className="text-sm font-medium">Nenhum compromisso para esta semana.</p>
                  <p className="text-xs opacity-75 mt-0.5">As reuniões e horários ocupados serão exibidos aqui.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

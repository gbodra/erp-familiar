"use client"

import React, { useState, useEffect } from "react"
import { CaretLeft, CaretRight, ArrowsClockwise } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { getCalendarEvents, syncCalComEvents } from "@/lib/calendar-actions"

type BookingEvent = {
  id: string
  uid?: string
  title: string
  description?: string
  startTime: string
  endTime: string
  status: string
  attendees?: any[]
}

type ViewMode = "day" | "week" | "month"

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [events, setEvents] = useState<BookingEvent[]>([])
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null)

  useEffect(() => {
    loadAndSyncBookings()
  }, [currentDate])

  const loadAndSyncBookings = async () => {
    setIsSyncing(true)
    setSyncError(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const fromDate = new Date(year, month - 1, 1)
    const toDate = new Date(year, month + 2, 0)

    // 1. Fetch instantly from the DB
    const dbRes = await getCalendarEvents(fromDate.toISOString(), toDate.toISOString())
    if (dbRes.success && dbRes.data) {
      setEvents(dbRes.data)
    }

    // 2. Sync with Cal.com
    const syncRes = await syncCalComEvents(fromDate.toISOString(), toDate.toISOString())
    if (syncRes.success && syncRes.data) {
      setEvents(syncRes.data)
    } else {
      setSyncError(syncRes.error || "Erro ao sincronizar dados do Cal.com")
    }

    setIsSyncing(false)
  }

  // --- DATE HELPERS ---
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonthIndex = (year: number, month: number) => {
    // 0 = Domingo, 1 = Segunda, etc.
    return new Date(year, month, 1).getDay()
  }

  // --- NAVIGATION ACTIONS ---
  const handlePrev = () => {
    if (viewMode === "day") {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }
  }

  const handleNext = () => {
    if (viewMode === "day") {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // --- VIEW RENDERING DATA ---
  const monthName = currentDate.toLocaleString("pt-BR", { month: "long" })
  const yearName = currentDate.getFullYear()

  // Format month name capitalized
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  // Events filtered for today
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    )
  }

  // --- RENDER MONTH VIEW ---
  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const daysInMonth = getDaysInMonth(year, month)
    const firstDayIndex = getFirstDayOfMonthIndex(year, month)

    // Previous month filler days
    const prevMonthDays = getDaysInMonth(year, month - 1)
    const fillerBefore: number[] = []
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      fillerBefore.push(prevMonthDays - i)
    }

    // Days in current month
    const currentMonthDays: number[] = []
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push(i)
    }

    // Next month filler days (grid usually has 42 cells total)
    const totalCells = 42
    const fillerAfter: number[] = []
    const nextDaysNeeded = totalCells - (fillerBefore.length + currentMonthDays.length)
    for (let i = 1; i <= nextDaysNeeded; i++) {
      fillerAfter.push(i)
    }

    const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

    return (
      <div className="flex flex-col flex-1 h-full select-none bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
        {/* Days of the week header */}
        <div className="grid grid-cols-7 text-center py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-xs text-zinc-500 tracking-wider">
          {weekdays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-zinc-200 dark:divide-zinc-800 border-zinc-200 dark:border-zinc-800">
          {fillerBefore.map((day, idx) => (
            <div key={`prev-${idx}`} className="p-2 min-h-[100px] h-[calc((100vh-270px)/6)] bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 text-xs font-medium">
              <span className="opacity-40">{day}</span>
            </div>
          ))}

          {currentMonthDays.map((day) => {
            const currentCellDate = new Date(year, month, day)
            const isToday = isSameDay(currentCellDate, new Date())
            const dayEvents = events.filter((ev) => isSameDay(new Date(ev.startTime), currentCellDate))

            return (
              <div
                key={`day-${day}`}
                className={`p-2 min-h-[100px] h-[calc((100vh-270px)/6)] flex flex-col group transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 relative text-xs ${
                  isToday ? "bg-blue-50/30 dark:bg-blue-950/20" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center font-bold h-6 w-6 rounded-full text-center ${
                      isToday
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                    }`}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full font-medium">
                      {dayEvents.length} {dayEvents.length === 1 ? "comp." : "comps."}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="px-2 py-1 rounded bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 dark:hover:from-blue-800/60 dark:hover:to-indigo-800/60 border-l-2 border-blue-500 text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-sm text-[11px] truncate leading-tight transition-all active:scale-[0.98]"
                    >
                      <div className="font-semibold truncate tracking-tight">{ev.title}</div>
                      <div className="text-[10px] opacity-75 font-normal">
                        {new Date(ev.startTime).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div
                      onClick={() => {
                        setViewMode("day")
                        setCurrentDate(currentCellDate)
                      }}
                      className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer px-1 py-0.5"
                    >
                      + {dayEvents.length - 3} mais eventos
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {fillerAfter.map((day, idx) => (
            <div key={`next-${idx}`} className="p-2 min-h-[100px] h-[calc((100vh-270px)/6)] bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 text-xs font-medium border-t border-zinc-200 dark:border-zinc-800">
              <span className="opacity-40">{day}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // --- RENDER WEEK VIEW ---
  const renderWeekView = () => {
    // Get all 7 days of the current date's week (Sunday to Saturday)
    const dayOfWeek = currentDate.getDay()
    const weekStart = new Date(currentDate)
    weekStart.setDate(currentDate.getDate() - dayOfWeek)

    const weekDays: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      weekDays.push(d)
    }

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const hourHeight = 60 // Height in px for an hour

    return (
      <div className="flex flex-col flex-1 h-[calc(100vh-210px)] select-none bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-8 text-center bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-xs tracking-wider shrink-0 py-3">
          <div className="text-zinc-500 font-medium">Hora</div>
          {weekDays.map((day, idx) => {
            const isToday = isSameDay(day, new Date())
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className="text-zinc-500 font-normal">
                  {day.toLocaleString("pt-BR", { weekday: "short" }).toUpperCase()}
                </span>
                <span
                  className={`inline-flex items-center justify-center font-bold h-7 w-7 rounded-full ${
                    isToday ? "bg-blue-600 text-white shadow-sm" : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
            )
          })}
        </div>

        {/* Hour Matrix / Grid */}
        <div 
          ref={(el) => { if (el) el.scrollTop = 12 * hourHeight - el.clientHeight / 2; }}
          className="flex-1 overflow-y-auto relative custom-scrollbar divide-y divide-zinc-200/50 dark:divide-zinc-800/50"
        >
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 group" style={{ height: `${hourHeight}px` }}>
              {/* Hour identifier column */}
              <div className="text-[11px] text-zinc-400 font-medium border-r border-zinc-100 dark:border-zinc-900 text-right pr-3 py-1 bg-zinc-50/20 dark:bg-zinc-900/10">
                {String(hour).padStart(2, "0")}:00
              </div>

              {/* Day cells columns */}
              {weekDays.map((day, dIdx) => {
                const dayEvents = events.filter((ev) => {
                  const evDate = new Date(ev.startTime)
                  return isSameDay(evDate, day) && evDate.getHours() === hour
                })

                return (
                  <div
                    key={dIdx}
                    onClick={() => {
                      setCurrentDate(day)
                      setViewMode("day")
                    }}
                    className="border-r border-zinc-100/60 dark:border-zinc-900/60 p-1 flex flex-col gap-1 relative h-full hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20 transition-colors"
                  >
                    {dayEvents.map((ev) => {
                      const start = new Date(ev.startTime)
                      const end = new Date(ev.endTime)

                      const minOffset = start.getMinutes()
                      const durationMins = Math.max(
                        30,
                        (end.getTime() - start.getTime()) / 60000
                      )

                      const topPx = (minOffset / 60) * hourHeight
                      const heightPx = Math.min(hourHeight * 3, (durationMins / 60) * hourHeight)

                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedEvent(ev)
                          }}
                          style={{
                            top: `${topPx + 4}px`,
                            height: `${heightPx - 8}px`,
                            minHeight: "22px",
                          }}
                          className="absolute left-1 right-1 px-2 py-1 flex flex-col justify-between rounded bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 dark:hover:from-blue-800/60 dark:hover:to-indigo-800/60 border-l-2 border-blue-500 text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-sm overflow-hidden select-text z-10 hover:z-20 transition-all text-xs"
                        >
                          <div className="font-semibold truncate tracking-tight text-[11px] leading-tight">
                            {ev.title}
                          </div>
                          <div className="text-[10px] opacity-80 mt-0.5">
                            {start.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {end.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // --- RENDER DAY VIEW ---
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const hourHeight = 72 // Taller rows for Day view clarity

    const dayEvents = events.filter((ev) => isSameDay(new Date(ev.startTime), currentDate))

    return (
      <div className="flex flex-col flex-1 h-[calc(100vh-210px)] select-none bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
        {/* Date Header */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg text-zinc-800 dark:text-zinc-200">
              {currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
              {dayEvents.length} {dayEvents.length === 1 ? "compromisso" : "compromissos"}
            </span>
          </div>
        </div>

        {/* Hourly Grid for Day */}
        <div 
          ref={(el) => { if (el) el.scrollTop = 12 * hourHeight - el.clientHeight / 2; }}
          className="flex-1 overflow-y-auto relative custom-scrollbar divide-y divide-zinc-200/40 dark:divide-zinc-800/40"
        >
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-6 h-18 group" style={{ height: `${hourHeight}px` }}>
              {/* Hour Header */}
              <div className="text-xs text-zinc-400 font-medium border-r border-zinc-100 dark:border-zinc-900 text-right pr-4 py-2 bg-zinc-50/30 dark:bg-zinc-900/20 col-span-1">
                {String(hour).padStart(2, "0")}:00
              </div>

              {/* Day Events View Box */}
              <div className="col-span-5 p-2 relative h-full hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20 transition-colors">
                {dayEvents
                  .filter((ev) => new Date(ev.startTime).getHours() === hour)
                  .map((ev) => {
                    const start = new Date(ev.startTime)
                    const end = new Date(ev.endTime)

                    const minOffset = start.getMinutes()
                    const durationMins = Math.max(30, (end.getTime() - start.getTime()) / 60000)

                    const topPx = (minOffset / 60) * hourHeight
                    const heightPx = Math.min(hourHeight * 3, (durationMins / 60) * hourHeight)

                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        style={{
                          top: `${topPx + 4}px`,
                          height: `${heightPx - 8}px`,
                          minHeight: "26px",
                        }}
                        className="absolute left-2 right-2 px-3 py-1 flex flex-col justify-between rounded bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 dark:hover:from-blue-800/60 dark:hover:to-indigo-800/60 border-l-3 border-blue-600 text-zinc-800 dark:text-zinc-100 cursor-pointer shadow-md select-text z-10 transition-all hover:scale-[1.01] text-xs"
                      >
                        <div className="font-bold tracking-tight text-[12px] md:text-sm">
                          {ev.title}
                        </div>
                        {ev.description && (
                          <div className="text-[11px] md:text-xs opacity-75 mt-0.5 truncate hidden md:block">
                            {ev.description}
                          </div>
                        )}
                        <div className="text-[10px] md:text-xs opacity-80 mt-0.5 font-medium">
                          {start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} -{" "}
                          {end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/20 p-6 gap-6">
      {isSyncing && (
        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
          <ArrowsClockwise size={16} className="animate-spin" />
          <span>Sincronizando com Cal.com...</span>
        </div>
      )}

      {syncError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg text-xs font-medium">
          {syncError}
        </div>
      )}

      {/* Main calendar toolbar navigation */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shrink-0">
        {/* Navigation & Jump Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-0.5 shadow-sm">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handlePrev}
              className="hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
            >
              <CaretLeft size={16} weight="bold" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="px-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-semibold text-xs rounded-md transition-colors"
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleNext}
              className="hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
            >
              <CaretRight size={16} weight="bold" />
            </Button>
          </div>

          <span className="text-sm md:text-lg font-bold text-zinc-800 dark:text-zinc-100 px-2 tracking-tight">
            {capitalizedMonthName} {yearName}
          </span>
        </div>

        {/* View Selection Controls */}
        <div className="flex items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-0.5 shadow-sm">
          {(["day", "week", "month"] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode(mode)}
              className={`px-3 capitalize transition-all rounded-md text-xs ${
                viewMode === mode
                  ? "bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-medium"
              }`}
            >
              {mode === "day" ? "Dia" : mode === "week" ? "Semana" : "Mês"}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Calendar Views Panel */}
      <div className="flex-1 overflow-hidden min-h-[500px]">
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "day" && renderDayView()}
      </div>

      {/* Event Details Dialog / Backdrop Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-md w-full shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold text-[10px] border border-blue-100 dark:border-blue-900/60 uppercase tracking-wider">
                  Detalhes do Compromisso
                </span>
                <h3 className="font-bold text-lg mt-1 text-zinc-800 dark:text-zinc-100 break-words leading-tight">
                  {selectedEvent.title}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setSelectedEvent(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-900 pt-3 text-xs text-zinc-600 dark:text-zinc-300">
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/40 p-2.5 rounded-md border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 font-medium">Início:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {new Date(selectedEvent.startTime).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/40 p-2.5 rounded-md border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 font-medium">Fim:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {new Date(selectedEvent.endTime).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {selectedEvent.description && (
                <div className="pt-2">
                  <div className="font-medium text-zinc-500 mb-1">Descrição:</div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-200 rounded border border-zinc-100 dark:border-zinc-800 text-xs font-normal whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {selectedEvent.description}
                  </div>
                </div>
              )}

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div className="pt-2">
                  <div className="font-medium text-zinc-500 mb-1">Participantes:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedEvent.attendees.map((at: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700"
                      >
                        {at.name || at.email}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                className="text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border-zinc-200 dark:border-zinc-800"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

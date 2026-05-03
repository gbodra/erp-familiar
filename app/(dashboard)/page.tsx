import React from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { BriefingClient } from "@/components/briefing-client"

export default async function Dashboard() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Define current week range dynamically
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  // Format week interval nicely
  const startOfWeekStr = startOfWeek.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  })
  const endOfWeekStr = endOfWeek.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  })

  return (
    <BriefingClient
      sessionName={session.user.name || "Usuário"}
      startOfWeekStr={startOfWeekStr}
      endOfWeekStr={endOfWeekStr}
      startOfWeekIso={startOfWeek.toISOString()}
      endOfWeekIso={endOfWeek.toISOString()}
    />
  )
}

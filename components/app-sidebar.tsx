"use client"

import * as React from "react"
import {
  CurrencyDollar,
  Users,
  Gear,
  ChartBar,
  House,
  SignOut,
} from "@phosphor-icons/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { CreditCard, Calendar } from "@phosphor-icons/react"

import Image from "next/image"

export function AppSidebar({ role }: { role?: string }) {
  // Menu items.
  const items = [
    {
      title: "Dashboard",
      url: "/",
      icon: House,
      show: true,
    },
    {
      title: "Calendário",
      url: "/calendar",
      icon: Calendar,
      show: true,
    },
    {
      title: "Cartão de Crédito",
      url: "/credit-card",
      icon: CreditCard,
      show: true,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md overflow-hidden bg-transparent">
            <Image src="/icon.png" alt="Família ERP" width={32} height={32} className="object-contain" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Família ERP</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.filter(i => i.show).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon size={20} weight="duotone" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {role === 'ADMIN' && (
        <SidebarFooter className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/admin" className="flex items-center gap-3">
                  <Gear size={20} weight="duotone" />
                  <span>Admin</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}

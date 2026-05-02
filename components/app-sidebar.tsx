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

import { CreditCard } from "@phosphor-icons/react"

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
      title: "Usuários",
      url: "/users",
      icon: Users,
      show: role === 'ADMIN',
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
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
            <span className="font-bold text-lg">F</span>
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
    </Sidebar>
  )
}

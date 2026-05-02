import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { UserDropdown } from "@/components/user-dropdown"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { auth } from "@/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <SidebarProvider>
      <AppSidebar role={session?.user?.role || 'USER'} />
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 shrink-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Painel de Controle</h1>
          </div>
          <div className="flex items-center gap-4">
            <UserDropdown name={session?.user?.name || 'Usuário'} role={session?.user?.role || 'USER'} />
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}

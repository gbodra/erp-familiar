'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignOut, Key, User } from "@phosphor-icons/react"
import Link from "next/link"
import { signOut } from "next-auth/react"

export function UserDropdown({ 
  name, 
  role 
}: { 
  name: string, 
  role: string 
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-4 outline-none">
        <div className="flex flex-col text-right">
          <span className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">{name}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{role === 'ADMIN' ? 'Admin' : 'Usuário'}</span>
        </div>
        <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-800">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}`} alt="Avatar" />
          <AvatarFallback><User size={20} /></AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {role === 'ADMIN' && (
          <DropdownMenuItem asChild>
            <Link href="/register" className="cursor-pointer flex items-center gap-2">
              <User size={16} />
              <span>Cadastrar Novo Usuário</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/change-password" className="cursor-pointer flex items-center gap-2">
            <Key size={16} />
            <span>Trocar Senha</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="text-red-600 dark:text-red-400 cursor-pointer flex items-center gap-2">
          <SignOut size={16} />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

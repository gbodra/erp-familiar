"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { register, deleteUser, changeName, changeUserPassword } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash, Plus, Users, Shield, Gear, Wrench, IdentificationCard, WarningCircle, CheckCircle, PencilSimple, FloppyDisk, X, Key } from "@phosphor-icons/react"

interface User {
  id: string
  name: string | null
  email: string | null
  username: string | null
  role: string
  createdAt: string
}

interface AdminSettingsClientProps {
  initialUsers: User[]
  currentUserId: string
}

export function AdminSettingsClient({
  initialUsers,
  currentUserId,
}: AdminSettingsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"users" | "system">("users")
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Password reset/change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Inline editing state for logged in user name
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string>("")
  const [isSavingName, setIsSavingName] = useState(false)

  const currentUserObj = users.find(u => u.id === currentUserId)

  // System stats calculation
  const totalUsers = users.length
  const adminUsersCount = users.filter(u => u.role === "ADMIN").length
  const regularUsersCount = totalUsers - adminUsersCount

  // Trigger server action to register user
  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setRegisterError(null)
    setRegisterSuccess(null)
    setIsRegistering(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const res = await register(undefined, formData)

    setIsRegistering(false)

    if (res === "success") {
      setRegisterSuccess("Usuário cadastrado com sucesso!")
      form.reset()
      
      // Close dialog and reset states after a brief success display
      setTimeout(() => {
        setIsDialogOpen(false)
        setRegisterSuccess(null)
        router.refresh()
      }, 1500)
    } else {
      setRegisterError(res || "Erro ao cadastrar usuário.")
    }
  }

  // Handle name update for current logged in user inline
  async function handleSaveInlineName() {
    if (!editingName.trim()) return
    setIsSavingName(true)

    const res = await changeName(editingName)
    setIsSavingName(false)

    if (res === "success") {
      setUsers(users.map(u => u.id === currentUserId ? { ...u, name: editingName } : u))
      setEditingUserId(null)
      router.refresh()
    } else {
      alert(res || "Erro ao alterar o nome.")
    }
  }

  // Handle deleting a user
  async function handleDeleteUser(id: string) {
    const res = await deleteUser(id)
    if (res === "success") {
      setUsers(users.filter((user) => user.id !== id))
      router.refresh()
    } else {
      alert(res)
    }
  }

  // Handle resetting a user's password
  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>, userId: string) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)
    setIsChangingPassword(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const res = await changeUserPassword(userId, formData)

    setIsChangingPassword(false)

    if (res === "success") {
      setPasswordSuccess("Senha alterada com sucesso!")
      form.reset()
      setTimeout(() => {
        setPasswordDialogOpen(null)
        setPasswordSuccess(null)
        router.refresh()
      }, 1500)
    } else {
      setPasswordError(res || "Erro ao alterar a senha.")
    }
  }


  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Gear className="text-zinc-700 dark:text-zinc-300 h-7 w-7" />
            Configurações do Sistema
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gerencie os membros da família, permissões e parâmetros do sistema.
          </p>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-md max-w-sm gap-1">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-medium transition-all ${
            activeTab === "users"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Users size={16} weight="duotone" />
          <span>Gestão de Usuários</span>
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-medium transition-all ${
            activeTab === "system"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Wrench size={16} weight="duotone" />
          <span>Informações</span>
        </button>
      </div>

      {/* Gestão de Usuários Tab Content */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <IdentificationCard size={22} weight="duotone" className="text-zinc-600 dark:text-zinc-400" />
                  Usuários do Sistema
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie os usuários autorizados a acessar o ERP Familiar.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {/* Add User Modal */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus size={16} weight="bold" />
                      <span>Novo Usuário</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                      <DialogDescription>
                        Insira as credenciais do novo membro para liberar o acesso.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRegister} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" name="name" type="text" placeholder="Ex: Gabriel Bodra" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Nome de Usuário</Label>
                        <Input id="username" name="username" type="text" placeholder="Ex: gbodra" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Tipo de Usuário (Cargo)</Label>
                        <select
                          id="role"
                          name="role"
                          required
                          className="flex h-9 w-full rounded-none border border-zinc-200 bg-transparent px-3 py-1 text-xs shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                        >
                          <option value="USER">Regular</option>
                          <option value="ADMIN">Administrador</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                        <Input id="confirmPassword" name="confirmPassword" type="password" required />
                      </div>

                      {registerError && (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400">
                          <WarningCircle size={20} weight="fill" className="flex-shrink-0" />
                          <span className="text-xs">{registerError}</span>
                        </div>
                      )}

                      {registerSuccess && (
                        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/40 p-2 rounded border border-green-200 dark:border-green-800/40 text-green-600 dark:text-green-400">
                          <CheckCircle size={20} weight="fill" className="flex-shrink-0" />
                          <span className="text-xs">{registerSuccess}</span>
                        </div>
                      )}

                      <DialogFooter className="pt-2">
                        <DialogClose asChild>
                          <Button variant="outline" type="button">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isRegistering}>
                          {isRegistering ? "Cadastrando..." : "Cadastrar Usuário"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Nome de Usuário</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="w-[120px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isEditing = editingUserId === user.id

                    return (
                      <TableRow key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                        <TableCell className="font-medium text-zinc-900 dark:text-zinc-50">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 max-w-[200px]">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="h-7 text-xs px-2"
                                required
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{user.name || "Sem Nome"}</span>
                              {user.id === currentUserId && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">Você</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-zinc-500 dark:text-zinc-400">
                          {user.username || "—"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            user.role === "ADMIN" 
                              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50" 
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50"
                          }`}>
                            {user.role === "ADMIN" && <Shield size={12} weight="fill" />}
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-zinc-500 dark:text-zinc-400">
                          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Trocar Senha */}
                            {(user.id === currentUserId || currentUserObj?.role === "ADMIN") && (
                              <Dialog open={passwordDialogOpen === user.id} onOpenChange={(open) => {
                                setPasswordError(null)
                                setPasswordSuccess(null)
                                setPasswordDialogOpen(open ? user.id : null)
                              }}>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                    <Key size={16} weight="duotone" />
                                    <span className="sr-only">Trocar Senha</span>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Alterar Senha</DialogTitle>
                                    <DialogDescription>
                                      Digite a nova senha para o usuário <strong>{user.name || user.username}</strong>.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form onSubmit={(e) => handlePasswordSubmit(e, user.id)} className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                      <Label htmlFor={`password-${user.id}`}>Nova Senha</Label>
                                      <Input id={`password-${user.id}`} name="password" type="password" placeholder="Mínimo 6 caracteres" required />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`confirmPassword-${user.id}`}>Confirmar Nova Senha</Label>
                                      <Input id={`confirmPassword-${user.id}`} name="confirmPassword" type="password" required />
                                    </div>

                                    {passwordError && (
                                      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400">
                                        <WarningCircle size={20} weight="fill" className="flex-shrink-0" />
                                        <span className="text-xs">{passwordError}</span>
                                      </div>
                                    )}

                                    {passwordSuccess && (
                                      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/40 p-2 rounded border border-green-200 dark:border-green-800/40 text-green-600 dark:text-green-400">
                                        <CheckCircle size={20} weight="fill" className="flex-shrink-0" />
                                        <span className="text-xs">{passwordSuccess}</span>
                                      </div>
                                    )}

                                    <DialogFooter className="pt-2">
                                      <DialogClose asChild>
                                        <Button variant="outline" type="button">Cancelar</Button>
                                      </DialogClose>
                                      <Button type="submit" disabled={isChangingPassword}>
                                        {isChangingPassword ? "Alterando..." : "Alterar Senha"}
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            )}

                            {user.id === currentUserId && (
                              isEditing ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={handleSaveInlineName}
                                    disabled={isSavingName}
                                    className="h-8 w-8 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/50"
                                  >
                                    <FloppyDisk size={16} weight="bold" />
                                    <span className="sr-only">Salvar</span>
                                  </Button>
                                  <button
                                    onClick={() => setEditingUserId(null)}
                                    className="h-8 w-8 inline-flex items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                  >
                                    <X size={16} weight="bold" />
                                    <span className="sr-only">Cancelar</span>
                                  </button>
                                </>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => {
                                    setEditingName(user.name || "")
                                    setEditingUserId(user.id)
                                  }}
                                  className="h-8 w-8 text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                  <PencilSimple size={16} weight="duotone" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                              )
                            )}

                            {user.id !== currentUserId && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400">
                                    <Trash size={16} weight="duotone" />
                                    <span className="sr-only">Excluir</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não poderá ser desfeita. O usuário <strong>{user.name || user.username}</strong> perderá permanentemente o acesso ao sistema.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      variant="destructive"
                                      onClick={() => handleDeleteUser(user.id)}
                                    >
                                      Sim, excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Informações Tab Content */}
      {activeTab === "system" && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider text-zinc-500">Membros Ativos</CardDescription>
              <CardTitle className="text-3xl font-extrabold flex items-baseline gap-1 text-zinc-900 dark:text-zinc-50">
                {totalUsers}
                <span className="text-xs font-normal text-zinc-500">total</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-500 flex flex-col gap-1">
              <div>• {adminUsersCount} Administradores</div>
              <div>• {regularUsersCount} Usuários regulares</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider text-zinc-500">Versão do Sistema</CardDescription>
              <CardTitle className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                1.0.0
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-500">
              Família ERP - Dashboard Financeiro & Calendário
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider text-zinc-500">Ambiente</CardDescription>
              <CardTitle className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                Local
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-500">
              Conexão com SQLite ativa
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

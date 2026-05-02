import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Usuários - Família ERP',
};

export default async function UsersPage() {
  const session = await auth();
  
  if (session?.user?.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="flex-1 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Usuários</h2>
      </div>
      <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Membros da Família</CardTitle>
          <CardDescription>
            Gerencie os acessos do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nenhum usuário para exibir além do administrador.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

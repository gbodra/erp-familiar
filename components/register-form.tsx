'use client';

import { useActionState, useEffect } from 'react';
import { register } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { WarningCircle } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function RegisterForm() {
  const router = useRouter();
  const [errorMessage, formAction, isPending] = useActionState(
    register,
    undefined,
  );

  useEffect(() => {
    if (errorMessage === 'success') {
      router.push('/login');
    }
  }, [errorMessage, router]);

  return (
    <Card className="w-full max-w-sm mx-auto shadow-sm border-zinc-200 dark:border-zinc-800">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Cadastro</CardTitle>
        <CardDescription>
          Crie uma nova conta no ERP Familiar
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ex: Gabriel Bodra"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Nome de Usuário</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Ex: gbodra"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
            />
          </div>
          <div
            className="flex h-8 items-end space-x-1"
            aria-live="polite"
            aria-atomic="true"
          >
            {errorMessage && errorMessage !== 'success' && (
              <>
                <WarningCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-500">{errorMessage}</p>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" aria-disabled={isPending} disabled={isPending}>
            {isPending ? 'Criando conta...' : 'Cadastrar'}
          </Button>
          <div className="text-sm text-center text-zinc-500 dark:text-zinc-400">
            Já tem conta? <Link href="/login" className="text-zinc-900 dark:text-zinc-50 underline">Faça login</Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

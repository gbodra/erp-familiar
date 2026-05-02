'use client';

import { useActionState } from 'react';
import { changePassword } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { WarningCircle, CheckCircle } from '@phosphor-icons/react';

export function ChangePasswordForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    changePassword,
    undefined,
  );

  return (
    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
      <CardHeader>
        <CardTitle>Trocar Senha</CardTitle>
        <CardDescription>
          Atualize sua senha de acesso ao sistema.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
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
            {errorMessage === 'success' && (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-500">Senha alterada com sucesso!</p>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button aria-disabled={isPending} disabled={isPending}>
            {isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

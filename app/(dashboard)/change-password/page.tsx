import { ChangePasswordForm } from '@/components/change-password-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trocar Senha - Família ERP',
};

export default function ChangePasswordPage() {
  return (
    <div className="flex-1 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Configurações de Conta</h2>
      </div>
      <div className="max-w-md">
        <ChangePasswordForm />
      </div>
    </div>
  );
}

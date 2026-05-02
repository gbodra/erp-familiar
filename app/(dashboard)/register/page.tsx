import { RegisterForm } from '@/components/register-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cadastro - Família ERP',
};

export default function RegisterPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full">
        <RegisterForm />
      </div>
    </main>
  );
}

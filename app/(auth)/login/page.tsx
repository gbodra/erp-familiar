import { LoginForm } from '@/components/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Família ERP',
};

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full">
        <LoginForm />
      </div>
    </main>
  );
}

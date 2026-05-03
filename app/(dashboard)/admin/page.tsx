import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminSettingsClient } from '@/components/admin-settings-client';

export const metadata: Metadata = {
  title: 'Administração - Família ERP',
};

export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.role !== 'ADMIN') {
    redirect('/');
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Convert Date objects to strings to prevent serialization errors in Next.js
  const serializedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 p-8 pt-6">
      <AdminSettingsClient
        initialUsers={serializedUsers}
        currentUserId={session.user.id}
      />
    </div>
  );
}

'use server';

import { signIn, auth } from '@/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Credenciais inválidas.';
        default:
          return 'Algo deu errado.';
      }
    }
    throw error;
  }
}

export async function register(
  prevState: string | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return 'Apenas administradores podem cadastrar novos usuários.';
  }

  const username = formData.get('username') as string;
  const name = formData.get('name') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const role = (formData.get('role') as string) || 'USER';

  if (password !== confirmPassword) {
    return 'As senhas não coincidem.';
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return 'Nome de usuário já existe.';
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        username,
        name,
        password: hashedPassword,
        role,
      },
    });
    return 'success';
  } catch (error) {
    console.error('Registration error:', error);
    return 'Erro ao criar usuário.';
  }
}

export async function changePassword(
  prevState: string | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return 'Não autorizado.';
  }

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (newPassword !== confirmPassword) {
    return 'As novas senhas não coincidem.';
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.password) {
    return 'Usuário inválido.';
  }

  const passwordsMatch = await bcrypt.compare(currentPassword, user.password);

  if (!passwordsMatch) {
    return 'Senha atual incorreta.';
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });
    return 'success';
  } catch (error) {
    console.error('Change password error:', error);
    return 'Erro ao trocar senha.';
  }
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return 'Apenas administradores podem excluir usuários.';
  }

  // Prevent self-deletion
  if (session.user.id === id) {
    return 'Você não pode excluir a sua própria conta.';
  }

  const userToDelete = await prisma.user.findUnique({
    where: { id },
  });

  if (!userToDelete) {
    return 'Usuário não encontrado.';
  }

  if (userToDelete.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });
    if (adminCount <= 1) {
      return 'Você não pode excluir o único administrador do sistema.';
    }
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
    revalidatePath('/admin');
    return 'success';
  } catch (error) {
    console.error('Delete user error:', error);
    return 'Erro ao excluir usuário.';
  }
}

export async function changeName(name: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return 'Não autorizado.';
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    });
    revalidatePath('/admin');
    return 'success';
  } catch (error) {
    console.error('Change name error:', error);
    return 'Erro ao alterar nome.';
  }
}

export async function changeUserPassword(userId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return 'Não autorizado.';
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const isSelf = session.user.id === userId;
  const isAdmin = currentUser?.role === 'ADMIN';

  if (!isSelf && !isAdmin) {
    return 'Apenas administradores podem alterar a senha de outros usuários.';
  }

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || password.length < 6) {
    return 'A nova senha deve ter pelo menos 6 caracteres.';
  }

  if (password !== confirmPassword) {
    return 'As senhas não coincidem.';
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    return 'success';
  } catch (error) {
    console.error('Change password error:', error);
    return 'Erro ao alterar a senha.';
  }
}





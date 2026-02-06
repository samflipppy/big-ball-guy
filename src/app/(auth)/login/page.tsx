'use client';

import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const router = useRouter();

  async function handleSubmit({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const result = await login(email, password);
    if (!result.error) {
      router.push('/playbook');
    }
  }

  return (
    <>
      <h2 className="mb-6 text-center text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Sign in to your account
      </h2>
      <AuthForm
        mode="login"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    </>
  );
}

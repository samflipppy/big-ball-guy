'use client';

import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function SignupPage() {
  const { signup, loading, error } = useAuth();
  const router = useRouter();

  async function handleSubmit({
    email,
    password,
    teamName,
  }: {
    email: string;
    password: string;
    teamName?: string;
  }) {
    const result = await signup(email, password, teamName ?? '');
    if (!result.error) {
      router.push('/playbook');
    }
  }

  return (
    <>
      <h2 className="mb-6 text-center text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Create your account
      </h2>
      <AuthForm
        mode="signup"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    </>
  );
}

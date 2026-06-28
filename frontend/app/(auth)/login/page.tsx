'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { getSchoolName } from '@/lib/utils';

const loginSchema = zod.object({
  username: zod.string().min(1, 'Username is required'),
  password: zod.string().min(1, 'Password is required'),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await login(values.username, values.password);
      toast.success('Login successful! Redirecting to dashboard...');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid username or password.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl border border-border shadow-lg animate-fade-in">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3 shadow-md"
             style={{ backgroundColor: 'var(--color-primary)' }}>
          S
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-text">
          {getSchoolName()}
        </h2>
        <p className="mt-1.5 text-xs text-text-muted">
          School Administration & Financial System
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="space-y-4">
          <Input
            label="Username"
            id="username"
            placeholder="Enter username (e.g. admin)"
            error={errors.username?.message}
            {...register('username')}
          />

          <Input
            label="Password"
            id="password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          variant="primary"
          isLoading={isSubmitting}
        >
          Sign In
        </Button>
      </form>
    </div>
  );
}

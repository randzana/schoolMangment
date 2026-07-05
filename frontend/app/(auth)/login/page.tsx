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
  username: zod.string().min(1, 'ناوی بەکارهێنەر داواکراوە'),
  password: zod.string().min(1, 'وشەی تێپەڕ داواکراوە'),
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
      toast.success('چوونەژوورەوە سەرکەوتوو بوو! گواستنەوە بۆ داشبۆرد...');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'ناوی بەکارهێنەر یاخود وشەی تێپەڕ هەڵەیە.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl border border-border shadow-lg animate-fade-in" dir="rtl">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-3 overflow-hidden rounded-full shadow-md border border-border bg-white flex items-center justify-center">
          <img src="/logo.jpg" alt="School Logo" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-text">
          {getSchoolName()}
        </h2>
        <p className="mt-1.5 text-xs text-text-muted">
          سیستەمی بەڕێوەبردن و دارایی قوتابخانە
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="space-y-4">
          <Input
            label="ناوی بەکارهێنەر"
            id="username"
            placeholder="ناوی بەکارهێنەر بنووسە (بۆ نموونە: admin)"
            error={errors.username?.message}
            {...register('username')}
          />

          <Input
            label="وشەی تێپەڕ"
            id="password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button
          type="submit"
          className="w-full font-semibold"
          variant="primary"
          isLoading={isSubmitting}
        >
          چوونەژوورەوە
        </Button>
      </form>
    </div>
  );
}

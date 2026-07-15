'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import {
  HiOutlineCog6Tooth,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineTrash,
} from 'react-icons/hi2';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [academicYearInput, setAcademicYearInput] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetType, setResetType] = useState<'reset' | 'year'>('reset');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');

  // Fetch current settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      const data = res.data.data;
      setAcademicYearInput(data.academic_year || '2026-2027');
      return data;
    },
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: { academic_year: string; password?: string; confirm?: string }) => {
      const res = await api.post('/settings', payload);
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries();
      toast.success(res.message || 'ساڵی خوێندن بە سەرکەوتوویی گۆڕدرا');
      setIsResetConfirmOpen(false);
      setAdminPassword('');
      setConfirmText('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'کێشەیەک ڕوویدا لە کاتی نوێکردنەوە');
    },
  });

  // Reset database mutation
  const resetMutation = useMutation({
    mutationFn: async (payload: { password?: string; confirm?: string }) => {
      const res = await api.post('/settings/reset-database', payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'سەرجەم زانیارییەکان بە سەرکەوتوویی سڕانەوە');
      setIsResetConfirmOpen(false);
      setAdminPassword('');
      setConfirmText('');
      // Invalidate queries to refresh dashboard metrics
      queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'سڕینەوەی زانیارییەکان سەرکەوتوو نەبوو');
    },
  });

  const handleUpdateYear = (e: React.FormEvent) => {
    e.preventDefault();
    const regex = /^\d{4}-\d{4}$/;
    if (!regex.test(academicYearInput)) {
      toast.error('تکایە ساڵی خوێندن بە فۆرماتی دروست بنووسە (بۆ نموونە: 2026-2027)');
      return;
    }

    const currentYear = settingsData?.academic_year || '';
    if (academicYearInput.trim() !== currentYear.trim()) {
      // Wiping database confirmation required
      setResetType('year');
      setIsResetConfirmOpen(true);
    } else {
      updateMutation.mutate({ academic_year: academicYearInput });
    }
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== 'RESET') {
      toast.error("تکایە بنووسە 'RESET' بە پیتە گەورەکان");
      return;
    }

    if (resetType === 'year') {
      updateMutation.mutate({
        academic_year: academicYearInput,
        password: adminPassword,
        confirm: confirmText,
      });
    } else {
      resetMutation.mutate({
        password: adminPassword,
        confirm: confirmText,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <HiOutlineCog6Tooth className="w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text">ڕێکخستنەکانی سیستەم</h1>
        </div>
        <p className="text-xs text-text-muted">ڕێکخستنی ساڵی خوێندنی چالاک و بەڕێوەبردنی بنکەی زانیارییەکان</p>
      </div>

      <div className="grid gap-6">
        {/* Academic Year Setting Card */}
        <div className="bg-white border border-border rounded-2xl shadow-card p-6">
          <h3 className="text-base font-bold text-text mb-2 flex items-center gap-2">
            <HiOutlineArrowPath className="w-5 h-5 text-primary" />
            <span>ساڵی خوێندنی چالاک</span>
          </h3>
          <p className="text-xs text-text-muted mb-4 leading-relaxed">
            لێرەوە دەتوانیت ساڵی خوێندنی سیستەمەکە بگۆڕیت. گۆڕینی ساڵ دەبێتە هۆی گۆڕینی ئەو ساڵە فەرمییەی بۆ تۆمارە نوێیەکان بەکاردێت.
          </p>

          <form onSubmit={handleUpdateYear} className="space-y-4 max-w-md">
            <Input
              label="ساڵی خوێندنی چالاک *"
              type="text"
              required
              placeholder="بۆ نموونە: 2026-2027"
              value={academicYearInput}
              onChange={(e) => setAcademicYearInput(e.target.value)}
              disabled={isLoading}
              className="w-full text-center font-mono text-base"
            />
            <Button
              type="submit"
              variant="primary"
              isLoading={updateMutation.isPending}
              disabled={isLoading}
              className="font-semibold"
            >
              پاشەکەوتکردنی ساڵی نوێ
            </Button>
          </form>
        </div>

        {/* Database Reset Option Card (Admin Only) */}
        <div className="bg-white border border-border rounded-2xl shadow-card p-6">
          <h3 className="text-base font-bold text-danger mb-2 flex items-center gap-2">
            <HiOutlineTrash className="w-5 h-5" />
            <span>سەرلەنوێ دەستپێکردنەوە و سڕینەوەی سەرجەم زانیارییەکان</span>
          </h3>
          <p className="text-xs text-text-muted mb-4 leading-relaxed">
            لەم بەشەوە دەتوانیت سەرجەم زانیارییەکان بسڕیتەوە بۆ ئەوەی بۆ ساڵێکی نوێ دەست پێ بکەیتەوە.
          </p>

          {/* Alert Callout */}
          <div className="p-4 rounded-xl bg-danger/5 border border-danger/20 flex gap-3 text-danger mb-6">
            <HiOutlineExclamationTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed font-semibold">
              <p className="font-bold mb-1">ئاگاداری گرنگ و مەترسیدار:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>ئەم کردارە سەرجەم قوتابییەکان، پارەدانەکان، قستەکان، و خەرجییەکان لە سیستەمدا بە تەواوی دەسڕێتەوە.</li>
                <li>ڕێژەی کۆگا بۆ سایزەکانی جلوبەرگ و کتێبە سەرەکییەکان دەگەڕێنێتەوە بۆ باردۆخی سەرەتایی (١٠٠ و ١٥٠ دانە).</li>
                <li>سەرجەم ژمارەی پسوولەکان سفر دەکرێنەوە بۆ دەستپێکردنەوە لە ژمارە ١.</li>
                <li>بەکارهێنەرانی سیستەمەکە نا سڕدرێنەوە بۆ ئەوەی چوونەژوورەوەت چالاک بمێنێتەوە.</li>
              </ul>
            </div>
          </div>

          <Button
            type="button"
            variant="danger"
            onClick={() => {
              setResetType('reset');
              setIsResetConfirmOpen(true);
            }}
            className="font-semibold"
          >
            سڕینەوەی گشتی سەرجەم زانیارییەکان
          </Button>
        </div>
      </div>

      {/* Confirm Database Reset Dialog */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => {
          setIsResetConfirmOpen(false);
          setAdminPassword('');
          setConfirmText('');
        }}
        title={resetType === 'year' ? "سەرلەنوێ ڕێکخستنەوە بۆ ساڵی خوێندنی نوێ" : "دڵنیابوونەوە لە سڕینەوەی سەرجەم زانیارییەکان"}
        size="md"
      >
        <form onSubmit={handleConfirmAction} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-text-muted leading-relaxed">
              {resetType === 'year'
                ? "سەرنج بدە: گۆڕینی ساڵی خوێندنی چالاک دەبێتە هۆی سڕینەوەی گشتی سەرجەم قوتابییەکان و تۆمارەکانی پێشوو بە یەکجاری. بۆ ئەنجامدانی ئەم کردارە، پێویستە تێپەڕەوشە بنووسیت و کردارەکە پشتڕاست بکەیتەوە."
                : "ئەم کردارە سەرجەم قوتابییەکان، پارەدانەکان، قستەکان، و خەرجییەکان لە سیستەمدا بە تەواوی دەسڕێتەوە و ناگەڕێتەوە دواوە. تکایە بۆ بەردەوامبوون ناسنامەت بسەلمێنە."}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Input
              label="تێپەڕەوشەی بەڕێوەبەر (Password) *"
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="تێپەڕەوشەکەت لێرە بنووسە"
              className="w-full"
            />

            <Input
              label="بۆ پشتڕاستکردنەوە بنووسە 'RESET' *"
              type="text"
              required
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              className="w-full text-center font-bold tracking-widest uppercase font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border font-semibold">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsResetConfirmOpen(false);
                setAdminPassword('');
                setConfirmText('');
              }}
              disabled={resetMutation.isPending || updateMutation.isPending}
            >
              پاشگەزبوونەوە
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={resetMutation.isPending || updateMutation.isPending}
            >
              بەڵێ، بە تەواوی سڕینەوە ئەنجام بدە
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

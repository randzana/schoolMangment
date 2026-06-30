'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { DashboardData } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  HiOutlineUserGroup,
  HiOutlineCreditCard,
  HiOutlineBuildingStorefront,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TableSkeleton } from '@/components/tables/TableSkeleton';

export default function DashboardPage() {
  const { data: dashboard, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 bg-white border rounded-xl animate-shimmer" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 bg-white border rounded-xl animate-shimmer" />
          <div className="h-96 bg-white border rounded-xl animate-shimmer" />
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-6 text-center text-danger font-medium border border-danger/20 rounded-xl bg-danger/5">
        Failed to load dashboard overview data.
      </div>
    );
  }

  const statCards = [
    {
      label: 'قوتابیانی چالاک',
      value: dashboard.total_students,
      icon: <HiOutlineUserGroup className="w-6 h-6 text-primary" />,
      color: 'bg-primary/10',
    },
    {
      label: 'داهاتی خوێندن (ساڵانە)',
      value: formatCurrency(dashboard.study_revenue),
      icon: <HiOutlineCreditCard className="w-6 h-6 text-success" />,
      color: 'bg-success/10',
    },
    {
      label: 'داهاتی نانخواردن (ساڵانە)',
      value: formatCurrency(dashboard.food_revenue),
      icon: <HiOutlineBuildingStorefront className="w-6 h-6 text-accent" />,
      color: 'bg-accent/10',
    },
    {
      label: 'داهاتی جل و کتێب (ساڵانە)',
      value: formatCurrency(dashboard.clothes_revenue),
      icon: <HiOutlineCurrencyDollar className="w-6 h-6 text-warning" />,
      color: 'bg-warning/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">سەرەکی</h1>
        <p className="text-xs text-text-muted">کورتەی گشتی کاروبار و دارایی قوتابخانە</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white border border-border p-6 rounded-xl shadow-card flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-text-muted font-medium">{card.label}</span>
              <p className="text-lg font-bold text-text">{card.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${card.color}`}>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Balances & Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Outstanding Balances list */}
        <div className="bg-white border border-border rounded-xl shadow-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-warning">
            <HiOutlineExclamationTriangle className="w-5 h-5" />
            <h3 className="font-semibold text-sm text-text">قەرزە ماوەکان</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] pr-1">
            {dashboard.outstanding_balances.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-10">هیچ قوتابییەک قەرزار نییە.</p>
            ) : (
              dashboard.outstanding_balances.map((balance, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg border border-border bg-surface-muted">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text truncate">{balance.student_name}</p>
                    <span className="text-[10px] text-text-muted font-medium">{balance.grade}</span>
                  </div>
                  <span className="text-xs font-bold text-danger font-mono">{formatCurrency(balance.balance)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white border border-border rounded-xl shadow-card p-6">
          <h3 className="font-semibold text-sm text-text mb-4">کۆتا مامەڵەکان</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase text-text-muted tracking-wider bg-surface-muted">
                  <th className="px-6 py-3">ژمارەی پسوولە</th>
                  <th className="px-6 py-3">ناوی قوتابی</th>
                  <th className="px-6 py-3">جۆر</th>
                  <th className="px-6 py-3">بڕی دراو</th>
                  <th className="px-6 py-3">بەروار</th>
                  <th className="px-6 py-3">بارودۆخ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border text-sm text-text">
                {dashboard.recent_transactions.map((tx, idx) => (
                  <tr key={idx} className={`hover:bg-surface-muted/50 ${tx.is_returned ? 'line-through opacity-60 text-danger bg-red-50/20' : ''}`}>
                    <td className="px-6 py-3 font-mono font-semibold">#{tx.invoice_no}</td>
                    <td className="px-6 py-3 font-medium">{tx.student?.full_name}</td>
                    <td className="px-6 py-3 uppercase text-xs font-bold text-text-muted">
                      {tx.type === 'study' ? 'خوێندن' : 'نانخواردن'}
                    </td>
                    <td className="px-6 py-3 font-mono font-semibold text-primary">{formatCurrency(tx.amount_paid)}</td>
                    <td className="px-6 py-3">{formatDate(tx.payment_date)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${tx.is_returned ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                        {tx.is_returned ? 'گەڕاوەتەوە' : 'دراوە'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

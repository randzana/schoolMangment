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
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineAcademicCap,
} from 'react-icons/hi2';
import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const MONTH_MAP: Record<string, string> = {
  Jan: 'کانوونی٢',
  Feb: 'شوبات',
  Mar: 'ئادار',
  Apr: 'نیسان',
  May: 'ئایار',
  Jun: 'حوزەیران',
  Jul: 'تەممووز',
  Aug: 'ئاب',
  Sep: 'ئەیلوول',
  Oct: 'تشرینی١',
  Nov: 'تشرینی٢',
  Dec: 'کانوونی١',
};

const MONTH_MAP_FULL: Record<string, string> = {
  Jan: 'کانوونی دووەم',
  Feb: 'شوبات',
  Mar: 'ئادار',
  Apr: 'نیسان',
  May: 'ئایار',
  Jun: 'حوزەیران',
  Jul: 'تەممووز',
  Aug: 'ئاب',
  Sep: 'ئەیلوول',
  Oct: 'تشرینی یەکەم',
  Nov: 'تشرینی دووەم',
  Dec: 'کانوونی یەکەم',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number | string;
    name: string;
    dataKey: string | number;
    color?: string;
    stroke?: string;
    payload: {
      month: string;
      revenue: number;
      expenses: number;
    };
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-border/80 p-3 md:p-4 rounded-xl shadow-lg text-[10px] md:text-xs space-y-2 md:space-y-2.5 min-w-[160px] md:min-w-[200px] text-right font-sans">
        <p className="font-bold text-text border-b border-border/50 pb-1.5 mb-1 text-center font-mono text-xs">
          {label}
        </p>
        {payload.map((item, idx: number) => {
          const isProfit = item.dataKey === 'profit';
          const isExpense = item.dataKey === 'expenses';
          const colorClass = isProfit 
            ? (Number(item.value) >= 0 ? 'text-success font-bold font-mono' : 'text-danger font-bold font-mono')
            : (isExpense ? 'text-danger font-mono' : 'text-primary font-mono');
          
          let labelText = '';
          if (isProfit) {
            labelText = Number(item.value) >= 0 ? 'قازانج' : 'زیان';
          } else if (isExpense) {
            labelText = 'خەرجی';
          } else {
            labelText = 'داهات';
          }

          const num = typeof item.value === 'string' ? parseFloat(item.value) : item.value;
          const formattedVal = isNaN(num) ? '٠ د' : `${Math.round(num).toLocaleString('en-US')} د`;

          return (
            <div key={idx} className="flex justify-between items-center gap-3 flex-row-reverse">
              <span className="text-text-muted flex items-center gap-1 flex-row-reverse">
                <span className="w-2 rounded-full h-2 flex-shrink-0" style={{ backgroundColor: item.color || item.stroke }} />
                <span>{labelText}:</span>
              </span>
              <span className={`font-mono font-semibold ${colorClass}`}>
                {formattedVal}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { data: dashboard, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data.data;
    },
  });

  const chartData = React.useMemo(() => {
    if (!dashboard?.monthly_chart) return [];
    return dashboard.monthly_chart.map((item) => ({
      ...item,
      kurdishMonth: MONTH_MAP[item.month] || item.month,
      kurdishMonthFull: MONTH_MAP_FULL[item.month] || item.month,
      profit: (item.revenue || 0) - (item.expenses || 0),
    }));
  }, [dashboard]);

  const yearlyTotals = React.useMemo(() => {
    if (!dashboard?.monthly_chart) return { revenue: 0, expenses: 0, profit: 0 };
    let totalRevenue = 0;
    let totalExpenses = 0;
    dashboard.monthly_chart.forEach((item) => {
      totalRevenue += item.revenue || 0;
      totalExpenses += item.expenses || 0;
    });
    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: totalRevenue - totalExpenses,
    };
  }, [dashboard]);

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        {/* Mobile: 2-col grid for stat cards */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-20 md:h-24 bg-white border rounded-2xl animate-shimmer" />
          ))}
        </div>
        <div className="h-72 md:h-96 bg-white border rounded-2xl animate-shimmer" />
        <div className="space-y-4 md:space-y-0 md:grid md:gap-6 lg:grid-cols-3">
          <div className="h-64 md:h-96 bg-white border rounded-2xl animate-shimmer" />
          <div className="lg:col-span-2 h-64 md:h-96 bg-white border rounded-2xl animate-shimmer" />
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-4 md:p-6 text-center text-danger font-medium border border-danger/20 rounded-2xl bg-danger/5">
        Failed to load dashboard overview data.
      </div>
    );
  }

  const statCards = [
    {
      label: 'قوتابیانی چالاک',
      value: dashboard.total_students,
      icon: <HiOutlineUserGroup className="w-5 h-5 md:w-6 md:h-6 text-primary" />,
      color: 'bg-primary/10',
      accent: 'border-primary/20',
    },
    {
      label: 'کۆی کرێی ساڵانە',
      value: formatCurrency(dashboard.total_study_tuition || 0),
      icon: <HiOutlineAcademicCap className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />,
      color: 'bg-indigo-50',
      accent: 'border-indigo-100',
    },
    {
      label: 'داهاتی خوێندن',
      value: formatCurrency(dashboard.study_revenue),
      icon: <HiOutlineCreditCard className="w-5 h-5 md:w-6 md:h-6 text-success" />,
      color: 'bg-success/10',
      accent: 'border-success/20',
    },
    {
      label: 'داهاتی نانخواردن',
      value: formatCurrency(dashboard.food_revenue),
      icon: <HiOutlineBuildingStorefront className="w-5 h-5 md:w-6 md:h-6 text-accent" />,
      color: 'bg-accent/10',
      accent: 'border-accent/20',
    },
    {
      label: 'داهاتی جل و کتێب',
      value: formatCurrency(dashboard.clothes_revenue),
      icon: <HiOutlineCurrencyDollar className="w-5 h-5 md:w-6 md:h-6 text-warning" />,
      color: 'bg-warning/10',
      accent: 'border-warning/20',
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text">سەرەکی</h1>
        <p className="text-[10px] md:text-xs text-text-muted">کورتەی گشتی کاروبار و دارایی قوتابخانە</p>
      </div>

      {/* Summary Cards — 2-col on mobile, 5-col on desktop */}
      <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-5">
        {statCards.map((card, idx) => (
          <div key={idx} className={`bg-white border ${card.accent} p-3 md:p-6 rounded-2xl shadow-card flex flex-col gap-2 md:flex-row md:items-center md:justify-between transition-all duration-200 hover:shadow-md active:scale-[0.98]`}>
            <div className="flex items-center justify-between md:hidden">
              <div className={`p-2 rounded-xl ${card.color}`}>{card.icon}</div>
            </div>
            <div className="space-y-0.5 md:space-y-1 min-w-0">
              <span className="text-[10px] md:text-xs text-text-muted font-medium leading-tight block">{card.label}</span>
              <p className="text-sm md:text-lg font-bold text-text truncate">{card.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${card.color} hidden md:block`}>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Financial Chart Section */}
      <div className="bg-white border border-border rounded-2xl shadow-card p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header + Mini KPIs */}
        <div className="flex flex-col gap-3 md:gap-4 border-b border-border pb-4 md:pb-5">
          <div>
            <h2 className="text-sm md:text-base font-bold text-text">شیکاری دارایی ساڵانە</h2>
            <p className="text-[10px] md:text-[11px] text-text-muted mt-0.5">بەراوردکردنی داهات، خەرجی و قازانجی مانگانە</p>
          </div>
          
          {/* Mini-KPI cards — stack on small mobile, 3-col on md+ */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <div className="bg-success/5 border border-success/10 p-2 md:p-3 rounded-xl flex flex-col justify-center transition-all duration-200 active:scale-[0.97]">
              <div className="flex items-center gap-1 mb-0.5">
                <HiOutlineArrowTrendingUp className="w-3 h-3 text-success hidden md:block" />
                <span className="text-[9px] md:text-[10px] text-success font-semibold leading-tight">کۆی داهات</span>
              </div>
              <span className="text-[10px] md:text-xs font-bold text-success font-mono">{formatCurrency(yearlyTotals.revenue)}</span>
            </div>
            <div className="bg-danger/5 border border-danger/10 p-2 md:p-3 rounded-xl flex flex-col justify-center transition-all duration-200 active:scale-[0.97]">
              <div className="flex items-center gap-1 mb-0.5">
                <HiOutlineArrowTrendingDown className="w-3 h-3 text-danger hidden md:block" />
                <span className="text-[9px] md:text-[10px] text-danger font-semibold leading-tight">کۆی خەرجی</span>
              </div>
              <span className="text-[10px] md:text-xs font-bold text-danger font-mono">{formatCurrency(yearlyTotals.expenses)}</span>
            </div>
            <div className={`border p-2 md:p-3 rounded-xl flex flex-col justify-center transition-all duration-200 active:scale-[0.97] ${
              yearlyTotals.profit >= 0 
                ? 'bg-primary/5 border-primary/10 text-primary' 
                : 'bg-danger/5 border-danger/10 text-danger'
            }`}>
              <span className={`text-[9px] md:text-[10px] font-semibold leading-tight ${yearlyTotals.profit >= 0 ? 'text-primary' : 'text-danger'}`}>
                {yearlyTotals.profit >= 0 ? 'قازانجی ساڵ' : 'زیانی ساڵ'}
              </span>
              <span className="text-[10px] md:text-xs font-bold font-mono mt-0.5">{formatCurrency(yearlyTotals.profit)}</span>
            </div>
          </div>
        </div>

        {/* Chart Container — shorter on mobile */}
        <div className="h-[240px] md:h-[360px] w-full -mx-2 md:mx-0" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 5, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A7E52" stopOpacity={0.85}/>
                  <stop offset="95%" stopColor="#1A7E52" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C0392B" stopOpacity={0.85}/>
                  <stop offset="95%" stopColor="#C0392B" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} vertical={false} />
              <XAxis 
                dataKey="kurdishMonth" 
                stroke="#718096" 
                fontSize={8}
                tickLine={false}
                axisLine={false}
                dy={5}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={45}
              />
              <YAxis 
                stroke="#718096" 
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
                  return val;
                }}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} />
              <Legend 
                verticalAlign="bottom" 
                height={30} 
                iconType="circle"
                iconSize={6}
                formatter={(value) => {
                  if (value === 'revenue') return <span className="text-[9px] md:text-[11px] text-text font-bold mr-1 ml-2 md:mr-1.5 md:ml-4">داهات</span>;
                  if (value === 'expenses') return <span className="text-[9px] md:text-[11px] text-text font-bold mr-1 ml-2 md:mr-1.5 md:ml-4">خەرجی</span>;
                  if (value === 'profit') return <span className="text-[9px] md:text-[11px] text-text font-bold mr-1 ml-2 md:mr-1.5 md:ml-4">قازانج</span>;
                  return value;
                }}
              />
              <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Bar dataKey="expenses" fill="url(#colorExpenses)" radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Area type="monotone" dataKey="profit" stroke="#4F46E5" strokeWidth={2} fill="url(#colorProfit)" dot={{ r: 2, strokeWidth: 1, stroke: '#4F46E5', fill: '#FFFFFF' }} activeDot={{ r: 4, strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Balances & Recent Transactions — stack on mobile */}
      <div className="space-y-4 md:space-y-0 md:grid md:gap-6 lg:grid-cols-3">
        {/* Outstanding Balances list */}
        <div className="bg-white border border-border rounded-2xl shadow-card p-4 md:p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-3 md:mb-4 text-warning">
            <HiOutlineExclamationTriangle className="w-5 h-5" />
            <h3 className="font-semibold text-sm text-text">قەرزە ماوەکان</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 md:space-y-3 max-h-[350px] md:max-h-[450px] pl-3 pr-1">
            {dashboard.outstanding_balances.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-10">هیچ قوتابییەک قەرزار نییە.</p>
            ) : (
              dashboard.outstanding_balances.map((balance, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 md:p-3 rounded-xl border border-border bg-surface-muted transition-all duration-150 hover:bg-border/30 active:scale-[0.98]">
                  <div className="min-w-0">
                    <p className="text-[11px] md:text-xs font-semibold text-text truncate">{balance.student_name}</p>
                    <span className="text-[9px] md:text-[10px] text-text-muted font-medium">{balance.grade}</span>
                  </div>
                  <span className="text-[11px] md:text-xs font-bold text-danger font-mono whitespace-nowrap">{formatCurrency(balance.balance)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions — Card-based on mobile, Table on desktop */}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl shadow-card p-4 md:p-6">
          <h3 className="font-semibold text-sm text-text mb-3 md:mb-4">کۆتا مامەڵەکان</h3>
          
          {/* Mobile: Card layout */}
          <div className="space-y-2 md:hidden">
            {dashboard.recent_transactions.map((tx, idx) => (
              <div key={idx} className={`p-3 rounded-xl border border-border bg-surface-muted transition-all duration-150 active:scale-[0.98] ${tx.is_returned ? 'opacity-60 bg-red-50/30 border-danger/20' : ''}`}>
                <div className="flex justify-between items-start mb-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${tx.is_returned ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                    {tx.is_returned ? 'گەڕاوەتەوە' : 'دراوە'}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">#{tx.invoice_no}</span>
                </div>
                <p className={`text-xs font-semibold text-text mb-1 ${tx.is_returned ? 'line-through' : ''}`}>{tx.student?.full_name}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-text-muted">
                    {tx.type === 'study' ? 'خوێندن' : 'نانخواردن'}
                  </span>
                  <span className={`text-xs font-bold font-mono ${tx.is_returned ? 'text-danger line-through' : 'text-primary'}`}>
                    {formatCurrency(tx.amount_paid)}
                  </span>
                </div>
                <p className="text-[9px] text-text-muted mt-1">{formatDate(tx.payment_date)}</p>
              </div>
            ))}
          </div>

          {/* Desktop: Table layout */}
          <div className="overflow-x-auto hidden md:block">
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

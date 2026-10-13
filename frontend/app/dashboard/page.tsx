'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { DashboardData } from '@/types';
import { formatDate, formatNumber } from '@/lib/utils';
import {
  HiOutlineUserGroup,
  HiOutlineCreditCard,
  HiOutlineBuildingStorefront,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationTriangle,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineTableCells,
} from 'react-icons/hi2';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';

const MONTH_SHORT: Record<string, string> = {
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

const MONTH_FULL: Record<string, string> = {
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

/**
 * Chart series colours. Validated as a colour-blind-safe set (blue / orange /
 * aqua); the lighter aqua line is backed by the legend, totals and table view.
 */
const SERIES = {
  revenue: { color: '#2a78d6', label: 'داهات' },
  expenses: { color: '#eb6834', label: 'خەرجی' },
  profit: { color: '#1baf7a', label: 'قازانج / زیان' },
} as const;

const AXIS_TEXT = '#718096';
const CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 };
const Y_AXIS_WIDTH = 52;
const GRID_LINE = '#EDF2F7';
const BASELINE = '#CBD5E0';

interface ChartRow {
  month: string;
  shortMonth: string;
  fullMonth: string;
  revenue: number;
  expenses: number;
  /** Null for months that have not happened yet, so the line stops at today. */
  profit: number | null;
}

/**
 * Compact axis ticks that keep their sign: -3M, 500K, 0.
 */
function formatAxisValue(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, '');
  if (abs >= 1_000_000_000) return `${sign}${trim(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}${trim(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}${trim(abs / 1_000)}K`;
  return `${sign}${abs}`;
}

/**
 * A whole amount that never gets cut off: the digits stay on one line (and keep
 * their minus sign in RTL text); only the "دینار" unit may wrap below them,
 * unless `nowrap` keeps it beside the number (table columns).
 */
function Amount({ value, unit = 'دینار', nowrap = false }: { value: number; unit?: string | null; nowrap?: boolean }) {
  return (
    <span className={`inline-flex items-baseline gap-x-1 ${nowrap ? 'whitespace-nowrap' : 'flex-wrap'}`}>
      <span dir="ltr" className="whitespace-nowrap">{formatNumber(value)}</span>
      {unit && <span className="text-[0.7em] font-medium text-text-muted whitespace-nowrap">{unit}</span>}
    </span>
  );
}

function StatCard({
  label,
  icon,
  iconBg,
  className = '',
  children,
}: {
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`@container min-w-0 bg-white border border-border rounded-2xl shadow-card p-4 md:p-5 flex flex-col justify-between gap-3 transition-shadow duration-200 hover:shadow-md ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`p-2 rounded-xl flex-shrink-0 ${iconBg}`}>{icon}</div>
        <span className="text-xs text-text-muted font-medium leading-snug">{label}</span>
      </div>
      {/* Font follows the card's own width, so the full number always fits */}
      <div className="font-bold text-text leading-tight text-[length:clamp(1.05rem,10cqi,1.75rem)]">
        {children}
      </div>
    </div>
  );
}

function SeriesKey({ type, color }: { type: 'bar' | 'line'; color: string }) {
  return type === 'bar' ? (
    <span className="inline-block w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ backgroundColor: color }} />
  ) : (
    <span className="inline-block w-3.5 h-[3px] rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
  );
}

interface MonthTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
  selected: string | undefined;
}

function MonthTick({ x = 0, y = 0, payload, selected }: MonthTickProps) {
  const isSelected = payload?.value === selected;
  return (
    <text
      x={x}
      y={y}
      dy={12}
      textAnchor="middle"
      fontSize={11}
      fontWeight={isSelected ? 700 : 400}
      fill={isSelected ? '#1A202C' : AXIS_TEXT}
    >
      {payload?.value}
    </text>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const lines: { key: string; label: string; value: number; type: 'bar' | 'line'; color: string }[] = [
    { key: 'revenue', label: SERIES.revenue.label, value: row.revenue, type: 'bar', color: SERIES.revenue.color },
    { key: 'expenses', label: SERIES.expenses.label, value: row.expenses, type: 'bar', color: SERIES.expenses.color },
  ];
  if (row.profit !== null) {
    lines.push({
      key: 'profit',
      label: row.profit < 0 ? 'زیان' : 'قازانج',
      value: row.profit,
      type: 'line',
      color: SERIES.profit.color,
    });
  }

  return (
    <div dir="rtl" className="bg-white border border-border rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-[190px] font-sans">
      <p className="font-bold text-text mb-1.5 pb-1.5 border-b border-border">{row.fullMonth}</p>
      {lines.map((line) => (
        <div key={line.key} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-text-muted">
            <SeriesKey type={line.type} color={line.color} />
            {line.label}
          </span>
          <span className="font-bold text-text tabular-nums">
            <Amount value={line.value} nowrap />
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  // The chart is monthly, so the totals above it follow one chosen month (this month by default)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());

  const { data: dashboard, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data.data;
    },
  });

  // The server reports the current calendar year month by month
  const chartYear = new Date().getFullYear();

  const chartData = useMemo<ChartRow[]>(() => {
    if (!dashboard?.monthly_chart) return [];
    const currentMonth = new Date().getMonth();
    return dashboard.monthly_chart.map((item, index) => {
      const revenue = Number(item.revenue) || 0;
      const expenses = Number(item.expenses) || 0;
      return {
        month: item.month,
        shortMonth: MONTH_SHORT[item.month] || item.month,
        fullMonth: MONTH_FULL[item.month] || item.month,
        revenue,
        expenses,
        profit: index <= currentMonth ? revenue - expenses : null,
      };
    });
  }, [dashboard]);

  const yearlyTotals = useMemo(() => {
    const revenue = chartData.reduce((sum, row) => sum + row.revenue, 0);
    const expenses = chartData.reduce((sum, row) => sum + row.expenses, 0);
    return { revenue, expenses, profit: revenue - expenses };
  }, [chartData]);

  const selectedRow = chartData[selectedMonth] ?? chartData[chartData.length - 1];
  const monthTotals = {
    revenue: selectedRow?.revenue ?? 0,
    expenses: selectedRow?.expenses ?? 0,
    profit: (selectedRow?.revenue ?? 0) - (selectedRow?.expenses ?? 0),
  };
  const selectMonth = (index: number) => {
    if (Number.isInteger(index) && index >= 0 && index < chartData.length) setSelectedMonth(index);
  };

  // Work the month out from where the chart was clicked or tapped. The chart's own
  // active index lags behind on a tap (there is no hover first) and picks the wrong month.
  const selectMonthAt = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const plotLeft = CHART_MARGIN.left + Y_AXIS_WIDTH;
    const plotWidth = rect.width - plotLeft - CHART_MARGIN.right;
    const x = event.clientX - rect.left - plotLeft;
    if (plotWidth <= 0 || x < 0 || x > plotWidth || chartData.length === 0) return;
    selectMonth(Math.min(chartData.length - 1, Math.floor(x / (plotWidth / chartData.length))));
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="h-12 w-48 bg-white border rounded-xl animate-shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-6 2xl:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className={`h-28 bg-white border rounded-2xl animate-shimmer ${STAT_SPANS[idx]}`} />
          ))}
        </div>
        <div className="h-[420px] md:h-[520px] bg-white border rounded-2xl animate-shimmer" />
        <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
          <div className="h-64 md:h-96 bg-white border rounded-2xl animate-shimmer" />
          <div className="xl:col-span-2 h-64 md:h-96 bg-white border rounded-2xl animate-shimmer" />
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

  const statCards: { label: string; icon: React.ReactNode; iconBg: string; value: React.ReactNode }[] = [
    {
      label: 'قوتابیانی چالاک',
      icon: <HiOutlineUserGroup className="w-5 h-5 text-primary" />,
      iconBg: 'bg-primary/10',
      value: <Amount value={dashboard.total_students} unit="قوتابی" />,
    },
    {
      label: 'کۆی کرێی ساڵانە',
      icon: <HiOutlineAcademicCap className="w-5 h-5 text-indigo-600" />,
      iconBg: 'bg-indigo-50',
      value: <Amount value={dashboard.total_study_tuition || 0} />,
    },
    {
      label: 'داهاتی خوێندن',
      icon: <HiOutlineCreditCard className="w-5 h-5 text-success" />,
      iconBg: 'bg-success/10',
      value: <Amount value={dashboard.study_revenue || 0} />,
    },
    {
      label: 'داهاتی نانخواردن',
      icon: <HiOutlineBuildingStorefront className="w-5 h-5 text-accent" />,
      iconBg: 'bg-accent/10',
      value: <Amount value={dashboard.food_revenue || 0} />,
    },
    {
      label: 'داهاتی جل و کتێب',
      icon: <HiOutlineCurrencyDollar className="w-5 h-5 text-warning" />,
      iconBg: 'bg-warning/10',
      value: <Amount value={dashboard.clothes_revenue || 0} />,
    },
  ];

  const isYearLoss = yearlyTotals.profit < 0;
  const isMonthLoss = monthTotals.profit < 0;
  const monthName = selectedRow?.fullMonth ?? '';

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text">سەرەکی</h1>
        <p className="text-[11px] md:text-xs text-text-muted">کورتەی گشتی کاروبار و دارایی قوتابخانە</p>
      </div>

      {/* Summary cards: 2 per row on phones, 3 + 2 on tablets and laptops, 5 in a row when wide */}
      <div className="grid grid-cols-2 md:grid-cols-6 2xl:grid-cols-5 gap-3 md:gap-4">
        {statCards.map((card, idx) => (
          <StatCard key={card.label} label={card.label} icon={card.icon} iconBg={card.iconBg} className={STAT_SPANS[idx]}>
            {card.value}
          </StatCard>
        ))}
      </div>

      {/* Financial chart */}
      <section className="bg-white border border-border rounded-2xl shadow-card p-4 md:p-6 space-y-4 md:space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm md:text-base font-bold text-text">شیکاری دارایی مانگانە</h2>
            <p className="text-[11px] text-text-muted mt-0.5">داهات، خەرجی و قازانجی هەر مانگێک — ساڵی {chartYear}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="هەڵبژاردنی مانگ"
              value={selectedMonth}
              onChange={(e) => selectMonth(Number(e.target.value))}
              className="h-9 rounded-lg border border-border bg-white px-2.5 text-xs font-semibold text-text focus:border-primary-light focus:outline-none cursor-pointer"
            >
              {chartData.map((row, index) => (
                <option key={row.month} value={index}>{row.fullMonth}</option>
              ))}
            </select>
            <div className="inline-flex rounded-lg border border-border bg-surface-muted p-0.5 text-xs font-semibold" role="tablist">
              {([
                { key: 'chart', label: 'چارت', icon: <HiOutlineChartBar className="w-4 h-4" /> },
                { key: 'table', label: 'خشتە', icon: <HiOutlineTableCells className="w-4 h-4" /> },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={view === tab.key}
                  onClick={() => setView(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    view === tab.key ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Totals of the chosen month */}
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          <div className="@container min-w-0 rounded-xl border border-border bg-surface-muted/60 px-3 py-2.5 flex items-center justify-between gap-2 sm:flex-col sm:items-start">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
              <SeriesKey type="bar" color={SERIES.revenue.color} />
              داهاتی {monthName}
            </span>
            <span className="text-sm md:text-base font-bold text-text"><Amount value={monthTotals.revenue} /></span>
          </div>
          <div className="@container min-w-0 rounded-xl border border-border bg-surface-muted/60 px-3 py-2.5 flex items-center justify-between gap-2 sm:flex-col sm:items-start">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
              <SeriesKey type="bar" color={SERIES.expenses.color} />
              خەرجی {monthName}
            </span>
            <span className="text-sm md:text-base font-bold text-text"><Amount value={monthTotals.expenses} /></span>
          </div>
          <div className={`@container min-w-0 rounded-xl border px-3 py-2.5 flex items-center justify-between gap-2 sm:flex-col sm:items-start ${
            isMonthLoss ? 'bg-danger/5 border-danger/20' : 'bg-success/5 border-success/20'
          }`}>
            <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${isMonthLoss ? 'text-danger' : 'text-success'}`}>
              {isMonthLoss ? <HiOutlineArrowTrendingDown className="w-4 h-4" /> : <HiOutlineArrowTrendingUp className="w-4 h-4" />}
              {isMonthLoss ? 'زیانی' : 'قازانجی'} {monthName}
            </span>
            <span className={`text-sm md:text-base font-bold ${isMonthLoss ? 'text-danger' : 'text-success'}`}>
              <Amount value={monthTotals.profit} />
            </span>
          </div>
        </div>

        {view === 'chart' ? (
          <div className="space-y-3">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-text-muted">
              <span className="flex items-center gap-1.5"><SeriesKey type="bar" color={SERIES.revenue.color} />{SERIES.revenue.label}</span>
              <span className="flex items-center gap-1.5"><SeriesKey type="bar" color={SERIES.expenses.color} />{SERIES.expenses.label}</span>
              <span className="flex items-center gap-1.5"><SeriesKey type="line" color={SERIES.profit.color} />{SERIES.profit.label}</span>
            </div>

            <div className="h-[260px] sm:h-[300px] lg:h-[340px] w-full cursor-pointer" dir="ltr" onClick={selectMonthAt}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={CHART_MARGIN} barGap={2} barCategoryGap="22%">
                  <CartesianGrid vertical={false} stroke={GRID_LINE} />
                  {selectedRow && (
                    <ReferenceArea x1={selectedRow.shortMonth} x2={selectedRow.shortMonth} fill="#1E3A5F" fillOpacity={0.06} stroke="none" />
                  )}
                  <XAxis
                    dataKey="shortMonth"
                    tickLine={false}
                    axisLine={false}
                    tick={<MonthTick selected={selectedRow?.shortMonth} />}
                    tickMargin={4}
                    interval="preserveStartEnd"
                    minTickGap={6}
                  />
                  <YAxis
                    width={Y_AXIS_WIDTH}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: AXIS_TEXT, style: { fontVariantNumeric: 'tabular-nums' } }}
                    tickFormatter={formatAxisValue}
                    tickCount={5}
                  />
                  <ReferenceLine y={0} stroke={BASELINE} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(30, 58, 95, 0.05)' }} />
                  <Bar dataKey="revenue" name={SERIES.revenue.label} fill={SERIES.revenue.color} radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="expenses" name={SERIES.expenses.label} fill={SERIES.expenses.color} radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name={SERIES.profit.label}
                    stroke={SERIES.profit.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={{ r: 4, fill: SERIES.profit.color, stroke: '#FFFFFF', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: SERIES.profit.color, stroke: '#FFFFFF', strokeWidth: 2 }}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[460px] text-sm">
              <thead>
                <tr className="bg-surface-muted text-text-muted text-xs text-right">
                  <th className="px-3 py-2.5 font-semibold">مانگ</th>
                  <th className="px-3 py-2.5 font-semibold">{SERIES.revenue.label}</th>
                  <th className="px-3 py-2.5 font-semibold">{SERIES.expenses.label}</th>
                  <th className="px-3 py-2.5 font-semibold">{SERIES.profit.label}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chartData.map((row, index) => (
                  <tr
                    key={row.month}
                    onClick={() => selectMonth(index)}
                    className={`cursor-pointer ${index === selectedMonth ? 'bg-primary/5' : 'hover:bg-surface-muted/50'}`}
                  >
                    <td className="px-3 py-2 font-medium text-text whitespace-nowrap">{row.fullMonth}</td>
                    <td className="px-3 py-2 tabular-nums text-text"><Amount value={row.revenue} nowrap /></td>
                    <td className="px-3 py-2 tabular-nums text-text"><Amount value={row.expenses} nowrap /></td>
                    <td className={`px-3 py-2 tabular-nums font-semibold ${
                      row.profit === null ? 'text-text-light' : row.profit < 0 ? 'text-danger' : 'text-success'
                    }`}>
                      {row.profit === null ? '—' : <Amount value={row.profit} nowrap />}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-50 border-t-2 border-amber-300 font-bold">
                  <td className="px-3 py-2.5 text-text">کۆی ساڵ</td>
                  <td className="px-3 py-2.5 tabular-nums text-text"><Amount value={yearlyTotals.revenue} nowrap /></td>
                  <td className="px-3 py-2.5 tabular-nums text-text"><Amount value={yearlyTotals.expenses} nowrap /></td>
                  <td className={`px-3 py-2.5 tabular-nums ${isYearLoss ? 'text-danger' : 'text-success'}`}><Amount value={yearlyTotals.profit} nowrap /></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Balances & recent transactions: stacked until there is room for both side by side */}
      <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
        {/* Outstanding balances */}
        <section className="min-w-0 bg-white border border-border rounded-2xl shadow-card p-4 md:p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-3 md:mb-4 text-warning">
            <HiOutlineExclamationTriangle className="w-5 h-5" />
            <h3 className="font-semibold text-sm text-text">قەرزە ماوەکان</h3>
          </div>

          {dashboard.outstanding_balances.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-10">هیچ قوتابییەک قەرزار نییە.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {dashboard.outstanding_balances.map((balance, idx) => (
                <div key={idx} className="flex justify-between items-center gap-3 p-3 rounded-xl border border-border bg-surface-muted">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text break-words">{balance.student_name}</p>
                    <span className="text-[10px] text-text-muted font-medium">{balance.grade}</span>
                  </div>
                  <span className="text-xs font-bold text-danger flex-shrink-0"><Amount value={balance.balance} nowrap /></span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent transactions: cards until the table has room for every column */}
        <section className="min-w-0 xl:col-span-2 bg-white border border-border rounded-2xl shadow-card p-4 md:p-6">
          <h3 className="font-semibold text-sm text-text mb-3 md:mb-4">کۆتا مامەڵەکان</h3>

          <div className="grid gap-2 sm:grid-cols-2 xl:hidden">
            {dashboard.recent_transactions.map((tx, idx) => (
              <div key={idx} className={`p-3 rounded-xl border border-border bg-surface-muted ${tx.is_returned ? 'opacity-60 bg-red-50/30 border-danger/20' : ''}`}>
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.is_returned ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                    {tx.is_returned ? 'گەڕاوەتەوە' : 'دراوە'}
                  </span>
                  <span className="text-[11px] text-text-muted font-mono">#{tx.invoice_no}</span>
                </div>
                <p className={`text-xs font-semibold text-text mb-1 break-words ${tx.is_returned ? 'line-through' : ''}`}>{tx.student?.full_name}</p>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[11px] font-bold text-text-muted">
                    {tx.type === 'study' ? 'خوێندن' : 'نانخواردن'}
                  </span>
                  <span className={`text-xs font-bold ${tx.is_returned ? 'text-danger line-through' : 'text-primary'}`}>
                    <Amount value={Number(tx.amount_paid)} />
                  </span>
                </div>
                <p className="text-[10px] text-text-muted mt-1">{formatDate(tx.payment_date)}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto hidden xl:block">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="text-right text-xs font-semibold text-text-muted bg-surface-muted">
                  <th className="px-4 py-3 whitespace-nowrap">ژمارەی پسوولە</th>
                  <th className="px-4 py-3">ناوی قوتابی</th>
                  <th className="px-4 py-3">جۆر</th>
                  <th className="px-4 py-3 whitespace-nowrap">بڕی دراو</th>
                  <th className="px-4 py-3">بەروار</th>
                  <th className="px-4 py-3">بارودۆخ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border text-sm text-text">
                {dashboard.recent_transactions.map((tx, idx) => (
                  <tr key={idx} className={`hover:bg-surface-muted/50 ${tx.is_returned ? 'line-through opacity-60 text-danger bg-red-50/20' : ''}`}>
                    <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap">#{tx.invoice_no}</td>
                    <td className="px-4 py-3 font-medium">{tx.student?.full_name}</td>
                    <td className="px-4 py-3 text-xs font-bold text-text-muted whitespace-nowrap">
                      {tx.type === 'study' ? 'خوێندن' : 'نانخواردن'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary tabular-nums"><Amount value={Number(tx.amount_paid)} nowrap /></td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(tx.payment_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${tx.is_returned ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                        {tx.is_returned ? 'گەڕاوەتەوە' : 'دراوە'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Grid spans for the five summary cards: the last one fills the second row on
 * phones (2 + 2 + 1), the row of five splits 3 + 2 on tablets and laptops, and
 * all five share one row on wide screens, so no row is left half empty.
 */
const STAT_SPANS = [
  'md:col-span-2 2xl:col-span-1',
  'md:col-span-2 2xl:col-span-1',
  'md:col-span-2 2xl:col-span-1',
  'md:col-span-3 2xl:col-span-1',
  'col-span-2 md:col-span-3 2xl:col-span-1',
];

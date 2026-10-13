'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/tables/DataTable';
import {
  formatCurrency,
  formatDate,
  EXPENSE_CATEGORY_OPTIONS,
  FOOD_EXPENSE_CATEGORY,
  REPORT_MONTH_OPTIONS,
} from '@/lib/utils';
import { HiOutlineArrowDownTray, HiOutlinePrinter } from 'react-icons/hi2';
import type { Expense, ExpenseItem } from '@/types';

// The general report leaves food bills out, so they are not offered as a filter there
const GENERAL_CATEGORY_OPTIONS = EXPENSE_CATEGORY_OPTIONS.filter(
  (opt) => opt.value !== FOOD_EXPENSE_CATEGORY && opt.value !== 'تر'
);

interface ExpenseReportProps {
  /** Report endpoint under /reports, e.g. "expenses" or "food-expenses". */
  endpoint: 'expenses' | 'food-expenses';
  totalLabel: string;
  csvName: string;
}

export function ExpenseReport({ endpoint, totalLabel, csvName }: ExpenseReportProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [month, setMonth] = useState('');
  const [category, setCategory] = useState('');
  const showCategory = endpoint === 'expenses';

  const params = { from, to, month, category: showCategory ? category : '' };

  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['report-' + endpoint, params],
    queryFn: async () => {
      const res = await api.get(`/reports/${endpoint}`, { params });
      return res.data.data;
    },
  });

  const records: Expense[] = reportResponse?.records || [];
  const summary = reportResponse?.summary || { count: 0, total_amount: 0 };

  const handleExportCsv = () => {
    const headers = 'جۆر,ناوی پسوولە,مانگ,بڕ,بەروار,تێبینی\n';
    const rows = records
      .flatMap((r) => {
        const lines: ExpenseItem[] = Array.isArray(r.items) && r.items.length > 0 ? r.items : [{ name: r.title, amount: r.amount }];
        return lines.map((item) =>
          [
            `"${r.category || ''}"`,
            `"${item.name || ''}"`,
            `"${item.month || ''}"`,
            item.amount,
            r.expense_date,
            `"${r.description || ''}"`,
          ].join(',')
        );
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${csvName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrintPdf = () => {
    const query = new URLSearchParams(params).toString();
    window.open(`${API_URL}/reports/${endpoint}/pdf?${query}`, '_blank');
  };

  const columns: Column<Expense>[] = [
    {
      header: 'جۆر / پۆلێنی پسوولە',
      accessor: (row) => (
        <div className="space-y-1">
          <span className="font-bold text-primary">{row.category || '-'}</span>
          {row.items && Array.isArray(row.items) && row.items.length > 0 && (
            <div className="text-[10px] bg-surface-muted border border-border/60 rounded-lg p-2 space-y-1 text-text mt-1">
              {row.items.map((item, idx) => (
                <div key={idx} className="flex justify-between gap-6 border-b border-border/20 last:border-b-0 py-0.5 animate-fade-in">
                  <span className="font-medium">• {item.name} {item.month ? ` [${item.month}]` : ''}</span>
                  <span className="font-mono text-danger font-bold">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
      className: 'w-[40%]',
    },
    { header: 'کۆی خەرجکراو', accessor: (row) => formatCurrency(row.amount), sortable: true, className: 'text-danger font-bold' },
    { header: 'بەروار', accessor: (row) => formatDate(row.expense_date), sortable: true },
    { header: 'تێبینی', accessor: (row) => row.description || '-' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className={`grid gap-4 sm:grid-cols-2 ${showCategory ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} items-end bg-surface-muted p-4 border rounded-xl`}>
        <Select
          label="فلتەر بەپێی مانگ"
          id="month_filter"
          options={REPORT_MONTH_OPTIONS}
          placeholder="هەموو مانگەکان"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <Input
          label="لە بەرواری"
          id="from_date"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="بۆ بەرواری"
          id="to_date"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        {showCategory && (
          <Select
            label="فلتەر بەپێی جۆر"
            id="category_filter"
            options={GENERAL_CATEGORY_OPTIONS}
            placeholder="هەموو جۆرەکان"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        )}
      </div>

      {/* Summary aggregates */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-md">
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold">کۆی وەسڵەکان</span>
          <p className="text-base font-bold text-text mt-0.5">{summary.count}</p>
        </div>
        <div className="bg-danger/5 p-4 border border-danger/20 rounded-xl">
          <span className="text-[10px] text-danger font-bold">{totalLabel}</span>
          <p className="text-base font-bold text-danger mt-0.5">{formatCurrency(summary.total_amount)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={handleExportCsv} className="flex items-center gap-1.5">
          <HiOutlineArrowDownTray className="w-4 h-4" />
          <span>ناردنەوەی CSV</span>
        </Button>
        <Button variant="primary" onClick={handlePrintPdf} className="flex items-center gap-1.5">
          <HiOutlinePrinter className="w-4 h-4" />
          <span>چاپکردن</span>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={records} isLoading={isLoading} />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/tables/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';

export default function ExpensesReportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [category, setCategory] = useState('');

  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['report-expenses', from, to, category],
    queryFn: async () => {
      const res = await api.get('/reports/expenses', {
        params: { from, to, category },
      });
      return res.data.data;
    },
  });

  const records = reportResponse?.records || [];
  const summary = reportResponse?.summary || { count: 0, total_amount: 0 };

  const handleExportCsv = () => {
    const headers = 'Title,Amount,Category,Date,Receipt No\n';
    const rows = records
      .map((r: any) =>
        [
          `"${r.title}"`,
          r.amount,
          r.category || '',
          r.expense_date,
          r.receipt_no || '',
        ].join(',')
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const columns: Column<any>[] = [
    { header: 'Title', accessor: 'title' },
    { header: 'Category', accessor: (row) => row.category || '-' },
    { header: 'Amount', accessor: (row) => formatCurrency(row.amount), className: 'text-danger font-semibold' },
    { header: 'Date', accessor: (row) => formatDate(row.expense_date) },
    { header: 'Receipt No', accessor: (row) => row.receipt_no || '-' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-3 items-end bg-surface-muted p-4 border rounded-xl">
        <Input
          label="From Date"
          id="from_date"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="To Date"
          id="to_date"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <Input
          label="Category Filter"
          id="category_filter"
          placeholder="e.g. maintenance, utility"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      {/* Summary aggregates */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-md">
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold uppercase">Total Receipts</span>
          <p className="text-base font-bold text-text mt-0.5">{summary.count}</p>
        </div>
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold uppercase">Total Debited Amount</span>
          <p className="text-base font-bold text-danger mt-0.5">{formatCurrency(summary.total_amount)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={handleExportCsv} className="flex items-center gap-1.5">
          <HiOutlineArrowDownTray className="w-4 h-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
      />
    </div>
  );
}

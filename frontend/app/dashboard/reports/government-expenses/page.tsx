'use client';
 
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/tables/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { HiOutlineArrowDownTray, HiOutlinePrinter } from 'react-icons/hi2';
 
const GOVT_CATEGORIES = [
  { value: 'ڕاپۆرتی خەرجی حکومەت', label: 'ڕاپۆرتی خەرجی حکومەت' },
  { value: 'ڕاپۆرتی پارەی کارەبای حکومەت', label: 'ڕاپۆرتی پارەی کارەبای حکومەت' }
];
 
export default function GovernmentExpensesReportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [category, setCategory] = useState('');
 
  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['report-government-expenses', from, to, category],
    queryFn: async () => {
      const res = await api.get('/reports/government-expenses', {
        params: { from, to, category },
      });
      return res.data.data;
    },
  });
 
  const records = reportResponse?.records || [];
  const summary = reportResponse?.summary || { count: 0, total_amount: 0 };
 
  const handleExportCsv = () => {
    const headers = 'بابەت,بڕ,جۆر,بەروار,ژمارەی وەسڵ\n';
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
    link.download = `government_expenses_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
 
  const handlePrintPdf = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/reports/government-expenses/pdf?from=${from}&to=${to}&category=${category}`,
      '_blank'
    );
  };
 
  const columns: Column<any>[] = [
    { 
      header: 'جۆر / پۆلێنی پسوولە', 
      accessor: (row) => (
        <div className="space-y-1">
          <span className="font-bold text-primary">{row.category || '-'}</span>
          {row.items && Array.isArray(row.items) && row.items.length > 0 && (
            <div className="text-[10px] bg-surface-muted border border-border/60 rounded-lg p-2 space-y-1 text-text mt-1">
              {row.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between gap-6 border-b border-border/20 last:border-b-0 py-0.5 animate-fade-in">
                  <span className="font-medium">• {item.name} {item.receipt_no ? `(وەسڵ: #${item.receipt_no})` : ''}</span>
                  <span className="font-mono text-danger font-bold">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
      className: 'w-[40%]'
    },
    { header: 'کۆی خەرجکراو', accessor: (row) => formatCurrency(row.amount), sortable: true, className: 'text-danger font-bold' },
    { header: 'بەروار', accessor: (row) => formatDate(row.expense_date), sortable: true },
    { header: 'ژمارەی وەسڵ (سەرەکی)', accessor: (row) => row.receipt_no || '-' },
  ];
 
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-3 items-end bg-surface-muted p-4 border rounded-xl">
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
        <Select
          label="فلتەر بەپێی پۆلێنی حکومی"
          id="category_filter"
          placeholder="هەموو پۆلێنە حکومییەکان"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={GOVT_CATEGORIES}
        />
      </div>
 
      {/* Summary aggregates */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-md">
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold">کۆی وەسڵەکان</span>
          <p className="text-base font-bold text-text mt-0.5">{summary.count}</p>
        </div>
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold">کۆی خەرجکراو</span>
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
          <span>چاپکردنی PDF</span>
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

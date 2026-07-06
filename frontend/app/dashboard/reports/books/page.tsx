'use client';
 
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/tables/DataTable';
import { formatCurrency, formatDate, GRADE_OPTIONS, GRADE_MAP } from '@/lib/utils';
import { HiOutlineArrowDownTray, HiOutlinePrinter } from 'react-icons/hi2';
 
const MONTH_OPTIONS = [
  { value: '1', label: 'کانوونی دووەم (1)' },
  { value: '2', label: 'شوبات (2)' },
  { value: '3', label: 'ئادار (3)' },
  { value: '4', label: 'نیسان (4)' },
  { value: '5', label: 'ئایار (5)' },
  { value: '6', label: 'حوزەیران (6)' },
  { value: '7', label: 'تەممووز (7)' },
  { value: '8', label: 'ئاب (8)' },
  { value: '9', label: 'ئەیلوول (9)' },
  { value: '10', label: 'تشرینی یەکەم (10)' },
  { value: '11', label: 'تشرینی دووەم (11)' },
  { value: '12', label: 'کانوونی یەکەم (12)' },
];
 
export default function BooksReportPage() {
  const [month, setMonth] = useState('');
  const [grade, setGrade] = useState('');
 
  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['report-book-payments', month, grade],
    queryFn: async () => {
      const res = await api.get('/reports/book-payments', {
        params: { month, grade },
      });
      return res.data.data;
    },
  });
 
  const records = reportResponse?.records || [];
  const summary = reportResponse?.summary || { count: 0, total_amount: 0 };
 
  const handleExportCsv = () => {
    const headers = 'ژمارەی پسوولە,بەروار,ناوی قوتابی,پۆل,بڕی دراو,تێبینی\n';
    const rows = records
      .map((r: any) =>
        [
          r.invoice_no,
          r.payment_date,
          `"${r.student?.full_name}"`,
          GRADE_MAP[r.student?.grade] || r.student?.grade,
          r.amount_paid,
          `"${r.notes || ''}"`,
        ].join(',')
      )
      .join('\n');
 
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `books_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
 
  const handlePrintPdf = () => {
    window.open(
      `${API_URL}/reports/book-payments/pdf?month=${month}&grade=${grade}`,
      '_blank'
    );
  };
 
  const columns: Column<any>[] = [
    { header: 'ژمارەی پسوولە', accessor: (row) => row.invoice_no ? `#${row.invoice_no}` : '-' },
    { header: 'بەروار', accessor: (row) => formatDate(row.payment_date) },
    { header: 'ناوی قوتابی', accessor: (row) => row.student?.full_name },
    { header: 'پۆل', accessor: (row) => GRADE_MAP[row.student?.grade] || row.student?.grade },
    { header: 'بڕی دراو', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-primary font-bold' },
    { header: 'تێبینی', accessor: (row) => row.notes || '-' },
  ];
 
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end bg-surface-muted p-4 border rounded-xl">
        <Select
          label="فلتەر بەپێی مانگ"
          id="month_filter"
          options={MONTH_OPTIONS}
          placeholder="هەموو مانگەکان"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <Select
          label="فلتەر بەپێی پۆل"
          id="grade_filter"
          options={GRADE_OPTIONS}
          placeholder="هەموو پۆلەکان"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
      </div>
 
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold">ژمارەی فرۆشتنەکان</span>
          <p className="text-base font-bold text-text mt-0.5">{summary.count}</p>
        </div>
        <div className="bg-primary/5 p-4 border border-primary/20 rounded-xl">
          <span className="text-[10px] text-primary font-bold">کۆی داهات (کتێب)</span>
          <p className="text-base font-bold text-primary mt-0.5">{formatCurrency(summary.total_amount)}</p>
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
      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
      />
    </div>
  );
}

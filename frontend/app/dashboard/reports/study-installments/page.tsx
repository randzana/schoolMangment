'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/tables/DataTable';
import { formatCurrency, formatDate, GRADE_OPTIONS, GRADE_MAP } from '@/lib/utils';
import { HiOutlineArrowDownTray, HiOutlinePrinter } from 'react-icons/hi2';

export default function StudyInstallmentsReportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [grade, setGrade] = useState('');

  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['report-study-installments', from, to, grade],
    queryFn: async () => {
      const res = await api.get('/reports/study-installments', {
        params: { from, to, grade },
      });
      return res.data.data;
    },
  });

  const records = reportResponse?.records || [];
  const summary = reportResponse?.summary || { count: 0, total_amount: 0 };

  const handleExportCsv = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/reports/study-installments/export?from=${from}&to=${to}&grade=${grade}`,
      '_blank'
    );
  };

  const handlePrintPdf = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/reports/study-installments/pdf?from=${from}&to=${to}&grade=${grade}`,
      '_blank'
    );
  };

  const columns: Column<any>[] = [
    { header: 'ژمارەی پسوولە', accessor: (row) => `#${row.invoice_no}` },
    { header: 'بەروار', accessor: (row) => formatDate(row.payment_date) },
    { header: 'ناوی قوتابی', accessor: (row) => row.student?.full_name },
    { header: 'پۆل', accessor: (row) => GRADE_MAP[row.student?.grade] || row.student?.grade },
    { header: 'بڕی دراو', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-primary font-bold' },
    { header: 'ماوەی قەرز', accessor: (row) => formatCurrency(row.remain_after) },
    {
      header: 'بارودۆخ',
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.is_returned ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
          {row.is_returned ? 'گەڕاوەتەوە' : 'چالاک'}
        </span>
      ),
    },
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
          label="فلتەر بەپێی پۆل"
          id="grade_filter"
          options={GRADE_OPTIONS}
          placeholder="هەموو پۆلەکان"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
      </div>

      {/* Summary Aggregate cards */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-md">
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold">کۆی مامەڵەکان</span>
          <p className="text-base font-bold text-text mt-0.5">{summary.count}</p>
        </div>
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold">کۆی داهاتی کۆکراوە</span>
          <p className="text-base font-bold text-success mt-0.5">{formatCurrency(summary.total_amount)}</p>
        </div>
      </div>

      {/* Export / Action triggers */}
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
        rowClass={(row) => (row.is_returned ? 'returned' : '')}
      />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/tables/DataTable';
import { formatCurrency, GRADE_OPTIONS, REPORT_MONTH_OPTIONS } from '@/lib/utils';
import { HiOutlineArrowDownTray, HiOutlinePrinter } from 'react-icons/hi2';

const TYPE_OPTIONS = [
  { value: 'food', label: 'پارەی نانخواردنیان نەداوە' },
  { value: 'clothes', label: 'پارەی جلوبەرگیان نەداوە' },
];

interface UnpaidStudentRow {
  id: number;
  serial_number: string;
  full_name: string;
  grade: string;
  grade_label: string;
  food_paid: number;
  clothes_paid: number;
  food_unpaid: boolean;
  clothes_unpaid: boolean;
}

function PaidCell({ unpaid, amount }: { unpaid: boolean; amount: number }) {
  return unpaid ? (
    <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-danger/10 text-danger border border-danger/20">نەدراوە</span>
  ) : (
    <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-success/10 text-success border border-success/20">{formatCurrency(amount)}</span>
  );
}

export default function UnpaidStudentsReportPage() {
  // Empty means the school's current academic year (decided by the server)
  const [academicYear, setAcademicYear] = useState('');
  const [type, setType] = useState('');
  const [grade, setGrade] = useState('');
  const [month, setMonth] = useState('');

  // Month only narrows food payments, which are paid monthly
  const params = { academic_year: academicYear, type, grade, month: type === 'clothes' ? '' : month };

  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['report-unpaid-students', params],
    queryFn: async () => {
      const res = await api.get('/reports/unpaid-students', { params });
      return res.data.data;
    },
  });

  const records: UnpaidStudentRow[] = reportResponse?.records || [];
  const summary = reportResponse?.summary || { count: 0, food_unpaid_count: 0, clothes_unpaid_count: 0 };

  const handleExportCsv = () => {
    const headers = 'سێریال,ناوی قوتابی,پۆل,پارەی نانخواردن,پارەی جلوبەرگ\n';
    const rows = records
      .map((r) =>
        [
          r.serial_number,
          `"${r.full_name}"`,
          r.grade_label,
          r.food_unpaid ? 'نەدراوە' : r.food_paid,
          r.clothes_unpaid ? 'نەدراوە' : r.clothes_paid,
        ].join(',')
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unpaid_students_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrintPdf = () => {
    const query = new URLSearchParams(params).toString();
    window.open(`${API_URL}/reports/unpaid-students/pdf?${query}`, '_blank');
  };

  const columns: Column<UnpaidStudentRow>[] = [
    { header: 'سێریال', accessor: (row) => `#${row.serial_number}`, className: 'font-mono' },
    { header: 'ناوی قوتابی', accessor: 'full_name', className: 'font-medium text-text' },
    { header: 'پۆل', accessor: 'grade_label' },
    ...(type !== 'clothes'
      ? [{ header: 'پارەی نانخواردن', accessor: (row: UnpaidStudentRow) => <PaidCell unpaid={row.food_unpaid} amount={row.food_paid} /> }]
      : []),
    ...(type !== 'food'
      ? [{ header: 'پارەی جلوبەرگ', accessor: (row: UnpaidStudentRow) => <PaidCell unpaid={row.clothes_unpaid} amount={row.clothes_paid} /> }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end bg-surface-muted p-4 border rounded-xl">
        <Select
          label="جۆری پارە"
          id="type_filter"
          options={TYPE_OPTIONS}
          placeholder="نانخواردن یان جلوبەرگ"
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <Select
          label="ساڵی خوێندن"
          id="academic_year_filter"
          placeholder="ساڵی خوێندنی ئێستا"
          options={[
            { value: '2024-2025', label: '2024-2025' },
            { value: '2025-2026', label: '2025-2026' },
            { value: '2026-2027', label: '2026-2027' },
          ]}
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
        />
        <Select
          label="فلتەر بەپێی پۆل"
          id="grade_filter"
          options={GRADE_OPTIONS}
          placeholder="هەموو پۆلەکان"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
        <Select
          label="مانگی نانخواردن"
          id="month_filter"
          options={REPORT_MONTH_OPTIONS}
          placeholder="هەموو ساڵەکە"
          value={type === 'clothes' ? '' : month}
          disabled={type === 'clothes'}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold">ژمارەی قوتابییان</span>
          <p className="text-base font-bold text-text mt-0.5">{summary.count} قوتابی</p>
        </div>
        {type !== 'clothes' && (
          <div className="bg-danger/5 p-4 border border-danger/20 rounded-xl">
            <span className="text-[10px] text-danger font-bold">پارەی نانخواردنیان نەداوە</span>
            <p className="text-base font-bold text-danger mt-0.5">{summary.food_unpaid_count} قوتابی</p>
          </div>
        )}
        {type !== 'food' && (
          <div className="bg-danger/5 p-4 border border-danger/20 rounded-xl">
            <span className="text-[10px] text-danger font-bold">پارەی جلوبەرگیان نەداوە</span>
            <p className="text-base font-bold text-danger mt-0.5">{summary.clothes_unpaid_count} قوتابی</p>
          </div>
        )}
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

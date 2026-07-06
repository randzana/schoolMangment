'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/tables/DataTable';
import { formatCurrency, GRADE_OPTIONS, GRADE_MAP } from '@/lib/utils';
import { HiOutlineArrowDownTray, HiOutlinePrinter } from 'react-icons/hi2';

export default function StudyDebtsReportPage() {
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [grade, setGrade] = useState('');

  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['report-study-debts', academicYear, grade],
    queryFn: async () => {
      const res = await api.get('/reports/study-debts', {
        params: { academic_year: academicYear, grade },
      });
      return res.data.data;
    },
  });

  const records = reportResponse?.records || [];
  const summary = reportResponse?.summary || { count: 0, total_paid: 0, total_debt: 0 };

  const handleExportCsv = () => {
    window.open(
      `${API_URL}/reports/study-debts/export?academic_year=${academicYear}&grade=${grade}`,
      '_blank'
    );
  };

  const handlePrintPdf = () => {
    window.open(
      `${API_URL}/reports/study-debts/pdf?academic_year=${academicYear}&grade=${grade}`,
      '_blank'
    );
  };

  const columns: Column<any>[] = [
    { header: 'سێریال', accessor: (row) => `#${row.serial_number}`, className: 'font-mono' },
    { header: 'ناوی قوتابی', accessor: 'full_name', className: 'font-medium text-text' },
    { header: 'پۆل', accessor: (row) => GRADE_MAP[row.grade] || row.grade_display },
    { header: 'تێچووی خوێندن', accessor: (row) => formatCurrency(row.price_after_discount) },
    { header: 'بڕی دراو', accessor: (row) => formatCurrency(row.total_paid), className: 'text-success font-semibold' },
    { header: 'قەرزی خوێندن', accessor: (row) => formatCurrency(row.remain_balance), className: 'text-danger font-bold' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end bg-surface-muted p-4 border rounded-xl">
        <Select
          label="ساڵی خوێندن"
          id="academic_year_filter"
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
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold">ژمارەی قوتابییانی قەرزار</span>
          <p className="text-base font-bold text-text mt-0.5">{summary.count} قوتابی</p>
        </div>
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold">کۆی گشتی دراو</span>
          <p className="text-base font-bold text-success mt-0.5">{formatCurrency(summary.total_paid)}</p>
        </div>
        <div className="bg-danger/5 p-4 border border-danger/20 rounded-xl">
          <span className="text-[10px] text-danger font-bold">کۆی گشتی قەرز</span>
          <p className="text-base font-bold text-danger mt-0.5">{formatCurrency(summary.total_debt)}</p>
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

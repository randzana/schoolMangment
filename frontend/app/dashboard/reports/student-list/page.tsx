'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/tables/DataTable';
import { formatCurrency, GRADE_OPTIONS } from '@/lib/utils';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';

export default function StudentListReportPage() {
  const [grade, setGrade] = useState('');
  const [status, setStatus] = useState('');

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['report-student-list', grade, status],
    queryFn: async () => {
      const res = await api.get('/reports/student-list', {
        params: { grade, status },
      });
      return res.data.data;
    },
  });

  const handleExportCsv = () => {
    const headers = 'سێریال,ناو,پۆل,کرێی خوێندن,دراوی خوێندن,ماوەی خوێندن,نرخی نان,دراوی نان,ماوەی نان,بارودۆخ\n';
    const rows = students
      .map((s: any) =>
        [
          s.serial_number,
          `"${s.full_name}"`,
          s.grade_display,
          s.study_annual_price,
          s.study_paid,
          s.study_remaining,
          s.food_monthly_price,
          s.food_paid,
          s.food_remaining,
          s.payment_status === 'paid' ? 'تەواو دراوە' :
          s.payment_status === 'partial' ? 'بەشێکی دراوە' : 'نەدراوە',
        ].join(',')
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_payment_status_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const columns: Column<any>[] = [
    { header: 'سێریال', accessor: 'serial_number' },
    { header: 'ناوی قوتابی', accessor: 'full_name' },
    { header: 'پۆل', accessor: 'grade_display' },
    { header: 'کرێی خوێندن', accessor: (row) => formatCurrency(row.study_annual_price) },
    { header: 'دراوی خوێندن', accessor: (row) => formatCurrency(row.study_paid), className: 'text-success' },
    { header: 'ماوەی خوێندن', accessor: (row) => formatCurrency(row.study_remaining), className: 'text-danger font-semibold' },
    { header: 'نرخی نان', accessor: (row) => formatCurrency(row.food_monthly_price) },
    { header: 'ماوەی نان', accessor: (row) => formatCurrency(row.food_remaining), className: 'text-danger font-semibold' },
    {
      header: 'بارودۆخ',
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          row.payment_status === 'paid' ? 'bg-success/10 text-success' :
          row.payment_status === 'partial' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
        }`}>
          {row.payment_status === 'paid' ? 'تەواو دراوە' :
           row.payment_status === 'partial' ? 'بەشێکی دراوە' : 'نەدراوە'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 items-end bg-surface-muted p-4 border rounded-xl max-w-2xl">
        <Select
          label="فلتەر بەپێی پۆل"
          id="grade_filter"
          options={GRADE_OPTIONS}
          placeholder="هەموو پۆلەکان"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
        <Select
          label="فلتەر بەپێی بارودۆخی پارەدان"
          id="status_filter"
          options={[
            { value: 'paid', label: 'تەواو دراوە' },
            { value: 'partial', label: 'بەشێکی دراوە' },
            { value: 'unpaid', label: 'نەدراوە' },
          ]}
          placeholder="هەموو بارودۆخەکان"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </div>

      {/* Summary aggregate count */}
      <div className="bg-surface-muted p-4 border rounded-xl max-w-xs">
        <span className="text-[10px] text-text-muted font-bold">ژمارەی قوتابییانی فلتەرکراو</span>
        <p className="text-base font-bold text-text mt-0.5">{students.length}</p>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={handleExportCsv} className="flex items-center gap-1.5">
          <HiOutlineArrowDownTray className="w-4 h-4" />
          <span>ناردنەوەی CSV</span>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={students}
        isLoading={isLoading}
      />
    </div>
  );
}

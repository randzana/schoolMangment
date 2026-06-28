'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/tables/DataTable';
import { formatCurrency } from '@/lib/utils';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function StudyIncomeReportPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['report-study-income', year],
    queryFn: async () => {
      const res = await api.get('/reports/study-income', {
        params: { year },
      });
      return res.data.data;
    },
  });

  const months = reportResponse?.months || [];
  const grandTotal = reportResponse?.grand_total || 0;

  const handleExportCsv = () => {
    const headers = 'مانگ,بڕی کۆکراوە,کۆی گشتی بەردەوام\n';
    const rows = months
      .map((m: any) =>
        [
          m.month,
          m.total_collected,
          m.running_total,
        ].join(',')
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tuition_income_report_${year}.csv`;
    link.click();
  };

  const columns: Column<any>[] = [
    { header: 'مانگ', accessor: 'month' },
    { header: 'بڕی کۆکراوە', accessor: (row) => formatCurrency(row.total_collected), className: 'text-success font-semibold' },
    { header: 'کۆی گشتی بەردەوام', accessor: (row) => formatCurrency(row.running_total), className: 'font-mono' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex justify-between items-center gap-4 bg-surface-muted p-4 border rounded-xl">
        <div className="w-48">
          <Select
            label="هەڵبژاردنی ساڵ"
            id="year_filter"
            options={[
              { value: '2024', label: '2024' },
              { value: '2025', label: '2025' },
              { value: '2026', label: '2026' },
            ]}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <Button variant="secondary" onClick={handleExportCsv} className="flex items-center gap-1.5">
          <HiOutlineArrowDownTray className="w-4 h-4" />
          <span>ناردنەوەی CSV</span>
        </Button>
      </div>

      {/* Aggregate Header */}
      <div className="bg-primary/5 p-5 border border-primary/20 rounded-xl max-w-sm">
        <span className="text-[10px] text-primary font-bold">کۆی گشتی داهاتی ساڵانە</span>
        <p className="text-xl font-bold text-primary mt-1">{formatCurrency(grandTotal)}</p>
      </div>

      {/* Chart visualization */}
      <div className="bg-white border rounded-xl shadow-card p-6">
        <h3 className="font-semibold text-xs text-text mb-4 tracking-wider">داهاتی مانگانە (بە دینار)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="#A0AEC0" fontSize={10} tickLine={false} />
              <YAxis stroke="#A0AEC0" fontSize={10} tickLine={false} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="total_collected" fill="var(--color-primary-light)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={months}
        isLoading={isLoading}
      />
    </div>
  );
}

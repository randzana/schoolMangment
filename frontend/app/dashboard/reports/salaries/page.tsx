'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/tables/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';

export default function SalaryExpensesReportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['report-salaries', from, to],
    queryFn: async () => {
      const res = await api.get('/reports/salaries', {
        params: { from, to },
      });
      return res.data.data;
    },
  });

  const records = reportResponse?.records || [];
  const summary = reportResponse?.summary || { count: 0, total_paid: 0 };

  const handleExportCsv = () => {
    const headers = 'Teacher Name,Subject,Payroll Month,Amount Paid,Paid Date\n';
    const rows = records
      .map((r: any) =>
        [
          `"${r.teacher?.full_name}"`,
          r.teacher?.subject || 'Staff',
          r.month,
          r.amount_paid,
          r.paid_date,
        ].join(',')
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salary_expenses_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const columns: Column<any>[] = [
    { header: 'Teacher Name', accessor: (row) => row.teacher?.full_name },
    { header: 'Subject', accessor: (row) => row.teacher?.subject || 'Staff' },
    { header: 'Month', accessor: 'month' },
    { header: 'Amount Paid', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-success font-semibold' },
    { header: 'Paid Date', accessor: (row) => formatDate(row.paid_date) },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 items-end bg-surface-muted p-4 border rounded-xl max-w-xl">
        <Input
          label="From Month"
          id="from_month"
          type="month"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="To Month"
          id="to_month"
          type="month"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      {/* Summary aggregates */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-md">
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold uppercase">Total Disbursals</span>
          <p className="text-base font-bold text-text mt-0.5">{summary.count}</p>
        </div>
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold uppercase">Total Disbursed Payroll</span>
          <p className="text-base font-bold text-success mt-0.5">{formatCurrency(summary.total_paid)}</p>
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

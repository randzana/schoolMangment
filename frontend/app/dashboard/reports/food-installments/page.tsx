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

export default function FoodInstallmentsReportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [grade, setGrade] = useState('');

  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['report-food-installments', from, to, grade],
    queryFn: async () => {
      const res = await api.get('/reports/food-installments', {
        params: { from, to, grade },
      });
      return res.data.data;
    },
  });

  const records = reportResponse?.records || [];
  const summary = reportResponse?.summary || { count: 0, total_amount: 0 };

  const handleExportCsv = () => {
    // Generate CSV client-side since we have data loaded
    const headers = 'Invoice No,Date,Student Name,Grade,Amount Paid,Remaining After,Returned\n';
    const rows = records
      .map((r: any) =>
        [
          r.invoice_no,
          r.payment_date,
          `"${r.student?.full_name}"`,
          GRADE_MAP[r.student?.grade] || r.student?.grade,
          r.amount_paid,
          r.remain_after,
          r.is_returned ? 'Yes' : 'No',
        ].join(',')
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `food_installments_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const columns: Column<any>[] = [
    { header: 'Invoice No', accessor: (row) => `#${row.invoice_no}` },
    { header: 'Date', accessor: (row) => formatDate(row.payment_date) },
    { header: 'Student Name', accessor: (row) => row.student?.full_name },
    { header: 'Grade', accessor: (row) => GRADE_MAP[row.student?.grade] || row.student?.grade },
    { header: 'Amount Paid', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-primary font-bold' },
    { header: 'Remaining After', accessor: (row) => formatCurrency(row.remain_after) },
    {
      header: 'Returned',
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${row.is_returned ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
          {row.is_returned ? 'Yes' : 'No'}
        </span>
      ),
    },
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
        <Select
          label="Filter by Grade"
          id="grade_filter"
          options={GRADE_OPTIONS}
          placeholder="All Grades"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
      </div>

      {/* Summary Aggregates */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-md">
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold uppercase">Total Transactions</span>
          <p className="text-base font-bold text-text mt-0.5">{summary.count}</p>
        </div>
        <div className="bg-surface-muted p-4 border rounded-xl">
          <span className="text-[10px] text-text-muted font-bold uppercase">Total Revenue Collected</span>
          <p className="text-base font-bold text-success mt-0.5">{formatCurrency(summary.total_amount)}</p>
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
        rowClass={(row) => (row.is_returned ? 'returned' : '')}
      />
    </div>
  );
}

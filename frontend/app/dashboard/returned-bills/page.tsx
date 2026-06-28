'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, formatDate, GRADE_MAP } from '@/lib/utils';
import { HiOutlineMagnifyingGlass, HiOutlineArrowUturnLeft } from 'react-icons/hi2';

export default function ReturnedBillsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Fetch all returned study installments
  const { data: studyResponse, isLoading: studyLoading } = useQuery({
    queryKey: ['returned-study-installments', search, page],
    queryFn: async () => {
      const res = await api.get('/study-installments', {
        params: { page, per_page: 50 },
      });
      // Filter client-side for returned bills to guarantee list correctness
      const records = (res.data.data || []).filter((r: any) => r.is_returned);
      return {
        data: records,
        meta: res.data.meta,
      };
    },
  });

  // Fetch all returned food installments
  const { data: foodResponse, isLoading: foodLoading } = useQuery({
    queryKey: ['returned-food-installments', search, page],
    queryFn: async () => {
      const res = await api.get('/food-installments', {
        params: { page, per_page: 50 },
      });
      const records = (res.data.data || []).filter((r: any) => r.is_returned);
      return {
        data: records,
        meta: res.data.meta,
      };
    },
  });

  const isLoading = studyLoading || foodLoading;

  // Combine results
  const studyRecords = (studyResponse?.data || []).map((r: any) => ({ ...r, bill_type: 'Study Payment' }));
  const foodRecords = (foodResponse?.data || []).map((r: any) => ({ ...r, bill_type: 'Food Payment' }));
  const allReturned = [...studyRecords, ...foodRecords]
    .filter((r) => {
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        String(r.invoice_no).includes(term) ||
        r.student?.full_name?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => new Date(b.returned_at || b.updated_at).getTime() - new Date(a.returned_at || a.updated_at).getTime());

  const columns: Column<any>[] = [
    { header: 'Invoice No', accessor: (row) => `#${row.invoice_no}`, sortable: true },
    { header: 'Bill Type', accessor: 'bill_type' },
    { header: 'Student Name', accessor: (row) => row.student?.full_name },
    { header: 'Grade', accessor: (row) => GRADE_MAP[row.student?.grade] || row.student?.grade },
    { header: 'Amount Voided', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-danger font-semibold' },
    { header: 'Voided Date', accessor: (row) => formatDate(row.returned_at || row.updated_at), sortable: true },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Returned Bills Audit</h1>
        <p className="text-xs text-text-muted">Review history log of voided, refunded, and returned transaction bills</p>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-border rounded-xl shadow-card">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search returned bills by student name or invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm bg-white text-text focus:border-primary focus:outline-none transition-all placeholder:text-text-light"
          />
          <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 w-5 h-5 text-text-light" />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2 text-danger">
          <HiOutlineArrowUturnLeft className="w-5 h-5" />
          <h3 className="font-semibold text-sm text-text">Voided Transaction Receipts</h3>
        </div>
        <DataTable
          columns={columns}
          data={allReturned}
          isLoading={isLoading}
          rowClass={() => 'bg-red-50/10'}
        />
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useStudents, useCreateStudent, useDeleteStudent } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, GRADE_OPTIONS, gradeDisplay } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { HiOutlineUserPlus, HiOutlineTrash, HiOutlineEye, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

const studentSchema = zod.object({
  full_name: zod.string().min(1, 'ناوی سیانی قوتابی داواکراوە').max(150, 'زۆرترین ١٥٠ پیت'),
  grade: zod.enum(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'], {
    message: 'دیاریکردنی پۆل داواکراوە',
  }),
  tuition_price: zod.coerce.number().min(0, 'نابێت لە سفر کەمتر بێت'),
});

export default function StudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: studentsData, isLoading } = useStudents({ search, grade, page });
  const createStudentMutation = useCreateStudent();
  const deleteStudentMutation = useDeleteStudent();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(studentSchema),
  });

  const onSubmit = (values: any) => {
    createStudentMutation.mutate(values, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        reset();
      },
    });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteStudentMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };


  const columns: Column<any>[] = [
    { header: 'سێریال', accessor: 'serial_number', sortable: true },
    { header: 'ناو', accessor: 'full_name', sortable: true },
    { header: 'پۆل', accessor: (row) => gradeDisplay(row.grade) },
    { header: 'قەرزی خوێندن', accessor: (row) => formatCurrency(row.study_balance || 0) },
    { header: 'قەرزی نانخواردن', accessor: (row) => formatCurrency(row.food_balance || 0) },
    {
      header: 'کردارەکان',
      accessor: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/students/${row.id}`)}
            title="بینین"
          >
            <HiOutlineEye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger-light"
            onClick={() => setDeleteId(row.id)}
            title="سڕینەوە"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">قوتابییەکان</h1>
          <p className="text-xs text-text-muted">بەڕێوەبردنی تۆمارەکانی قوتابییان و زانیارییەکانی تۆمارکردن</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1.5">
            <HiOutlineUserPlus className="w-4 h-4" />
            <span>زیادکردنی قوتابی</span>
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-border rounded-xl shadow-card">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="گەڕان بەدوای قوتابی بە ناو یان ژمارەی سێریال..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm bg-white text-text focus:border-primary focus:outline-none transition-all placeholder:text-text-light"
          />
          <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 w-5 h-5 text-text-light" />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={grade}
            onChange={(e) => {
              setGrade(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white text-text focus:border-primary focus:outline-none transition-all"
          >
            <option value="">هەموو پۆلەکان</option>
            {GRADE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <DataTable
          columns={columns}
          data={studentsData?.data || []}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/dashboard/students/${row.id}`)}
        />
        {studentsData && (
          <TablePagination
            currentPage={page}
            lastPage={studentsData.meta.last_page}
            onPageChange={setPage}
            total={studentsData.meta.total}
            perPage={studentsData.meta.per_page}
          />
        )}
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="زیادکردنی قوتابی" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="ناوی سیانی قوتابی *"
            id="full_name"
            placeholder="ناوی قوتابی بە کوردی یان ئینگلیزی"
            error={errors.full_name?.message}
            {...register('full_name')}
          />

          <Select
            label="پۆل / قۆناغ *"
            id="grade"
            options={GRADE_OPTIONS}
            placeholder="پۆلێک هەڵبژێرە"
            error={errors.grade?.message}
            {...register('grade')}
          />

          <Input
            label="بڕی پارەی کرێی خوێندن (بڕی پارە) *"
            id="tuition_price"
            type="number"
            placeholder="بۆ نموونە: ١٥٠٠٠٠٠"
            error={errors.tuition_price?.message}
            {...register('tuition_price')}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              پاشگەزبوونەوە
            </Button>
            <Button type="submit" variant="primary" isLoading={createStudentMutation.isPending}>
              تۆمارکردن
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="سڕینەوەی قوتابی"
        message="ئایا دڵنیای لە سڕینەوەی ئەم قوتابییە؟ ئەم کردارە زانیاری قوتابییەکە دەسڕێتەوە بەڵام تۆماری داراییەکانی دەپارێزێت."
        isLoading={deleteStudentMutation.isPending}
      />
    </div>
  );
}

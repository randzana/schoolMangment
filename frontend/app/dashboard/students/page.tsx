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
  serial_number: zod.string().min(1, 'Serial number is required').max(20, 'Max 20 characters'),
  full_name: zod.string().min(1, 'Full name is required').max(150, 'Max 150 characters'),
  grade: zod.enum(['one', 'two', 'three', 'four', 'five'], {
    message: 'Grade level is required',
  }),
  phone: zod.string().max(30, 'Max 30 characters').optional().or(zod.literal('')),
  address: zod.string().optional(),
  notes: zod.string().optional(),
});

type StudentFormValues = zod.infer<typeof studentSchema>;

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
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
  });

  const onSubmit = (values: StudentFormValues) => {
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

  const handleExportCsv = () => {
    if (!studentsData?.data) return;
    const headers = 'Serial No,Name,Grade,Study Balance,Food Balance,Phone,Address\n';
    const rows = studentsData.data
      .map((student) =>
        [
          student.serial_number,
          `"${student.full_name}"`,
          gradeDisplay(student.grade),
          student.study_balance || 0,
          student.food_balance || 0,
          student.phone || '',
          `"${student.address || ''}"`,
        ].join(',')
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students_list_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const columns: Column<any>[] = [
    { header: 'Serial No', accessor: 'serial_number', sortable: true },
    { header: 'Name', accessor: 'full_name', sortable: true },
    { header: 'Grade', accessor: (row) => gradeDisplay(row.grade) },
    { header: 'Study Balance', accessor: (row) => formatCurrency(row.study_balance || 0) },
    { header: 'Food Balance', accessor: (row) => formatCurrency(row.food_balance || 0) },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/students/${row.id}`)}
            title="View Details"
          >
            <HiOutlineEye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger-light"
            onClick={() => setDeleteId(row.id)}
            title="Delete Student"
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
          <h1 className="text-2xl font-bold tracking-tight text-text">Students</h1>
          <p className="text-xs text-text-muted">Manage student records, demographics, and registration details</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExportCsv}>
            Export List
          </Button>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1.5">
            <HiOutlineUserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-border rounded-xl shadow-card">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search student by name or serial number..."
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
            <option value="">All Grades</option>
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
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Student" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Serial Number *"
            id="serial_number"
            placeholder="e.g. 4947492"
            error={errors.serial_number?.message}
            {...register('serial_number')}
          />

          <Input
            label="Full Name *"
            id="full_name"
            placeholder="Kurdish/Arabic or English full name"
            error={errors.full_name?.message}
            {...register('full_name')}
          />

          <Select
            label="Grade Level *"
            id="grade"
            options={GRADE_OPTIONS}
            placeholder="Select a grade"
            error={errors.grade?.message}
            {...register('grade')}
          />

          <Input
            label="Phone"
            id="phone"
            placeholder="e.g. 0750 123 4567"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Address"
            id="address"
            placeholder="Kurdish Region, Erbil, Ankawa..."
            error={errors.address?.message}
            {...register('address')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-text">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Any additional details or special comments"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createStudentMutation.isPending}>
              Create Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action soft-deletes the record and preserves their historical payment transactions."
        isLoading={deleteStudentMutation.isPending}
      />
    </div>
  );
}

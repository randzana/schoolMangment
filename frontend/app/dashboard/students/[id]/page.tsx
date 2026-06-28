'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useStudent, useUpdateStudent } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate, GRADE_OPTIONS, gradeDisplay } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { HiOutlineUser, HiOutlineMapPin, HiOutlinePhone, HiOutlinePencilSquare, HiOutlineArrowLeft } from 'react-icons/hi2';

const updateStudentSchema = zod.object({
  serial_number: zod.string().min(1, 'Serial number is required').max(20),
  full_name: zod.string().min(1, 'Full name is required').max(150),
  grade: zod.enum(['one', 'two', 'three', 'four', 'five']),
  phone: zod.string().max(30).optional().or(zod.literal('')),
  address: zod.string().optional(),
  notes: zod.string().optional(),
  is_active: zod.boolean().optional(),
});

type UpdateStudentFormValues = zod.infer<typeof updateStudentSchema>;

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string, 10);

  const { data: response, isLoading, error } = useStudent(id);
  const updateMutation = useUpdateStudent(id);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const student = response?.data;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateStudentFormValues>({
    resolver: zodResolver(updateStudentSchema),
  });

  // Open edit modal and populate values
  const openEditModal = () => {
    if (!student) return;
    reset({
      serial_number: student.serial_number,
      full_name: student.full_name,
      grade: student.grade,
      phone: student.phone || '',
      address: student.address || '',
      notes: student.notes || '',
      is_active: student.is_active,
    });
    setIsEditModalOpen(true);
  };

  const onSubmit = (values: UpdateStudentFormValues) => {
    updateMutation.mutate(values, {
      onSuccess: () => setIsEditModalOpen(false),
    });
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-40">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6 text-center text-danger font-medium border border-danger/20 rounded-xl bg-danger/5">
        Failed to load student details. Record might not exist.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard/students')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text cursor-pointer transition-colors"
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        <span>Back to Students</span>
      </button>

      {/* Hero card */}
      <div className="bg-white border border-border p-6 rounded-xl shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10 text-primary">
            <HiOutlineUser className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text">{student.full_name}</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${student.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {student.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Serial No: <span className="font-semibold text-text font-mono">{student.serial_number}</span> · Grade Level: <span className="font-semibold text-text">{gradeDisplay(student.grade)}</span>
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={openEditModal} className="flex items-center gap-1.5 w-full md:w-auto">
          <HiOutlinePencilSquare className="w-4 h-4" />
          <span>Edit Profile</span>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Stats */}
        <div className="bg-white border border-border rounded-xl shadow-card p-6 space-y-4">
          <h3 className="font-semibold text-sm text-text border-b pb-2">Contact & Details</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-text">
              <HiOutlinePhone className="w-4.5 h-4.5 text-text-light flex-shrink-0" />
              <div>
                <p className="font-semibold text-text-muted">Phone Number</p>
                <p className="mt-0.5">{student.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-text">
              <HiOutlineMapPin className="w-4.5 h-4.5 text-text-light flex-shrink-0" />
              <div>
                <p className="font-semibold text-text-muted">Home Address</p>
                <p className="mt-0.5">{student.address || '-'}</p>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t text-xs">
            <p className="font-semibold text-text-muted mb-1">Administrative Notes</p>
            <p className="text-text-muted italic bg-surface-muted p-2.5 rounded-lg border border-border">
              {student.notes || 'No administrative notes found.'}
            </p>
          </div>
        </div>

        {/* Payment Summary Panels */}
        <div className="md:col-span-2 space-y-6">
          {/* Tuition Payment Summary */}
          <div className="bg-white border border-border rounded-xl shadow-card p-6">
            <h3 className="font-semibold text-sm text-text border-b pb-2 mb-4">Study Payments (Annual Tuition)</h3>
            {student.study_payments && student.study_payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-xs text-left">
                  <thead>
                    <tr className="text-text-muted font-semibold bg-surface-muted">
                      <th className="px-4 py-2">Year</th>
                      <th className="px-4 py-2">Annual Price</th>
                      <th className="px-4 py-2">Discount</th>
                      <th className="px-4 py-2">Net Price</th>
                      <th className="px-4 py-2">Total Paid</th>
                      <th className="px-4 py-2">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {student.study_payments.map((sp) => (
                      <tr key={sp.id} className="hover:bg-surface-muted/50">
                        <td className="px-4 py-2.5 font-semibold text-text">{sp.academic_year}</td>
                        <td className="px-4 py-2.5 font-mono">{formatCurrency(sp.annual_price)}</td>
                        <td className="px-4 py-2.5 font-mono text-danger">-{formatCurrency(sp.discount)}</td>
                        <td className="px-4 py-2.5 font-mono font-semibold">{formatCurrency(sp.price_after_discount)}</td>
                        <td className="px-4 py-2.5 font-mono text-success font-semibold">{formatCurrency(sp.total_paid)}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-danger">{formatCurrency(sp.remain_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-text-muted text-center py-6">No study payments recorded.</p>
            )}
          </div>

          {/* Food Payment Summary */}
          <div className="bg-white border border-border rounded-xl shadow-card p-6">
            <h3 className="font-semibold text-sm text-text border-b pb-2 mb-4">Food Payments (Monthly meal subscription)</h3>
            {student.food_payments && student.food_payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-xs text-left">
                  <thead>
                    <tr className="text-text-muted font-semibold bg-surface-muted">
                      <th className="px-4 py-2">Year</th>
                      <th className="px-4 py-2">Monthly Rate</th>
                      <th className="px-4 py-2">Discount</th>
                      <th className="px-4 py-2">Net Rate</th>
                      <th className="px-4 py-2">Total Paid</th>
                      <th className="px-4 py-2">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {student.food_payments.map((fp) => (
                      <tr key={fp.id} className="hover:bg-surface-muted/50">
                        <td className="px-4 py-2.5 font-semibold text-text">{fp.academic_year}</td>
                        <td className="px-4 py-2.5 font-mono">{formatCurrency(fp.monthly_price)}</td>
                        <td className="px-4 py-2.5 font-mono text-danger">-{formatCurrency(fp.discount)}</td>
                        <td className="px-4 py-2.5 font-mono font-semibold">{formatCurrency(fp.price_after_discount)}</td>
                        <td className="px-4 py-2.5 font-mono text-success font-semibold">{formatCurrency(fp.total_paid)}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-danger">{formatCurrency(fp.remain_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-text-muted text-center py-6">No food payments recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tuition installments history */}
        <div className="bg-white border border-border rounded-xl shadow-card p-6">
          <h3 className="font-semibold text-sm text-text border-b pb-2 mb-4">Study Installment Transactions</h3>
          {student.study_installments && student.study_installments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-xs text-left">
                <thead>
                  <tr className="text-text-muted font-semibold bg-surface-muted">
                    <th className="px-4 py-2">Invoice</th>
                    <th className="px-4 py-2">Amount Paid</th>
                    <th className="px-4 py-2">Remaining After</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {student.study_installments.map((inst) => (
                    <tr key={inst.id} className={`hover:bg-surface-muted/50 ${inst.is_returned ? 'line-through text-danger bg-red-50/20' : ''}`}>
                      <td className="px-4 py-2.5 font-semibold font-mono">#{inst.invoice_no}</td>
                      <td className="px-4 py-2.5 font-mono text-primary font-bold">{formatCurrency(inst.amount_paid)}</td>
                      <td className="px-4 py-2.5 font-mono">{formatCurrency(inst.remain_after)}</td>
                      <td className="px-4 py-2.5">{formatDate(inst.payment_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-6">No tuition installment transactions recorded.</p>
          )}
        </div>

        {/* Food installments history */}
        <div className="bg-white border border-border rounded-xl shadow-card p-6">
          <h3 className="font-semibold text-sm text-text border-b pb-2 mb-4">Food Installment Transactions</h3>
          {student.food_installments && student.food_installments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-xs text-left">
                <thead>
                  <tr className="text-text-muted font-semibold bg-surface-muted">
                    <th className="px-4 py-2">Invoice</th>
                    <th className="px-4 py-2">Amount Paid</th>
                    <th className="px-4 py-2">Remaining After</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {student.food_installments.map((inst) => (
                    <tr key={inst.id} className={`hover:bg-surface-muted/50 ${inst.is_returned ? 'line-through text-danger bg-red-50/20' : ''}`}>
                      <td className="px-4 py-2.5 font-semibold font-mono">#{inst.invoice_no}</td>
                      <td className="px-4 py-2.5 font-mono text-primary font-bold">{formatCurrency(inst.amount_paid)}</td>
                      <td className="px-4 py-2.5 font-mono">{formatCurrency(inst.remain_after)}</td>
                      <td className="px-4 py-2.5">{formatDate(inst.payment_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-6">No food installment transactions recorded.</p>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Student Profile">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Serial Number *"
            id="serial_number"
            error={errors.serial_number?.message}
            {...register('serial_number')}
          />

          <Input
            label="Full Name *"
            id="full_name"
            error={errors.full_name?.message}
            {...register('full_name')}
          />

          <Select
            label="Grade Level *"
            id="grade"
            options={GRADE_OPTIONS}
            error={errors.grade?.message}
            {...register('grade')}
          />

          <Input
            label="Phone"
            id="phone"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Address"
            id="address"
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
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
              {...register('notes')}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              className="rounded text-primary border-border focus:ring-primary-light/25 w-4 h-4 cursor-pointer"
              {...register('is_active')}
            />
            <label htmlFor="is_active" className="text-xs font-semibold text-text cursor-pointer select-none">
              Account is Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateMutation.isPending}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

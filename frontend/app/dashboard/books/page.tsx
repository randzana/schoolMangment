'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useQuery } from '@tanstack/react-query';
import api, { API_URL } from '@/lib/api';
import { InventoryItem, ClothesBookPayment } from '@/types';
import { useClothesBooks, useCreateClothesBook, useDeleteClothesBook, useCreateBulkBooks, useUpdateClothesBook } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { AutocompleteInput } from '@/components/forms/AutocompleteInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, formatDate, GRADE_MAP } from '@/lib/utils';
import { HiOutlinePrinter, HiOutlineTrash, HiOutlinePlusCircle, HiOutlinePencil } from 'react-icons/hi2';

const purchaseSchema = zod.object({
  student_id: zod.number().min(1, 'تکایە قوتابییەک هەڵبژێرە'),
  amount_paid: zod.number().min(0, 'بڕی پێویست نییە'),
  book_subject: zod.string().min(1, 'تکایە بابەتی کتێب دیاری بکە'),
  notes: zod.string().optional(),
});

type PurchaseFormValues = zod.infer<typeof purchaseSchema>;

export default function BooksPage() {
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedStudentGrade, setSelectedStudentGrade] = useState<string | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<any | null>(null);

  const { data: purchasesData, isLoading, refetch } = useClothesBooks({ page, item_type: 'book' });
  const createMutation = useCreateClothesBook();
  const deleteMutation = useDeleteClothesBook();
  const bulkMutation = useCreateBulkBooks();

  // Fetch books inventory
  const { data: inventory } = useQuery<InventoryItem[]>({
    queryKey: ['inventory-list-books'],
    queryFn: async () => {
      const res = await api.get('/inventory?item_type=book');
      return res.data.data;
    },
  });

  const bookOptions = useMemo(() => {
    if (!inventory) return [];
    const filtered = inventory.filter(
      (item) => !selectedStudentGrade || !item.grade || item.grade === selectedStudentGrade
    );
    const mapped = filtered.map((item) => {
      const subjectName = item.name.replace('Book: ', '');
      const gradeSuffix = item.grade ? ` (${GRADE_MAP[item.grade] || item.grade})` : '';
      return {
        value: subjectName,
        label: `${subjectName}${gradeSuffix} (مەوجود: ${item.quantity} دانە)`,
      };
    });

    if (selectedStudentGrade && filtered.length > 0) {
      const gradeName = GRADE_MAP[selectedStudentGrade] || selectedStudentGrade;
      mapped.unshift({
        value: 'all_books',
        label: `📚 هەموو کتێبەکانی ${gradeName} (${filtered.length} کتێب)`,
      });
    }

    return mapped;
  }, [inventory, selectedStudentGrade]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      amount_paid: 0,
      book_subject: '',
      notes: '',
    },
  });

  const watchSubject = watch('book_subject');
  const watchAmountPaid = watch('amount_paid') || 0;

  // Auto-populate price based on selected subject/book from inventory
  useEffect(() => {
    if (!watchSubject || !inventory) return;

    if (watchSubject === 'all_books') {
      const totalGradeBooksPrice = inventory
        .filter((item) => item.grade === selectedStudentGrade && item.item_type === 'book')
        .reduce((sum, item) => sum + Number(item.price || 0), 0);

      setValue('amount_paid', totalGradeBooksPrice);
    } else {
      const bookItem = inventory.find(
        (item) => item.item_type === 'book' && 
                  item.name.replace('Book: ', '') === watchSubject && 
                  (!selectedStudentGrade || item.grade === selectedStudentGrade)
      );
      if (bookItem) {
        setValue('amount_paid', Number(bookItem.price || 0));
      }
    }
  }, [watchSubject, inventory, selectedStudentGrade, setValue]);

  const openAddModal = () => {
    reset({
      student_id: 0,
      amount_paid: 0,
      book_subject: '',
      notes: '',
    });
    setSelectedStudentGrade(null);
    setIsFormOpen(true);
  };

  const onSubmit = (values: PurchaseFormValues) => {
    if (values.book_subject === 'all_books') {
      bulkMutation.mutate(
        {
          student_id: values.student_id,
          notes: values.notes || undefined,
          price: values.amount_paid,
        },
        {
          onSuccess: (res) => {
            setIsFormOpen(false);
            refetch();
            const payments = res.data;
            if (payments && payments.length > 0) {
              const lastPayment = payments[payments.length - 1];
              window.open(`${API_URL}/clothes-books/${lastPayment.id}/invoice`, '_blank');
            }
          },
        }
      );
    } else {
      const payload = {
        student_id: values.student_id,
        item_type: 'book' as const,
        price: values.amount_paid,
        discount: 0,
        amount_paid: values.amount_paid,
        payment_date: new Date().toISOString().split('T')[0],
        book_subject: values.book_subject,
        notes: values.notes || '',
      };

      createMutation.mutate(payload, {
        onSuccess: (res) => {
          setIsFormOpen(false);
          refetch();
          const created = res.data;
          window.open(`${API_URL}/clothes-books/${created.id}/invoice`, '_blank');
        },
      });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          refetch();
        },
      });
    }
  };

  const columns: Column<ClothesBookPayment>[] = [
    { header: 'ژمارەی پسوولە', accessor: (row) => row.invoice_no ? `#${row.invoice_no}` : '-', sortable: true },
    { header: 'ناوی قوتابی', accessor: (row) => row.student?.full_name || '-' },
    { header: 'پۆل', accessor: (row) => row.student?.grade ? GRADE_MAP[row.student.grade] || row.student.grade : '-' },
    { header: 'بابەتی کتێب', accessor: (row) => row.book_subject || '-' },
    { header: 'بڕی دراو', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-success font-semibold' },
    { header: 'بەروار', accessor: (row) => formatDate(row.payment_date), sortable: true },
    {
      header: 'کردارەکان',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`${API_URL}/clothes-books/${row.id}/invoice`, '_blank')}
            title="چاپکردنەوەی پسوولە"
          >
            <HiOutlinePrinter className="w-4 h-4" />
          </Button>
          {row.book_subject !== 'سەرجەم کتێبەکان' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary-light"
              onClick={() => setEditingPurchase(row)}
              title="دەستکاریکردنی تۆمار"
            >
              <HiOutlinePencil className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger-light"
            onClick={() => setDeleteId(row.id)}
            title="سڕینەوەی کڕین"
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
          <h1 className="text-2xl font-bold tracking-tight text-text">کتێب</h1>
          <p className="text-xs text-text-muted">تۆمارکردنی مامەڵەکانی فرۆشتنی کتێبی خوێندن</p>
        </div>
        <Button variant="primary" onClick={openAddModal} className="flex items-center gap-1.5 self-start font-semibold">
          <HiOutlinePlusCircle className="w-4 h-4" />
          <span>تۆمارکردنی فرۆشتن</span>
        </Button>
      </div>

      {/* History Data Table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <DataTable
          columns={columns}
          data={purchasesData?.data || []}
          isLoading={isLoading}
        />
        {purchasesData && (
          <TablePagination
            currentPage={page}
            lastPage={purchasesData.meta.last_page}
            onPageChange={setPage}
            total={purchasesData.meta.total}
            perPage={purchasesData.meta.per_page}
          />
        )}
      </div>

      {/* Record Book Purchase Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="تۆمارکردنی فرۆشتنی کتێب">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AutocompleteInput
            label="قوتابی هەڵبژێرە *"
            onSelect={(student) => {
              setValue('student_id', student.id);
              setSelectedStudentGrade(student.grade);
            }}
            error={errors.student_id?.message}
          />

          <Select
            label="بابەتی کتێب *"
            placeholder="بابەتی کتێب هەڵبژێرە"
            options={bookOptions}
            error={errors.book_subject?.message}
            {...register('book_subject')}
          />

          <Input
            label={watchSubject === 'all_books' ? "کۆی گشتی نرخی سەرجەم کتێبەکان (دینار) *" : "نرخی کتێب (دینار) *"}
            id="amount_paid"
            type="number"
            readOnly={false}
            className="font-semibold text-primary"
            placeholder="نرخەکە لێرە بنووسە"
            error={errors.amount_paid?.message}
            {...register('amount_paid', { valueAsNumber: true })}
          />

          {watchSubject === 'all_books' && selectedStudentGrade && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700 font-semibold">کۆ گشتی:</span>
                <span className="text-blue-900 font-bold">
                  {formatCurrency(watchAmountPaid)}
                  <span className="text-xs text-blue-600 mr-1">
                    (بۆ هەموو کتێبەکانی ئەم پۆلە)
                  </span>
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-text">
              تێبینی
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="بۆ نموونە: تێبینییەکان لەم بەشە بنووسە"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 font-semibold">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              پاشگەزبوونەوە
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending || bulkMutation.isPending}>
              تۆمارکردن و چاپ
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="سڕینەوەی تۆمار"
        message="ئایا دڵنیایت لە سڕینەوەی ئەم تۆمارە؟ ئەم کردارە بە هەمیشەیی تۆماری کڕینەکە دەسڕێتەوە و ڕێژەی کتێب لە کۆگادا زیاد دەکاتەوە."
        isLoading={deleteMutation.isPending}
      />

      {/* Edit Purchase Modal */}
      {editingPurchase && (
        <EditBookModal
          purchase={editingPurchase}
          inventory={inventory}
          onClose={() => setEditingPurchase(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

function EditBookModal({ purchase, inventory, onClose, onSuccess }: { purchase: any; inventory: any[] | undefined; onClose: () => void; onSuccess: () => void }) {
  const updateMutation = useUpdateClothesBook(purchase.id);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<{
    amount_paid: number;
    book_subject: string;
    payment_date: string;
    notes: string;
  }>({
    defaultValues: {
      amount_paid: Number(purchase.amount_paid),
      book_subject: purchase.book_subject || '',
      payment_date: purchase.payment_date ? new Date(purchase.payment_date).toISOString().split('T')[0] : '',
      notes: purchase.notes || '',
    }
  });

  const watchSubject = watch('book_subject');
  const studentGrade = purchase.student?.grade;

  const filteredBookOptions = useMemo(() => {
    if (!inventory) return [];
    const filtered = inventory.filter(
      (item) => !studentGrade || !item.grade || item.grade === studentGrade
    );
    const mapped = filtered.map((item) => {
      const subjectName = item.name.replace('Book: ', '');
      const gradeSuffix = item.grade ? ` (${GRADE_MAP[item.grade] || item.grade})` : '';
      return {
        value: subjectName,
        label: `${subjectName}${gradeSuffix} (مەوجود: ${item.quantity} دانە)`,
      };
    });
    return mapped;
  }, [inventory, studentGrade]);

  // Auto-populate price when book changes
  React.useEffect(() => {
    if (!watchSubject || !inventory) return;
    const bookItem = inventory.find(
      (item) => item.item_type === 'book' && 
                item.name.replace('Book: ', '') === watchSubject && 
                (!studentGrade || item.grade === studentGrade)
    );
    if (bookItem) {
      setValue('amount_paid', Number(bookItem.price || 0));
    }
  }, [watchSubject, inventory, studentGrade, setValue]);

  const onSubmit = (values: any) => {
    const payload = {
      amount_paid: values.amount_paid,
      price: values.amount_paid, // Sync price and amount_paid
      book_subject: values.book_subject,
      payment_date: values.payment_date,
      notes: values.notes || '',
    };

    updateMutation.mutate(payload, {
      onSuccess: () => {
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="دەستکاریکردنی کڕینی کتێب">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="بابەتی کتێب *"
          placeholder="بابەتی کتێب هەڵبژێرە"
          options={filteredBookOptions}
          error={errors.book_subject?.message}
          {...register('book_subject', { required: 'تکایە بابەتێک دیاری بکە' })}
        />
        <Input
          label="نرخی کتێب (دینار) *"
          id="edit_amount_paid"
          type="number"
          error={errors.amount_paid?.message}
          {...register('amount_paid', { valueAsNumber: true, required: 'تکایە بڕی پارەکە بنووسە' })}
        />
        <Input
          label="بەرواری پارەدان *"
          id="edit_payment_date"
          type="date"
          error={errors.payment_date?.message}
          {...register('payment_date', { required: 'تکایە بەروارەکە دیاری بکە' })}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit_notes" className="text-xs font-semibold text-text">
            تێبینی
          </label>
          <textarea
            id="edit_notes"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
            {...register('notes')}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2 font-semibold">
          <Button type="button" variant="secondary" onClick={onClose}>
            پاشگەزبوونەوە
          </Button>
          <Button type="submit" variant="primary" isLoading={updateMutation.isPending}>
            پاشەکەوتکردن
          </Button>
        </div>
      </form>
    </Modal>
  );
}

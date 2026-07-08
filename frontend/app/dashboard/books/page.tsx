'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useQuery } from '@tanstack/react-query';
import api, { API_URL } from '@/lib/api';
import { InventoryItem, ClothesBookPayment } from '@/types';
import { useClothesBooks, useCreateClothesBook, useDeleteClothesBook, useCreateBulkBooks } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { AutocompleteInput } from '@/components/forms/AutocompleteInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, formatDate, GRADE_MAP } from '@/lib/utils';
import { HiOutlinePrinter, HiOutlineTrash, HiOutlinePlusCircle, HiOutlineBookOpen } from 'react-icons/hi2';

const purchaseSchema = zod.object({
  student_id: zod.number().min(1, 'تکایە قوتابییەک هەڵبژێرە'),
  amount_paid: zod.number().min(1, 'دەبێت بڕی پارە لە ٠ زیاتر بێت'),
  book_subject: zod.string().min(1, 'تکایە بابەتی کتێب دیاری بکە'),
  notes: zod.string().optional(),
});

type PurchaseFormValues = zod.infer<typeof purchaseSchema>;

export default function BooksPage() {
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedStudentGrade, setSelectedStudentGrade] = useState<string | null>(null);

  // Bulk modal state
  const [bulkStudentId, setBulkStudentId] = useState<number | null>(null);
  const [bulkStudentName, setBulkStudentName] = useState('');
  const [bulkStudentGrade, setBulkStudentGrade] = useState<string | null>(null);
  const [bulkPricePerBook, setBulkPricePerBook] = useState<number>(0);
  const [bulkNotes, setBulkNotes] = useState('');

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

  // Books matching the bulk student's grade
  const bulkGradeBooks = useMemo(() => {
    if (!inventory || !bulkStudentGrade) return [];
    return inventory.filter(
      (item) => item.grade === bulkStudentGrade
    );
  }, [inventory, bulkStudentGrade]);

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

  const openBulkModal = () => {
    setBulkStudentId(null);
    setBulkStudentName('');
    setBulkStudentGrade(null);
    setBulkPricePerBook(0);
    setBulkNotes('');
    setIsBulkOpen(true);
  };

  const onSubmit = (values: PurchaseFormValues) => {
    if (values.book_subject === 'all_books') {
      bulkMutation.mutate(
        {
          student_id: values.student_id,
          price_per_book: values.amount_paid,
          notes: values.notes || undefined,
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

  const onBulkSubmit = () => {
    if (!bulkStudentId || bulkPricePerBook <= 0) return;

    bulkMutation.mutate(
      {
        student_id: bulkStudentId,
        price_per_book: bulkPricePerBook,
        notes: bulkNotes || undefined,
      },
      {
        onSuccess: (res) => {
          setIsBulkOpen(false);
          refetch();
          // Open the last created payment's invoice
          const payments = res.data;
          if (payments && payments.length > 0) {
            const lastPayment = payments[payments.length - 1];
            window.open(`${API_URL}/clothes-books/${lastPayment.id}/invoice`, '_blank');
          }
        },
      }
    );
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
        <div className="flex items-center gap-2 self-start">
          <Button variant="secondary" onClick={openBulkModal} className="flex items-center gap-1.5 font-semibold">
            <HiOutlineBookOpen className="w-4 h-4" />
            <span>کڕینی هەموو کتێبەکانی پۆل</span>
          </Button>
          <Button variant="primary" onClick={openAddModal} className="flex items-center gap-1.5 font-semibold">
            <HiOutlinePlusCircle className="w-4 h-4" />
            <span>تۆمارکردنی فرۆشتن</span>
          </Button>
        </div>
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

      {/* Record Single Purchase Modal */}
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
            label={watchSubject === 'all_books' ? "نرخی هەر کتێبێک (دینار) *" : "بڕی پارەی دراو (دینار) *"}
            id="amount_paid"
            type="number"
            placeholder={watchSubject === 'all_books' ? "بۆ نموونە: 5000" : "بڕی پارەی دراو لە ئێستادا"}
            error={errors.amount_paid?.message}
            {...register('amount_paid', { valueAsNumber: true })}
          />

          {watchSubject === 'all_books' && selectedStudentGrade && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700 font-semibold">کۆی گشتی:</span>
                <span className="text-blue-900 font-bold">
                  {formatCurrency(watchAmountPaid * (bookOptions.length - 1))}
                  <span className="text-xs text-blue-600 mr-1">
                    ({bookOptions.length - 1} کتێب × {formatCurrency(watchAmountPaid)})
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

      {/* Bulk Purchase Modal */}
      <Modal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} title="کڕینی هەموو کتێبەکانی پۆل">
        <div className="space-y-4">
          <AutocompleteInput
            label="قوتابی هەڵبژێرە *"
            onSelect={(student) => {
              setBulkStudentId(student.id);
              setBulkStudentName(student.full_name);
              setBulkStudentGrade(student.grade);
            }}
          />

          {bulkStudentGrade && (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-text">
                  {bulkStudentName} — {GRADE_MAP[bulkStudentGrade] || bulkStudentGrade}
                </span>
                <span className="text-xs text-text-muted">
                  {bulkGradeBooks.length} کتێب
                </span>
              </div>

              {bulkGradeBooks.length === 0 ? (
                <p className="text-sm text-amber-600 font-medium">
                  هیچ کتێبێک بۆ ئەم پۆلە لە کۆگادا تۆمار نەکراوە
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-right py-2 px-3 font-semibold text-text">#</th>
                        <th className="text-right py-2 px-3 font-semibold text-text">ناوی کتێب</th>
                        <th className="text-right py-2 px-3 font-semibold text-text">مەوجود</th>
                        <th className="text-right py-2 px-3 font-semibold text-text">بار</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkGradeBooks.map((book, i) => (
                        <tr key={book.id} className="border-t border-slate-100">
                          <td className="py-2 px-3 text-text-muted">{i + 1}</td>
                          <td className="py-2 px-3">{book.name.replace('Book: ', '')}</td>
                          <td className="py-2 px-3">{book.quantity} دانە</td>
                          <td className="py-2 px-3">
                            {book.quantity >= 1 ? (
                              <span className="text-green-600 font-medium">✓ بەردەستە</span>
                            ) : (
                              <span className="text-red-500 font-medium">✗ نییە</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <Input
            label="نرخی هەر کتێبێک (دینار) *"
            id="bulk_price"
            type="number"
            placeholder="بۆ نموونە: 5000"
            value={bulkPricePerBook || ''}
            onChange={(e) => setBulkPricePerBook(Number(e.target.value))}
          />

          {bulkGradeBooks.length > 0 && bulkPricePerBook > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700 font-semibold">کۆی گشتی:</span>
                <span className="text-blue-900 font-bold">
                  {formatCurrency(bulkPricePerBook * bulkGradeBooks.length)}
                  <span className="text-xs text-blue-600 mr-1">
                    ({bulkGradeBooks.length} کتێب × {formatCurrency(bulkPricePerBook)})
                  </span>
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bulk_notes" className="text-xs font-semibold text-text">
              تێبینی
            </label>
            <textarea
              id="bulk_notes"
              rows={2}
              placeholder="تێبینییەکان (ئیختیاری)"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
              value={bulkNotes}
              onChange={(e) => setBulkNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 font-semibold">
            <Button variant="secondary" onClick={() => setIsBulkOpen(false)}>
              پاشگەزبوونەوە
            </Button>
            <Button
              variant="primary"
              onClick={onBulkSubmit}
              isLoading={bulkMutation.isPending}
              disabled={!bulkStudentId || bulkPricePerBook <= 0 || bulkGradeBooks.length === 0}
            >
              تۆمارکردنی هەموو کتێبەکان
            </Button>
          </div>
        </div>
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
    </div>
  );
}

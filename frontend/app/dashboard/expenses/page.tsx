'use client';
 
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import { HiOutlinePlusCircle, HiOutlinePencilSquare as PencilIcon, HiOutlineTrash as TrashIcon } from 'react-icons/hi2';
 
const CATEGORY_OPTIONS = [
  { value: 'ڕاپۆرتی خەرجی حکومەت', label: 'ڕاپۆرتی خەرجی حکومەت' },
  { value: 'ڕاپۆرتی پارەی کارەبای حکومەت', label: 'ڕاپۆرتی پارەی کارەبای حکومەت' },
  { value: 'ڕاپۆرتی صیانەی بینا', label: 'ڕاپۆرتی صیانەی بینا' },
  { value: 'ڕاپۆرتی پێداویستی پەڕاوگە', label: 'ڕاپۆرتی پێداویستی پەڕاوگە' },
  { value: 'ڕاپۆرتی خەرجی مووچە', label: 'ڕاپۆرتی خەرجی مووچە' },
  { value: 'ڕاپۆرتی خەرجی سوتەمەنی', label: 'ڕاپۆرتی خەرجی سوتەمەنی' },
  { value: 'ڕاپۆرتی خەرجی کڕیی بینا', label: 'ڕاپۆرتی خەرجی کڕیی بینا' },
  { value: 'ڕاپۆرتی خەرجی بیمە', label: 'ڕاپۆرتی خەرجی بیمە' },
  { value: 'ڕاپۆرتی خەرجی باج', label: 'ڕاپۆرتی خەرجی باج' },
  { value: 'ڕاپۆرتی خەرجی مانگانەی قوتابخانە', label: 'ڕاپۆرتی خەرجی مانگانەی قوتابخانە' },
  { value: 'ڕاپۆرتی خەرجی نانخواردن', label: 'ڕاپۆرتی خەرجی نانخواردن' },
  { value: 'تر', label: 'تر (Other)' }
];

const MONTH_OPTIONS = [
  { value: 'کانوونی دووەم', label: 'کانوونی دووەم (١)' },
  { value: 'شوبات', label: 'شوبات (٢)' },
  { value: 'ئازار', label: 'ئازار (٣)' },
  { value: 'نیسان', label: 'نیسان (٤)' },
  { value: 'ئایار', label: 'ئایار (٥)' },
  { value: 'حوزەیران', label: 'حوزەیران (٦)' },
  { value: 'تەممووز', label: 'تەممووز (٧)' },
  { value: 'ئاب', label: 'ئاب (٨)' },
  { value: 'ئەیلوول', label: 'ئەیلوول (٩)' },
  { value: 'تشرینی یەکەم', label: 'تشرینی یەکەم (١٠)' },
  { value: 'تشرینی دووەم', label: 'تشرینی دووەم (١١)' },
  { value: 'کانوونی یەکەم', label: 'کانوونی یەکەم (١٢)' },
];

const getCurrentKurdishMonth = () => {
  const months = [
    'کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
    'تەممووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'
  ];
  const monthIndex = new Date().getMonth();
  return months[monthIndex];
};
 
const expenseSchema = zod.object({
  expense_date: zod.string().min(1, 'بەروار پێویستە بنووسرێت'),
  category: zod.string().min(1, 'پۆلێن پێویستە دیاری بکرێت').max(100),
  custom_category: zod.string().max(100).optional(),
  description: zod.string().optional(),
});
 
type ExpenseFormValues = zod.infer<typeof expenseSchema>;
 
interface ReceiptItem {
  name: string;
  amount: number;
  receipt_no: string;
  month?: string;
}
 
export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // Breakdown items state
  const [items, setItems] = useState<ReceiptItem[]>([
    { name: '', amount: 0, receipt_no: '', month: getCurrentKurdishMonth() }
  ]);
 
  const { data: expensesData, isLoading } = useExpenses({ page });
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense(editingExpense?.id || 0);
  const deleteMutation = useDeleteExpense();
 
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
  });
 
  const categoryValue = watch('category');
  const showMonthField = categoryValue === 'ڕاپۆرتی خەرجی نانخواردن' || categoryValue === 'ڕاپۆرتی خەرجی مانگانەی قوتابخانە';
 
  const handleAddItem = () => {
    setItems([...items, { name: '', amount: 0, receipt_no: '', month: getCurrentKurdishMonth() }]);
  };
 
  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems);
  };
 
  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    } as ReceiptItem;
    setItems(newItems);
  };
 
  const openAddModal = () => {
    setEditingExpense(null);
    setItems([{ name: '', amount: 0, receipt_no: '', month: getCurrentKurdishMonth() }]);
    reset({
      expense_date: new Date().toISOString().split('T')[0],
      category: '',
      custom_category: '',
      description: '',
    });
    setIsFormOpen(true);
  };
 
  const openEditModal = (expense: any) => {
    setEditingExpense(expense);
    const cat = expense.category || '';
    const isPreset = CATEGORY_OPTIONS.some(opt => opt.value === cat && opt.value !== 'تر');
    
    // Load existing items or default to a single row built from base expense fields
    const loadedItems = expense.items && Array.isArray(expense.items) && expense.items.length > 0
      ? expense.items.map((i: any) => ({
          name: i.name || '',
          amount: parseFloat(i.amount) || 0,
          receipt_no: i.receipt_no || '',
          month: i.month || ''
        }))
      : [{ name: expense.title || '', amount: parseFloat(expense.amount) || 0, receipt_no: expense.receipt_no || '', month: getCurrentKurdishMonth() }];
      
    setItems(loadedItems);
    
    reset({
      expense_date: expense.expense_date,
      category: isPreset || cat === '' ? cat : 'تر',
      custom_category: isPreset || cat === '' ? '' : cat,
      description: expense.description || '',
    });
    setIsFormOpen(true);
  };
 
  const onSubmit = (values: ExpenseFormValues) => {
    const finalCategory = values.category === 'تر' ? values.custom_category : values.category;
    const showMonthField = finalCategory === 'ڕاپۆرتی خەرجی نانخواردن' || finalCategory === 'ڕاپۆرتی خەرجی مانگانەی قوتابخانە';
    
    const finalItems = items.map(item => ({
      name: item.name,
      amount: item.amount,
      month: showMonthField ? item.month : undefined
    }));

    const totalAmount = finalItems.reduce((sum, item) => sum + (item.amount || 0), 0);
 
    const submitValues = {
      title: finalCategory || 'خەرجی',
      amount: totalAmount,
      expense_date: values.expense_date,
      category: finalCategory,
      description: values.description,
      receipt_no: '',
      items: finalItems
    };
 
    if (editingExpense) {
      updateMutation.mutate(submitValues, {
        onSuccess: () => setIsFormOpen(false),
      });
    } else {
      createMutation.mutate(submitValues, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };
 
  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };
 
  const columns: Column<any>[] = [
    { 
      header: 'پۆلێن / جۆری پسوولە', 
      accessor: (row) => (
        <div className="space-y-1">
          <span className="font-bold text-primary">{row.category || '-'}</span>
          {row.items && Array.isArray(row.items) && row.items.length > 0 && (
            <div className="text-[10px] bg-surface-muted border border-border/60 rounded-lg p-2 space-y-1 text-text mt-1">
              {row.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between gap-6 border-b border-border/20 last:border-b-0 py-0.5">
                  <span className="font-medium">• {item.name} {item.month ? ` [${item.month}]` : ''}</span>
                  <span className="font-mono text-danger font-bold">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
      className: 'w-[40%]'
    },
    { header: 'کۆی خەرجکراو', accessor: (row) => formatCurrency(row.amount), sortable: true, className: 'text-danger font-bold' },
    { header: 'بەروار', accessor: (row) => formatDate(row.expense_date), sortable: true },
    {
      header: 'کردارەکان',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            title="دەستکاریکردنی خەرجی"
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger-light"
            onClick={() => setDeleteId(row.id)}
            title="سڕینەوەی خەرجی"
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];
 
  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">خەرجییەکان</h1>
          <p className="text-xs text-text-muted">تۆمارکردن و سەلماندنی خەرجییە گشتییە کارگێڕی و خزمەتگوزارییەکانی قوتابخانە</p>
        </div>
        <Button variant="primary" onClick={openAddModal} className="flex items-center gap-1.5 self-start">
          <HiOutlinePlusCircle className="w-4 h-4" />
          <span>تۆمارکردنی خەرجی</span>
        </Button>
      </div>
 
      {/* Summary Cards */}
      {expensesData?.meta && (
        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
          <div className="bg-white border p-5 rounded-xl shadow-card">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">کۆی خەرجییەکانی ئەم مانگە</span>
            <p className="text-base font-bold text-danger mt-1">{formatCurrency((expensesData.meta as any).total_this_month)}</p>
          </div>
          <div className="bg-white border p-5 rounded-xl shadow-card">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">کۆی خەرجییەکانی ئەم ساڵ</span>
            <p className="text-base font-bold text-danger mt-1">{formatCurrency((expensesData.meta as any).total_this_year)}</p>
          </div>
        </div>
      )}
 
      {/* Table Section */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <DataTable
          columns={columns}
          data={expensesData?.data || []}
          isLoading={isLoading}
        />
        {expensesData && (
          <TablePagination
            currentPage={page}
            lastPage={expensesData.meta.last_page}
            onPageChange={setPage}
            total={expensesData.meta.total}
            perPage={expensesData.meta.per_page}
          />
        )}
      </div>
 
      {/* Record/Edit Expense Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingExpense ? 'دەستکاریکردنی خەرجی' : 'تۆمارکردنی خەرجی نوێ'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="جۆر / پۆلێنی پسوولە *"
              id="category"
              placeholder="پۆلێنێک هەڵبژێرە..."
              error={errors.category?.message}
              options={CATEGORY_OPTIONS}
              {...register('category')}
            />
 
            <Input
              label="بەرواری خەرجی *"
              id="expense_date"
              type="date"
              error={errors.expense_date?.message}
              {...register('expense_date')}
            />
          </div>
 
          {categoryValue === 'تر' && (
            <Input
              label="جۆر یان پۆلێنی تایبەت *"
              id="custom_category"
              placeholder="ناوی پۆلێن لێرە بنووسە..."
              error={errors.custom_category?.message}
              {...register('custom_category')}
            />
          )}
 
          {/* Breakdown Items List */}
          <div className="border border-border rounded-xl p-4 bg-surface-muted/50 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-text">شی کردنەوەی وەسڵەکان (Breakdown of Receipts)</span>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddItem} className="py-1 px-2.5 text-xs">
                + زیادکردنی پسوولە
              </Button>
            </div>
            
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-white p-2 border rounded-lg shadow-sm">
                  <div className="flex-[2]">
                    <label className="text-[10px] text-text-light font-semibold mb-0.5 block">ناوی پسوولە</label>
                    <input
                      type="text"
                      placeholder="ناوی بابەت (وەک: کرێی گاز)"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded text-xs bg-white text-text border-border focus:outline-none focus:border-primary-light"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-text-light font-semibold mb-0.5 block">بڕی پارە (IQD)</label>
                    <input
                      type="number"
                      placeholder="بڕ"
                      value={item.amount || ''}
                      onChange={(e) => handleItemChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 border rounded text-xs bg-white text-text border-border focus:outline-none focus:border-primary-light"
                      required
                    />
                  </div>
                  {showMonthField && (
                    <div className="flex-1">
                      <label className="text-[10px] text-text-light font-semibold mb-0.5 block">مانگی پسوولە</label>
                      <select
                        value={item.month || ''}
                        onChange={(e) => handleItemChange(idx, 'month', e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-xs bg-white text-text border-border focus:outline-none focus:border-primary-light"
                      >
                        <option value="">مانگ...</option>
                        {MONTH_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {items.length > 1 && (
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-danger hover:bg-danger-light p-1.5 rounded transition-all mt-0.5 block"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
 
          <Input
            label="کۆی گشتی خەرجییەکان (ماتماتیکییەن ئەژمار دەکرێت)"
            id="amount_display"
            type="text"
            value={formatCurrency(items.reduce((sum, item) => sum + (item.amount || 0), 0))}
            disabled
            className="bg-surface-muted font-bold text-danger"
          />
 
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-text">
              تێبینی / وەسف
            </label>
            <textarea
              id="description"
              rows={2}
              placeholder="تێبینی یان ڕوونکردنەوەی زیاتر لێرە بنووسە..."
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
              {...register('description')}
            />
          </div>
 
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              پاشگەزبوونەوە
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingExpense ? 'پاشەکەوتکردنی گۆڕانکارییەکان' : 'تۆمارکردنی خەرجی'}
            </Button>
          </div>
        </form>
      </Modal>
 
      {/* Delete Confirm Dialog */}
      <ConfirmDialog
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="سڕینەوەی خەرجی"
          message="ئایا دڵنیایت لە سڕینەوەی ئەم تۆماری خەرجییە؟ ئەم کردارە تۆمارەکە بە شێوەیەکی کاتی دەسڕێتەوە."
          isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { API_URL } from '@/lib/api';
import { InventoryItem, ClothesBookPayment, StudentSearch } from '@/types';
import { useClothesBooks, useCreateClothesBook, useDeleteClothesBook, useUpdateClothesBook } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { AutocompleteInput } from '@/components/forms/AutocompleteInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, formatDate, GRADE_MAP } from '@/lib/utils';
import {
  HiOutlinePrinter,
  HiOutlineTrash,
  HiOutlinePlusCircle,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineShoppingBag,
} from 'react-icons/hi2';

interface ClothesItemRow {
  uniform_size: string;
  quantity: number;
  price?: number;
}

export default function ClothesPage() {
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<ClothesBookPayment | null>(null);

  const { data: purchasesData, isLoading, refetch } = useClothesBooks({ page, item_type: 'clothes' });
  const createMutation = useCreateClothesBook();
  const deleteMutation = useDeleteClothesBook();

  // Fetch clothes inventory
  const { data: inventory } = useQuery<InventoryItem[]>({
    queryKey: ['inventory-list-clothes'],
    queryFn: async () => {
      const res = await api.get('/inventory?item_type=clothes');
      return res.data.data;
    },
  });

  const typeOptions = useMemo(() => {
    if (!inventory) return [];
    return inventory.map((item) => {
      const typeName = item.name.replace(/^Uniform Size\s*/i, '');
      const priceNum = Number(item.price) || 0;
      return {
        value: typeName,
        label: `${typeName} (بەردەست: ${item.quantity} دانە${priceNum > 0 ? ` - ${formatCurrency(priceNum)}` : ''})`,
        rawPrice: priceNum,
        stock: item.quantity,
      };
    });
  }, [inventory]);

  // Price lookup map for types
  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    typeOptions.forEach((opt) => {
      map.set(opt.value, opt.rawPrice);
    });
    return map;
  }, [typeOptions]);

  // State for Add Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentSearch | null>(null);
  const [items, setItems] = useState<ClothesItemRow[]>([
    { uniform_size: '', quantity: 1, price: 0 },
  ]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isAmountManuallyEdited, setIsAmountManuallyEdited] = useState(false);
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<{ student?: string; items?: string; amount?: string }>({});

  const totalPieces = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [items]);

  const estimatedTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const unitPrice = priceMap.get(item.uniform_size) || 0;
      return sum + (Number(item.quantity) || 0) * unitPrice;
    }, 0);
  }, [items, priceMap]);

  // Recalculate amount paid if not manually overwritten
  useEffect(() => {
    if (!isAmountManuallyEdited && estimatedTotal > 0) {
      setAmountPaid(estimatedTotal);
    }
  }, [estimatedTotal, isAmountManuallyEdited]);

  const openAddModal = () => {
    setSelectedStudent(null);
    setItems([{ uniform_size: '', quantity: 1, price: 0 }]);
    setAmountPaid(0);
    setIsAmountManuallyEdited(false);
    setNotes('');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { uniform_size: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ClothesItemRow, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'uniform_size') {
        const p = priceMap.get(value) || 0;
        updated[index].price = p;
      }
      return updated;
    });
    setFormErrors((prev) => ({ ...prev, items: undefined }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { student?: string; items?: string; amount?: string } = {};

    if (!selectedStudent || !selectedStudent.id) {
      errors.student = 'تکایە قوتابییەک هەڵبژێرە';
    }

    const hasEmptyItem = items.some((it) => !it.uniform_size.trim());
    if (hasEmptyItem) {
      errors.items = 'تکایە جۆری جلوبەرگ بۆ هەموو بڕگەکان دیاری بکە';
    }

    const hasInvalidQty = items.some((it) => !it.quantity || it.quantity < 1);
    if (hasInvalidQty) {
      errors.items = 'ژمارەی دانەکان دەبێت لانیکەم ١ دانە بێت';
    }

    if (amountPaid < 0 || isNaN(amountPaid)) {
      errors.amount = 'بڕی پارە دەبێت ژمارەیەکی دروست بێت';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      student_id: selectedStudent!.id,
      item_type: 'clothes' as const,
      price: amountPaid,
      discount: 0,
      amount_paid: amountPaid,
      payment_date: new Date().toISOString().split('T')[0],
      items: items.map((it) => ({
        uniform_size: it.uniform_size,
        quantity: Number(it.quantity) || 1,
        price: it.price || 0,
      })),
      quantity: totalPieces,
      notes: notes || '',
    };

    createMutation.mutate(payload, {
      onSuccess: (res) => {
        setIsFormOpen(false);
        refetch();
        const created = res.data;
        window.open(`${API_URL}/clothes-books/${created.id}/invoice`, '_blank');
      },
    });
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
    {
      header: 'جۆری جلوبەرگ',
      accessor: (row) => {
        if (row.items && Array.isArray(row.items) && row.items.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {row.items.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {item.uniform_size}
                  {item.quantity > 1 ? ` (${item.quantity} دانە)` : ''}
                </span>
              ))}
            </div>
          );
        }
        return row.uniform_size || '-';
      },
    },
    { header: 'ژمارەی دانە', accessor: (row) => `${row.quantity ?? 1} دانە` },
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
            className="text-primary hover:bg-primary-light"
            onClick={() => setEditingPurchase(row)}
            title="دەستکاریکردنی تۆمار"
          >
            <HiOutlinePencil className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold tracking-tight text-text">جلوبەرگ</h1>
          <p className="text-xs text-text-muted">تۆمارکردنی فرۆشتنی جۆرە جیاوازەکانی جلوبەرگ بەپێی دانە و پسوولە</p>
        </div>
        <Button variant="primary" onClick={openAddModal} className="flex items-center gap-1.5 self-start font-semibold shadow-sm">
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

      {/* Record Purchase Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="تۆمارکردنی فرۆشتنی جلوبەرگ">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <AutocompleteInput
            label="قوتابی هەڵبژێرە *"
            onSelect={(student) => {
              setSelectedStudent(student);
              setFormErrors((prev) => ({ ...prev, student: undefined }));
            }}
            error={formErrors.student}
          />

          {/* Clothes Items Section */}
          <div className="bg-surface-muted/60 border border-border rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                <HiOutlineShoppingBag className="w-4 h-4 text-primary" />
                <span>جۆرەکانی جلوبەرگ و ڕێژە</span>
              </div>
              <span className="text-[11px] font-semibold text-text-muted bg-white px-2 py-0.5 rounded border border-border">
                کۆی گشتی: <strong className="text-primary">{totalPieces}</strong> دانە
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-0.5">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-border/80 shadow-xs">
                  <div className="flex-1">
                    <Select
                      label=""
                      placeholder="جۆری جلوبەرگ هەڵبژێرە"
                      options={typeOptions}
                      value={item.uniform_size}
                      onChange={(e) => handleItemChange(index, 'uniform_size', e.target.value)}
                    />
                  </div>

                  <div className="w-24">
                    <Input
                      label=""
                      type="number"
                      min={1}
                      step={1}
                      placeholder="دانە"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-danger hover:bg-danger-light rounded-lg transition-colors cursor-pointer"
                      title="سڕینەوەی ئەم جۆرە"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {formErrors.items && (
              <p className="text-xs text-danger font-medium mt-1">{formErrors.items}</p>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddItem}
              className="w-full flex items-center justify-center gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary-light"
            >
              <HiOutlinePlus className="w-3.5 h-3.5" />
              <span>زیادکردنی جۆرێکی تر</span>
            </Button>
          </div>

          {/* Amount and notes */}
          <div>
            <Input
              label="بڕی پارەی دراو (دینار) *"
              id="amount_paid"
              type="number"
              min={0}
              placeholder="بڕی پارەی دراو لە ئێستادا"
              value={amountPaid === 0 && !isAmountManuallyEdited ? '' : amountPaid}
              error={formErrors.amount}
              onChange={(e) => {
                setIsAmountManuallyEdited(true);
                setAmountPaid(parseFloat(e.target.value) || 0);
                setFormErrors((prev) => ({ ...prev, amount: undefined }));
              }}
            />
            {estimatedTotal > 0 && isAmountManuallyEdited && (
              <p className="text-[11px] text-text-muted mt-1">
                کۆی خەمڵێنراوی کۆگا: {formatCurrency(estimatedTotal)}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-text">
              تێبینی
            </label>
            <textarea
              id="notes"
              rows={2}
              placeholder="تێبینی بنووسە ئەگەر پێویست بکات..."
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 font-semibold">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              پاشگەزبوونەوە
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
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
        message="ئایا دڵنیایت لە سڕینەوەی ئەم تۆمارە؟ ئەم کردارە بە هەمیشەیی تۆماری کڕینەکە دەسڕێتەوە و ژمارەی هەموو دانە فرۆشراوەکان دەگەڕێنێتەوە کۆگا."
        isLoading={deleteMutation.isPending}
      />

      {/* Edit Purchase Modal */}
      {editingPurchase && (
        <EditClothesModal
          purchase={editingPurchase}
          typeOptions={typeOptions}
          priceMap={priceMap}
          onClose={() => setEditingPurchase(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

function EditClothesModal({
  purchase,
  typeOptions,
  priceMap,
  onClose,
  onSuccess,
}: {
  purchase: ClothesBookPayment;
  typeOptions: { value: string; label: string; rawPrice: number; stock: number }[];
  priceMap: Map<string, number>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const updateMutation = useUpdateClothesBook(purchase.id);

  // Initialize items from existing purchase (multi-item or single item fallback)
  const initialItems: ClothesItemRow[] = useMemo(() => {
    if (purchase.items && Array.isArray(purchase.items) && purchase.items.length > 0) {
      return purchase.items.map((it) => ({
        uniform_size: it.uniform_size,
        quantity: Number(it.quantity) || 1,
        price: it.price || priceMap.get(it.uniform_size) || 0,
      }));
    }
    return [
      {
        uniform_size: purchase.uniform_size || '',
        quantity: Number(purchase.quantity) || 1,
        price: priceMap.get(purchase.uniform_size || '') || 0,
      },
    ];
  }, [purchase, priceMap]);

  const [items, setItems] = useState<ClothesItemRow[]>(initialItems);
  const [amountPaid, setAmountPaid] = useState<number>(Number(purchase.amount_paid) || 0);
  const [paymentDate, setPaymentDate] = useState<string>(
    purchase.payment_date ? new Date(purchase.payment_date).toISOString().split('T')[0] : ''
  );
  const [notes, setNotes] = useState<string>(purchase.notes || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalPieces = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [items]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { uniform_size: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ClothesItemRow, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'uniform_size') {
        const p = priceMap.get(value) || 0;
        updated[index].price = p;
      }
      return updated;
    });
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const hasEmptyItem = items.some((it) => !it.uniform_size.trim());
    if (hasEmptyItem) {
      setErrorMsg('تکایە جۆری جلوبەرگ بۆ هەموو بڕگەکان دیاری بکە');
      return;
    }

    const hasInvalidQty = items.some((it) => !it.quantity || it.quantity < 1);
    if (hasInvalidQty) {
      setErrorMsg('ژمارەی دانەکان دەبێت لانیکەم ١ دانە بێت');
      return;
    }

    const payload = {
      amount_paid: amountPaid,
      price: amountPaid,
      items: items.map((it) => ({
        uniform_size: it.uniform_size,
        quantity: Number(it.quantity) || 1,
        price: it.price || 0,
      })),
      quantity: totalPieces,
      payment_date: paymentDate,
      notes: notes,
    };

    updateMutation.mutate(payload, {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="دەستکاریکردنی کڕینی جلوبەرگ">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Clothes Items Section */}
        <div className="bg-surface-muted/60 border border-border rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-text">
              <HiOutlineShoppingBag className="w-4 h-4 text-primary" />
              <span>جۆرەکانی جلوبەرگ و ڕێژە</span>
            </div>
            <span className="text-[11px] font-semibold text-text-muted bg-white px-2 py-0.5 rounded border border-border">
              کۆی گشتی: <strong className="text-primary">{totalPieces}</strong> دانە
            </span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-0.5">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-border/80 shadow-xs">
                <div className="flex-1">
                  <Select
                    label=""
                    placeholder="جۆری جلوبەرگ هەڵبژێرە"
                    options={typeOptions}
                    value={item.uniform_size}
                    onChange={(e) => handleItemChange(index, 'uniform_size', e.target.value)}
                  />
                </div>

                <div className="w-24">
                  <Input
                    label=""
                    type="number"
                    min={1}
                    step={1}
                    placeholder="دانە"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-danger hover:bg-danger-light rounded-lg transition-colors cursor-pointer"
                    title="سڕینەوەی ئەم جۆرە"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs text-danger font-medium mt-1">{errorMsg}</p>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddItem}
            className="w-full flex items-center justify-center gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary-light"
          >
            <HiOutlinePlus className="w-3.5 h-3.5" />
            <span>زیادکردنی جۆرێکی تر</span>
          </Button>
        </div>

        <Input
          label="بڕی پارەی دراو (دینار) *"
          id="edit_amount_paid"
          type="number"
          min={0}
          value={amountPaid}
          onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
          required
        />

        <Input
          label="بەرواری پارەدان *"
          id="edit_payment_date"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit_notes" className="text-xs font-semibold text-text">
            تێبینی
          </label>
          <textarea
            id="edit_notes"
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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

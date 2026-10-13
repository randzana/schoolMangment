'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { API_URL } from '@/lib/api';
import { InventoryItem } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { GRADE_OPTIONS, GRADE_MAP, formatCurrency } from '@/lib/utils';
import {
  HiOutlineBuildingStorefront,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePlusCircle,
  HiOutlinePlus,
  HiOutlinePrinter,
} from 'react-icons/hi2';

/** Fixed count of everything put into stock (older rows may not have it yet). */
const totalOf = (item: InventoryItem) => Math.max(item.total_quantity ?? item.quantity, item.quantity);
const soldOf = (item: InventoryItem) => totalOf(item) - item.quantity;

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'clothes' | 'book'>('clothes');
  
  // Edit states
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [totalInput, setTotalInput] = useState<string>('');
  const [priceInput, setPriceInput] = useState<string>('0');

  // Add stock states
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null);
  const [addInput, setAddInput] = useState<string>('');

  // Create item states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createNameInput, setCreateNameInput] = useState('');
  const [createQuantityInput, setCreateQuantityInput] = useState('0');
  const [createPriceInput, setCreatePriceInput] = useState('0');
  const [createGradeInput, setCreateGradeInput] = useState('');

  // Delete states
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch inventory
  const { data: inventoryData, isLoading, error } = useQuery<InventoryItem[]>({
    queryKey: ['inventory-list'],
    queryFn: async () => {
      const res = await api.get('/inventory');
      return res.data.data;
    },
  });

  // Create item mutation
  const createMutation = useMutation({
    mutationFn: async (payload: { item_type: 'clothes' | 'book'; name: string; quantity: number; price: number; grade?: string }) => {
      const res = await api.post('/inventory', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-list-books'] });
      toast.success('بابەتەکە بە سەرکەوتوویی تۆمارکرا');
      setIsCreateOpen(false);
      setCreateNameInput('');
      setCreateQuantityInput('0');
      setCreatePriceInput('0');
      setCreateGradeInput('');
    },
    onError: (err) => {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message || 'کێشەیەک لە کاتی تۆمارکردن ڕوویدا');
    },
  });

  // Update fixed count, stock & price mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: number; total_quantity?: number; add_quantity?: number; price?: number }) => {
      const res = await api.put(`/inventory/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-list-books'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-list-clothes'] });
      toast.success('زانیارییەکان بە سەرکەوتوویی نوێکرانەوە');
      setEditingItem(null);
      setStockItem(null);
    },
    onError: (err) => {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message || 'کێشەیەک ڕوویدا لە کاتی نوێکردنەوە');
    },
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/inventory/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-list-books'] });
      toast.success('بابەتەکە بە سەرکەوتوویی سڕایەوە');
      setDeleteId(null);
    },
    onError: (err) => {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message || 'کێشەیەک ڕوویدا لە کاتی سڕینەوە');
    },
  });

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setTotalInput(totalOf(item).toString());
    setPriceInput(item.price?.toString() || '0');
  };

  const handleSaveQuantity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const total = parseInt(totalInput, 10);
    if (isNaN(total) || total < 0) {
      toast.error('تکایە ژمارەیەکی دروست بنووسە');
      return;
    }
    if (total < soldOf(editingItem)) {
      toast.error(`ژمارەی جێگیر ناتوانێت لە ژمارەی فرۆشراو (${soldOf(editingItem)} دانە) کەمتر بێت`);
      return;
    }

    if (editingItem.item_type === 'clothes') {
      const price = parseFloat(priceInput);
      if (isNaN(price) || price < 0) {
        toast.error('تکایە نرخێکی دروست بنووسە');
        return;
      }
      updateMutation.mutate({ id: editingItem.id, total_quantity: total, price });
    } else {
      updateMutation.mutate({ id: editingItem.id, total_quantity: total });
    }
  };

  const handleOpenAddStock = (item: InventoryItem) => {
    setStockItem(item);
    setAddInput('');
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockItem) return;

    const amount = parseInt(addInput, 10);
    if (isNaN(amount) || amount < 1) {
      toast.error('تکایە ژمارەیەکی دروست بنووسە (لانیکەم ١)');
      return;
    }

    updateMutation.mutate({ id: stockItem.id, add_quantity: amount });
  };

  const addAmount = Math.max(0, parseInt(addInput, 10) || 0);
  const editTotal = parseInt(totalInput, 10);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNameInput.trim()) {
      toast.error('تکایە ناو بنووسە');
      return;
    }

    const qty = parseInt(createQuantityInput, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('تکایە ژمارەیەکی دروست بنووسە');
      return;
    }

    const price = activeTab === 'clothes' ? parseFloat(createPriceInput) : 0;
    if (activeTab === 'clothes' && (isNaN(price) || price < 0)) {
      toast.error('تکایە نرخێکی دروست بنووسە');
      return;
    }

    if (activeTab === 'book' && !createGradeInput) {
      toast.error('تکایە پۆلێک هەڵبژێرە');
      return;
    }

    // Auto prefix to maintain format consistency
    const itemName = activeTab === 'clothes' 
      ? `Uniform Size ${createNameInput.trim()}`
      : `Book: ${createNameInput.trim()}`;

    const payload: { item_type: 'clothes' | 'book'; name: string; quantity: number; price: number; grade?: string } = {
      item_type: activeTab,
      name: itemName,
      quantity: qty,
      price: activeTab === 'clothes' ? price : 0,
    };

    if (activeTab === 'book' && createGradeInput) {
      payload.grade = createGradeInput;
    }

    createMutation.mutate(payload);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !inventoryData) {
    return (
      <div className="p-6 text-center text-danger font-medium border border-danger/20 rounded-2xl bg-danger/5">
        Failed to load inventory data.
      </div>
    );
  }

  // Filter items
  const filteredItems = inventoryData.filter(item => item.item_type === activeTab);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <HiOutlineBuildingStorefront className="w-6 h-6" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text">بەڕێوەبردنی کۆگا</h1>
          </div>
          <p className="text-xs text-text-muted">ژمارەی جێگیر (کۆی هاتوو)، فرۆشراو و ماوەی جلوبەرگ و کتێبەکان بەپێی جۆر و بابەت</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <Button
            variant="secondary"
            onClick={() => window.open(`${API_URL}/inventory/print`, '_blank')}
            className="flex items-center gap-1.5 font-semibold"
          >
            <HiOutlinePrinter className="w-4 h-4" />
            <span>چاپکردنی کۆگا</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 font-semibold"
          >
            <HiOutlinePlusCircle className="w-4 h-4" />
            <span>{activeTab === 'clothes' ? 'تۆمارکردنی جۆری نوێ' : 'تۆمارکردنی کتێبی نوێ'}</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('clothes')}
          className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px active:scale-95 ${
            activeTab === 'clothes'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          جلوبەرگی قوتابخانە
        </button>
        <button
          onClick={() => setActiveTab('book')}
          className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px active:scale-95 ${
            activeTab === 'book'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          کتێبەکانی وانەکان
        </button>
      </div>

      {/* Items list */}
      <div className="bg-white border border-border rounded-2xl shadow-card overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">ھیچ بابەتێک نییە لەم بەشەدا.</div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="min-w-full divide-y divide-border hidden md:table">
              <thead>
                <tr className="text-right text-xs font-bold uppercase text-text-muted tracking-wider bg-surface-muted">
                  <th className="px-6 py-4">ناوی بابەت</th>
                  <th className="px-6 py-4">کۆدی بابەت</th>
                  {activeTab !== 'book' && <th className="px-6 py-4">نرخی بابەت</th>}
                  <th className="px-6 py-4">ژمارەی جێگیر</th>
                  <th className="px-6 py-4">فرۆشراو</th>
                  <th className="px-6 py-4">ماوە لە کۆگا</th>
                  <th className="px-6 py-4 text-left">کردارەکان</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border text-sm text-text">
                {filteredItems.map((item) => {
                  const displayName = item.item_type === 'clothes'
                    ? item.name.replace('Uniform Size ', '')
                    : item.name.replace('Book: ', '');

                  return (
                    <tr key={item.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="px-6 py-4 font-semibold">
                        {displayName}
                        {item.item_type === 'book' && item.grade && (
                          <span className="mr-2 text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {GRADE_MAP[item.grade] || item.grade}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-text-muted">{item.code}</td>
                      {activeTab !== 'book' && (
                        <td className="px-6 py-4 font-semibold text-primary">{formatCurrency(item.price || 0)}</td>
                      )}
                      <td className="px-6 py-4 font-mono font-bold text-primary">{totalOf(item)}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-success">{soldOf(item)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                          item.quantity === 0
                            ? 'bg-danger/10 text-danger'
                            : item.quantity <= 10
                            ? 'bg-warning/10 text-warning'
                            : 'bg-success/10 text-success'
                        }`}>
                          {item.quantity} دانە
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenAddStock(item)}
                            className="text-success hover:bg-success/5 p-1 rounded-lg"
                            title="زیادکردنی بڕ بۆ کۆگا"
                          >
                            <HiOutlinePlus className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClick(item)}
                            className="text-primary hover:bg-primary/5 p-1 rounded-lg"
                            title="دەستکاری زانیارییەکان"
                          >
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(item.id)}
                            className="text-danger hover:bg-danger/5 p-1 rounded-lg"
                            title="سڕینەوە لە کۆگا"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Card-List View */}
            <div className="md:hidden divide-y divide-border">
              {filteredItems.map((item) => {
                const displayName = item.item_type === 'clothes'
                  ? item.name.replace('Uniform Size ', '')
                  : item.name.replace('Book: ', '');

                return (
                  <div key={item.id} className="p-4 flex justify-between items-center bg-white active:bg-surface-muted/20">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-text truncate">{displayName}</p>
                        {item.item_type === 'book' && item.grade && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.25 rounded bg-primary/10 text-primary">
                            {GRADE_MAP[item.grade] || item.grade}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-muted font-mono">{item.code}</p>
                      {activeTab !== 'book' && <p className="text-xs text-primary font-bold">{formatCurrency(item.price || 0)}</p>}
                      <p className="text-[10px] text-text-muted">
                        جێگیر: <strong className="text-primary font-mono">{totalOf(item)}</strong> · فرۆشراو: <strong className="text-success font-mono">{soldOf(item)}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        item.quantity === 0
                          ? 'bg-danger/10 text-danger'
                          : item.quantity <= 10
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                      }`}>
                        {item.quantity} دانە
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenAddStock(item)}
                        className="text-success p-1.5 bg-success/5 rounded-lg active:scale-95"
                      >
                        <HiOutlinePlus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(item)}
                        className="text-primary p-1.5 bg-surface-muted rounded-lg active:scale-95"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(item.id)}
                        className="text-danger p-1.5 bg-danger/5 rounded-lg active:scale-95"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create item modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={activeTab === 'clothes' ? 'تۆمارکردنی جۆری نوێ' : 'تۆمارکردنی کتێبی نوێ'}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          <Input
            label={activeTab === 'clothes' ? 'جۆری جلوبەرگ (بۆ نموونە: کراسی زستانە، پانتۆڵ) *' : 'بابەتی کتێب (بۆ نموونە: بیرکاری) *'}
            type="text"
            required
            placeholder={activeTab === 'clothes' ? 'وەک: کراس، پانتۆڵ، سوێتەر' : 'وەک: بیرکاری, کوردی'}
            value={createNameInput}
            onChange={(e) => setCreateNameInput(e.target.value)}
            className="w-full"
          />
          {activeTab === 'book' && (
            <Select
              label="پۆل (بۆ نموونە: پۆلی یەکەم) *"
              required
              options={GRADE_OPTIONS}
              placeholder="تکایە پۆلێک هەڵبژێرە"
              value={createGradeInput}
              onChange={(e) => setCreateGradeInput(e.target.value)}
              className="w-full"
            />
          )}
          {activeTab === 'clothes' ? (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="ژمارەی جێگیر (بڕی سەرەتایی) *"
                type="number"
                min="0"
                required
                value={createQuantityInput}
                onChange={(e) => setCreateQuantityInput(e.target.value)}
                className="w-full font-mono text-center"
              />
              <Input
                label="نرخی فرۆشتن (دینار) *"
                type="number"
                min="0"
                required
                value={createPriceInput}
                onChange={(e) => setCreatePriceInput(e.target.value)}
                className="w-full font-mono text-center"
              />
            </div>
          ) : (
            <Input
              label="ژمارەی جێگیر (بڕی سەرەتایی) *"
              type="number"
              min="0"
              required
              value={createQuantityInput}
              onChange={(e) => setCreateQuantityInput(e.target.value)}
              className="w-full font-mono text-center"
            />
          )}
          <div className="flex justify-end gap-3 pt-2 font-semibold">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
              className="w-full"
            >
              پاشگەزبوونەوە
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
              className="w-full"
            >
              تۆمارکردن
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit fixed count & price modal */}
      <Modal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        title="دەستکاریکردنی زانیارییەکانی کۆگا"
      >
        {editingItem && (
          <form onSubmit={handleSaveQuantity} className="space-y-4 pt-2">
            <div>
              <p className="text-xs text-text-muted mb-2">ناوی بابەت: <strong className="text-text font-bold">{editingItem.name}</strong></p>
            </div>
            <div className={editingItem.item_type === 'clothes' ? 'grid grid-cols-2 gap-4' : ''}>
              <div>
                <label htmlFor="total_quantity" className="block text-xs font-semibold text-text mb-1">ژمارەی جێگیر (کۆی هاتووی کۆگا)</label>
                <Input
                  id="total_quantity"
                  type="number"
                  min={soldOf(editingItem)}
                  required
                  value={totalInput}
                  onChange={(e) => setTotalInput(e.target.value)}
                  className="w-full font-mono text-center font-bold text-lg"
                />
              </div>
              {editingItem.item_type === 'clothes' && (
                <div>
                  <label htmlFor="price" className="block text-xs font-semibold text-text mb-1">نرخی فرۆشتن (دینار)</label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    required
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-full font-mono text-center font-bold text-lg"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-surface-muted rounded-lg p-2 border border-border">
                <p className="text-text-muted">فرۆشراو</p>
                <p className="font-mono font-bold text-success">{soldOf(editingItem)}</p>
              </div>
              <div className="bg-surface-muted rounded-lg p-2 border border-border">
                <p className="text-text-muted">ماوەی ئێستا</p>
                <p className="font-mono font-bold text-text">{editingItem.quantity}</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-2 border border-primary/20">
                <p className="text-primary">ماوە دوای پاشەکەوت</p>
                <p className="font-mono font-bold text-primary">
                  {isNaN(editTotal) ? '-' : Math.max(0, editTotal - soldOf(editingItem))}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 font-semibold">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingItem(null)}
                className="w-full"
              >
                پاشگەزبوونەوە
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={updateMutation.isPending}
                className="w-full"
              >
                تۆمارکردن
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add stock modal */}
      <Modal
        isOpen={stockItem !== null}
        onClose={() => setStockItem(null)}
        title="زیادکردنی بڕ بۆ کۆگا"
        size="sm"
      >
        {stockItem && (
          <form onSubmit={handleAddStock} className="space-y-4 pt-2">
            <p className="text-xs text-text-muted">ناوی بابەت: <strong className="text-text font-bold">{stockItem.name}</strong></p>
            <Input
              label="ژمارەی دانەی هاتوو *"
              id="add_quantity"
              type="number"
              min="1"
              required
              autoFocus
              placeholder="بۆ نموونە: ٥٠"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              className="w-full font-mono text-center font-bold text-lg"
            />
            <div className="bg-surface-muted rounded-lg p-3 border border-border text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-text-muted">ژمارەی جێگیر</span>
                <span className="font-mono font-bold">
                  {totalOf(stockItem)} ← <span className="text-primary">{totalOf(stockItem) + addAmount}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">ماوە لە کۆگا</span>
                <span className="font-mono font-bold">
                  {stockItem.quantity} ← <span className="text-success">{stockItem.quantity + addAmount}</span>
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 font-semibold">
              <Button type="button" variant="secondary" onClick={() => setStockItem(null)} className="w-full">
                پاشگەزبوونەوە
              </Button>
              <Button type="submit" variant="primary" isLoading={updateMutation.isPending} className="w-full">
                زیادکردن
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی بابەت لە کۆگا"
        message="ئایا دڵنیایت لە سڕینەوەی ئەم بابەتە لە کۆگا؟ ئەم کردارە بە هەمیشەیی بابەتەکە دەسڕێتەوە."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

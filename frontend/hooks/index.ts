'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse, Student, StudyPayment, StudyInstallment, FoodPayment, FoodInstallment, ClothesBookPayment, Expense, User, ReportData, StudentListItem } from '@/types';
import { toast } from 'sonner';

/**
 * Helper: invalidate all financial caches at once.
 * Called after any mutation that changes money-related data
 * so every page stays in sync without manual refresh.
 */
function invalidateFinancialCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
  queryClient.invalidateQueries({ queryKey: ['students'] });
  queryClient.invalidateQueries({ queryKey: ['study-payments'] });
  queryClient.invalidateQueries({ queryKey: ['study-payments-summary'] });
  queryClient.invalidateQueries({ queryKey: ['study-installments'] });
  queryClient.invalidateQueries({ queryKey: ['food-payments'] });
  queryClient.invalidateQueries({ queryKey: ['food-payments-summary'] });
  queryClient.invalidateQueries({ queryKey: ['food-installments'] });
  queryClient.invalidateQueries({ queryKey: ['clothes-books'] });
  queryClient.invalidateQueries({ queryKey: ['expenses'] });
}

// ==========================================
// Students
// ==========================================
export function useStudents(params: { grade?: string; search?: string; page?: number; per_page?: number }) {
  return useQuery<PaginatedResponse<Student>>({
    queryKey: ['students', params],
    queryFn: async () => {
      const res = await api.get('/students', { params });
      return res.data;
    },
  });
}

export function useStudent(id: number) {
  return useQuery<ApiResponse<Student>>({
    queryKey: ['student', id],
    queryFn: async () => {
      const res = await api.get(`/students/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/students', data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('قوتابی بە سەرکەوتوویی زیاد کرا');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە زیادکردنی قوتابی');
    },
  });
}

export function useUpdateStudent(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/students/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      toast.success('زانیاری قوتابی نوێ کرایەوە');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە نوێکردنەوەی زانیاری قوتابی');
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/students/${id}`);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('قوتابی بە سەرکەوتوویی سڕایەوە');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە سڕینەوەی قوتابی');
    },
  });
}


// ==========================================
// Study Payments & Installments
// ==========================================
export function useStudyPayments(params: { grade?: string; search?: string; page?: number; per_page?: number }) {
  return useQuery<PaginatedResponse<StudyPayment>>({
    queryKey: ['study-payments', params],
    queryFn: async () => {
      const res = await api.get('/study-payments', { params });
      return res.data;
    },
  });
}

export function useStudyPaymentsSummary() {
  return useQuery<ApiResponse<any>>({
    queryKey: ['study-payments-summary'],
    queryFn: async () => {
      const res = await api.get('/study-payments-summary');
      return res.data;
    },
  });
}

export function useSaveStudyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/study-payments', data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('تۆماری کرێی خوێندن تۆمار کرا');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە تۆمارکردنی کرێی خوێندن');
    },
  });
}

export function useUpdateStudyPayment(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/study-payments/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('تۆماری کرێی خوێندن نوێ کرایەوە');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە نوێکردنەوەی تۆمار');
    },
  });
}

export function useStudyInstallments(params: { student_id?: number; from?: string; to?: string; page?: number; per_page?: number }) {
  return useQuery<PaginatedResponse<StudyInstallment>>({
    queryKey: ['study-installments', params],
    queryFn: async () => {
      const res = await api.get('/study-installments', { params });
      return res.data;
    },
  });
}

export function useCreateStudyInstallment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/study-installments', data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('قیستی خوێندن تۆمار کرا');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە تۆمارکردنی قیست');
    },
  });
}

export function useUpdateStudyInstallment(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/study-installments/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('تۆماری قیستی خوێندن نوێ کرایەوە');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە نوێکردنەوەی قیست');
    },
  });
}

export function useReturnStudyInstallment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.put(`/study-installments/${id}/return`);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('پسوڵە گەڕێنرایەوە. باڵانس گەڕایەوە.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە گەڕاندنەوەی پسوڵە');
    },
  });
}

// ==========================================
// Food Payments & Installments
// ==========================================
export function useFoodPayments(params: { grade?: string; search?: string; page?: number; per_page?: number }) {
  return useQuery<PaginatedResponse<FoodPayment>>({
    queryKey: ['food-payments', params],
    queryFn: async () => {
      const res = await api.get('/food-payments', { params });
      return res.data;
    },
  });
}

export function useFoodPaymentsSummary() {
  return useQuery<ApiResponse<any>>({
    queryKey: ['food-payments-summary'],
    queryFn: async () => {
      const res = await api.get('/food-payments-summary');
      return res.data;
    },
  });
}

export function useSaveFoodPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/food-payments', data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('تۆماری نانخواردن تۆمار کرا');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە تۆمارکردنی نانخواردن');
    },
  });
}

export function useUpdateFoodPayment(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/food-payments/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('تۆماری نانخواردن نوێ کرایەوە');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە نوێکردنەوەی تۆمار');
    },
  });
}

export function useFoodInstallments(params: { student_id?: number; from?: string; to?: string; page?: number; per_page?: number }) {
  return useQuery<PaginatedResponse<FoodInstallment>>({
    queryKey: ['food-installments', params],
    queryFn: async () => {
      const res = await api.get('/food-installments', { params });
      return res.data;
    },
  });
}

export function useCreateFoodInstallment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/food-installments', data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('قیستی نانخواردن تۆمار کرا');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە تۆمارکردنی قیست');
    },
  });
}

export function useUpdateFoodInstallment(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/food-installments/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('تۆماری قیستی نانخواردن نوێ کرایەوە');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە نوێکردنەوەی قیست');
    },
  });
}

export function useReturnFoodInstallment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.put(`/food-installments/${id}/return`);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('پسوڵەی نانخواردن گەڕێنرایەوە.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە گەڕاندنەوەی پسوڵە');
    },
  });
}

// ==========================================
// Clothes & Books
// ==========================================
export function useClothesBooks(params: { student_id?: number; academic_year?: string; item_type?: string; page?: number; per_page?: number }) {
  return useQuery<PaginatedResponse<ClothesBookPayment>>({
    queryKey: ['clothes-books', params],
    queryFn: async () => {
      const res = await api.get('/clothes-books', { params });
      return res.data;
    },
  });
}

export function useCreateClothesBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/clothes-books', data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('کڕینی جلوبەرگ/کتێب تۆمار کرا');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە تۆمارکردن');
    },
  });
}

export function useUpdateClothesBook(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/clothes-books/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('تۆمار بە سەرکەوتوویی نوێ کرایەوە');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە نوێکردنەوەی تۆمار');
    },
  });
}

export function useDeleteClothesBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/clothes-books/${id}`);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('تۆمار سڕایەوە');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە سڕینەوەی تۆمار');
    },
  });
}

export function useCreateBulkBooks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { student_id: number; notes?: string; price?: number }) => {
      const res = await api.post('/clothes-books/bulk-books', data);
      return res.data;
    },
    onSuccess: (res) => {
      invalidateFinancialCaches(queryClient);
      queryClient.invalidateQueries({ queryKey: ['inventory-list-books'] });
      toast.success(res.message || 'هەموو کتێبەکان بە سەرکەوتوویی تۆمار کران');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە تۆمارکردنی کتێبەکان');
    },
  });
}

// ==========================================
// Expenses
// ==========================================
export function useExpenses(params: { from?: string; to?: string; category?: string; page?: number; per_page?: number }) {
  return useQuery<PaginatedResponse<Expense>>({
    queryKey: ['expenses', params],
    queryFn: async () => {
      const res = await api.get('/expenses', { params });
      return res.data;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/expenses', data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('خەرجی تۆمار کرا');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە تۆمارکردنی خەرجی');
    },
  });
}

export function useUpdateExpense(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/expenses/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('خەرجی نوێ کرایەوە');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە نوێکردنەوەی خەرجی');
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/expenses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinancialCaches(queryClient);
      toast.success('خەرجی سڕایەوە');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە سڕینەوەی خەرجی');
    },
  });
}


// ==========================================
// Users Management
// ==========================================
export function useUsers(params: { page?: number; per_page?: number }) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['users', params],
    queryFn: async () => {
      const res = await api.get('/users', { params });
      return res.data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/users', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('بەکارهێنەر بە سەرکەوتوویی دروست کرا');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە دروستکردنی بەکارهێنەر');
    },
  });
}

export function useUpdateUser(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/users/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('زانیاری بەکارهێنەر نوێ کرایەوە');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە نوێکردنەوەی زانیاری');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/users/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('بەکارهێنەر سڕایەوە');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە سڕینەوەی بەکارهێنەر');
    },
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/users/${id}/toggle-active`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('باری بەکارهێنەر گۆڕا');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'هەڵە لە گۆڕینی بار');
    },
  });
}

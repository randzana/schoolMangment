'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse, Student, Teacher, StudyPayment, StudyInstallment, FoodPayment, FoodInstallment, ClothesBookPayment, Expense, SalaryExpense, User, ReportData, StudentListItem } from '@/types';
import { toast } from 'sonner';

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
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create student');
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
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      toast.success('Student updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update student');
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
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    },
  });
}

// ==========================================
// Teachers
// ==========================================
export function useTeachers(params: { search?: string; page?: number; per_page?: number }) {
  return useQuery<PaginatedResponse<Teacher>>({
    queryKey: ['teachers', params],
    queryFn: async () => {
      const res = await api.get('/teachers', { params });
      return res.data;
    },
  });
}

export function useTeacher(id: number) {
  return useQuery<ApiResponse<Teacher>>({
    queryKey: ['teacher', id],
    queryFn: async () => {
      const res = await api.get(`/teachers/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/teachers', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create teacher');
    },
  });
}

export function useUpdateTeacher(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/teachers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', id] });
      toast.success('Teacher updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update teacher');
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/teachers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete teacher');
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
      queryClient.invalidateQueries({ queryKey: ['study-payments'] });
      queryClient.invalidateQueries({ queryKey: ['study-payments-summary'] });
      toast.success('Tuition fee record saved successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save tuition record');
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
      queryClient.invalidateQueries({ queryKey: ['study-payments'] });
      queryClient.invalidateQueries({ queryKey: ['study-payments-summary'] });
      toast.success('Tuition fee record updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update tuition record');
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
      queryClient.invalidateQueries({ queryKey: ['study-installments'] });
      queryClient.invalidateQueries({ queryKey: ['study-payments'] });
      queryClient.invalidateQueries({ queryKey: ['study-payments-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast.success('Installment payment recorded successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create installment');
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
      queryClient.invalidateQueries({ queryKey: ['study-installments'] });
      queryClient.invalidateQueries({ queryKey: ['study-payments'] });
      queryClient.invalidateQueries({ queryKey: ['study-payments-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast.success('Bill marked as returned. Balance restored.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to return bill');
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
      queryClient.invalidateQueries({ queryKey: ['food-payments'] });
      queryClient.invalidateQueries({ queryKey: ['food-payments-summary'] });
      toast.success('Food fee record saved successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save food record');
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
      queryClient.invalidateQueries({ queryKey: ['food-payments'] });
      queryClient.invalidateQueries({ queryKey: ['food-payments-summary'] });
      toast.success('Food fee record updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update food record');
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
      queryClient.invalidateQueries({ queryKey: ['food-installments'] });
      queryClient.invalidateQueries({ queryKey: ['food-payments'] });
      queryClient.invalidateQueries({ queryKey: ['food-payments-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast.success('Food payment recorded successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create food payment');
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
      queryClient.invalidateQueries({ queryKey: ['food-installments'] });
      queryClient.invalidateQueries({ queryKey: ['food-payments'] });
      queryClient.invalidateQueries({ queryKey: ['food-payments-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast.success('Food bill returned successfully. Balance restored.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to return food bill');
    },
  });
}

// ==========================================
// Clothes & Books
// ==========================================
export function useClothesBooks(params: { student_id?: number; academic_year?: string; page?: number; per_page?: number }) {
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
      queryClient.invalidateQueries({ queryKey: ['clothes-books'] });
      toast.success('Uniform/Book purchase recorded successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create record');
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
      queryClient.invalidateQueries({ queryKey: ['clothes-books'] });
      toast.success('Record deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete record');
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
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast.success('Expense recorded successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record expense');
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
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast.success('Expense updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update expense');
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
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast.success('Expense deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    },
  });
}

// ==========================================
// Salaries
// ==========================================
export function useSalaries(params: { teacher_id?: number; month?: string; page?: number; per_page?: number }) {
  return useQuery<PaginatedResponse<SalaryExpense>>({
    queryKey: ['salaries', params],
    queryFn: async () => {
      const res = await api.get('/salaries', { params });
      return res.data;
    },
  });
}

export function useCreateSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/salaries', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      toast.success('Salary expense recorded successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record salary');
    },
  });
}

export function useDeleteSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/salaries/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      toast.success('Salary expense record deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete record');
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
      toast.success('User account created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create user');
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
      toast.success('User details updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user');
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
      toast.success('User account deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete user');
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
      toast.success('User status toggled successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    },
  });
}

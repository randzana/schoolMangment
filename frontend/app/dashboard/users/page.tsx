'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useToggleUserActive } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { useAuthStore } from '@/store/authStore';
import { HiOutlineUserPlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePower } from 'react-icons/hi2';

const userSchema = zod.object({
  name: zod.string().min(1, 'Name is required').max(100),
  username: zod.string().min(1, 'Username is required').max(50),
  role: zod.enum(['admin', 'user'], {
    message: 'Role selection is required',
  }),
  password: zod.string().min(6, 'Password must be at least 6 characters').optional().or(zod.literal('')),
  password_confirmation: zod.string().optional().or(zod.literal('')),
}).refine((data) => {
  if (data.password && data.password !== data.password_confirmation) {
    return false;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
});

type UserFormValues = zod.infer<typeof userSchema>;

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: usersData, isLoading } = useUsers({ page });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(editingUserId || 0);
  const deleteMutation = useDeleteUser();
  const toggleActiveMutation = useToggleUserActive();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
  });

  const openAddModal = () => {
    setEditingUserId(null);
    reset({
      name: '',
      username: '',
      role: 'user',
      password: '',
      password_confirmation: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    reset({
      name: user.name,
      username: user.username,
      role: user.role,
      password: '',
      password_confirmation: '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = (values: UserFormValues) => {
    // Filter out confirmation for backend
    const { password_confirmation, ...postData } = values;
    if (!postData.password) {
      delete postData.password;
    }

    if (editingUserId) {
      updateMutation.mutate(postData, {
        onSuccess: () => setIsFormOpen(false),
      });
    } else {
      createMutation.mutate(values, {
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

  const handleToggleActive = (id: number) => {
    toggleActiveMutation.mutate(id);
  };

  const columns: Column<any>[] = [
    { header: 'Full Name', accessor: 'name', sortable: true },
    { header: 'Username', accessor: 'username', sortable: true },
    { header: 'Role', accessor: (row) => row.role.toUpperCase() },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${row.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          {row.is_active ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => {
        const isSelf = row.id === currentUser?.id;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditModal(row)}
              title="Edit Profile"
            >
              <HiOutlinePencilSquare className="w-4 h-4" />
            </Button>
            {!isSelf && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(row.id)}
                  title={row.is_active ? 'Deactivate Account' : 'Activate Account'}
                >
                  <HiOutlinePower className={`w-4 h-4 ${row.is_active ? 'text-danger' : 'text-success'}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:bg-danger-light"
                  onClick={() => setDeleteId(row.id)}
                  title="Delete Account"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">User Management</h1>
          <p className="text-xs text-text-muted">Manage system operators, administrative accounts, and authorization roles</p>
        </div>
        <Button variant="primary" onClick={openAddModal} className="flex items-center gap-1.5 self-start">
          <HiOutlineUserPlus className="w-4 h-4" />
          <span>Add Operator</span>
        </Button>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <DataTable
          columns={columns}
          data={usersData?.data || []}
          isLoading={isLoading}
        />
        {usersData && (
          <TablePagination
            currentPage={page}
            lastPage={usersData.meta.last_page}
            onPageChange={setPage}
            total={usersData.meta.total}
            perPage={usersData.meta.per_page}
          />
        )}
      </div>

      {/* Add / Edit Form Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingUserId ? 'Edit Account' : 'Create Account'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name *"
            id="name"
            placeholder="Operator full name"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Username *"
            id="username"
            placeholder="Unique login nickname"
            error={errors.username?.message}
            {...register('username')}
          />

          <Select
            label="Authorization Role *"
            id="role"
            options={[
              { value: 'user', label: 'User (Standard Operations)' },
              { value: 'admin', label: 'Admin (Full Privileges)' },
            ]}
            error={errors.role?.message}
            {...register('role')}
          />

          <div className="border-t border-border pt-4 mt-2">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-3">
              {editingUserId ? 'Reset Password (Optional)' : 'Set Password'}
            </span>

            <div className="space-y-4">
              <Input
                label={editingUserId ? 'New Password' : 'Password *'}
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Confirm Password"
                id="password_confirmation"
                type="password"
                placeholder="Confirm password"
                error={errors.password_confirmation?.message}
                {...register('password_confirmation')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingUserId ? 'Save Account' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete User Account"
        message="Are you sure you want to delete this administrator account? This action is permanent and cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

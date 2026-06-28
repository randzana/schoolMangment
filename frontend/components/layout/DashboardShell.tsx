'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUIStore } from '@/store/uiStore';
import { Spinner } from '../ui/Spinner';

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Handle route guards for admin-only paths
  useEffect(() => {
    if (user && user.role !== 'admin') {
      const adminOnlyPaths = ['/dashboard/users', '/dashboard/returned-bills'];
      if (adminOnlyPaths.some((p) => pathname.startsWith(p))) {
        router.push('/dashboard');
      }
    }
  }, [user, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="w-screen h-screen flex flex-col justify-center items-center bg-background">
        <Spinner size="lg" />
        <span className="text-xs text-text-muted mt-4 font-semibold">Authenticating...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'ltr:lg:pl-[68px] rtl:lg:pr-[68px]' : 'ltr:lg:pl-64 rtl:lg:pr-64'
        }`}
      >
        <Topbar />
        
        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

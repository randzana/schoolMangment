'use client';

import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { getSchoolName } from '@/lib/utils';
import { HiOutlineBars3, HiOutlineBell } from 'react-icons/hi2';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function Topbar() {
  const { toggleSidebar, setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();

  // Fetch settings dynamically to get the current academic year
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
  });

  const academicYear = settings?.academic_year || '2026-2027';

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 bg-white border-b flex items-center justify-between px-4 md:px-6"
            style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={() => {
            // On mobile, open the overlay sidebar; on desktop, toggle collapse
            if (window.innerWidth < 1024) {
              setSidebarOpen(true);
            } else {
              toggleSidebar();
            }
          }}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors active:scale-95"
          aria-label="Toggle sidebar"
        >
          <HiOutlineBars3 className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
        </button>

        <div className="min-w-0">
          <h2 className="text-sm md:text-lg font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {getSchoolName()}
          </h2>
          <p className="text-[10px] md:text-xs" style={{ color: 'var(--color-text-muted)' }}>
            ساڵی خوێندن: {academicYear}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors active:scale-95"
          aria-label="Notifications"
        >
          <HiOutlineBell className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
        </button>

        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l" style={{ borderColor: 'var(--color-border)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
               style={{ backgroundColor: 'var(--color-primary)' }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{user?.name}</p>
            <p className="text-xs capitalize" style={{ color: 'var(--color-text-muted)' }}>{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

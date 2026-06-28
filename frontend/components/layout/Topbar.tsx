'use client';

import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { getSchoolName, getAcademicYear } from '@/lib/utils';
import { HiOutlineBars3, HiOutlineBell } from 'react-icons/hi2';

export default function Topbar() {
  const { toggleSidebar } = useUIStore();
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b flex items-center justify-between px-6"
            style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <HiOutlineBars3 className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
        </button>

        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            {getSchoolName()}
          </h2>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Academic Year: {getAcademicYear()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <HiOutlineBell className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l" style={{ borderColor: 'var(--color-border)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
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

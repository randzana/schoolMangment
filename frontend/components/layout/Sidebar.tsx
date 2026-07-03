'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { getSchoolName } from '@/lib/utils';
import {
  HiOutlineChartBarSquare,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineClipboardDocumentList,
  HiOutlineBuildingStorefront,
  HiOutlineBanknotes,
  HiOutlineBookOpen,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentChartBar,
  HiOutlineCog6Tooth,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { useEffect, useCallback } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const navigation: NavGroup[] = [
  {
    items: [
      { label: 'سەرەکی', href: '/dashboard', icon: <HiOutlineChartBarSquare className="w-5 h-5" /> },
    ],
  },
  {
    label: 'تۆمارەکان',
    items: [
      { label: 'قوتابییەکان', href: '/dashboard/students', icon: <HiOutlineUserGroup className="w-5 h-5" /> },
      { label: 'خەرجییەکان', href: '/dashboard/expenses', icon: <HiOutlineCurrencyDollar className="w-5 h-5" /> },
      { label: 'کۆگا', href: '/dashboard/inventory', icon: <HiOutlineBuildingStorefront className="w-5 h-5" /> },
    ],
  },
  {
    label: 'پارەدان',
    items: [
      { label: 'خوێندن', href: '/dashboard/study-payments', icon: <HiOutlineAcademicCap className="w-5 h-5" /> },
      { label: 'قستەکانی خوێندن', href: '/dashboard/study-installments', icon: <HiOutlineClipboardDocumentList className="w-5 h-5" /> },
      { label: 'مانگانەی نانخواردن', href: '/dashboard/food-installments', icon: <HiOutlineBuildingStorefront className="w-5 h-5" /> },
      { label: 'جلوبەرگ', href: '/dashboard/clothes', icon: <HiOutlineBanknotes className="w-5 h-5" /> },
      { label: 'کتێب', href: '/dashboard/books', icon: <HiOutlineBookOpen className="w-5 h-5" /> },
    ],
  },
  {
    label: 'ڕاپۆرتەکان',
    items: [
      { label: 'قستەکانی خوێندن', href: '/dashboard/reports/study-installments', icon: <HiOutlineDocumentChartBar className="w-5 h-5" /> },
      { label: 'مانگانەی نانخواردن', href: '/dashboard/reports/food-installments', icon: <HiOutlineDocumentChartBar className="w-5 h-5" /> },
      { label: 'ڕاپۆرتی جلوبەرگ', href: '/dashboard/reports/clothes', icon: <HiOutlineDocumentChartBar className="w-5 h-5" /> },
      { label: 'ڕاپۆرتی کتێب', href: '/dashboard/reports/books', icon: <HiOutlineDocumentChartBar className="w-5 h-5" /> },
      { label: 'ڕاپۆرتی خەرجییەکان', href: '/dashboard/reports/expenses', icon: <HiOutlineDocumentChartBar className="w-5 h-5" /> },
      { label: 'داهاتی ساڵانە', href: '/dashboard/reports/annual-income', icon: <HiOutlineDocumentChartBar className="w-5 h-5" /> },
    ],
  },
  {
    label: 'بەڕێوەبردن',
    adminOnly: true,
    items: [
      { label: 'بەکارهێنەران', href: '/dashboard/users', icon: <HiOutlineCog6Tooth className="w-5 h-5" />, adminOnly: true },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, sidebarOpen, setSidebarOpen } = useUIStore();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  // Close mobile sidebar on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setSidebarOpen(false);
  }, [setSidebarOpen]);

  useEffect(() => {
    if (sidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, handleKeyDown]);

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 flex-shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                 style={{ backgroundColor: 'var(--color-accent)' }}>
              S
            </div>
            <span className="text-white font-semibold text-sm truncate">
              {getSchoolName()}
            </span>
          </div>
        )}

        {/* Desktop: collapse toggle / Mobile: close button */}
        <button
          onClick={() => {
            // On mobile, close the overlay; on desktop, toggle collapse
            if (window.innerWidth < 1024) {
              setSidebarOpen(false);
            } else {
              toggleSidebar();
            }
          }}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle sidebar"
        >
          {window.innerWidth < 1024 ? (
            <HiOutlineXMark className="w-5 h-5" />
          ) : sidebarCollapsed ? (
            <HiOutlineChevronRight className="w-4 h-4" />
          ) : (
            <HiOutlineChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navigation.map((group, gi) => {
          if (group.adminOnly && user?.role !== 'admin') return null;

          return (
            <div key={gi} className="mb-2">
              {group.label && !sidebarCollapsed && (
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                     style={{ color: 'var(--color-sidebar-text)', opacity: 0.5 }}>
                  {group.label}
                </div>
              )}
              {group.label && sidebarCollapsed && (
                <div className="border-b border-white/10 mx-2 my-2" />
              )}
              {group.items.map((item) => {
                if (item.adminOnly && user?.role !== 'admin') return null;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      active
                        ? 'text-white'
                        : 'hover:bg-white/8'
                    }`}
                    style={active ? { backgroundColor: 'var(--color-sidebar-hover)', color: 'var(--color-sidebar-active)' } : { color: 'var(--color-sidebar-text)' }}
                  >
                    <span className={`flex-shrink-0 transition-colors ${active ? '' : 'group-hover:text-white'}`}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="border-t border-white/10 p-3 flex-shrink-0">
        {!sidebarCollapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs capitalize" style={{ color: 'var(--color-sidebar-text)' }}>{user.role}</p>
          </div>
        )}
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-white/10 cursor-pointer"
          style={{ color: 'var(--color-sidebar-text)' }}
          title={sidebarCollapsed ? 'چوونەدەرەوە' : undefined}
        >
          <HiOutlineArrowLeftOnRectangle className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span>چوونەدەرەوە</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar (slide-in overlay) */}
      <aside
        className={`fixed top-0 rtl:right-0 ltr:left-0 h-screen w-72 flex flex-col z-50 lg:hidden
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : 'rtl:translate-x-full ltr:-translate-x-full'}
        `}
        style={{ backgroundColor: 'var(--color-sidebar)' }}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar (fixed) */}
      <aside
        className={`fixed top-0 ltr:left-0 rtl:right-0 h-screen flex-col transition-all duration-300 ease-in-out z-40 hidden lg:flex ${
          sidebarCollapsed ? 'w-[68px]' : 'w-64'
        }`}
        style={{ backgroundColor: 'var(--color-sidebar)' }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

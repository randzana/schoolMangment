'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const reportTabs = [
    { label: 'Study Installments', href: '/dashboard/reports/study-installments' },
    { label: 'Food Installments', href: '/dashboard/reports/food-installments' },
    { label: 'Study Income', href: '/dashboard/reports/study-income' },
    { label: 'Expenses Report', href: '/dashboard/reports/expenses' },
    { label: 'Salary Expenses', href: '/dashboard/reports/salaries' },
    { label: 'Student List', href: '/dashboard/reports/student-list' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Reports & Searches</h1>
        <p className="text-xs text-text-muted">Query financial aggregates, export data tables, and print summary audit reports</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-white rounded-t-xl overflow-x-auto">
        {reportTabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-text-muted hover:text-text hover:bg-surface-muted'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Content wrapper */}
      <div className="bg-white border border-t-0 border-border p-6 rounded-b-xl shadow-card">
        {children}
      </div>
    </div>
  );
}

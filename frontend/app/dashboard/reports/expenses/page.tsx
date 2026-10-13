'use client';

import { ExpenseReport } from '@/components/reports/ExpenseReport';

export default function ExpensesReportPage() {
  return <ExpenseReport endpoint="expenses" totalLabel="کۆی خەرجکراو (بێ نانخواردن)" csvName="expenses_report" />;
}

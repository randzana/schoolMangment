'use client';

import { ExpenseReport } from '@/components/reports/ExpenseReport';

export default function FoodExpensesReportPage() {
  return <ExpenseReport endpoint="food-expenses" totalLabel="کۆی خەرجی نانخواردن" csvName="food_expenses_report" />;
}

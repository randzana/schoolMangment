// API Response envelope types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// User & Auth
export interface User {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'user';
  is_active: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Student
export interface Student {
  id: number;
  serial_number: string;
  full_name: string;
  grade: 'one' | 'two' | 'three' | 'four' | 'five' | 'six' | 'seven' | 'eight' | 'nine';
  grade_display?: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  study_balance?: number;
  food_balance?: number;
  created_at: string;
  updated_at: string;
  // Nested relations (when loaded)
  study_payments?: StudyPayment[];
  food_payments?: FoodPayment[];
  study_installments?: StudyInstallment[];
  food_installments?: FoodInstallment[];
}

export interface StudentSearch {
  id: number;
  serial_number: string;
  full_name: string;
  grade: string;
  grade_display: string;
}

// Teacher
export interface Teacher {
  id: number;
  full_name: string;
  subject: string | null;
  phone: string | null;
  address: string | null;
  monthly_salary: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  salary_expenses?: SalaryExpense[];
}

// Study Payment
export interface StudyPayment {
  id: number;
  student_id: number;
  academic_year: string;
  annual_price: string;
  discount: string;
  price_after_discount: string;
  total_paid: string;
  remain_balance: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  student?: Student;
  installments?: StudyInstallment[];
}

// Study Installment
export interface StudyInstallment {
  id: number;
  invoice_no: number;
  study_payment_id: number;
  student_id: number;
  payment_date: string;
  amount_paid: string;
  remain_before: string;
  remain_after: string;
  notes: string | null;
  is_returned: boolean;
  returned_at: string | null;
  returned_by: number | null;
  created_by: number | null;
  type?: string;
  created_at: string;
  updated_at: string;
  student?: Student;
  study_payment?: StudyPayment;
}

// Food Payment
export interface FoodPayment {
  id: number;
  student_id: number;
  academic_year: string;
  monthly_price: string;
  discount: string;
  price_after_discount: string;
  total_paid: string;
  remain_balance: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  student?: Student;
  installments?: FoodInstallment[];
}

// Food Installment
export interface FoodInstallment {
  id: number;
  invoice_no: number;
  food_payment_id: number;
  student_id: number;
  payment_date: string;
  amount_paid: string;
  remain_before: string;
  remain_after: string;
  notes: string | null;
  is_returned: boolean;
  returned_at: string | null;
  returned_by: number | null;
  created_by: number | null;
  type?: string;
  created_at: string;
  updated_at: string;
  student?: Student;
  food_payment?: FoodPayment;
}

// Clothes & Books Payment
export interface ClothesBookPayment {
  id: number;
  student_id: number;
  academic_year: string;
  item_type: 'clothes' | 'book' | 'both';
  price: string;
  discount: string;
  amount_paid: string;
  payment_date: string | null;
  notes: string | null;
  invoice_no: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  student?: Student;
}

// Expense
export interface Expense {
  id: number;
  title: string;
  amount: string;
  expense_date: string;
  category: string | null;
  description: string | null;
  receipt_no: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

// Salary Expense
export interface SalaryExpense {
  id: number;
  teacher_id: number;
  month: string;
  amount_paid: string;
  paid_date: string;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  teacher?: Teacher;
}

// Summary types
export interface StudyPaymentSummary {
  total_annual: number;
  total_discount: number;
  total_paid: number;
  total_remaining: number;
  academic_year: string;
}

export interface FoodPaymentSummary {
  total_monthly: number;
  total_discount: number;
  total_paid: number;
  total_remaining: number;
  academic_year: string;
}

// Dashboard
export interface DashboardData {
  total_students: number;
  study_revenue: number;
  food_revenue: number;
  monthly_expenses: number;
  recent_transactions: (StudyInstallment | FoodInstallment)[];
  outstanding_balances: OutstandingBalance[];
  monthly_chart: MonthlyChartData[];
}

export interface OutstandingBalance {
  student_name: string;
  grade: string;
  balance: number;
}

export interface MonthlyChartData {
  month: string;
  revenue: number;
  expenses: number;
}

// Report types
export interface ReportData<T> {
  records: T[];
  summary: {
    count: number;
    total_amount?: number;
    total_paid?: number;
  };
}

export interface StudyIncomeReport {
  year: number;
  months: MonthlyIncomeData[];
  grand_total: number;
}

export interface MonthlyIncomeData {
  month: string;
  month_number: number;
  total_collected: number;
  running_total: number;
}

export interface StudentListItem {
  id: number;
  serial_number: string;
  full_name: string;
  grade: string;
  grade_display: string;
  study_annual_price: number;
  study_paid: number;
  study_remaining: number;
  food_monthly_price: number;
  food_paid: number;
  food_remaining: number;
  payment_status: 'paid' | 'partial' | 'unpaid' | 'n/a';
}

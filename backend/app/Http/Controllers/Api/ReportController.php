<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\FoodInstallment;
use App\Models\FoodPayment;
use App\Models\Student;
use App\Models\StudyInstallment;
use App\Models\StudyPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Dashboard summary data
     */
    public function dashboard(): JsonResponse
    {
        $academicYear = config('school.academic_year', '2025-2026');

        // Total active students
        $totalStudents = Student::active()->count();

        // Total study revenue (current year)
        $studyRevenue = StudyPayment::where('academic_year', $academicYear)->sum('total_paid');

        // Total food revenue (current year)
        $foodRevenue = FoodPayment::where('academic_year', $academicYear)->sum('total_paid');

        // Total expenses (current month)
        $monthlyExpenses = Expense::whereYear('expense_date', now()->year)
            ->whereMonth('expense_date', now()->month)
            ->sum('amount');

        // Recent 10 transactions (study + food installments combined)
        $recentStudy = StudyInstallment::with('student')
            ->select('id', 'invoice_no', 'student_id', 'amount_paid', 'payment_date', 'is_returned', DB::raw("'study' as type"))
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $recentFood = FoodInstallment::with('student')
            ->select('id', 'invoice_no', 'student_id', 'amount_paid', 'payment_date', 'is_returned', DB::raw("'food' as type"))
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $recentTransactions = $recentStudy->merge($recentFood)
            ->sortByDesc('payment_date')
            ->take(10)
            ->values();

        // Top 10 outstanding balances
        $outstandingBalances = StudyPayment::with('student')
            ->where('academic_year', $academicYear)
            ->whereRaw('annual_price - discount - total_paid > 0')
            ->orderByRaw('annual_price - discount - total_paid DESC')
            ->limit(10)
            ->get()
            ->map(function ($sp) {
                return [
                    'student_name' => $sp->student->full_name,
                    'grade' => $sp->student->grade_display,
                    'balance' => (float) $sp->remain_balance,
                ];
            });

        // Monthly revenue vs expenses (current year)
        $monthlyData = [];
        for ($month = 1; $month <= 12; $month++) {
            $studyIncome = StudyInstallment::whereYear('payment_date', now()->year)
                ->whereMonth('payment_date', $month)
                ->where('is_returned', false)
                ->sum('amount_paid');

            $foodIncome = FoodInstallment::whereYear('payment_date', now()->year)
                ->whereMonth('payment_date', $month)
                ->where('is_returned', false)
                ->sum('amount_paid');

            $expenses = Expense::whereYear('expense_date', now()->year)
                ->whereMonth('expense_date', $month)
                ->sum('amount');

            $monthlyData[] = [
                'month' => date('M', mktime(0, 0, 0, $month, 1)),
                'revenue' => (float) $studyIncome + (float) $foodIncome,
                'expenses' => (float) $expenses,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_students' => $totalStudents,
                'study_revenue' => (float) $studyRevenue,
                'food_revenue' => (float) $foodRevenue,
                'monthly_expenses' => (float) $monthlyExpenses,
                'recent_transactions' => $recentTransactions,
                'outstanding_balances' => $outstandingBalances,
                'monthly_chart' => $monthlyData,
            ],
            'message' => 'Dashboard data retrieved',
        ]);
    }

    /**
     * Study installments report
     */
    public function studyInstallments(Request $request): JsonResponse
    {
        $query = StudyInstallment::with('student');

        if ($request->filled('from') || $request->filled('to')) {
            $query->byDateRange($request->from, $request->to);
        }

        if ($request->filled('grade')) {
            $query->whereHas('student', fn ($q) => $q->where('grade', $request->grade));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $installments = $query->orderByDesc('payment_date')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $installments,
                'summary' => [
                    'count' => $installments->count(),
                    'total_amount' => $installments->where('is_returned', false)->sum('amount_paid'),
                ],
            ],
            'message' => 'Study installments report generated',
        ]);
    }

    /**
     * Food installments report
     */
    public function foodInstallments(Request $request): JsonResponse
    {
        $query = FoodInstallment::with('student');

        if ($request->filled('from') || $request->filled('to')) {
            $query->byDateRange($request->from, $request->to);
        }

        if ($request->filled('grade')) {
            $query->whereHas('student', fn ($q) => $q->where('grade', $request->grade));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $installments = $query->orderByDesc('payment_date')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $installments,
                'summary' => [
                    'count' => $installments->count(),
                    'total_amount' => $installments->where('is_returned', false)->sum('amount_paid'),
                ],
            ],
            'message' => 'Food installments report generated',
        ]);
    }

    /**
     * Study income monthly breakdown report
     */
    public function studyIncome(Request $request): JsonResponse
    {
        $year = $request->get('year', now()->year);

        $monthlyData = [];
        $runningTotal = 0;

        for ($month = 1; $month <= 12; $month++) {
            $collected = (float) StudyInstallment::whereYear('payment_date', $year)
                ->whereMonth('payment_date', $month)
                ->where('is_returned', false)
                ->sum('amount_paid');

            $runningTotal += $collected;

            $monthlyData[] = [
                'month' => date('F', mktime(0, 0, 0, $month, 1)),
                'month_number' => $month,
                'total_collected' => $collected,
                'running_total' => $runningTotal,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'year' => $year,
                'months' => $monthlyData,
                'grand_total' => $runningTotal,
            ],
            'message' => 'Study income report generated',
        ]);
    }

    /**
     * Expenses report
     */
    public function expenses(Request $request): JsonResponse
    {
        $query = Expense::query();

        if ($request->filled('from') || $request->filled('to')) {
            $query->byDateRange($request->from, $request->to);
        }

        if ($request->filled('category')) {
            $query->byCategory($request->category);
        }

        $expenses = $query->orderByDesc('expense_date')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $expenses,
                'summary' => [
                    'count' => $expenses->count(),
                    'total_amount' => $expenses->sum('amount'),
                ],
            ],
            'message' => 'Expenses report generated',
        ]);
    }


    /**
     * Student list report with payment status
     */
    public function studentList(Request $request): JsonResponse
    {
        $academicYear = config('school.academic_year', '2025-2026');

        $query = Student::with([
            'studyPayments' => fn ($q) => $q->where('academic_year', $academicYear),
            'foodPayments' => fn ($q) => $q->where('academic_year', $academicYear),
        ]);

        if ($request->filled('grade')) {
            $query->byGrade($request->grade);
        }

        $students = $query->active()->orderBy('full_name')->get();

        // Add payment status
        $students = $students->map(function ($student) {
            $sp = $student->studyPayments->first();
            $fp = $student->foodPayments->first();

            $studyRemain = $sp ? (float) $sp->remain_balance : 0;
            $studyTotal = $sp ? (float) $sp->price_after_discount : 0;
            $studyPaid = $sp ? (float) $sp->total_paid : 0;

            if ($studyTotal == 0) {
                $status = 'n/a';
            } elseif ($studyRemain <= 0) {
                $status = 'paid';
            } elseif ($studyPaid > 0) {
                $status = 'partial';
            } else {
                $status = 'unpaid';
            }

            return [
                'id' => $student->id,
                'serial_number' => $student->serial_number,
                'full_name' => $student->full_name,
                'grade' => $student->grade,
                'grade_display' => $student->grade_display,
                'study_annual_price' => $studyTotal,
                'study_paid' => $studyPaid,
                'study_remaining' => $studyRemain,
                'food_monthly_price' => $fp ? (float) $fp->price_after_discount : 0,
                'food_paid' => $fp ? (float) $fp->total_paid : 0,
                'food_remaining' => $fp ? (float) $fp->remain_balance : 0,
                'payment_status' => $status,
            ];
        });

        // Filter by status if requested
        if ($request->filled('status')) {
            $students = $students->filter(fn ($s) => $s['payment_status'] === $request->status)->values();
        }

        return response()->json([
            'success' => true,
            'data' => $students,
            'message' => 'Student list report generated',
        ]);
    }

    /**
     * Export study installments as CSV
     */
    public function exportStudyInstallments(Request $request)
    {
        $query = StudyInstallment::with('student');

        if ($request->filled('from') || $request->filled('to')) {
            $query->byDateRange($request->from, $request->to);
        }

        if ($request->filled('grade')) {
            $query->whereHas('student', fn ($q) => $q->where('grade', $request->grade));
        }

        $installments = $query->orderByDesc('payment_date')->get();

        $csv = "Invoice No,Date,Student Name,Grade,Amount Paid,Remaining After,Returned\n";

        foreach ($installments as $inst) {
            $csv .= implode(',', [
                $inst->invoice_no,
                $inst->payment_date->format('Y-m-d'),
                '"' . $inst->student->full_name . '"',
                $inst->student->grade_display,
                $inst->amount_paid,
                $inst->remain_after,
                $inst->is_returned ? 'Yes' : 'No',
            ]) . "\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="study_installments_report.csv"');
    }

    /**
     * PDF report of study installments
     */
    public function pdfStudyInstallments(Request $request)
    {
        $query = StudyInstallment::with('student');

        if ($request->filled('from') || $request->filled('to')) {
            $query->byDateRange($request->from, $request->to);
        }

        $installments = $query->orderByDesc('payment_date')->get();

        $pdf_data = [
            'installments' => $installments,
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'date_range' => ($request->from ?? 'سەرەتا') . ' بۆ ' . ($request->to ?? 'ئێستا'),
            'total' => $installments->where('is_returned', false)->sum('amount_paid'),
        ];

        return view('reports.study-installments', $pdf_data);
    }
}

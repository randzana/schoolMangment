<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\FoodInstallment;
use App\Models\FoodPayment;
use App\Models\Student;
use App\Models\StudyInstallment;
use App\Models\StudyPayment;
use App\Models\ClothesBookPayment;
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

        // Total study contract amount (annual tuition fees expected)
        $totalStudyTuition = StudyPayment::where('academic_year', $academicYear)->sum('price_after_discount');

        // Total study revenue (current year)
        $studyRevenue = StudyPayment::where('academic_year', $academicYear)->sum('total_paid');

        // Total food revenue (current year)
        $foodRevenue = FoodPayment::where('academic_year', $academicYear)->sum('total_paid');

        // Total clothes & books revenue (current year)
        $clothesRevenue = ClothesBookPayment::where('academic_year', $academicYear)->sum('amount_paid');

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
                'total_study_tuition' => (float) $totalStudyTuition,
                'study_revenue' => (float) $studyRevenue,
                'food_revenue' => (float) $foodRevenue,
                'clothes_revenue' => (float) $clothesRevenue,
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

        if ($request->filled('month')) {
            $query->whereMonth('payment_date', $request->month);
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

        if ($request->filled('month')) {
            $query->whereMonth('payment_date', $request->month);
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

        if ($request->filled('month')) {
            $query->whereMonth('payment_date', $request->month);
        }

        if ($request->filled('grade')) {
            $query->whereHas('student', fn ($q) => $q->where('grade', $request->grade));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $installments = $query->orderByDesc('payment_date')->get();

        $grade_map = [
            'one'   => 'پۆلی یەکەم',
            'two'   => 'پۆلی دووەم',
            'three' => 'پۆلی سێیەم',
            'four'  => 'پۆلی چوارەم',
            'five'  => 'پۆلی پێنجەم',
            'six'   => 'پۆلی شەشەم',
            'seven' => 'پۆلی حەوتەم',
            'eight' => 'پۆلی هەشتەم',
            'nine'  => 'پۆلی نۆیەم',
        ];
        
        $grade_label = $request->filled('grade') ? ($grade_map[$request->grade] ?? $request->grade) : null;

        $month_names = [
            '1'  => 'کانوونی دووەم (1)',
            '2'  => 'شوبات (2)',
            '3'  => 'ئادار (3)',
            '4'  => 'نیسان (4)',
            '5'  => 'ئایار (5)',
            '6'  => 'حوزەیران (6)',
            '7'  => 'تەممووز (7)',
            '8'  => 'ئاب (8)',
            '9'  => 'ئەیلوول (9)',
            '10' => 'تشرینی یەکەم (10)',
            '11' => 'تشرینی دووەم (11)',
            '12' => 'کانوونی یەکەم (12)',
        ];
        
        $date_range = ($request->from ?? 'سەرەتا') . ' بۆ ' . ($request->to ?? 'ئێستا');
        if ($request->filled('month')) {
            $date_range = 'مانگی ' . ($month_names[$request->month] ?? $request->month);
        }

        $pdf_data = [
            'installments' => $installments,
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'date_range' => $date_range,
            'grade_label' => $grade_label,
            'total' => $installments->where('is_returned', false)->sum('amount_paid'),
        ];

        return view('reports.study-installments', $pdf_data);
    }

    /**
     * PDF report of food installments
     */
    public function pdfFoodInstallments(Request $request)
    {
        $query = FoodInstallment::with('student');

        if ($request->filled('from') || $request->filled('to')) {
            $query->byDateRange($request->from, $request->to);
        }

        if ($request->filled('month')) {
            $query->whereMonth('payment_date', $request->month);
        }

        if ($request->filled('grade')) {
            $query->whereHas('student', fn ($q) => $q->where('grade', $request->grade));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $installments = $query->orderByDesc('payment_date')->get();

        $grade_map = [
            'one'   => 'پۆلی یەکەم',
            'two'   => 'پۆلی دووەم',
            'three' => 'پۆلی سێیەم',
            'four'  => 'پۆلی چوارەم',
            'five'  => 'پۆلی پێنجەم',
            'six'   => 'پۆلی شەشەم',
            'seven' => 'پۆلی حەوتەم',
            'eight' => 'پۆلی هەشتەم',
            'nine'  => 'پۆلی نۆیەم',
        ];
        
        $grade_label = $request->filled('grade') ? ($grade_map[$request->grade] ?? $request->grade) : null;

        $month_names = [
            '1'  => 'کانوونی دووەم (1)',
            '2'  => 'شوبات (2)',
            '3'  => 'ئادار (3)',
            '4'  => 'نیسان (4)',
            '5'  => 'ئایار (5)',
            '6'  => 'حوزەیران (6)',
            '7'  => 'تەممووز (7)',
            '8'  => 'ئاب (8)',
            '9'  => 'ئەیلوول (9)',
            '10' => 'تشرینی یەکەم (10)',
            '11' => 'تشرینی دووەم (11)',
            '12' => 'کانوونی یەکەم (12)',
        ];
        
        $date_range = ($request->from ?? 'سەرەتا') . ' بۆ ' . ($request->to ?? 'ئێستا');
        if ($request->filled('month')) {
            $date_range = 'مانگی ' . ($month_names[$request->month] ?? $request->month);
        }

        $pdf_data = [
            'installments' => $installments,
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'date_range' => $date_range,
            'grade_label' => $grade_label,
            'total' => $installments->where('is_returned', false)->sum('amount_paid'),
        ];

        return view('reports.food-installments', $pdf_data);
    }

    /**
     * Annual income report with tuition, food, clothes/books details per student
     */
    public function annualIncome(Request $request): JsonResponse
    {
        $academicYear = $request->get('academic_year', config('school.academic_year', '2025-2026'));
        $grade = $request->get('grade');

        $query = Student::active();

        if ($grade) {
            $query->byGrade($grade);
        }

        $students = $query->with([
            'studyPayments' => fn ($q) => $q->where('academic_year', $academicYear),
            'foodPayments' => fn ($q) => $q->where('academic_year', $academicYear),
            'clothesBookPayments' => fn ($q) => $q->where('academic_year', $academicYear),
        ])->orderBy('full_name')->get();

        $data = $students->map(function ($student) {
            $sp = $student->studyPayments->first();
            $fp = $student->foodPayments->first();
            
            $studyPaid = $sp ? (float) $sp->total_paid : 0;
            $studyRemain = $sp ? (float) $sp->remain_balance : 0;
            
            $foodPaid = $fp ? (float) $fp->total_paid : 0;
            $foodRemain = $fp ? (float) $fp->remain_balance : 0;
            
            $clothesPaid = (float) $student->clothesBookPayments->where('item_type', 'clothes')->sum('amount_paid');
            $booksPaid = (float) $student->clothesBookPayments->where('item_type', 'book')->sum('amount_paid');
            
            $grandTotalPaid = $studyPaid + $foodPaid + $clothesPaid + $booksPaid;

            return [
                'id' => $student->id,
                'serial_number' => $student->serial_number,
                'full_name' => $student->full_name,
                'grade' => $student->grade,
                'grade_display' => $student->grade_display,
                'study_paid' => $studyPaid,
                'study_remaining' => $studyRemain,
                'food_paid' => $foodPaid,
                'food_remaining' => $foodRemain,
                'clothes_paid' => $clothesPaid,
                'books_paid' => $booksPaid,
                'grand_total_paid' => $grandTotalPaid,
            ];
        });

        // Calculate totals for summary cards
        $totalStudy = $data->sum('study_paid');
        $totalFood = $data->sum('food_paid');
        $totalClothes = $data->sum('clothes_paid');
        $totalBooks = $data->sum('books_paid');
        $totalIncome = $data->sum('grand_total_paid');

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $data,
                'summary' => [
                    'total_study' => $totalStudy,
                    'total_food' => $totalFood,
                    'total_clothes' => $totalClothes,
                    'total_books' => $totalBooks,
                    'total_income' => $totalIncome,
                ],
            ],
            'message' => 'Annual income report generated',
        ]);
    }

    /**
     * Export annual income report as CSV
     */
    public function exportAnnualIncome(Request $request)
    {
        $academicYear = $request->get('academic_year', config('school.academic_year', '2025-2026'));
        $grade = $request->get('grade');

        $query = Student::active();

        if ($grade) {
            $query->byGrade($grade);
        }

        $students = $query->with([
            'studyPayments' => fn ($q) => $q->where('academic_year', $academicYear),
            'foodPayments' => fn ($q) => $q->where('academic_year', $academicYear),
            'clothesBookPayments' => fn ($q) => $q->where('academic_year', $academicYear),
        ])->orderBy('full_name')->get();

        $csv = "Student Name,Grade,Study Paid,Food Paid,Clothes Paid,Books Paid,Total Paid\n";

        foreach ($students as $student) {
            $sp = $student->studyPayments->first();
            $fp = $student->foodPayments->first();
            
            $studyPaid = $sp ? (float) $sp->total_paid : 0;
            $foodPaid = $fp ? (float) $fp->total_paid : 0;
            
            $clothesPaid = (float) $student->clothesBookPayments->where('item_type', 'clothes')->sum('amount_paid');
            $booksPaid = (float) $student->clothesBookPayments->where('item_type', 'book')->sum('amount_paid');
            $grandTotalPaid = $studyPaid + $foodPaid + $clothesPaid + $booksPaid;

            $csv .= implode(',', [
                '"' . $student->full_name . '"',
                $student->grade_display,
                $studyPaid,
                $foodPaid,
                $clothesPaid,
                $booksPaid,
                $grandTotalPaid,
            ]) . "\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="annual_income_report.csv"');
    }

    /**
     * PDF print layout for annual income report
     */
    public function pdfAnnualIncome(Request $request)
    {
        $academicYear = $request->get('academic_year', config('school.academic_year', '2025-2026'));
        $grade = $request->get('grade');

        $query = Student::active();

        if ($grade) {
            $query->byGrade($grade);
        }

        $students = $query->with([
            'studyPayments' => fn ($q) => $q->where('academic_year', $academicYear),
            'foodPayments' => fn ($q) => $q->where('academic_year', $academicYear),
            'clothesBookPayments' => fn ($q) => $q->where('academic_year', $academicYear),
        ])->orderBy('full_name')->get();

        $records = $students->map(function ($student) {
            $sp = $student->studyPayments->first();
            $fp = $student->foodPayments->first();
            
            $studyPaid = $sp ? (float) $sp->total_paid : 0;
            $studyRemain = $sp ? (float) $sp->remain_balance : 0;
            
            $foodPaid = $fp ? (float) $fp->total_paid : 0;
            $foodRemain = $fp ? (float) $fp->remain_balance : 0;
            
            $clothesPaid = (float) $student->clothesBookPayments->where('item_type', 'clothes')->sum('amount_paid');
            $booksPaid = (float) $student->clothesBookPayments->where('item_type', 'book')->sum('amount_paid');
            $grandTotalPaid = $studyPaid + $foodPaid + $clothesPaid + $booksPaid;

            return [
                'serial_number' => $student->serial_number,
                'full_name' => $student->full_name,
                'grade_display' => $student->grade_display,
                'study_paid' => $studyPaid,
                'study_remaining' => $studyRemain,
                'food_paid' => $foodPaid,
                'food_remaining' => $foodRemain,
                'clothes_paid' => $clothesPaid,
                'books_paid' => $booksPaid,
                'grand_total_paid' => $grandTotalPaid,
            ];
        });

        $grade_map = [
            'one'   => 'پۆلی یەکەم',
            'two'   => 'پۆلی دووەم',
            'three' => 'پۆلی سێیەم',
            'four'  => 'پۆلی چوارەم',
            'five'  => 'پۆلی پێنجەم',
            'six'   => 'پۆلی شەشەم',
            'seven' => 'پۆلی حەوتەم',
            'eight' => 'پۆلی هەشتەم',
            'nine'  => 'پۆلی Noyem', // Wait, keep as standard
        ];
        
        $grade_map = [
            'one'   => 'پۆلی یەکەم',
            'two'   => 'پۆلی دووەم',
            'three' => 'پۆلی سێیەم',
            'four'  => 'پۆلی چوارەم',
            'five'  => 'پۆلی پێنجەم',
            'six'   => 'پۆلی شەشەم',
            'seven' => 'پۆلی حەوتەم',
            'eight' => 'پۆلی هەشتەم',
            'nine'  => 'پۆلی نۆیەم',
        ];
        
        $grade_label = $grade ? ($grade_map[$grade] ?? $grade) : null;

        $pdf_data = [
            'records' => $records,
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'academic_year' => $academicYear,
            'grade_label' => $grade_label,
            'total_study' => $records->sum('study_paid'),
            'total_food' => $records->sum('food_paid'),
            'total_clothes' => $records->sum('clothes_paid'),
            'total_books' => $records->sum('books_paid'),
            'total_income' => $records->sum('grand_total_paid'),
        ];

        return view('reports.annual-income', $pdf_data);
    }

    /**
     * Food income monthly breakdown report
     */
    public function foodIncome(Request $request): JsonResponse
    {
        $year = $request->get('year', now()->year);

        $monthlyData = [];
        $runningTotal = 0;

        for ($month = 1; $month <= 12; $month++) {
            $collected = (float) FoodInstallment::whereYear('payment_date', $year)
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
            'message' => 'Food income report generated',
        ]);
    }

    /**
     * Export food income report as CSV
     */
    public function exportFoodIncome(Request $request)
    {
        $year = $request->get('year', now()->year);

        $csv = "Month,Collected Amount,Running Total\n";

        $runningTotal = 0;
        for ($month = 1; $month <= 12; $month++) {
            $collected = (float) FoodInstallment::whereYear('payment_date', $year)
                ->whereMonth('payment_date', $month)
                ->where('is_returned', false)
                ->sum('amount_paid');

            $runningTotal += $collected;
            $monthName = date('F', mktime(0, 0, 0, $month, 1));

            $csv .= implode(',', [
                $monthName,
                $collected,
                $runningTotal,
            ]) . "\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="food_income_report_' . $year . '.csv"');
    }

    public function clothesPayments(Request $request): JsonResponse
    {
        $query = ClothesBookPayment::where('item_type', 'clothes')->with('student');

        if ($request->filled('from') || $request->filled('to')) {
            $from = $request->from ?? '1970-01-01';
            $to = $request->to ?? now()->toDateString();
            $query->whereBetween('payment_date', [$from, $to]);
        }

        if ($request->filled('month')) {
            $query->whereMonth('payment_date', $request->month);
        }

        if ($request->filled('grade')) {
            $query->whereHas('student', fn ($q) => $q->where('grade', $request->grade));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $payments = $query->orderByDesc('payment_date')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $payments,
                'summary' => [
                    'count' => $payments->count(),
                    'total_amount' => $payments->sum('amount_paid'),
                ],
            ],
            'message' => 'Clothes payments report generated',
        ]);
    }

    public function bookPayments(Request $request): JsonResponse
    {
        $query = ClothesBookPayment::where('item_type', 'book')->with('student');

        if ($request->filled('from') || $request->filled('to')) {
            $from = $request->from ?? '1970-01-01';
            $to = $request->to ?? now()->toDateString();
            $query->whereBetween('payment_date', [$from, $to]);
        }

        if ($request->filled('month')) {
            $query->whereMonth('payment_date', $request->month);
        }

        if ($request->filled('grade')) {
            $query->whereHas('student', fn ($q) => $q->where('grade', $request->grade));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $payments = $query->orderByDesc('payment_date')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $payments,
                'summary' => [
                    'count' => $payments->count(),
                    'total_amount' => $payments->sum('amount_paid'),
                ],
            ],
            'message' => 'Book payments report generated',
        ]);
    }

    public function pdfClothesPayments(Request $request)
    {
        $query = ClothesBookPayment::where('item_type', 'clothes')->with('student');

        if ($request->filled('from') || $request->filled('to')) {
            $from = $request->from ?? '1970-01-01';
            $to = $request->to ?? now()->toDateString();
            $query->whereBetween('payment_date', [$from, $to]);
        }

        if ($request->filled('month')) {
            $query->whereMonth('payment_date', $request->month);
        }

        if ($request->filled('grade')) {
            $query->whereHas('student', fn ($q) => $q->where('grade', $request->grade));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $payments = $query->orderByDesc('payment_date')->get();

        $grade_map = [
            'one'   => 'پۆلی یەکەم',
            'two'   => 'پۆلی دووەم',
            'three' => 'پۆلی سێیەم',
            'four'  => 'پۆلی چوارەم',
            'five'  => 'پۆلی پێنجەم',
            'six'   => 'پۆلی شەشەم',
            'seven' => 'پۆلی حەوتەم',
            'eight' => 'پۆلی هەشتەم',
            'nine'  => 'پۆلی نۆیەم',
        ];
        
        $grade_label = $request->filled('grade') ? ($grade_map[$request->grade] ?? $request->grade) : null;

        $month_names = [
            '1'  => 'کانوونی دووەم (1)',
            '2'  => 'شوبات (2)',
            '3'  => 'ئادار (3)',
            '4'  => 'نیسان (4)',
            '5'  => 'ئایار (5)',
            '6'  => 'حوزەیران (6)',
            '7'  => 'تەممووز (7)',
            '8'  => 'ئاب (8)',
            '9'  => 'ئەیلوول (9)',
            '10' => 'تشرینی یەکەم (10)',
            '11' => 'تشرینی دووەم (11)',
            '12' => 'کانوونی یەکەم (12)',
        ];
        
        $date_range = ($request->from ?? 'سەرەتا') . ' بۆ ' . ($request->to ?? 'ئێستا');
        if ($request->filled('month')) {
            $date_range = 'مانگی ' . ($month_names[$request->month] ?? $request->month);
        }

        $pdf_data = [
            'payments' => $payments,
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'date_range' => $date_range,
            'grade_label' => $grade_label,
            'total' => $payments->sum('amount_paid'),
            'title' => 'ڕاپۆرتی داهاتی جلوبەرگ',
        ];

        return view('reports.clothes-payments', $pdf_data);
    }

    public function pdfBookPayments(Request $request)
    {
        $query = ClothesBookPayment::where('item_type', 'book')->with('student');

        if ($request->filled('from') || $request->filled('to')) {
            $from = $request->from ?? '1970-01-01';
            $to = $request->to ?? now()->toDateString();
            $query->whereBetween('payment_date', [$from, $to]);
        }

        if ($request->filled('month')) {
            $query->whereMonth('payment_date', $request->month);
        }

        if ($request->filled('grade')) {
            $query->whereHas('student', fn ($q) => $q->where('grade', $request->grade));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $payments = $query->orderByDesc('payment_date')->get();

        $grade_map = [
            'one'   => 'پۆلی یەکەم',
            'two'   => 'پۆلی دووەم',
            'three' => 'پۆلی سێیەم',
            'four'  => 'پۆلی چوارەم',
            'five'  => 'پۆلی پێنجەم',
            'six'   => 'پۆلی شەشەم',
            'seven' => 'پۆلی حەوتەم',
            'eight' => 'پۆلی هەشتەم',
            'nine'  => 'پۆلی نۆیەم',
        ];
        
        $grade_label = $request->filled('grade') ? ($grade_map[$request->grade] ?? $request->grade) : null;

        $month_names = [
            '1'  => 'کانوونی دووەم (1)',
            '2'  => 'شوبات (2)',
            '3'  => 'ئادار (3)',
            '4'  => 'نیسان (4)',
            '5'  => 'ئایار (5)',
            '6'  => 'حوزەیران (6)',
            '7'  => 'تەممووز (7)',
            '8'  => 'ئاب (8)',
            '9'  => 'ئەیلوول (9)',
            '10' => 'تشرینی یەکەم (10)',
            '11' => 'تشرینی دووەم (11)',
            '12' => 'کانوونی یەکەم (12)',
        ];
        
        $date_range = ($request->from ?? 'سەرەتا') . ' بۆ ' . ($request->to ?? 'ئێستا');
        if ($request->filled('month')) {
            $date_range = 'مانگی ' . ($month_names[$request->month] ?? $request->month);
        }

        $pdf_data = [
            'payments' => $payments,
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'date_range' => $date_range,
            'grade_label' => $grade_label,
            'total' => $payments->sum('amount_paid'),
            'title' => 'ڕاپۆرتی داهاتی کتێب',
        ];

        return view('reports.book-payments', $pdf_data);
    }

    /**
     * Government Expenses report data
     */
    public function governmentExpenses(Request $request): JsonResponse
    {
        $query = Expense::query()->whereIn('category', [
            'ڕاپۆرتی خەرجی حکومەت',
            'ڕاپۆرتی پارەی کارەبای حکومەت'
        ]);

        if ($request->filled('from') || $request->filled('to')) {
            $query->byDateRange($request->from, $request->to);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
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
            'message' => 'Government expenses report generated',
        ]);
    }

    /**
     * PDF print of general expenses
     */
    public function pdfExpenses(Request $request)
    {
        $query = Expense::query();

        if ($request->filled('from') || $request->filled('to')) {
            $query->byDateRange($request->from, $request->to);
        }

        if ($request->filled('category')) {
            $query->byCategory($request->category);
        }

        $expenses = $query->orderByDesc('expense_date')->get();

        $date_range = ($request->from ?? 'سەرەتا') . ' بۆ ' . ($request->to ?? 'ئێستا');

        $pdf_data = [
            'expenses' => $expenses,
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'date_range' => $date_range,
            'category' => $request->category ?? 'هەموو جۆرەکان',
            'total' => $expenses->sum('amount'),
            'title' => 'ڕاپۆرتی گشتی خەرجییەکان',
        ];

        return view('reports.expenses', $pdf_data);
    }

    /**
     * PDF print of government expenses
     */
    public function pdfGovernmentExpenses(Request $request)
    {
        $query = Expense::query()->whereIn('category', [
            'ڕاپۆرتی خەرجی حکومەت',
            'ڕاپۆرتی پارەی کارەبای حکومەت'
        ]);

        if ($request->filled('from') || $request->filled('to')) {
            $query->byDateRange($request->from, $request->to);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $expenses = $query->orderByDesc('expense_date')->get();

        $date_range = ($request->from ?? 'سەرەتا') . ' بۆ ' . ($request->to ?? 'ئێستا');

        $pdf_data = [
            'expenses' => $expenses,
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'date_range' => $date_range,
            'category' => $request->category ?? 'هەموو خەرجییە حکومییەکان',
            'total' => $expenses->sum('amount'),
            'title' => 'ڕاپۆرتی خەرجی حکومەت',
        ];

        return view('reports.government-expenses', $pdf_data);
    }
}

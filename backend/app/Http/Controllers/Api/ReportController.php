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
        $recentStudy = StudyInstallment::with(['student' => fn($q) => $q->withTrashed()])
            ->select('id', 'invoice_no', 'student_id', 'amount_paid', 'payment_date', 'is_returned', DB::raw("'study' as type"))
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $recentFood = FoodInstallment::with(['student' => fn($q) => $q->withTrashed()])
            ->select('id', 'invoice_no', 'student_id', 'amount_paid', 'payment_date', 'is_returned', DB::raw("'food' as type"))
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $recentTransactions = $recentStudy->merge($recentFood)
            ->sortByDesc('payment_date')
            ->take(10)
            ->values();

        // Top 10 outstanding balances
        $outstandingBalances = StudyPayment::whereHas('student')
            ->with('student')
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

        // Monthly revenue vs expenses (current year) — 3 queries instead of 36
        $currentYear = now()->year;

        $studyMonthly = StudyInstallment::selectRaw('EXTRACT(MONTH FROM payment_date)::int as m, SUM(amount_paid) as total')
            ->whereYear('payment_date', $currentYear)
            ->where('is_returned', false)
            ->groupByRaw('EXTRACT(MONTH FROM payment_date)')
            ->pluck('total', 'm');

        $foodMonthly = FoodInstallment::selectRaw('EXTRACT(MONTH FROM payment_date)::int as m, SUM(amount_paid) as total')
            ->whereYear('payment_date', $currentYear)
            ->where('is_returned', false)
            ->groupByRaw('EXTRACT(MONTH FROM payment_date)')
            ->pluck('total', 'm');

        $expenseMonthly = Expense::selectRaw('EXTRACT(MONTH FROM expense_date)::int as m, SUM(amount) as total')
            ->whereYear('expense_date', $currentYear)
            ->groupByRaw('EXTRACT(MONTH FROM expense_date)')
            ->pluck('total', 'm');

        $monthlyData = [];
        for ($month = 1; $month <= 12; $month++) {
            $revenue = (float) ($studyMonthly[$month] ?? 0) + (float) ($foodMonthly[$month] ?? 0);
            $expenses = (float) ($expenseMonthly[$month] ?? 0);

            $monthlyData[] = [
                'month' => date('M', mktime(0, 0, 0, $month, 1)),
                'revenue' => $revenue,
                'expenses' => $expenses,
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
        $query = StudyInstallment::with(['student' => fn ($q) => $q->withTrashed()]);

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
        $query = FoodInstallment::with(['student' => fn ($q) => $q->withTrashed()]);

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
     * Kurdish month names used in report headers.
     */
    private const MONTH_NAMES = [
        1  => 'کانوونی دووەم (1)',
        2  => 'شوبات (2)',
        3  => 'ئادار (3)',
        4  => 'نیسان (4)',
        5  => 'ئایار (5)',
        6  => 'حوزەیران (6)',
        7  => 'تەممووز (7)',
        8  => 'ئاب (8)',
        9  => 'ئەیلوول (9)',
        10 => 'تشرینی یەکەم (10)',
        11 => 'تشرینی دووەم (11)',
        12 => 'کانوونی یەکەم (12)',
    ];

    private const GRADE_NAMES = [
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

    /**
     * Expenses matching the report filters (date range, month, category).
     * The general report leaves food bills out; they have their own report.
     */
    private function filteredExpenses(Request $request, bool $food)
    {
        $query = $food ? Expense::food() : Expense::exceptFood();

        if ($request->filled('from') || $request->filled('to')) {
            $query->byDateRange($request->from, $request->to);
        }

        $query->byMonth($request->month);

        if (!$food && $request->filled('category')) {
            $query->byCategory($request->category);
        }

        return $query->orderByDesc('expense_date')->orderByDesc('id')->get();
    }

    private function expensesResponse($expenses, string $message): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'records' => $expenses,
                'summary' => [
                    'count' => $expenses->count(),
                    'total_amount' => $expenses->sum('amount'),
                ],
            ],
            'message' => $message,
        ]);
    }

    private function expensesPdf(Request $request, bool $food)
    {
        $expenses = $this->filteredExpenses($request, $food);

        $date_range = ($request->from ?? 'سەرەتا') . ' بۆ ' . ($request->to ?? 'ئێستا');
        if ($request->filled('month')) {
            $date_range = 'مانگی ' . (self::MONTH_NAMES[(int) $request->month] ?? $request->month);
        }

        // Totals per category, largest first, for the summary under the table
        $byCategory = $expenses->groupBy(fn ($e) => $e->category ?: 'تر')
            ->map(fn ($group, $name) => [
                'category' => $name,
                'count' => $group->count(),
                'total' => (float) $group->sum('amount'),
            ])
            ->sortByDesc('total')
            ->values();

        return view('reports.expenses', [
            'expenses' => $expenses,
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'date_range' => $date_range,
            'category' => $food ? Expense::FOOD_CATEGORY : ($request->category ?: 'هەموو جۆرەکان (بێ نانخواردن)'),
            'total' => $expenses->sum('amount'),
            'title' => $food ? 'ڕاپۆرتی خەرجی نانخواردن' : 'ڕاپۆرتی گشتی خەرجییەکان',
            'by_category' => $food ? collect() : $byCategory,
        ]);
    }

    /**
     * Expenses report (food bills excluded, see foodExpenses)
     */
    public function expenses(Request $request): JsonResponse
    {
        return $this->expensesResponse($this->filteredExpenses($request, false), 'Expenses report generated');
    }

    /**
     * Food expenses report
     */
    public function foodExpenses(Request $request): JsonResponse
    {
        return $this->expensesResponse($this->filteredExpenses($request, true), 'Food expenses report generated');
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

        $students = $query->active()->orderByRaw('LENGTH(serial_number) ASC, serial_number ASC')->get();

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
     * Printable student list: name, grade and the fixed tuition fee.
     */
    public function pdfStudentList(Request $request)
    {
        $academicYear = config('school.academic_year', '2025-2026');

        $query = Student::active()->with([
            'studyPayments' => fn ($q) => $q->where('academic_year', $academicYear),
        ]);

        if ($request->filled('grade')) {
            $query->byGrade($request->grade);
        }

        if ($request->filled('search')) {
            $query->search($request->search);
        }

        $records = $query->orderByRaw('LENGTH(serial_number) ASC, serial_number ASC')->get()
            ->map(fn ($student) => [
                'serial_number' => $student->serial_number,
                'full_name' => $student->full_name,
                'grade_label' => self::GRADE_NAMES[$student->grade] ?? $student->grade,
                'fixed_fee' => (float) ($student->studyPayments->first()?->price_after_discount ?? 0),
            ]);

        return view('reports.student-list', [
            'records' => $records,
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'academic_year' => $academicYear,
            'grade_label' => $request->filled('grade') ? (self::GRADE_NAMES[$request->grade] ?? $request->grade) : null,
            'total_fee' => $records->sum('fixed_fee'),
        ]);
    }

    /**
     * Students who have paid nothing for food and/or clothes in an academic year.
     *
     * `type` narrows it to `food` or `clothes`; without it a student is listed
     * when either one is unpaid. `month` only applies to food (it is paid monthly).
     */
    private function unpaidStudentRecords(Request $request): array
    {
        $academicYear = $request->filled('academic_year') ? $request->academic_year : config('school.academic_year', '2025-2026');
        $type = in_array($request->type, ['food', 'clothes'], true) ? $request->type : null;
        $month = $request->filled('month') ? (int) $request->month : null;

        $foodPaid = FoodInstallment::where('is_returned', false)
            ->whereHas('foodPayment', fn ($q) => $q->where('academic_year', $academicYear))
            ->when($month, fn ($q) => $q->whereMonth('payment_date', $month))
            ->groupBy('student_id')
            ->selectRaw('student_id, SUM(amount_paid) as total')
            ->pluck('total', 'student_id');

        $clothesPaid = ClothesBookPayment::where('academic_year', $academicYear)
            ->whereIn('item_type', ['clothes', 'both'])
            ->groupBy('student_id')
            ->selectRaw('student_id, SUM(amount_paid) as total')
            ->pluck('total', 'student_id');

        $query = Student::active();
        if ($request->filled('grade')) {
            $query->byGrade($request->grade);
        }

        $records = $query->orderByRaw('LENGTH(serial_number) ASC, serial_number ASC')->get()
            ->map(function ($student) use ($foodPaid, $clothesPaid) {
                $food = (float) ($foodPaid[$student->id] ?? 0);
                $clothes = (float) ($clothesPaid[$student->id] ?? 0);

                return [
                    'id' => $student->id,
                    'serial_number' => $student->serial_number,
                    'full_name' => $student->full_name,
                    'grade' => $student->grade,
                    'grade_label' => self::GRADE_NAMES[$student->grade] ?? $student->grade,
                    'food_paid' => $food,
                    'clothes_paid' => $clothes,
                    'food_unpaid' => $food <= 0,
                    'clothes_unpaid' => $clothes <= 0,
                ];
            })
            ->filter(fn ($r) => match ($type) {
                'food' => $r['food_unpaid'],
                'clothes' => $r['clothes_unpaid'],
                default => $r['food_unpaid'] || $r['clothes_unpaid'],
            })
            ->values();

        return [
            'records' => $records,
            'summary' => [
                'count' => $records->count(),
                'food_unpaid_count' => $records->where('food_unpaid', true)->count(),
                'clothes_unpaid_count' => $records->where('clothes_unpaid', true)->count(),
            ],
            'academic_year' => $academicYear,
            'type' => $type,
            'month' => $month,
        ];
    }

    public function unpaidStudents(Request $request): JsonResponse
    {
        $result = $this->unpaidStudentRecords($request);

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $result['records'],
                'summary' => $result['summary'],
            ],
            'message' => 'Unpaid students report generated',
        ]);
    }

    public function pdfUnpaidStudents(Request $request)
    {
        $result = $this->unpaidStudentRecords($request);

        $title = match ($result['type']) {
            'food' => 'ڕاپۆرتی ئەو قوتابیانەی پارەی نانخواردنیان نەداوە',
            'clothes' => 'ڕاپۆرتی ئەو قوتابیانەی پارەی جلوبەرگیان نەداوە',
            default => 'ڕاپۆرتی ئەو قوتابیانەی پارەی نانخواردن یان جلوبەرگیان نەداوە',
        };

        return view('reports.unpaid-students', array_merge($result, [
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'title' => $title,
            'grade_label' => $request->filled('grade') ? (self::GRADE_NAMES[$request->grade] ?? $request->grade) : null,
            'month_label' => $result['month'] ? (self::MONTH_NAMES[$result['month']] ?? $result['month']) : null,
        ]));
    }

    /**
     * Export study installments as CSV
     */
    public function exportStudyInstallments(Request $request)
    {
        $query = StudyInstallment::with(['student' => fn ($q) => $q->withTrashed()]);

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
                '"' . ($inst->student?->full_name ?? 'Deleted Student') . '"',
                $inst->student?->grade_display ?? 'N/A',
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
        $query = StudyInstallment::with(['student' => fn ($q) => $q->withTrashed()]);

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
        $query = FoodInstallment::with(['student' => fn ($q) => $q->withTrashed()]);

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
        ])->orderByRaw('LENGTH(serial_number) ASC, serial_number ASC')->get();

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
                'summary' => array_merge([
                    'total_study' => $totalStudy,
                    'total_food' => $totalFood,
                    'total_clothes' => $totalClothes,
                    'total_books' => $totalBooks,
                    'total_income' => $totalIncome,
                ], $this->profitSummary($academicYear, $grade ? null : $totalIncome)),
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
        ])->orderByRaw('LENGTH(serial_number) ASC, serial_number ASC')->get();

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
        ])->orderByRaw('LENGTH(serial_number) ASC, serial_number ASC')->get();

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
            'profit' => $this->profitSummary($academicYear, $grade ? null : $records->sum('grand_total_paid')),
        ];

        return view('reports.annual-income', $pdf_data);
    }

    /**
     * School-wide profit for an academic year: everything collected minus every expense.
     *
     * Expenses carry no academic year, but switching years wipes them
     * (SettingController::update), so every stored expense belongs to the
     * current year and older years have none left.
     *
     * @param  float|null  $schoolIncome  Income already summed for the whole school, or null to sum it here
     */
    private function profitSummary(string $academicYear, ?float $schoolIncome = null): array
    {
        if ($schoolIncome === null) {
            $activeStudent = fn ($q) => $q->active();

            $schoolIncome = (float) StudyPayment::where('academic_year', $academicYear)->whereHas('student', $activeStudent)->sum('total_paid')
                + (float) FoodPayment::where('academic_year', $academicYear)->whereHas('student', $activeStudent)->sum('total_paid')
                + (float) ClothesBookPayment::where('academic_year', $academicYear)
                    ->whereIn('item_type', ['clothes', 'book'])
                    ->whereHas('student', $activeStudent)
                    ->sum('amount_paid');
        }

        $totalExpenses = $academicYear === config('school.academic_year')
            ? (float) Expense::sum('amount')
            : 0.0;

        return [
            'school_income' => $schoolIncome,
            'total_expenses' => $totalExpenses,
            'net_profit' => $schoolIncome - $totalExpenses,
        ];
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
        $query = ClothesBookPayment::where('item_type', 'clothes')->with(['student' => fn ($q) => $q->withTrashed()]);

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
        $query = ClothesBookPayment::where('item_type', 'book')->with(['student' => fn ($q) => $q->withTrashed()]);

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
        $query = ClothesBookPayment::where('item_type', 'clothes')->with(['student' => fn ($q) => $q->withTrashed()]);

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
        $query = ClothesBookPayment::where('item_type', 'book')->with(['student' => fn ($q) => $q->withTrashed()]);

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
        return $this->expensesPdf($request, false);
    }

    /**
     * PDF print of food expenses
     */
    public function pdfFoodExpenses(Request $request)
    {
        return $this->expensesPdf($request, true);
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

    /**
     * Study debts report (students with remaining tuition balance)
     */
    public function studyDebts(Request $request): JsonResponse
    {
        $academicYear = $request->get('academic_year', config('school.academic_year', '2026-2027'));
        $grade = $request->get('grade');

        $query = Student::active()->whereHas('studyPayments', function ($q) use ($academicYear) {
            $q->where('academic_year', $academicYear)
              ->whereRaw('annual_price - discount - total_paid > 0');
        });

        if ($grade) {
            $query->byGrade($grade);
        }

        $students = $query->with([
            'studyPayments' => fn ($q) => $q->where('academic_year', $academicYear)
        ])->orderByRaw('LENGTH(serial_number) ASC, serial_number ASC')->get();

        $records = $students->map(function ($student) {
            $sp = $student->studyPayments->first();
            
            $annualPrice = $sp ? (float) $sp->annual_price : 0;
            $discount = $sp ? (float) $sp->discount : 0;
            $priceAfterDiscount = $sp ? (float) $sp->price_after_discount : 0;
            $totalPaid = $sp ? (float) $sp->total_paid : 0;
            $remainBalance = $sp ? (float) $sp->remain_balance : 0;

            return [
                'id' => $student->id,
                'serial_number' => $student->serial_number,
                'full_name' => $student->full_name,
                'grade' => $student->grade,
                'grade_display' => $student->grade_display,
                'annual_price' => $annualPrice,
                'discount' => $discount,
                'price_after_discount' => $priceAfterDiscount,
                'total_paid' => $totalPaid,
                'remain_balance' => $remainBalance,
            ];
        });

        $totalDebt = $records->sum('remain_balance');
        $totalPaid = $records->sum('total_paid');

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $records,
                'summary' => [
                    'count' => $records->count(),
                    'total_paid' => $totalPaid,
                    'total_debt' => $totalDebt,
                ],
            ],
            'message' => 'Study debts report generated',
        ]);
    }

    /**
     * Export study debts report as CSV
     */
    public function exportStudyDebts(Request $request)
    {
        $academicYear = $request->get('academic_year', config('school.academic_year', '2026-2027'));
        $grade = $request->get('grade');

        $query = Student::active()->whereHas('studyPayments', function ($q) use ($academicYear) {
            $q->where('academic_year', $academicYear)
              ->whereRaw('annual_price - discount - total_paid > 0');
        });

        if ($grade) {
            $query->byGrade($grade);
        }

        $students = $query->with([
            'studyPayments' => fn ($q) => $q->where('academic_year', $academicYear)
        ])->orderByRaw('LENGTH(serial_number) ASC, serial_number ASC')->get();

        $csv = "Serial,Student Name,Grade,Tuition Price,Paid Amount,Remaining Debt\n";

        foreach ($students as $student) {
            $sp = $student->studyPayments->first();
            $priceAfterDiscount = $sp ? (float) $sp->price_after_discount : 0;
            $totalPaid = $sp ? (float) $sp->total_paid : 0;
            $remainBalance = $sp ? (float) $sp->remain_balance : 0;

            $csv .= implode(',', [
                $student->serial_number,
                '"' . $student->full_name . '"',
                $student->grade_display,
                $priceAfterDiscount,
                $totalPaid,
                $remainBalance,
            ]) . "\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="study_debts_report_' . $academicYear . '.csv"');
    }

    /**
     * PDF print layout for study debts report
     */
    public function pdfStudyDebts(Request $request)
    {
        $academicYear = $request->get('academic_year', config('school.academic_year', '2026-2027'));
        $grade = $request->get('grade');

        $query = Student::active()->whereHas('studyPayments', function ($q) use ($academicYear) {
            $q->where('academic_year', $academicYear)
              ->whereRaw('annual_price - discount - total_paid > 0');
        });

        if ($grade) {
            $query->byGrade($grade);
        }

        $students = $query->with([
            'studyPayments' => fn ($q) => $q->where('academic_year', $academicYear)
        ])->orderByRaw('LENGTH(serial_number) ASC, serial_number ASC')->get();

        $records = $students->map(function ($student) {
            $sp = $student->studyPayments->first();
            return [
                'serial_number' => $student->serial_number,
                'full_name' => $student->full_name,
                'grade_display' => $student->grade_display,
                'price_after_discount' => $sp ? (float) $sp->price_after_discount : 0,
                'total_paid' => $sp ? (float) $sp->total_paid : 0,
                'remain_balance' => $sp ? (float) $sp->remain_balance : 0,
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
            'nine'  => 'پۆلی نۆیەم',
        ];
        
        $grade_label = $grade ? ($grade_map[$grade] ?? $grade) : null;

        $pdf_data = [
            'records' => $records,
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'academic_year' => $academicYear,
            'grade_label' => $grade_label,
            'total_paid' => $records->sum('total_paid'),
            'total_debt' => $records->sum('remain_balance'),
        ];

        return view('reports.study-debts', $pdf_data);
    }
}

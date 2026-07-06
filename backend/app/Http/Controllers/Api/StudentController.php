<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudyPayment;
use App\Models\FoodPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Student::query();

        if ($request->filled('grade')) {
            $query->byGrade($request->grade);
        }

        if ($request->filled('search')) {
            $query->search($request->search);
        }

        if (! $request->boolean('include_deleted')) {
            $query->whereNull('deleted_at');
        }

        // Include payment balances
        $query->withSum(['studyPayments as study_balance' => function ($q) {
            $q->where('academic_year', config('school.academic_year', '2025-2026'));
        }], \Illuminate\Support\Facades\DB::raw('annual_price - discount - total_paid'));

        $query->withSum(['foodPayments as food_balance' => function ($q) {
            $q->where('academic_year', config('school.academic_year', '2025-2026'));
        }], \Illuminate\Support\Facades\DB::raw('monthly_price - discount - total_paid'));

        $perPage = $request->integer('per_page', 20);
        $students = $query->orderBy('full_name')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $students->items(),
            'message' => 'Students retrieved',
            'meta' => [
                'current_page' => $students->currentPage(),
                'last_page' => $students->lastPage(),
                'per_page' => $students->perPage(),
                'total' => $students->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (!$request->filled('serial_number')) {
            $maxSerial = Student::withTrashed()->get()->map(function ($s) {
                return is_numeric($s->serial_number) ? (int)$s->serial_number : 0;
            })->max();
            
            $nextSerial = $maxSerial ? ($maxSerial + 1) : 1;
            while (Student::where('serial_number', (string)$nextSerial)->exists()) {
                $nextSerial++;
            }
            $request->merge(['serial_number' => (string)$nextSerial]);
        }

        $validated = $request->validate([
            'serial_number' => 'required|string|max:20|unique:students,serial_number',
            'full_name' => 'required|string|max:150',
            'grade' => ['required', Rule::in(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'])],
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'tuition_price' => 'required|numeric|min:0',
            'subscribe_food' => 'sometimes|boolean',
        ]);

        $student = Student::create([
            'serial_number' => $validated['serial_number'],
            'full_name' => $validated['full_name'],
            'grade' => $validated['grade'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Auto-create study payment for current academic year
        $academicYear = config('school.academic_year', '2025-2026');
        $studyPrice = $validated['tuition_price'];

        StudyPayment::create([
            'student_id' => $student->id,
            'academic_year' => $academicYear,
            'annual_price' => $studyPrice,
            'discount' => 0,
            'total_paid' => 0,
        ]);

        // Auto-create food payment for current academic year ONLY if subscribed
        if ($request->boolean('subscribe_food')) {
            FoodPayment::create([
                'student_id' => $student->id,
                'academic_year' => $academicYear,
                'monthly_price' => config('school.food_price', 150000),
                'discount' => 0,
                'total_paid' => 0,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $student,
            'message' => 'Student created successfully',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $student = Student::with([
            'studyPayments' => fn ($q) => $q->orderByDesc('academic_year'),
            'foodPayments' => fn ($q) => $q->orderByDesc('academic_year'),
            'studyInstallments' => fn ($q) => $q->orderByDesc('payment_date')->limit(20),
            'foodInstallments' => fn ($q) => $q->orderByDesc('payment_date')->limit(20),
            'clothesBookPayments' => fn ($q) => $q->orderByDesc('payment_date')->limit(20),
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $student,
            'message' => 'Student details retrieved',
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $student = Student::findOrFail($id);

        $validated = $request->validate([
            'serial_number' => ['sometimes', 'required', 'string', 'max:20', Rule::unique('students')->ignore($student->id)],
            'full_name' => 'sometimes|required|string|max:150',
            'grade' => ['sometimes', 'required', Rule::in(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'])],
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'subscribe_food' => 'sometimes|boolean',
        ]);

        $student->update($validated);

        if ($request->has('subscribe_food')) {
            $academicYear = config('school.academic_year', '2025-2026');
            if ($request->boolean('subscribe_food')) {
                FoodPayment::firstOrCreate(
                    [
                        'student_id' => $student->id,
                        'academic_year' => $academicYear,
                    ],
                    [
                        'monthly_price' => config('school.food_price', 150000),
                        'discount' => 0,
                        'total_paid' => 0,
                    ]
                );
            } else {
                $foodPayment = FoodPayment::where('student_id', $student->id)
                    ->where('academic_year', $academicYear)
                    ->first();
                if ($foodPayment) {
                    if ($foodPayment->total_paid == 0) {
                        $foodPayment->delete();
                    } else {
                        $foodPayment->update(['monthly_price' => $foodPayment->total_paid]);
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => $student->fresh(),
            'message' => 'Student updated successfully',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $student->delete(); // soft delete

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Student deleted successfully',
        ]);
    }

    /**
     * Autocomplete search for student name/serial.
     * GET /api/students-search?q=
     */
    public function search(Request $request): JsonResponse
    {
        $q = $request->get('q', '');

        if (strlen($q) < 1) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        $students = Student::query()
            ->search($q)
            ->active()
            ->select('id', 'serial_number', 'full_name', 'grade')
            ->limit(10)
            ->get()
            ->map(function ($student) {
                $student->grade_display = Student::GRADE_MAP[$student->grade] ?? $student->grade;
                return $student;
            });

        return response()->json([
            'success' => true,
            'data' => $students,
        ]);
    }
}

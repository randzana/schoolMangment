<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudyPayment;
use App\Services\StudyPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudyPaymentController extends Controller
{
    public function __construct(
        protected StudyPaymentService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = StudyPayment::with('student');

        if ($request->filled('grade')) {
            $query->byGrade($request->grade);
        }

        if ($request->filled('search')) {
            $query->search($request->search);
        }

        if ($request->filled('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        } else {
            $query->currentYear();
        }

        $perPage = $request->integer('per_page', 20);
        $payments = $query->orderBy('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $payments->items(),
            'message' => 'Study payments retrieved',
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year' => 'sometimes|string|max:9',
            'annual_price' => 'required|numeric|min:0',
            'discount' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $academicYear = $validated['academic_year'] ?? config('school.academic_year', '2025-2026');

        // Upsert — create or update for student+year
        $payment = StudyPayment::updateOrCreate(
            [
                'student_id' => $validated['student_id'],
                'academic_year' => $academicYear,
            ],
            [
                'annual_price' => $validated['annual_price'],
                'discount' => $validated['discount'] ?? 0,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $payment->load('student'),
            'message' => 'Study payment saved successfully',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $payment = StudyPayment::with(['student', 'installments' => fn ($q) => $q->orderByDesc('payment_date')])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $payment,
            'message' => 'Study payment details retrieved',
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $payment = StudyPayment::findOrFail($id);

        $validated = $request->validate([
            'annual_price' => 'sometimes|required|numeric|min:0',
            'discount' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $payment->update($validated);

        return response()->json([
            'success' => true,
            'data' => $payment->fresh()->load('student'),
            'message' => 'Study payment updated successfully',
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $summary = $this->service->getSummary($request->get('academic_year'));

        return response()->json([
            'success' => true,
            'data' => $summary,
            'message' => 'Study payments summary retrieved',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FoodPayment;
use App\Services\FoodPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FoodPaymentController extends Controller
{
    public function __construct(
        protected FoodPaymentService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = FoodPayment::with('student');

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
            'message' => 'Food payments retrieved',
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
            'monthly_price' => 'required|numeric|min:0',
            'discount' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $academicYear = $validated['academic_year'] ?? config('school.academic_year', '2025-2026');

        $payment = FoodPayment::updateOrCreate(
            [
                'student_id' => $validated['student_id'],
                'academic_year' => $academicYear,
            ],
            [
                'monthly_price' => $validated['monthly_price'],
                'discount' => $validated['discount'] ?? 0,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $payment->load('student'),
            'message' => 'Food payment saved successfully',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $payment = FoodPayment::with(['student', 'installments' => fn ($q) => $q->orderByDesc('payment_date')])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $payment,
            'message' => 'Food payment details retrieved',
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $payment = FoodPayment::findOrFail($id);

        $validated = $request->validate([
            'monthly_price' => 'sometimes|required|numeric|min:0',
            'discount' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $payment->update($validated);

        return response()->json([
            'success' => true,
            'data' => $payment->fresh()->load('student'),
            'message' => 'Food payment updated successfully',
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $summary = $this->service->getSummary($request->get('academic_year'));

        return response()->json([
            'success' => true,
            'data' => $summary,
            'message' => 'Food payments summary retrieved',
        ]);
    }
}

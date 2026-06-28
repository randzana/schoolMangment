<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalaryExpense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SalaryExpense::with('teacher');

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        if ($request->filled('month')) {
            $query->where('month', $request->month);
        }

        $perPage = $request->integer('per_page', 20);
        $salaries = $query->orderByDesc('month')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $salaries->items(),
            'message' => 'Salary expenses retrieved',
            'meta' => [
                'current_page' => $salaries->currentPage(),
                'last_page' => $salaries->lastPage(),
                'per_page' => $salaries->perPage(),
                'total' => $salaries->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'month' => 'required|string|max:7', // 'YYYY-MM'
            'amount_paid' => 'required|numeric|min:0',
            'paid_date' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        // Check for duplicate
        $existing = SalaryExpense::where('teacher_id', $validated['teacher_id'])
            ->where('month', $validated['month'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Salary for this teacher and month already exists.',
                'errors' => ['month' => ['This teacher has already been paid for this month.']],
            ], 422);
        }

        $validated['created_by'] = $request->user()->id;
        $validated['paid_date'] = $validated['paid_date'] ?? now()->toDateString();

        $salary = SalaryExpense::create($validated);

        return response()->json([
            'success' => true,
            'data' => $salary->load('teacher'),
            'message' => 'Salary expense created successfully',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $salary = SalaryExpense::with('teacher')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $salary,
            'message' => 'Salary expense details retrieved',
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $salary = SalaryExpense::findOrFail($id);

        $validated = $request->validate([
            'amount_paid' => 'sometimes|required|numeric|min:0',
            'paid_date' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        $salary->update($validated);

        return response()->json([
            'success' => true,
            'data' => $salary->fresh()->load('teacher'),
            'message' => 'Salary expense updated successfully',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $salary = SalaryExpense::findOrFail($id);
        $salary->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Salary expense deleted',
        ]);
    }
}

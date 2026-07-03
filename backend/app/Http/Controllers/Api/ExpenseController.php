<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Expense::query();

        if ($request->filled('from') || $request->filled('to')) {
            $query->byDateRange($request->from, $request->to);
        }

        if ($request->filled('category')) {
            $query->byCategory($request->category);
        }

        $perPage = $request->integer('per_page', 20);
        $expenses = $query->orderByDesc('expense_date')->paginate($perPage);

        // Summary
        $totalThisMonth = Expense::whereYear('expense_date', now()->year)
            ->whereMonth('expense_date', now()->month)
            ->sum('amount');

        $totalThisYear = Expense::whereYear('expense_date', now()->year)->sum('amount');

        return response()->json([
            'success' => true,
            'data' => $expenses->items(),
            'message' => 'Expenses retrieved',
            'meta' => [
                'current_page' => $expenses->currentPage(),
                'last_page' => $expenses->lastPage(),
                'per_page' => $expenses->perPage(),
                'total' => $expenses->total(),
                'total_this_month' => (float) $totalThisMonth,
                'total_this_year' => (float) $totalThisYear,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:200',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'sometimes|date',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string',
            'receipt_no' => 'nullable|string|max:50',
            'items' => 'nullable|array',
        ]);

        $validated['title'] = $validated['title'] ?? $validated['category'] ?? 'خەرجی';
        $validated['created_by'] = $request->user()->id;
        $validated['expense_date'] = $validated['expense_date'] ?? now()->toDateString();

        $expense = Expense::create($validated);

        return response()->json([
            'success' => true,
            'data' => $expense,
            'message' => 'Expense created successfully',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $expense,
            'message' => 'Expense details retrieved',
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);

        $validated = $request->validate([
            'title' => 'nullable|string|max:200',
            'amount' => 'sometimes|required|numeric|min:0',
            'expense_date' => 'sometimes|date',
            'category' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'receipt_no' => 'nullable|string|max:50',
            'items' => 'nullable|array',
        ]);

        if (isset($validated['category']) && !isset($validated['title'])) {
            $validated['title'] = $validated['category'];
        }

        $expense->update($validated);

        return response()->json([
            'success' => true,
            'data' => $expense->fresh(),
            'message' => 'Expense updated successfully',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);
        $expense->delete(); // soft delete

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Expense deleted successfully',
        ]);
    }
}

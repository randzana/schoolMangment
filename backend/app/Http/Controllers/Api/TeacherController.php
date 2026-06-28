<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Teacher::query();

        if ($request->filled('search')) {
            $query->search($request->search);
        }

        if (! $request->boolean('include_deleted')) {
            $query->whereNull('deleted_at');
        }

        $perPage = $request->integer('per_page', 20);
        $teachers = $query->orderBy('full_name')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $teachers->items(),
            'message' => 'Teachers retrieved',
            'meta' => [
                'current_page' => $teachers->currentPage(),
                'last_page' => $teachers->lastPage(),
                'per_page' => $teachers->perPage(),
                'total' => $teachers->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:150',
            'subject' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'monthly_salary' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $teacher = Teacher::create($validated);

        return response()->json([
            'success' => true,
            'data' => $teacher,
            'message' => 'Teacher created successfully',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $teacher = Teacher::with(['salaryExpenses' => fn ($q) => $q->orderByDesc('month')])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $teacher,
            'message' => 'Teacher details retrieved',
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $teacher = Teacher::findOrFail($id);

        $validated = $request->validate([
            'full_name' => 'sometimes|required|string|max:150',
            'subject' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'monthly_salary' => 'sometimes|required|numeric|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $teacher->update($validated);

        return response()->json([
            'success' => true,
            'data' => $teacher->fresh(),
            'message' => 'Teacher updated successfully',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $teacher = Teacher::findOrFail($id);
        $teacher->delete(); // soft delete

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Teacher deleted successfully',
        ]);
    }
}

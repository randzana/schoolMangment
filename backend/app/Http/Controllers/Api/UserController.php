<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 20);
        $users = User::orderBy('name')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'message' => 'Users retrieved',
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'username' => 'required|string|max:50|unique:users,username',
            'password' => 'required|string|min:6|confirmed',
            'role' => ['required', Rule::in(['admin', 'user'])],
        ]);

        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'data' => $user->makeHidden('password'),
            'message' => 'User created successfully',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User details retrieved',
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'username' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('users')->ignore($user->id)],
            'password' => 'sometimes|required|string|min:6|confirmed',
            'role' => ['sometimes', Rule::in(['admin', 'user'])],
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'data' => $user->fresh()->makeHidden('password'),
            'message' => 'User updated successfully',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'User deleted',
        ]);
    }

    public function toggleActive(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot deactivate your own account.',
            ], 422);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'success' => true,
            'data' => $user->fresh(),
            'message' => $user->is_active ? 'User activated' : 'User deactivated',
        ]);
    }
}

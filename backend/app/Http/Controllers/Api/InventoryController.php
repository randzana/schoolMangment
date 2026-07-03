<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    /**
     * List all inventory items grouped or paginated
     */
    public function index(Request $request): JsonResponse
    {
        $query = Inventory::query();

        if ($request->filled('item_type')) {
            $query->where('item_type', $request->item_type);
        }

        $items = $query->orderBy('item_type')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $items,
            'message' => 'Inventory items retrieved successfully',
        ]);
    }

    /**
     * Update stock count for a specific inventory item
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:0',
        ]);

        $item = Inventory::findOrFail($id);
        $item->update($validated);

        return response()->json([
            'success' => true,
            'data' => $item,
            'message' => 'Inventory stock updated successfully',
        ]);
    }

    /**
     * Create a new inventory item (uniform size or book subject)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_type' => 'required|string|in:clothes,book',
            'name' => 'required|string|max:100',
            'quantity' => 'required|integer|min:0',
        ]);

        // Auto-generate code e.g. uniform_42 or book_kurdish
        if ($validated['item_type'] === 'clothes') {
            $sizeName = str_replace('Uniform Size ', '', $validated['name']);
            $code = 'uniform_' . strtolower($sizeName);
        } else {
            $subjectName = str_replace('Book: ', '', $validated['name']);
            $code = 'book_' . strtolower(str_replace(' ', '_', $subjectName));
        }

        if (Inventory::where('code', $code)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'ئەم بابەتە پێشتر تۆمارکراوە لە کۆگادا (کۆدەکەی دووبارەیە)',
            ], 422);
        }

        $validated['code'] = $code;
        $item = Inventory::create($validated);

        return response()->json([
            'success' => true,
            'data' => $item,
            'message' => 'بابەتەکە بە سەرکەوتوویی تۆمارکرا لە کۆگا',
        ], 201);
    }

    /**
     * Delete an inventory item
     */
    public function destroy(int $id): JsonResponse
    {
        $item = Inventory::findOrFail($id);
        $item->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'بابەتەکە بە سەرکەوتوویی سڕایەوە لە کۆگا',
        ]);
    }
}

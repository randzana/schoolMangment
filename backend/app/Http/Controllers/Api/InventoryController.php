<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryController extends Controller
{
    private const GRADE_LABELS = [
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
     * Update the fixed count, stock or price of an inventory item.
     *
     * `total_quantity` is the fixed count of everything put into stock and
     * `quantity` is what is left after sales. Changing either one moves the
     * other by the same amount so the sold count never changes, and
     * `add_quantity` puts new pieces into stock (raising both).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'sometimes|integer|min:0',
            'total_quantity' => 'sometimes|integer|min:0',
            'add_quantity' => 'sometimes|integer|min:1|max:100000',
            'price' => 'sometimes|numeric|min:0',
        ]);

        $item = DB::transaction(function () use ($validated, $id) {
            $item = Inventory::lockForUpdate()->findOrFail($id);
            $sold = max(0, $item->total_quantity - $item->quantity);

            if (array_key_exists('total_quantity', $validated)) {
                if ($validated['total_quantity'] < $sold) {
                    throw ValidationException::withMessages([
                        'total_quantity' => ['ژمارەی جێگیر ناتوانێت لە ژمارەی فرۆشراو (' . $sold . ' دانە) کەمتر بێت'],
                    ]);
                }
                $item->total_quantity = $validated['total_quantity'];
                $item->quantity = $validated['total_quantity'] - $sold;
            } elseif (array_key_exists('quantity', $validated)) {
                $item->quantity = $validated['quantity'];
                $item->total_quantity = $validated['quantity'] + $sold;
            }

            if (!empty($validated['add_quantity'])) {
                $item->quantity += $validated['add_quantity'];
                $item->total_quantity += $validated['add_quantity'];
            }

            if (array_key_exists('price', $validated)) {
                $item->price = $validated['price'];
            }

            $item->save();

            return $item;
        });

        return response()->json([
            'success' => true,
            'data' => $item,
            'message' => 'کۆگا بە سەرکەوتوویی نوێکرایەوە',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_type' => 'required|string|in:clothes,book',
            'name' => 'required|string|max:100',
            'quantity' => 'required|integer|min:0',
            'price' => 'sometimes|numeric|min:0',
            'grade' => 'required_if:item_type,book|nullable|string|in:one,two,three,four,five,six,seven,eight,nine',
        ]);

        // Auto-generate code e.g. uniform_42 or book_kurdish_one
        if ($validated['item_type'] === 'clothes') {
            $sizeName = str_replace('Uniform Size ', '', $validated['name']);
            $code = 'uniform_' . strtolower($sizeName);
        } else {
            $subjectName = str_replace('Book: ', '', $validated['name']);
            $gradeSuffix = !empty($validated['grade']) ? '_' . strtolower($validated['grade']) : '';
            $code = 'book_' . strtolower(str_replace(' ', '_', $subjectName)) . $gradeSuffix;
        }

        if (Inventory::where('code', $code)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'ئەم بابەتە پێشتر تۆمارکراوە لە کۆگادا (کۆدەکەی دووبارەیە)',
            ], 422);
        }

        $validated['code'] = $code;
        $validated['total_quantity'] = $validated['quantity'];
        $item = Inventory::create($validated);

        return response()->json([
            'success' => true,
            'data' => $item,
            'message' => 'بابەتەکە بە سەرکەوتوویی تۆمارکرا لە کۆگا',
        ], 201);
    }

    /**
     * Printable stock sheet of every clothes and book item.
     */
    public function print()
    {
        $items = Inventory::orderBy('item_type')->orderBy('grade')->orderBy('name')->get();

        $rows = fn ($type) => $items->where('item_type', $type)->values()->map(fn (Inventory $item) => [
            'name' => $type === 'clothes'
                ? preg_replace('/^Uniform Size\s*/i', '', $item->name)
                : str_replace('Book: ', '', $item->name),
            'grade_label' => $item->grade ? (self::GRADE_LABELS[$item->grade] ?? $item->grade) : null,
            'price' => (float) $item->price,
            'total_quantity' => $item->total_quantity,
            'sold_quantity' => max(0, $item->total_quantity - $item->quantity),
            'quantity' => $item->quantity,
        ]);

        return view('reports.inventory', [
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'clothes' => $rows('clothes'),
            'books' => $rows('book'),
        ]);
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

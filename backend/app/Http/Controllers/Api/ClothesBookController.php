<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClothesBookPayment;
use App\Models\Inventory;
use App\Models\Student;
use App\Services\InvoiceNumberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ClothesBookController extends Controller
{
    /** Marks a purchase that covers every book of the student's grade. */
    private const ALL_BOOKS_LABEL = 'سەرجەم کتێبەکان';

    public function __construct(
        protected InvoiceNumberService $invoiceService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = ClothesBookPayment::with('student');

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }

        if ($request->filled('item_type')) {
            $query->where('item_type', $request->item_type);
        }

        $perPage = $request->integer('per_page', 20);
        $payments = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $payments->items(),
            'message' => 'Clothes & books payments retrieved',
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
            'item_type' => ['required', Rule::in(['clothes', 'book', 'both'])],
            'items' => 'nullable|array',
            'items.*.uniform_size' => 'required_with:items|string|max:100',
            'items.*.quantity' => 'required_with:items|integer|min:1|max:1000',
            'items.*.price' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|integer|min:1|max:1000',
            'price' => 'required|numeric|min:0',
            'discount' => 'sometimes|numeric|min:0',
            'amount_paid' => 'required|numeric|min:0',
            'payment_date' => 'sometimes|date',
            'notes' => 'nullable|string',
            'uniform_size' => 'nullable|string|max:100',
            'book_subject' => 'required_if:item_type,book,both|nullable|string|max:100',
        ]);

        if (in_array($validated['item_type'], ['clothes', 'both']) && empty($validated['items']) && empty($validated['uniform_size'])) {
            throw ValidationException::withMessages([
                'uniform_size' => ['تکایە لانیکەم یەک جۆری جلوبەرگ دیاری بکە'],
            ]);
        }

        $validated['academic_year'] = $validated['academic_year'] ?? config('school.academic_year', '2025-2026');
        $validated['invoice_no'] = $this->invoiceService->getNextInvoiceNumber('clothes_book');
        $validated['created_by'] = $request->user()->id;
        $validated['payment_date'] = $validated['payment_date'] ?? now()->toDateString();

        $payment = DB::transaction(function () use ($validated) {
            // Adjust clothes stock & format labels
            if (in_array($validated['item_type'], ['clothes', 'both'])) {
                if (!empty($validated['items']) && is_array($validated['items'])) {
                    $totalQty = 0;
                    $sizeLabels = [];
                    foreach ($validated['items'] as $item) {
                        $size = $item['uniform_size'];
                        $qty = (int) ($item['quantity'] ?? 1);
                        $totalQty += $qty;
                        $this->takeUniformStock($size, $qty);
                        $sizeLabels[] = $size . ($qty > 1 ? " ({$qty} دانە)" : '');
                    }
                    $validated['quantity'] = $totalQty;
                    $validated['uniform_size'] = implode('، ', $sizeLabels);
                } elseif (!empty($validated['uniform_size'])) {
                    $qty = (int) ($validated['quantity'] ?? 1);
                    $this->takeUniformStock($validated['uniform_size'], $qty);
                    $validated['quantity'] = $qty;
                    $validated['items'] = [
                        ['uniform_size' => $validated['uniform_size'], 'quantity' => $qty]
                    ];
                }
            } else {
                $validated['quantity'] = (int) ($validated['quantity'] ?? 1);
            }

            // Adjust book stock
            if (in_array($validated['item_type'], ['book', 'both']) && !empty($validated['book_subject'])) {
                $student = Student::findOrFail($validated['student_id']);
                $this->takeBookStock($validated['book_subject'], $student, (int) $validated['quantity']);
            }

            return ClothesBookPayment::create($validated);
        });

        return response()->json([
            'success' => true,
            'data' => $payment->load('student'),
            'message' => 'Clothes & books payment created successfully',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $payment = ClothesBookPayment::with('student')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $payment,
            'message' => 'Payment details retrieved',
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $payment = ClothesBookPayment::findOrFail($id);

        $validated = $request->validate([
            'item_type' => ['sometimes', Rule::in(['clothes', 'book', 'both'])],
            'items' => 'nullable|array',
            'items.*.uniform_size' => 'required_with:items|string|max:100',
            'items.*.quantity' => 'required_with:items|integer|min:1|max:1000',
            'items.*.price' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|integer|min:1|max:1000',
            'price' => 'sometimes|numeric|min:0',
            'discount' => 'sometimes|numeric|min:0',
            'amount_paid' => 'sometimes|numeric|min:0',
            'payment_date' => 'sometimes|date',
            'notes' => 'nullable|string',
            'uniform_size' => 'sometimes|nullable|string|max:100',
            'book_subject' => 'sometimes|nullable|string|max:100',
        ]);

        $payment = DB::transaction(function () use ($payment, $validated, $request) {
            $oldType = $payment->item_type;
            $oldItems = $payment->items;
            $oldSize = $payment->uniform_size;
            $oldSubject = $payment->book_subject;
            $oldQty = max(1, (int) ($payment->quantity ?? 1));

            $newType = $validated['item_type'] ?? $oldType;
            $student = $payment->student;

            // 1. Revert OLD stock adjustments
            if (in_array($oldType, ['clothes', 'both'])) {
                if (!empty($oldItems) && is_array($oldItems)) {
                    foreach ($oldItems as $it) {
                        $this->returnUniformStock($it['uniform_size'], max(1, (int) ($it['quantity'] ?? 1)));
                    }
                } elseif (!empty($oldSize)) {
                    $this->returnUniformStock($oldSize, $oldQty);
                }
            }
            if (in_array($oldType, ['book', 'both']) && !empty($oldSubject)) {
                $this->returnBookStock($oldSubject, $student, $oldQty);
            }

            // 2. Apply NEW stock adjustments
            if (in_array($newType, ['clothes', 'both'])) {
                if ($request->has('items') && !empty($validated['items']) && is_array($validated['items'])) {
                    $totalQty = 0;
                    $sizeLabels = [];
                    foreach ($validated['items'] as $item) {
                        $size = $item['uniform_size'];
                        $qty = (int) ($item['quantity'] ?? 1);
                        $totalQty += $qty;
                        $this->takeUniformStock($size, $qty);
                        $sizeLabels[] = $size . ($qty > 1 ? " ({$qty} دانە)" : '');
                    }
                    $validated['quantity'] = $totalQty;
                    $validated['uniform_size'] = implode('، ', $sizeLabels);
                } elseif (array_key_exists('uniform_size', $validated) || array_key_exists('quantity', $validated)) {
                    $newSize = $validated['uniform_size'] ?? $oldSize;
                    $newQty = isset($validated['quantity']) ? (int) $validated['quantity'] : $oldQty;
                    if (!empty($newSize)) {
                        $this->takeUniformStock($newSize, $newQty);
                        $validated['items'] = [
                            ['uniform_size' => $newSize, 'quantity' => $newQty]
                        ];
                        $validated['quantity'] = $newQty;
                        $validated['uniform_size'] = $newSize;
                    }
                } elseif (!empty($oldItems) && is_array($oldItems)) {
                    foreach ($oldItems as $it) {
                        $this->takeUniformStock($it['uniform_size'], max(1, (int) ($it['quantity'] ?? 1)));
                    }
                } elseif (!empty($oldSize)) {
                    $this->takeUniformStock($oldSize, $oldQty);
                }
            }

            if (in_array($newType, ['book', 'both'])) {
                $newSubject = array_key_exists('book_subject', $validated) ? $validated['book_subject'] : $oldSubject;
                $newQty = isset($validated['quantity']) ? (int) $validated['quantity'] : $oldQty;
                if (!empty($newSubject)) {
                    $this->takeBookStock($newSubject, $student, $newQty);
                }
            }

            $payment->update($validated);
            return $payment;
        });

        return response()->json([
            'success' => true,
            'data' => $payment->fresh()->load('student'),
            'message' => 'Payment updated successfully',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        DB::transaction(function () use ($id) {
            $payment = ClothesBookPayment::findOrFail($id);
            $qty = max(1, (int) ($payment->quantity ?? 1));

            // Revert stock levels
            if (in_array($payment->item_type, ['clothes', 'both'])) {
                if (!empty($payment->items) && is_array($payment->items)) {
                    foreach ($payment->items as $it) {
                        $this->returnUniformStock($it['uniform_size'], max(1, (int) ($it['quantity'] ?? 1)));
                    }
                } elseif (!empty($payment->uniform_size)) {
                    $this->returnUniformStock($payment->uniform_size, $qty);
                }
            }

            if (in_array($payment->item_type, ['book', 'both']) && !empty($payment->book_subject)) {
                $this->returnBookStock($payment->book_subject, $payment->student, $qty);
            }

            $payment->delete();
        });

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Payment deleted',
        ]);
    }

    /**
     * Resolve the inventory row holding a uniform type (stored as `uniform_<name>`).
     */
    private function uniformInventory(string $uniformType): ?Inventory
    {
        $clean = strtolower(trim($uniformType));
        return Inventory::where('code', 'uniform_' . $clean)
            ->orWhere('name', 'Uniform Size ' . trim($uniformType))
            ->orWhere('name', trim($uniformType))
            ->first();
    }

    /**
     * Resolve the inventory rows a book purchase draws from. A bulk purchase
     * covers every book of the student's grade, otherwise it is a single title.
     *
     * @return Collection<int, Inventory>
     */
    private function bookInventories(string $bookSubject, ?Student $student): Collection
    {
        if ($bookSubject === self::ALL_BOOKS_LABEL) {
            if (!$student) {
                return collect();
            }

            return Inventory::where('item_type', 'book')
                ->where('grade', strtolower($student->grade))
                ->get();
        }

        $bookSubjectClean = strtolower(str_replace(' ', '_', $bookSubject));

        $item = $student
            ? Inventory::where('code', 'book_' . $bookSubjectClean . '_' . strtolower($student->grade))->first()
            : null;
        $item ??= Inventory::where('code', 'book_' . $bookSubjectClean)->first();

        return collect($item ? [$item] : []);
    }

    /**
     * Take `$qty` uniforms out of stock, refusing when there are not enough.
     */
    private function takeUniformStock(string $uniformType, int $qty): void
    {
        $item = $this->uniformInventory($uniformType);

        if (!$item || $item->quantity < $qty) {
            throw ValidationException::withMessages([
                'uniform_size' => ['ڕێژەی پێویست لەم جۆرە نییە لە کۆگادا (داواکراو: ' . $qty . '، بەردەست: ' . ($item?->quantity ?? 0) . ')'],
            ]);
        }

        $item->decrement('quantity', $qty);
    }

    /**
     * Put `$qty` uniforms back into stock (edit or delete of a purchase).
     */
    private function returnUniformStock(string $uniformType, int $qty): void
    {
        $this->uniformInventory($uniformType)?->increment('quantity', $qty);
    }

    /**
     * Take `$qty` copies of each matching book out of stock.
     */
    private function takeBookStock(string $bookSubject, ?Student $student, int $qty): void
    {
        $items = $this->bookInventories($bookSubject, $student);

        if ($items->isEmpty()) {
            throw ValidationException::withMessages([
                'book_subject' => ['ئەم کتێبە لە کۆگادا تۆمار نەکراوە'],
            ]);
        }

        foreach ($items as $item) {
            if ($item->quantity < $qty) {
                throw ValidationException::withMessages([
                    'book_subject' => ['ڕێژەی پێویست لە کتێبی "' . $item->name . '" نییە لە کۆگادا (داواکراو: ' . $qty . '، بەردەست: ' . $item->quantity . ')'],
                ]);
            }
        }

        foreach ($items as $item) {
            $item->decrement('quantity', $qty);
        }
    }

    /**
     * Put `$qty` copies of each matching book back into stock.
     */
    private function returnBookStock(string $bookSubject, ?Student $student, int $qty): void
    {
        foreach ($this->bookInventories($bookSubject, $student) as $item) {
            $item->increment('quantity', $qty);
        }
    }

    /**
     * Bulk-purchase ALL books for a student's grade in one transaction.
     */
    public function storeBulkBooks(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id'     => 'required|exists:students,id',
            'notes'          => 'nullable|string',
            'price'          => 'required|numeric|min:0',
        ]);

        $student = Student::findOrFail($validated['student_id']);

        // Find all book inventory items matching this grade
        $gradeBooks = $this->bookInventories(self::ALL_BOOKS_LABEL, $student);

        if ($gradeBooks->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'هیچ کتێبێک بۆ ئەم پۆلە لە کۆگادا تۆمار نەکراوە',
            ], 422);
        }

        $academicYear = config('school.academic_year', '2025-2026');
        $notes        = $validated['notes'] ?? '';
        $totalPrice   = (float)$validated['price'];

        $payment = DB::transaction(function () use ($student, $academicYear, $notes, $totalPrice, $request) {
            $this->takeBookStock(self::ALL_BOOKS_LABEL, $student, 1);

            $invoiceNo = $this->invoiceService->getNextInvoiceNumber('clothes_book');

            // Create a single payment record for all books
            return ClothesBookPayment::create([
                'student_id'    => $student->id,
                'academic_year' => $academicYear,
                'item_type'     => 'book',
                'quantity'      => 1,
                'price'         => $totalPrice,
                'discount'      => 0,
                'amount_paid'   => $totalPrice,
                'payment_date'  => now()->toDateString(),
                'notes'         => $notes,
                'invoice_no'    => $invoiceNo,
                'created_by'    => $request->user()->id,
                'book_subject'  => self::ALL_BOOKS_LABEL,
            ]);
        });

        return response()->json([
            'success' => true,
            'data'    => [$payment->load('student')],
            'message' => 'سەرجەم کتێبەکان بە سەرکەوتوویی تۆمار کران',
        ], 201);
    }

    public function invoice(int $id)
    {
        $payment = ClothesBookPayment::with('student')->findOrFail($id);

        $invoice_type = 'Clothes & Books Payment';
        $fee_label = 'بڕی پێویست';
        if ($payment->item_type === 'clothes') {
            $invoice_type = 'Clothes Payment';
            $fee_label = 'نرخی جلوبەرگ';
        } elseif ($payment->item_type === 'book') {
            $invoice_type = 'Book Payment';
            $fee_label = 'نرخی کتێب';
        }

        $data = [
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'invoice_no' => $payment->invoice_no,
            'date' => $payment->payment_date?->format('d/m/Y') ?? now()->format('d/m/Y'),
            'invoice_type' => $invoice_type,
            'student_name' => $payment->student->full_name,
            'grade' => $payment->student->grade_display,
            'serial_no' => $payment->student->serial_number,
            'annual_fee' => $payment->price,
            'discount' => $payment->discount,
            'fee_after_discount' => $payment->price - $payment->discount,
            'remain_before' => $payment->price - $payment->discount,
            'amount_paid' => $payment->amount_paid,
            'remain_after' => $payment->price - $payment->discount - $payment->amount_paid,
            'fee_label' => $fee_label,
            'is_returned' => false,
            'notes' => $payment->notes,
            'uniform_type' => $payment->uniform_size,
            'book_subject' => $payment->book_subject,
            'quantity' => max(1, (int) ($payment->quantity ?? 1)),
            'items' => $payment->items,
        ];

        return view('invoices.installment_print', $data);
    }
}

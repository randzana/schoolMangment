<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClothesBookPayment;
use App\Services\InvoiceNumberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ClothesBookController extends Controller
{
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
            'price' => 'required|numeric|min:0',
            'discount' => 'sometimes|numeric|min:0',
            'amount_paid' => 'required|numeric|min:0',
            'payment_date' => 'sometimes|date',
            'notes' => 'nullable|string',
            'uniform_size' => 'required_if:item_type,clothes,both|nullable|string',
            'book_subject' => 'required_if:item_type,book,both|nullable|string',
        ]);

        $validated['academic_year'] = $validated['academic_year'] ?? config('school.academic_year', '2025-2026');
        $validated['invoice_no'] = $this->invoiceService->getNextInvoiceNumber();
        $validated['created_by'] = $request->user()->id;
        $validated['payment_date'] = $validated['payment_date'] ?? now()->toDateString();

        $payment = DB::transaction(function () use ($validated) {
            // Adjust stock levels
            if (in_array($validated['item_type'], ['clothes', 'both']) && !empty($validated['uniform_size'])) {
                $sizeCode = 'uniform_' . strtolower($validated['uniform_size']);
                $uniformItem = \App\Models\Inventory::where('code', $sizeCode)->first();
                if (!$uniformItem || $uniformItem->quantity < 1) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'uniform_size' => ["ڕێژەی پێویست لەم سایزە نییە لە کۆگادا (مەوجود: " . ($uniformItem?->quantity ?? 0) . ")"],
                    ]);
                }
                $uniformItem->decrement('quantity', 1);
            }

            if (in_array($validated['item_type'], ['book', 'both']) && !empty($validated['book_subject'])) {
                $student = \App\Models\Student::findOrFail($validated['student_id']);
                $bookSubjectClean = strtolower(str_replace(' ', '_', $validated['book_subject']));
                $gradeCode = 'book_' . $bookSubjectClean . '_' . strtolower($student->grade);
                $generalCode = 'book_' . $bookSubjectClean;

                $bookItem = \App\Models\Inventory::where('code', $gradeCode)->first()
                    ?? \App\Models\Inventory::where('code', $generalCode)->first();

                if (!$bookItem || $bookItem->quantity < 1) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'book_subject' => ["ڕێژەی پێویست لەم کتێبە نییە لە کۆگادا (مەوجود: " . ($bookItem?->quantity ?? 0) . ")"],
                    ]);
                }
                $bookItem->decrement('quantity', 1);
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
            'price' => 'sometimes|numeric|min:0',
            'discount' => 'sometimes|numeric|min:0',
            'amount_paid' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string',
            'uniform_size' => 'sometimes|nullable|string',
            'book_subject' => 'sometimes|nullable|string',
        ]);

        $payment = DB::transaction(function () use ($payment, $validated) {
            $oldType = $payment->item_type;
            $oldSize = $payment->uniform_size;
            $oldSubject = $payment->book_subject;

            $newType = $validated['item_type'] ?? $oldType;
            $newSize = array_key_exists('uniform_size', $validated) ? $validated['uniform_size'] : $oldSize;
            $newSubject = array_key_exists('book_subject', $validated) ? $validated['book_subject'] : $oldSubject;

            // 1. Revert OLD stock adjustments
            if (in_array($oldType, ['clothes', 'both']) && !empty($oldSize)) {
                $sizeCode = 'uniform_' . strtolower($oldSize);
                $uniformItem = \App\Models\Inventory::where('code', $sizeCode)->first();
                if ($uniformItem) {
                    $uniformItem->increment('quantity', 1);
                }
            }
            if (in_array($oldType, ['book', 'both']) && !empty($oldSubject)) {
                $student = $payment->student;
                $bookSubjectClean = strtolower(str_replace(' ', '_', $oldSubject));
                $gradeCode = 'book_' . $bookSubjectClean . '_' . strtolower($student->grade);
                $generalCode = 'book_' . $bookSubjectClean;

                $bookItem = \App\Models\Inventory::where('code', $gradeCode)->first()
                    ?? \App\Models\Inventory::where('code', $generalCode)->first();

                if ($bookItem) {
                    $bookItem->increment('quantity', 1);
                }
            }

            // 2. Apply NEW stock adjustments (and check availability)
            if (in_array($newType, ['clothes', 'both']) && !empty($newSize)) {
                $sizeCode = 'uniform_' . strtolower($newSize);
                $uniformItem = \App\Models\Inventory::where('code', $sizeCode)->first();
                if (!$uniformItem || $uniformItem->quantity < 1) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'uniform_size' => ["ڕێژەی پێویست لەم سایزە نییە لە کۆگادا (مەوجود: " . ($uniformItem?->quantity ?? 0) . ")"],
                    ]);
                }
                $uniformItem->decrement('quantity', 1);
            }
            if (in_array($newType, ['book', 'both']) && !empty($newSubject)) {
                $studentId = $validated['student_id'] ?? $payment->student_id;
                $student = \App\Models\Student::findOrFail($studentId);
                $bookSubjectClean = strtolower(str_replace(' ', '_', $newSubject));
                $gradeCode = 'book_' . $bookSubjectClean . '_' . strtolower($student->grade);
                $generalCode = 'book_' . $bookSubjectClean;

                $bookItem = \App\Models\Inventory::where('code', $gradeCode)->first()
                    ?? \App\Models\Inventory::where('code', $generalCode)->first();

                if (!$bookItem || $bookItem->quantity < 1) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'book_subject' => ["ڕێژەی پێویست لەم کتێبە نییە لە کۆگادا (مەوجود: " . ($bookItem?->quantity ?? 0) . ")"],
                    ]);
                }
                $bookItem->decrement('quantity', 1);
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

            // Revert stock levels
            if (in_array($payment->item_type, ['clothes', 'both']) && !empty($payment->uniform_size)) {
                $sizeCode = 'uniform_' . strtolower($payment->uniform_size);
                $uniformItem = \App\Models\Inventory::where('code', $sizeCode)->first();
                if ($uniformItem) {
                    $uniformItem->increment('quantity', 1);
                }
            }

            if (in_array($payment->item_type, ['book', 'both']) && !empty($payment->book_subject)) {
                $student = $payment->student;
                $bookSubjectClean = strtolower(str_replace(' ', '_', $payment->book_subject));
                $gradeCode = 'book_' . $bookSubjectClean . '_' . strtolower($student->grade);
                $generalCode = 'book_' . $bookSubjectClean;

                $bookItem = \App\Models\Inventory::where('code', $gradeCode)->first()
                    ?? \App\Models\Inventory::where('code', $generalCode)->first();

                if ($bookItem) {
                    $bookItem->increment('quantity', 1);
                }
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
     * Bulk-purchase ALL books for a student's grade in one transaction.
     */
    public function storeBulkBooks(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id'     => 'required|exists:students,id',
            'notes'          => 'nullable|string',
            'price'          => 'nullable|numeric|min:0',
        ]);

        $student = \App\Models\Student::findOrFail($validated['student_id']);
        $grade   = strtolower($student->grade);

        // Find all book inventory items matching this grade
        $gradeBooks = \App\Models\Inventory::where('item_type', 'book')
            ->where('grade', $grade)
            ->get();

        if ($gradeBooks->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'هیچ کتێبێک بۆ ئەم پۆلە لە کۆگادا تۆمار نەکراوە',
            ], 422);
        }

        $academicYear = config('school.academic_year', '2025-2026');
        $notes        = $validated['notes'] ?? '';
        $customPrice  = isset($validated['price']) ? (float)$validated['price'] : null;

        $payments = DB::transaction(function () use ($gradeBooks, $student, $academicYear, $notes, $customPrice, $request) {
            $created = [];
            $bookCount = count($gradeBooks);
            $remainingPrice = $customPrice;

            for ($i = 0; $i < $bookCount; $i++) {
                $bookItem = $gradeBooks[$i];

                // Check stock
                if ($bookItem->quantity < 1) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'stock' => ["کتێبی \"{$bookItem->name}\" لە کۆگادا نییە (مەوجود: 0)"],
                    ]);
                }

                // Get the subject name from the inventory item name
                $subjectName = str_replace('Book: ', '', $bookItem->name);
                
                if ($customPrice !== null) {
                    if ($i === $bookCount - 1) {
                        $bookPrice = $remainingPrice;
                    } else {
                        $bookPrice = round($customPrice / $bookCount, 2);
                        $remainingPrice -= $bookPrice;
                    }
                } else {
                    $bookPrice = $bookItem->price;
                }

                $invoiceNo = $this->invoiceService->getNextInvoiceNumber();

                $payment = ClothesBookPayment::create([
                    'student_id'    => $student->id,
                    'academic_year' => $academicYear,
                    'item_type'     => 'book',
                    'price'         => $bookPrice,
                    'discount'      => 0,
                    'amount_paid'   => $bookPrice,
                    'payment_date'  => now()->toDateString(),
                    'notes'         => $notes,
                    'invoice_no'    => $invoiceNo,
                    'created_by'    => $request->user()->id,
                    'book_subject'  => $subjectName,
                ]);

                // Decrement stock
                $bookItem->decrement('quantity', 1);

                $created[] = $payment;
            }

            return $created;
        });

        return response()->json([
            'success' => true,
            'data'    => collect($payments)->map(fn ($p) => $p->load('student')),
            'message' => count($payments) . ' کتێب بە سەرکەوتوویی تۆمار کران',
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
        ];

        return view('invoices.installment_print', $data);
    }
}

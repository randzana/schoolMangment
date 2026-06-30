<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClothesBookPayment;
use App\Services\InvoiceNumberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
        ]);

        $validated['academic_year'] = $validated['academic_year'] ?? config('school.academic_year', '2025-2026');
        $validated['invoice_no'] = $this->invoiceService->getNextInvoiceNumber();
        $validated['created_by'] = $request->user()->id;
        $validated['payment_date'] = $validated['payment_date'] ?? now()->toDateString();

        $payment = ClothesBookPayment::create($validated);

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
        ]);

        $payment->update($validated);

        return response()->json([
            'success' => true,
            'data' => $payment->fresh()->load('student'),
            'message' => 'Payment updated successfully',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $payment = ClothesBookPayment::findOrFail($id);
        $payment->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Payment deleted',
        ]);
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

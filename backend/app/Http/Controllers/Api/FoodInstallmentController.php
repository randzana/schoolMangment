<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FoodInstallment;
use App\Services\FoodPaymentService;
use App\Services\InvoicePdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FoodInstallmentController extends Controller
{
    public function __construct(
        protected FoodPaymentService $foodService,
        protected InvoicePdfService $invoiceService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = FoodInstallment::with('student');

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('from') || $request->filled('to')) {
            $query->byDateRange($request->from, $request->to);
        }

        $perPage = $request->integer('per_page', 20);
        $installments = $query->orderByDesc('payment_date')->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $installments->items(),
            'message' => 'Food installments retrieved',
            'meta' => [
                'current_page' => $installments->currentPage(),
                'last_page' => $installments->lastPage(),
                'per_page' => $installments->perPage(),
                'total' => $installments->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'amount_paid' => 'required|numeric|min:1',
            'payment_date' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        $validated['academic_year'] = $request->get('academic_year', config('school.academic_year', '2025-2026'));

        $installment = $this->foodService->createInstallment(
            $validated,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $installment,
            'message' => 'Food installment created successfully',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $installment = FoodInstallment::with(['student', 'foodPayment', 'createdByUser'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $installment,
            'message' => 'Food installment details retrieved',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->foodService->deleteInstallment($id);

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Food installment deleted',
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'amount_paid' => 'required|numeric|min:1',
            'payment_date' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        $installment = $this->foodService->updateInstallment(
            $id,
            $validated,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $installment,
            'message' => 'Food installment updated successfully',
        ]);
    }

    public function invoice(int $id)
    {
        $installment = FoodInstallment::with(['student', 'foodPayment'])->findOrFail($id);
        
        $data = [
            'school_name' => config('school.name', 'Future Generation Private Basic School'),
            'invoice_no' => $installment->invoice_no,
            'date' => $installment->payment_date->format('d/m/Y'),
            'invoice_type' => 'Food Payment',
            'student_name' => $installment->student->full_name,
            'grade' => $installment->student->grade_display,
            'serial_no' => $installment->student->serial_number,
            'annual_fee' => $installment->foodPayment->monthly_price,
            'discount' => $installment->foodPayment->discount,
            'fee_after_discount' => $installment->foodPayment->price_after_discount,
            'remain_before' => $installment->remain_before,
            'amount_paid' => $installment->amount_paid,
            'remain_after' => $installment->remain_after,
            'fee_label' => 'Monthly Price',
            'is_returned' => $installment->is_returned,
            'notes' => $installment->notes,
        ];

        return view('invoices.installment_print', $data);
    }

    public function returnBill(Request $request, int $id): JsonResponse
    {
        $installment = $this->foodService->returnInstallment($id, $request->user()->id);

        return response()->json([
            'success' => true,
            'data' => $installment,
            'message' => 'Bill returned successfully. Balance has been restored.',
        ]);
    }
}

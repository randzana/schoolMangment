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
            'food_payment_id' => 'required|exists:food_payments,id',
            'amount_paid' => 'required|numeric|min:1',
            'payment_date' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

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
        $installment = FoodInstallment::findOrFail($id);
        $installment->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Food installment deleted',
        ]);
    }

    public function invoice(int $id)
    {
        $installment = FoodInstallment::with(['student', 'foodPayment'])->findOrFail($id);
        $pdf = $this->invoiceService->generateFoodInvoice($installment);

        return $pdf->stream("invoice-{$installment->invoice_no}.pdf");
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

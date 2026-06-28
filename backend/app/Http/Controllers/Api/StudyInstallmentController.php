<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudyInstallment;
use App\Services\StudyPaymentService;
use App\Services\InvoicePdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudyInstallmentController extends Controller
{
    public function __construct(
        protected StudyPaymentService $studyService,
        protected InvoicePdfService $invoiceService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = StudyInstallment::with('student');

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
            'message' => 'Study installments retrieved',
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
            'study_payment_id' => 'required|exists:study_payments,id',
            'amount_paid' => 'required|numeric|min:1',
            'payment_date' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        $installment = $this->studyService->createInstallment(
            $validated,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $installment,
            'message' => 'Study installment created successfully',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $installment = StudyInstallment::with(['student', 'studyPayment', 'createdByUser'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $installment,
            'message' => 'Study installment details retrieved',
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        // Admin only — enforced by route middleware
        $installment = StudyInstallment::findOrFail($id);
        $installment->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Study installment deleted',
        ]);
    }

    /**
     * GET /api/study-installments/{id}/invoice — returns PDF stream
     */
    public function invoice(int $id)
    {
        $installment = StudyInstallment::with(['student', 'studyPayment'])->findOrFail($id);
        $pdf = $this->invoiceService->generateStudyInvoice($installment);

        return $pdf->stream("invoice-{$installment->invoice_no}.pdf");
    }

    /**
     * PUT /api/study-installments/{id}/return — mark as returned (admin only)
     */
    public function returnBill(Request $request, int $id): JsonResponse
    {
        $installment = $this->studyService->returnInstallment($id, $request->user()->id);

        return response()->json([
            'success' => true,
            'data' => $installment,
            'message' => 'Bill returned successfully. Balance has been restored.',
        ]);
    }
}

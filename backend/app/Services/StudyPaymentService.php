<?php

namespace App\Services;

use App\Models\StudyPayment;
use App\Models\StudyInstallment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StudyPaymentService
{
    public function __construct(
        protected InvoiceNumberService $invoiceNumberService
    ) {}

    /**
     * Create a study installment (individual payment) with balance validation.
     */
    public function createInstallment(array $data, int $userId): StudyInstallment
    {
        return DB::transaction(function () use ($data, $userId) {
            // Lock the study payment record
            $studyPayment = StudyPayment::lockForUpdate()->findOrFail($data['study_payment_id']);

            // Refresh to get computed columns
            $studyPayment->refresh();

            $remainBalance = (float) $studyPayment->remain_balance;

            // Overpayment prevention
            if ((float) $data['amount_paid'] > $remainBalance) {
                throw ValidationException::withMessages([
                    'amount_paid' => ["Payment amount exceeds the remaining balance of {$remainBalance}."],
                ]);
            }

            if ((float) $data['amount_paid'] <= 0) {
                throw ValidationException::withMessages([
                    'amount_paid' => ['Payment amount must be greater than 0.'],
                ]);
            }

            // Get next invoice number
            $invoiceNo = $this->invoiceNumberService->getNextInvoiceNumber();

            $remainBefore = $remainBalance;
            $remainAfter = $remainBefore - (float) $data['amount_paid'];

            // Create the installment
            $installment = StudyInstallment::create([
                'invoice_no' => $invoiceNo,
                'study_payment_id' => $studyPayment->id,
                'student_id' => $studyPayment->student_id,
                'payment_date' => $data['payment_date'] ?? now()->toDateString(),
                'amount_paid' => $data['amount_paid'],
                'remain_before' => $remainBefore,
                'remain_after' => $remainAfter,
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);

            // Update total_paid on the study payment
            $studyPayment->increment('total_paid', (float) $data['amount_paid']);

            return $installment->load('student', 'studyPayment');
        });
    }

    /**
     * Return (void/refund) a study installment.
     */
    public function returnInstallment(int $installmentId, int $userId): StudyInstallment
    {
        return DB::transaction(function () use ($installmentId, $userId) {
            $installment = StudyInstallment::lockForUpdate()->findOrFail($installmentId);

            if ($installment->is_returned) {
                throw ValidationException::withMessages([
                    'id' => ['This bill has already been returned.'],
                ]);
            }

            // Reverse the payment on the parent study payment
            $studyPayment = StudyPayment::lockForUpdate()->findOrFail($installment->study_payment_id);
            $studyPayment->decrement('total_paid', (float) $installment->amount_paid);

            // Mark installment as returned
            $installment->update([
                'is_returned' => true,
                'returned_at' => now(),
                'returned_by' => $userId,
            ]);

            return $installment->load('student', 'studyPayment');
        });
    }

    /**
     * Get summary of all study payments for current academic year.
     */
    public function getSummary(?string $academicYear = null): array
    {
        $year = $academicYear ?? config('school.academic_year', '2025-2026');

        $result = StudyPayment::where('academic_year', $year)
            ->selectRaw('
                SUM(annual_price) as total_annual,
                SUM(discount) as total_discount,
                SUM(total_paid) as total_paid,
                SUM(annual_price - discount - total_paid) as total_remaining
            ')
            ->first();

        return [
            'total_annual' => (float) ($result->total_annual ?? 0),
            'total_discount' => (float) ($result->total_discount ?? 0),
            'total_paid' => (float) ($result->total_paid ?? 0),
            'total_remaining' => (float) ($result->total_remaining ?? 0),
            'academic_year' => $year,
        ];
    }
}

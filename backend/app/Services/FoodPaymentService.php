<?php

namespace App\Services;

use App\Models\FoodPayment;
use App\Models\FoodInstallment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FoodPaymentService
{
    public function __construct(
        protected InvoiceNumberService $invoiceNumberService
    ) {}

    /**
     * Create a food installment with balance validation.
     */
    public function createInstallment(array $data, int $userId): FoodInstallment
    {
        return DB::transaction(function () use ($data, $userId) {
            $foodPayment = FoodPayment::lockForUpdate()->findOrFail($data['food_payment_id']);
            $foodPayment->refresh();

            $remainBalance = (float) $foodPayment->remain_balance;

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

            $invoiceNo = $this->invoiceNumberService->getNextInvoiceNumber();

            $remainBefore = $remainBalance;
            $remainAfter = $remainBefore - (float) $data['amount_paid'];

            $installment = FoodInstallment::create([
                'invoice_no' => $invoiceNo,
                'food_payment_id' => $foodPayment->id,
                'student_id' => $foodPayment->student_id,
                'payment_date' => $data['payment_date'] ?? now()->toDateString(),
                'amount_paid' => $data['amount_paid'],
                'remain_before' => $remainBefore,
                'remain_after' => $remainAfter,
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);

            $foodPayment->increment('total_paid', (float) $data['amount_paid']);

            return $installment->load('student', 'foodPayment');
        });
    }

    /**
     * Return (void/refund) a food installment.
     */
    public function returnInstallment(int $installmentId, int $userId): FoodInstallment
    {
        return DB::transaction(function () use ($installmentId, $userId) {
            $installment = FoodInstallment::lockForUpdate()->findOrFail($installmentId);

            if ($installment->is_returned) {
                throw ValidationException::withMessages([
                    'id' => ['This bill has already been returned.'],
                ]);
            }

            $foodPayment = FoodPayment::lockForUpdate()->findOrFail($installment->food_payment_id);
            $foodPayment->decrement('total_paid', (float) $installment->amount_paid);

            $installment->update([
                'is_returned' => true,
                'returned_at' => now(),
                'returned_by' => $userId,
            ]);

            return $installment->load('student', 'foodPayment');
        });
    }

    /**
     * Get summary of all food payments for current academic year.
     */
    public function getSummary(?string $academicYear = null): array
    {
        $year = $academicYear ?? config('school.academic_year', '2025-2026');

        $result = FoodPayment::where('academic_year', $year)
            ->selectRaw('
                SUM(monthly_price) as total_monthly,
                SUM(discount) as total_discount,
                SUM(total_paid) as total_paid,
                SUM(monthly_price - discount - total_paid) as total_remaining
            ')
            ->first();

        return [
            'total_monthly' => (float) ($result->total_monthly ?? 0),
            'total_discount' => (float) ($result->total_discount ?? 0),
            'total_paid' => (float) ($result->total_paid ?? 0),
            'total_remaining' => (float) ($result->total_remaining ?? 0),
            'academic_year' => $year,
        ];
    }
}

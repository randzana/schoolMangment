<?php

namespace Database\Seeders;

use App\Models\InvoiceSequence;
use App\Models\StudyPayment;
use App\Models\FoodPayment;
use App\Models\StudyInstallment;
use App\Models\FoodInstallment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InstallmentSeeder extends Seeder
{
    public function run(): void
    {
        $adminUser = User::where('role', 'admin')->first();
        $sequence = InvoiceSequence::first();
        $invoiceNo = $sequence->last_invoice_no;

        // Generate 20 study installments spread across the academic year
        $studyPayments = StudyPayment::with('student')->get();

        foreach ($studyPayments->random(min(15, $studyPayments->count())) as $sp) {
            $remainBalance = (float) $sp->annual_price - (float) $sp->discount - (float) $sp->total_paid;

            if ($remainBalance <= 0) {
                continue;
            }

            // Make 1-2 payments per selected student
            $paymentCount = rand(1, 2);

            for ($i = 0; $i < $paymentCount; $i++) {
                $remainBalance = (float) $sp->annual_price - (float) $sp->discount - (float) $sp->total_paid;

                if ($remainBalance <= 0) {
                    break;
                }

                // Pay between 20% and 50% of remaining
                $maxPayment = min($remainBalance, (float) $sp->annual_price * 0.5);
                $amount = round(rand((int) ($maxPayment * 0.4), (int) $maxPayment) / 1000) * 1000;
                $amount = min($amount, $remainBalance);

                if ($amount <= 0) {
                    break;
                }

                $invoiceNo++;
                $remainBefore = $remainBalance;
                $remainAfter = $remainBefore - $amount;

                // Random date between Sep 2025 and now
                $paymentDate = Carbon::create(2025, 9, 1)
                    ->addDays(rand(0, 270))
                    ->format('Y-m-d');

                StudyInstallment::create([
                    'invoice_no' => $invoiceNo,
                    'study_payment_id' => $sp->id,
                    'student_id' => $sp->student_id,
                    'payment_date' => $paymentDate,
                    'amount_paid' => $amount,
                    'remain_before' => $remainBefore,
                    'remain_after' => $remainAfter,
                    'created_by' => $adminUser->id,
                ]);

                // Update total_paid on the study payment
                $sp->increment('total_paid', $amount);
            }
        }

        // Generate 10 food installments
        $foodPayments = FoodPayment::with('student')->get();

        foreach ($foodPayments->random(min(10, $foodPayments->count())) as $fp) {
            $remainBalance = (float) $fp->monthly_price - (float) $fp->discount - (float) $fp->total_paid;

            if ($remainBalance <= 0) {
                continue;
            }

            $amount = round(rand((int) ($remainBalance * 0.3), (int) $remainBalance) / 1000) * 1000;
            $amount = min($amount, $remainBalance);

            if ($amount <= 0) {
                continue;
            }

            $invoiceNo++;
            $remainBefore = $remainBalance;
            $remainAfter = $remainBefore - $amount;

            $paymentDate = Carbon::create(2025, 9, 1)
                ->addDays(rand(0, 270))
                ->format('Y-m-d');

            FoodInstallment::create([
                'invoice_no' => $invoiceNo,
                'food_payment_id' => $fp->id,
                'student_id' => $fp->student_id,
                'payment_date' => $paymentDate,
                'amount_paid' => $amount,
                'remain_before' => $remainBefore,
                'remain_after' => $remainAfter,
                'created_by' => $adminUser->id,
            ]);

            $fp->increment('total_paid', $amount);
        }

        // Update invoice sequence
        $sequence->update(['last_invoice_no' => $invoiceNo]);
    }
}

<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\StudyInstallment;
use App\Models\FoodInstallment;

class InvoicePdfService
{
    /**
     * Generate a study installment invoice PDF.
     */
    public function generateStudyInvoice(StudyInstallment $installment): \Barryvdh\DomPDF\PDF
    {
        $installment->load('student', 'studyPayment');

        $data = [
            'school_name' => config('school.name', 'Private F.G Basic School'),
            'invoice_no' => $installment->invoice_no,
            'date' => $installment->payment_date->format('d/m/Y'),
            'invoice_type' => 'Study Payment',
            'student_name' => $installment->student->full_name,
            'grade' => $installment->student->grade_display,
            'serial_no' => $installment->student->serial_number,
            'annual_fee' => $installment->studyPayment->annual_price,
            'discount' => $installment->studyPayment->discount,
            'fee_after_discount' => $installment->studyPayment->price_after_discount,
            'remain_before' => $installment->remain_before,
            'amount_paid' => $installment->amount_paid,
            'remain_after' => $installment->remain_after,
            'fee_label' => 'Annual Fee',
            'is_returned' => $installment->is_returned,
        ];

        return Pdf::loadView('invoices.installment', $data)
            ->setPaper('a5', 'portrait');
    }

    /**
     * Generate a food installment invoice PDF.
     */
    public function generateFoodInvoice(FoodInstallment $installment): \Barryvdh\DomPDF\PDF
    {
        $installment->load('student', 'foodPayment');

        $data = [
            'school_name' => config('school.name', 'Private F.G Basic School'),
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
            'fee_label' => 'Monthly Fee',
            'is_returned' => $installment->is_returned,
        ];

        return Pdf::loadView('invoices.installment', $data)
            ->setPaper('a5', 'portrait');
    }
}

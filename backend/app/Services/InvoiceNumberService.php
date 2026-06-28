<?php

namespace App\Services;

use App\Models\InvoiceSequence;
use Illuminate\Support\Facades\DB;

class InvoiceNumberService
{
    /**
     * Generate the next global invoice number using a transaction-safe approach.
     * Uses SELECT FOR UPDATE to prevent race conditions.
     * Invoice numbers are never reused even if a bill is deleted.
     */
    public function getNextInvoiceNumber(): int
    {
        return DB::transaction(function () {
            $sequence = DB::table('invoice_sequence')
                ->lockForUpdate()
                ->first();

            $nextInvoiceNo = $sequence->last_invoice_no + 1;

            DB::table('invoice_sequence')
                ->where('id', $sequence->id)
                ->update(['last_invoice_no' => $nextInvoiceNo]);

            return $nextInvoiceNo;
        });
    }
}

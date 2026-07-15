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
    public function getNextInvoiceNumber(string $type): int
    {
        return DB::transaction(function () use ($type) {
            $sequence = DB::table('invoice_sequence')
                ->where('type', $type)
                ->lockForUpdate()
                ->first();

            // Fallback if sequence type is not seeded
            if (!$sequence) {
                $globalMax = DB::table('invoice_sequence')
                    ->where('type', 'global')
                    ->value('last_invoice_no') ?? 0;

                $id = DB::table('invoice_sequence')->insertGetId([
                    'type' => $type,
                    'last_invoice_no' => $globalMax
                ]);

                $sequence = DB::table('invoice_sequence')
                    ->where('id', $id)
                    ->first();
            }

            $nextInvoiceNo = $sequence->last_invoice_no + 1;

            DB::table('invoice_sequence')
                ->where('id', $sequence->id)
                ->update(['last_invoice_no' => $nextInvoiceNo]);

            return $nextInvoiceNo;
        });
    }
}

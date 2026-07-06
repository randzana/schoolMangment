<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update the current invoice sequence to start from 0 if it is 1000
        DB::table('invoice_sequence')->where('last_invoice_no', 1000)->update(['last_invoice_no' => 0]);
    }

    public function down(): void
    {
        DB::table('invoice_sequence')->where('last_invoice_no', 0)->update(['last_invoice_no' => 1000]);
    }
};

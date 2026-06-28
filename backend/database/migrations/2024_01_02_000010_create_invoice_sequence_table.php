<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_sequence', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('last_invoice_no')->default(0);
        });

        // Seed the sequence with initial row
        DB::table('invoice_sequence')->insert(['last_invoice_no' => 0]);
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_sequence');
    }
};

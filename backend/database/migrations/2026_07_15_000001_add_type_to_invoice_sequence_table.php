<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_sequence', function (Blueprint $table) {
            $table->string('type', 50)->default('global');
        });

        // Get the current max global sequence number to use as start point
        $currentMax = DB::table('invoice_sequence')->value('last_invoice_no') ?? 0;

        // Seed sequence for each department starting from currentMax to avoid collisions
        DB::table('invoice_sequence')->insert([
            ['type' => 'study', 'last_invoice_no' => $currentMax],
            ['type' => 'food', 'last_invoice_no' => $currentMax],
            ['type' => 'clothes_book', 'last_invoice_no' => $currentMax],
        ]);
    }

    public function down(): void
    {
        Schema::table('invoice_sequence', function (Blueprint $table) {
            $table->dropColumn('type');
        });
        
        DB::table('invoice_sequence')->whereIn('type', ['study', 'food', 'clothes_book'])->delete();
    }
};

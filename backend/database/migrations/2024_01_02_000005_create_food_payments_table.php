<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students');
            $table->string('academic_year', 9)->default('2025-2026');
            $table->decimal('monthly_price', 15, 2);
            $table->decimal('discount', 15, 2)->default(0);
            // price_after_discount and remain_balance are generated columns — added via raw SQL below
            $table->decimal('total_paid', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestampsTz();

            $table->unique(['student_id', 'academic_year']);
        });

        // Add PostgreSQL generated columns
        DB::statement('ALTER TABLE food_payments ADD COLUMN price_after_discount NUMERIC(15,2) GENERATED ALWAYS AS (monthly_price - discount) STORED');
        DB::statement('ALTER TABLE food_payments ADD COLUMN remain_balance NUMERIC(15,2) GENERATED ALWAYS AS (monthly_price - discount - total_paid) STORED');
    }

    public function down(): void
    {
        Schema::dropIfExists('food_payments');
    }
};

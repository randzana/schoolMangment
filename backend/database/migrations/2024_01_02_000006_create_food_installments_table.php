<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_installments', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('invoice_no')->unique();
            $table->foreignId('food_payment_id')->constrained('food_payments');
            $table->foreignId('student_id')->constrained('students');
            $table->date('payment_date')->default(DB::raw('CURRENT_DATE'));
            $table->decimal('amount_paid', 15, 2);
            $table->decimal('remain_before', 15, 2);
            $table->decimal('remain_after', 15, 2);
            $table->text('notes')->nullable();
            $table->boolean('is_returned')->default(false);
            $table->timestampTz('returned_at')->nullable();
            $table->foreignId('returned_by')->nullable()->constrained('users');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestampsTz();

            $table->index('student_id');
            $table->index('payment_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_installments');
    }
};

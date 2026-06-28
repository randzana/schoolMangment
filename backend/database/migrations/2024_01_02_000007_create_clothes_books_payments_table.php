<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clothes_books_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students');
            $table->string('academic_year', 9);
            $table->string('item_type', 20); // 'clothes' | 'book' | 'both'
            $table->decimal('price', 15, 2);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->date('payment_date')->nullable();
            $table->text('notes')->nullable();
            $table->bigInteger('invoice_no')->unique()->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clothes_books_payments');
    }
};

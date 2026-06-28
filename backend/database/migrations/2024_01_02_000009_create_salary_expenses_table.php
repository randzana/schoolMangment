<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers');
            $table->string('month', 7); // 'YYYY-MM'
            $table->decimal('amount_paid', 15, 2);
            $table->date('paid_date')->default(DB::raw('CURRENT_DATE'));
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestampsTz();

            $table->unique(['teacher_id', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_expenses');
    }
};

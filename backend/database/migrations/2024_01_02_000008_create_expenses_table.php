<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->decimal('amount', 15, 2);
            $table->date('expense_date')->default(DB::raw('CURRENT_DATE'));
            $table->string('category', 100)->nullable();
            $table->text('description')->nullable();
            $table->string('receipt_no', 50)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestampsTz();
            $table->softDeletesTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};

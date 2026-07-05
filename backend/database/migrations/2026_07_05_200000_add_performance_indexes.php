<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // study_payments: speed up dashboard and report queries
        Schema::table('study_payments', function (Blueprint $table) {
            $table->index('academic_year');
            $table->index(['student_id', 'academic_year']);
        });

        // food_payments: speed up dashboard and report queries
        Schema::table('food_payments', function (Blueprint $table) {
            $table->index('academic_year');
            $table->index(['student_id', 'academic_year']);
        });

        // study_installments: speed up monthly chart aggregation
        Schema::table('study_installments', function (Blueprint $table) {
            $table->index(['payment_date', 'is_returned']);
        });

        // food_installments: speed up monthly chart aggregation
        Schema::table('food_installments', function (Blueprint $table) {
            $table->index(['payment_date', 'is_returned']);
        });

        // expenses: speed up monthly expense aggregation
        Schema::table('expenses', function (Blueprint $table) {
            $table->index('expense_date');
        });

        // clothes_books_payments: speed up report queries
        Schema::table('clothes_books_payments', function (Blueprint $table) {
            $table->index('academic_year');
            $table->index(['item_type', 'academic_year']);
        });

        // students: speed up active student queries
        Schema::table('students', function (Blueprint $table) {
            $table->index(['is_active', 'deleted_at']);
        });
    }

    public function down(): void
    {
        Schema::table('study_payments', function (Blueprint $table) {
            $table->dropIndex(['academic_year']);
            $table->dropIndex(['student_id', 'academic_year']);
        });

        Schema::table('food_payments', function (Blueprint $table) {
            $table->dropIndex(['academic_year']);
            $table->dropIndex(['student_id', 'academic_year']);
        });

        Schema::table('study_installments', function (Blueprint $table) {
            $table->dropIndex(['payment_date', 'is_returned']);
        });

        Schema::table('food_installments', function (Blueprint $table) {
            $table->dropIndex(['payment_date', 'is_returned']);
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex(['expense_date']);
        });

        Schema::table('clothes_books_payments', function (Blueprint $table) {
            $table->dropIndex(['academic_year']);
            $table->dropIndex(['item_type', 'academic_year']);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['is_active', 'deleted_at']);
        });
    }
};

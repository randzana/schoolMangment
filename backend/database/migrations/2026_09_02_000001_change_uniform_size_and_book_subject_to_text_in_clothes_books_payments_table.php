<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clothes_books_payments', function (Blueprint $table) {
            $table->text('uniform_size')->nullable()->change();
            $table->text('book_subject')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('clothes_books_payments', function (Blueprint $table) {
            $table->string('uniform_size', 50)->nullable()->change();
            $table->string('book_subject', 100)->nullable()->change();
        });
    }
};

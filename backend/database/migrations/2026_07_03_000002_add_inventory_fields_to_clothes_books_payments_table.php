<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clothes_books_payments', function (Blueprint $table) {
            $table->string('uniform_size', 50)->nullable();
            $table->string('book_subject', 100)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('clothes_books_payments', function (Blueprint $table) {
            $table->dropColumn(['uniform_size', 'book_subject']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clothes_books_payments', function (Blueprint $table) {
            $table->json('items')->nullable()->after('quantity');
        });
    }

    public function down(): void
    {
        Schema::table('clothes_books_payments', function (Blueprint $table) {
            $table->dropColumn('items');
        });
    }
};

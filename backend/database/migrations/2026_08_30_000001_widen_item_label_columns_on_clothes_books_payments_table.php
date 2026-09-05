<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A clothes sale packs a label for every purchased row into `uniform_size`
     * (e.g. "M (2 دانە)، L (3 دانە)"), so the 50-character limit was exhausted
     * after only a handful of rows and the insert failed with a 500. Both label
     * columns become unbounded text.
     */
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

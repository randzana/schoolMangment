<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number', 20)->unique();
            $table->string('full_name', 150);
            $table->string('grade', 20); // 'one','two','three','four','five'
            $table->string('phone', 30)->nullable();
            $table->text('address')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('full_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};

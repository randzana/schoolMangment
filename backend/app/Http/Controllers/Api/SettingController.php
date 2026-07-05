<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\Inventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingController extends Controller
{
    /**
     * Get settings list
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'academic_year' => Setting::getValue('academic_year', config('school.academic_year')),
            ],
            'message' => 'Settings retrieved successfully',
        ]);
    }

    /**
     * Update settings
     */
    public function update(Request $request): JsonResponse
    {
        // Require admin role
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Rêگەی پێدراو نیت بۆ ئەنجامدانی ئەم کردارە',
            ], 403);
        }

        $validated = $request->validate([
            'academic_year' => 'required|string|max:9|regex:/^\d{4}-\d{4}$/',
        ], [
            'academic_year.regex' => 'تکایە ساڵی خوێندن بە فۆرماتی دروست بنووسە (بۆ نموونە: 2026-2027)',
        ]);

        Setting::setValue('academic_year', $validated['academic_year']);
        
        // Dynamic reload for current process
        config(['school.academic_year' => $validated['academic_year']]);

        return response()->json([
            'success' => true,
            'data' => [
                'academic_year' => $validated['academic_year'],
            ],
            'message' => 'ساڵی خوێندن بە سەرکەوتوویی نوێکرایەوە',
        ]);
    }

    /**
     * Reset database
     */
    public function resetDatabase(Request $request): JsonResponse
    {
        // Require admin role
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Rêگەی پێدراو نیت بۆ ئەنجامدانی ئەم کردارە',
            ], 403);
        }

        DB::transaction(function () {
            // Wipes students, payments, expenses, etc. and restarts serial identifiers
            DB::statement('TRUNCATE TABLE study_payments, study_installments, food_payments, food_installments, clothes_books_payments, expenses, students RESTART IDENTITY CASCADE;');

            // Resets invoice sequence back to 1000 instead of truncating it to prevent null pointer crashes
            DB::table('invoice_sequence')->update(['last_invoice_no' => 1000]);

            // Wipes custom items from inventories and resets seeded items back to default values
            // 1. Delete custom items
            Inventory::whereNotIn('code', [
                'uniform_s', 'uniform_m', 'uniform_l', 'uniform_xl', 'uniform_xxl', 
                'uniform_28', 'uniform_30', 'uniform_32', 'uniform_34', 'uniform_36', 'uniform_38', 'uniform_40',
                'book_kurdish', 'book_mathematics', 'book_english', 'book_science', 'book_art', 'book_computer_science', 'book_social_studies'
            ])->delete();

            // 2. Reset standard uniforms to 100
            Inventory::where('item_type', 'clothes')->update(['quantity' => 100]);

            // 3. Reset standard books to 150
            Inventory::where('item_type', 'book')->update(['quantity' => 150]);
        });

        return response()->json([
            'success' => true,
            'message' => 'سەرجەم زانیارییەکان بە سەرکەوتوویی سڕانەوە و کۆگا سەرلەنوێ ڕێکخرایەوە',
        ]);
    }
}

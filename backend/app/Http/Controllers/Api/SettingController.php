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

        $oldYear = Setting::getValue('academic_year', config('school.academic_year'));
        $newYear = $validated['academic_year'];

        $oldYearClean = trim($oldYear);
        $newYearClean = trim($newYear);

        if ($oldYearClean !== $newYearClean) {
            $request->validate([
                'password' => 'required|string',
                'confirm' => 'required|string|in:RESET',
            ], [
                'confirm.in' => 'تکایە وشەی RESET بنووسە بۆ پشتڕاستکردنەوە',
                'password.required' => 'تکایە تێپەڕەوشە بنووسە بۆ پشتڕاستکردنەوە',
            ]);

            if (!\Illuminate\Support\Facades\Hash::check($request->password, $request->user()->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'تێپەڕەوشەی نادروستە. کرداری گۆڕینی ساڵ و سڕینەوەی گشتی ڕەتکرایەوە.',
                ], 422);
            }

            DB::transaction(function () use ($newYear) {
                Setting::setValue('academic_year', $newYear);
                config(['school.academic_year' => $newYear]);

                // Wipes students, payments, expenses, etc. and restarts serial identifiers
                DB::statement('TRUNCATE TABLE study_payments, study_installments, food_payments, food_installments, clothes_books_payments, expenses, students RESTART IDENTITY CASCADE;');

                // Resets invoice sequence back to 0
                DB::table('invoice_sequence')->update(['last_invoice_no' => 0]);

                // Wipes custom items from inventories and resets seeded items back to default values
                Inventory::whereNotIn('code', [
                    'uniform_s', 'uniform_m', 'uniform_l', 'uniform_xl', 'uniform_xxl', 
                    'uniform_28', 'uniform_30', 'uniform_32', 'uniform_34', 'uniform_36', 'uniform_38', 'uniform_40',
                    'book_kurdish', 'book_mathematics', 'book_english', 'book_science', 'book_art', 'book_computer_science', 'book_social_studies'
                ])->delete();

                // Reset standard uniforms to 100
                Inventory::where('item_type', 'clothes')->update(['quantity' => 100]);

                // Reset standard books to 150
                Inventory::where('item_type', 'book')->update(['quantity' => 150]);
            });

            $message = 'ساڵی خوێندن گۆڕدرا و سەرجەم زانیارییەکان بە سەرکەوتوویی سڕانەوە و سیستەمەکە سفر کرایەوە';
        } else {
            Setting::setValue('academic_year', $newYear);
            config(['school.academic_year' => $newYear]);
            $message = 'ساڵی خوێندن بە سەرکەوتوویی نوێکرایەوە';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'academic_year' => $newYear,
            ],
            'message' => $message,
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

        $request->validate([
            'password' => 'required|string',
            'confirm' => 'required|string|in:RESET',
        ], [
            'confirm.in' => 'تکایە وشەی RESET بنووسە بۆ پشتڕاستکردنەوە',
            'password.required' => 'تکایە تێپەڕەوشە بنووسە بۆ پشتڕاستکردنەوە',
        ]);

        if (!\Illuminate\Support\Facades\Hash::check($request->password, $request->user()->password)) {
            return response()->json([
                'success' => false,
                'message' => 'تێپەڕەوشەی نادروستە. کرداری سڕینەوەی گشتی ڕەتکرایەوە.',
            ], 422);
        }

        DB::transaction(function () {
            // Wipes students, payments, expenses, etc. and restarts serial identifiers
            DB::statement('TRUNCATE TABLE study_payments, study_installments, food_payments, food_installments, clothes_books_payments, expenses, students RESTART IDENTITY CASCADE;');

            // Resets invoice sequence back to 0 instead of truncating it to prevent null pointer crashes
            DB::table('invoice_sequence')->update(['last_invoice_no' => 0]);

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

    /**
     * Generate and download database SQL backup file
     */
    public function backup(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse|JsonResponse
    {
        // Require admin role
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'ڕێگەپێدراو نیت بۆ ئەنجامدانی ئەم کردارە',
            ], 403);
        }

        $filename = 'school_backup_' . date('Y-m-d_H-i-s') . '.sql';

        return response()->streamDownload(function () {
            $tables = [
                'users',
                'students',
                'study_payments',
                'study_installments',
                'food_payments',
                'food_installments',
                'clothes_books_payments',
                'expenses',
                'inventories',
                'invoice_sequence',
                'settings',
            ];

            echo "-- School Management System Database Dump\n";
            echo "-- Generated at: " . date('Y-m-d H:i:s') . "\n";
            echo "-- ------------------------------------------------------\n\n";
            echo "SET statement_timeout = 0;\n";
            echo "SET client_encoding = 'UTF8';\n";
            echo "SET standard_conforming_strings = on;\n\n";

            foreach ($tables as $table) {
                if (!DB::getSchemaBuilder()->hasTable($table)) {
                    continue;
                }

                echo "-- ------------------------------------------------------\n";
                echo "-- Table structure and data for: {$table}\n";
                echo "-- ------------------------------------------------------\n";

                $rows = DB::table($table)->get();

                if ($rows->count() > 0) {
                    foreach ($rows as $row) {
                        $arrayRow = (array) $row;
                        $columns = array_keys($arrayRow);
                        $escapedColumns = array_map(fn($col) => '"' . $col . '"', $columns);

                        $values = array_map(function ($value) {
                            if ($value === null) {
                                return 'NULL';
                            }
                            if (is_bool($value)) {
                                return $value ? 'true' : 'false';
                            }
                            if (is_int($value) || is_float($value)) {
                                return $value;
                            }
                            $escaped = str_replace("'", "''", (string) $value);
                            return "'" . $escaped . "'";
                        }, array_values($arrayRow));

                        echo 'INSERT INTO "' . $table . '" (' . implode(', ', $escapedColumns) . ') VALUES (' . implode(', ', $values) . ") ON CONFLICT DO NOTHING;\n";
                    }
                    echo "\n";
                }
            }
        }, $filename, [
            'Content-Type' => 'text/plain',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}

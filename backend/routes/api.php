<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Public invoice print routes (accessed via window.open in new tab)
Route::get('study-installments/{id}/invoice', [\App\Http\Controllers\Api\StudyInstallmentController::class, 'invoice']);
Route::get('food-installments/{id}/invoice', [\App\Http\Controllers\Api\FoodInstallmentController::class, 'invoice']);
Route::get('clothes-books/{id}/invoice', [\App\Http\Controllers\Api\ClothesBookController::class, 'invoice']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Students
    Route::apiResource('students', \App\Http\Controllers\Api\StudentController::class);
    Route::get('students-search', [\App\Http\Controllers\Api\StudentController::class, 'search']);



    // Study Payments
    Route::apiResource('study-payments', \App\Http\Controllers\Api\StudyPaymentController::class)->except(['destroy']);
    Route::get('study-payments-summary', [\App\Http\Controllers\Api\StudyPaymentController::class, 'summary']);

    // Study Installments
    Route::apiResource('study-installments', \App\Http\Controllers\Api\StudyInstallmentController::class)->except(['update']);
    Route::put('study-installments/{id}/return', [\App\Http\Controllers\Api\StudyInstallmentController::class, 'returnBill'])
        ->middleware('role:admin');

    // Food Payments
    Route::apiResource('food-payments', \App\Http\Controllers\Api\FoodPaymentController::class)->except(['destroy']);
    Route::get('food-payments-summary', [\App\Http\Controllers\Api\FoodPaymentController::class, 'summary']);

    // Food Installments
    Route::apiResource('food-installments', \App\Http\Controllers\Api\FoodInstallmentController::class)->except(['update']);
    Route::put('food-installments/{id}/return', [\App\Http\Controllers\Api\FoodInstallmentController::class, 'returnBill'])
        ->middleware('role:admin');

    // Clothes & Books
    Route::apiResource('clothes-books', \App\Http\Controllers\Api\ClothesBookController::class);

    // Expenses
    Route::apiResource('expenses', \App\Http\Controllers\Api\ExpenseController::class);



    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/study-installments', [\App\Http\Controllers\Api\ReportController::class, 'studyInstallments']);
        Route::get('/food-installments', [\App\Http\Controllers\Api\ReportController::class, 'foodInstallments']);
        Route::get('/study-income', [\App\Http\Controllers\Api\ReportController::class, 'studyIncome']);
        Route::get('/expenses', [\App\Http\Controllers\Api\ReportController::class, 'expenses']);

        Route::get('/student-list', [\App\Http\Controllers\Api\ReportController::class, 'studentList']);
        Route::get('/study-installments/export', [\App\Http\Controllers\Api\ReportController::class, 'exportStudyInstallments']);
        Route::get('/study-installments/pdf', [\App\Http\Controllers\Api\ReportController::class, 'pdfStudyInstallments']);
        Route::get('/dashboard', [\App\Http\Controllers\Api\ReportController::class, 'dashboard']);
    });

    // User Management (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', \App\Http\Controllers\Api\UserController::class);
        Route::patch('users/{id}/toggle-active', [\App\Http\Controllers\Api\UserController::class, 'toggleActive']);
    });
});

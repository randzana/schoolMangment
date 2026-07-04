<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('settings')) {
                $academicYear = \App\Models\Setting::getValue('academic_year');
                if ($academicYear) {
                    config(['school.academic_year' => $academicYear]);
                } else {
                    // Populate default setting in DB if empty
                    $defaultYear = config('school.academic_year');
                    \App\Models\Setting::setValue('academic_year', $defaultYear);
                }
            }
        } catch (\Exception $e) {
            // Prevent failure during bootstrap (e.g. migration run)
        }
    }
}

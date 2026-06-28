<?php

namespace Database\Seeders;

use App\Models\Student;
use App\Models\FoodPayment;
use Illuminate\Database\Seeder;

class FoodPaymentSeeder extends Seeder
{
    public function run(): void
    {
        $academicYear = config('school.academic_year', '2025-2026');
        $monthlyPrice = config('school.food_price', 150000);

        $students = Student::all();
        $discountStudents = $students->random((int) ($students->count() * 0.2));

        foreach ($students as $student) {
            $discount = 0;

            if ($discountStudents->contains($student)) {
                $discount = rand(1, 3) * 10000; // 10k-30k discount
            }

            FoodPayment::create([
                'student_id' => $student->id,
                'academic_year' => $academicYear,
                'monthly_price' => $monthlyPrice,
                'discount' => $discount,
                'total_paid' => 0,
            ]);
        }
    }
}

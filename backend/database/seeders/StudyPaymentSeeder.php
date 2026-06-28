<?php

namespace Database\Seeders;

use App\Models\Student;
use App\Models\StudyPayment;
use Illuminate\Database\Seeder;

class StudyPaymentSeeder extends Seeder
{
    public function run(): void
    {
        $academicYear = config('school.academic_year', '2025-2026');
        $prices = config('school.study_prices');

        $students = Student::all();
        $discountStudents = $students->random((int) ($students->count() * 0.3));

        foreach ($students as $student) {
            $annualPrice = $prices[$student->grade] ?? 1300000;
            $discount = 0;

            if ($discountStudents->contains($student)) {
                // Random discount between 50k and 200k
                $discount = rand(1, 4) * 50000;
            }

            StudyPayment::create([
                'student_id' => $student->id,
                'academic_year' => $academicYear,
                'annual_price' => $annualPrice,
                'discount' => $discount,
                'total_paid' => 0,
            ]);
        }
    }
}

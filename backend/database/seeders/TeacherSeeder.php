<?php

namespace Database\Seeders;

use App\Models\Teacher;
use Illuminate\Database\Seeder;

class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        $teachers = [
            ['full_name' => 'کاژاو محمد عبدالکریم', 'subject' => 'Mathematics', 'phone' => '0750 111 2222', 'monthly_salary' => 850000, 'address' => 'Erbil, Ankawa'],
            ['full_name' => 'نازدار حسن احمد', 'subject' => 'Science', 'phone' => '0751 222 3333', 'monthly_salary' => 800000, 'address' => 'Erbil, Rizgary'],
            ['full_name' => 'سوزان عثمان خلیل', 'subject' => 'Arabic Language', 'phone' => '0770 333 4444', 'monthly_salary' => 750000, 'address' => 'Erbil, 60 Meter'],
            ['full_name' => 'شادی جبار رحمان', 'subject' => 'English Language', 'phone' => '0750 444 5555', 'monthly_salary' => 900000, 'address' => 'Erbil, Dream City'],
            ['full_name' => 'ڕۆشنا عادل فتاح', 'subject' => 'Kurdish Language', 'phone' => '0751 555 6666', 'monthly_salary' => 750000, 'address' => 'Erbil, Gulan'],
        ];

        foreach ($teachers as $data) {
            Teacher::create(array_merge($data, ['is_active' => true]));
        }
    }
}

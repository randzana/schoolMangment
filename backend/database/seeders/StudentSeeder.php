<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $students = [
            ['serial_number' => '4947492', 'full_name' => 'ئاراس ئەحمەد محمود', 'grade' => 'one', 'phone' => '0750 123 4567', 'address' => 'Erbil, Ankawa'],
            ['serial_number' => '4947501', 'full_name' => 'هەڵاو عمر حسین', 'grade' => 'one', 'phone' => '0751 234 5678', 'address' => 'Erbil, Rizgary'],
            ['serial_number' => '4947512', 'full_name' => 'زەیتون خالد رشید', 'grade' => 'one', 'phone' => '0770 345 6789', 'address' => 'Erbil, Iskan'],
            ['serial_number' => '4947523', 'full_name' => 'سارا محمد عبدالله', 'grade' => 'one', 'phone' => '0750 456 7890', 'address' => 'Erbil, 30 Meter'],
            ['serial_number' => '4947534', 'full_name' => 'دانا عثمان کریم', 'grade' => 'two', 'phone' => '0751 567 8901', 'address' => 'Erbil, Brayati'],
            ['serial_number' => '4947545', 'full_name' => 'ڕۆژان ناجی صالح', 'grade' => 'two', 'phone' => '0770 678 9012', 'address' => 'Erbil, Dream City'],
            ['serial_number' => '4947556', 'full_name' => 'شادی حسن علی', 'grade' => 'two', 'phone' => '0750 789 0123', 'address' => 'Erbil, Havalan'],
            ['serial_number' => '4947567', 'full_name' => 'هاوناز سلام جبار', 'grade' => 'two', 'phone' => '0751 890 1234', 'address' => 'Erbil, Azadi'],
            ['serial_number' => '4947578', 'full_name' => 'ڕێبەر طاهر حمید', 'grade' => 'three', 'phone' => '0770 901 2345', 'address' => 'Erbil, Rozhalat'],
            ['serial_number' => '4947589', 'full_name' => 'شیلان عادل ئیبراهیم', 'grade' => 'three', 'phone' => '0750 012 3456', 'address' => 'Erbil, Naz City'],
            ['serial_number' => '4947590', 'full_name' => 'کارزان فایق مصطفی', 'grade' => 'three', 'phone' => '0751 123 4568', 'address' => 'Erbil, Gulan'],
            ['serial_number' => '4947601', 'full_name' => 'ژینا بختیار عزیز', 'grade' => 'three', 'phone' => '0770 234 5679', 'address' => 'Erbil, Bakhtiary'],
            ['serial_number' => '4947612', 'full_name' => 'ئاوات نوری کمال', 'grade' => 'four', 'phone' => '0750 345 6780', 'address' => 'Erbil, 60 Meter'],
            ['serial_number' => '4947623', 'full_name' => 'ساکار جلال ئامین', 'grade' => 'four', 'phone' => '0751 456 7891', 'address' => 'Erbil, Minare'],
            ['serial_number' => '4947634', 'full_name' => 'نەبەز رؤوف جمیل', 'grade' => 'four', 'phone' => '0770 567 8902', 'address' => 'Erbil, Kasnazan'],
            ['serial_number' => '4947645', 'full_name' => 'گەلاویژ هیمن شاکر', 'grade' => 'four', 'phone' => '0750 678 9013', 'address' => 'Erbil, Sarwaran'],
            ['serial_number' => '4947656', 'full_name' => 'هەمن ئارام رەشید', 'grade' => 'five', 'phone' => '0751 789 0124', 'address' => 'Erbil, Shorsh'],
            ['serial_number' => '4947667', 'full_name' => 'شۆخان سامان حەمەد', 'grade' => 'five', 'phone' => '0770 890 1235', 'address' => 'Erbil, Shaqlawa St'],
            ['serial_number' => '4947678', 'full_name' => 'ڤیان عبداللە سعید', 'grade' => 'five', 'phone' => '0750 901 2346', 'address' => 'Erbil, Bahirka'],
            ['serial_number' => '4947689', 'full_name' => 'ڕوناک حسام نەریمان', 'grade' => 'five', 'phone' => '0751 012 3457', 'address' => 'Erbil, Eskan'],
        ];

        foreach ($students as $data) {
            Student::create(array_merge($data, ['is_active' => true]));
        }
    }
}

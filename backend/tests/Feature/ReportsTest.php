<?php

namespace Tests\Feature;

use App\Models\ClothesBookPayment;
use App\Models\Expense;
use App\Models\FoodInstallment;
use App\Models\FoodPayment;
use App\Models\Inventory;
use App\Models\Student;
use App\Models\StudyPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private string $year;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Tester',
            'username' => 'tester',
            'password' => bcrypt('secret123'),
            'role' => 'admin',
            'is_active' => true,
        ]);
        Sanctum::actingAs($this->user);

        $this->year = config('school.academic_year');
    }

    private function student(string $serial, string $name, string $grade = 'one', float $tuition = 1000000): Student
    {
        $student = Student::create([
            'serial_number' => $serial,
            'full_name' => $name,
            'grade' => $grade,
            'is_active' => true,
        ]);

        StudyPayment::create([
            'student_id' => $student->id,
            'academic_year' => $this->year,
            'annual_price' => $tuition,
            'discount' => 0,
            'total_paid' => 0,
        ]);

        return $student;
    }

    private function expense(string $category, float $amount, string $date): Expense
    {
        return Expense::create([
            'title' => $category,
            'category' => $category,
            'amount' => $amount,
            'expense_date' => $date,
            'items' => [['name' => 'پسوولە', 'amount' => $amount]],
        ]);
    }

    public function test_general_expense_report_leaves_out_food_which_has_its_own_report(): void
    {
        $this->expense('ڕاپۆرتی صیانەی بینا', 100000, '2026-10-05');
        $this->expense(Expense::FOOD_CATEGORY, 40000, '2026-10-06');

        $this->getJson('/api/reports/expenses')
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.records.0.category', 'ڕاپۆرتی صیانەی بینا');

        $this->getJson('/api/reports/food-expenses')
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.records.0.category', Expense::FOOD_CATEGORY);
    }

    public function test_expense_reports_filter_by_month(): void
    {
        $this->expense('ڕاپۆرتی صیانەی بینا', 100000, '2026-10-05');
        $this->expense('ڕاپۆرتی صیانەی بینا', 70000, '2026-11-05');
        $this->expense(Expense::FOOD_CATEGORY, 40000, '2026-11-06');

        $this->getJson('/api/reports/expenses?month=11')
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1);
        $this->assertEquals(70000, $this->getJson('/api/reports/expenses?month=11')->json('data.summary.total_amount'));

        $this->getJson('/api/reports/food-expenses?month=10')
            ->assertOk()
            ->assertJsonPath('data.summary.count', 0);
    }

    public function test_expense_prints_render(): void
    {
        $this->expense('ڕاپۆرتی صیانەی بینا', 100000, '2026-10-05');
        $this->expense(Expense::FOOD_CATEGORY, 40000, '2026-10-06');

        $this->get('/api/reports/expenses/pdf?month=10')
            ->assertOk()
            ->assertSee('ڕاپۆرتی گشتی خەرجییەکان')
            ->assertSee('ڕاپۆرتی صیانەی بینا')
            ->assertDontSee(Expense::FOOD_CATEGORY)
            ->assertSee('print-color-adjust', false);

        $this->get('/api/reports/food-expenses/pdf')
            ->assertOk()
            ->assertSee('ڕاپۆرتی خەرجی نانخواردن')
            ->assertSee('40,000');
    }

    public function test_unpaid_students_report_lists_students_without_food_or_clothes_payments(): void
    {
        $paidBoth = $this->student('1', 'Paid Both');
        $noFood = $this->student('2', 'No Food');
        $noClothes = $this->student('3', 'No Clothes');

        foreach ([$paidBoth, $noClothes] as $student) {
            $plan = FoodPayment::create([
                'student_id' => $student->id,
                'academic_year' => $this->year,
                'monthly_price' => 150000,
                'discount' => 0,
                'total_paid' => 150000,
            ]);
            FoodInstallment::create([
                'invoice_no' => 100 + $student->id,
                'food_payment_id' => $plan->id,
                'student_id' => $student->id,
                'payment_date' => '2026-10-01',
                'amount_paid' => 150000,
                'remain_before' => 0,
                'remain_after' => 0,
            ]);
        }

        foreach ([$paidBoth, $noFood] as $student) {
            ClothesBookPayment::create([
                'student_id' => $student->id,
                'academic_year' => $this->year,
                'item_type' => 'clothes',
                'quantity' => 1,
                'price' => 25000,
                'amount_paid' => 25000,
                'uniform_size' => 'M',
            ]);
        }

        $all = $this->getJson('/api/reports/unpaid-students')->assertOk();
        $this->assertSame(['No Food', 'No Clothes'], collect($all->json('data.records'))->pluck('full_name')->all());
        $all->assertJsonPath('data.summary.food_unpaid_count', 1)
            ->assertJsonPath('data.summary.clothes_unpaid_count', 1);

        $food = $this->getJson('/api/reports/unpaid-students?type=food')->assertOk();
        $this->assertSame(['No Food'], collect($food->json('data.records'))->pluck('full_name')->all());

        $clothes = $this->getJson('/api/reports/unpaid-students?type=clothes')->assertOk();
        $this->assertSame(['No Clothes'], collect($clothes->json('data.records'))->pluck('full_name')->all());

        // Food is paid monthly: nobody paid for November yet
        $november = $this->getJson('/api/reports/unpaid-students?type=food&month=11')->assertOk();
        $this->assertCount(3, $november->json('data.records'));

        $this->get('/api/reports/unpaid-students/pdf?type=food')
            ->assertOk()
            ->assertSee('No Food')
            ->assertDontSee('Paid Both');
    }

    public function test_annual_income_reports_profit_from_income_and_expenses(): void
    {
        $student = $this->student('1', 'Payer');
        StudyPayment::where('student_id', $student->id)->update(['total_paid' => 500000]);
        ClothesBookPayment::create([
            'student_id' => $student->id,
            'academic_year' => $this->year,
            'item_type' => 'clothes',
            'quantity' => 1,
            'price' => 25000,
            'amount_paid' => 25000,
            'uniform_size' => 'M',
        ]);
        $this->expense('ڕاپۆرتی صیانەی بینا', 100000, '2026-10-05');
        $this->expense(Expense::FOOD_CATEGORY, 40000, '2026-10-06');

        $summary = $this->getJson('/api/reports/annual-income?academic_year=' . $this->year)->assertOk()->json('data.summary');
        $this->assertEquals(525000, $summary['school_income']);
        $this->assertEquals(140000, $summary['total_expenses']);
        $this->assertEquals(385000, $summary['net_profit']);

        // A grade filter narrows the table, but profit stays school-wide
        $filtered = $this->getJson('/api/reports/annual-income?grade=two&academic_year=' . $this->year)->json('data.summary');
        $this->assertEquals(0, $filtered['total_income']);
        $this->assertEquals(385000, $filtered['net_profit']);

        $this->get('/api/reports/annual-income/pdf?academic_year=' . $this->year)
            ->assertOk()
            ->assertSee('قازانجی پاک')
            ->assertSee('385,000');
    }

    public function test_student_list_print_shows_name_grade_and_fixed_fee(): void
    {
        $this->student('1', 'First Student', 'one', 1300000);
        $this->student('2', 'Second Student', 'two', 1400000);

        $this->get('/api/reports/student-list/pdf')
            ->assertOk()
            ->assertSeeInOrder(['First Student', 'پۆلی یەکەم', '1,300,000', 'Second Student', 'پۆلی دووەم', '1,400,000'])
            ->assertSee('2,700,000');

        $this->get('/api/reports/student-list/pdf?grade=two')
            ->assertOk()
            ->assertSee('Second Student')
            ->assertDontSee('First Student');
    }

    public function test_clothes_and_book_report_prints_show_item_types(): void
    {
        $student = $this->student('1', 'Buyer');
        ClothesBookPayment::create([
            'student_id' => $student->id,
            'academic_year' => $this->year,
            'item_type' => 'clothes',
            'quantity' => 2,
            'items' => [['uniform_size' => 'بلوز', 'quantity' => 2]],
            'price' => 50000,
            'amount_paid' => 50000,
            'uniform_size' => 'بلوز (2 دانە)',
            'payment_date' => '2026-10-01',
        ]);
        ClothesBookPayment::create([
            'student_id' => $student->id,
            'academic_year' => $this->year,
            'item_type' => 'book',
            'quantity' => 1,
            'price' => 10000,
            'amount_paid' => 10000,
            'book_subject' => 'Kurdish',
            'payment_date' => '2026-10-01',
        ]);

        $this->get('/api/reports/clothes-payments/pdf')
            ->assertOk()
            ->assertSee('<span class="badge">بلوز × 2</span>', false);

        $this->get('/api/reports/book-payments/pdf')
            ->assertOk()
            ->assertSee('Kurdish');
    }

    public function test_bulk_book_receipt_can_be_edited(): void
    {
        $student = $this->student('1', 'Reader');
        foreach (['kurdish', 'math'] as $subject) {
            Inventory::create([
                'item_type' => 'book',
                'name' => 'Book: ' . $subject,
                'code' => "book_{$subject}_one",
                'quantity' => 5,
                'total_quantity' => 5,
                'grade' => 'one',
            ]);
        }

        $id = $this->postJson('/api/clothes-books/bulk-books', [
            'student_id' => $student->id,
            'price' => 30000,
        ])->assertCreated()->json('data.0.id');

        $this->putJson("/api/clothes-books/{$id}", [
            'amount_paid' => 35000,
            'price' => 35000,
            'book_subject' => 'سەرجەم کتێبەکان',
            'payment_date' => '2026-10-10',
            'notes' => 'edited',
        ])->assertOk()
            ->assertJsonPath('data.notes', 'edited');

        $this->assertEquals(35000, (float) ClothesBookPayment::find($id)->amount_paid);
        // Stock is taken once for the receipt, not again on edit
        $this->assertSame(4, Inventory::where('code', 'book_kurdish_one')->value('quantity'));
        $this->assertSame(4, Inventory::where('code', 'book_math_one')->value('quantity'));
    }
}

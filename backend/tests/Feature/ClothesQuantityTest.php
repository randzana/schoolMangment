<?php

namespace Tests\Feature;

use App\Models\ClothesBookPayment;
use App\Models\Inventory;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClothesQuantityTest extends TestCase
{
    use RefreshDatabase;

    private Student $student;

    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::create([
            'name' => 'Tester',
            'username' => 'tester',
            'password' => bcrypt('secret123'),
            'role' => 'admin',
            'is_active' => true,
        ]));

        $this->student = Student::create([
            'serial_number' => 'S-001',
            'full_name' => 'Test Student',
            'grade' => 'one',
            'is_active' => true,
        ]);

        Inventory::create([
            'item_type' => 'clothes',
            'name' => 'Uniform Size M',
            'code' => 'uniform_m',
            'quantity' => 10,
            'price' => 25000,
        ]);
    }

    private function sell(array $overrides = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/clothes-books', array_merge([
            'student_id' => $this->student->id,
            'item_type' => 'clothes',
            'price' => 75000,
            'amount_paid' => 75000,
            'uniform_size' => 'M',
            'quantity' => 3,
        ], $overrides));
    }

    public function test_selling_multiple_pieces_removes_that_many_from_stock(): void
    {
        $this->sell()->assertCreated()->assertJsonPath('data.quantity', 3);

        $this->assertSame(7, Inventory::where('code', 'uniform_m')->value('quantity'));
    }

    public function test_quantity_defaults_to_one_when_omitted(): void
    {
        $this->sell(['quantity' => null])->assertCreated()->assertJsonPath('data.quantity', 1);

        $this->assertSame(9, Inventory::where('code', 'uniform_m')->value('quantity'));
    }

    public function test_sale_is_rejected_when_stock_is_short(): void
    {
        $this->sell(['quantity' => 11])
            ->assertStatus(422)
            ->assertJsonValidationErrors('uniform_size');

        $this->assertSame(10, Inventory::where('code', 'uniform_m')->value('quantity'));
        $this->assertSame(0, ClothesBookPayment::count());
    }

    public function test_quantity_must_be_at_least_one(): void
    {
        $this->sell(['quantity' => 0])->assertStatus(422)->assertJsonValidationErrors('quantity');
    }

    public function test_editing_the_quantity_rebalances_stock(): void
    {
        $id = $this->sell(['quantity' => 3])->json('data.id');
        $this->assertSame(7, Inventory::where('code', 'uniform_m')->value('quantity'));

        $this->putJson("/api/clothes-books/{$id}", ['quantity' => 5])
            ->assertOk()
            ->assertJsonPath('data.quantity', 5);

        $this->assertSame(5, Inventory::where('code', 'uniform_m')->value('quantity'));
    }

    public function test_editing_other_fields_leaves_stock_untouched(): void
    {
        $id = $this->sell(['quantity' => 3])->json('data.id');

        $this->putJson("/api/clothes-books/{$id}", ['amount_paid' => 80000])->assertOk();

        $this->assertSame(7, Inventory::where('code', 'uniform_m')->value('quantity'));
    }

    public function test_deleting_a_sale_returns_every_piece_to_stock(): void
    {
        $id = $this->sell(['quantity' => 4])->json('data.id');
        $this->assertSame(6, Inventory::where('code', 'uniform_m')->value('quantity'));

        $this->deleteJson("/api/clothes-books/{$id}")->assertOk();

        $this->assertSame(10, Inventory::where('code', 'uniform_m')->value('quantity'));
    }

    public function test_bulk_books_purchase_still_round_trips_through_stock(): void
    {
        Inventory::create(['item_type' => 'book', 'name' => 'Book: Kurdish', 'code' => 'book_kurdish_one', 'quantity' => 5, 'grade' => 'one']);
        Inventory::create(['item_type' => 'book', 'name' => 'Book: Math', 'code' => 'book_math_one', 'quantity' => 5, 'grade' => 'one']);

        $id = $this->postJson('/api/clothes-books/bulk-books', [
            'student_id' => $this->student->id,
            'price' => 50000,
        ])->assertCreated()->json('data.0.id');

        $this->assertSame(4, Inventory::where('code', 'book_kurdish_one')->value('quantity'));
        $this->assertSame(4, Inventory::where('code', 'book_math_one')->value('quantity'));

        $this->deleteJson("/api/clothes-books/{$id}")->assertOk();

        $this->assertSame(5, Inventory::where('code', 'book_kurdish_one')->value('quantity'));
        $this->assertSame(5, Inventory::where('code', 'book_math_one')->value('quantity'));
    }

    public function test_invoice_lists_the_clothes_type_and_quantity(): void
    {
        $id = $this->sell(['quantity' => 3])->json('data.id');

        $this->get("/api/clothes-books/{$id}/invoice")
            ->assertOk()
            ->assertSee('جۆری جلوبەرگ:', false)
            ->assertSee('3 دانە', false);
    }

    public function test_selling_multiple_clothes_types_in_one_payment(): void
    {
        Inventory::create([
            'item_type' => 'clothes',
            'name' => 'Uniform Size L',
            'code' => 'uniform_l',
            'quantity' => 15,
            'price' => 30000,
        ]);

        $response = $this->postJson('/api/clothes-books', [
            'student_id' => $this->student->id,
            'item_type' => 'clothes',
            'price' => 110000,
            'amount_paid' => 110000,
            'items' => [
                ['uniform_size' => 'M', 'quantity' => 2],
                ['uniform_size' => 'L', 'quantity' => 2],
            ],
        ])->assertCreated();

        $id = $response->json('data.id');
        $this->assertSame(4, $response->json('data.quantity'));
        $this->assertSame(8, Inventory::where('code', 'uniform_m')->value('quantity'));
        $this->assertSame(13, Inventory::where('code', 'uniform_l')->value('quantity'));

        // Check invoice shows both types side by side
        $this->get("/api/clothes-books/{$id}/invoice")
            ->assertOk()
            ->assertSee('جۆری جلوبەرگ:', false)
            ->assertSee('M', false)
            ->assertSee('L', false)
            ->assertSee('2 دانە', false);

        // Deleting multi-item returns stock for both
        $this->deleteJson("/api/clothes-books/{$id}")->assertOk();
        $this->assertSame(10, Inventory::where('code', 'uniform_m')->value('quantity'));
        $this->assertSame(15, Inventory::where('code', 'uniform_l')->value('quantity'));
    }

    public function test_updating_multi_item_clothes_sale_rebalances_stock(): void
    {
        Inventory::create([
            'item_type' => 'clothes',
            'name' => 'Uniform Size L',
            'code' => 'uniform_l',
            'quantity' => 10,
            'price' => 30000,
        ]);

        $id = $this->postJson('/api/clothes-books', [
            'student_id' => $this->student->id,
            'item_type' => 'clothes',
            'price' => 100000,
            'amount_paid' => 100000,
            'items' => [
                ['uniform_size' => 'M', 'quantity' => 2],
                ['uniform_size' => 'L', 'quantity' => 3],
            ],
        ])->assertCreated()->json('data.id');

        $this->assertSame(8, Inventory::where('code', 'uniform_m')->value('quantity'));
        $this->assertSame(7, Inventory::where('code', 'uniform_l')->value('quantity'));

        // Update items: 1 M and 1 L
        $this->putJson("/api/clothes-books/{$id}", [
            'items' => [
                ['uniform_size' => 'M', 'quantity' => 1],
                ['uniform_size' => 'L', 'quantity' => 1],
            ],
        ])->assertOk()->assertJsonPath('data.quantity', 2);

        $this->assertSame(9, Inventory::where('code', 'uniform_m')->value('quantity'));
        $this->assertSame(9, Inventory::where('code', 'uniform_l')->value('quantity'));
    }
}

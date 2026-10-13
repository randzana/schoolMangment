<?php

namespace Tests\Feature;

use App\Models\Inventory;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryStockTest extends TestCase
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
    }

    private function createUniform(int $quantity = 10): Inventory
    {
        $this->postJson('/api/inventory', [
            'item_type' => 'clothes',
            'name' => 'Uniform Size M',
            'quantity' => $quantity,
            'price' => 25000,
        ])->assertCreated();

        return Inventory::where('code', 'uniform_m')->firstOrFail();
    }

    private function sell(int $quantity): void
    {
        $this->postJson('/api/clothes-books', [
            'student_id' => $this->student->id,
            'item_type' => 'clothes',
            'price' => 25000 * $quantity,
            'amount_paid' => 25000 * $quantity,
            'uniform_size' => 'M',
            'quantity' => $quantity,
        ])->assertCreated();
    }

    public function test_new_item_starts_with_fixed_count_equal_to_stock(): void
    {
        $item = $this->createUniform(10);

        $this->assertSame(10, $item->total_quantity);
        $this->assertSame(10, $item->quantity);
    }

    public function test_sales_lower_remaining_but_keep_fixed_count(): void
    {
        $item = $this->createUniform(10);

        $this->sell(3);

        $item->refresh();
        $this->assertSame(10, $item->total_quantity);
        $this->assertSame(7, $item->quantity);
    }

    public function test_adding_stock_raises_fixed_count_and_remaining(): void
    {
        $item = $this->createUniform(10);
        $this->sell(3);

        $this->putJson("/api/inventory/{$item->id}", ['add_quantity' => 5])
            ->assertOk()
            ->assertJsonPath('data.total_quantity', 15)
            ->assertJsonPath('data.quantity', 12);
    }

    public function test_editing_fixed_count_keeps_sold_count(): void
    {
        $item = $this->createUniform(10);
        $this->sell(3);

        $this->putJson("/api/inventory/{$item->id}", ['total_quantity' => 20, 'price' => 30000])
            ->assertOk()
            ->assertJsonPath('data.total_quantity', 20)
            ->assertJsonPath('data.quantity', 17);

        $this->assertEquals(30000, (float) $item->fresh()->price);
    }

    public function test_fixed_count_cannot_drop_below_sold(): void
    {
        $item = $this->createUniform(10);
        $this->sell(3);

        $this->putJson("/api/inventory/{$item->id}", ['total_quantity' => 2])
            ->assertStatus(422)
            ->assertJsonValidationErrors('total_quantity');

        $item->refresh();
        $this->assertSame(10, $item->total_quantity);
        $this->assertSame(7, $item->quantity);
    }

    public function test_inventory_print_lists_every_item_with_counts(): void
    {
        $this->createUniform(10);
        $this->sell(3);
        Inventory::create([
            'item_type' => 'book',
            'name' => 'Book: Kurdish',
            'code' => 'book_kurdish_one',
            'quantity' => 40,
            'total_quantity' => 40,
            'grade' => 'one',
        ]);

        $this->get('/api/inventory/print')
            ->assertOk()
            ->assertSee('ڕاپۆرتی کاڵاکانی کۆگا')
            ->assertSee('M')
            ->assertSee('Kurdish')
            ->assertSee('پۆلی یەکەم')
            ->assertSee('7 دانە');
    }
}

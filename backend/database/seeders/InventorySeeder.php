<?php

namespace Database\Seeders;

use App\Models\Inventory;
use Illuminate\Database\Seeder;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        // Uniform sizes
        $sizes = ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40'];
        foreach ($sizes as $size) {
            Inventory::updateOrCreate(
                ['code' => 'uniform_' . strtolower($size)],
                [
                    'item_type' => 'clothes',
                    'name' => 'Uniform Size ' . $size,
                    'quantity' => 100, // default stock count
                ]
            );
        }

        // Books
        $subjects = ['Kurdish', 'Mathematics', 'English', 'Science', 'Art', 'Computer Science', 'Social Studies'];
        foreach ($subjects as $subj) {
            Inventory::updateOrCreate(
                ['code' => 'book_' . strtolower(str_replace(' ', '_', $subj))],
                [
                    'item_type' => 'book',
                    'name' => 'Book: ' . $subj,
                    'quantity' => 150, // default stock count
                ]
            );
        }
    }
}

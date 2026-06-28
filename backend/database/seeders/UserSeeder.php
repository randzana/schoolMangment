<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'password' => 'admin123',
            'role' => 'admin',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Staff User',
            'username' => 'user1',
            'password' => 'user123',
            'role' => 'user',
            'is_active' => true,
        ]);
    }
}

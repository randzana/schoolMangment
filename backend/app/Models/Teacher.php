<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Teacher extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'full_name',
        'subject',
        'phone',
        'address',
        'monthly_salary',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'monthly_salary' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function salaryExpenses(): HasMany
    {
        return $this->hasMany(SalaryExpense::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where('full_name', 'ILIKE', "%{$search}%");
    }
}

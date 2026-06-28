<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FoodPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'academic_year',
        'monthly_price',
        'discount',
        'total_paid',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'monthly_price' => 'decimal:2',
            'discount' => 'decimal:2',
            'price_after_discount' => 'decimal:2',
            'total_paid' => 'decimal:2',
            'remain_balance' => 'decimal:2',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function installments(): HasMany
    {
        return $this->hasMany(FoodInstallment::class);
    }

    public function scopeCurrentYear($query)
    {
        return $query->where('academic_year', config('school.academic_year', '2025-2026'));
    }

    public function scopeByGrade($query, string $grade)
    {
        return $query->whereHas('student', fn ($q) => $q->where('grade', $grade));
    }

    public function scopeSearch($query, string $search)
    {
        return $query->whereHas('student', fn ($q) => $q->search($search));
    }
}

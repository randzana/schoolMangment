<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'serial_number',
        'full_name',
        'grade',
        'phone',
        'address',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // Grade mapping for display
    public const GRADE_MAP = [
        'one'   => 'Grade 1',
        'two'   => 'Grade 2',
        'three' => 'Grade 3',
        'four'  => 'Grade 4',
        'five'  => 'Grade 5',
        'six'   => 'Grade 6',
        'seven' => 'Grade 7',
        'eight' => 'Grade 8',
        'nine'  => 'Grade 9',
    ];

    /**
     * When a student is soft-deleted, also delete their
     * annual study and food payment records.
     */
    protected static function booted(): void
    {
        static::deleting(function (Student $student) {
            // Delete annual payment records for this student
            $student->studyPayments()->delete();
            $student->foodPayments()->delete();
        });
    }

    public function getGradeDisplayAttribute(): string
    {
        return self::GRADE_MAP[$this->grade] ?? $this->grade;
    }

    public function studyPayments(): HasMany
    {
        return $this->hasMany(StudyPayment::class);
    }

    public function foodPayments(): HasMany
    {
        return $this->hasMany(FoodPayment::class);
    }

    public function studyInstallments(): HasMany
    {
        return $this->hasMany(StudyInstallment::class);
    }

    public function foodInstallments(): HasMany
    {
        return $this->hasMany(FoodInstallment::class);
    }

    public function clothesBookPayments(): HasMany
    {
        return $this->hasMany(ClothesBookPayment::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByGrade($query, string $grade)
    {
        return $query->where('grade', $grade);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('full_name', 'ILIKE', "%{$search}%")
              ->orWhere('serial_number', 'ILIKE', "%{$search}%");
        });
    }
}


<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasFactory, SoftDeletes;

    /** Food bills have their own report, so the general expense report leaves them out. */
    public const FOOD_CATEGORY = 'ڕاپۆرتی خەرجی نانخواردن';

    protected $fillable = [
        'title',
        'amount',
        'expense_date',
        'category',
        'description',
        'receipt_no',
        'items',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date',
            'items' => 'array',
        ];
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeByDateRange($query, ?string $from, ?string $to)
    {
        if ($from) {
            $query->where('expense_date', '>=', $from);
        }
        if ($to) {
            $query->where('expense_date', '<=', $to);
        }
        return $query;
    }

    public function scopeByCategory($query, ?string $category)
    {
        if ($category) {
            $query->where('category', $category);
        }
        return $query;
    }

    public function scopeByMonth($query, $month)
    {
        if ($month) {
            $query->whereMonth('expense_date', (int) $month);
        }
        return $query;
    }

    public function scopeFood($query)
    {
        return $query->where('category', self::FOOD_CATEGORY);
    }

    public function scopeExceptFood($query)
    {
        return $query->where(fn ($q) => $q->whereNull('category')->orWhere('category', '!=', self::FOOD_CATEGORY));
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'amount',
        'expense_date',
        'category',
        'description',
        'receipt_no',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date',
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
}

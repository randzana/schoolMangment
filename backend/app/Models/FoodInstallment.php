<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FoodInstallment extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_no',
        'food_payment_id',
        'student_id',
        'payment_date',
        'amount_paid',
        'remain_before',
        'remain_after',
        'notes',
        'is_returned',
        'returned_at',
        'returned_by',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'payment_date' => 'date',
            'amount_paid' => 'decimal:2',
            'remain_before' => 'decimal:2',
            'remain_after' => 'decimal:2',
            'is_returned' => 'boolean',
            'returned_at' => 'datetime',
            'invoice_no' => 'integer',
        ];
    }

    public function foodPayment(): BelongsTo
    {
        return $this->belongsTo(FoodPayment::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function returnedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'returned_by');
    }

    public function scopeNotReturned($query)
    {
        return $query->where('is_returned', false);
    }

    public function scopeReturned($query)
    {
        return $query->where('is_returned', true);
    }

    public function scopeByDateRange($query, ?string $from, ?string $to)
    {
        if ($from) {
            $query->where('payment_date', '>=', $from);
        }
        if ($to) {
            $query->where('payment_date', '<=', $to);
        }
        return $query;
    }
}

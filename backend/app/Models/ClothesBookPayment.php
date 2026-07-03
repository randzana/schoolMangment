<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClothesBookPayment extends Model
{
    use HasFactory;

    protected $table = 'clothes_books_payments';

    protected $fillable = [
        'student_id',
        'academic_year',
        'item_type',
        'price',
        'discount',
        'amount_paid',
        'payment_date',
        'notes',
        'invoice_no',
        'created_by',
        'uniform_size',
        'book_subject',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'discount' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'payment_date' => 'date',
            'invoice_no' => 'integer',
        ];
    }

    public const ITEM_TYPES = ['clothes', 'book', 'both'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

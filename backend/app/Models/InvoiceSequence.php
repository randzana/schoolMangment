<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceSequence extends Model
{
    protected $table = 'invoice_sequence';

    protected $fillable = ['last_invoice_no'];

    public $timestamps = false;
}

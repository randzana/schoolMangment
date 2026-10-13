<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Marks a purchase that covers every book of the student's grade. */
    private const ALL_BOOKS_LABEL = 'سەرجەم کتێبەکان';

    /**
     * `total_quantity` is the fixed count of everything ever put into stock.
     * Sales only lower `quantity` (what is left), so sold = total - quantity.
     */
    public function up(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            $table->integer('total_quantity')->default(0)->after('quantity');
        });

        // Existing rows only know what is left, so rebuild the fixed count
        // from what is left plus everything already sold.
        $inventories = DB::table('inventories')->get();
        $sold = array_fill_keys($inventories->pluck('id')->all(), 0);

        DB::table('clothes_books_payments')
            ->leftJoin('students', 'students.id', '=', 'clothes_books_payments.student_id')
            ->select('clothes_books_payments.*', 'students.grade as student_grade')
            ->orderBy('clothes_books_payments.id')
            ->chunk(500, function ($payments) use ($inventories, &$sold) {
                foreach ($payments as $payment) {
                    $qty = max(1, (int) ($payment->quantity ?? 1));

                    if (in_array($payment->item_type, ['clothes', 'both'])) {
                        $items = json_decode($payment->items ?? '', true);
                        if (is_array($items) && count($items) > 0) {
                            foreach ($items as $item) {
                                $row = $this->uniformRow($inventories, (string) ($item['uniform_size'] ?? ''));
                                if ($row) {
                                    $sold[$row->id] += max(1, (int) ($item['quantity'] ?? 1));
                                }
                            }
                        } elseif (!empty($payment->uniform_size)) {
                            $row = $this->uniformRow($inventories, $payment->uniform_size);
                            if ($row) {
                                $sold[$row->id] += $qty;
                            }
                        }
                    }

                    if (in_array($payment->item_type, ['book', 'both']) && !empty($payment->book_subject)) {
                        foreach ($this->bookRows($inventories, $payment->book_subject, $payment->student_grade) as $row) {
                            $sold[$row->id] += $qty;
                        }
                    }
                }
            });

        foreach ($inventories as $inventory) {
            DB::table('inventories')
                ->where('id', $inventory->id)
                ->update(['total_quantity' => (int) $inventory->quantity + $sold[$inventory->id]]);
        }
    }

    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            $table->dropColumn('total_quantity');
        });
    }

    /**
     * Same lookup as ClothesBookController::uniformInventory().
     */
    private function uniformRow(Collection $inventories, string $uniformType): ?object
    {
        $clean = strtolower(trim($uniformType));

        return $inventories->first(fn ($row) => $row->code === 'uniform_' . $clean
            || $row->name === 'Uniform Size ' . trim($uniformType)
            || $row->name === trim($uniformType));
    }

    /**
     * Same lookup as ClothesBookController::bookInventories().
     */
    private function bookRows(Collection $inventories, string $bookSubject, ?string $grade): Collection
    {
        $grade = $grade ? strtolower($grade) : null;

        if ($bookSubject === self::ALL_BOOKS_LABEL) {
            return $grade
                ? $inventories->where('item_type', 'book')->where('grade', $grade)->values()
                : collect();
        }

        $subjectClean = strtolower(str_replace(' ', '_', $bookSubject));
        $row = $grade ? $inventories->firstWhere('code', 'book_' . $subjectClean . '_' . $grade) : null;
        $row ??= $inventories->firstWhere('code', 'book_' . $subjectClean);

        return collect($row ? [$row] : []);
    }
};

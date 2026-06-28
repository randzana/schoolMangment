<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Study Installments Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #1A202C; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { font-size: 16px; color: #1E3A5F; }
        .header p { font-size: 11px; color: #718096; }
        .meta { margin-bottom: 15px; }
        .meta span { display: inline-block; margin-right: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1E3A5F; color: white; padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; }
        td { padding: 5px 8px; border-bottom: 1px solid #E2E8F0; }
        tr:nth-child(even) { background: #F5F7FA; }
        .total-row { background: #FFF3CD !important; font-weight: bold; }
        .returned { color: #C0392B; text-decoration: line-through; }
    </style>
</head>
<body>
<div class="header">
    <h1>{{ $school_name }}</h1>
    <p>Study Installments Report — {{ $date_range }}</p>
</div>

<div class="meta">
    <span><strong>Total Records:</strong> {{ $installments->count() }}</span>
    <span><strong>Total Amount:</strong> {{ number_format($total, 0) }} IQD</span>
</div>

<table>
    <thead>
        <tr>
            <th>Invoice No</th>
            <th>Date</th>
            <th>Student Name</th>
            <th>Grade</th>
            <th>Amount Paid</th>
            <th>Remaining After</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody>
        @foreach($installments as $inst)
        <tr class="{{ $inst->is_returned ? 'returned' : '' }}">
            <td>#{{ $inst->invoice_no }}</td>
            <td>{{ $inst->payment_date->format('d/m/Y') }}</td>
            <td>{{ $inst->student->full_name }}</td>
            <td>{{ $inst->student->grade_display }}</td>
            <td>{{ number_format($inst->amount_paid, 0) }} IQD</td>
            <td>{{ number_format($inst->remain_after, 0) }} IQD</td>
            <td>{{ $inst->is_returned ? 'Returned' : 'Active' }}</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr class="total-row">
            <td colspan="4">Total</td>
            <td>{{ number_format($total, 0) }} IQD</td>
            <td colspan="2"></td>
        </tr>
    </tfoot>
</table>
</body>
</html>

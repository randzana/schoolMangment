@extends('reports.layout')

@section('title', $title)

@section('header_meta')
    <div>بۆ ماوەی: <strong>{{ $date_range }}</strong></div>
@endsection

@section('meta')
    <div class="meta-item"><strong>کۆی فرۆشتنەکان:</strong> {{ $payments->count() }}</div>
    @if(isset($grade_label) && $grade_label)
        <div class="meta-item"><strong>پۆل:</strong> {{ $grade_label }}</div>
    @endif
    <div class="meta-item"><strong>کۆی دانە فرۆشراوەکان:</strong> {{ number_format($payments->sum(fn ($p) => max(1, (int) $p->quantity))) }} دانە</div>
    <div class="meta-item"><strong>کۆی داهات:</strong> <span class="amount">{{ number_format($total, 0) }} د.ع</span></div>
@endsection

@section('content')
    <table>
        <thead>
            <tr>
                <th>ژمارەی پسوولە</th>
                <th>بەروار</th>
                <th>ناوی قوتابی</th>
                <th>پۆل</th>
                <th>جۆری جلوبەرگ</th>
                <th>دانە</th>
                <th>بڕی دراو</th>
                <th>تێبینی</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payments as $pay)
            <tr>
                <td style="font-family: monospace;">#{{ $pay->invoice_no }}</td>
                <td>{{ $pay->payment_date?->format('d/m/Y') ?? 'N/A' }}</td>
                <td style="font-weight: 500;">{{ $pay->student?->full_name ?? 'قوتابی سڕاوەتەوە' }}</td>
                <td>{{ $pay->student?->grade_display ?? 'N/A' }}</td>
                <td>
                    @if(!empty($pay->items) && is_array($pay->items))
                        @foreach($pay->items as $item)
                            <span class="badge">{{ $item['uniform_size'] ?? '' }}@if(($item['quantity'] ?? 1) > 1) × {{ $item['quantity'] }}@endif</span>
                        @endforeach
                    @elseif(!empty($pay->uniform_size))
                        <span class="badge">{{ $pay->uniform_size }}</span>
                    @else
                        -
                    @endif
                </td>
                <td class="amount">{{ max(1, (int) $pay->quantity) }}</td>
                <td class="amount">{{ number_format($pay->amount_paid, 0) }} د.ع</td>
                <td>{{ $pay->notes ?: '-' }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="5">کۆی گشتی</td>
                <td class="amount">{{ number_format($payments->sum(fn ($p) => max(1, (int) $p->quantity))) }}</td>
                <td class="amount" style="color: #047857;">{{ number_format($total, 0) }} د.ع</td>
                <td></td>
            </tr>
        </tfoot>
    </table>
@endsection

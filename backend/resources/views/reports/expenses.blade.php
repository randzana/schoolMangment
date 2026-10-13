@extends('reports.layout')

@section('title', $title)

@push('styles')
    table.grouped tbody tr { background: transparent; }
    table.grouped tbody tr.alt { background: #F8FAFC; }
    table.grouped tr.group-start td { border-top: 1px solid #CBD5E1; }
    .description { display: block; margin-top: 3px; font-size: 9px; color: #64748B; font-weight: 400; }
@endpush

@section('header_meta')
    <div>بۆ ماوەی: <strong>{{ $date_range }}</strong></div>
@endsection

@section('meta')
    <div class="meta-item"><strong>جۆری فلتەر:</strong> {{ $category }}</div>
    <div class="meta-item"><strong>ژمارەی پسوولەکان:</strong> {{ $expenses->count() }}</div>
    <div class="meta-item"><strong>کۆی خەرجکراو:</strong> <span class="amount text-danger">{{ number_format($total, 0) }} د.ع</span></div>
@endsection

@section('content')
    @if($expenses->isEmpty())
        <div class="empty">هیچ خەرجییەک بۆ ئەم فلتەرە نییە</div>
    @else
        <table class="grouped">
            <thead>
                <tr>
                    <th style="width: 30px;">#</th>
                    <th style="width: 80px;">بەروار</th>
                    <th>جۆر / پۆلێن</th>
                    <th>ناوی پسوولە</th>
                    <th style="width: 90px;">مانگ</th>
                    <th style="width: 110px;">بڕ</th>
                </tr>
            </thead>
            <tbody>
                @foreach($expenses as $index => $exp)
                    @php
                        $lines = (!empty($exp->items) && is_array($exp->items) && count($exp->items) > 0)
                            ? $exp->items
                            : [['name' => $exp->title, 'amount' => $exp->amount]];
                        $span = count($lines);
                    @endphp
                    {{-- No rowspan: merged cells make a long receipt one unbreakable block,
                         which pushes it to the next page and leaves the current one blank. --}}
                    @foreach($lines as $lineIndex => $line)
                        <tr class="{{ $index % 2 === 1 ? 'alt' : '' }} {{ $lineIndex === 0 ? 'group-start' : '' }}">
                            @if($lineIndex === 0)
                                <td class="num">{{ $index + 1 }}</td>
                                <td>{{ $exp->expense_date?->format('d/m/Y') ?? '-' }}</td>
                                <td>
                                    <span class="badge">{{ $exp->category ?: '-' }}</span>
                                    @if($exp->description)
                                        <span class="description">{{ $exp->description }}</span>
                                    @endif
                                </td>
                            @else
                                <td></td>
                                <td></td>
                                <td></td>
                            @endif
                            <td style="font-weight: 500;">{{ $line['name'] ?? '-' }}</td>
                            <td>{{ !empty($line['month']) ? $line['month'] : '-' }}</td>
                            <td class="amount text-danger">{{ number_format((float) ($line['amount'] ?? 0), 0) }} د.ع</td>
                        </tr>
                    @endforeach
                    @if($span > 1)
                        <tr class="{{ $index % 2 === 1 ? 'alt' : '' }}">
                            <td colspan="5" style="text-align: left; font-size: 10px; color: #64748B;">کۆی پسوولە</td>
                            <td class="amount text-danger" style="font-weight: 700;">{{ number_format($exp->amount, 0) }} د.ع</td>
                        </tr>
                    @endif
                @endforeach
            </tbody>
            <tfoot>
                <tr class="total-row">
                    <td colspan="5">کۆی گشتی خەرجییەکان</td>
                    <td class="amount text-danger">{{ number_format($total, 0) }} د.ع</td>
                </tr>
            </tfoot>
        </table>

        @if(isset($by_category) && count($by_category) > 1)
            <div class="section-title">کورتەی خەرجییەکان بەپێی جۆر</div>
            <table>
                <thead>
                    <tr>
                        <th>جۆر / پۆلێن</th>
                        <th>ژمارەی پسوولە</th>
                        <th>کۆی خەرجکراو</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($by_category as $row)
                        <tr>
                            <td><span class="badge">{{ $row['category'] }}</span></td>
                            <td class="amount">{{ $row['count'] }}</td>
                            <td class="amount text-danger">{{ number_format($row['total'], 0) }} د.ع</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif
    @endif
@endsection

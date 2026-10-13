@extends('reports.layout')

@section('title', 'ڕاپۆرتی کاڵاکانی کۆگا')

@section('meta')
    <div class="meta-item"><strong>جۆرەکانی جلوبەرگ:</strong> {{ count($clothes) }}</div>
    <div class="meta-item"><strong>کتێبەکان:</strong> {{ count($books) }}</div>
    <div class="meta-item"><strong>کۆی ماوە لە کۆگا:</strong> {{ number_format($clothes->sum('quantity') + $books->sum('quantity')) }} دانە</div>
@endsection

@section('content')
    @foreach([['title' => 'جلوبەرگی قوتابخانە', 'rows' => $clothes, 'is_clothes' => true], ['title' => 'کتێبەکانی وانەکان', 'rows' => $books, 'is_clothes' => false]] as $group)
        <div class="section-title">{{ $group['title'] }}</div>
        @if(count($group['rows']) === 0)
            <div class="empty">هیچ کاڵایەک تۆمار نەکراوە</div>
        @else
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>ناوی کاڵا</th>
                        @if($group['is_clothes'])
                            <th>نرخی فرۆشتن</th>
                        @else
                            <th>پۆل</th>
                        @endif
                        <th>ژمارەی جێگیر</th>
                        <th>فرۆشراو</th>
                        <th>ماوە لە کۆگا</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($group['rows'] as $index => $row)
                        <tr>
                            <td class="num">{{ $index + 1 }}</td>
                            <td><span class="badge">{{ $row['name'] }}</span></td>
                            @if($group['is_clothes'])
                                <td class="amount">{{ number_format($row['price'], 0) }} د.ع</td>
                            @else
                                <td>{{ $row['grade_label'] ?? '-' }}</td>
                            @endif
                            <td class="amount text-primary">{{ number_format($row['total_quantity']) }}</td>
                            <td class="amount text-success">{{ number_format($row['sold_quantity']) }}</td>
                            <td>
                                <span class="badge {{ $row['quantity'] === 0 ? 'badge-danger' : ($row['quantity'] <= 10 ? 'badge-warning' : 'badge-success') }}">
                                    {{ number_format($row['quantity']) }} دانە
                                </span>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="3">کۆی گشتی</td>
                        <td class="amount">{{ number_format($group['rows']->sum('total_quantity')) }}</td>
                        <td class="amount">{{ number_format($group['rows']->sum('sold_quantity')) }}</td>
                        <td><span class="amount">{{ number_format($group['rows']->sum('quantity')) }}</span> دانە</td>
                    </tr>
                </tfoot>
            </table>
        @endif
    @endforeach
@endsection

@extends('reports.layout')

@section('title', $title)

@section('header_meta')
    <div>ساڵی خوێندن: <strong>{{ $academic_year }}</strong></div>
    @if($month_label)
        <div>مانگی نانخواردن: <strong>{{ $month_label }}</strong></div>
    @endif
@endsection

@section('meta')
    <div class="meta-item"><strong>ژمارەی قوتابییان:</strong> {{ $summary['count'] }}</div>
    <div class="meta-item"><strong>پۆل:</strong> {{ $grade_label ?? 'هەموو پۆلەکان' }}</div>
    @if($type !== 'clothes')
        <div class="meta-item"><strong>نانخواردنیان نەداوە:</strong> {{ $summary['food_unpaid_count'] }}</div>
    @endif
    @if($type !== 'food')
        <div class="meta-item"><strong>جلوبەرگیان نەداوە:</strong> {{ $summary['clothes_unpaid_count'] }}</div>
    @endif
@endsection

@section('content')
    @if(count($records) === 0)
        <div class="empty">هەموو قوتابییەکان پارەیان داوە</div>
    @else
        <table>
            <thead>
                <tr>
                    <th style="width: 36px;">#</th>
                    <th style="width: 70px;">سێریال</th>
                    <th>ناوی قوتابی</th>
                    <th>پۆل</th>
                    @if($type !== 'clothes')
                        <th>پارەی نانخواردن</th>
                    @endif
                    @if($type !== 'food')
                        <th>پارەی جلوبەرگ</th>
                    @endif
                </tr>
            </thead>
            <tbody>
                @foreach($records as $index => $rec)
                <tr>
                    <td class="num">{{ $index + 1 }}</td>
                    <td style="font-family: monospace;">#{{ $rec['serial_number'] }}</td>
                    <td style="font-weight: 500;">{{ $rec['full_name'] }}</td>
                    <td>{{ $rec['grade_label'] }}</td>
                    @if($type !== 'clothes')
                        <td>
                            @if($rec['food_unpaid'])
                                <span class="badge badge-danger">نەدراوە</span>
                            @else
                                <span class="badge badge-success">{{ number_format($rec['food_paid'], 0) }} دینار</span>
                            @endif
                        </td>
                    @endif
                    @if($type !== 'food')
                        <td>
                            @if($rec['clothes_unpaid'])
                                <span class="badge badge-danger">نەدراوە</span>
                            @else
                                <span class="badge badge-success">{{ number_format($rec['clothes_paid'], 0) }} دینار</span>
                            @endif
                        </td>
                    @endif
                </tr>
                @endforeach
            </tbody>
        </table>
    @endif
@endsection

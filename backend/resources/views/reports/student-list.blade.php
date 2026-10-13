@extends('reports.layout')

@section('title', 'لیستی قوتابییان')

@section('header_meta')
    <div>ساڵی خوێندن: <strong>{{ $academic_year }}</strong></div>
@endsection

@section('meta')
    <div class="meta-item"><strong>ژمارەی قوتابییان:</strong> {{ count($records) }}</div>
    <div class="meta-item"><strong>پۆل:</strong> {{ $grade_label ?? 'هەموو پۆلەکان' }}</div>
    <div class="meta-item"><strong>کۆی پارەی جێگیر:</strong> <span class="amount">{{ number_format($total_fee, 0) }} دینار</span></div>
@endsection

@section('content')
    @if(count($records) === 0)
        <div class="empty">هیچ قوتابییەک نییە</div>
    @else
        <table>
            <thead>
                <tr>
                    <th style="width: 36px;">#</th>
                    <th style="width: 70px;">سێریال</th>
                    <th>ناوی قوتابی</th>
                    <th>پۆل</th>
                    <th>پارەی جێگیر</th>
                </tr>
            </thead>
            <tbody>
                @foreach($records as $index => $rec)
                <tr>
                    <td class="num">{{ $index + 1 }}</td>
                    <td style="font-family: monospace;">#{{ $rec['serial_number'] }}</td>
                    <td style="font-weight: 500;">{{ $rec['full_name'] }}</td>
                    <td>{{ $rec['grade_label'] }}</td>
                    <td class="amount text-primary">{{ number_format($rec['fixed_fee'], 0) }} دینار</td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr class="total-row">
                    <td colspan="4">کۆی گشتی</td>
                    <td class="amount">{{ number_format($total_fee, 0) }} دینار</td>
                </tr>
            </tfoot>
        </table>
    @endif
@endsection

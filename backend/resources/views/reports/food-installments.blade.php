<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
    <meta charset="utf-8">
    <title>ڕاپۆرتی مانگانەی نانخواردن</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
        
        @page { size: A4 portrait; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Noto Sans Arabic', 'Tahoma', 'Arial', sans-serif; 
            font-size: 11px; 
            color: #1A202C; 
            padding: 15mm;
            background-color: #F8FAFC;
        }
        .report-wrapper {
            max-width: 900px;
            margin: 0 auto;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        /* Header style matching invoice */
        .header-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #1E3A5F;
            padding: 15px 20px 10px 20px;
            margin-bottom: 10px;
        }
        
        .school-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .logo {
            height: 50px;
            width: 50px;
            object-fit: contain;
        }
        
        .school-names {
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .school-name-ar {
            font-size: 14px;
            font-weight: 700;
            color: #1E3A5F;
            line-height: 1.2;
        }
        
        .school-name-en {
            font-size: 10px;
            font-weight: 500;
            color: #64748B;
            margin-top: 1px;
        }
        
        .title-badge {
            background-color: #1E3A5F;
            color: #FFFFFF;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-align: center;
        }
        
        .invoice-meta {
            text-align: left;
            font-size: 10px;
            color: #475569;
            line-height: 1.4;
        }
        .meta {
            padding: 12px 20px;
            background: #F1F5F9;
            border-bottom: 1px solid #E2E8F0;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
        }
        .meta-item { font-size: 11px; }
        .meta-item strong { color: #1E3A5F; }
        table { width: 100%; border-collapse: collapse; }
        th { 
            background: #1E3A5F; 
            color: white; 
            padding: 8px 12px; 
            text-align: right; 
            font-size: 10px; 
            font-weight: 700;
        }
        td { 
            padding: 7px 12px; 
            border-bottom: 1px solid #F1F5F9; 
            font-size: 11px;
        }
        tr:nth-child(even) { background: #F8FAFC; }
        tr:hover { background: #EDF2F7; }
        .total-row { 
            background: #FEF3C7 !important; 
            font-weight: 700;
        }
        .total-row td { border-top: 2px solid #D97706; }
        .returned { color: #DC2626; text-decoration: line-through; opacity: 0.7; }
        .status-active { 
            background: #D1FAE5; color: #065F46; 
            padding: 2px 8px; border-radius: 50px; font-size: 9px; font-weight: 700;
        }
        .status-returned { 
            background: #FEE2E2; color: #991B1B; 
            padding: 2px 8px; border-radius: 50px; font-size: 9px; font-weight: 700;
        }
        .footer {
            padding: 15px 20px;
            border-top: 2px solid #1E3A5F;
            text-align: center;
            font-size: 10px;
            color: #64748B;
            background: #F8FAFC;
        }
        .amount { font-family: monospace; font-weight: 600; }
 
        @media print {
            body { background: white; padding: 8mm 10mm; }
            .report-wrapper { border: 1px solid #CBD5E1; box-shadow: none; max-width: 100%; border-radius: 8px; }
            .no-print { display: none; }
            tr:hover { background: inherit; }
        }
    </style>
</head>
<body>
 
<div class="report-wrapper">
    <div class="header-container">
        <div class="school-info">
            <img src="{{ asset('logo.jpg') }}" alt="Logo" class="logo" onerror="this.src='/logo.jpg';">
            <div class="school-names">
                <span class="school-name-ar">قوتابخانەی نەوەی دواڕۆژی بنەڕەتی ناحکومی</span>
                <span class="school-name-en">{{ $school_name }}</span>
            </div>
        </div>
        
        <div>
            <div class="title-badge">
                ڕاپۆرتی وەرگرتنی مانگانەی نانخواردن
            </div>
        </div>
        
        <div class="invoice-meta">
            <div>بۆ ماوەی: <strong>{{ $date_range }}</strong></div>
            <div>ڕێکەوت: <strong><span id="print-date"></span></strong></div>
        </div>
    </div>
 
    <div class="meta">
        <div class="meta-item"><strong>کۆی تۆمارەکان:</strong> {{ $installments->count() }}</div>
        @if(isset($grade_label) && $grade_label)
            <div class="meta-item"><strong>پۆل:</strong> {{ $grade_label }}</div>
        @endif
        <div class="meta-item"><strong>کۆی گشتی بڕی وەرگیراو:</strong> <span class="amount">{{ number_format($total, 0) }} دینار</span></div>
    </div>
 
    <table>
        <thead>
            <tr>
                <th>ژمارەی پسوولە</th>
                <th>بەروار</th>
                <th>ناوی قوتابی</th>
                <th>پۆل</th>
                <th>بڕی دراو</th>
                <th>بارودۆخ</th>
            </tr>
        </thead>
        <tbody>
            @foreach($installments as $inst)
            <tr class="{{ $inst->is_returned ? 'returned' : '' }}">
                <td style="font-family: monospace;">#{{ $inst->invoice_no }}</td>
                <td>{{ $inst->payment_date->format('d/m/Y') }}</td>
                <td>{{ $inst->student?->full_name ?? 'قوتابی سڕاوەتەوە' }}</td>
                <td>{{ $inst->student?->grade_display ?? 'N/A' }}</td>
                <td class="amount">{{ number_format($inst->amount_paid, 0) }} دینار</td>
                <td>
                    @if($inst->is_returned)
                        <span class="status-returned">گەڕاوەتەوە</span>
                    @else
                        <span class="status-active">چالاک</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="4">کۆی گشتی</td>
                <td class="amount">{{ number_format($total, 0) }} دینار</td>
                <td></td>
            </tr>
        </tfoot>
    </table>
 
    <div class="footer">
        سیستەمی بەڕێوەبردنی دارایی — {{ $school_name }} — <span id="print-datetime"></span>
    </div>
</div>
 
<script>
    (function() {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        
        const dateStr = dd + '/' + mm + '/' + yyyy;
        const dateTimeStr = dateStr + ' ' + hh + ':' + min;
        
        document.getElementById('print-date').textContent = dateStr;
        document.getElementById('print-datetime').textContent = dateTimeStr;
        
        window.onload = function() { window.print(); };
    })();
</script>
 
</body>
</html>

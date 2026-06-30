<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
    <meta charset="utf-8">
    <title>ڕاپۆرتی داهاتی ساڵانە</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
        
        @page { size: A4 portrait; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Noto Sans Arabic', 'Tahoma', 'Arial', sans-serif; 
            font-size: 10px; 
            color: #1A202C; 
            padding: 15px;
            background-color: #F8FAFC;
        }
        .report-wrapper {
            max-width: 100%;
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
            padding: 10px 20px;
            background: #F1F5F9;
            border-bottom: 1px solid #E2E8F0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        .meta-item { font-size: 10px; }
        .meta-item strong { color: #1E3A5F; }
        
        table { width: 100%; border-collapse: collapse; }
        th { 
            background: #1E3A5F; 
            color: white; 
            padding: 6px 8px; 
            text-align: right; 
            font-size: 9px; 
            font-weight: 700;
            border: 1px solid #1E3A5F;
        }
        td { 
            padding: 6px 8px; 
            border: 1px solid #E2E8F0; 
            font-size: 10px;
        }
        tr:nth-child(even) { background: #F8FAFC; }
        tr:hover { background: #EDF2F7; }
        
        .total-row { 
            background: #FEF3C7 !important; 
            font-weight: 700;
        }
        .total-row td { 
            border-top: 2px solid #D97706; 
            border-bottom: 2px solid #D97706;
        }
        .footer {
            padding: 12px 20px;
            border-top: 2px solid #1E3A5F;
            text-align: center;
            font-size: 9px;
            color: #64748B;
            background: #F8FAFC;
        }
        .amount { font-family: monospace; font-weight: 600; }
 
        @media print {
            body { background: white; padding: 0; }
            .report-wrapper { border: none; box-shadow: none; max-width: 100%; border-radius: 0; }
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
                ڕاپۆرتی داهاتی گشتی ساڵانە — ساڵی خوێندن {{ $academic_year }}
            </div>
        </div>
        
        <div class="invoice-meta">
            @if(isset($grade_label) && $grade_label)
                <div>پۆل: <strong>{{ $grade_label }}</strong></div>
            @endif
            <div>ڕێکەوت: <strong>{{ now()->format('d/m/Y') }}</strong></div>
        </div>
    </div>
 
    <div class="meta">
        <div class="meta-item"><strong>ژمارەی قوتابییان:</strong> {{ count($records) }}</div>
        <div class="meta-item"><strong>داهاتی خوێندن:</strong> <span class="amount">{{ number_format($total_study, 0) }} د.ع</span></div>
        <div class="meta-item"><strong>داهاتی نانخواردن:</strong> <span class="amount">{{ number_format($total_food, 0) }} د.ع</span></div>
        <div class="meta-item"><strong>داهاتی جلوبەرگ:</strong> <span class="amount">{{ number_format($total_clothes, 0) }} د.ع</span></div>
        <div class="meta-item"><strong>داهاتی کتێب:</strong> <span class="amount">{{ number_format($total_books, 0) }} د.ع</span></div>
        <div class="meta-item" style="font-size: 11px; color: #059669;"><strong>کۆی گشتی داهات:</strong> <span class="amount" style="font-weight: 700;">{{ number_format($total_income, 0) }} د.ع</span></div>
    </div>
 
    <table>
        <thead>
            <tr>
                <th>ناوی قوتابی</th>
                <th>پۆل</th>
                <th>دراوی خوێندن</th>
                <th>دراوی نان</th>
                <th>دراوی جلوبەرگ</th>
                <th>دراوی کتێب</th>
                <th>کۆی گشتی دراو</th>
            </tr>
        </thead>
        <tbody>
            @foreach($records as $rec)
            <tr>
                <td style="font-weight: 500;">{{ $rec['full_name'] }}</td>
                <td>{{ $rec['grade_display'] }}</td>
                <td class="amount">{{ number_format($rec['study_paid'], 0) }}</td>
                <td class="amount">{{ number_format($rec['food_paid'], 0) }}</td>
                <td class="amount">{{ number_format($rec['clothes_paid'], 0) }}</td>
                <td class="amount">{{ number_format($rec['books_paid'], 0) }}</td>
                <td class="amount" style="font-weight: 700; color: #1E3A5F;">{{ number_format($rec['grand_total_paid'], 0) }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="2">کۆی گشتی</td>
                <td class="amount">{{ number_format($total_study, 0) }}</td>
                <td class="amount">{{ number_format($total_food, 0) }}</td>
                <td class="amount">{{ number_format($total_clothes, 0) }}</td>
                <td class="amount">{{ number_format($total_books, 0) }}</td>
                <td class="amount" style="color: #047857;">{{ number_format($total_income, 0) }} د.ع</td>
            </tr>
        </tfoot>
    </table>
 
    <div class="footer">
        سیستەمی بەڕێوەبردنی دارایی — {{ $school_name }} — {{ now()->format('d/m/Y H:i') }}
    </div>
</div>
 
<script>
    window.onload = function() { window.print(); };
</script>
 
</body>
</html>

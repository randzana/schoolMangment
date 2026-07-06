<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
    <meta charset="utf-8">
    <title>ڕاپۆرتی خەرجییەکان</title>
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
            <img src="/logo.jpg" alt="Logo" class="logo" onerror="this.src='/logo.jpg';">
            <div class="school-names">
                <span class="school-name-ar">قوتابخانەی نەوەی دواڕۆژی بنەڕەتی ناحکومی</span>
                <span class="school-name-en">{{ $school_name }}</span>
            </div>
        </div>
        
        <div>
            <div class="title-badge">
                {{ $title }}
            </div>
        </div>
        
        <div class="invoice-meta">
            <div>بۆ ماوەی: <strong>{{ $date_range }}</strong></div>
            <div>ڕێکەوت: <strong>{{ now()->format('d/m/Y') }}</strong></div>
        </div>
    </div>
 
    <div class="meta">
        <div class="meta-item"><strong>جۆری فلتەر:</strong> {{ $category }}</div>
        <div class="meta-item"><strong>ژمارەی وەسڵەکان:</strong> {{ $expenses->count() }}</div>
        <div class="meta-item"><strong>کۆی خەرجکراو:</strong> <span class="amount">{{ number_format($total, 0) }} د.ع</span></div>
    </div>
 
    <table>
        <thead>
            <tr>
                <th>بابەت</th>
                <th>بڕ</th>
                <th>جۆر / پۆلێن</th>
                <th>بەروار</th>
                <th>تێبینی / وەسف</th>
            </tr>
        </thead>
        <tbody>
            @foreach($expenses as $exp)
            <tr>
                <td style="font-weight: 500;">
                    <div>{{ $exp->title }}</div>
                    @if($exp->items && is_array($exp->items) && count($exp->items) > 0)
                        <div style="font-size: 9px; color: #475569; margin-top: 4px; padding-right: 10px; border-right: 2px solid #E2E8F0; text-align: right;">
                            @foreach($exp->items as $item)
                                <div style="margin-bottom: 2px;">
                                    • {{ $item['name'] ?? '' }} 
                                    @if(!empty($item['month'])) [{{ $item['month'] }}] @endif
                                    : <strong style="color: #DC2626; font-family: monospace;">{{ number_format($item['amount'] ?? 0, 0) }} د.ع</strong>
                                </div>
                            @endforeach
                        </div>
                    @endif
                </td>
                <td class="amount" style="color: #DC2626;">{{ number_format($exp->amount, 0) }} د.ع</td>
                <td>{{ $exp->category ?: '-' }}</td>
                <td>{{ $exp->expense_date?->format('d/m/Y') ?? 'N/A' }}</td>
                <td>{{ $exp->description ?: '-' }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="1">کۆی گشتی</td>
                <td class="amount" style="color: #DC2626;">{{ number_format($total, 0) }} د.ع</td>
                <td colspan="3"></td>
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

<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
    <meta charset="utf-8">
    <title>پسوولەی ژمارە #{{ $invoice_no }}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;700&display=swap');
        
        @page { 
            size: A5 landscape; 
            margin: 5mm 6mm; 
        }
        
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: 'Noto Sans Arabic', 'Tahoma', 'Arial', sans-serif; 
            font-size: 11px; 
            color: #1E293B; 
            background-color: #FFFFFF;
            padding: 2px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .invoice-wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            border: 1px solid #CBD5E1;
            border-radius: 8px;
            padding: 10px 12px;
            background: #FFFFFF;
            overflow: hidden;
        }
        
        /* Header style */
        .header-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #1E3A5F;
            padding-bottom: 8px;
            margin-bottom: 12px;
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
        
        .meta-no {
            font-size: 12px;
            font-weight: 700;
            color: #D97706;
            font-family: monospace;
        }
        
        /* Simplified 2x2 Grid Layout */
        .content-grid {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 12px;
        }
        
        .grid-row {
            display: flex;
            gap: 12px;
            width: 100%;
        }
        
        .grid-cell {
            flex: 1;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 8px 12px;
            background-color: #F8FAFC;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .cell-label {
            font-size: 9px;
            font-weight: 500;
            color: #64748B;
            margin-bottom: 2px;
        }
        
        .cell-value {
            font-size: 12px;
            font-weight: 700;
            color: #0F172A;
        }
        
        /* Highlighting for payments */
        .highlight-paid {
            background-color: #FEF3C7; /* amber-100 */
            border-color: #FCD34D;
        }
        .highlight-paid .cell-label {
            color: #B45309;
        }
        .highlight-paid .cell-value {
            color: #92400E;
            font-size: 14px;
        }
        
        .highlight-remain {
            background-color: #FEE2E2; /* red-100 */
            border-color: #FCA5A5;
        }
        .highlight-remain .cell-label {
            color: #B91C1C;
        }
        .highlight-remain .cell-value {
            color: #991B1B;
            font-size: 14px;
        }
        
        /* Signatures and Footer */
        .footer-section {
            margin-top: 10px;
        }
        
        .signature-grid {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
            padding: 0 10px;
        }
        
        .signature-box {
            text-align: center;
            width: 40%;
        }
        
        .sig-title {
            font-weight: 700;
            color: #475569;
            font-size: 10px;
            margin-bottom: 20px;
        }
        
        .sig-line {
            border-top: 1px dashed #94A3B8;
            padding-top: 2px;
            font-size: 9px;
            color: #64748B;
        }
        
        .footer-note {
            text-align: center;
            font-size: 8px;
            color: #94A3B8;
            margin-top: 8px;
            border-top: 1px solid #F1F5F9;
            padding-top: 4px;
        }
        
        /* Returned stamp */
        .returned-stamp {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-15deg);
            font-size: 32px;
            color: rgba(239, 68, 68, 0.25);
            font-weight: 700;
            border: 3px double rgba(239, 68, 68, 0.25);
            padding: 6px 16px;
            border-radius: 6px;
            z-index: 100;
            pointer-events: none;
            text-align: center;
        }
        
        /* Print optimization */
        @media print {
            body { 
                background: #FFFFFF !important; 
                padding: 0 !important;
                margin: 0 !important;
            }
            .invoice-wrapper {
                border: 1px solid #94A3B8 !important;
                box-shadow: none !important;
                border-radius: 6px !important;
            }
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>
<body>

<div class="invoice-wrapper">
    @if($is_returned)
        <div class="returned-stamp">پوچەڵکراوە / گەڕاوە</div>
    @endif

    <div class="invoice-container">
        <!-- Header -->
        <div class="header-container">
            <div class="school-info">
                <img src="{{ asset('logo.jpg') }}" alt="Logo" class="logo" onerror="this.src='/logo.jpg';">
                <div class="school-names">
                    <span class="school-name-ar">قوتابخانەی نەوەی دواڕۆژی بنەڕەتی ناحکومی</span>
                    <span class="school-name-en">{{ $school_name }}</span>
                </div>
            </div>
            
            <div>
                <div class="title-badge">پسوولەی وەرگرتنی پارە</div>
            </div>
            
            <div class="invoice-meta">
                <div>ژمارەی پسوولە: <span class="meta-no">#{{ $invoice_no }}</span></div>
                <div>بەروار: <strong>{{ $date }}</strong></div>
            </div>
        </div>

        <!-- 2x2 Grid Content -->
        <div class="content-grid">
            <!-- Row 1: Student Name & Notes -->
            <div class="grid-row">
                <div class="grid-cell">
                    <span class="cell-label">ناوی سیانی قوتابی:</span>
                    <span class="cell-value">{{ $student_name }}</span>
                </div>
                <div class="grid-cell">
                    <span class="cell-label">تێبینی:</span>
                    <span class="cell-value">{{ $notes ?: 'نییە' }}</span>
                </div>
            </div>
            
            <!-- Row 2: Amount Paid & Remaining Balance -->
            <div class="grid-row">
                <div class="grid-cell highlight-paid">
                    <span class="cell-label">بڕی پارەی دراو:</span>
                    <span class="cell-value">{{ number_format($amount_paid, 0) }} د.ع</span>
                </div>
                <div class="grid-cell highlight-remain">
                    <span class="cell-label">بڕی پارەی ماوە (قەرز):</span>
                    <span class="cell-value">{{ number_format($remain_after, 0) }} د.ع</span>
                </div>
            </div>
        </div>

        <!-- Footer Signatures -->
        <div class="footer-section">
            <div class="signature-grid">
                <div class="signature-box">
                    <p class="sig-title">وەرگر / ژمێریار</p>
                    <div class="sig-line">واژۆ و مۆر</div>
                </div>
                <div class="signature-box">
                    <p class="sig-title">بەخێوکەری قوتابی</p>
                    <div class="sig-line">واژۆ</div>
                </div>
            </div>
            
            <p class="footer-note">سیستەمی بەڕێوەبردنی دارایی قوتابخانە • Private F.G. Basic School</p>
        </div>
    </div>
</div>

<script>
    // Automatically trigger print dialog on page load only if not loaded inside an iframe
    window.onload = function() {
        if (window.self === window.top) {
            window.print();
        }
    };
</script>

</body>
</html>

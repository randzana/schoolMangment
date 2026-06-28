<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
    <meta charset="utf-8">
    <title>پسوولەی ژمارە #{{ $invoice_no }}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
        
        @page { size: A5 portrait; margin: 8mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Noto Sans Arabic', 'Tahoma', 'Arial', sans-serif; 
            font-size: 12px; 
            color: #1A202C; 
            padding: 15px;
            background-color: #F8FAFC;
        }
        .invoice-wrapper {
            position: relative;
            max-width: 420px;
            margin: 0 auto;
            background: #FFFFFF;
            border: 2px solid #1E3A5F;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header { 
            background: #1E3A5F; 
            color: white; 
            text-align: center; 
            padding: 20px; 
        }
        .header h1 { 
            font-size: 20px; 
            margin-bottom: 5px; 
            font-weight: 700;
        }
        .header p { 
            font-size: 11px; 
            opacity: 0.9; 
            letter-spacing: 0.5px;
        }
        .section-header { 
            background: #F1F5F9; 
            padding: 8px 15px; 
            font-weight: 700; 
            color: #1E3A5F; 
            border-bottom: 1px solid #E2E8F0; 
            font-size: 11px; 
        }
        .row { 
            display: table; 
            width: 100%; 
            border-bottom: 1px solid #F1F5F9; 
        }
        .row .cell { 
            display: table-cell; 
            padding: 10px 15px; 
            vertical-align: middle; 
        }
        .row .label { 
            font-weight: 700; 
            color: #475569; 
            width: 45%; 
        }
        .row .value { 
            text-align: left; 
            width: 55%; 
            font-weight: 600;
        }
        .divider { 
            border-bottom: 2px dashed #E2E8F0; 
            margin: 5px 0;
        }
        .amount-row .value { 
            font-size: 14px; 
            font-weight: 700; 
            color: #1E3A5F; 
        }
        .total-row { 
            background: #FEF3C7; 
        }
        .total-row .value { 
            font-size: 16px; 
            font-weight: 700; 
            color: #D97706; 
        }
        .remain-row .value { 
            color: #DC2626; 
            font-weight: 700; 
        }
        .footer { 
            padding: 20px; 
            border-top: 2px solid #1E3A5F; 
            background: #F8FAFC;
        }
        .footer-grid { 
            display: table; 
            width: 100%; 
            margin-top: 10px;
        }
        .footer-grid .col { 
            display: table-cell; 
            width: 50%; 
            vertical-align: top; 
            text-align: center;
        }
        .signature-line {
            margin-top: 35px;
            border-top: 1px dashed #94A3B8;
            display: inline-block;
            width: 70%;
            padding-top: 5px;
            font-size: 11px;
            color: #64748B;
        }
        .footer-note { 
            text-align: center; 
            margin-top: 15px; 
            font-size: 10px; 
            color: #64748B; 
            font-style: italic; 
        }
        .returned-stamp { 
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%) rotate(-25deg); 
            font-size: 40px; 
            color: rgba(220, 38, 38, 0.25); 
            font-weight: 700; 
            border: 4px double rgba(220, 38, 38, 0.25); 
            padding: 10px 20px;
            border-radius: 8px;
            text-transform: uppercase; 
            z-index: 10; 
            pointer-events: none;
        }

        /* Print optimization styles */
        @media print {
            body { 
                background: #ffffff !important; 
                padding: 0 !important;
                margin: 0 !important;
            }
            .invoice-wrapper {
                border: none !important;
                box-shadow: none !important;
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 !important;
                border-radius: 0 !important;
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

    <div class="invoice">
        <div class="header">
            <h1>{{ $school_name }}</h1>
            <p>پسوولەی فەرمی وەرگرتنی پارە</p>
        </div>

        <div class="section-header">زانیارییەکانی پسوولە</div>
        
        <div class="row">
            <div class="cell label">ژمارەی پسوولە:</div>
            <div class="cell value" style="font-family: monospace;">#{{ $invoice_no }}</div>
        </div>
        <div class="row">
            <div class="cell label">بەرواری دران:</div>
            <div class="cell value">{{ $date }}</div>
        </div>
        <div class="row">
            <div class="cell label">جۆری پارەدان:</div>
            <div class="cell value">
                @if($invoice_type === 'Study Payment')
                    قستی خوێندن
                @elseif($invoice_type === 'Food Payment')
                    قستی نانخواردن
                @else
                    جل و کتێب
                @endif
            </div>
        </div>

        <div class="section-header">زانیاریی قوتابی</div>
        
        <div class="row">
            <div class="cell label">ناوی سیانی قوتابی:</div>
            <div class="cell value">{{ $student_name }}</div>
        </div>
        <div class="row">
            <div class="cell label">پۆل / قۆناغ:</div>
            <div class="cell value">{{ $grade }}</div>
        </div>
        <div class="row">
            <div class="cell label">ژمارەی ناسنامە (سێریال):</div>
            <div class="cell value" style="font-family: monospace;">{{ $serial_no }}</div>
        </div>

        <div class="section-header">وردەکاری دارایی (بە دینار)</div>
        
        <div class="row">
            <div class="cell label">
                @if(str_contains($fee_label, 'Annual'))
                    کرێی ساڵانە:
                @elseif(str_contains($fee_label, 'Monthly'))
                    نرخی مانگانە:
                @else
                    نرخی بابەت:
                @endif
            </div>
            <div class="cell value">{{ number_format($annual_fee, 0) }} دینار</div>
        </div>
        <div class="row">
            <div class="cell label">داشکاندنی پێشکەشکراو:</div>
            <div class="cell value" style="color: #DC2626;">-{{ number_format($discount, 0) }} دینار</div>
        </div>
        <div class="row">
            <div class="cell label">کۆی گشتی دوای داشکاندن:</div>
            <div class="cell value">{{ number_format($fee_after_discount, 0) }} دینار</div>
        </div>

        <div class="divider"></div>

        <div class="row">
            <div class="cell label">قەرزی پێشوو:</div>
            <div class="cell value">{{ number_format($remain_before, 0) }} دینار</div>
        </div>
        <div class="row amount-row total-row">
            <div class="cell label">بڕی دراو لەم قستەدا:</div>
            <div class="cell value">{{ number_format($amount_paid, 0) }} دینار</div>
        </div>
        <div class="row remain-row">
            <div class="cell label">ماوەی قەرز (قەرزی کۆتایی):</div>
            <div class="cell value">{{ number_format($remain_after, 0) }} دینار</div>
        </div>

        <div class="footer">
            <div class="footer-grid">
                <div class="col">
                    <p>وەرگر / ژمێریار</p>
                    <div class="signature-line">واژۆ و مۆر</div>
                </div>
                <div class="col">
                    <p>بەخێوکەری قوتابی</p>
                    <div class="signature-line">واژۆ</div>
                </div>
            </div>
            
            <p class="footer-note">سیستەمی بەڕێوەبردنی دارایی قوتابخانەی بنەڕەتی ئەهلی F.G</p>
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

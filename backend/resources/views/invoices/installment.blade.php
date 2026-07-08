<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $invoice_no }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 12px; color: #1A202C; padding: 30px; }
        .invoice { border: 2px solid #1E3A5F; max-width: 500px; margin: 0 auto; }
        .header { background: #1E3A5F; color: white; text-align: center; padding: 15px; }
        .header h1 { font-size: 18px; margin-bottom: 3px; }
        .header p { font-size: 11px; opacity: 0.9; }
        .row { display: table; width: 100%; border-bottom: 1px solid #E2E8F0; }
        .row .cell { display: table-cell; padding: 8px 15px; vertical-align: middle; }
        .row .label { font-weight: bold; color: #4A5568; width: 50%; }
        .row .value { text-align: right; width: 50%; }
        .section-header { background: #F5F7FA; padding: 8px 15px; font-weight: bold; color: #1E3A5F; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        .divider { border-bottom: 2px dashed #E2E8F0; }
        .amount-row .value { font-size: 14px; font-weight: bold; color: #1E3A5F; }
        .total-row { background: #FFF3CD; }
        .total-row .value { font-size: 16px; font-weight: bold; color: #E8A838; }
        .remain-row .value { color: #C0392B; font-weight: bold; }
        .footer { padding: 15px; border-top: 2px solid #1E3A5F; }
        .footer-grid { display: table; width: 100%; }
        .footer-grid .col { display: table-cell; width: 50%; vertical-align: top; }
        .footer-note { text-align: center; margin-top: 10px; font-size: 9px; color: #718096; font-style: italic; }
        .returned-stamp { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 48px; color: rgba(192, 57, 43, 0.3); font-weight: bold; text-transform: uppercase; letter-spacing: 5px; z-index: 10; }
        .invoice-wrapper { position: relative; }
    </style>
</head>
<body>
<div class="invoice-wrapper">
    @if($is_returned)
        <div class="returned-stamp">RETURNED</div>
    @endif

    <div class="invoice">
        <div class="header">
            <h1>{{ $school_name }}</h1>
            <p>School Administration System</p>
        </div>

        <div class="section-header">Invoice Details</div>
        <div class="row">
            <div class="cell label">Invoice No:</div>
            <div class="cell value">#{{ $invoice_no }}</div>
        </div>
        @if(stripos($invoice_type, 'food') === false)
        <div class="row">
            <div class="cell label">Date:</div>
            <div class="cell value">{{ $date }}</div>
        </div>
        @endif
        <div class="row">
            <div class="cell label">Invoice Type:</div>
            <div class="cell value">{{ $invoice_type }}</div>
        </div>

        <div class="section-header">Student Information</div>
        <div class="row">
            <div class="cell label">Student Name:</div>
            <div class="cell value">{{ $student_name }}</div>
        </div>
        <div class="row">
            <div class="cell label">Grade:</div>
            <div class="cell value">{{ $grade }}</div>
        </div>
        <div class="row">
            <div class="cell label">Serial No:</div>
            <div class="cell value">{{ $serial_no }}</div>
        </div>

        <div class="section-header">Payment Details</div>
        <div class="row">
            <div class="cell label">{{ $fee_label }}:</div>
            <div class="cell value">{{ number_format($annual_fee, 0) }} IQD</div>
        </div>
        <div class="row">
            <div class="cell label">Discount Applied:</div>
            <div class="cell value">-{{ number_format($discount, 0) }} IQD</div>
        </div>
        <div class="row">
            <div class="cell label">Fee After Discount:</div>
            <div class="cell value">{{ number_format($fee_after_discount, 0) }} IQD</div>
        </div>

        <div class="divider"></div>

        <div class="row">
            <div class="cell label">Previous Balance:</div>
            <div class="cell value">{{ number_format($remain_before, 0) }} IQD</div>
        </div>
        <div class="row amount-row total-row">
            <div class="cell label">Amount Paid This Time:</div>
            <div class="cell value">{{ number_format($amount_paid, 0) }} IQD</div>
        </div>
        <div class="row" style="background: #FFFBEB; border-bottom: 1px solid #FCD34D;">
            <div class="cell label" style="color: #92400E; font-size: 11px;">Amount in Words:</div>
            <div class="cell value" style="color: #92400E; font-size: 11px; font-style: italic;">{{ \App\Helpers\NumberToWords::toEnglish($amount_paid) }} Dinars</div>
        </div>
        <div class="row remain-row">
            <div class="cell label">Remaining Balance:</div>
            <div class="cell value">{{ number_format($remain_after, 0) }} IQD</div>
        </div>
        @if($remain_after > 0)
        <div class="row" style="background: #FEF2F2; border-bottom: 1px solid #FECACA;">
            <div class="cell label" style="color: #991B1B; font-size: 11px;">Remaining in Words:</div>
            <div class="cell value" style="color: #7F1D1D; font-size: 11px; font-style: italic;">{{ \App\Helpers\NumberToWords::toEnglish($remain_after) }} Dinars</div>
        </div>
        @endif

        <div class="footer">
            <div class="footer-grid">
                <div class="col">
                    <p>Received by: ______________</p>
                </div>
                <div class="col" style="text-align: right;">
                    <p>Seal: [&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]</p>
                </div>
            </div>
            <div class="footer-note">
                This receipt is valid proof of payment
            </div>
        </div>
    </div>
</div>
</body>
</html>

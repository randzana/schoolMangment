<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
    <meta charset="utf-8">
    <title>@yield('title')</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');

        @page { size: A4 portrait; margin: 0; }
        * {
            margin: 0; padding: 0; box-sizing: border-box;
            /* Keep backgrounds when printing, otherwise white header text disappears */
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
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
        .school-info { display: flex; align-items: center; gap: 10px; }
        .logo { height: 50px; width: 50px; object-fit: contain; }
        .school-names { display: flex; flex-direction: column; justify-content: center; }
        .school-name-ar { font-size: 14px; font-weight: 700; color: #1E3A5F; line-height: 1.2; }
        .school-name-en { font-size: 10px; font-weight: 500; color: #64748B; margin-top: 1px; }
        .title-badge {
            background-color: #1E3A5F;
            color: #FFFFFF;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-align: center;
        }
        .invoice-meta { text-align: left; font-size: 10px; color: #475569; line-height: 1.4; }
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
        .section-title {
            padding: 10px 20px 6px 20px;
            font-size: 12px;
            font-weight: 700;
            color: #1E3A5F;
        }
        table { width: 100%; border-collapse: collapse; }
        th {
            background: #1E3A5F;
            color: white;
            padding: 8px 12px;
            text-align: right;
            font-size: 10px;
            font-weight: 700;
        }
        td { padding: 7px 12px; border-bottom: 1px solid #F1F5F9; font-size: 11px; }
        tbody tr:nth-child(even) { background: #F8FAFC; }
        .total-row { background: #FEF3C7 !important; font-weight: 700; }
        .total-row td { border-top: 2px solid #D97706; }
        .footer {
            padding: 15px 20px;
            border-top: 2px solid #1E3A5F;
            text-align: center;
            font-size: 10px;
            color: #64748B;
            background: #F8FAFC;
        }
        .amount { font-family: monospace; font-weight: 600; white-space: nowrap; }
        .num { font-family: monospace; color: #64748B; }
        .text-success { color: #059669; }
        .text-danger { color: #DC2626; }
        .text-primary { color: #1E3A5F; }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            margin: 1px 0 1px 3px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            background: #E0E7FF;
            color: #1E3A5F;
            border: 1px solid #C7D2FE;
        }
        .badge-success { background: #D1FAE5; color: #065F46; border-color: #A7F3D0; }
        .badge-danger { background: #FEE2E2; color: #991B1B; border-color: #FECACA; }
        .badge-warning { background: #FEF3C7; color: #92400E; border-color: #FDE68A; }
        .empty { padding: 20px; text-align: center; color: #64748B; }
        @stack('styles')

        @media print {
            body { background: white; padding: 8mm 10mm; }
            .report-wrapper { border: 1px solid #CBD5E1; box-shadow: none; max-width: 100%; border-radius: 8px; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; }
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
            <div class="title-badge">@yield('title')</div>
        </div>

        <div class="invoice-meta">
            @yield('header_meta')
            <div>ڕێکەوت: <strong><span id="print-date"></span></strong></div>
        </div>
    </div>

    @hasSection('meta')
        <div class="meta">
            @yield('meta')
        </div>
    @endif

    @yield('content')

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

<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Quotation {{ $quotation->quotation_number }}</title>
    <style>
        @page {
            margin: 20px;
            padding: 0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #1C3047;
            background: #fff;
        }

        .container {
            padding: 10px;
        }

        /* Typography */
        .font-10 { font-size: 10px; }
        .font-12 { font-size: 12px; }
        .font-14 { font-size: 14px; }
        .font-18 { font-size: 18px; }
        .font-22 { font-size: 22px; }

        .font-regular { font-weight: 400; }
        .font-medium { font-weight: 500; }
        .font-semi-bold { font-weight: 600; }
        .font-bold { font-weight: 700; }

        .font-color { color: #1C3047; }
        .font-color-light { color: #a1a8b1; }
        .text-primary { color: #40AEAF; }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }

        .rtl { direction: rtl; text-align: right; }
        .ltr { direction: ltr; text-align: left; }

        /* Header */
        .header-table {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }

        .header-table td {
            vertical-align: middle;
            padding: 10px;
        }

        .quotation-title {
            font-size: 22px;
            font-weight: 700;
            color: #1C3047;
        }

        .quotation-title-ar {
            font-size: 18px;
            font-weight: 600;
            color: #1C3047;
            direction: rtl;
        }

        .logo-container {
            text-align: center;
        }

        .logo-container img {
            max-height: 60px;
            max-width: 180px;
        }

        .quotation-ref {
            font-size: 11px;
            color: #1C3047;
            margin-top: 5px;
        }

        /* Info Boxes */
        .info-section {
            width: 100%;
            margin-bottom: 15px;
            border-collapse: collapse;
        }

        .info-box {
            vertical-align: top;
            padding: 10px;
            width: 50%;
        }

        .info-box-header {
            font-size: 10px;
            font-weight: 600;
            color: #40AEAF;
            text-transform: uppercase;
            margin-bottom: 8px;
            border-bottom: 1px solid #D8DFE8;
            padding-bottom: 5px;
        }

        .info-content {
            font-size: 10px;
            line-height: 1.6;
        }

        .info-content p {
            margin-bottom: 2px;
        }

        .info-content .name {
            font-weight: 600;
            font-size: 11px;
        }

        /* Notice Banner */
        .notice-banner {
            background: #FFF9E6;
            border: 1px solid #F59E0B;
            border-radius: 4px;
            padding: 10px 15px;
            margin-bottom: 15px;
            text-align: center;
        }

        .notice-banner p {
            font-size: 10px;
            color: #92400e;
            margin: 0;
        }

        .notice-banner .ar {
            direction: rtl;
            margin-top: 5px;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        .items-table th {
            background: #40AEAF;
            color: #fff;
            padding: 8px 6px;
            text-align: left;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            border: 1px solid #40AEAF;
        }

        .items-table th.text-right {
            text-align: right;
        }

        .items-table th.text-center {
            text-align: center;
        }

        .items-table td {
            padding: 8px 6px;
            border: 1px solid #D8DFE8;
            vertical-align: top;
            font-size: 9px;
        }

        .items-table tr:nth-child(even) {
            background: #F9FAFB;
        }

        .product-image {
            width: 50px;
            height: 50px;
            object-fit: contain;
            border-radius: 4px;
        }

        .item-name {
            font-weight: 600;
            font-size: 10px;
            color: #1C3047;
        }

        .item-sku {
            font-size: 8px;
            color: #6b7280;
            margin-top: 2px;
        }

        /* Totals Section */
        .totals-section {
            width: 100%;
            margin-bottom: 15px;
        }

        .totals-table {
            width: 350px;
            float: right;
            border-collapse: collapse;
        }

        .totals-table tr {
            border-bottom: 1px solid #D8DFE8;
        }

        .totals-table tr:last-child {
            border-bottom: none;
        }

        .totals-table td {
            padding: 8px 10px;
            font-size: 10px;
        }

        .totals-table .label {
            color: #6b7280;
            width: 60%;
        }

        .totals-table .label-ar {
            direction: rtl;
            font-size: 9px;
            color: #a1a8b1;
        }

        .totals-table .value {
            text-align: right;
            font-weight: 500;
            width: 40%;
        }

        .totals-table .total-row {
            background: #40AEAF;
            color: #fff;
        }

        .totals-table .total-row td {
            padding: 10px;
        }

        .totals-table .total-row .label,
        .totals-table .total-row .label-ar {
            color: #fff;
            font-weight: 600;
            font-size: 11px;
        }

        .totals-table .total-row .value {
            font-size: 13px;
            font-weight: 700;
        }

        .discount-row {
            color: #059669;
        }

        .discount-row .value {
            color: #059669;
        }

        /* Terms Section */
        .terms-section {
            margin-bottom: 15px;
            clear: both;
        }

        .terms-header {
            font-size: 11px;
            font-weight: 600;
            color: #40AEAF;
            margin-bottom: 8px;
            border-bottom: 1px solid #D8DFE8;
            padding-bottom: 5px;
        }

        .terms-content {
            background: #F9FAFB;
            padding: 12px;
            border-radius: 4px;
            font-size: 9px;
            line-height: 1.6;
            color: #4b5563;
        }

        .terms-content ul {
            margin: 0;
            padding-left: 15px;
        }

        .terms-content li {
            margin-bottom: 4px;
        }

        /* Electrical Specs Section */
        .electrical-section {
            margin-top: 20px;
        }

        .electrical-header {
            font-size: 14px;
            font-weight: 600;
            color: #1C3047;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #40AEAF;
        }

        .electrical-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        .electrical-table th {
            background: #E5F3F3;
            color: #1C3047;
            padding: 8px 6px;
            text-align: left;
            font-size: 9px;
            font-weight: 600;
            border: 1px solid #D8DFE8;
        }

        .electrical-table td {
            padding: 6px;
            border: 1px solid #D8DFE8;
            font-size: 9px;
        }

        .electrical-summary {
            background: #E5F3F3;
            border: 1px solid #40AEAF;
            border-radius: 4px;
            padding: 12px;
            margin-top: 10px;
        }

        .electrical-summary p {
            font-size: 11px;
            color: #1C3047;
            margin-bottom: 5px;
        }

        .electrical-summary .total-amperes {
            font-size: 16px;
            font-weight: 700;
            color: #40AEAF;
        }

        .electrical-warning {
            background: #FEF3C7;
            border: 1px solid #F59E0B;
            border-radius: 4px;
            padding: 10px;
            margin-top: 10px;
        }

        .electrical-warning p {
            font-size: 9px;
            color: #92400e;
            margin: 0;
        }

        /* Missing Specs Section */
        .missing-specs {
            background: #FEE2E2;
            border: 1px solid #EF4444;
            border-radius: 4px;
            padding: 10px;
            margin-top: 15px;
        }

        .missing-specs-header {
            font-size: 10px;
            font-weight: 600;
            color: #991B1B;
            margin-bottom: 8px;
        }

        .missing-specs ul {
            margin: 0;
            padding-left: 15px;
            font-size: 9px;
            color: #7F1D1D;
        }

        /* Footer */
        .footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #D8DFE8;
        }

        .footer-contact {
            background: #F9FAFB;
            border-radius: 4px;
            padding: 12px;
            text-align: center;
        }

        .footer-contact .title {
            font-size: 11px;
            font-weight: 600;
            color: #1C3047;
            margin-bottom: 5px;
        }

        .footer-contact .title-ar {
            direction: rtl;
            font-size: 10px;
        }

        .footer-contact p {
            font-size: 9px;
            color: #6b7280;
            margin: 2px 0;
        }

        .page-break {
            page-break-before: always;
        }

        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <table class="header-table">
            <tr>
                <td style="width: 30%;">
                    <div class="quotation-title">Quotation</div>
                </td>
                <td style="width: 40%;" class="logo-container">
                    @if(!empty($company['logo']))
                        <img src="{{ $company['logo'] }}" alt="{{ $company['name'] }}">
                    @else
                        <div style="font-size: 20px; font-weight: bold; color: #40AEAF;">{{ $company['name'] }}</div>
                    @endif
                </td>
                <td style="width: 30%;" class="text-right">
                    <div class="quotation-title-ar">تسعيرة</div>
                </td>
            </tr>
        </table>

        <!-- Quotation Reference -->
        <table style="width: 100%; margin-bottom: 15px;">
            <tr>
                <td style="width: 50%;">
                    <div class="quotation-ref">
                        <strong>Quotation Ref:</strong> QET-{{ $quotation->quotation_number }}
                    </div>
                    <div class="quotation-ref">
                        <strong>Issue Date:</strong> {{ $quotation->quotation_date->format('m/d/Y') }}
                    </div>
                    @if($quotation->valid_until)
                        <div class="quotation-ref">
                            <strong>Valid Until:</strong> {{ $quotation->valid_until->format('m/d/Y') }}
                        </div>
                    @endif
                </td>
                <td style="width: 50%;" class="text-right rtl">
                    <div class="quotation-ref">
                        <strong>مرجع التسعيرة:</strong> QET-{{ $quotation->quotation_number }}
                    </div>
                    <div class="quotation-ref">
                        <strong>تاريخ اصدار التسعيرة:</strong> {{ $quotation->quotation_date->format('m/d/Y') }}
                    </div>
                    @if($quotation->valid_until)
                        <div class="quotation-ref">
                            <strong>صالحة حتى:</strong> {{ $quotation->valid_until->format('m/d/Y') }}
                        </div>
                    @endif
                </td>
            </tr>
        </table>

        <!-- Parties Section -->
        <table class="info-section">
            <tr>
                <td class="info-box" style="border: 1px solid #D8DFE8; border-radius: 4px;">
                    <div class="info-box-header">
                        Issued from / صادر من
                    </div>
                    <div class="info-content">
                        <p class="name">{{ $company['name'] }}</p>
                        @if($company['address'])
                            <p>{{ $company['address'] }}</p>
                        @endif
                        @if($company['vat_number'])
                            <p><strong>VAT No:</strong> {{ $company['vat_number'] }}</p>
                        @endif
                    </div>
                </td>
                <td style="width: 20px;"></td>
                <td class="info-box" style="border: 1px solid #D8DFE8; border-radius: 4px;">
                    <div class="info-box-header">
                        Issued to / صادر إلى
                    </div>
                    <div class="info-content">
                        <p class="name">{{ $quotation->client_contact_name ?? $quotation->client?->name }}</p>
                        @if($quotation->client?->company_name)
                            <p>{{ $quotation->client->company_name }}</p>
                        @endif
                        @if($quotation->client_contact_phone)
                            <p>{{ $quotation->client_contact_phone }}</p>
                        @endif
                        @if($quotation->client_contact_email)
                            <p>{{ $quotation->client_contact_email }}</p>
                        @endif
                        @if($quotation->customer_reference || $quotation->reference)
                            <p><strong>Ref:</strong> {{ $quotation->customer_reference ?? $quotation->reference }}</p>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        <!-- Notice Banner -->
        <div class="notice-banner">
            <p>This quotation won't reserve stock until you place an order and complete the checkout successfully</p>
            <p class="ar">لن يتم حجز المخزون حتى تقوم بتقديم طلب وإتمام عملية الدفع بنجاح</p>
        </div>

        <!-- Products Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 12%;">Ref<br><span class="rtl" style="font-weight: 400;">المرجع</span></th>
                    <th style="width: 8%;">Image<br><span class="rtl" style="font-weight: 400;">صورة</span></th>
                    <th style="width: 30%;">Name<br><span class="rtl" style="font-weight: 400;">الاسم</span></th>
                    <th style="width: 8%;" class="text-center">Qty<br><span class="rtl" style="font-weight: 400;">الكمية</span></th>
                    <th style="width: 14%;" class="text-right">Unit Price<br><span class="rtl" style="font-weight: 400;">سعر الوحدة</span></th>
                    <th style="width: 10%;" class="text-center">Disc %<br><span class="rtl" style="font-weight: 400;">خصم</span></th>
                    <th style="width: 18%;" class="text-right">Total<br><span class="rtl" style="font-weight: 400;">المجموع</span></th>
                </tr>
            </thead>
            <tbody>
                @foreach($quotation->items as $item)
                    <tr>
                        <td>{{ $item->item_code ?? '-' }}</td>
                        <td class="text-center">
                            @if($item->image_url)
                                <img src="{{ $item->image_url }}" class="product-image" alt="">
                            @else
                                <div style="width: 50px; height: 50px; background: #f3f4f6; border-radius: 4px;"></div>
                            @endif
                        </td>
                        <td>
                            <div class="item-name">{{ $item->name }}</div>
                            @if($item->item_code)
                                <div class="item-sku">SKU: {{ $item->item_code }}</div>
                            @endif
                        </td>
                        <td class="text-center">{{ number_format($item->quantity, 0) }}</td>
                        <td class="text-right">
                            {{ $quotation->currency }} {{ number_format($item->unit_price_excl_vat, 2) }}
                            <br><span style="font-size: 8px; color: #a1a8b1;">(Excl. VAT)</span>
                        </td>
                        <td class="text-center">
                            @if($item->discount_percentage > 0)
                                {{ number_format($item->discount_percentage, 0) }}%
                            @else
                                -
                            @endif
                        </td>
                        <td class="text-right">
                            {{ $quotation->currency }} {{ number_format($item->line_total_excl_vat, 2) }}
                            <br><span style="font-size: 8px; color: #a1a8b1;">(Excl. VAT)</span>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals Section -->
        <div class="totals-section clearfix">
            <table class="totals-table">
                <tr>
                    <td class="label">
                        Total (Excl. VAT)
                        <div class="label-ar">المجموع (بدون ضريبة)</div>
                    </td>
                    <td class="value">{{ $quotation->currency }} {{ number_format($quotation->subtotal, 2) }}</td>
                </tr>
                @if($quotation->discount_percentage > 0)
                    <tr class="discount-row">
                        <td class="label">
                            Discount ({{ number_format($quotation->discount_percentage, 0) }}%)
                            <div class="label-ar">الخصم</div>
                        </td>
                        <td class="value">- {{ $quotation->currency }} {{ number_format($quotation->discount_amount, 2) }}</td>
                    </tr>
                @endif
                <tr>
                    <td class="label">
                        Total Taxable Amount (Excl. VAT)
                        <div class="label-ar">المبلغ الخاضع للضريبة</div>
                    </td>
                    <td class="value">{{ $quotation->currency }} {{ number_format($quotation->total_taxable_amount, 2) }}</td>
                </tr>
                <tr>
                    <td class="label">
                        Total VAT ({{ number_format($quotation->default_vat_rate, 0) }}%)
                        <div class="label-ar">مجموع الضريبة</div>
                    </td>
                    <td class="value">{{ $quotation->currency }} {{ number_format($quotation->total_vat, 2) }}</td>
                </tr>
                <tr class="total-row">
                    <td class="label">
                        Total Amount Due (Incl. VAT)
                        <div class="label-ar">المبلغ الإجمالي المستحق</div>
                    </td>
                    <td class="value">{{ $quotation->currency }} {{ number_format($quotation->grand_total, 2) }}</td>
                </tr>
            </table>
        </div>

        <!-- Terms and Conditions -->
        @if($quotation->terms_and_conditions)
            <div class="terms-section">
                <div class="terms-header">Terms & Conditions / الشروط والأحكام</div>
                <div class="terms-content">
                    {!! nl2br(e($quotation->terms_and_conditions)) !!}
                </div>
            </div>
        @else
            <div class="terms-section">
                <div class="terms-header">Terms & Conditions / الشروط والأحكام</div>
                <div class="terms-content">
                    <ul>
                        <li>Prices valid for 7 days from quotation date / الأسعار صالحة لمدة 7 أيام من تاريخ التسعيرة</li>
                        <li>Complete checkout to secure your stock / أكمل عملية الدفع لتأمين مخزونك</li>
                        <li>Verify ETAs before purchasing / تحقق من أوقات التسليم قبل الشراء</li>
                        <li>Prices are subject to change without notice / الأسعار قابلة للتغيير دون إشعار مسبق</li>
                    </ul>
                </div>
            </div>
        @endif

        <!-- Electrical Specifications Page -->
        @php
            $hasElectricalSpecs = $quotation->items->filter(fn($item) => $item->hasElectricalSpecs())->count() > 0;
            $completeSpecs = $quotation->getItemsWithCompleteSpecs();
            $incompleteSpecs = $quotation->getItemsWithIncompleteSpecs();
        @endphp

        @if($hasElectricalSpecs)
            <div class="page-break"></div>

            <div class="electrical-section">
                <div class="electrical-header">
                    Electrical Load Summary / ملخص الحمل الكهربائي
                </div>

                @if($completeSpecs->count() > 0)
                    <table class="electrical-table">
                        <thead>
                            <tr>
                                <th style="width: 15%;">Ref</th>
                                <th style="width: 25%;">Power Req.</th>
                                <th style="width: 20%;">Dimensions (cm)</th>
                                <th style="width: 15%;">Weight</th>
                                <th style="width: 25%;">Spec Sheet</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($completeSpecs as $item)
                                <tr>
                                    <td>{{ $item->item_code ?? '-' }}</td>
                                    <td>{{ $item->power_requirement ?? '-' }}</td>
                                    <td>{{ $item->formatted_dimensions ?? '-' }}</td>
                                    <td>{{ $item->product_specifications['weight'] ?? '-' }}</td>
                                    <td>
                                        @if(!empty($item->product_specifications['spec_sheet_url']))
                                            <a href="{{ $item->product_specifications['spec_sheet_url'] }}" style="color: #40AEAF;">Download</a>
                                        @else
                                            -
                                        @endif
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endif

                <!-- Total Amperes Summary -->
                <div class="electrical-summary">
                    <p><strong>Total Estimated Ampere Requirement:</strong></p>
                    <p class="total-amperes">{{ number_format($quotation->total_amperes, 2) }} A</p>
                </div>

                <div class="electrical-warning">
                    <p><strong>Important:</strong> Please ensure that your electrical allocation can support this ampere load. Consult with a qualified electrician before installation.</p>
                    <p style="direction: rtl; margin-top: 5px;"><strong>هام:</strong> يرجى التأكد من أن التخصيص الكهربائي الخاص بك يمكنه دعم حمل الأمبير هذا. استشر كهربائيًا مؤهلاً قبل التركيب.</p>
                </div>

                <!-- Incomplete Specifications -->
                @if($incompleteSpecs->count() > 0)
                    <div class="missing-specs">
                        <div class="missing-specs-header">
                            Products with Incomplete Electrical Data / منتجات ببيانات كهربائية غير مكتملة
                        </div>
                        <ul>
                            @foreach($incompleteSpecs as $item)
                                <li>{{ $item->name }} ({{ $item->item_code ?? 'No SKU' }})</li>
                            @endforeach
                        </ul>
                    </div>
                @endif
            </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <div class="footer-contact">
                <div class="title">We're Always Ready to Help / نحن دائماً على استعداد للمساعدة</div>
                @if($company['phone'])
                    <p>Phone: {{ $company['phone'] }} (Sun-Thu 8am-8pm)</p>
                @endif
                @if($company['email'])
                    <p>Email: {{ $company['email'] }}</p>
                @endif
                @if($company['website'] ?? null)
                    <p>Website: {{ $company['website'] }}</p>
                @endif
            </div>
        </div>
    </div>
</body>
</html>

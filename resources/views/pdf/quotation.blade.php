<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Quotation {{ $quotation->quotation_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1f2937;
            background: #fff;
        }

        .container {
            padding: 30px;
        }

        /* Header */
        .header {
            display: table;
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 3px solid #7c3aed;
            padding-bottom: 20px;
        }

        .header-left {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }

        .header-right {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            text-align: right;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #7c3aed;
            margin-bottom: 5px;
        }

        .company-details {
            font-size: 10px;
            color: #6b7280;
            line-height: 1.6;
        }

        .quotation-title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }

        .quotation-number {
            font-size: 14px;
            color: #7c3aed;
            font-weight: 600;
        }

        .quotation-date {
            font-size: 11px;
            color: #6b7280;
            margin-top: 5px;
        }

        /* Status Badge */
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            margin-top: 8px;
        }

        .status-draft { background: #e5e7eb; color: #374151; }
        .status-pending_review { background: #fef3c7; color: #92400e; }
        .status-approved { background: #d1fae5; color: #065f46; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-accepted { background: #d1fae5; color: #065f46; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .status-expired { background: #e5e7eb; color: #374151; }

        /* Info Section */
        .info-section {
            display: table;
            width: 100%;
            margin-bottom: 25px;
        }

        .info-box {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 20px;
        }

        .info-box:last-child {
            padding-right: 0;
            padding-left: 20px;
        }

        .info-label {
            font-size: 10px;
            font-weight: 600;
            color: #7c3aed;
            text-transform: uppercase;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }

        .info-content {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #7c3aed;
        }

        .info-content p {
            margin-bottom: 3px;
        }

        .info-content .name {
            font-weight: 600;
            font-size: 12px;
            color: #1f2937;
        }

        /* Items Table */
        .items-section {
            margin-bottom: 25px;
        }

        .section-title {
            font-size: 12px;
            font-weight: 600;
            color: #7c3aed;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .items-table th {
            background: #7c3aed;
            color: #fff;
            padding: 10px 8px;
            text-align: left;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .items-table th:first-child {
            border-radius: 6px 0 0 0;
        }

        .items-table th:last-child {
            border-radius: 0 6px 0 0;
            text-align: right;
        }

        .items-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
        }

        .items-table tr:last-child td {
            border-bottom: none;
        }

        .items-table tr:nth-child(even) {
            background: #f9fafb;
        }

        .item-sku {
            font-size: 9px;
            color: #6b7280;
        }

        .item-description {
            font-size: 9px;
            color: #6b7280;
            margin-top: 4px;
            font-style: italic;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        /* Totals */
        .totals-section {
            display: table;
            width: 100%;
            margin-bottom: 25px;
        }

        .totals-spacer {
            display: table-cell;
            width: 60%;
        }

        .totals-box {
            display: table-cell;
            width: 40%;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table tr {
            border-bottom: 1px solid #e5e7eb;
        }

        .totals-table tr:last-child {
            border-bottom: none;
        }

        .totals-table td {
            padding: 8px 10px;
        }

        .totals-table .label {
            color: #6b7280;
            font-size: 10px;
        }

        .totals-table .value {
            text-align: right;
            font-weight: 500;
        }

        .totals-table .total-row {
            background: #7c3aed;
            color: #fff;
        }

        .totals-table .total-row td {
            padding: 12px 10px;
        }

        .totals-table .total-row .label {
            color: #fff;
            font-weight: 600;
            font-size: 12px;
        }

        .totals-table .total-row .value {
            font-size: 14px;
            font-weight: 700;
        }

        .discount-row {
            color: #059669;
        }

        .discount-row .value {
            color: #059669;
        }

        /* Terms */
        .terms-section {
            margin-bottom: 25px;
        }

        .terms-content {
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            font-size: 10px;
            line-height: 1.6;
            color: #4b5563;
        }

        .terms-content p {
            margin-bottom: 8px;
        }

        .terms-content p:last-child {
            margin-bottom: 0;
        }

        /* Notes */
        .notes-section {
            margin-bottom: 25px;
        }

        .notes-content {
            background: #fef3c7;
            padding: 15px;
            border-radius: 6px;
            font-size: 10px;
            line-height: 1.6;
            color: #92400e;
            border-left: 3px solid #f59e0b;
        }

        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }

        .footer-text {
            font-size: 9px;
            color: #9ca3af;
        }

        .validity-notice {
            background: #dbeafe;
            color: #1e40af;
            padding: 10px 15px;
            border-radius: 6px;
            font-size: 10px;
            text-align: center;
            margin-bottom: 20px;
        }

        /* Prepared By */
        .prepared-by {
            margin-top: 30px;
            padding-top: 20px;
        }

        .signature-line {
            width: 200px;
            border-top: 1px solid #1f2937;
            padding-top: 5px;
            font-size: 10px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-left">
                <div class="company-name">{{ $company['name'] }}</div>
                <div class="company-details">
                    @if($company['address'])
                        <p>{{ $company['address'] }}</p>
                    @endif
                    @if($company['phone'])
                        <p>Tel: {{ $company['phone'] }}</p>
                    @endif
                    @if($company['email'])
                        <p>Email: {{ $company['email'] }}</p>
                    @endif
                    @if($company['vat_number'])
                        <p>VAT No: {{ $company['vat_number'] }}</p>
                    @endif
                </div>
            </div>
            <div class="header-right">
                <div class="quotation-title">QUOTATION</div>
                <div class="quotation-number">#{{ $quotation->quotation_number }}</div>
                <div class="quotation-date">
                    Date: {{ $quotation->quotation_date->format('d M Y') }}
                </div>
                @if($quotation->valid_until)
                    <div class="quotation-date">
                        Valid Until: {{ $quotation->valid_until->format('d M Y') }}
                    </div>
                @endif
                <span class="status-badge status-{{ $quotation->status }}">
                    {{ str_replace('_', ' ', $quotation->status) }}
                </span>
            </div>
        </div>

        <!-- Client & Reference Info -->
        <div class="info-section">
            <div class="info-box">
                <div class="info-label">Bill To</div>
                <div class="info-content">
                    <p class="name">{{ $quotation->client_snapshot['name'] ?? $quotation->client?->name }}</p>
                    @if(!empty($quotation->client_snapshot['company']))
                        <p>{{ $quotation->client_snapshot['company'] }}</p>
                    @endif
                    @if(!empty($quotation->client_snapshot['email']))
                        <p>{{ $quotation->client_snapshot['email'] }}</p>
                    @endif
                    @if(!empty($quotation->client_snapshot['phone']))
                        <p>{{ $quotation->client_snapshot['phone'] }}</p>
                    @endif
                    @if(!empty($quotation->client_snapshot['address']))
                        <p>{{ $quotation->client_snapshot['address'] }}</p>
                    @endif
                </div>
            </div>
            <div class="info-box">
                <div class="info-label">Quotation Details</div>
                <div class="info-content">
                    @if($quotation->reference_number)
                        <p><strong>Reference:</strong> {{ $quotation->reference_number }}</p>
                    @endif
                    <p><strong>Prepared By:</strong> {{ $quotation->user?->name ?? 'N/A' }}</p>
                    @if($quotation->version > 1)
                        <p><strong>Version:</strong> {{ $quotation->version }}</p>
                    @endif
                    <p><strong>Currency:</strong> {{ $quotation->currency }}</p>
                </div>
            </div>
        </div>

        <!-- Validity Notice -->
        @if($quotation->valid_until && $quotation->valid_until->isFuture())
            <div class="validity-notice">
                This quotation is valid until <strong>{{ $quotation->valid_until->format('d F Y') }}</strong>
                ({{ $quotation->valid_until->diffForHumans() }})
            </div>
        @endif

        <!-- Items -->
        <div class="items-section">
            <div class="section-title">Items</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">#</th>
                        <th style="width: 35%;">Description</th>
                        <th style="width: 12%;" class="text-center">Qty</th>
                        <th style="width: 12%;" class="text-right">Unit Price</th>
                        <th style="width: 12%;" class="text-center">Discount</th>
                        <th style="width: 12%;" class="text-center">VAT</th>
                        <th style="width: 12%;" class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($quotation->items as $index => $item)
                        <tr>
                            <td>{{ $index + 1 }}</td>
                            <td>
                                <strong>{{ $item->name }}</strong>
                                @if($item->sku)
                                    <div class="item-sku">SKU: {{ $item->sku }}</div>
                                @endif
                                @if($item->description)
                                    <div class="item-description">{{ $item->description }}</div>
                                @endif
                            </td>
                            <td class="text-center">
                                {{ number_format($item->quantity, $item->quantity == intval($item->quantity) ? 0 : 2) }}
                                @if($item->unit)
                                    {{ $item->unit }}
                                @endif
                            </td>
                            <td class="text-right">{{ number_format($item->unit_price, 2) }}</td>
                            <td class="text-center">
                                @if($item->discount_amount > 0)
                                    @if($item->discount_type === 'percentage')
                                        {{ $item->discount_value }}%
                                    @else
                                        {{ number_format($item->discount_value, 2) }}
                                    @endif
                                @else
                                    -
                                @endif
                            </td>
                            <td class="text-center">{{ $item->vat_rate }}%</td>
                            <td class="text-right">{{ number_format($item->total_amount, 2) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Totals -->
        <div class="totals-section">
            <div class="totals-spacer"></div>
            <div class="totals-box">
                <table class="totals-table">
                    <tr>
                        <td class="label">Subtotal</td>
                        <td class="value">{{ $quotation->currency }} {{ number_format($quotation->subtotal, 2) }}</td>
                    </tr>
                    @if($quotation->discount_amount > 0)
                        <tr class="discount-row">
                            <td class="label">
                                Discount
                                @if($quotation->discount_type === 'percentage')
                                    ({{ $quotation->discount_value }}%)
                                @endif
                            </td>
                            <td class="value">-{{ number_format($quotation->discount_amount, 2) }}</td>
                        </tr>
                    @endif
                    <tr>
                        <td class="label">VAT ({{ $quotation->vat_rate }}%)</td>
                        <td class="value">{{ number_format($quotation->vat_amount, 2) }}</td>
                    </tr>
                    @if($quotation->transport_charges > 0)
                        <tr>
                            <td class="label">
                                Transport/Delivery
                                @if($quotation->transport_free)
                                    <span style="color: #059669;">(FREE)</span>
                                @endif
                            </td>
                            <td class="value">
                                @if($quotation->transport_free)
                                    <span style="text-decoration: line-through; color: #9ca3af;">{{ number_format($quotation->transport_charges, 2) }}</span>
                                    <span style="color: #059669;">0.00</span>
                                @else
                                    {{ number_format($quotation->transport_charges, 2) }}
                                @endif
                            </td>
                        </tr>
                    @endif
                    <tr class="total-row">
                        <td class="label">Grand Total</td>
                        <td class="value">{{ $quotation->currency }} {{ number_format($quotation->grand_total, 2) }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Notes -->
        @if($quotation->notes)
            <div class="notes-section">
                <div class="section-title">Notes</div>
                <div class="notes-content">
                    {!! nl2br(e($quotation->notes)) !!}
                </div>
            </div>
        @endif

        <!-- Terms and Conditions -->
        @if($quotation->terms_and_conditions)
            <div class="terms-section">
                <div class="section-title">Terms & Conditions</div>
                <div class="terms-content">
                    {!! nl2br(e($quotation->terms_and_conditions)) !!}
                </div>
            </div>
        @endif

        <!-- Prepared By -->
        <div class="prepared-by">
            <div class="signature-line">
                {{ $quotation->user?->name ?? 'Authorized Signatory' }}<br>
                {{ $company['name'] }}
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">
                Thank you for your business! | {{ $company['name'] }}
                @if($company['phone'])
                    | {{ $company['phone'] }}
                @endif
                @if($company['email'])
                    | {{ $company['email'] }}
                @endif
            </p>
        </div>
    </div>
</body>
</html>

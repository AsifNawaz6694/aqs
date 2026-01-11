<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation {{ $quotation->quotation_number }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f3f4f6;
            margin: 0;
            padding: 0;
        }

        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .email-container {
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .email-header {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }

        .email-header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: 700;
        }

        .quotation-number {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }

        .email-body {
            padding: 30px;
        }

        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }

        .custom-message {
            background: #f9fafb;
            border-left: 4px solid #7c3aed;
            padding: 15px 20px;
            margin: 20px 0;
            font-style: italic;
            color: #4b5563;
        }

        .quotation-summary {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }

        .summary-title {
            font-size: 14px;
            font-weight: 600;
            color: #7c3aed;
            text-transform: uppercase;
            margin-bottom: 15px;
            letter-spacing: 0.5px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }

        .summary-row:last-child {
            border-bottom: none;
            padding-top: 12px;
            margin-top: 4px;
            border-top: 2px solid #7c3aed;
        }

        .summary-label {
            color: #6b7280;
            font-size: 14px;
        }

        .summary-value {
            font-weight: 500;
            color: #1f2937;
        }

        .total-value {
            font-size: 18px;
            font-weight: 700;
            color: #7c3aed;
        }

        .validity-badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            margin: 20px 0;
        }

        .cta-section {
            text-align: center;
            margin: 30px 0;
        }

        .cta-text {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 15px;
        }

        .email-footer {
            background: #f9fafb;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }

        .company-name {
            font-weight: 600;
            color: #7c3aed;
            font-size: 16px;
            margin-bottom: 10px;
        }

        .footer-text {
            color: #9ca3af;
            font-size: 12px;
            line-height: 1.8;
        }

        .footer-text a {
            color: #7c3aed;
            text-decoration: none;
        }

        .items-preview {
            margin: 20px 0;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }

        .items-table th {
            background: #7c3aed;
            color: #fff;
            padding: 10px;
            text-align: left;
            font-weight: 500;
        }

        .items-table td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
        }

        .items-table tr:nth-child(even) {
            background: #f9fafb;
        }

        .text-right {
            text-align: right;
        }

        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 10px;
            }

            .email-header, .email-body, .email-footer {
                padding: 20px;
            }

            .summary-row {
                flex-direction: column;
            }

            .summary-value {
                margin-top: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <!-- Header -->
            <div class="email-header">
                <h1>{{ $companyName }}</h1>
                <span class="quotation-number">Quotation #{{ $quotation->quotation_number }}</span>
            </div>

            <!-- Body -->
            <div class="email-body">
                <p class="greeting">
                    Dear {{ $quotation->client_snapshot['name'] ?? $quotation->client?->name ?? 'Valued Customer' }},
                </p>

                <p>
                    Thank you for your interest in our products/services. Please find attached your quotation
                    <strong>#{{ $quotation->quotation_number }}</strong> dated
                    <strong>{{ $quotation->quotation_date->format('d F Y') }}</strong>.
                </p>

                @if($customMessage)
                    <div class="custom-message">
                        {!! nl2br(e($customMessage)) !!}
                    </div>
                @endif

                <!-- Items Preview -->
                @if($quotation->items->count() > 0)
                    <div class="items-preview">
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th class="text-right">Qty</th>
                                    <th class="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($quotation->items->take(5) as $item)
                                    <tr>
                                        <td>{{ $item->name }}</td>
                                        <td class="text-right">{{ number_format($item->quantity, 0) }}</td>
                                        <td class="text-right">{{ $quotation->currency }} {{ number_format($item->total_amount, 2) }}</td>
                                    </tr>
                                @endforeach
                                @if($quotation->items->count() > 5)
                                    <tr>
                                        <td colspan="3" style="text-align: center; color: #6b7280; font-style: italic;">
                                            ... and {{ $quotation->items->count() - 5 }} more items
                                        </td>
                                    </tr>
                                @endif
                            </tbody>
                        </table>
                    </div>
                @endif

                <!-- Quotation Summary -->
                <div class="quotation-summary">
                    <div class="summary-title">Quotation Summary</div>

                    <div class="summary-row">
                        <span class="summary-label">Subtotal</span>
                        <span class="summary-value">{{ $quotation->currency }} {{ number_format($quotation->subtotal, 2) }}</span>
                    </div>

                    @if($quotation->discount_amount > 0)
                        <div class="summary-row">
                            <span class="summary-label">Discount</span>
                            <span class="summary-value" style="color: #059669;">-{{ number_format($quotation->discount_amount, 2) }}</span>
                        </div>
                    @endif

                    <div class="summary-row">
                        <span class="summary-label">VAT ({{ $quotation->vat_rate }}%)</span>
                        <span class="summary-value">{{ number_format($quotation->vat_amount, 2) }}</span>
                    </div>

                    @if($quotation->transport_charges > 0 && !$quotation->transport_free)
                        <div class="summary-row">
                            <span class="summary-label">Transport/Delivery</span>
                            <span class="summary-value">{{ number_format($quotation->transport_charges, 2) }}</span>
                        </div>
                    @endif

                    <div class="summary-row">
                        <span class="summary-label" style="font-weight: 600; color: #1f2937;">Grand Total</span>
                        <span class="summary-value total-value">{{ $quotation->currency }} {{ number_format($quotation->grand_total, 2) }}</span>
                    </div>
                </div>

                @if($quotation->valid_until)
                    <div class="validity-badge">
                        This quotation is valid until <strong>{{ $quotation->valid_until->format('d F Y') }}</strong>
                    </div>
                @endif

                <div class="cta-section">
                    <p class="cta-text">
                        Please review the attached PDF for complete details including terms and conditions.
                        Should you have any questions or require modifications, please don't hesitate to contact us.
                    </p>
                </div>

                <p>
                    We look forward to your positive response.
                </p>

                <p>
                    Best regards,<br>
                    <strong>{{ $quotation->user?->name ?? $companyName }}</strong>
                </p>
            </div>

            <!-- Footer -->
            <div class="email-footer">
                <div class="company-name">{{ $companyName }}</div>
                <div class="footer-text">
                    @if($quotation->user?->email)
                        Contact: <a href="mailto:{{ $quotation->user->email }}">{{ $quotation->user->email }}</a><br>
                    @endif
                    This is an automated email. Please do not reply directly to this message.
                </div>
            </div>
        </div>
    </div>
</body>
</html>

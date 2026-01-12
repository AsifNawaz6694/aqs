<!DOCTYPE html>
<html>
<head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
    <style>
        .line-height-1 {
            line-height: 1;
        }

        .font-16 {
            font-size: 16px;
        }

        .font-14 {
            font-size: 14px;
        }

        .font-22 {
            font-size: 22px;
        }

        .font-12 {
            font-size: 12px;
        }

        .font-10 {
            font-size: 10px;
        }

        .font-8 {
            font-size: 8px;
        }

        .font-7 {
            font-size: 7px;
        }

        .font-regular {
            font-weight: 400;
        }

        .font-medium {
            font-weight: 500;
        }

        .font-semi-bold {
            font-weight: 600;
        }

        .font-bold {
            font-weight: 700;
        }

        .font-extra-bold {
            font-weight: 800;
        }

        .border {
            border: 1px solid #D8DFE8;
        }

        .font-color {
            color: #1C3047;
        }

        .font-color-light {
            color: #a1a8b1;
        }

        .border-top-1px {
            border-top: 1px solid #D8DFE8;
        }

        .border-bottom-1px {
            border-bottom: 1px solid #D8DFE8;
        }

        .border-top-5px {
            border-top: 5px solid #40AEAF;
        }

        .border-bottom-5px {
            border-bottom: 5px solid #40AEAF;
        }

        .border-right-1px {
            border-right: 1px solid #D8DFE8;
        }

        .border-left-1px {
            border-left: 1px solid #D8DFE8;
        }

        .width-100 {
            width: 100%;
        }

        .border-collapse {
            border-collapse: collapse;
        }

        .vat-box {
            background-color: #f5f5f5;
            border: 1px solid #D8DFE8;
            border-radius: 3px;
            padding: 4px 10px 5px;
            word-break: break-all;
            text-align: center;
        }

        .page-break {
            page-break-after: always;
        }

        @page {
            margin: 20px !important;
            padding: 0 !important
        }

        a {
            color: #0066cc;
            text-decoration: underline;
        }
    </style>
</head>
<body style="margin:0; font-family: dejavusans, sans-serif;">
<div class="width-100" style="width:100%;margin: 0;">
    <table class="width-100 border-collapse margin:0;" style="width:100%;">
        <tbody style="padding:0;">
        <!-- Header with teal borders -->
        <tr>
            <td colspan="2" style="padding:0;">
                <table class="width-100 border-top-5px border-bottom-5px">
                    <tbody>
                    <tr>
                        <td align="left" width="33%" class="font-color font-22 font-medium" style="padding: 10px 0;line-height: 1;">
                            <span style="display: inline-block;vertical-align: middle;width: 20px;text-align: left;">
                                <img style="display: block;" src="{{ public_path('images/right-arrow.png') }}" />
                            </span>
                            <span style="display: inline-block;vertical-align:middle;">Quotation</span>
                        </td>
                        <td align="center" width="34%" style="padding: 10px 0;">
                            <img width="110" src="{{ public_path('images/ekuep-logo-en.png') }}" />
                        </td>
                        <td align="right" width="33%" class="font-color font-22 font-bold" style="padding: 10px 0;line-height: 1;">
                            <span style="display: inline-block;vertical-align:middle;">تسعيرة</span>
                            <span style="display: inline-block;vertical-align: middle;width: 20px;text-align: right;">
                                <img style="display: block;" src="{{ public_path('images/left-arrow.png') }}" />
                            </span>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>

        <!-- Quotation Ref & Date -->
        <tr>
            <td colspan="2" style="padding:0;">
                <table style="width: 100%;border-collapse: collapse;">
                    <tbody>
                    <tr>
                        <td align="left" width="33%" class="font-medium font-14 font-color" style="padding: 5px 0;">Quotation Ref. </td>
                        <td align="center" width="34%" class="font-medium font-14 font-color" style="padding: 5px 0;">
                            <strong>{{ $quotation->quotation_number }}</strong>
                        </td>
                        <td align="right" width="33%" class="font-medium font-14 font-color" style="padding: 5px 0;">مرجع التسعيرة </td>
                    </tr>
                    <tr>
                        <td align="left" width="33%" class="font-medium font-14 font-color" style="padding: 5px 0;">Quotation Issue Date </td>
                        <td align="center" width="34%" class="font-medium font-14 font-color" style="padding: 5px 0;">
                            <strong>{{ $quotation->quotation_date->format('d/m/Y') }}</strong>
                        </td>
                        <td align="right" width="33%" class="font-medium font-14 font-color" style="padding: 5px 0;">تاريخ اصدار التسعيرة </td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>

        <!-- Issued From / To Headers -->
        <tr>
            <td width="50%" class="border-top-1px border-bottom-1px border-right-1px">
                <table class="width-100 border-collapse">
                    <tbody>
                    <tr>
                        <td align="left" class="font-14 font-regular" style="padding: 10px 0;">
                            <span>Issued from</span>
                        </td>
                        <td align="right" class="font-14 font-regular" style="padding: 10px 10px 10px 0;">
                            <span>أُصدرت من</span>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
            <td width="50%" class="border-top-1px border-bottom-1px">
                <table class="width-100 border-collapse">
                    <tbody>
                    <tr>
                        <td align="left" class="font-14 font-regular" style="padding: 10px 0 10px 10px;">
                            <span>Issued to</span>
                        </td>
                        <td align="right" class="font-14 font-regular" style="padding: 10px 0 10px 0;">
                            <span>أُصدرت إلى</span>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>

        <!-- Company / Client Details -->
        <tr>
            <td width="50%" valign="top" class="border-right-1px font-16" style="padding: 5px 10px 10px 0;vertical-align: top;text-align: left;">
                <span style="font-weight: 600;">
                    <strong>{{ $company['name'] ?? 'Ekuep.com' }}</strong>
                    <br>{{ $company['address'] ?? 'Wosol For Communication & Information Technology' }}
                </span>
            </td>
            <td width="50%" valign="top" class="font-16" style="padding: 5px 10px 10px 0;vertical-align: top;text-align: right;">
                <span style="line-height: 1;font-weight: 600;">
                    <strong>{{ $quotation->client_contact_name ?? $quotation->client?->display_name ?? 'N/A' }}</strong>
                </span>
                <br>
                <span>{{ $quotation->client_contact_phone ?? $quotation->client?->phone ?? '' }}</span>
            </td>
        </tr>

        <!-- VAT Row -->
        <tr>
            <td width="50%" class="border-right-1px border-bottom-1px">
                <table style="width: 100%;">
                    <tbody>
                    <tr>
                        <td width="50%" class="font-14 font-semi-bold">
                            <table width="100%">
                                <tbody>
                                <tr>
                                    <td class="vat-box" style="text-align:center;">
                                        <strong>٣٠٠٧٧٤٨٦٣٢٠٠٠٠٣</strong>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </td>
                        <td width="50%" align="right" style="padding: 0 10px 0 0;">
                            <span class="font-14 font-regular">VAT#</span>
                            <br>
                            <span class="font-14 font-regular">الرقم الضريبي</span>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
            <td width="50%" class="border-bottom-1px">
                <!-- Client VAT if available -->
            </td>
        </tr>

        <!-- Spacer -->
        <tr>
            <td colspan="2" style="height: 20px;"></td>
        </tr>

        <!-- Info Box -->
        <tr>
            <td colspan="2" style="border: 1px solid #1C3047; background-color: #F2F6FA; padding:8px 0px; border-radius:2px;">
                <table class="width-100 border-collapse">
                    <tbody>
                    <tr>
                        <td align="left" class="font-14 font-bold" style="height: 35px;">
                            <table style="width: 100%;">
                                <tbody>
                                <tr>
                                    <td width="15%" style="border-right: 1px solid #000; text-align: center;">
                                        <img src="{{ public_path('images/Icon-material.png') }}" alt="" style="max-width: 40px;">
                                    </td>
                                    <td width="85%" style="padding-left: 10px;line-height: 15px;">
                                        <span class="font-12 font-medium">This quotation won't reserve the available</span>
                                        <br>
                                        <span class="font-12 font-medium">stock for you until you place an order</span>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </td>
                        <td align="right" class="font-12 font-bold" style="padding-right: 10px;">لن يتم حجز المنتجات في هذه التسعيرة الا بعد إتمام الطلب</td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>
        </tbody>
    </table>

    <!-- Products Table -->
    <table class="width-100 border" style="border-collapse: collapse; margin: 20px 0 0 0;border-spacing: 20px 0;">
        <thead>
        <tr style="background-color: #dfe4ea;">
            <th width="" align="center" class="line-height-1" style="opacity:0.7; padding:10px;">
                <span class="font-regular font-10 font-color">Product Ref. <br>
                    <hr style="width:50%; color:#1C3047;opacity:0.7;" />
                </span>
                <span class="font-medium font-10 font-color" style="opacity:0.7;">مرجع المنتج</span>
            </th>
            <th width="" align="center" class="line-height-1" style="opacity:0.7;padding:10px;">
                <span class="font-regular font-10 font-color">Image <br>
                    <hr style="width:50%; color:#1C3047;opacity:0.7;" />
                </span>
                <span class="font-medium font-10 font-color" style="opacity:0.7;">صورة</span>
            </th>
            <th width="" align="center" class="line-height-1" style="opacity:0.7;padding:10px;">
                <span class="font-regular font-10 font-color">Product Name <br>
                    <hr style="width:50%;color:#1C3047;opacity:0.7;" />
                </span>
                <span class="font-medium font-10 font-color">اسم المنتج</span>
            </th>
            <th width="" align="center" class="line-height-1" style="opacity:0.7;padding:10px;">
                <span class="font-medium font-10 font-color">QTY <br>
                    <hr style="width:50%; color:#1C3047;">
                </span>
                <span class="font-medium font-10 font-color">الكمية</span>
            </th>
            <th width="" align="center" class="line-height-1" style="padding:10px;opacity:0.7;">
                <span class="font-medium font-8 font-color">Unit Price <br>
                    <span class="font-8">(Excl. VAT)</span>
                    <br>
                    <hr style="width:50%; color:#1C3047;">
                </span>
                <span class="font-medium font-10 font-color">
                    <span>سعر الوحدة</span>
                    <br>
                    <span class="font-color">(غير شامل الضريبة)</span>
                </span>
            </th>
            <th width="" align="center" class="line-height-1" style="opacity:0.7;padding:10px;">
                <span class="font-medium font-10 font-color">Line Discount <br />
                    <hr style="width:50%; color:#1C3047;">
                </span>
                <span class="font-medium font-10 font-color">خصم الخط</span>
            </th>
            <th width="" align="center" class="line-height-1" style="padding:10px;opacity:0.7">
                <span class="font-medium font-8 font-color">Total Price <br>
                    <span class="font-8">(Excl. VAT) <br>
                        <hr style="width:50%;color:#1C3047;">
                    </span>
                </span>
                <span class="font-medium font-10 font-color">
                    <span>مجموع السعر</span>
                    <br>
                    <span class="font-color">(غير شامل الضريبة)</span>
                </span>
            </th>
            <th width="" align="center" class="line-height-1" style="padding:10px;opacity:0.7">
                <span class="font-medium font-8 font-color">Total Price <br>
                    <span class="font-8">(VAT Included) <br>
                        <hr style="width:50%;color:#1C3047;">
                    </span>
                </span>
                <span class="font-medium font-10 font-color">
                    <span>مجموع السعر</span>
                    <br>
                    <span class="font-color">(شامل ضريبة القيمة المضافة)</span>
                </span>
            </th>
        </tr>
        </thead>
        <tbody>
        @foreach($quotation->items as $item)
        <tr>
            <td width="" align="center" class="font-10 border-bottom-1px" style="padding: 5px;">
                {{ $item->item_code ?? '-' }}
            </td>
            <td width="" align="center" class="font-10 border-bottom-1px" style="padding: 5px;padding-right: 10px;">
                @if($item->image_url)
                <img style="max-width:55px;" src="{{ $item->image_url }}" alt="">
                @else
                -
                @endif
            </td>
            <td width="" style="padding:10px 0;" align="left" class="font-bold font-10 font-color border-bottom-1px">
                @if($item->slug)
                    <a href="https://www.ekuep.com/{{ $item->slug }}">{{ $item->name ?? '-' }}</a>
                @else
                    {{ $item->name ?? '-' }}
                @endif
            </td>
            <td width="" align="center" class="font-bold font-10 font-color border-bottom-1px">
                {{ number_format($item->quantity, 0) }}
            </td>
            <td width="" align="center" class="font-bold font-10 font-color border-bottom-1px">
                {{ number_format($item->unit_price, 2) }}
            </td>
            <td width="" align="center" class="font-bold font-10 font-color border-bottom-1px">
                {{ $item->discount_percentage > 0 ? number_format($item->discount_percentage, 0) . '%' : '-' }}
            </td>
            <td width="" align="center" class="font-bold font-10 font-color border-bottom-1px">
                {{ number_format($item->line_total_after_discount ?? ($item->unit_price * $item->quantity * (1 - ($item->discount_percentage ?? 0) / 100)), 2) }}
            </td>
            <td width="" align="center" class="font-bold font-10 font-color border-bottom-1px">
                {{ number_format($item->line_total_with_vat ?? (($item->line_total_after_discount ?? ($item->unit_price * $item->quantity)) * 1.15), 2) }}
            </td>
        </tr>
        @endforeach
        </tbody>
    </table>

    <!-- Totals Section -->
    <table class="width-100 border-collapse margin:0;" style="width:100%;">
        <tbody style="padding:0;">
        <tr>
            <td colspan="2" style="height: 20px;"></td>
        </tr>
        <tr>
            <td colspan="2">
                <table style="width:100%; border-top: 1px solid #D8DFE8;border-bottom: 1px solid #D8DFE8;">
                    <tbody>
                    <tr>
                        <td align="left" width="50" class="font-14 font-regular font-color" style="padding: 6px 0;">Total Amounts</td>
                        <td align="right" width="50" class="font-14 font-regular font-color" style="padding: 5px 0;">إجمالي المبلغ</td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <table style="width: 100%;border-collapse: collapse;">
                    <tbody>
                    <tr>
                        <td align="left" width="33%" class="font-medium font-14 font-color" style="padding: 5px 0;">
                            <strong>Total</strong>
                            <span style="font-weight: 400;font-size: 12px;">(Excl. VAT)</span>
                        </td>
                        <td align="center" width="34%" class="font-medium font-14 font-color" style="padding: 5px 0;">{{ $quotation->currency ?? 'SAR' }} {{ number_format($quotation->subtotal ?? 0, 2) }}</td>
                        <td align="right" width="33%" class="font-bold font-14 font-color" style="padding: 5px 0;direction: rtl;">
                            <strong>المجموع</strong>
                            <span class="font-regular font-12">(غير شامل الضريبة)</span>
                        </td>
                    </tr>
                    <tr>
                        <td align="left" width="33%" class="font-medium font-14 font-color" style="padding: 5px 0;">
                            <strong>Discount</strong>
                        </td>
                        <td align="center" width="34%" class="font-medium font-14 font-color" style="padding: 5px 0;">{{ $quotation->currency ?? 'SAR' }} {{ number_format($quotation->total_discount ?? 0, 2) }}</td>
                        <td align="right" width="33%" class="font-bold font-14 font-color" style="padding: 5px 0;">
                            <strong>مجموع الخصومات</strong>
                        </td>
                    </tr>
                    <tr>
                        <td align="left" width="33%" class="font-medium font-14 font-color" style="padding: 5px 0;">
                            <strong>Total Taxable Amount</strong>
                            <span style="font-weight: 400;font-size: 12px;">(Excl. VAT)</span>
                        </td>
                        <td align="center" width="34%" class="font-medium font-14 font-color" style="padding: 5px 0;">{{ $quotation->currency ?? 'SAR' }} {{ number_format(($quotation->subtotal ?? 0) - ($quotation->total_discount ?? 0), 2) }}</td>
                        <td align="right" width="33%" class="font-bold font-14 font-color" style="padding: 5px 0;direction: rtl;">
                            <strong>الإجمالي الخاضع للضريبة</strong>
                            <span style="font-weight: 400;font-size: 12px;">(غير شامل الضريبة)</span>
                        </td>
                    </tr>
                    <tr>
                        <td align="left" width="33%" class="font-medium font-14 font-color border-bottom-1px" style="padding: 5px 0;">
                            <strong>Total VAT</strong>
                        </td>
                        <td align="center" width="34%" class="font-medium font-14 font-color border-bottom-1px" style="padding: 5px 0;">{{ $quotation->currency ?? 'SAR' }} {{ number_format($quotation->total_vat ?? 0, 2) }}</td>
                        <td align="right" width="33%" class="font-bold font-14 font-color border-bottom-1px" style="padding: 5px 0;">
                            <strong>مجموع الضريبة</strong>
                        </td>
                    </tr>
                    <tr>
                        <td align="left" width="33%" class="font-bold font-14 font-color" style="padding: 5px 0;">
                            <strong>Total Amount Due</strong>
                            <span style="font-weight: 400;font-size: 12px;">(incl. VAT)</span>
                        </td>
                        <td align="center" width="34%" class="font-bold font-14 font-color" style="padding: 5px 0;">
                            <strong>{{ $quotation->currency ?? 'SAR' }} {{ number_format($quotation->grand_total ?? 0, 2) }}</strong>
                        </td>
                        <td align="right" width="33%" class="font-bold font-14 font-color" style="padding: 5px 0;direction: rtl;">
                            <strong>إجمالي المبلغ المستحق</strong>
                            <span style="font-weight: 400;font-size: 12px;">(شامل الضريبة)</span>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>

        <!-- Spacer -->
        <tr>
            <td colspan="2" style="height: 40px;"></td>
        </tr>

        <!-- Terms & Conditions -->
        <tr>
            <td colspan="3">
                <table style="width:100%;">
                    <tbody>
                    <tr>
                        <td colspan="1" align="left" class="font-medium font-14 font-color"><strong>Terms &amp; Conditions</strong></td>
                        <td colspan="1" align="right" class="font-medium font-14 font-color"><strong>الشروط والأحكام</strong></td>
                    </tr>
                    <tr>
                        <td align="left" width="50%" class="font-14 font-color" style="padding: 6px 0;">
                            <ul style="padding-left: 18px; margin: 0 60px 5px 0;">
                                <li class="font-regular font-12 font-color">Prices in this quotation are guaranteed for <span class="font-bold">{{ $quotation->valid_until ? $quotation->quotation_date->diffInDays($quotation->valid_until) : 7 }} days</span> only</li>
                                <li class="font-regular font-12 font-color">To take advantage of stock availability, please add items to your cart and complete the checkout process</li>
                                <li class="font-regular font-12 font-color">If you are planning to place the order in a later date, please double check the latest ETAs available before completing the purchase</li>
                            </ul>
                        </td>
                        <td align="right" width="50%" style="padding: 5px 0;direction: rtl;">
                            <ul style="padding-right: 14px;margin: 0 14px 5px 70px;">
                                <li class="font-regular font-12 font-color">الاسعار في هذه التسعيرة صالحة لغاية <strong>{{ $quotation->valid_until ? $quotation->quotation_date->diffInDays($quotation->valid_until) : 7 }} أيام</strong> فقط</li>
                                <li class="font-regular font-12 font-color">للإستفادة من توفر هذه المنتجات، الرجاء اضافة المنتجات إلى السلة واتمام الطلب</li>
                                <li class="font-regular font-12 font-color">اذا كنت تخطط لإتمام الطلب في وقت لاحق، الرجاء التأكد من التاريخ المتوقع للتوصيل لكل منتج قبل الشراء</li>
                            </ul>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>

        <!-- Spacer -->
        <tr>
            <td colspan="2" style="height: 80px;"></td>
        </tr>

        <!-- Footer -->
        <tr>
            <td colspan="2" style="padding-top:5px;">
                <table class="border-collapse width-100">
                    <tbody>
                    <tr>
                        <td width="40%" style="background-color: #dfe4ea;padding-left: 10px;">
                            <table>
                                <tbody>
                                <tr>
                                    <td class="font-color" style="vertical-align: middle;">
                                        <span class="font-16 font-bold">
                                            <strong>We're Always Ready to Help</strong>
                                        </span>
                                        <br>
                                        <span class="font-12 font-regular">Reach out to us through any of these support channels</span>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </td>
                        <td width="60%" style="background-color: #dfe4ea;">
                            <table>
                                <tbody>
                                <tr>
                                    <td>
                                        <table>
                                            <tbody>
                                            <tr>
                                                <td>
                                                    <img style="width: 40px;" src="{{ public_path('images/icon-head.svg') }}" />
                                                </td>
                                                <td class="font-color" style="vertical-align: middle;padding-left: 10px;line-height: 20px;">
                                                    <span class="font-12 font-bold" style="color: #687E94;">PHONE SUPPORT</span>
                                                    <br>
                                                    <span class="font-16 font-bold">
                                                        <strong style="line-height:1;">{{ $company['phone'] ?? '920035110' }}</strong>
                                                    </span>
                                                    <br>
                                                    <span class="font-7 font-bold line-height-1" style="white-space: nowrap;">
                                                        <strong>Sunday - Thursday 8am - 8pm</strong>
                                                    </span>
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                    <td class="font-color" style="vertical-align: middle;padding-left: 10px;line-height: 20px;">
                                        <table>
                                            <tbody>
                                            <tr>
                                                <td>
                                                    <img style="width: 40px;" src="{{ public_path('images/icon-question.svg') }}" />
                                                </td>
                                                <td class="font-color" style="vertical-align: middle;padding-left: 10px;">
                                                    <span class="font-12 font-bold" style="color: #687E94;">HELP CENTER</span>
                                                    <br>
                                                    <span class="font-16 font-bold">
                                                        <strong>{{ $company['email'] ?? 'ekuep@ekuep.com' }}</strong>
                                                    </span>
                                                    <br>
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>
        </tbody>
    </table>
</div>
</body>
</html>

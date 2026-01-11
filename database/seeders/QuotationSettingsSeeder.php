<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class QuotationSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'quotation_prefix',
                'value' => 'QT',
                'type' => 'text',
                'group' => 'quotation',
                'label' => 'Quotation Number Prefix',
                'description' => 'Prefix for auto-generated quotation numbers',
            ],
            [
                'key' => 'quotation_validity_days',
                'value' => '30',
                'type' => 'number',
                'group' => 'quotation',
                'label' => 'Default Validity Days',
                'description' => 'Default number of days a quotation is valid',
            ],
            [
                'key' => 'default_vat_rate',
                'value' => '15',
                'type' => 'number',
                'group' => 'quotation',
                'label' => 'Default VAT Rate (%)',
                'description' => 'KSA standard VAT rate',
            ],
            [
                'key' => 'default_currency',
                'value' => 'SAR',
                'type' => 'text',
                'group' => 'quotation',
                'label' => 'Default Currency',
                'description' => 'Default currency for quotations',
            ],
            [
                'key' => 'default_terms_and_conditions',
                'value' => "1. This quotation is valid for the period mentioned above from the date of issue.\n\n2. Prices are quoted in Saudi Riyals (SAR) and are exclusive of VAT unless otherwise stated.\n\n3. Payment terms: 50% advance payment upon confirmation, 50% upon delivery.\n\n4. Delivery timeline will be confirmed upon order confirmation.\n\n5. Any changes to specifications after order confirmation may result in price adjustments.\n\n6. Warranty terms as per manufacturer's standard warranty policy.\n\n7. Installation and commissioning charges are not included unless specifically mentioned.\n\n8. Transportation charges are additional unless mentioned as free delivery.\n\n9. This quotation supersedes all previous quotations for the same items.\n\n10. Acceptance of this quotation constitutes agreement to the above terms and conditions.",
                'type' => 'html',
                'group' => 'quotation',
                'label' => 'Default Terms & Conditions',
                'description' => 'Default terms and conditions for new quotations',
            ],
            [
                'key' => 'default_payment_terms',
                'value' => "- 50% advance payment upon order confirmation\n- 50% balance payment upon delivery\n- Bank transfer or certified cheque accepted\n- All payments to be made in Saudi Riyals (SAR)",
                'type' => 'html',
                'group' => 'quotation',
                'label' => 'Default Payment Terms',
                'description' => 'Default payment terms for new quotations',
            ],
            [
                'key' => 'default_delivery_terms',
                'value' => "- Delivery timeline: As per agreed schedule\n- Delivery location: Client specified address\n- Delivery charges: As quoted or free delivery where applicable\n- Unloading assistance: Available upon request",
                'type' => 'html',
                'group' => 'quotation',
                'label' => 'Default Delivery Terms',
                'description' => 'Default delivery terms for new quotations',
            ],
            [
                'key' => 'default_warranty_terms',
                'value' => "- Warranty period: As per manufacturer's standard warranty\n- Warranty covers manufacturing defects only\n- Damage due to misuse or negligence not covered\n- Warranty void if product is modified or repaired by unauthorized personnel",
                'type' => 'html',
                'group' => 'quotation',
                'label' => 'Default Warranty Terms',
                'description' => 'Default warranty terms for new quotations',
            ],
            [
                'key' => 'company_name',
                'value' => 'Ekuep Trading Company',
                'type' => 'text',
                'group' => 'company',
                'label' => 'Company Name',
                'description' => 'Company name for documents',
            ],
            [
                'key' => 'company_address',
                'value' => 'Riyadh, Saudi Arabia',
                'type' => 'text',
                'group' => 'company',
                'label' => 'Company Address',
                'description' => 'Company address for documents',
            ],
            [
                'key' => 'company_phone',
                'value' => '+966 XX XXX XXXX',
                'type' => 'text',
                'group' => 'company',
                'label' => 'Company Phone',
                'description' => 'Company phone for documents',
            ],
            [
                'key' => 'company_email',
                'value' => 'info@ekuep.com',
                'type' => 'text',
                'group' => 'company',
                'label' => 'Company Email',
                'description' => 'Company email for documents',
            ],
            [
                'key' => 'company_vat_number',
                'value' => '',
                'type' => 'text',
                'group' => 'company',
                'label' => 'VAT Registration Number',
                'description' => 'Company VAT registration number',
            ],
            [
                'key' => 'email_signature',
                'value' => '<p><strong>Best Regards,</strong></p><p>Ekuep Trading Company</p><p style="color: #6b7280; font-size: 0.875rem;">Riyadh, Saudi Arabia</p><p style="color: #6b7280; font-size: 0.875rem;">Email: info@ekuep.com | Phone: +966 XX XXX XXXX</p>',
                'type' => 'html',
                'group' => 'email',
                'label' => 'Email Signature',
                'description' => 'Default email signature for quotation emails',
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::firstOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('Quotation settings seeded successfully.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Display the settings page.
     */
    public function index()
    {
        try {
            $settings = [
                'quotation' => SystemSetting::getByGroup('quotation'),
                'company' => SystemSetting::getByGroup('company'),
                'email' => SystemSetting::getByGroup('email'),
            ];

            return Inertia::render('Settings/Index', [
                'settings' => $settings,
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading settings: ' . $e->getMessage());
            return back()->with('error', 'Failed to load settings. Please try again.');
        }
    }

    /**
     * Update settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'quotation_prefix' => 'nullable|string|max:10',
            'quotation_validity_days' => 'nullable|integer|min:1|max:365',
            'default_vat_rate' => 'nullable|numeric|min:0|max:100',
            'default_currency' => 'nullable|string|max:3',
            'default_terms_and_conditions' => 'nullable|string',
            'default_payment_terms' => 'nullable|string',
            'default_delivery_terms' => 'nullable|string',
            'default_warranty_terms' => 'nullable|string',
            'company_name' => 'nullable|string|max:255',
            'company_address' => 'nullable|string|max:500',
            'company_phone' => 'nullable|string|max:50',
            'company_email' => 'nullable|email|max:255',
            'company_vat_number' => 'nullable|string|max:50',
            'email_signature' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $changedSettings = [];

            foreach ($validated as $key => $value) {
                if ($value !== null) {
                    $type = $this->getSettingType($key);
                    $oldValue = SystemSetting::getValue($key);

                    if ($oldValue !== $value) {
                        $changedSettings[$key] = [
                            'old' => $oldValue,
                            'new' => $value,
                        ];
                    }

                    SystemSetting::setValue($key, $value, $type);
                }
            }

            // Log activity if any settings changed
            if (!empty($changedSettings)) {
                ActivityLog::log(
                    'updated',
                    'Updated system settings: ' . implode(', ', array_keys($changedSettings)),
                    null,
                    auth()->user(),
                    ['changed_keys' => array_keys($changedSettings)],
                    ['changes' => $changedSettings],
                    'settings'
                );
            }

            // Clear all settings cache
            Cache::flush();

            DB::commit();

            return back()->with('success', 'Settings updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating settings: ' . $e->getMessage());
            return back()->with('error', 'Failed to update settings. Please try again.');
        }
    }

    /**
     * Get the type for a setting key.
     */
    private function getSettingType(string $key): string
    {
        $htmlSettings = [
            'default_terms_and_conditions',
            'default_payment_terms',
            'default_delivery_terms',
            'default_warranty_terms',
            'email_signature',
        ];

        $numberSettings = [
            'quotation_validity_days',
            'default_vat_rate',
        ];

        if (in_array($key, $htmlSettings)) {
            return 'html';
        }

        if (in_array($key, $numberSettings)) {
            return 'number';
        }

        return 'text';
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'label',
        'description',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }

    // Get value with type casting
    public function getCastedValueAttribute()
    {
        return match ($this->type) {
            'number' => (float) $this->value,
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($this->value, true),
            default => $this->value,
        };
    }

    // Static helper to get setting value
    public static function getValue(string $key, $default = null)
    {
        $cacheKey = 'system_setting_' . $key;

        return Cache::remember($cacheKey, 3600, function () use ($key, $default) {
            $setting = self::where('key', $key)->first();
            return $setting ? $setting->casted_value : $default;
        });
    }

    // Static helper to set setting value
    public static function setValue(string $key, $value, string $type = 'text'): void
    {
        if ($type === 'json' && is_array($value)) {
            $value = json_encode($value);
        }

        self::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'type' => $type]
        );

        Cache::forget('system_setting_' . $key);
    }

    // Get settings by group
    public static function getByGroup(string $group): array
    {
        return self::where('group', $group)
            ->get()
            ->mapWithKeys(function ($setting) {
                return [$setting->key => $setting->casted_value];
            })
            ->toArray();
    }

    // Clear cache when setting is updated
    protected static function boot()
    {
        parent::boot();

        static::saved(function ($setting) {
            Cache::forget('system_setting_' . $setting->key);
        });

        static::deleted(function ($setting) {
            Cache::forget('system_setting_' . $setting->key);
        });
    }
}

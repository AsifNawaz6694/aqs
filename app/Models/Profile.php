<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Profile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'avatar_path',
        'signature_path',
        'company_name',
        'job_title',
        'department',
        'phone',
        'mobile',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'vat_number',
        'tax_id',
        'timezone',
        'locale',
        'date_format',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = ['avatar_url', 'signature_url'];

    /**
     * Get the user that owns the profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the avatar URL.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar_path) {
            return Storage::disk('public')->url($this->avatar_path);
        }

        return null;
    }

    /**
     * Get the signature URL.
     */
    public function getSignatureUrlAttribute(): ?string
    {
        if ($this->signature_path) {
            return Storage::disk('public')->url($this->signature_path);
        }

        return null;
    }

    /**
     * Get the full address.
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address,
            $this->city,
            $this->state,
            $this->postal_code,
            $this->country,
        ]);

        return implode(', ', $parts);
    }
}

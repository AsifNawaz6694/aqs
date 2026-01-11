<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = ['display_name'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'type',
        'name',
        'email',
        'phone',
        'mobile',
        'website',
        'company_name',
        'trading_name',
        'registration_number',
        'vat_number',
        'tax_id',
        'contact_person',
        'contact_position',
        'contact_email',
        'contact_phone',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'postal_code',
        'country',
        'billing_address_same',
        'billing_address',
        'credit_limit',
        'payment_terms',
        'currency',
        'status',
        'classification',
        'source',
        'notes',
        'internal_notes',
        'assigned_to',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'billing_address' => 'array',
            'billing_address_same' => 'boolean',
            'credit_limit' => 'decimal:2',
        ];
    }

    /**
     * Get the user assigned to this client.
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user who created this client.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the activity logs for the client.
     */
    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'subject');
    }

    /**
     * Get the display name (company name or name).
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->company_name ?: $this->name;
    }

    /**
     * Get the full address.
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address_line_1,
            $this->address_line_2,
            $this->city,
            $this->state,
            $this->postal_code,
            $this->country,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Get the billing address (returns main address if same).
     */
    public function getEffectiveBillingAddressAttribute(): array
    {
        if ($this->billing_address_same) {
            return [
                'address_line_1' => $this->address_line_1,
                'address_line_2' => $this->address_line_2,
                'city' => $this->city,
                'state' => $this->state,
                'postal_code' => $this->postal_code,
                'country' => $this->country,
            ];
        }

        return $this->billing_address ?? [];
    }

    /**
     * Check if client is a company.
     */
    public function isCompany(): bool
    {
        return $this->type === 'company';
    }

    /**
     * Check if client is an individual.
     */
    public function isIndividual(): bool
    {
        return $this->type === 'individual';
    }

    /**
     * Check if client is VIP.
     */
    public function isVip(): bool
    {
        return $this->classification === 'vip';
    }

    /**
     * Scope to get active clients.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to get companies.
     */
    public function scopeCompanies($query)
    {
        return $query->where('type', 'company');
    }

    /**
     * Scope to get individuals.
     */
    public function scopeIndividuals($query)
    {
        return $query->where('type', 'individual');
    }

    /**
     * Scope to get VIP clients.
     */
    public function scopeVip($query)
    {
        return $query->where('classification', 'vip');
    }

    /**
     * Scope to filter by assigned user.
     */
    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    /**
     * Scope to search clients.
     */
    public function scopeSearch($query, string $term)
    {
        return $query->whereRaw("MATCH(name, company_name, email, contact_person) AGAINST(? IN BOOLEAN MODE)", [$term]);
    }
}

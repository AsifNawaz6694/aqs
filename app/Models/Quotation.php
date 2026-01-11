<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Quotation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'quotation_number',
        'version',
        'parent_id',
        'client_id',
        'user_id',
        'assigned_to',
        'title',
        'description',
        'reference',
        'customer_reference',
        'quotation_date',
        'valid_until',
        'expected_delivery_date',
        'status',
        'subtotal',
        'total_discount',
        'discount_percentage',
        'total_before_vat',
        'total_vat',
        'grand_total',
        'total_amperes',
        'transport_charges',
        'transport_free',
        'transport_notes',
        'default_vat_rate',
        'vat_inclusive',
        'currency',
        'country',
        'exchange_rate',
        'terms_and_conditions',
        'payment_terms',
        'delivery_terms',
        'warranty_terms',
        'internal_notes',
        'client_contact_name',
        'client_contact_email',
        'client_contact_phone',
        'approved_by',
        'approved_at',
        'sent_at',
        'sent_to_email',
        'accepted_at',
        'rejected_at',
        'rejection_reason',
        'pdf_path',
        'pdf_generated_at',
    ];

    protected function casts(): array
    {
        return [
            'quotation_date' => 'date',
            'valid_until' => 'date',
            'expected_delivery_date' => 'date',
            'subtotal' => 'decimal:2',
            'total_discount' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'total_before_vat' => 'decimal:2',
            'total_vat' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'total_amperes' => 'decimal:2',
            'transport_charges' => 'decimal:2',
            'transport_free' => 'boolean',
            'default_vat_rate' => 'decimal:2',
            'vat_inclusive' => 'boolean',
            'exchange_rate' => 'decimal:4',
            'approved_at' => 'datetime',
            'sent_at' => 'datetime',
            'accepted_at' => 'datetime',
            'rejected_at' => 'datetime',
            'pdf_generated_at' => 'datetime',
        ];
    }

    // Status constants
    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING_REVIEW = 'pending_review';
    const STATUS_APPROVED = 'approved';
    const STATUS_SENT = 'sent';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_REJECTED = 'rejected';
    const STATUS_EXPIRED = 'expired';
    const STATUS_CANCELLED = 'cancelled';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_PENDING_REVIEW => 'Pending Review',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_SENT => 'Sent',
            self::STATUS_ACCEPTED => 'Accepted',
            self::STATUS_REJECTED => 'Rejected',
            self::STATUS_EXPIRED => 'Expired',
            self::STATUS_CANCELLED => 'Cancelled',
        ];
    }

    public static function getStatusColors(): array
    {
        return [
            self::STATUS_DRAFT => 'gray',
            self::STATUS_PENDING_REVIEW => 'yellow',
            self::STATUS_APPROVED => 'blue',
            self::STATUS_SENT => 'indigo',
            self::STATUS_ACCEPTED => 'green',
            self::STATUS_REJECTED => 'red',
            self::STATUS_EXPIRED => 'orange',
            self::STATUS_CANCELLED => 'gray',
        ];
    }

    // Relationships
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Quotation::class, 'parent_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(Quotation::class, 'parent_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class)->orderBy('sort_order');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(QuotationStatusHistory::class)->orderBy('created_at', 'desc');
    }

    // Generate quotation number
    public static function generateQuotationNumber(): string
    {
        $prefix = SystemSetting::getValue('quotation_prefix', 'QT');
        $year = date('Y');
        $month = date('m');

        $lastQuotation = self::where('quotation_number', 'like', "{$prefix}-{$year}{$month}-%")
            ->orderBy('quotation_number', 'desc')
            ->first();

        if ($lastQuotation) {
            $lastNumber = (int) substr($lastQuotation->quotation_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return sprintf('%s-%s%s-%04d', $prefix, $year, $month, $newNumber);
    }

    // Calculate totals
    public function calculateTotals(): void
    {
        $subtotal = 0;
        $totalDiscount = 0;
        $totalVat = 0;
        $totalAmperes = 0;

        foreach ($this->items as $item) {
            if (!$item->is_free) {
                $subtotal += $item->line_total_before_discount;
                $totalDiscount += $item->discount_amount * $item->quantity;
                $totalVat += $item->vat_amount;
            }

            // Calculate total amperage from items with specifications
            if ($item->total_amperage !== null) {
                $totalAmperes += $item->total_amperage;
            }
        }

        // Apply overall discount if set
        $overallDiscount = 0;
        if ($this->discount_percentage > 0) {
            $overallDiscount = ($subtotal - $totalDiscount) * ($this->discount_percentage / 100);
        }

        $totalBeforeVat = $subtotal - $totalDiscount - $overallDiscount;

        // Add transport charges (if not free)
        $transportCharges = $this->transport_free ? 0 : $this->transport_charges;
        $transportVat = $transportCharges * ($this->default_vat_rate / 100);

        $this->subtotal = $subtotal;
        $this->total_discount = $totalDiscount + $overallDiscount;
        $this->total_before_vat = $totalBeforeVat + $transportCharges;
        $this->total_vat = $totalVat + $transportVat;
        $this->grand_total = $this->total_before_vat + $this->total_vat;
        $this->total_amperes = $totalAmperes;

        $this->save();
    }

    /**
     * Get items with complete electrical specifications.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getItemsWithCompleteSpecs()
    {
        return $this->items->filter(fn($item) => $item->hasCompleteElectricalSpecs());
    }

    /**
     * Get items with incomplete electrical specifications.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getItemsWithIncompleteSpecs()
    {
        return $this->items->filter(fn($item) => $item->hasElectricalSpecs() && !$item->hasCompleteElectricalSpecs());
    }

    /**
     * Get items without any electrical specifications.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getItemsWithoutSpecs()
    {
        return $this->items->filter(fn($item) => !$item->hasElectricalSpecs());
    }

    /**
     * Check if quotation has any electrical specifications.
     *
     * @return bool
     */
    public function hasElectricalSpecs(): bool
    {
        return $this->items->contains(fn($item) => $item->hasElectricalSpecs());
    }

    /**
     * Get the discount amount (for display).
     *
     * @return float
     */
    public function getDiscountAmountAttribute(): float
    {
        return round($this->subtotal * ($this->discount_percentage / 100), 2);
    }

    /**
     * Get total taxable amount (after discount, before VAT).
     *
     * @return float
     */
    public function getTotalTaxableAmountAttribute(): float
    {
        return round($this->subtotal - $this->discount_amount, 2);
    }

    // Status checks
    public function isEditable(): bool
    {
        return in_array($this->status, [
            self::STATUS_DRAFT,
            self::STATUS_PENDING_REVIEW,
        ]);
    }

    public function canBeSent(): bool
    {
        return in_array($this->status, [
            self::STATUS_APPROVED,
            self::STATUS_SENT, // Can resend
        ]);
    }

    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_PENDING_REVIEW;
    }

    public function isExpired(): bool
    {
        return $this->valid_until && $this->valid_until->isPast();
    }

    // Change status with history
    public function changeStatus(string $newStatus, ?int $userId = null, ?string $notes = null, array $metadata = []): void
    {
        $oldStatus = $this->status;

        $this->status = $newStatus;

        // Set timestamps based on status
        switch ($newStatus) {
            case self::STATUS_APPROVED:
                $this->approved_at = now();
                $this->approved_by = $userId;
                break;
            case self::STATUS_SENT:
                $this->sent_at = now();
                break;
            case self::STATUS_ACCEPTED:
                $this->accepted_at = now();
                break;
            case self::STATUS_REJECTED:
                $this->rejected_at = now();
                break;
        }

        $this->save();

        // Record history
        $this->statusHistory()->create([
            'user_id' => $userId,
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'notes' => $notes,
            'action' => 'status_changed',
            'metadata' => $metadata,
        ]);
    }

    // Create new version
    public function createNewVersion(): Quotation
    {
        $newQuotation = $this->replicate();
        $newQuotation->parent_id = $this->parent_id ?? $this->id;
        $newQuotation->version = $this->version + 1;
        $newQuotation->status = self::STATUS_DRAFT;
        $newQuotation->quotation_number = self::generateQuotationNumber();
        $newQuotation->quotation_date = now();
        $newQuotation->valid_until = now()->addDays(
            (int) SystemSetting::getValue('quotation_validity_days', 30)
        );
        $newQuotation->approved_at = null;
        $newQuotation->approved_by = null;
        $newQuotation->sent_at = null;
        $newQuotation->sent_to_email = null;
        $newQuotation->accepted_at = null;
        $newQuotation->rejected_at = null;
        $newQuotation->rejection_reason = null;
        $newQuotation->pdf_path = null;
        $newQuotation->pdf_generated_at = null;
        $newQuotation->save();

        // Copy items
        foreach ($this->items as $item) {
            $newItem = $item->replicate();
            $newItem->quotation_id = $newQuotation->id;
            $newItem->save();
        }

        return $newQuotation;
    }

    // Scopes
    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeExpired($query)
    {
        return $query->where('valid_until', '<', now())
            ->whereNotIn('status', [self::STATUS_ACCEPTED, self::STATUS_REJECTED, self::STATUS_CANCELLED]);
    }

    public function scopeValidOnly($query)
    {
        return $query->where('valid_until', '>=', now());
    }
}

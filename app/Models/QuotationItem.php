<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'quotation_id',
        'product_id',
        'item_code',
        'name',
        'description',
        'unit',
        'unit_price',
        'quantity',
        'discount_percentage',
        'discount_amount',
        'vat_rate',
        'vat_amount',
        'vat_inclusive',
        'line_total_before_discount',
        'line_total_after_discount',
        'line_total_with_vat',
        'is_custom_item',
        'is_transport_item',
        'is_free',
        'sort_order',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'quantity' => 'decimal:3',
            'discount_percentage' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'vat_rate' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'vat_inclusive' => 'boolean',
            'line_total_before_discount' => 'decimal:2',
            'line_total_after_discount' => 'decimal:2',
            'line_total_with_vat' => 'decimal:2',
            'is_custom_item' => 'boolean',
            'is_transport_item' => 'boolean',
            'is_free' => 'boolean',
        ];
    }

    // Relationships
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Calculate line totals
    public function calculateTotals(): void
    {
        if ($this->is_free) {
            $this->line_total_before_discount = 0;
            $this->line_total_after_discount = 0;
            $this->vat_amount = 0;
            $this->line_total_with_vat = 0;
            $this->discount_amount = 0;
        } else {
            // Calculate base total
            $this->line_total_before_discount = $this->unit_price * $this->quantity;

            // Calculate discount
            if ($this->discount_percentage > 0) {
                $this->discount_amount = $this->unit_price * ($this->discount_percentage / 100);
            }

            $discountedUnitPrice = $this->unit_price - $this->discount_amount;
            $this->line_total_after_discount = $discountedUnitPrice * $this->quantity;

            // Calculate VAT
            if ($this->vat_inclusive) {
                // VAT is included in price, extract it
                $this->vat_amount = $this->line_total_after_discount - ($this->line_total_after_discount / (1 + ($this->vat_rate / 100)));
                $this->line_total_with_vat = $this->line_total_after_discount;
            } else {
                // VAT is added on top
                $this->vat_amount = $this->line_total_after_discount * ($this->vat_rate / 100);
                $this->line_total_with_vat = $this->line_total_after_discount + $this->vat_amount;
            }
        }

        $this->save();
    }

    // Boot method for auto-calculation
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            if ($item->is_free) {
                $item->line_total_before_discount = 0;
                $item->line_total_after_discount = 0;
                $item->vat_amount = 0;
                $item->line_total_with_vat = 0;
                $item->discount_amount = 0;
            } else {
                // Calculate base total
                $item->line_total_before_discount = $item->unit_price * $item->quantity;

                // Calculate discount
                if ($item->discount_percentage > 0) {
                    $item->discount_amount = $item->unit_price * ($item->discount_percentage / 100);
                }

                $discountedUnitPrice = $item->unit_price - $item->discount_amount;
                $item->line_total_after_discount = $discountedUnitPrice * $item->quantity;

                // Calculate VAT
                if ($item->vat_inclusive) {
                    $item->vat_amount = $item->line_total_after_discount - ($item->line_total_after_discount / (1 + ($item->vat_rate / 100)));
                    $item->line_total_with_vat = $item->line_total_after_discount;
                } else {
                    $item->vat_amount = $item->line_total_after_discount * ($item->vat_rate / 100);
                    $item->line_total_with_vat = $item->line_total_after_discount + $item->vat_amount;
                }
            }
        });

        static::saved(function ($item) {
            // Recalculate quotation totals
            if ($item->quotation) {
                $item->quotation->calculateTotals();
            }
        });

        static::deleted(function ($item) {
            // Recalculate quotation totals
            if ($item->quotation) {
                $item->quotation->calculateTotals();
            }
        });
    }

    // Create from product
    public static function createFromProduct(Product $product, Quotation $quotation, float $quantity = 1): self
    {
        return self::create([
            'quotation_id' => $quotation->id,
            'product_id' => $product->id,
            'item_code' => $product->sku,
            'name' => $product->name,
            'description' => $product->description,
            'unit' => $product->unit ?? 'Unit',
            'unit_price' => $product->price,
            'quantity' => $quantity,
            'discount_percentage' => 0,
            'vat_rate' => $quotation->default_vat_rate,
            'vat_inclusive' => $quotation->vat_inclusive,
            'is_custom_item' => false,
            'sort_order' => $quotation->items()->count(),
        ]);
    }

    // Create custom item
    public static function createCustomItem(Quotation $quotation, array $data): self
    {
        return self::create([
            'quotation_id' => $quotation->id,
            'product_id' => null,
            'item_code' => $data['item_code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'unit' => $data['unit'] ?? 'Unit',
            'unit_price' => $data['unit_price'],
            'quantity' => $data['quantity'] ?? 1,
            'discount_percentage' => $data['discount_percentage'] ?? 0,
            'vat_rate' => $data['vat_rate'] ?? $quotation->default_vat_rate,
            'vat_inclusive' => $data['vat_inclusive'] ?? $quotation->vat_inclusive,
            'is_custom_item' => true,
            'is_transport_item' => $data['is_transport_item'] ?? false,
            'is_free' => $data['is_free'] ?? false,
            'sort_order' => $quotation->items()->count(),
            'notes' => $data['notes'] ?? null,
        ]);
    }
}

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
        'original_name',
        'description',
        'image_url',
        'slug',
        'product_specifications',
        'unit',
        'unit_price',
        'quantity',
        'requested_quantity',
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
            'requested_quantity' => 'decimal:3',
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
            'product_specifications' => 'array',
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
    public static function createFromProduct(Product $product, Quotation $quotation, float $quantity = 1, array $additionalData = []): self
    {
        // Build product specifications from product data
        $specifications = self::buildSpecificationsFromProduct($product);

        return self::create([
            'quotation_id' => $quotation->id,
            'product_id' => $product->id,
            'item_code' => $product->sku,
            'name' => $product->name,
            'original_name' => $additionalData['original_name'] ?? null,
            'description' => $product->description,
            'image_url' => $product->image_url,
            'slug' => $product->slug,
            'product_specifications' => $specifications,
            'unit' => $product->unit ?? 'Unit',
            'unit_price' => $product->price,
            'quantity' => $quantity,
            'requested_quantity' => $additionalData['requested_quantity'] ?? null,
            'discount_percentage' => $additionalData['discount_percentage'] ?? 0,
            'vat_rate' => $quotation->default_vat_rate,
            'vat_inclusive' => $quotation->vat_inclusive,
            'is_custom_item' => false,
            'sort_order' => $quotation->items()->count(),
            'notes' => $additionalData['notes'] ?? null,
        ]);
    }

    /**
     * Build specifications array from product data.
     *
     * @param Product $product
     * @return array|null
     */
    protected static function buildSpecificationsFromProduct(Product $product): ?array
    {
        $specs = [];

        // Get from product's specifications JSON if available
        if ($product->specifications) {
            $productSpecs = $product->specifications;
            $specs['voltage'] = $productSpecs['voltage'] ?? null;
            $specs['power'] = $productSpecs['power'] ?? null;
            $specs['frequency'] = $productSpecs['frequency'] ?? null;
        }

        // Override with dedicated fields if they exist
        if ($product->voltage) {
            $specs['voltage'] = $product->voltage;
        }
        if ($product->power) {
            $specs['power'] = $product->power;
        }

        // Add dimensions
        if ($product->dimensions) {
            $specs['dimensions'] = $product->dimensions;
        }

        // Add weight
        if ($product->weight) {
            $specs['weight'] = $product->weight . ' ' . ($product->weight_unit ?? 'kg');
        }

        // Add spec sheet URL if available
        if ($product->spec_sheet_url) {
            $specs['spec_sheet_url'] = $product->spec_sheet_url;
        }

        return !empty($specs) ? $specs : null;
    }

    /**
     * Create from EKUEP API product data (array format).
     *
     * @param array $productData Product data from EKUEP API
     * @param Quotation $quotation
     * @param float $quantity
     * @param array $additionalData
     * @return self
     */
    public static function createFromApiProduct(array $productData, Quotation $quotation, float $quantity = 1, array $additionalData = []): self
    {
        // Build product specifications from API data
        $specifications = $productData['product_specifications'] ?? null;

        return self::create([
            'quotation_id' => $quotation->id,
            'product_id' => null, // External product, no local ID
            'item_code' => $productData['sku'] ?? $productData['external_reference'] ?? null,
            'name' => $productData['name'] ?? '',
            'original_name' => $additionalData['original_name'] ?? null,
            'description' => $productData['description'] ?? null,
            'image_url' => $productData['image_url'] ?? null,
            'slug' => $productData['slug'] ?? null,
            'product_specifications' => $specifications,
            'unit' => $productData['unit'] ?? 'Unit',
            'unit_price' => $productData['price'] ?? 0, // Base price (VAT exclusive)
            'quantity' => $quantity,
            'requested_quantity' => $additionalData['requested_quantity'] ?? null,
            'discount_percentage' => $additionalData['discount_percentage'] ?? 0,
            'vat_rate' => $quotation->default_vat_rate,
            'vat_inclusive' => $quotation->vat_inclusive,
            'is_custom_item' => false,
            'sort_order' => $quotation->items()->count(),
            'notes' => $additionalData['notes'] ?? null,
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
            'original_name' => $data['original_name'] ?? null,
            'description' => $data['description'] ?? null,
            'image_url' => $data['image_url'] ?? null,
            'slug' => $data['slug'] ?? null,
            'product_specifications' => $data['product_specifications'] ?? null,
            'unit' => $data['unit'] ?? 'Unit',
            'unit_price' => $data['unit_price'],
            'quantity' => $data['quantity'] ?? 1,
            'requested_quantity' => $data['requested_quantity'] ?? null,
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

    /**
     * Get the amperage for this item based on power and voltage specifications.
     *
     * @return float|null
     */
    public function getAmperageAttribute(): ?float
    {
        if (!$this->product_specifications) {
            return null;
        }

        $specs = $this->product_specifications;
        $power = $this->extractNumericValue($specs['power'] ?? null);
        $voltage = $this->extractNumericValue($specs['voltage'] ?? null);

        if ($power > 0 && $voltage > 0) {
            return round($power / $voltage, 2);
        }

        return null;
    }

    /**
     * Get total amperage for this item (amperage * quantity).
     *
     * @return float|null
     */
    public function getTotalAmperageAttribute(): ?float
    {
        $amperage = $this->amperage;

        if ($amperage === null) {
            return null;
        }

        return round($amperage * $this->quantity, 2);
    }

    /**
     * Check if this item has complete electrical specifications.
     *
     * @return bool
     */
    public function hasCompleteElectricalSpecs(): bool
    {
        if (!$this->product_specifications) {
            return false;
        }

        $specs = $this->product_specifications;

        return !empty($specs['power']) && !empty($specs['voltage']);
    }

    /**
     * Check if this item has any electrical specifications.
     *
     * @return bool
     */
    public function hasElectricalSpecs(): bool
    {
        if (!$this->product_specifications) {
            return false;
        }

        $specs = $this->product_specifications;

        return !empty($specs['power']) || !empty($specs['voltage']);
    }

    /**
     * Get formatted dimensions string.
     *
     * @return string|null
     */
    public function getFormattedDimensionsAttribute(): ?string
    {
        if (!$this->product_specifications) {
            return null;
        }

        $specs = $this->product_specifications;
        $dimensions = $specs['dimensions'] ?? null;

        if (!$dimensions) {
            return null;
        }

        $width = $this->extractNumericValue($dimensions['width'] ?? null);
        $length = $this->extractNumericValue($dimensions['length'] ?? null);
        $height = $this->extractNumericValue($dimensions['height'] ?? null);

        if ($width && $length && $height) {
            return "{$length} x {$width} x {$height}";
        }

        return null;
    }

    /**
     * Get the power requirement string with calculation.
     *
     * @return string|null
     */
    public function getPowerRequirementAttribute(): ?string
    {
        if (!$this->product_specifications) {
            return null;
        }

        $specs = $this->product_specifications;
        $power = $specs['power'] ?? null;
        $voltage = $specs['voltage'] ?? null;
        $amperage = $this->amperage;

        if ($power && $voltage && $amperage) {
            return "{$power} / {$voltage} = {$amperage} A";
        }

        return null;
    }

    /**
     * Extract numeric value from a string (handles ranges like "1800-2000").
     *
     * @param mixed $value
     * @return float
     */
    protected function extractNumericValue(mixed $value): float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }

        if (!is_string($value) || empty($value)) {
            return 0;
        }

        // Handle ranges like "1800-2000" - use higher end for safety
        if (preg_match('/(\d+)\s*-\s*(\d+)/', $value, $matches)) {
            return max((float) $matches[1], (float) $matches[2]);
        }

        // Extract first number found
        if (preg_match('/(\d+(?:\.\d+)?)/', $value, $matches)) {
            return (float) $matches[1];
        }

        return 0;
    }

    /**
     * Get the VAT-exclusive unit price.
     * If price is VAT-inclusive, remove VAT for display.
     *
     * @return float
     */
    public function getUnitPriceExclVatAttribute(): float
    {
        if ($this->vat_inclusive && $this->vat_rate > 0) {
            return round($this->unit_price / (1 + ($this->vat_rate / 100)), 2);
        }

        return (float) $this->unit_price;
    }

    /**
     * Get the line total excluding VAT.
     *
     * @return float
     */
    public function getLineTotalExclVatAttribute(): float
    {
        if ($this->vat_inclusive) {
            return round($this->line_total_after_discount / (1 + ($this->vat_rate / 100)), 2);
        }

        return (float) $this->line_total_after_discount;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'sku',
        'barcode',
        'external_id',
        'external_reference',
        'description',
        'short_description',
        'category',
        'subcategory',
        'brand',
        'tags',
        'price',
        'cost_price',
        'currency',
        'stock_quantity',
        'min_stock_quantity',
        'unit',
        'status',
        'is_featured',
        'image_path',
        'product_url',
        'spec_sheet_url',
        'gallery',
        'specifications',
        'dimensions',
        'weight',
        'weight_unit',
        'voltage',
        'power',
        'frequency',
        'meta_title',
        'meta_description',
        'created_by',
        'updated_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'gallery' => 'array',
            'specifications' => 'array',
            'dimensions' => 'array',
            'price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'weight' => 'decimal:2',
            'is_featured' => 'boolean',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
        });

        static::updating(function ($product) {
            if ($product->isDirty('name') && empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
        });
    }

    /**
     * Get the user who created the product.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the product.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the activity logs for the product.
     */
    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'subject');
    }

    /**
     * Get the image URL.
     */
    public function getImageUrlAttribute(): ?string
    {
        if ($this->image_path) {
            return \Storage::disk('public')->url($this->image_path);
        }

        return null;
    }

    /**
     * Get gallery URLs.
     */
    public function getGalleryUrlsAttribute(): array
    {
        if (!$this->gallery) {
            return [];
        }

        return array_map(function ($path) {
            return \Storage::disk('public')->url($path);
        }, $this->gallery);
    }

    /**
     * Check if product is low on stock.
     */
    public function isLowStock(): bool
    {
        return $this->stock_quantity <= $this->min_stock_quantity;
    }

    /**
     * Check if product is in stock.
     */
    public function isInStock(): bool
    {
        return $this->stock_quantity > 0;
    }

    /**
     * Get profit margin.
     */
    public function getProfitMarginAttribute(): ?float
    {
        if (!$this->cost_price || $this->cost_price == 0) {
            return null;
        }

        return (($this->price - $this->cost_price) / $this->cost_price) * 100;
    }

    /**
     * Scope to get active products.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to get featured products.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope to get low stock products.
     */
    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock_quantity', '<=', 'min_stock_quantity');
    }

    /**
     * Scope to filter by category.
     */
    public function scopeInCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope to search products.
     */
    public function scopeSearch($query, string $term)
    {
        return $query->whereRaw("MATCH(name, description, sku) AGAINST(? IN BOOLEAN MODE)", [$term]);
    }

    /**
     * Scope to search products by term (simpler version for LIKE queries).
     */
    public function scopeSearchTerm($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('sku', 'like', "%{$term}%")
              ->orWhere('external_reference', 'like', "%{$term}%")
              ->orWhere('barcode', 'like', "%{$term}%")
              ->orWhere('category', 'like', "%{$term}%");
        });
    }

    /**
     * Get the amperage for this product based on power and voltage.
     *
     * @return float|null
     */
    public function getAmperageAttribute(): ?float
    {
        $power = $this->extractNumericValue($this->power);
        $voltage = $this->extractNumericValue($this->voltage);

        if ($power > 0 && $voltage > 0) {
            return round($power / $voltage, 2);
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
     * Get formatted dimensions string.
     *
     * @return string|null
     */
    public function getFormattedDimensionsAttribute(): ?string
    {
        if (!$this->dimensions) {
            return null;
        }

        $dims = $this->dimensions;
        $width = $dims['width'] ?? null;
        $length = $dims['length'] ?? null;
        $height = $dims['height'] ?? null;

        if ($width && $length && $height) {
            return "{$length} x {$width} x {$height}";
        }

        return null;
    }

    /**
     * Check if product has electrical specifications.
     *
     * @return bool
     */
    public function hasElectricalSpecs(): bool
    {
        return !empty($this->power) || !empty($this->voltage);
    }

    /**
     * Get all electrical specifications as an array.
     *
     * @return array
     */
    public function getElectricalSpecsAttribute(): array
    {
        $specs = [];

        if ($this->voltage) {
            $specs['voltage'] = $this->voltage;
        }
        if ($this->power) {
            $specs['power'] = $this->power;
        }
        if ($this->frequency) {
            $specs['frequency'] = $this->frequency;
        }
        if ($this->dimensions) {
            $specs['dimensions'] = $this->dimensions;
        }
        if ($this->weight) {
            $specs['weight'] = $this->weight . ' ' . ($this->weight_unit ?? 'kg');
        }
        if ($this->spec_sheet_url) {
            $specs['spec_sheet_url'] = $this->spec_sheet_url;
        }

        return $specs;
    }

    /**
     * Get the power requirement string with calculation.
     *
     * @return string|null
     */
    public function getPowerRequirementAttribute(): ?string
    {
        $amperage = $this->amperage;

        if ($this->power && $this->voltage && $amperage) {
            return "{$this->power} / {$this->voltage} = {$amperage} A";
        }

        return null;
    }
}

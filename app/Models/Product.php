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
        'gallery',
        'specifications',
        'dimensions',
        'weight',
        'weight_unit',
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
}

# CORE MODULES - PRODUCTS, CLIENTS, PROFILE, ACTIVITY LOGS

## Module Overview

| Module | Description | Key Features |
|--------|-------------|--------------|
| Products | Product/inventory management | CRUD, Categories, Pricing, Import/Export |
| Clients | Customer management | CRUD, Types, Classification, Contacts |
| Profile | User profile management | Personal info, Signature, Preferences |
| Activity Logs | System-wide audit trail | Polymorphic logging, Filtering, Export |

---

# PRODUCTS MODULE

## Features
- Full CRUD operations
- Category and brand management
- Multiple pricing tiers (sale, rental daily/weekly/monthly)
- Image upload and gallery
- Inventory tracking
- Soft delete with restore
- CSV/Excel import
- Full-text search
- Advanced filtering

## Product Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

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
        'rental_price_daily',
        'rental_price_weekly',
        'rental_price_monthly',
        'currency',
        'quantity',
        'min_quantity',
        'max_quantity',
        'unit',
        'status',
        'is_featured',
        'is_rentable',
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

    protected $casts = [
        'tags' => 'array',
        'gallery' => 'array',
        'specifications' => 'array',
        'dimensions' => 'array',
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'rental_price_daily' => 'decimal:2',
        'rental_price_weekly' => 'decimal:2',
        'rental_price_monthly' => 'decimal:2',
        'weight' => 'decimal:2',
        'is_featured' => 'boolean',
        'is_rentable' => 'boolean',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function activityLogs()
    {
        return $this->morphMany(ActivityLog::class, 'subject');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeRentable($query)
    {
        return $query->where('is_rentable', true);
    }

    public function scopeInStock($query)
    {
        return $query->where('quantity', '>', 0);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('quantity', '<=', 'min_quantity')
                     ->where('quantity', '>', 0);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('sku', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%")
              ->orWhere('barcode', 'like', "%{$search}%");
        });
    }

    // Accessors
    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path
            ? asset('storage/' . $this->image_path)
            : null;
    }

    public function getIsLowStockAttribute(): bool
    {
        return $this->quantity <= $this->min_quantity && $this->quantity > 0;
    }

    public function getIsOutOfStockAttribute(): bool
    {
        return $this->quantity <= 0;
    }

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            if (auth()->check()) {
                $product->created_by = auth()->id();
            }
            if (empty($product->slug)) {
                $product->slug = \Str::slug($product->name);
            }
        });

        static::updating(function ($product) {
            if (auth()->check()) {
                $product->updated_by = auth()->id();
            }
        });
    }
}
```

## ProductController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Http\Requests\ProductRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        // Search
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('brand')) {
            $query->where('brand', $request->brand);
        }

        if ($request->boolean('low_stock')) {
            $query->lowStock();
        }

        if ($request->boolean('out_of_stock')) {
            $query->where('quantity', '<=', 0);
        }

        // Sorting
        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $products = $query->paginate(20)->withQueryString();

        // Get filter options
        $categories = Product::distinct()->pluck('category')->filter();
        $brands = Product::distinct()->pluck('brand')->filter();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'filters' => $request->only(['search', 'status', 'category', 'brand', 'sort', 'direction']),
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }

    public function create()
    {
        $categories = Product::distinct()->pluck('category')->filter();
        $brands = Product::distinct()->pluck('brand')->filter();

        return Inertia::render('Products/Create', [
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }

    public function store(ProductRequest $request)
    {
        $data = $request->validated();

        // Handle image upload
        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        // Handle gallery
        if ($request->hasFile('gallery_images')) {
            $gallery = [];
            foreach ($request->file('gallery_images') as $image) {
                $gallery[] = $image->store('products/gallery', 'public');
            }
            $data['gallery'] = $gallery;
        }

        $product = Product::create($data);

        return redirect()->route('products.index')
            ->with('success', 'Product created successfully.');
    }

    public function show(Product $product)
    {
        $product->load(['creator', 'updater']);

        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    public function edit(Product $product)
    {
        $categories = Product::distinct()->pluck('category')->filter();
        $brands = Product::distinct()->pluck('brand')->filter();

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }

    public function update(ProductRequest $request, Product $product)
    {
        $data = $request->validated();

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        $product->update($data);

        return redirect()->route('products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->route('products.index')
            ->with('success', 'Product deleted successfully.');
    }

    public function restore(int $id)
    {
        $product = Product::withTrashed()->findOrFail($id);
        $product->restore();

        return redirect()->route('products.index')
            ->with('success', 'Product restored successfully.');
    }

    public function toggleStatus(Product $product)
    {
        $newStatus = $product->status === 'active' ? 'inactive' : 'active';
        $product->update(['status' => $newStatus]);

        return back()->with('success', 'Product status updated.');
    }

    public function export(Request $request)
    {
        $query = Product::query();

        // Apply same filters as index
        if ($request->filled('search')) {
            $query->search($request->search);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $products = $query->get();

        $filename = 'products_' . now()->format('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($products) {
            $file = fopen('php://output', 'w');

            fputcsv($file, [
                'ID', 'Name', 'SKU', 'Category', 'Brand',
                'Price', 'Quantity', 'Status', 'Created At'
            ]);

            foreach ($products as $product) {
                fputcsv($file, [
                    $product->id,
                    $product->name,
                    $product->sku,
                    $product->category,
                    $product->brand,
                    $product->price,
                    $product->quantity,
                    $product->status,
                    $product->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
```

## Products/Index.tsx

```tsx
import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import Pagination from '@/Components/ui/Pagination';
import Badge from '@/Components/ui/Badge';

const statusColors = {
    active: 'green',
    inactive: 'yellow',
    discontinued: 'red',
};

export default function ProductsIndex({ products, filters, categories, brands }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/products', { ...filters, search: value }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/products', { ...filters, [key]: value }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this product?')) {
            router.delete(`/products/${id}`);
        }
    };

    return (
        <AppLayout>
            <Head title="Products" />

            <div className="space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                        <p className="text-gray-500 mt-1">
                            {products.total} products in your inventory
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href={`/products/export?${new URLSearchParams(filters).toString()}`}
                            className="btn btn-secondary"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                            Export
                        </a>
                        <Link href="/products/create" className="btn btn-primary">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Add Product
                        </Link>
                    </div>
                </motion.div>

                {/* Search & Filters */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="btn btn-secondary"
                        >
                            <FunnelIcon className="w-5 h-5 mr-2" />
                            Filters
                        </button>
                    </div>

                    {/* Expandable Filters */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4"
                            >
                                <select
                                    value={filters.status || ''}
                                    onChange={(e) => handleFilter('status', e.target.value)}
                                    className="input"
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="discontinued">Discontinued</option>
                                </select>

                                <select
                                    value={filters.category || ''}
                                    onChange={(e) => handleFilter('category', e.target.value)}
                                    className="input"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>

                                <select
                                    value={filters.brand || ''}
                                    onChange={(e) => handleFilter('brand', e.target.value)}
                                    className="input"
                                >
                                    <option value="">All Brands</option>
                                    {brands.map((brand) => (
                                        <option key={brand} value={brand}>{brand}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => router.get('/products')}
                                    className="btn btn-ghost"
                                >
                                    <ArrowPathIcon className="w-5 h-5 mr-2" />
                                    Clear Filters
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Products Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {products.data.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -4, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                        >
                            {/* Image */}
                            <div className="aspect-square bg-gray-100 relative">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                {/* Status Badge */}
                                <div className="absolute top-3 right-3">
                                    <Badge color={statusColors[product.status]}>
                                        {product.status}
                                    </Badge>
                                </div>

                                {/* Low Stock Warning */}
                                {product.is_low_stock && (
                                    <div className="absolute top-3 left-3">
                                        <Badge color="orange">Low Stock</Badge>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 truncate">
                                    {product.name}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    SKU: {product.sku || 'N/A'}
                                </p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-lg font-bold text-indigo-600">
                                        ${product.price}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {product.quantity} in stock
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 flex items-center gap-2">
                                    <Link
                                        href={`/products/${product.id}/edit`}
                                        className="flex-1 btn btn-sm btn-secondary"
                                    >
                                        <PencilSquareIcon className="w-4 h-4 mr-1" />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="btn btn-sm btn-danger"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Pagination */}
                <Pagination links={products.links} meta={products} />
            </div>
        </AppLayout>
    );
}
```

---

# CLIENTS MODULE

## Client Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

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

    protected $casts = [
        'billing_address' => 'array',
        'billing_address_same' => 'boolean',
        'credit_limit' => 'decimal:2',
    ];

    // Relationships
    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function activityLogs()
    {
        return $this->morphMany(ActivityLog::class, 'subject');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeCompanies($query)
    {
        return $query->where('type', 'company');
    }

    public function scopeIndividuals($query)
    {
        return $query->where('type', 'individual');
    }

    public function scopeVip($query)
    {
        return $query->where('classification', 'vip');
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('company_name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%")
              ->orWhere('phone', 'like', "%{$search}%")
              ->orWhere('contact_person', 'like', "%{$search}%");
        });
    }

    // Accessors
    public function getDisplayNameAttribute(): string
    {
        return $this->type === 'company' ? $this->company_name : $this->name;
    }

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

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($client) {
            if (auth()->check()) {
                $client->created_by = auth()->id();
            }
        });
    }
}
```

## ClientController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\User;
use App\Http\Requests\ClientRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::with(['assignedUser']);

        // Search
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filters
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('classification')) {
            $query->where('classification', $request->classification);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        // Sorting
        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $clients = $query->paginate(20)->withQueryString();

        // Get sales users for filter
        $salesUsers = User::whereHas('role', function ($q) {
            $q->whereIn('slug', ['superadmin', 'admin', 'sales']);
        })->select('id', 'name')->get();

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'filters' => $request->only(['search', 'type', 'status', 'classification', 'assigned_to']),
            'salesUsers' => $salesUsers,
        ]);
    }

    public function create()
    {
        $salesUsers = User::whereHas('role', function ($q) {
            $q->whereIn('slug', ['superadmin', 'admin', 'sales']);
        })->select('id', 'name')->get();

        return Inertia::render('Clients/Create', [
            'salesUsers' => $salesUsers,
        ]);
    }

    public function store(ClientRequest $request)
    {
        Client::create($request->validated());

        return redirect()->route('clients.index')
            ->with('success', 'Client created successfully.');
    }

    public function show(Client $client)
    {
        $client->load(['assignedUser', 'creator', 'activityLogs' => function ($query) {
            $query->latest()->limit(10);
        }]);

        return Inertia::render('Clients/Show', [
            'client' => $client,
        ]);
    }

    public function edit(Client $client)
    {
        $salesUsers = User::whereHas('role', function ($q) {
            $q->whereIn('slug', ['superadmin', 'admin', 'sales']);
        })->select('id', 'name')->get();

        return Inertia::render('Clients/Edit', [
            'client' => $client,
            'salesUsers' => $salesUsers,
        ]);
    }

    public function update(ClientRequest $request, Client $client)
    {
        $client->update($request->validated());

        return redirect()->route('clients.index')
            ->with('success', 'Client updated successfully.');
    }

    public function destroy(Client $client)
    {
        $client->delete();

        return redirect()->route('clients.index')
            ->with('success', 'Client deleted successfully.');
    }
}
```

---

# PROFILE MODULE

## ProfileController.php

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function edit(Request $request)
    {
        $user = $request->user()->load('profile');

        return Inertia::render('Profile/Edit', [
            'user' => $user,
        ]);
    }

    public function update(ProfileUpdateRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        // Update user
        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        // Update or create profile
        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'company_name' => $validated['company_name'] ?? null,
                'job_title' => $validated['job_title'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'mobile' => $validated['mobile'] ?? null,
                'address' => $validated['address'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'country' => $validated['country'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
                'timezone' => $validated['timezone'] ?? 'UTC',
            ]
        );

        return back()->with('success', 'Profile updated successfully.');
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'], // 2MB max
        ]);

        $user = $request->user();

        // Delete old avatar
        if ($user->profile?->avatar_path) {
            Storage::disk('public')->delete($user->profile->avatar_path);
        }

        // Store new avatar
        $path = $request->file('avatar')->store('avatars', 'public');

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            ['avatar_path' => $path]
        );

        return back()->with('success', 'Avatar updated successfully.');
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->letters()->mixedCase()->numbers()->symbols(),
            ],
        ]);

        $request->user()->update([
            'password' => Hash::make($request->password),
        ]);

        return back()->with('success', 'Password updated successfully.');
    }

    public function updateSignature(Request $request)
    {
        $request->validate([
            'signature_html' => ['nullable', 'string', 'max:10000'],
        ]);

        $request->user()->update([
            'signature_html' => $request->signature_html,
        ]);

        return back()->with('success', 'Email signature updated successfully.');
    }
}
```

## Profile/Edit.tsx

```tsx
import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserCircleIcon,
    KeyIcon,
    EnvelopeIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import SignatureEditor from '@/Components/forms/SignatureEditor';

const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'password', name: 'Password', icon: KeyIcon },
    { id: 'signature', name: 'Email Signature', icon: EnvelopeIcon },
];

export default function ProfileEdit({ user }) {
    const [activeTab, setActiveTab] = useState('profile');
    const { flash } = usePage().props;

    // Profile form
    const profileForm = useForm({
        name: user.name,
        email: user.email,
        company_name: user.profile?.company_name || '',
        job_title: user.profile?.job_title || '',
        phone: user.profile?.phone || '',
        mobile: user.profile?.mobile || '',
        address: user.profile?.address || '',
        city: user.profile?.city || '',
        state: user.profile?.state || '',
        country: user.profile?.country || '',
        postal_code: user.profile?.postal_code || '',
        timezone: user.profile?.timezone || 'UTC',
    });

    // Password form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Signature form
    const signatureForm = useForm({
        signature_html: user.signature_html || '',
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.patch('/profile');
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.put('/profile/password', {
            onSuccess: () => passwordForm.reset(),
        });
    };

    const handleSignatureSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        signatureForm.put('/profile/signature');
    };

    return (
        <AppLayout>
            <Head title="Profile Settings" />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
                </motion.div>

                {/* Success Message */}
                <AnimatePresence>
                    {flash.success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
                        >
                            <p className="text-green-700">{flash.success}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <tab.icon className="w-5 h-5 mr-2" />
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <motion.form
                                    key="profile"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleProfileSubmit}
                                    className="space-y-6"
                                >
                                    {/* Avatar */}
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            {user.profile?.avatar_path ? (
                                                <img
                                                    src={`/storage/${user.profile.avatar_path}`}
                                                    alt={user.name}
                                                    className="w-24 h-24 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <span className="text-3xl font-bold text-indigo-600">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="btn btn-secondary cursor-pointer">
                                                <PhotoIcon className="w-5 h-5 mr-2" />
                                                Change Avatar
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            const formData = new FormData();
                                                            formData.append('avatar', e.target.files[0]);
                                                            router.post('/profile/avatar', formData);
                                                        }
                                                    }}
                                                />
                                            </label>
                                            <p className="text-xs text-gray-500 mt-2">
                                                JPG, PNG or GIF. Max 2MB.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="label">Full Name</label>
                                            <input
                                                type="text"
                                                value={profileForm.data.name}
                                                onChange={(e) => profileForm.setData('name', e.target.value)}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Email Address</label>
                                            <input
                                                type="email"
                                                value={profileForm.data.email}
                                                onChange={(e) => profileForm.setData('email', e.target.value)}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Company Name</label>
                                            <input
                                                type="text"
                                                value={profileForm.data.company_name}
                                                onChange={(e) => profileForm.setData('company_name', e.target.value)}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Job Title</label>
                                            <input
                                                type="text"
                                                value={profileForm.data.job_title}
                                                onChange={(e) => profileForm.setData('job_title', e.target.value)}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Phone</label>
                                            <input
                                                type="text"
                                                value={profileForm.data.phone}
                                                onChange={(e) => profileForm.setData('phone', e.target.value)}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Mobile</label>
                                            <input
                                                type="text"
                                                value={profileForm.data.mobile}
                                                onChange={(e) => profileForm.setData('mobile', e.target.value)}
                                                className="input"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={profileForm.processing}
                                            className="btn btn-primary"
                                        >
                                            {profileForm.processing ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </motion.form>
                            )}

                            {/* Password Tab */}
                            {activeTab === 'password' && (
                                <motion.form
                                    key="password"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handlePasswordSubmit}
                                    className="space-y-6 max-w-md"
                                >
                                    <div>
                                        <label className="label">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.data.current_password}
                                            onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                            className="input"
                                        />
                                        {passwordForm.errors.current_password && (
                                            <p className="text-red-600 text-sm mt-1">
                                                {passwordForm.errors.current_password}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="label">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.data.password}
                                            onChange={(e) => passwordForm.setData('password', e.target.value)}
                                            className="input"
                                        />
                                        {passwordForm.errors.password && (
                                            <p className="text-red-600 text-sm mt-1">
                                                {passwordForm.errors.password}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="label">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.data.password_confirmation}
                                            onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                            className="input"
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={passwordForm.processing}
                                            className="btn btn-primary"
                                        >
                                            {passwordForm.processing ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                </motion.form>
                            )}

                            {/* Signature Tab */}
                            {activeTab === 'signature' && (
                                <motion.form
                                    key="signature"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleSignatureSubmit}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="label">Email Signature</label>
                                        <p className="text-sm text-gray-500 mb-3">
                                            This signature will be appended to emails you send.
                                        </p>
                                        <SignatureEditor
                                            value={signatureForm.data.signature_html}
                                            onChange={(html) => signatureForm.setData('signature_html', html)}
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={signatureForm.processing}
                                            className="btn btn-primary"
                                        >
                                            {signatureForm.processing ? 'Saving...' : 'Save Signature'}
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
```

---

# ACTIVITY LOGS MODULE

## ActivityLog Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'log_name',
        'event',
        'description',
        'subject_type',
        'subject_id',
        'causer_type',
        'causer_id',
        'properties',
        'changes',
        'module',
        'ip_address',
        'user_agent',
        'url',
        'method',
    ];

    protected $casts = [
        'properties' => 'array',
        'changes' => 'array',
    ];

    // Polymorphic relationships
    public function subject()
    {
        return $this->morphTo();
    }

    public function causer()
    {
        return $this->morphTo();
    }

    // Scopes
    public function scopeForSubject($query, $model)
    {
        return $query->where('subject_type', get_class($model))
                     ->where('subject_id', $model->id);
    }

    public function scopeByCauser($query, $user)
    {
        return $query->where('causer_type', get_class($user))
                     ->where('causer_id', $user->id);
    }

    public function scopeInModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    public function scopeWithEvent($query, string $event)
    {
        return $query->where('event', $event);
    }
}
```

## ActivityLogService

```php
<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class ActivityLogService
{
    public static function log(
        string $event,
        string $description,
        ?Model $subject = null,
        array $properties = [],
        array $changes = [],
        ?string $module = null
    ): ActivityLog {
        $causer = auth()->user();

        return ActivityLog::create([
            'log_name' => 'default',
            'event' => $event,
            'description' => $description,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject?->id,
            'causer_type' => $causer ? get_class($causer) : null,
            'causer_id' => $causer?->id,
            'properties' => $properties,
            'changes' => $changes,
            'module' => $module ?? static::guessModule($subject),
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'url' => Request::fullUrl(),
            'method' => Request::method(),
        ]);
    }

    protected static function guessModule(?Model $subject): ?string
    {
        if (!$subject) {
            return null;
        }

        $className = class_basename($subject);

        return match ($className) {
            'User' => 'users',
            'Product' => 'products',
            'Client' => 'clients',
            'Role' => 'roles',
            default => strtolower($className) . 's',
        };
    }
}

// Helper function
if (!function_exists('activity_log')) {
    function activity_log(
        string $event,
        string $description,
        $subject = null,
        array $properties = [],
        array $changes = [],
        ?string $module = null
    ) {
        return \App\Services\ActivityLogService::log(
            $event,
            $description,
            $subject,
            $properties,
            $changes,
            $module
        );
    }
}
```

## ActivityLogController

```php
<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with(['causer', 'subject'])
            ->orderBy('created_at', 'desc');

        // Filter by module
        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        // Filter by event
        if ($request->filled('event')) {
            $query->where('event', $request->event);
        }

        // Filter by user
        if ($request->filled('user_id')) {
            $query->where('causer_id', $request->user_id)
                  ->where('causer_type', User::class);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate(50)->withQueryString();

        // Get filter options
        $modules = ActivityLog::distinct()->pluck('module')->filter();
        $events = ActivityLog::distinct()->pluck('event');
        $users = User::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('ActivityLogs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['module', 'event', 'user_id', 'date_from', 'date_to']),
            'modules' => $modules,
            'events' => $events,
            'users' => $users,
        ]);
    }

    public function export(Request $request)
    {
        $query = ActivityLog::with(['causer'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->get();

        $filename = 'activity_logs_' . now()->format('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($logs) {
            $file = fopen('php://output', 'w');

            fputcsv($file, [
                'Date', 'User', 'Event', 'Description', 'Module', 'IP Address'
            ]);

            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->created_at->format('Y-m-d H:i:s'),
                    $log->causer?->name ?? 'System',
                    $log->event,
                    $log->description,
                    $log->module,
                    $log->ip_address,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
```

---

## Routes Summary

```php
// routes/web.php

Route::middleware(['auth'])->group(function () {

    // Products
    Route::middleware(['permission:products.view'])->group(function () {
        Route::get('/products', [ProductController::class, 'index'])->name('products.index');
        Route::get('/products/export', [ProductController::class, 'export'])->name('products.export');
        Route::get('/products/create', [ProductController::class, 'create'])->middleware('permission:products.create');
        Route::post('/products', [ProductController::class, 'store'])->middleware('permission:products.create');
        Route::get('/products/{product}', [ProductController::class, 'show']);
        Route::get('/products/{product}/edit', [ProductController::class, 'edit'])->middleware('permission:products.edit');
        Route::put('/products/{product}', [ProductController::class, 'update'])->middleware('permission:products.edit');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])->middleware('permission:products.delete');
        Route::post('/products/{product}/restore', [ProductController::class, 'restore'])->middleware('permission:products.restore');
        Route::patch('/products/{product}/toggle-status', [ProductController::class, 'toggleStatus'])->middleware('permission:products.toggle-status');
    });

    // Clients
    Route::middleware(['permission:clients.view'])->group(function () {
        Route::resource('clients', ClientController::class);
    });

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::put('/profile/signature', [ProfileController::class, 'updateSignature']);

    // Activity Logs
    Route::middleware(['permission:activity.view'])->group(function () {
        Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');
        Route::get('/activity-logs/export', [ActivityLogController::class, 'export'])->name('activity-logs.export');
    });
});
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-09
**Modules:** Products, Clients, Profile, Activity Logs

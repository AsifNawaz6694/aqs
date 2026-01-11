# MODULE 04: PRODUCTS

## TABLE OF CONTENTS
```
1. Module Overview
2. Database Design
3. Backend Architecture
4. Frontend Implementation
5. File Upload (S3)
6. Import/Export
7. Routes Configuration
8. Implementation Guide
```

---

## 1. MODULE OVERVIEW

### 1.1 Purpose
The Products module manages the rental equipment catalog. It provides comprehensive product management including creation, editing, searching, filtering, status management, soft delete/restore, and CSV export capabilities.

### 1.2 Features
- Product CRUD operations
- Product image upload to AWS S3
- Multi-field search (title, item code, description, category)
- Advanced filtering (status, product type, category, price range)
- Soft delete with restore capability
- CSV export with applied filters
- Status toggle (active/inactive)
- Pagination with configurable page size
- Activity logging for all operations

### 1.3 Access Control
```yaml
Required Permissions:
  - products.view: View product list
  - products.create: Create new products
  - products.edit: Edit existing products
  - products.delete: Delete products (soft delete)
  - products.restore: Restore deleted products
  - products.toggle-status: Toggle active/inactive status
  - products.import: Import products from file
```

### 1.4 Product Types
| Type | Slug | Description |
|------|------|-------------|
| EKUEP Fulfilled | ekuep_fulfilled | Products fulfilled by EKUEP |
| MP Supplier | mp_supplier | Products from marketplace suppliers |

---

## 2. DATABASE DESIGN

### 2.1 Products Table

#### Table: `products`
```sql
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Basic Information
    title VARCHAR(255) NOT NULL,
    item_code VARCHAR(255) NOT NULL UNIQUE,
    description_english TEXT NOT NULL,
    description_arabic TEXT NULL,

    -- Categorization
    product_type ENUM('ekuep_fulfilled', 'mp_supplier') DEFAULT 'ekuep_fulfilled',
    main_category VARCHAR(255) NULL,
    sub_category VARCHAR(255) NULL,

    -- Pricing
    ekuep_selling_price DECIMAL(10,2) DEFAULT 0,
    daily_rate DECIMAL(10,2) DEFAULT 0,
    daily_cost DECIMAL(10,2) NULL,
    item_cost DECIMAL(10,2) NULL,
    cost_price DECIMAL(10,2) NULL,
    rent_price DECIMAL(10,2) NULL,
    avg_daily_rate DECIMAL(10,2) NULL,
    avg_rental_period DECIMAL(10,2) NULL,

    -- Inventory
    fixed_assets_count INT DEFAULT 0,
    times_quoted INT DEFAULT 0,
    is_available TINYINT(1) DEFAULT 1,
    warehouse_status VARCHAR(255) NULL,
    warehouse_id INT NULL,
    store_id INT NULL,

    -- Technical Specifications
    phase VARCHAR(50) NULL,
    voltage INT NULL,
    amps INT NULL,
    kw DECIMAL(10,2) NULL,

    -- Media
    picture VARCHAR(500) NULL,

    -- Status
    status ENUM('active', 'inactive') DEFAULT 'active',

    -- Timestamps
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,

    -- Indexes
    INDEX products_item_code_index (item_code),
    INDEX products_status_index (status),
    INDEX products_product_type_index (product_type),
    INDEX products_main_category_index (main_category),
    INDEX products_deleted_at_index (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 Field Specifications

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary identifier |
| title | VARCHAR(255) | NOT NULL | Product display title |
| item_code | VARCHAR(255) | NOT NULL, UNIQUE | Unique product code |
| description_english | TEXT | NOT NULL | English description |
| description_arabic | TEXT | NULL | Arabic description |
| product_type | ENUM | DEFAULT 'ekuep_fulfilled' | Product fulfillment type |
| main_category | VARCHAR(255) | NULL | Main product category |
| sub_category | VARCHAR(255) | NULL | Sub category |
| ekuep_selling_price | DECIMAL(10,2) | DEFAULT 0 | EKUEP selling price |
| daily_rate | DECIMAL(10,2) | DEFAULT 0 | Daily rental rate |
| daily_cost | DECIMAL(10,2) | NULL | Daily cost |
| item_cost | DECIMAL(10,2) | NULL | Item cost |
| cost_price | DECIMAL(10,2) | NULL | Cost price |
| rent_price | DECIMAL(10,2) | NULL | Rent price |
| avg_daily_rate | DECIMAL(10,2) | NULL | Average daily rate |
| avg_rental_period | DECIMAL(10,2) | NULL | Average rental period |
| fixed_assets_count | INT | DEFAULT 0 | Number of fixed assets |
| times_quoted | INT | DEFAULT 0 | Number of times quoted |
| is_available | TINYINT(1) | DEFAULT 1 | Availability flag |
| warehouse_status | VARCHAR(255) | NULL | Warehouse status |
| warehouse_id | INT | NULL | Reference to warehouse |
| store_id | INT | NULL | Reference to store |
| phase | VARCHAR(50) | NULL | Electrical phase |
| voltage | INT | NULL | Voltage specification |
| amps | INT | NULL | Amperage specification |
| kw | DECIMAL(10,2) | NULL | Kilowatt rating |
| picture | VARCHAR(500) | NULL | S3 image URL |
| status | ENUM | DEFAULT 'active' | Product status |
| deleted_at | TIMESTAMP | NULL | Soft delete timestamp |

### 2.3 Migrations

#### Migration: `2025_06_23_105743_create_products_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductsTable extends Migration
{
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('item_code')->unique();
            $table->text('description_english');
            $table->text('description_arabic')->nullable();
            $table->string('main_category')->nullable();
            $table->string('sub_category')->nullable();
            $table->decimal('ekuep_selling_price', 10, 2)->default(0);
            $table->integer('fixed_assets_count')->default(0);
            $table->decimal('avg_rental_period', 10, 2)->nullable();
            $table->decimal('avg_daily_rate', 10, 2)->nullable();
            $table->decimal('daily_rate', 10, 2)->default(0);
            $table->decimal('daily_cost', 10, 2)->nullable();
            $table->decimal('item_cost', 10, 2)->nullable();
            $table->integer('times_quoted')->default(0);
            $table->string('phase')->nullable();
            $table->integer('voltage')->nullable();
            $table->integer('amps')->nullable();
            $table->decimal('kw', 10, 2)->nullable();
            $table->string('picture', 500)->nullable();
            $table->string('warehouse_status')->nullable();
            $table->integer('warehouse_id')->nullable();
            $table->integer('store_id')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('products');
    }
}
```

#### Migration: `2025_06_25_000000_add_title_to_products_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTitleToProductsTable extends Migration
{
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('title')->after('id');
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('title');
        });
    }
}
```

#### Migration: `2025_06_25_073551_add_status_to_products_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddStatusToProductsTable extends Migration
{
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active')->after('picture');
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
}
```

#### Migration: `2025_06_25_101600_add_deleted_at_to_products_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDeletedAtToProductsTable extends Migration
{
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
}
```

#### Migration: `2026_01_05_070243_add_product_type_to_products_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddProductTypeToProductsTable extends Migration
{
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->enum('product_type', ['ekuep_fulfilled', 'mp_supplier'])
                  ->default('ekuep_fulfilled')
                  ->after('title');
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('product_type');
        });
    }
}
```

---

## 3. BACKEND ARCHITECTURE

### 3.1 Model: Product.php

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
        'title',
        'item_code',
        'product_type',
        'description_english',
        'description_arabic',
        'main_category',
        'sub_category',
        'ekuep_selling_price',
        'fixed_assets_count',
        'avg_rental_period',
        'avg_daily_rate',
        'daily_rate',
        'daily_cost',
        'item_cost',
        'cost_price',
        'rent_price',
        'times_quoted',
        'phase',
        'voltage',
        'amps',
        'kw',
        'is_available',
        'warehouse_status',
        'warehouse_id',
        'store_id',
        'picture',
        'status',
    ];

    protected $casts = [
        'ekuep_selling_price' => 'decimal:2',
        'daily_rate' => 'decimal:2',
        'daily_cost' => 'decimal:2',
        'item_cost' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'rent_price' => 'decimal:2',
        'avg_daily_rate' => 'decimal:2',
        'avg_rental_period' => 'decimal:2',
        'kw' => 'decimal:2',
        'fixed_assets_count' => 'integer',
        'times_quoted' => 'integer',
        'voltage' => 'integer',
        'amps' => 'integer',
        'is_available' => 'boolean',
    ];

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Scope to filter active products
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to filter inactive products
     */
    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    /**
     * Scope to filter available products
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    /**
     * Scope to filter by category
     */
    public function scopeInCategory($query, $mainCategory, $subCategory = null)
    {
        $query->where('main_category', $mainCategory);

        if ($subCategory) {
            $query->where('sub_category', $subCategory);
        }

        return $query;
    }

    /**
     * Scope to filter by product type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('product_type', $type);
    }

    // ============================================
    // ACCESSORS
    // ============================================

    /**
     * Get formatted daily rate
     */
    public function getFormattedDailyRateAttribute()
    {
        return 'SAR ' . number_format($this->daily_rate, 2);
    }

    /**
     * Get status badge color
     */
    public function getStatusColorAttribute()
    {
        return $this->status === 'active' ? 'green' : 'red';
    }
}
```

### 3.2 Controller: ProductController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Validation\Rule;

class ProductController extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    // ============================================
    // INDEX - LIST PRODUCTS
    // ============================================

    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);
        $trashed = $request->input('trashed', '');
        $status = $request->input('status', '');
        $productType = $request->input('product_type', '');
        $mainCategory = $request->input('main_category', '');
        $subCategory = $request->input('sub_category', '');
        $priceMin = $request->input('price_min', '');
        $priceMax = $request->input('price_max', '');

        // Build query
        $query = Product::when($trashed === 'only', function ($query) {
            return $query->onlyTrashed();
        });

        // Search filter
        if (!empty($search)) {
            $searchPattern = '%' . strtolower($search) . '%';

            $query->where(function ($query) use ($searchPattern) {
                $query->whereRaw("LOWER(title) LIKE ?", [$searchPattern])
                    ->orWhereRaw("LOWER(item_code) LIKE ?", [$searchPattern])
                    ->orWhereRaw("LOWER(description_english) LIKE ?", [$searchPattern])
                    ->orWhereRaw("LOWER(main_category) LIKE ?", [$searchPattern])
                    ->orWhereRaw("LOWER(sub_category) LIKE ?", [$searchPattern])
                    ->orWhereRaw("CAST(daily_rate AS CHAR) LIKE ?", [$searchPattern]);
            });
        }

        // Status filter
        if ($status) {
            $query->where('status', $status);
        }

        // Product type filter
        if ($productType) {
            $query->where('product_type', $productType);
        }

        // Category filters
        if ($mainCategory) {
            $query->where('main_category', $mainCategory);
        }
        if ($subCategory) {
            $query->where('sub_category', $subCategory);
        }

        // Price range filters
        if ($priceMin !== '') {
            $query->where('daily_rate', '>=', $priceMin);
        }
        if ($priceMax !== '') {
            $query->where('daily_rate', '<=', $priceMax);
        }

        // Limit per page
        $maxPerPage = 100;
        $perPage = min($perPage, $maxPerPage);

        // Paginate
        $products = $query->latest()
            ->paginate($perPage, ['*'], 'page', $page)
            ->withQueryString();

        // Get categories for filter dropdowns
        $categories = Product::select('main_category', 'sub_category')
            ->whereNotNull('main_category')
            ->distinct()
            ->get();

        $mainCategories = $categories->pluck('main_category')->unique()->filter()->values();
        $subCategories = $categories->pluck('sub_category')->unique()->filter()->values();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'filters' => [
                'search' => $search,
                'trashed' => $trashed,
                'status' => $status,
                'product_type' => $productType,
                'main_category' => $mainCategory,
                'sub_category' => $subCategory,
                'price_min' => $priceMin,
                'price_max' => $priceMax,
            ],
            'mainCategories' => $mainCategories,
            'subCategories' => $subCategories,
        ]);
    }

    // ============================================
    // CREATE - SHOW CREATE FORM
    // ============================================

    public function create()
    {
        return Inertia::render('Products/Create');
    }

    // ============================================
    // STORE - CREATE NEW PRODUCT
    // ============================================

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_type' => ['required', 'in:ekuep_fulfilled,mp_supplier'],
            'title' => ['required', 'string', 'max:255'],
            'item_code' => ['required', 'string', 'unique:products'],
            'description_english' => ['required', 'string'],
            'description_arabic' => ['nullable', 'string'],
            'main_category' => ['required', 'string'],
            'sub_category' => ['required', 'string'],
            'ekuep_selling_price' => ['required', 'numeric', 'min:0'],
            'fixed_assets_count' => ['nullable', 'integer', 'min:0'],
            'avg_rental_period' => ['nullable', 'numeric', 'min:0'],
            'avg_daily_rate' => ['nullable', 'numeric', 'min:0'],
            'daily_rate' => ['required', 'numeric', 'min:0'],
            'daily_cost' => ['nullable', 'numeric', 'min:0'],
            'item_cost' => ['nullable', 'numeric', 'min:0'],
            'phase' => ['nullable', 'string'],
            'voltage' => ['nullable', 'integer', 'min:0'],
            'amps' => ['nullable', 'integer', 'min:0'],
            'kw' => ['nullable', 'numeric', 'min:0'],
            'is_available' => ['nullable', 'in:true,false,0,1,on,off'],
            'warehouse_status' => ['nullable', 'string'],
            'picture' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,svg', 'max:2048'],
            'warehouse_id' => ['nullable', 'integer'],
            'store_id' => ['nullable', 'integer'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'rent_price' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'in:active,inactive']
        ], [
            'status.in' => 'The status must be either active or inactive.',
            'picture.required' => 'Please upload a product image.',
            'picture.image' => 'The file must be an image.',
            'picture.mimes' => 'The image must be a file of type: jpeg, png, jpg, gif, svg.',
            'picture.max' => 'The image must not be larger than 2MB.',
        ]);

        try {
            // Convert is_available to boolean
            if (isset($validated['is_available'])) {
                $validated['is_available'] = filter_var($validated['is_available'], FILTER_VALIDATE_BOOLEAN);
            } else {
                $validated['is_available'] = true;
            }

            // Handle file upload to S3
            if ($request->hasFile('picture')) {
                $file = $request->file('picture');
                $fileName = 'products/' . uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $s3path = $file->storeAs('RQS/Product_Images', $fileName, 's3');
                Storage::disk('s3')->setVisibility($s3path, 'public');
                $product_image = Storage::disk('s3')->url($s3path);
                $validated['picture'] = $product_image;
            }

            // Set default values
            $validated['times_quoted'] = 0;

            // Create the product
            Product::create($validated);

            return redirect()->route('products.index')
                ->with('success', 'Product created successfully.');

        } catch (\Exception $e) {
            // Delete the uploaded file if there was an error
            if (isset($fileName) && Storage::disk('s3')->exists($fileName)) {
                Storage::disk('s3')->delete($fileName);
            }

            return redirect()->back()
                ->withInput()
                ->withErrors(['error' => 'Error creating product: ' . $e->getMessage()]);
        }
    }

    // ============================================
    // EDIT - SHOW EDIT FORM
    // ============================================

    public function edit($id)
    {
        $product = Product::findOrFail($id);
        return Inertia::render('Products/EditPage', [
            'product' => $product
        ]);
    }

    // ============================================
    // UPDATE - UPDATE PRODUCT
    // ============================================

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validationRules = [
            'product_type' => ['required', 'in:ekuep_fulfilled,mp_supplier'],
            'title' => ['required', 'string', 'max:255'],
            'item_code' => ['required', 'string', Rule::unique('products')->ignore($id)],
            'description_english' => ['required', 'string'],
            'description_arabic' => ['nullable', 'string'],
            'main_category' => ['required', 'string'],
            'sub_category' => ['required', 'string'],
            'ekuep_selling_price' => ['required', 'numeric', 'min:0'],
            'fixed_assets_count' => ['nullable', 'integer', 'min:0'],
            'avg_rental_period' => ['nullable', 'numeric', 'min:0'],
            'avg_daily_rate' => ['nullable', 'numeric', 'min:0'],
            'daily_rate' => ['required', 'numeric', 'min:0'],
            'daily_cost' => ['nullable', 'numeric', 'min:0'],
            'item_cost' => ['nullable', 'numeric', 'min:0'],
            'phase' => ['nullable', 'string'],
            'voltage' => ['nullable', 'integer', 'min:0'],
            'amps' => ['nullable', 'integer', 'min:0'],
            'kw' => ['nullable', 'numeric', 'min:0'],
            'is_available' => ['required', 'in:1,0,true,false,on,off'],
            'warehouse_status' => ['nullable', 'string'],
            'warehouse_id' => ['nullable', 'integer'],
            'store_id' => ['nullable', 'integer'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'rent_price' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'in:active,inactive'],
            'picture' => ['nullable', 'string']
        ];

        // Add file validation if a file is being uploaded
        if ($request->hasFile('picture_file')) {
            $validationRules['picture_file'] = ['image', 'mimes:jpeg,png,jpg,gif,svg', 'max:2048'];
        }

        // Merge existing product data for validation
        $request->mergeIfMissing([
            'product_type' => $product->product_type ?? 'ekuep_fulfilled',
            'title' => $product->title,
            'item_code' => $product->item_code,
            'description_english' => $product->description_english,
            'description_arabic' => $product->description_arabic,
            'main_category' => $product->main_category,
            'sub_category' => $product->sub_category,
            'ekuep_selling_price' => $product->ekuep_selling_price,
            'daily_rate' => $product->daily_rate,
            'is_available' => $product->is_available ? '1' : '0',
            'status' => $product->status,
            'picture' => $product->picture
        ]);

        $validated = $request->validate($validationRules);

        // Handle file upload if present
        if ($request->hasFile('picture_file')) {
            try {
                // Delete old image if it exists
                if ($product->picture) {
                    $oldImagePath = parse_url($product->picture, PHP_URL_PATH);
                    $oldImagePath = ltrim($oldImagePath, '/');
                    if (Storage::disk('s3')->exists($oldImagePath)) {
                        Storage::disk('s3')->delete($oldImagePath);
                    }
                }

                // Upload new image
                $file = $request->file('picture_file');
                $fileName = 'products/' . uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $s3path = $file->storeAs('RQS/Product_Images', $fileName, 's3');
                Storage::disk('s3')->setVisibility($s3path, 'public');
                $validated['picture'] = Storage::disk('s3')->url($s3path);

            } catch (\Exception $e) {
                return redirect()->back()->with('error', 'Failed to upload image: ' . $e->getMessage());
            }
        } else {
            $validated['picture'] = $product->picture;
        }

        // Convert is_available to boolean
        $validated['is_available'] = in_array($request->input('is_available'), ['1', 1, 'true', 'on', true]);

        try {
            \DB::beginTransaction();
            $product->update($validated);
            \DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully',
                'data' => $product
            ]);

        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update product: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // DESTROY - DELETE PRODUCT (SOFT DELETE)
    // ============================================

    public function destroy($id)
    {
        try {
            $product = Product::findOrFail($id);
            $productTitle = $product->title;
            $product->delete();

            \Log::info('Product deleted successfully', [
                'product_id' => $id,
                'product_title' => $productTitle,
            ]);

            return redirect()->back()->with('success', 'Product moved to trash successfully.');
        } catch (\Exception $e) {
            \Log::error('Product deletion failed', [
                'product_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Error moving product to trash: ' . $e->getMessage());
        }
    }

    // ============================================
    // RESTORE - RESTORE DELETED PRODUCT
    // ============================================

    public function restore($id)
    {
        try {
            $product = Product::withTrashed()->findOrFail($id);
            $product->restore();

            \Log::info('Product restored successfully', [
                'product_id' => $id,
                'product_title' => $product->title,
            ]);

            return redirect()->back()->with('success', 'Product restored successfully.');
        } catch (\Exception $e) {
            \Log::error('Product restore failed', [
                'product_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Error restoring product: ' . $e->getMessage());
        }
    }

    // ============================================
    // TOGGLE STATUS
    // ============================================

    public function toggleStatus($id)
    {
        try {
            $product = Product::findOrFail($id);
            $oldStatus = $product->status;
            $product->status = $product->status === 'active' ? 'inactive' : 'active';
            $product->save();

            \Log::info('Product status toggled', [
                'product_id' => $id,
                'old_status' => $oldStatus,
                'new_status' => $product->status,
            ]);

            return redirect()->back()->with('success', 'Product status toggled successfully.');
        } catch (\Exception $e) {
            \Log::error('Product status toggle failed', [
                'product_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to toggle product status.');
        }
    }

    // ============================================
    // EXPORT - CSV EXPORT
    // ============================================

    public function export(Request $request)
    {
        $search = $request->input('search', '');
        $status = $request->input('status', '');
        $mainCategory = $request->input('main_category', '');
        $subCategory = $request->input('sub_category', '');
        $trashed = $request->input('trashed', '');

        $query = Product::when($trashed === 'only', function ($query) {
            return $query->onlyTrashed();
        });

        if (!empty($search)) {
            $searchPattern = '%' . strtolower($search) . '%';
            $query->where(function ($query) use ($searchPattern) {
                $query->whereRaw("LOWER(title) LIKE ?", [$searchPattern])
                    ->orWhereRaw("LOWER(item_code) LIKE ?", [$searchPattern]);
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($mainCategory) {
            $query->where('main_category', $mainCategory);
        }

        if ($subCategory) {
            $query->where('sub_category', $subCategory);
        }

        $products = $query->latest()->get();

        $filename = 'products_' . now()->format('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($products) {
            $file = fopen('php://output', 'w');

            fputcsv($file, [
                'ID',
                'Item Code',
                'Title',
                'Main Category',
                'Sub Category',
                'Daily Rate',
                'EKUEP Selling Price',
                'Status',
                'Fixed Assets Count',
                'Times Quoted',
                'Created At',
            ]);

            foreach ($products as $product) {
                fputcsv($file, [
                    $product->id,
                    $product->item_code,
                    $product->title,
                    $product->main_category ?? '-',
                    $product->sub_category ?? '-',
                    $product->daily_rate ?? 0,
                    $product->ekuep_selling_price ?? 0,
                    $product->status ?? 'active',
                    $product->fixed_assets_count ?? 0,
                    $product->times_quoted ?? 0,
                    $product->created_at?->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
```

### 3.3 Observer: ProductObserver.php

```php
<?php

namespace App\Observers;

use App\Models\Product;

class ProductObserver
{
    public function created(Product $product)
    {
        activity_log(
            'product_created',
            'Product created: ' . $product->title,
            $product,
            ['product' => $product->toArray()]
        );
    }

    public function updated(Product $product)
    {
        // Log status changes separately
        if ($product->wasChanged('status')) {
            activity_log(
                'product_status_updated',
                'Product status changed to ' . ucfirst($product->status),
                $product,
                [
                    'old_status' => $product->getOriginal('status'),
                    'new_status' => $product->status,
                ]
            );
        }

        // Log other updates
        if (($changes = $product->getChanges()) && !isset($changes['status'])) {
            activity_log(
                'product_updated',
                'Product updated: ' . $product->title,
                $product,
                ['changes' => $changes]
            );
        }
    }

    public function deleted(Product $product)
    {
        activity_log(
            'product_deleted',
            'Product deleted: ' . $product->title,
            $product
        );
    }

    public function restored(Product $product)
    {
        activity_log(
            'product_restored',
            'Product restored: ' . $product->title,
            $product
        );
    }

    public function forceDeleted(Product $product)
    {
        activity_log(
            'product_force_deleted',
            'Product permanently deleted: ' . $product->title,
            $product
        );
    }
}
```

---

## 4. FRONTEND IMPLEMENTATION

### 4.1 Products Index Page (Key Features)

```jsx
// resources/js/Pages/Products/Index.jsx

import React, { useRef, useState, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Dialog, Transition } from '@headlessui/react';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import debounce from 'lodash/debounce';

function Products({ products, filters, mainCategories = [], subCategories = [] }) {
    // State management
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [productTypeFilter, setProductTypeFilter] = useState(filters.product_type || '');
    const [mainCategory, setMainCategory] = useState(filters.main_category || '');
    const [subCategory, setSubCategory] = useState(filters.sub_category || '');
    const [showTrashed, setShowTrashed] = useState(filters.trashed === 'only');
    const [showFilters, setShowFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Debounced filter function
    const applyFilters = useCallback(
        debounce((params) => {
            setIsLoading(true);
            router.get('/products', params, {
                preserveState: true,
                preserveScroll: true,
                only: ['products', 'filters'],
                onFinish: () => setIsLoading(false),
            });
        }, 300),
        []
    );

    // Product actions
    const deleteProduct = (productId) => {
        if (confirm('Are you sure you want to delete this product?')) {
            router.delete(`/products/${productId}`, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => showToastMessage('Product deleted successfully'),
            });
        }
    };

    const restoreProduct = (productId) => {
        if (confirm('Are you sure you want to restore this product?')) {
            router.put(`/products/${productId}/restore`, {}, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => showToastMessage('Product restored successfully'),
            });
        }
    };

    const toggleStatus = (productId) => {
        router.put(`/products/${productId}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => showToastMessage('Product status updated'),
        });
    };

    // Build export URL with current filters
    const getExportUrl = () => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (statusFilter) params.append('status', statusFilter);
        if (mainCategory) params.append('main_category', mainCategory);
        if (subCategory) params.append('sub_category', subCategory);
        if (showTrashed) params.append('trashed', 'only');
        return `/products/export?${params.toString()}`;
    };

    return (
        <div className="py-6">
            <Head title="Products" />

            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Products</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {products.total} total products
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Export Button */}
                                <a
                                    href={getExportUrl()}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                    Export CSV
                                </a>
                                {/* Add Product Button */}
                                <Link
                                    href="/products/create"
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                                >
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Add Product
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        {/* Search input and filter controls */}
                        {/* ... filter implementation ... */}
                    </div>

                    {/* Products Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Daily Rate
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.data.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <img
                                                    src={product.picture || '/placeholder.png'}
                                                    alt={product.title}
                                                    className="w-10 h-10 rounded object-cover"
                                                />
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {product.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {product.item_code}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {product.main_category} / {product.sub_category}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            SAR {product.daily_rate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleStatus(product.id)}
                                                className={`px-2 py-1 text-xs font-medium rounded ${
                                                    product.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {product.status}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/products/${product.id}/edit`}
                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            >
                                                Edit
                                            </Link>
                                            {showTrashed ? (
                                                <button
                                                    onClick={() => restoreProduct(product.id)}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    Restore
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => deleteProduct(product.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {products.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            {/* Pagination component */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
```

---

## 5. FILE UPLOAD (AWS S3)

### 5.1 S3 Configuration

```php
// config/filesystems.php

's3' => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION'),
    'bucket' => env('AWS_BUCKET'),
    'url' => env('AWS_URL'),
    'endpoint' => env('AWS_ENDPOINT'),
    'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
],
```

### 5.2 Environment Variables

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=your_bucket_name
AWS_URL=https://your-bucket.s3.amazonaws.com
```

### 5.3 Upload Process

```php
// Upload to S3
if ($request->hasFile('picture')) {
    $file = $request->file('picture');

    // Generate unique filename
    $fileName = 'products/' . uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();

    // Store in S3
    $s3path = $file->storeAs('RQS/Product_Images', $fileName, 's3');

    // Set public visibility
    Storage::disk('s3')->setVisibility($s3path, 'public');

    // Get public URL
    $imageUrl = Storage::disk('s3')->url($s3path);
}

// Delete from S3
if ($product->picture) {
    $oldImagePath = parse_url($product->picture, PHP_URL_PATH);
    $oldImagePath = ltrim($oldImagePath, '/');
    if (Storage::disk('s3')->exists($oldImagePath)) {
        Storage::disk('s3')->delete($oldImagePath);
    }
}
```

---

## 6. ROUTES CONFIGURATION

```php
// routes/web.php

Route::middleware(['auth'])->group(function () {
    // Products Routes
    Route::middleware(['permission:products.view'])->group(function () {
        Route::get('/products', [ProductController::class, 'index'])
            ->name('products.index');
        Route::get('/products/export', [ProductController::class, 'export'])
            ->name('products.export');
        Route::get('/products/create', [ProductController::class, 'create'])
            ->middleware('permission:products.create')
            ->name('products.create');
        Route::post('/products', [ProductController::class, 'store'])
            ->middleware('permission:products.create')
            ->name('products.store');
        Route::get('/products/{product}/edit', [ProductController::class, 'edit'])
            ->middleware('permission:products.edit')
            ->name('products.edit');
        Route::put('/products/{product}', [ProductController::class, 'update'])
            ->middleware('permission:products.edit')
            ->name('products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])
            ->middleware('permission:products.delete')
            ->name('products.destroy');
        Route::put('/products/{product}/restore', [ProductController::class, 'restore'])
            ->middleware('permission:products.restore')
            ->name('products.restore');
        Route::put('/products/{product}/toggle-status', [ProductController::class, 'toggleStatus'])
            ->middleware('permission:products.toggle-status')
            ->name('products.toggle-status');
    });

    // Product Import Routes
    Route::middleware(['permission:products.import'])->group(function () {
        Route::get('/products/import', [ProductImportController::class, 'importForm'])
            ->name('products.import.form');
        Route::post('/products/import', [ProductImportController::class, 'import'])
            ->name('products.import');
        Route::get('/products/template', [ProductImportController::class, 'downloadTemplate'])
            ->name('products.downloadTemplate');
    });
});
```

---

## 7. VALIDATION RULES

### 7.1 Create Product
```php
[
    'product_type' => ['required', 'in:ekuep_fulfilled,mp_supplier'],
    'title' => ['required', 'string', 'max:255'],
    'item_code' => ['required', 'string', 'unique:products'],
    'description_english' => ['required', 'string'],
    'description_arabic' => ['nullable', 'string'],
    'main_category' => ['required', 'string'],
    'sub_category' => ['required', 'string'],
    'ekuep_selling_price' => ['required', 'numeric', 'min:0'],
    'daily_rate' => ['required', 'numeric', 'min:0'],
    'picture' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,svg', 'max:2048'],
    'status' => ['required', 'in:active,inactive'],
    // ... additional optional fields
]
```

### 7.2 Update Product
```php
[
    // Same as create, except:
    'item_code' => ['required', 'string', Rule::unique('products')->ignore($id)],
    'picture' => ['nullable', 'string'], // Existing URL or new file
]
```

---

## 8. IMPLEMENTATION GUIDE

### 8.1 Step-by-Step Implementation

1. **Create Migrations**
```bash
php artisan make:migration create_products_table
php artisan make:migration add_title_to_products_table
php artisan make:migration add_status_to_products_table
php artisan make:migration add_deleted_at_to_products_table
php artisan make:migration add_product_type_to_products_table
php artisan migrate
```

2. **Create Model**
```bash
php artisan make:model Product
```

3. **Create Controller**
```bash
php artisan make:controller ProductController
```

4. **Create Observer**
```bash
php artisan make:observer ProductObserver --model=Product
```

5. **Register Observer**
```php
// AppServiceProvider.php
Product::observe(ProductObserver::class);
```

6. **Configure S3** in `.env` and `config/filesystems.php`

7. **Create Frontend Pages**
```
resources/js/Pages/Products/Index.jsx
resources/js/Pages/Products/Create.jsx
resources/js/Pages/Products/EditPage.jsx
```

8. **Configure Routes** in `routes/web.php`

9. **Test the Flow**
   - Create product with image
   - Verify image uploads to S3
   - Test search and filters
   - Test status toggle
   - Test soft delete and restore
   - Test CSV export

---

**Document Version:** 1.0
**Last Updated:** 2026-01-09
**Module:** Products

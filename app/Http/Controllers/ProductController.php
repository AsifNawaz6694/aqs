<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(Request $request)
    {
        $query = Product::query();

        // Search across all visible columns
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhere('unit', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%")
                  ->orWhere('price', 'like', "%{$search}%")
                  ->orWhere('stock_quantity', 'like', "%{$search}%");
            });
        }

        // Filter by category (supports comma-separated multi-select)
        if ($request->filled('category')) {
            $categories = array_filter(explode(',', $request->category));
            $query->whereIn('category', $categories);
        }

        // Filter by status (supports comma-separated multi-select)
        if ($request->filled('status')) {
            $statuses = array_filter(explode(',', $request->status));
            $query->whereIn('status', $statuses);
        }

        // Filter by price range
        if ($request->filled('price_min')) {
            $query->where('price', '>=', $request->price_min);
        }
        if ($request->filled('price_max')) {
            $query->where('price', '<=', $request->price_max);
        }

        // Sort
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $allowedSorts = ['name', 'sku', 'category', 'price', 'stock_quantity', 'created_at'];

        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $products = $query->paginate(15)->withQueryString();

        // Get categories for filter
        $categories = Product::distinct()->pluck('category')->filter()->values();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'status', 'price_min', 'price_max', 'sort', 'direction']),
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create()
    {
        $categories = Product::distinct()->pluck('category')->filter()->values();

        return Inertia::render('Products/Create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:50|unique:products,sku',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'min_stock_quantity' => 'nullable|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'specifications' => 'nullable|array',
            'status' => 'required|in:active,inactive,discontinued',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        try {
            // Handle image upload
            $imagePath = null;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
                $imagePath = $image->storeAs('products', $filename, 'public');
            }

            $product = Product::create([
                'name' => $validated['name'],
                'sku' => $validated['sku'],
                'description' => $validated['description'] ?? null,
                'category' => $validated['category'],
                'price' => $validated['price'],
                'cost_price' => $validated['cost_price'] ?? null,
                'stock_quantity' => $validated['stock_quantity'],
                'min_stock_quantity' => $validated['min_stock_quantity'] ?? 0,
                'unit' => $validated['unit'] ?? 'piece',
                'specifications' => $validated['specifications'] ?? null,
                'status' => $validated['status'],
                'image_path' => $imagePath,
                'created_by' => auth()->id(),
            ]);

            Log::info('Product created', ['product_id' => $product->id, 'sku' => $product->sku, 'user_id' => auth()->id()]);

            ActivityLog::log(
                'created',
                "Created product {$product->name}",
                $product,
                auth()->user(),
                [],
                [],
                'products'
            );

            return redirect()->route('products.index')->with('success', 'Product created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating product: ' . $e->getMessage(), ['user_id' => auth()->id(), 'sku' => $validated['sku'] ?? null]);
            return back()->withInput()->with('error', 'Failed to create product. Please try again.');
        }
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product)
    {
        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Product $product)
    {
        $categories = Product::distinct()->pluck('category')->filter()->values();

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => ['required', 'string', 'max:50', Rule::unique('products')->ignore($product->id)],
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'min_stock_quantity' => 'nullable|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'specifications' => 'nullable|array',
            'status' => 'required|in:active,inactive,discontinued',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        try {
            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old image
                if ($product->image_path) {
                    Storage::disk('public')->delete($product->image_path);
                }

                $image = $request->file('image');
                $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
                $validated['image_path'] = $image->storeAs('products', $filename, 'public');
            }

            $product->update([
                'name' => $validated['name'],
                'sku' => $validated['sku'],
                'description' => $validated['description'] ?? null,
                'category' => $validated['category'],
                'price' => $validated['price'],
                'cost_price' => $validated['cost_price'] ?? null,
                'stock_quantity' => $validated['stock_quantity'],
                'min_stock_quantity' => $validated['min_stock_quantity'] ?? 0,
                'unit' => $validated['unit'] ?? $product->unit,
                'specifications' => $validated['specifications'] ?? $product->specifications,
                'status' => $validated['status'],
                'image_path' => $validated['image_path'] ?? $product->image_path,
                'updated_by' => auth()->id(),
            ]);

            Log::info('Product updated', ['product_id' => $product->id, 'sku' => $product->sku, 'user_id' => auth()->id()]);

            ActivityLog::log(
                'updated',
                "Updated product {$product->name}",
                $product,
                auth()->user(),
                [],
                [],
                'products'
            );

            return redirect()->route('products.index')->with('success', 'Product updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating product: ' . $e->getMessage(), ['product_id' => $product->id, 'user_id' => auth()->id()]);
            return back()->withInput()->with('error', 'Failed to update product. Please try again.');
        }
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Product $product)
    {
        try {
            // Delete image if exists
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }

            $productName = $product->name;
            $productId = $product->id;
            $product->delete();

            Log::info('Product deleted', ['product_id' => $productId, 'product_name' => $productName, 'user_id' => auth()->id()]);

            ActivityLog::log(
                'deleted',
                "Deleted product {$productName}",
                null,
                auth()->user(),
                ['product_name' => $productName],
                [],
                'products'
            );

            return redirect()->route('products.index')->with('success', 'Product deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting product: ' . $e->getMessage(), ['product_id' => $product->id, 'user_id' => auth()->id()]);
            return back()->with('error', 'Failed to delete product. Please try again.');
        }
    }

    /**
     * Export products to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        try {
        $query = Product::query();

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $products = $query->get();
        $filename = 'products-' . date('Y-m-d-His') . '.csv';

        Log::info('Products exported', ['user_id' => auth()->id(), 'count' => $products->count(), 'filename' => $filename]);

        ActivityLog::log(
            'exported',
            "Exported {$products->count()} products to CSV",
            null,
            auth()->user(),
            ['count' => $products->count(), 'filename' => $filename],
            [],
            'products'
        );

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($products) {
            $file = fopen('php://output', 'w');

            // Header row
            fputcsv($file, [
                'ID',
                'SKU',
                'Name',
                'Category',
                'Description',
                'Price',
                'Cost Price',
                'Stock Quantity',
                'Unit',
                'Status',
                'Created At',
            ]);

            // Data rows
            foreach ($products as $product) {
                fputcsv($file, [
                    $product->id,
                    $product->sku,
                    $product->name,
                    $product->category,
                    $product->description,
                    $product->price,
                    $product->cost_price,
                    $product->stock_quantity,
                    $product->unit,
                    $product->status,
                    $product->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            Log::error('Error exporting products: ' . $e->getMessage(), ['user_id' => auth()->id()]);
            return back()->with('error', 'Failed to export products. Please try again.');
        }
    }

    /**
     * Show the import form.
     */
    public function showImport()
    {
        return Inertia::render('Products/Import');
    }

    /**
     * Import products from CSV.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');

        // Skip header row
        $header = fgetcsv($handle);

        $imported = 0;
        $errors = [];
        $row = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $row++;

            // Validate row data
            if (count($data) < 6) {
                $errors[] = "Row {$row}: Insufficient data columns";
                continue;
            }

            try {
                // Map CSV columns: SKU, Name, Category, Description, Price, Stock Quantity, Status
                Product::updateOrCreate(
                    ['sku' => $data[0]],
                    [
                        'name' => $data[1],
                        'category' => $data[2],
                        'description' => $data[3] ?? null,
                        'price' => floatval($data[4]),
                        'stock_quantity' => intval($data[5]),
                        'status' => $data[6] ?? 'active',
                        'created_by' => auth()->id(),
                    ]
                );
                $imported++;
            } catch (\Exception $e) {
                Log::warning("Product import row {$row} failed: " . $e->getMessage());
                $errors[] = "Row {$row}: " . $e->getMessage();
            }
        }

        fclose($handle);

        Log::info('Product import completed', [
            'user_id' => auth()->id(),
            'imported' => $imported,
            'errors' => count($errors),
            'filename' => $file->getClientOriginalName(),
        ]);

        ActivityLog::log(
            'imported',
            "Imported {$imported} products",
            null,
            auth()->user(),
            ['count' => $imported, 'errors' => count($errors)],
            [],
            'products'
        );

        if (count($errors) > 0) {
            return redirect()->route('products.index')
                ->with('success', "{$imported} products imported successfully.")
                ->with('error', count($errors) . " rows had errors.");
        }

        return redirect()->route('products.index')->with('success', "{$imported} products imported successfully.");
    }
}

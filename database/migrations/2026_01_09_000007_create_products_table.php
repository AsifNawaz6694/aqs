<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            // Basic Information
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sku', 100)->nullable()->unique();
            $table->string('barcode', 100)->nullable();
            $table->text('description')->nullable();
            $table->string('short_description', 500)->nullable();

            // Categorization
            $table->string('category', 100)->nullable();
            $table->string('subcategory', 100)->nullable();
            $table->string('brand', 100)->nullable();
            $table->json('tags')->nullable();

            // Pricing
            $table->decimal('price', 12, 2)->default(0.00);
            $table->decimal('cost_price', 12, 2)->nullable();
            $table->string('currency', 3)->default('SAR');

            // Inventory
            $table->integer('stock_quantity')->default(0);
            $table->integer('min_stock_quantity')->default(0);
            $table->string('unit', 50)->default('piece');

            // Status
            $table->enum('status', ['active', 'inactive', 'discontinued'])->default('active');
            $table->boolean('is_featured')->default(false);

            // Media
            $table->string('image_path', 500)->nullable();
            $table->json('gallery')->nullable();

            // Specifications
            $table->json('specifications')->nullable();
            $table->json('dimensions')->nullable();
            $table->decimal('weight', 10, 2)->nullable();
            $table->string('weight_unit', 10)->default('kg');

            // SEO
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 500)->nullable();

            // Tracking
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('category');
            $table->index('brand');
            $table->index('is_featured');
            $table->index('price');
            $table->index('created_at');
        });

        // Add fulltext search index for MySQL
        DB::statement('ALTER TABLE products ADD FULLTEXT INDEX products_search (name, description, sku)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};

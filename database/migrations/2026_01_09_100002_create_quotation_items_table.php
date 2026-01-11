<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('quotation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();

            // Product Reference (nullable for custom items)
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();

            // Item Details (editable per quotation)
            $table->string('item_code')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('unit')->default('Unit'); // pc, kg, m, etc.

            // Pricing (all editable per quotation)
            $table->decimal('unit_price', 15, 2);
            $table->decimal('quantity', 15, 3);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);

            // VAT
            $table->decimal('vat_rate', 5, 2)->default(15.00);
            $table->decimal('vat_amount', 15, 2)->default(0);
            $table->boolean('vat_inclusive')->default(false);

            // Calculated Totals
            $table->decimal('line_total_before_discount', 15, 2)->default(0);
            $table->decimal('line_total_after_discount', 15, 2)->default(0);
            $table->decimal('line_total_with_vat', 15, 2)->default(0);

            // Custom Item Flag
            $table->boolean('is_custom_item')->default(false);

            // Transport/Delivery Item
            $table->boolean('is_transport_item')->default(false);
            $table->boolean('is_free')->default(false);

            // Sorting
            $table->unsignedInteger('sort_order')->default(0);

            // Notes
            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('quotation_id');
            $table->index('product_id');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_items');
    }
};

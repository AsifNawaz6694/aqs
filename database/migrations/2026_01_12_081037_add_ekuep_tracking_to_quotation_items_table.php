<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds columns to properly track EKUEP products vs local/custom products.
     * This enables proper traceability and differentiation of product sources.
     */
    public function up(): void
    {
        Schema::table('quotation_items', function (Blueprint $table) {
            // External ID for EKUEP products (their internal product ID)
            // Stored as string to accommodate different ID formats from external systems
            $table->string('external_id')->nullable()->after('product_id');

            // Source of the product:
            // - 'ekuep': Product fetched from EKUEP API
            // - 'local': Product from local products table
            // - 'custom': Manually entered custom item
            $table->string('source', 20)->default('custom')->after('external_id');

            // Add indexes for better querying and reporting
            $table->index('external_id');
            $table->index('source');
        });

        // Update existing items: set source based on current data
        // - If product_id is set, it's a local product
        // - If is_custom_item is true, it's custom
        // - Otherwise, default to custom
        DB::statement("
            UPDATE quotation_items
            SET source = CASE
                WHEN product_id IS NOT NULL THEN 'local'
                WHEN is_custom_item = 1 THEN 'custom'
                ELSE 'custom'
            END
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotation_items', function (Blueprint $table) {
            $table->dropIndex(['external_id']);
            $table->dropIndex(['source']);
            $table->dropColumn(['external_id', 'source']);
        });
    }
};

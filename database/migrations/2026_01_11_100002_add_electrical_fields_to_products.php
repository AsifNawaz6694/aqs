<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds dedicated electrical specification fields to products
     * for easier querying and display in quotations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Electrical specifications
            $table->string('voltage', 50)->nullable()->after('weight_unit');
            $table->string('power', 50)->nullable()->after('voltage');
            $table->string('frequency', 50)->nullable()->after('power');

            // External reference (for integration with external systems)
            $table->string('external_id', 100)->nullable()->after('barcode');
            $table->string('external_reference', 255)->nullable()->after('external_id');

            // Product URL/link
            $table->string('product_url', 500)->nullable()->after('image_path');

            // Spec sheet/documentation URL
            $table->string('spec_sheet_url', 500)->nullable()->after('product_url');

            // Index for external references
            $table->index('external_id');
            $table->index('external_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['external_id']);
            $table->dropIndex(['external_reference']);

            $table->dropColumn([
                'voltage',
                'power',
                'frequency',
                'external_id',
                'external_reference',
                'product_url',
                'spec_sheet_url',
            ]);
        });
    }
};

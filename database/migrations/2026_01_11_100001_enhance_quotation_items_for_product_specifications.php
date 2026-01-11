<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds fields to support product specifications (electrical data),
     * product images, and slugs as per the quotation module documentation.
     */
    public function up(): void
    {
        Schema::table('quotation_items', function (Blueprint $table) {
            // Product image URL (from product catalog)
            $table->text('image_url')->nullable()->after('description');

            // Product slug for linking to catalog
            $table->string('slug')->nullable()->after('image_url');

            // Product specifications JSON (voltage, power, dimensions, weight)
            // Structure: {
            //   "voltage": "220V",
            //   "power": "1800W",
            //   "dimensions": {"width": "120", "length": "80", "height": "200"},
            //   "weight": "150kg",
            //   "amperage": 8.18 (calculated: power/voltage)
            // }
            $table->json('product_specifications')->nullable()->after('slug');

            // Original requested quantity from file upload (before adjustment)
            $table->decimal('requested_quantity', 15, 3)->nullable()->after('quantity');

            // Original product name from file (before selecting from catalog)
            $table->string('original_name')->nullable()->after('name');
        });

        // Add customer_reference to quotations if not exists (maps to document's customer_reference)
        // Note: 'reference' field already exists, but we'll add customer_reference for clarity
        if (!Schema::hasColumn('quotations', 'customer_reference')) {
            Schema::table('quotations', function (Blueprint $table) {
                $table->text('customer_reference')->nullable()->after('reference');
            });
        }

        // Add country/region field for currency selection (KSA, UAE)
        if (!Schema::hasColumn('quotations', 'country')) {
            Schema::table('quotations', function (Blueprint $table) {
                $table->string('country', 10)->default('KSA')->after('currency');
            });
        }

        // Add total_amperes field for electrical load summary
        if (!Schema::hasColumn('quotations', 'total_amperes')) {
            Schema::table('quotations', function (Blueprint $table) {
                $table->decimal('total_amperes', 10, 2)->default(0)->after('grand_total');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotation_items', function (Blueprint $table) {
            $table->dropColumn([
                'image_url',
                'slug',
                'product_specifications',
                'requested_quantity',
                'original_name',
            ]);
        });

        Schema::table('quotations', function (Blueprint $table) {
            if (Schema::hasColumn('quotations', 'customer_reference')) {
                $table->dropColumn('customer_reference');
            }
            if (Schema::hasColumn('quotations', 'country')) {
                $table->dropColumn('country');
            }
            if (Schema::hasColumn('quotations', 'total_amperes')) {
                $table->dropColumn('total_amperes');
            }
        });
    }
};

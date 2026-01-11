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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();

            // Client Type
            $table->enum('type', ['individual', 'company'])->default('company');

            // Basic Information
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('mobile', 20)->nullable();
            $table->string('website')->nullable();

            // Company Details (for type = company)
            $table->string('company_name')->nullable();
            $table->string('trading_name')->nullable();
            $table->string('registration_number', 100)->nullable();
            $table->string('vat_number', 50)->nullable();
            $table->string('tax_id', 50)->nullable();

            // Contact Person
            $table->string('contact_person')->nullable();
            $table->string('contact_position', 100)->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone', 20)->nullable();

            // Address
            $table->string('address_line_1')->nullable();
            $table->string('address_line_2')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country', 100)->nullable();

            // Billing Address (if different)
            $table->boolean('billing_address_same')->default(true);
            $table->json('billing_address')->nullable();

            // Financial
            $table->decimal('credit_limit', 12, 2)->nullable();
            $table->integer('payment_terms')->nullable()->default(30);
            $table->string('currency', 3)->default('USD');

            // Status & Classification
            $table->enum('status', ['active', 'inactive', 'blocked'])->default('active');
            $table->enum('classification', ['regular', 'vip', 'wholesale', 'retail'])->default('regular');
            $table->string('source', 100)->nullable();

            // Notes
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();

            // Tracking
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('type');
            $table->index('status');
            $table->index('classification');
            $table->index('email');
            $table->index('company_name');
            $table->index('assigned_to');
            $table->index('created_at');
        });

        // Add fulltext search index for MySQL
        DB::statement('ALTER TABLE clients ADD FULLTEXT INDEX clients_search (name, company_name, email, contact_person)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};

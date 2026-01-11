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
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();

            // Quotation Number (auto-generated)
            $table->string('quotation_number', 50)->unique();
            $table->unsignedInteger('version')->default(1);
            $table->foreignId('parent_id')->nullable()->constrained('quotations')->nullOnDelete();

            // Relationships
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Created by
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();

            // Quotation Details
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('reference')->nullable(); // Client's reference number

            // Dates
            $table->date('quotation_date');
            $table->date('valid_until');
            $table->date('expected_delivery_date')->nullable();

            // Status
            $table->enum('status', [
                'draft',
                'pending_review',
                'approved',
                'sent',
                'accepted',
                'rejected',
                'expired',
                'cancelled'
            ])->default('draft');

            // Financial Summary
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('total_discount', 15, 2)->default(0);
            $table->decimal('discount_percentage', 5, 2)->default(0); // Overall discount %
            $table->decimal('total_before_vat', 15, 2)->default(0);
            $table->decimal('total_vat', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);

            // Transport/Delivery
            $table->decimal('transport_charges', 15, 2)->default(0);
            $table->boolean('transport_free')->default(false);
            $table->text('transport_notes')->nullable();

            // VAT Settings
            $table->decimal('default_vat_rate', 5, 2)->default(15.00); // KSA VAT
            $table->boolean('vat_inclusive')->default(false);

            // Currency
            $table->string('currency', 3)->default('SAR');
            $table->decimal('exchange_rate', 10, 4)->default(1.0000);

            // Terms and Conditions
            $table->text('terms_and_conditions')->nullable();
            $table->text('payment_terms')->nullable();
            $table->text('delivery_terms')->nullable();
            $table->text('warranty_terms')->nullable();

            // Internal Notes (not shown to client)
            $table->text('internal_notes')->nullable();

            // Client Contact (snapshot at quotation time)
            $table->string('client_contact_name')->nullable();
            $table->string('client_contact_email')->nullable();
            $table->string('client_contact_phone')->nullable();

            // Approval
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            // Sending
            $table->timestamp('sent_at')->nullable();
            $table->string('sent_to_email')->nullable();

            // Client Response
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();

            // PDF
            $table->string('pdf_path')->nullable();
            $table->timestamp('pdf_generated_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('quotation_number');
            $table->index('status');
            $table->index('quotation_date');
            $table->index('valid_until');
            $table->index(['client_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};

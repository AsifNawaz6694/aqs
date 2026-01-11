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
        Schema::create('quotation_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->text('notes')->nullable();

            // Additional context
            $table->string('action')->nullable(); // created, updated, status_changed, sent, etc.
            $table->json('metadata')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('quotation_id');
            $table->index('to_status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_status_history');
    }
};

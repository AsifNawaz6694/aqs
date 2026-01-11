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
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

            // Profile Picture
            $table->string('avatar_path', 500)->nullable();

            // Company Information
            $table->string('company_name')->nullable();
            $table->string('job_title')->nullable();
            $table->string('department')->nullable();

            // Contact Details
            $table->string('phone', 20)->nullable();
            $table->string('mobile', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('postal_code', 20)->nullable();

            // Business Information
            $table->string('vat_number', 50)->nullable();
            $table->string('tax_id', 50)->nullable();

            // Preferences
            $table->string('timezone', 50)->default('UTC');
            $table->string('locale', 10)->default('en');
            $table->string('date_format', 20)->default('Y-m-d');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};

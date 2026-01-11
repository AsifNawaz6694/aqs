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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            // Log Type
            $table->string('log_name', 100)->default('default');
            $table->string('event', 100);

            // Description
            $table->text('description');

            // Subject (the entity being acted upon) - Polymorphic
            $table->nullableMorphs('subject');

            // Causer (who performed the action) - Polymorphic
            $table->nullableMorphs('causer');

            // Additional Context
            $table->json('properties')->nullable();
            $table->json('changes')->nullable();

            // Module/Section
            $table->string('module', 100)->nullable();

            // Request Information
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('url', 500)->nullable();
            $table->string('method', 10)->nullable();

            $table->timestamps();

            // Indexes
            $table->index('log_name');
            $table->index('event');
            $table->index('module');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};

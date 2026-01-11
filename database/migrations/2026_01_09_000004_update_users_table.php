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
        Schema::table('users', function (Blueprint $table) {
            // Password setup for admin-created users
            $table->string('password_setup_token')->nullable()->after('remember_token');
            $table->timestamp('password_setup_token_expires_at')->nullable()->after('password_setup_token');
            $table->boolean('password_set')->default(false)->after('password_setup_token_expires_at');

            // Role
            $table->foreignId('role_id')->nullable()->after('password_set')->constrained()->nullOnDelete();

            // Signature
            $table->text('signature_html')->nullable()->after('role_id');

            // Status & Tracking
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('signature_html');
            $table->timestamp('last_login_at')->nullable()->after('status');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');

            // Soft deletes
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('password_set');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['password_set']);
            $table->dropIndex(['created_at']);
            $table->dropSoftDeletes();
            $table->dropColumn([
                'password_setup_token',
                'password_setup_token_expires_at',
                'password_set',
                'role_id',
                'signature_html',
                'status',
                'last_login_at',
                'last_login_ip',
            ]);
        });
    }
};

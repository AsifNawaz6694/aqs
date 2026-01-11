<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Profile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get Super Admin role
        $superAdminRole = Role::where('slug', 'super-admin')->first();

        if (!$superAdminRole) {
            $this->command->error('Super Admin role not found. Please run RolesAndPermissionsSeeder first.');
            return;
        }

        // Create Super Admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@ekuep.com'],
            [
                'name' => 'Super Admin',
                'email' => 'admin@ekuep.com',
                'password' => Hash::make('password'),
                'role_id' => $superAdminRole->id,
                'password_set' => true,
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // Create profile for admin
        Profile::firstOrCreate(
            ['user_id' => $admin->id],
            [
                'user_id' => $admin->id,
                'company_name' => 'Ekuep Quotation System',
                'job_title' => 'System Administrator',
                'department' => 'IT',
            ]
        );

        $this->command->info('Admin user created successfully.');
        $this->command->info('Email: admin@ekuep.com');
        $this->command->info('Password: password');
    }
}

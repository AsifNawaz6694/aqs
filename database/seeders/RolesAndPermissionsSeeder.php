<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Permissions
        $permissions = [
            // Dashboard
            ['name' => 'View Dashboard', 'slug' => 'dashboard.view', 'group' => 'Dashboard', 'description' => 'View dashboard statistics and charts'],

            // User Management
            ['name' => 'View Users', 'slug' => 'users.view', 'group' => 'Users', 'description' => 'View list of users'],
            ['name' => 'Create Users', 'slug' => 'users.create', 'group' => 'Users', 'description' => 'Create new users'],
            ['name' => 'Edit Users', 'slug' => 'users.edit', 'group' => 'Users', 'description' => 'Edit existing users'],
            ['name' => 'Delete Users', 'slug' => 'users.delete', 'group' => 'Users', 'description' => 'Delete users'],

            // Role Management
            ['name' => 'View Roles', 'slug' => 'roles.view', 'group' => 'Roles', 'description' => 'View list of roles'],
            ['name' => 'Create Roles', 'slug' => 'roles.create', 'group' => 'Roles', 'description' => 'Create new roles'],
            ['name' => 'Edit Roles', 'slug' => 'roles.edit', 'group' => 'Roles', 'description' => 'Edit existing roles'],
            ['name' => 'Delete Roles', 'slug' => 'roles.delete', 'group' => 'Roles', 'description' => 'Delete roles'],

            // Product Management
            ['name' => 'View Products', 'slug' => 'products.view', 'group' => 'Products', 'description' => 'View list of products'],
            ['name' => 'Create Products', 'slug' => 'products.create', 'group' => 'Products', 'description' => 'Create new products'],
            ['name' => 'Edit Products', 'slug' => 'products.edit', 'group' => 'Products', 'description' => 'Edit existing products'],
            ['name' => 'Delete Products', 'slug' => 'products.delete', 'group' => 'Products', 'description' => 'Delete products'],
            ['name' => 'Import Products', 'slug' => 'products.import', 'group' => 'Products', 'description' => 'Import products from file'],
            ['name' => 'Export Products', 'slug' => 'products.export', 'group' => 'Products', 'description' => 'Export products to file'],

            // Client Management
            ['name' => 'View Clients', 'slug' => 'clients.view', 'group' => 'Clients', 'description' => 'View list of clients'],
            ['name' => 'Create Clients', 'slug' => 'clients.create', 'group' => 'Clients', 'description' => 'Create new clients'],
            ['name' => 'Edit Clients', 'slug' => 'clients.edit', 'group' => 'Clients', 'description' => 'Edit existing clients'],
            ['name' => 'Delete Clients', 'slug' => 'clients.delete', 'group' => 'Clients', 'description' => 'Delete clients'],
            ['name' => 'Export Clients', 'slug' => 'clients.export', 'group' => 'Clients', 'description' => 'Export clients to file'],

            // Activity Logs
            ['name' => 'View Activity Logs', 'slug' => 'activity-logs.view', 'group' => 'Activity Logs', 'description' => 'View activity logs'],
            ['name' => 'Export Activity Logs', 'slug' => 'activity-logs.export', 'group' => 'Activity Logs', 'description' => 'Export activity logs'],

            // Quotation Management
            ['name' => 'View Quotations', 'slug' => 'quotations.view', 'group' => 'Quotations', 'description' => 'View list of quotations'],
            ['name' => 'Create Quotations', 'slug' => 'quotations.create', 'group' => 'Quotations', 'description' => 'Create new quotations'],
            ['name' => 'Edit Quotations', 'slug' => 'quotations.edit', 'group' => 'Quotations', 'description' => 'Edit existing quotations'],
            ['name' => 'Delete Quotations', 'slug' => 'quotations.delete', 'group' => 'Quotations', 'description' => 'Delete quotations'],
            ['name' => 'Export Quotations', 'slug' => 'quotations.export', 'group' => 'Quotations', 'description' => 'Export quotations to file'],
            ['name' => 'Submit Quotations', 'slug' => 'quotations.submit', 'group' => 'Quotations', 'description' => 'Submit quotations for review'],
            ['name' => 'Approve Quotations', 'slug' => 'quotations.approve', 'group' => 'Quotations', 'description' => 'Approve or reject quotations'],
            ['name' => 'Send Quotations', 'slug' => 'quotations.send', 'group' => 'Quotations', 'description' => 'Send quotations to clients via email'],

            // Settings
            ['name' => 'View Settings', 'slug' => 'settings.view', 'group' => 'Settings', 'description' => 'View system settings'],
            ['name' => 'Edit Settings', 'slug' => 'settings.edit', 'group' => 'Settings', 'description' => 'Edit system settings'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }

        // Create Roles - Only Super Admin and Sales
        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => 'super-admin',
                'description' => 'Full access to all system features',
                'is_system' => true,
                'level' => 100,
            ],
            [
                'name' => 'Sales',
                'slug' => 'sales',
                'description' => 'Sales team member with client and product access',
                'is_system' => true,
                'level' => 50,
            ],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate(
                ['slug' => $roleData['slug']],
                $roleData
            );
        }

        // Assign Permissions to Sales Role
        // Super Admin bypasses permission checks, so no need to assign permissions
        $this->assignPermissionsToSales();

        $this->command->info('Roles and permissions seeded successfully.');
    }

    /**
     * Assign permissions to Sales role.
     */
    private function assignPermissionsToSales(): void
    {
        $salesRole = Role::where('slug', 'sales')->first();

        if (!$salesRole) {
            return;
        }

        // Sales can: view dashboard, view/manage clients, view products, manage quotations
        $salesPermissions = Permission::whereIn('slug', [
            'dashboard.view',
            'products.view',
            'products.export',
            'clients.view',
            'clients.create',
            'clients.edit',
            'clients.export',
            'quotations.view',
            'quotations.create',
            'quotations.edit',
            'quotations.export',
            'quotations.submit',
            'quotations.send',
        ])->pluck('id')->toArray();

        $salesRole->permissions()->sync($salesPermissions);
    }
}

# MODULE 03: ROLES & PERMISSIONS (RBAC)

## TABLE OF CONTENTS
```
1. Module Overview
2. Database Design
3. Backend Architecture
4. Frontend Implementation
5. Permission Matrix
6. Middleware Enforcement
7. Seeder Configuration
8. Implementation Guide
```

---

## 1. MODULE OVERVIEW

### 1.1 Purpose
The Roles & Permissions module implements Role-Based Access Control (RBAC) to manage user access throughout the system. It provides granular control over what actions users can perform based on their assigned role.

### 1.2 Features
- Role management (CRUD operations)
- Permission grouping by module
- Role-Permission assignment (many-to-many)
- SuperAdmin bypass (full access)
- Middleware-based route protection
- Frontend permission checking
- Dynamic permission loading via Inertia

### 1.3 RBAC Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                       USER                                   │
│                         │                                    │
│                    belongs_to                                │
│                         │                                    │
│                         ▼                                    │
│                       ROLE                                   │
│              (SuperAdmin, Admin, Sales, Operations)          │
│                         │                                    │
│                  belongs_to_many                             │
│                         │                                    │
│                         ▼                                    │
│                   PERMISSIONS                                │
│         (users.view, products.create, etc.)                 │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 Default Roles
| Role | Slug | Description |
|------|------|-------------|
| Super Admin | superadmin | Full system access, bypasses all permission checks |
| Admin | admin | Full access except user/role management |
| Sales | sales | Products, Clients, Quotations, Prospecting |
| Operations | operations | Quotations (limited), Products (view only) |

---

## 2. DATABASE DESIGN

### 2.1 Roles Table

#### Table: `roles`
```sql
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    is_system TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    -- Indexes
    INDEX roles_slug_index (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Field Specifications
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary identifier |
| name | VARCHAR(255) | NOT NULL | Display name (e.g., "Super Admin") |
| slug | VARCHAR(255) | NOT NULL, UNIQUE | URL-friendly identifier (e.g., "superadmin") |
| description | TEXT | NULL | Role description |
| is_system | TINYINT(1) | DEFAULT 0 | Whether role is system-defined (non-deletable) |

### 2.2 Permissions Table

#### Table: `permissions`
```sql
CREATE TABLE permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    `group` VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    -- Indexes
    INDEX permissions_slug_index (slug),
    INDEX permissions_group_index (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Field Specifications
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary identifier |
| name | VARCHAR(255) | NOT NULL | Display name (e.g., "View Users") |
| slug | VARCHAR(255) | NOT NULL, UNIQUE | Permission identifier (e.g., "users.view") |
| group | VARCHAR(255) | NOT NULL | Category grouping (e.g., "Users", "Products") |
| description | TEXT | NULL | Permission description |

### 2.3 Role-Permission Pivot Table

#### Table: `role_permission`
```sql
CREATE TABLE role_permission (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    -- Indexes
    UNIQUE KEY role_permission_unique (role_id, permission_id),

    -- Foreign Keys
    CONSTRAINT role_permission_role_id_foreign
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT role_permission_permission_id_foreign
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.4 Migrations

#### Migration: `2026_01_04_000001_create_roles_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRolesTable extends Migration
{
    public function up()
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('roles');
    }
}
```

#### Migration: `2026_01_04_000002_create_permissions_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePermissionsTable extends Migration
{
    public function up()
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('group');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('permissions');
    }
}
```

#### Migration: `2026_01_04_000003_create_role_permission_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRolePermissionTable extends Migration
{
    public function up()
    {
        Schema::create('role_permission', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained()->onDelete('cascade');
            $table->foreignId('permission_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['role_id', 'permission_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('role_permission');
    }
}
```

#### Migration: `2026_01_04_000004_add_role_id_to_users_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRoleIdToUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('remember_token')
                  ->constrained()->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });
    }
}
```

---

## 3. BACKEND ARCHITECTURE

### 3.1 Model: Role.php

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_system',
    ];

    protected $casts = [
        'is_system' => 'boolean',
    ];

    // ============================================
    // RELATIONSHIPS
    // ============================================

    /**
     * Get the users that belong to this role
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the permissions that belong to this role
     */
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permission')
                    ->withTimestamps();
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Check if role has a specific permission
     */
    public function hasPermission(string $permissionSlug): bool
    {
        return $this->permissions()->where('slug', $permissionSlug)->exists();
    }

    /**
     * Sync permissions to this role
     */
    public function syncPermissions(array $permissionIds): void
    {
        $this->permissions()->sync($permissionIds);
    }

    /**
     * Get permission slugs for this role
     */
    public function getPermissionSlugs(): array
    {
        return $this->permissions()->pluck('slug')->toArray();
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Scope to get only system roles
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope to get only custom roles
     */
    public function scopeCustom($query)
    {
        return $query->where('is_system', false);
    }
}
```

### 3.2 Model: Permission.php

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'group',
        'description',
    ];

    // ============================================
    // RELATIONSHIPS
    // ============================================

    /**
     * Get the roles that have this permission
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_permission')
                    ->withTimestamps();
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Scope to filter by group
     */
    public function scopeInGroup($query, string $group)
    {
        return $query->where('group', $group);
    }

    // ============================================
    // STATIC METHODS
    // ============================================

    /**
     * Get permissions grouped by their group name
     */
    public static function getGrouped()
    {
        return static::all()->groupBy('group');
    }
}
```

### 3.3 Controller: RoleController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class RoleController extends Controller
{
    // ============================================
    // INDEX - LIST ROLES
    // ============================================

    public function index()
    {
        $roles = Role::withCount(['users', 'permissions'])
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
        ]);
    }

    // ============================================
    // CREATE - SHOW CREATE FORM
    // ============================================

    public function create()
    {
        $permissions = Permission::orderBy('group')
            ->orderBy('name')
            ->get()
            ->groupBy('group');

        return Inertia::render('Roles/Create', [
            'permissionGroups' => $permissions,
        ]);
    }

    // ============================================
    // STORE - CREATE NEW ROLE
    // ============================================

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        // Generate slug from name
        $slug = Str::slug($validated['name']);

        // Ensure unique slug
        $originalSlug = $slug;
        $counter = 1;
        while (Role::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'is_system' => false,
        ]);

        // Sync permissions
        if (!empty($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        // Log activity
        activity_log(
            'role_created',
            'Role created: ' . $role->name,
            $role,
            ['permissions_count' => count($validated['permissions'] ?? [])]
        );

        return redirect()->route('roles.index')
            ->with('success', 'Role created successfully.');
    }

    // ============================================
    // SHOW - VIEW ROLE DETAILS
    // ============================================

    public function show(Role $role)
    {
        $role->load('permissions');

        return Inertia::render('Roles/Show', [
            'role' => $role,
            'permissionGroups' => $role->permissions->groupBy('group'),
        ]);
    }

    // ============================================
    // EDIT - SHOW EDIT FORM
    // ============================================

    public function edit(Role $role)
    {
        $permissions = Permission::orderBy('group')
            ->orderBy('name')
            ->get()
            ->groupBy('group');

        $rolePermissionIds = $role->permissions()->pluck('permissions.id')->toArray();

        return Inertia::render('Roles/Edit', [
            'role' => $role,
            'permissionGroups' => $permissions,
            'rolePermissions' => $rolePermissionIds,
        ]);
    }

    // ============================================
    // UPDATE - UPDATE ROLE
    // ============================================

    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        // Don't allow changing system role name
        if (!$role->is_system) {
            $role->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
            ]);
        } else {
            $role->update([
                'description' => $validated['description'] ?? null,
            ]);
        }

        // Log activity
        activity_log(
            'role_updated',
            'Role updated: ' . $role->name,
            $role
        );

        return redirect()->route('roles.index')
            ->with('success', 'Role updated successfully.');
    }

    // ============================================
    // UPDATE PERMISSIONS
    // ============================================

    public function updatePermissions(Request $request, Role $role)
    {
        $validated = $request->validate([
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        $oldPermissions = $role->permissions()->pluck('permissions.id')->toArray();

        // Sync permissions
        $role->permissions()->sync($validated['permissions'] ?? []);

        // Log activity
        activity_log(
            'role_permissions_updated',
            'Role permissions updated: ' . $role->name,
            $role,
            [
                'old_values' => ['permissions' => $oldPermissions],
                'new_values' => ['permissions' => $validated['permissions'] ?? []],
            ]
        );

        return redirect()->route('roles.edit', $role)
            ->with('success', 'Permissions updated successfully.');
    }

    // ============================================
    // DESTROY - DELETE ROLE
    // ============================================

    public function destroy(Role $role)
    {
        // Prevent deletion of system roles
        if ($role->is_system) {
            return redirect()->back()
                ->with('error', 'System roles cannot be deleted.');
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete role with assigned users.');
        }

        // Log before deletion
        activity_log(
            'role_deleted',
            'Role deleted: ' . $role->name,
            $role
        );

        $role->delete();

        return redirect()->route('roles.index')
            ->with('success', 'Role deleted successfully.');
    }
}
```

### 3.4 Controller: PermissionController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PermissionController extends Controller
{
    // ============================================
    // INDEX - LIST PERMISSIONS
    // ============================================

    public function index()
    {
        $permissions = Permission::withCount('roles')
            ->orderBy('group')
            ->orderBy('name')
            ->get();

        $grouped = $permissions->groupBy('group');

        return Inertia::render('Permissions/Index', [
            'permissions' => $permissions,
            'permissionGroups' => $grouped,
        ]);
    }

    // ============================================
    // SHOW - VIEW PERMISSION DETAILS
    // ============================================

    public function show(Permission $permission)
    {
        $permission->load('roles');

        return Inertia::render('Permissions/Show', [
            'permission' => $permission,
        ]);
    }

    // ============================================
    // GROUPED - GET PERMISSIONS GROUPED (API)
    // ============================================

    public function grouped()
    {
        $permissions = Permission::orderBy('group')
            ->orderBy('name')
            ->get()
            ->groupBy('group');

        return response()->json($permissions);
    }
}
```

### 3.5 Middleware: CheckPermission.php

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$permissions  One or more permission slugs (OR logic)
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$permissions)
    {
        $user = $request->user();

        // Check if user is authenticated
        if (!$user) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            return redirect()->route('login');
        }

        // Load role if not loaded
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }

        // SuperAdmin bypasses all permission checks
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Check if user has any of the required permissions (OR logic)
        if (count($permissions) > 0) {
            $hasPermission = false;

            foreach ($permissions as $permission) {
                if ($user->hasPermission($permission)) {
                    $hasPermission = true;
                    break;
                }
            }

            if (!$hasPermission) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'error' => 'Forbidden: You do not have permission to access this resource.'
                    ], 403);
                }

                return redirect()->route('dashboard')
                    ->with('error', 'You do not have permission to access this resource.');
            }
        }

        return $next($request);
    }
}
```

### 3.6 Middleware: CheckRole.php

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles  One or more role slugs (OR logic)
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        // Check if user is authenticated
        if (!$user) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            return redirect()->route('login');
        }

        // Load role if not loaded
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }

        // SuperAdmin bypasses all role checks
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Check if user has any of the required roles (OR logic)
        if (count($roles) > 0) {
            $hasRole = false;

            foreach ($roles as $role) {
                if ($user->hasRole($role)) {
                    $hasRole = true;
                    break;
                }
            }

            if (!$hasRole) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'error' => 'Forbidden: You do not have the required role.'
                    ], 403);
                }

                return redirect()->route('dashboard')
                    ->with('error', 'You do not have the required role to access this resource.');
            }
        }

        return $next($request);
    }
}
```

### 3.7 Middleware Registration (Kernel.php)

```php
<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    // ... other middleware ...

    protected $routeMiddleware = [
        // ... other route middleware ...

        'permission' => \App\Http\Middleware\CheckPermission::class,
        'check.role' => \App\Http\Middleware\CheckRole::class,
    ];
}
```

### 3.8 Inertia Middleware: HandleInertiaRequests.php

```php
<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request)
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? $user->load(['profile', 'role']) : null,
                'role' => $user && $user->role ? [
                    'id' => $user->role->id,
                    'name' => $user->role->name,
                    'slug' => $user->role->slug,
                ] : null,
                'permissions' => $user ? $user->getPermissionSlugs() : [],
                'isSuperAdmin' => $user ? $user->isSuperAdmin() : false,
                'isAdmin' => $user ? $user->isAdmin() : false,
                'isSales' => $user ? $user->hasRole('sales') : false,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}
```

---

## 4. FRONTEND IMPLEMENTATION

### 4.1 Roles List Page

#### Page: `resources/js/Pages/Roles/Index.jsx`
```jsx
import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ShieldCheckIcon,
    PencilIcon,
    TrashIcon,
    UserGroupIcon,
    KeyIcon,
} from '@heroicons/react/24/outline';

export default function RolesIndex({ roles }) {
    const { auth, flash } = usePage().props;

    const handleDelete = (roleId, roleName, isSystem, usersCount) => {
        if (isSystem) {
            alert('System roles cannot be deleted.');
            return;
        }
        if (usersCount > 0) {
            alert('Cannot delete role with assigned users.');
            return;
        }
        if (confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
            router.delete(`/roles/${roleId}`);
        }
    };

    return (
        <div className="py-6">
            <Head title="Roles" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Flash Messages */}
                {flash.success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">{flash.success}</p>
                    </div>
                )}
                {flash.error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{flash.error}</p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Roles</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Manage system roles and their permissions
                                </p>
                            </div>
                            <Link
                                href="/roles/create"
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                            >
                                <ShieldCheckIcon className="w-4 h-4 mr-2" />
                                Create Role
                            </Link>
                        </div>
                    </div>

                    {/* Roles Grid */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    className={`border rounded-lg p-6 ${
                                        role.is_system
                                            ? 'border-indigo-200 bg-indigo-50'
                                            : 'border-gray-200 bg-white'
                                    }`}
                                >
                                    {/* Role Header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {role.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {role.slug}
                                            </p>
                                        </div>
                                        {role.is_system && (
                                            <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                                                System
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {role.description && (
                                        <p className="text-sm text-gray-600 mt-3">
                                            {role.description}
                                        </p>
                                    )}

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <UserGroupIcon className="w-4 h-4 mr-1" />
                                            {role.users_count} users
                                        </div>
                                        <div className="flex items-center">
                                            <KeyIcon className="w-4 h-4 mr-1" />
                                            {role.permissions_count} permissions
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                                        <Link
                                            href={`/roles/${role.id}/edit`}
                                            className="flex items-center px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
                                        >
                                            <PencilIcon className="w-4 h-4 mr-1" />
                                            Edit
                                        </Link>
                                        {!role.is_system && role.users_count === 0 && (
                                            <button
                                                onClick={() => handleDelete(
                                                    role.id,
                                                    role.name,
                                                    role.is_system,
                                                    role.users_count
                                                )}
                                                className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <TrashIcon className="w-4 h-4 mr-1" />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
```

### 4.2 Role Edit Page with Permissions

#### Page: `resources/js/Pages/Roles/Edit.jsx`
```jsx
import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function RolesEdit({ role, permissionGroups, rolePermissions }) {
    const { flash } = usePage().props;

    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        description: role.description || '',
        permissions: rolePermissions,
    });

    // Handle permission toggle
    const togglePermission = (permissionId) => {
        const newPermissions = data.permissions.includes(permissionId)
            ? data.permissions.filter(id => id !== permissionId)
            : [...data.permissions, permissionId];
        setData('permissions', newPermissions);
    };

    // Handle select all in group
    const toggleGroupPermissions = (groupPermissions) => {
        const groupIds = groupPermissions.map(p => p.id);
        const allSelected = groupIds.every(id => data.permissions.includes(id));

        if (allSelected) {
            // Deselect all in group
            setData('permissions', data.permissions.filter(id => !groupIds.includes(id)));
        } else {
            // Select all in group
            const newPermissions = [...new Set([...data.permissions, ...groupIds])];
            setData('permissions', newPermissions);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/roles/${role.id}`);
    };

    const handleUpdatePermissions = () => {
        put(`/roles/${role.id}/permissions`, {
            data: { permissions: data.permissions },
        });
    };

    return (
        <div className="py-6">
            <Head title={`Edit Role: ${role.name}`} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Flash Messages */}
                {flash.success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">{flash.success}</p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-xl font-semibold text-gray-900">
                            Edit Role: {role.name}
                        </h1>
                        {role.is_system && (
                            <p className="text-sm text-amber-600 mt-1">
                                This is a system role. Name cannot be changed.
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Basic Info */}
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Basic Information
                            </h2>

                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Role Name
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        disabled={role.is_system}
                                        className={`mt-1 block w-full border-gray-300 rounded-lg ${
                                            role.is_system ? 'bg-gray-100' : ''
                                        }`}
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Permissions */}
                        <div className="p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Permissions
                            </h2>

                            <div className="space-y-6">
                                {Object.entries(permissionGroups).map(([group, permissions]) => (
                                    <div key={group} className="border border-gray-200 rounded-lg p-4">
                                        {/* Group Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-medium text-gray-900">{group}</h3>
                                            <button
                                                type="button"
                                                onClick={() => toggleGroupPermissions(permissions)}
                                                className="text-sm text-indigo-600 hover:text-indigo-500"
                                            >
                                                {permissions.every(p => data.permissions.includes(p.id))
                                                    ? 'Deselect All'
                                                    : 'Select All'}
                                            </button>
                                        </div>

                                        {/* Permission Checkboxes */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {permissions.map((permission) => (
                                                <label
                                                    key={permission.id}
                                                    className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={data.permissions.includes(permission.id)}
                                                        onChange={() => togglePermission(permission.id)}
                                                        className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        {permission.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-4">
                            <Link
                                href="/roles"
                                className="text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
```

### 4.3 Frontend Permission Checking

#### Usage in React Components
```jsx
import { usePage } from '@inertiajs/react';

export default function SomeComponent() {
    const { auth } = usePage().props;

    // Check specific permission
    const canViewUsers = auth.permissions.includes('users.view');
    const canCreateProducts = auth.permissions.includes('products.create');

    // Check role
    const isSuperAdmin = auth.isSuperAdmin;
    const isAdmin = auth.isAdmin;

    return (
        <div>
            {/* Conditionally render based on permission */}
            {canViewUsers && (
                <Link href="/users">View Users</Link>
            )}

            {canCreateProducts && (
                <button>Create Product</button>
            )}

            {/* SuperAdmin only content */}
            {isSuperAdmin && (
                <div>SuperAdmin Controls</div>
            )}
        </div>
    );
}
```

---

## 5. PERMISSION MATRIX

### 5.1 Complete Permission List

| Group | Permission Slug | Permission Name | SuperAdmin | Admin | Sales | Operations |
|-------|-----------------|-----------------|:----------:|:-----:|:-----:|:----------:|
| **Dashboard** |
| | dashboard.view | View Dashboard | ✓ | ✓ | ✓ | ✓ |
| | dashboard.admin | View Admin Dashboard | ✓ | ✓ | ✗ | ✗ |
| | dashboard.sales | View Sales Dashboard | ✓ | ✓ | ✓ | ✗ |
| | dashboard.operations | View Operations Dashboard | ✓ | ✓ | ✗ | ✓ |
| **Users** |
| | users.view | View Users | ✓ | ✗ | ✗ | ✗ |
| | users.create | Create Users | ✓ | ✗ | ✗ | ✗ |
| | users.edit | Edit Users | ✓ | ✗ | ✗ | ✗ |
| | users.delete | Delete Users | ✓ | ✗ | ✗ | ✗ |
| | users.assign-roles | Assign Roles | ✓ | ✗ | ✗ | ✗ |
| **Roles** |
| | roles.view | View Roles | ✓ | ✗ | ✗ | ✗ |
| | roles.create | Create Roles | ✓ | ✗ | ✗ | ✗ |
| | roles.edit | Edit Roles | ✓ | ✗ | ✗ | ✗ |
| | roles.delete | Delete Roles | ✓ | ✗ | ✗ | ✗ |
| | permissions.manage | Manage Permissions | ✓ | ✗ | ✗ | ✗ |
| **Products** |
| | products.view | View Products | ✓ | ✓ | ✓ | ✓ |
| | products.create | Create Products | ✓ | ✓ | ✓ | ✗ |
| | products.edit | Edit Products | ✓ | ✓ | ✓ | ✗ |
| | products.delete | Delete Products | ✓ | ✓ | ✓ | ✗ |
| | products.import | Import Products | ✓ | ✓ | ✓ | ✗ |
| | products.restore | Restore Products | ✓ | ✓ | ✓ | ✗ |
| | products.toggle-status | Toggle Product Status | ✓ | ✓ | ✓ | ✗ |
| **Clients** |
| | clients.view | View Clients | ✓ | ✓ | ✓ | ✓ |
| | clients.create | Create Clients | ✓ | ✓ | ✓ | ✗ |
| | clients.edit | Edit Clients | ✓ | ✓ | ✓ | ✗ |
| | clients.delete | Delete Clients | ✓ | ✓ | ✓ | ✗ |
| **Quotations** |
| | quotations.view | View Quotations | ✓ | ✓ | ✓ | ✓ |
| | quotations.create | Create Quotations | ✓ | ✓ | ✓ | ✓ |
| | quotations.edit | Edit Quotations | ✓ | ✓ | ✓ | ✓ |
| | quotations.delete | Delete Quotations | ✓ | ✓ | ✓ | ✗ |
| | quotations.download | Download Quotations | ✓ | ✓ | ✓ | ✓ |
| **Activity** |
| | activity.view | View Activity Logs | ✓ | ✓ | ✗ | ✗ |
| **Profile** |
| | profile.view | View Profile | ✓ | ✓ | ✓ | ✓ |
| | profile.edit | Edit Profile | ✓ | ✓ | ✓ | ✓ |

---

## 6. MIDDLEWARE ENFORCEMENT

### 6.1 Route Protection Examples

```php
// Single permission
Route::get('/users', [UserManagementController::class, 'index'])
    ->middleware('permission:users.view');

// Multiple permissions (OR logic)
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware('permission:dashboard.view,dashboard.admin');

// Nested middleware
Route::middleware(['permission:products.view'])->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/create', [ProductController::class, 'create'])
        ->middleware('permission:products.create');
});

// Role-based middleware
Route::get('/admin-only', [AdminController::class, 'index'])
    ->middleware('check.role:superadmin,admin');
```

### 6.2 Middleware Execution Flow
```
[HTTP Request]
       │
       ▼
[Authentication Middleware]
       │
       ├── Not authenticated → Redirect to login
       │
       ▼
[CheckPermission Middleware]
       │
       ├── Load user's role
       │
       ├── Is SuperAdmin? → Allow (bypass all checks)
       │
       ├── Has required permission? → Allow
       │
       └── No permission → Return 403 or redirect with error
```

---

## 7. SEEDER CONFIGURATION

### 7.1 RolesAndPermissionsSeeder.php

```php
<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Disable foreign key checks for seeding
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Clear existing data
        DB::table('role_permission')->truncate();
        Permission::truncate();
        Role::truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Create Permissions
        $permissions = [
            // Dashboard Permissions
            ['name' => 'View Dashboard', 'slug' => 'dashboard.view', 'group' => 'Dashboard', 'description' => 'Access to view the dashboard'],
            ['name' => 'View Admin Dashboard', 'slug' => 'dashboard.admin', 'group' => 'Dashboard', 'description' => 'Access to admin dashboard with full metrics'],
            ['name' => 'View Sales Dashboard', 'slug' => 'dashboard.sales', 'group' => 'Dashboard', 'description' => 'Access to sales-specific dashboard'],
            ['name' => 'View Operations Dashboard', 'slug' => 'dashboard.operations', 'group' => 'Dashboard', 'description' => 'Access to operations-specific dashboard'],

            // User Management Permissions
            ['name' => 'View Users', 'slug' => 'users.view', 'group' => 'Users', 'description' => 'View list of users'],
            ['name' => 'Create Users', 'slug' => 'users.create', 'group' => 'Users', 'description' => 'Create new users'],
            ['name' => 'Edit Users', 'slug' => 'users.edit', 'group' => 'Users', 'description' => 'Edit existing users'],
            ['name' => 'Delete Users', 'slug' => 'users.delete', 'group' => 'Users', 'description' => 'Delete users'],
            ['name' => 'Assign Roles', 'slug' => 'users.assign-roles', 'group' => 'Users', 'description' => 'Assign roles to users'],

            // Role Management Permissions
            ['name' => 'View Roles', 'slug' => 'roles.view', 'group' => 'Roles', 'description' => 'View list of roles'],
            ['name' => 'Create Roles', 'slug' => 'roles.create', 'group' => 'Roles', 'description' => 'Create new roles'],
            ['name' => 'Edit Roles', 'slug' => 'roles.edit', 'group' => 'Roles', 'description' => 'Edit existing roles'],
            ['name' => 'Delete Roles', 'slug' => 'roles.delete', 'group' => 'Roles', 'description' => 'Delete roles'],
            ['name' => 'Manage Permissions', 'slug' => 'permissions.manage', 'group' => 'Roles', 'description' => 'Manage role permissions'],

            // Product Management Permissions
            ['name' => 'View Products', 'slug' => 'products.view', 'group' => 'Products', 'description' => 'View list of products'],
            ['name' => 'Create Products', 'slug' => 'products.create', 'group' => 'Products', 'description' => 'Create new products'],
            ['name' => 'Edit Products', 'slug' => 'products.edit', 'group' => 'Products', 'description' => 'Edit existing products'],
            ['name' => 'Delete Products', 'slug' => 'products.delete', 'group' => 'Products', 'description' => 'Delete products'],
            ['name' => 'Import Products', 'slug' => 'products.import', 'group' => 'Products', 'description' => 'Import products from file'],
            ['name' => 'Restore Products', 'slug' => 'products.restore', 'group' => 'Products', 'description' => 'Restore deleted products'],
            ['name' => 'Toggle Product Status', 'slug' => 'products.toggle-status', 'group' => 'Products', 'description' => 'Toggle product active/inactive status'],

            // Client Management Permissions
            ['name' => 'View Clients', 'slug' => 'clients.view', 'group' => 'Clients', 'description' => 'View list of clients'],
            ['name' => 'Create Clients', 'slug' => 'clients.create', 'group' => 'Clients', 'description' => 'Create new clients'],
            ['name' => 'Edit Clients', 'slug' => 'clients.edit', 'group' => 'Clients', 'description' => 'Edit existing clients'],
            ['name' => 'Delete Clients', 'slug' => 'clients.delete', 'group' => 'Clients', 'description' => 'Delete clients'],

            // Quotation Management Permissions
            ['name' => 'View Quotations', 'slug' => 'quotations.view', 'group' => 'Quotations', 'description' => 'View list of quotations'],
            ['name' => 'Create Quotations', 'slug' => 'quotations.create', 'group' => 'Quotations', 'description' => 'Create new quotations'],
            ['name' => 'Edit Quotations', 'slug' => 'quotations.edit', 'group' => 'Quotations', 'description' => 'Edit existing quotations'],
            ['name' => 'Delete Quotations', 'slug' => 'quotations.delete', 'group' => 'Quotations', 'description' => 'Delete quotations'],
            ['name' => 'Download Quotations', 'slug' => 'quotations.download', 'group' => 'Quotations', 'description' => 'Download quotation PDFs'],

            // Profile Permissions
            ['name' => 'View Profile', 'slug' => 'profile.view', 'group' => 'Profile', 'description' => 'View own profile'],
            ['name' => 'Edit Profile', 'slug' => 'profile.edit', 'group' => 'Profile', 'description' => 'Edit own profile'],

            // Activity Log Permissions
            ['name' => 'View Activity Logs', 'slug' => 'activity.view', 'group' => 'Activity', 'description' => 'View activity logs'],
        ];

        foreach ($permissions as $permission) {
            Permission::create($permission);
        }

        // Create Roles
        $superAdminRole = Role::create([
            'name' => 'Super Admin',
            'slug' => 'superadmin',
            'description' => 'Full system access including user, role, and permission management',
            'is_system' => true,
        ]);

        $adminRole = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
            'description' => 'Full system access except user management and roles/permissions management',
            'is_system' => true,
        ]);

        $salesRole = Role::create([
            'name' => 'Sales',
            'slug' => 'sales',
            'description' => 'Access limited to product management, client management, and quotation management',
            'is_system' => true,
        ]);

        $operationsRole = Role::create([
            'name' => 'Operations',
            'slug' => 'operations',
            'description' => 'Access limited to quotation management only',
            'is_system' => true,
        ]);

        // Assign permissions to roles
        // SuperAdmin gets all permissions
        $allPermissionIds = Permission::pluck('id')->toArray();
        $superAdminRole->permissions()->sync($allPermissionIds);

        // Admin permissions - all except user/role management
        $adminPermissions = Permission::whereNotIn('slug', [
            'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign-roles',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'permissions.manage',
        ])->pluck('id')->toArray();
        $adminRole->permissions()->sync($adminPermissions);

        // Sales permissions
        $salesPermissions = Permission::whereIn('slug', [
            'dashboard.view', 'dashboard.sales',
            'products.view', 'products.create', 'products.edit', 'products.delete',
            'products.import', 'products.restore', 'products.toggle-status',
            'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
            'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.delete', 'quotations.download',
            'profile.view', 'profile.edit',
        ])->pluck('id')->toArray();
        $salesRole->permissions()->sync($salesPermissions);

        // Operations permissions
        $operationsPermissions = Permission::whereIn('slug', [
            'dashboard.view', 'dashboard.operations',
            'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.download',
            'products.view',
            'clients.view',
            'profile.view', 'profile.edit',
        ])->pluck('id')->toArray();
        $operationsRole->permissions()->sync($operationsPermissions);

        // Assign SuperAdmin role to first user
        $firstUser = User::first();
        if ($firstUser) {
            $firstUser->update(['role_id' => $superAdminRole->id]);
        }

        $this->command->info('Roles and Permissions seeded successfully!');
    }
}
```

---

## 8. ROUTES CONFIGURATION

```php
// routes/web.php

Route::middleware(['auth'])->group(function () {
    // Roles Management (SuperAdmin only)
    Route::middleware(['permission:roles.view'])->group(function () {
        Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
        Route::get('/roles/create', [RoleController::class, 'create'])
            ->middleware('permission:roles.create')
            ->name('roles.create');
        Route::post('/roles', [RoleController::class, 'store'])
            ->middleware('permission:roles.create')
            ->name('roles.store');
        Route::get('/roles/{role}', [RoleController::class, 'show'])
            ->name('roles.show');
        Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])
            ->middleware('permission:roles.edit')
            ->name('roles.edit');
        Route::put('/roles/{role}', [RoleController::class, 'update'])
            ->middleware('permission:roles.edit')
            ->name('roles.update');
        Route::delete('/roles/{role}', [RoleController::class, 'destroy'])
            ->middleware('permission:roles.delete')
            ->name('roles.destroy');
        Route::put('/roles/{role}/permissions', [RoleController::class, 'updatePermissions'])
            ->middleware('permission:permissions.manage')
            ->name('roles.permissions.update');
    });

    // Permissions Management (view only)
    Route::middleware(['permission:roles.view'])->group(function () {
        Route::get('/permissions', [PermissionController::class, 'index'])
            ->name('permissions.index');
        Route::get('/permissions/{permission}', [PermissionController::class, 'show'])
            ->name('permissions.show');
        Route::get('/api/permissions/grouped', [PermissionController::class, 'grouped'])
            ->name('permissions.grouped');
    });
});
```

---

## 9. IMPLEMENTATION GUIDE

### 9.1 Step-by-Step Implementation

#### Step 1: Create Migrations
```bash
php artisan make:migration create_roles_table
php artisan make:migration create_permissions_table
php artisan make:migration create_role_permission_table
php artisan make:migration add_role_id_to_users_table
php artisan migrate
```

#### Step 2: Create Models
```bash
php artisan make:model Role
php artisan make:model Permission
```

#### Step 3: Create Controllers
```bash
php artisan make:controller RoleController
php artisan make:controller PermissionController
```

#### Step 4: Create Middleware
```bash
php artisan make:middleware CheckPermission
php artisan make:middleware CheckRole
```

#### Step 5: Register Middleware
Add to `app/Http/Kernel.php`:
```php
protected $routeMiddleware = [
    'permission' => \App\Http\Middleware\CheckPermission::class,
    'check.role' => \App\Http\Middleware\CheckRole::class,
];
```

#### Step 6: Create Seeder
```bash
php artisan make:seeder RolesAndPermissionsSeeder
```

#### Step 7: Run Seeder
```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

#### Step 8: Update HandleInertiaRequests Middleware
Add permission sharing as shown in section 3.8.

#### Step 9: Create Frontend Pages
```bash
resources/js/Pages/Roles/Index.jsx
resources/js/Pages/Roles/Create.jsx
resources/js/Pages/Roles/Edit.jsx
resources/js/Pages/Permissions/Index.jsx
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-09
**Module:** Roles & Permissions (RBAC)

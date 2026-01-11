# MODULE 02: USER MANAGEMENT

## TABLE OF CONTENTS
```
1. Module Overview
2. Database Design
3. Backend Architecture
4. Frontend Implementation
5. User Lifecycle Management
6. Routes Configuration
7. Implementation Guide
```

---

## 1. MODULE OVERVIEW

### 1.1 Purpose
The User Management module provides comprehensive functionality for creating, viewing, editing, and deleting system users. It includes role assignment, password setup email flow, user status management, and CSV export capabilities.

### 1.2 Features
- User CRUD operations (Create, Read, Update, Delete)
- Role assignment during user creation/editing
- Automatic password setup email for new users
- Resend password setup email functionality
- User search and filtering (by role, status, date range)
- Pagination with configurable page size
- CSV export with applied filters
- Soft delete with potential for restore
- Activity logging for all user operations

### 1.3 Access Control
```yaml
Required Permissions:
  - users.view: View user list and details
  - users.create: Create new users
  - users.edit: Edit existing users
  - users.delete: Delete users
  - users.assign-roles: Assign roles to users

Access Level:
  - SuperAdmin only (by default configuration)
```

### 1.4 Business Logic Flow
```
[Create User Flow]
         │
         ▼
[Fill form with name, email, role]
         │
         ▼
[Validate unique email]
         │
         ▼
[Create user record with:
 - Random temporary password
 - password_set = false
 - password_setup_token
 - password_setup_token_expires_at (48 hours)]
         │
         ▼
[Create associated profile record]
         │
         ▼
[Send PasswordSetupMail with token link]
         │
         ▼
[Log activity: user_created]
         │
         ▼
[Redirect to users list with success message]
```

---

## 2. DATABASE DESIGN

### 2.1 Users Table (Complete Schema)

#### Table: `users`
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Basic Information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,

    -- Password Setup (for new users)
    password_setup_token VARCHAR(255) NULL,
    password_setup_token_expires_at TIMESTAMP NULL,
    password_set TINYINT(1) DEFAULT 0,

    -- Role Assignment
    role_id BIGINT UNSIGNED NULL,

    -- Email Signature
    signature_html TEXT NULL,

    -- Timestamps
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,

    -- Indexes
    INDEX users_email_index (email),
    INDEX users_role_id_index (role_id),
    INDEX users_password_set_index (password_set),
    INDEX users_deleted_at_index (deleted_at),

    -- Foreign Keys
    CONSTRAINT users_role_id_foreign
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 Profiles Table

#### Table: `profiles`
```sql
CREATE TABLE profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,

    -- Company Information
    company_name VARCHAR(255) NULL,
    contact_name VARCHAR(255) NULL,
    contact_number VARCHAR(20) NULL,
    contact_email VARCHAR(255) NULL,
    vat_number VARCHAR(50) NULL,

    -- Timestamps
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,

    -- Foreign Keys
    CONSTRAINT profiles_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.3 Field Specifications

#### Users Table Fields
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary identifier |
| name | VARCHAR(255) | NOT NULL | User's full name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Login email (must be unique) |
| email_verified_at | TIMESTAMP | NULL | When email was verified |
| password | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| remember_token | VARCHAR(100) | NULL | Remember me functionality |
| password_setup_token | VARCHAR(255) | NULL | Token for new user password setup |
| password_setup_token_expires_at | TIMESTAMP | NULL | Token expiration (48 hours from creation) |
| password_set | TINYINT(1) | DEFAULT 0 | Whether user has set their password |
| role_id | BIGINT UNSIGNED | NULL, FK | Reference to roles table |
| signature_html | TEXT | NULL | HTML email signature |
| deleted_at | TIMESTAMP | NULL | Soft delete timestamp |

#### Profiles Table Fields
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary identifier |
| user_id | BIGINT UNSIGNED | NOT NULL, FK | Reference to users table |
| company_name | VARCHAR(255) | NULL | User's company name |
| contact_name | VARCHAR(255) | NULL | Contact person name |
| contact_number | VARCHAR(20) | NULL | Contact phone number |
| contact_email | VARCHAR(255) | NULL | Contact email address |
| vat_number | VARCHAR(50) | NULL | VAT registration number |
| deleted_at | TIMESTAMP | NULL | Soft delete timestamp |

### 2.4 Migrations

#### Migration: `2025_06_23_064133_create_profiles_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProfilesTable extends Migration
{
    public function up()
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('company_name')->nullable();
            $table->string('contact_name')->nullable();
            $table->string('contact_number', 20)->nullable();
            $table->string('contact_email')->nullable();
            $table->string('vat_number', 50)->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('profiles');
    }
}
```

#### Migration: `2025_07_24_095307_add_softdeletes_to_users_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSoftdeletesToUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
}
```

#### Migration: `2026_01_04_115351_add_signature_html_to_users_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSignatureHtmlToUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('signature_html')->nullable()->after('role_id');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('signature_html');
        });
    }
}
```

---

## 3. BACKEND ARCHITECTURE

### 3.1 Model: User.php

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'password_setup_token',
        'password_setup_token_expires_at',
        'password_set',
        'signature_html',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'password_setup_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password_setup_token_expires_at' => 'datetime',
        'password_set' => 'boolean',
    ];

    // ============================================
    // RELATIONSHIPS
    // ============================================

    /**
     * Get the role that the user belongs to
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the user's profile
     */
    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    /**
     * Get the user's two-factor codes
     */
    public function twoFactorCodes()
    {
        return $this->hasMany(TwoFactorCode::class);
    }

    // ============================================
    // ROLE HELPER METHODS
    // ============================================

    /**
     * Check if user is SuperAdmin
     */
    public function isSuperAdmin(): bool
    {
        return $this->role && $this->role->slug === 'superadmin';
    }

    /**
     * Check if user is Admin or SuperAdmin
     */
    public function isAdmin(): bool
    {
        return $this->role && in_array($this->role->slug, ['superadmin', 'admin']);
    }

    /**
     * Check if user has specific role
     */
    public function hasRole(string $roleSlug): bool
    {
        return $this->role && $this->role->slug === $roleSlug;
    }

    /**
     * Check if user has specific permission
     */
    public function hasPermission(string $permissionSlug): bool
    {
        // SuperAdmin has all permissions
        if ($this->isSuperAdmin()) {
            return true;
        }

        if (!$this->role) {
            return false;
        }

        return $this->role->permissions()
            ->where('slug', $permissionSlug)
            ->exists();
    }

    /**
     * Get all permission slugs for this user
     */
    public function getPermissionSlugs(): array
    {
        if ($this->isSuperAdmin()) {
            return Permission::pluck('slug')->toArray();
        }

        if (!$this->role) {
            return [];
        }

        return $this->role->permissions()->pluck('slug')->toArray();
    }
}
```

### 3.2 Model: Profile.php

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Profile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'company_name',
        'contact_name',
        'contact_number',
        'contact_email',
        'vat_number',
    ];

    // ============================================
    // RELATIONSHIPS
    // ============================================

    /**
     * Get the user that owns this profile
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

### 3.3 Controller: UserManagementController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Profile;
use App\Mail\PasswordSetupMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    // ============================================
    // INDEX - LIST USERS
    // ============================================

    public function index(Request $request)
    {
        $query = User::with(['role', 'profile']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('profile', function ($pq) use ($search) {
                      $pq->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        // Role filter
        if ($request->filled('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        // Status filter (active, pending, inactive)
        if ($request->filled('status')) {
            switch ($request->status) {
                case 'active':
                    $query->where('password_set', true);
                    break;
                case 'pending':
                    $query->where('password_set', false);
                    break;
            }
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Paginate results
        $users = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Get roles for filter dropdown
        $roles = Role::select('id', 'name', 'slug')->get();

        return Inertia::render('Auth/UserManagement', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only([
                'search', 'role_id', 'status', 'date_from', 'date_to'
            ]),
            'success' => session('success'),
        ]);
    }

    // ============================================
    // CREATE - SHOW CREATE FORM
    // ============================================

    public function create()
    {
        $roles = Role::select('id', 'name', 'slug', 'description')->get();

        return Inertia::render('Auth/UserManagementCreate', [
            'roles' => $roles,
        ]);
    }

    // ============================================
    // STORE - CREATE NEW USER
    // ============================================

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'role_id' => ['required', 'exists:roles,id'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'vat_number' => ['nullable', 'string', 'max:50'],
        ]);

        // Generate password setup token
        $token = Str::random(64);

        // Create user with temporary password
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make(Str::random(32)), // Temporary password
            'role_id' => $validated['role_id'],
            'password_setup_token' => $token,
            'password_setup_token_expires_at' => now()->addHours(48),
            'password_set' => false,
        ]);

        // Create associated profile
        Profile::create([
            'user_id' => $user->id,
            'company_name' => $validated['company_name'] ?? null,
            'contact_name' => $validated['contact_name'] ?? null,
            'contact_number' => $validated['contact_number'] ?? null,
            'contact_email' => $validated['contact_email'] ?? null,
            'vat_number' => $validated['vat_number'] ?? null,
        ]);

        // Send password setup email
        Mail::to($user->email)->send(new PasswordSetupMail($user, $token));

        return redirect()->route('users.index')
            ->with('success', 'User created successfully. A password setup email has been sent.');
    }

    // ============================================
    // SHOW - VIEW USER DETAILS
    // ============================================

    public function show(User $user)
    {
        $user->load(['role', 'profile']);

        return Inertia::render('Auth/UserManagementShow', [
            'user' => $user,
        ]);
    }

    // ============================================
    // EDIT - SHOW EDIT FORM
    // ============================================

    public function edit(User $user)
    {
        $user->load(['role', 'profile']);
        $roles = Role::select('id', 'name', 'slug', 'description')->get();

        return Inertia::render('Auth/UserManagementEdit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    // ============================================
    // UPDATE - UPDATE USER
    // ============================================

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255',
                        Rule::unique('users')->ignore($user->id)],
            'role_id' => ['required', 'exists:roles,id'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'vat_number' => ['nullable', 'string', 'max:50'],
        ]);

        // Update user
        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role_id' => $validated['role_id'],
        ]);

        // Update or create profile
        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'company_name' => $validated['company_name'] ?? null,
                'contact_name' => $validated['contact_name'] ?? null,
                'contact_number' => $validated['contact_number'] ?? null,
                'contact_email' => $validated['contact_email'] ?? null,
                'vat_number' => $validated['vat_number'] ?? null,
            ]
        );

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully.');
    }

    // ============================================
    // DESTROY - DELETE USER
    // ============================================

    public function destroy(User $user)
    {
        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return redirect()->back()
                ->with('error', 'You cannot delete your own account.');
        }

        // Soft delete
        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully.');
    }

    // ============================================
    // RESEND SETUP EMAIL
    // ============================================

    public function resendSetupEmail(User $user)
    {
        // Check if user already set password
        if ($user->password_set) {
            return redirect()->back()
                ->with('error', 'User has already set their password.');
        }

        // Generate new token
        $token = Str::random(64);
        $user->update([
            'password_setup_token' => $token,
            'password_setup_token_expires_at' => now()->addHours(48),
        ]);

        // Send email
        Mail::to($user->email)->send(new PasswordSetupMail($user, $token));

        // Log activity
        activity_log(
            'user_setup_email_resent',
            'Password setup email resent to: ' . $user->email,
            $user
        );

        return redirect()->back()
            ->with('success', 'Password setup email has been resent.');
    }

    // ============================================
    // EXPORT - CSV EXPORT
    // ============================================

    public function export(Request $request)
    {
        $query = User::with(['role', 'profile']);

        // Apply same filters as index
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('password_set', true);
            } elseif ($request->status === 'pending') {
                $query->where('password_set', false);
            }
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        $filename = 'users_' . now()->format('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($users) {
            $file = fopen('php://output', 'w');

            // CSV header
            fputcsv($file, [
                'ID',
                'Name',
                'Email',
                'Role',
                'Company',
                'Status',
                'Created At',
            ]);

            // CSV data
            foreach ($users as $user) {
                $status = $user->password_set ? 'Active' : 'Pending Setup';

                fputcsv($file, [
                    $user->id,
                    $user->name,
                    $user->email,
                    $user->role->name ?? 'No Role',
                    $user->profile->company_name ?? '-',
                    $status,
                    $user->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
```

### 3.4 Observer: UserObserver.php

```php
<?php

namespace App\Observers;

use App\Models\User;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user)
    {
        activity_log(
            'user_created',
            'User created: ' . $user->name,
            $user,
            ['user' => $user->toArray()]
        );
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user)
    {
        $changes = $user->getChanges();

        // Log only if fields actually changed
        if (!empty($changes)) {
            // Mask password in logs
            if (isset($changes['password'])) {
                $changes['password'] = '***hashed***';
            }

            activity_log(
                'user_updated',
                'User updated: ' . $user->name,
                $user,
                ['changes' => $changes]
            );
        }
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user)
    {
        activity_log(
            'user_deleted',
            'User deleted: ' . $user->name,
            $user
        );
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user)
    {
        activity_log(
            'user_restored',
            'User restored: ' . $user->name,
            $user
        );
    }

    /**
     * Handle the User "force deleted" event.
     */
    public function forceDeleted(User $user)
    {
        activity_log(
            'user_force_deleted',
            'User permanently deleted: ' . $user->name,
            $user
        );
    }
}
```

### 3.5 Mail: PasswordSetupMail.php

```php
<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordSetupMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public string $token;
    public string $setupUrl;

    public function __construct(User $user, string $token)
    {
        $this->user = $user;
        $this->token = $token;
        $this->setupUrl = url("/password/setup/{$token}?email=" . urlencode($user->email));
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Set Up Your Account Password - Rental System',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-setup',
        );
    }

    public function build()
    {
        return $this->subject('Set Up Your Account Password - Rental System')
                    ->view('emails.password-setup');
    }
}
```

---

## 4. FRONTEND IMPLEMENTATION

### 4.1 User List Page

#### Page: `resources/js/Pages/Auth/UserManagement.jsx`
```jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    XMarkIcon,
    UserPlusIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';
import debounce from 'lodash/debounce';

export default function UserManagement({ users, filters = {}, roles = [], success }) {
    const { auth } = usePage().props;

    // State for filters
    const [search, setSearch] = useState(filters.search || '');
    const [roleId, setRoleId] = useState(filters.role_id || '');
    const [status, setStatus] = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [showFilters, setShowFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Check if any filters are active
    const hasActiveFilters = roleId || status || dateFrom || dateTo;

    // Debounced filter function
    const applyFilters = useCallback(
        debounce((params) => {
            setIsLoading(true);
            router.get('/users', params, {
                preserveState: true,
                preserveScroll: true,
                only: ['users', 'filters'],
                onFinish: () => setIsLoading(false),
            });
        }, 300),
        []
    );

    // Handle search change with debounce
    const handleSearchChange = (value) => {
        setSearch(value);
        applyFilters({
            search: value,
            role_id: roleId,
            status: status,
            date_from: dateFrom,
            date_to: dateTo,
        });
    };

    // Handle filter changes (immediate)
    const handleFilterChange = (filterName, value) => {
        const newFilters = {
            search,
            role_id: filterName === 'role_id' ? value : roleId,
            status: filterName === 'status' ? value : status,
            date_from: filterName === 'date_from' ? value : dateFrom,
            date_to: filterName === 'date_to' ? value : dateTo,
        };

        // Update local state
        if (filterName === 'role_id') setRoleId(value);
        if (filterName === 'status') setStatus(value);
        if (filterName === 'date_from') setDateFrom(value);
        if (filterName === 'date_to') setDateTo(value);

        // Remove empty values
        const params = Object.fromEntries(
            Object.entries(newFilters).filter(([_, v]) => v !== '' && v !== null)
        );

        setIsLoading(true);
        router.get('/users', params, {
            preserveState: true,
            preserveScroll: true,
            only: ['users', 'filters'],
            onFinish: () => setIsLoading(false),
        });
    };

    // Clear all filters
    const clearFilters = () => {
        setSearch('');
        setRoleId('');
        setStatus('');
        setDateFrom('');
        setDateTo('');
        router.get('/users', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Get export URL with current filters
    const getExportUrl = () => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (roleId) params.append('role_id', roleId);
        if (status) params.append('status', status);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        return `/users/export?${params.toString()}`;
    };

    // Get user status badge
    const getUserStatus = (user) => {
        if (!user.password_set) {
            return {
                label: 'Pending Setup',
                color: 'bg-yellow-100 text-yellow-800'
            };
        }
        return {
            label: 'Active',
            color: 'bg-green-100 text-green-800'
        };
    };

    // Handle resend setup email
    const handleResendEmail = (userId) => {
        if (confirm('Resend password setup email to this user?')) {
            router.post(`/users/${userId}/resend-setup-email`);
        }
    };

    // Handle delete user
    const handleDelete = (userId) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(`/users/${userId}`);
        }
    };

    return (
        <div className="py-6">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                {/* Success Message */}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">{success}</p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Users</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {users.total} total users
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Export Button */}
                                <a
                                    href={getExportUrl()}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                    Export CSV
                                </a>
                                {/* Add User Button */}
                                <Link
                                    href="/users/create"
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                                >
                                    <UserPlusIcon className="w-4 h-4 mr-2" />
                                    Add User
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search Input */}
                            <div className="flex-1">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search users by name, email, company..."
                                        value={search}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {isLoading && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Filter Toggle Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center px-4 py-2.5 border rounded-lg text-sm font-medium ${
                                    hasActiveFilters
                                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <FunnelIcon className="w-4 h-4 mr-2" />
                                Filters
                                {hasActiveFilters && (
                                    <span className="ml-2 bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">
                                        {[roleId, status, dateFrom, dateTo].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Expandable Filters */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Role Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Role
                                        </label>
                                        <select
                                            value={roleId}
                                            onChange={(e) => handleFilterChange('role_id', e.target.value)}
                                            className="w-full border-gray-300 rounded-lg focus:ring-indigo-500"
                                        >
                                            <option value="">All Roles</option>
                                            {roles.map((role) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Status Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={status}
                                            onChange={(e) => handleFilterChange('status', e.target.value)}
                                            className="w-full border-gray-300 rounded-lg focus:ring-indigo-500"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="active">Active</option>
                                            <option value="pending">Pending Setup</option>
                                        </select>
                                    </div>

                                    {/* Date From */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            From Date
                                        </label>
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                            className="w-full border-gray-300 rounded-lg focus:ring-indigo-500"
                                        />
                                    </div>

                                    {/* Date To */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            To Date
                                        </label>
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                            className="w-full border-gray-300 rounded-lg focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <div className="mt-4">
                                        <button
                                            onClick={clearFilters}
                                            className="text-sm text-indigo-600 hover:text-indigo-500"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Users Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Company
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.data.map((user) => {
                                    const userStatus = getUserStatus(user);
                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                                    {user.role?.name || 'No Role'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.profile?.company_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${userStatus.color}`}>
                                                    {userStatus.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Resend Email (only for pending) */}
                                                    {!user.password_set && (
                                                        <button
                                                            onClick={() => handleResendEmail(user.id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title="Resend setup email"
                                                        >
                                                            <EnvelopeIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {/* Edit */}
                                                    <Link
                                                        href={`/users/${user.id}/edit`}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Edit
                                                    </Link>
                                                    {/* Delete */}
                                                    {user.id !== auth.user.id && (
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-700">
                                    Showing {users.from} to {users.to} of {users.total} results
                                </p>
                                <div className="flex gap-2">
                                    {users.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-1 text-sm rounded ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
```

### 4.2 Create User Page

#### Page: `resources/js/Pages/Auth/UserManagementCreate.jsx`
```jsx
import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Input from '@/Components/Input';
import Label from '@/Components/Label';
import Button from '@/Components/Button';
import ValidationErrors from '@/Components/ValidationErrors';

export default function UserManagementCreate({ roles }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        role_id: '',
        company_name: '',
        contact_name: '',
        contact_number: '',
        contact_email: '',
        vat_number: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/users');
    };

    return (
        <div className="py-6">
            <Head title="Create User" />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-xl font-semibold text-gray-900">
                            Create New User
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            A password setup email will be sent to the user.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <ValidationErrors errors={errors} />

                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Basic Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name */}
                                <div>
                                    <Label forInput="name" value="Full Name *" />
                                    <Input
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        handleChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <Label forInput="email" value="Email Address *" />
                                    <Input
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full"
                                        handleChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <Label forInput="role_id" value="Role *" />
                                <select
                                    name="role_id"
                                    value={data.role_id}
                                    onChange={(e) => setData('role_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    <option value="">Select a role</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Company Information */}
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">
                                Company Information (Optional)
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label forInput="company_name" value="Company Name" />
                                    <Input
                                        type="text"
                                        name="company_name"
                                        value={data.company_name}
                                        className="mt-1 block w-full"
                                        handleChange={(e) => setData('company_name', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label forInput="contact_name" value="Contact Name" />
                                    <Input
                                        type="text"
                                        name="contact_name"
                                        value={data.contact_name}
                                        className="mt-1 block w-full"
                                        handleChange={(e) => setData('contact_name', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label forInput="contact_number" value="Contact Number" />
                                    <Input
                                        type="text"
                                        name="contact_number"
                                        value={data.contact_number}
                                        className="mt-1 block w-full"
                                        handleChange={(e) => setData('contact_number', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label forInput="contact_email" value="Contact Email" />
                                    <Input
                                        type="email"
                                        name="contact_email"
                                        value={data.contact_email}
                                        className="mt-1 block w-full"
                                        handleChange={(e) => setData('contact_email', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label forInput="vat_number" value="VAT Number" />
                                    <Input
                                        type="text"
                                        name="vat_number"
                                        value={data.vat_number}
                                        className="mt-1 block w-full"
                                        handleChange={(e) => setData('vat_number', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                            <Link
                                href="/users"
                                className="text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </Link>
                            <Button processing={processing}>
                                Create User
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
```

---

## 5. USER LIFECYCLE MANAGEMENT

### 5.1 User States
```
[New User Created]
       │
       ▼
[State: PENDING SETUP]
 - password_set = false
 - password_setup_token exists
 - password_setup_token_expires_at set
       │
       ▼
[User clicks setup link]
       │
       ▼
[User sets password]
       │
       ▼
[State: ACTIVE]
 - password_set = true
 - password_setup_token = null
 - email_verified_at = now()
       │
       ▼
[User can now login]
```

### 5.2 User Status Indicators
| Status | Condition | Badge Color |
|--------|-----------|-------------|
| Pending Setup | password_set = false | Yellow |
| Active | password_set = true | Green |
| Deleted | deleted_at != null | Red (if shown) |

### 5.3 Password Setup Token Flow
```php
// Token generation (48 hours validity)
$token = Str::random(64);
$user->password_setup_token = $token;
$user->password_setup_token_expires_at = now()->addHours(48);

// Token validation
$user = User::where('password_setup_token', $token)
    ->where('password_setup_token_expires_at', '>', now())
    ->first();

// Token cleanup after use
$user->update([
    'password_setup_token' => null,
    'password_setup_token_expires_at' => null,
    'password_set' => true,
]);
```

---

## 6. ROUTES CONFIGURATION

### 6.1 User Management Routes
```php
// routes/web.php

Route::middleware(['auth'])->group(function () {
    // User Management Routes (SuperAdmin only)
    Route::middleware(['permission:users.view'])->group(function () {
        Route::get('/users', [UserManagementController::class, 'index'])
            ->name('users.index');

        Route::get('/users/export', [UserManagementController::class, 'export'])
            ->name('users.export');

        Route::get('/users/create', [UserManagementController::class, 'create'])
            ->middleware('permission:users.create')
            ->name('users.create');

        Route::post('/users', [UserManagementController::class, 'store'])
            ->middleware('permission:users.create')
            ->name('users.store');

        Route::get('/users/{user}', [UserManagementController::class, 'show'])
            ->name('users.show');

        Route::get('/users/{user}/edit', [UserManagementController::class, 'edit'])
            ->middleware('permission:users.edit')
            ->name('users.edit');

        Route::put('/users/{user}', [UserManagementController::class, 'update'])
            ->middleware('permission:users.edit')
            ->name('users.update');

        Route::delete('/users/{user}', [UserManagementController::class, 'destroy'])
            ->middleware('permission:users.delete')
            ->name('users.destroy');

        Route::post('/users/{user}/resend-setup-email', [UserManagementController::class, 'resendSetupEmail'])
            ->middleware('permission:users.edit')
            ->name('users.resend-setup-email');
    });
});
```

---

## 7. IMPLEMENTATION GUIDE

### 7.1 Step-by-Step Implementation

#### Step 1: Create Migrations
```bash
php artisan make:migration create_users_table
php artisan make:migration create_profiles_table
php artisan make:migration add_password_setup_fields_to_users_table
php artisan make:migration add_softdeletes_to_users_table
php artisan make:migration add_signature_html_to_users_table
php artisan migrate
```

#### Step 2: Create Models
```bash
php artisan make:model User
php artisan make:model Profile
```

#### Step 3: Create Controller
```bash
php artisan make:controller UserManagementController
```

#### Step 4: Create Observer
```bash
php artisan make:observer UserObserver --model=User
```

#### Step 5: Register Observer
In `App\Providers\AppServiceProvider.php`:
```php
public function boot()
{
    User::observe(UserObserver::class);
}
```

#### Step 6: Create Mail Class
```bash
php artisan make:mail PasswordSetupMail
```

#### Step 7: Create Email Template
Create `resources/views/emails/password-setup.blade.php`:
```blade
<!DOCTYPE html>
<html>
<head>
    <title>Set Up Your Password</title>
</head>
<body>
    <h1>Welcome {{ $user->name }}!</h1>
    <p>Your account has been created. Please click the link below to set up your password:</p>
    <p>
        <a href="{{ $setupUrl }}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
            Set Up Password
        </a>
    </p>
    <p>This link will expire in 48 hours.</p>
    <p>If you did not request this account, please ignore this email.</p>
</body>
</html>
```

#### Step 8: Create Frontend Pages
```bash
# Create the following files:
resources/js/Pages/Auth/UserManagement.jsx
resources/js/Pages/Auth/UserManagementCreate.jsx
resources/js/Pages/Auth/UserManagementEdit.jsx
```

#### Step 9: Configure Routes
Add routes to `routes/web.php` as shown in section 6.1.

#### Step 10: Test the Flow
1. Navigate to `/users`
2. Click "Add User"
3. Fill in user details and select role
4. Submit form
5. Verify user appears in list with "Pending Setup" status
6. Check email was sent
7. Click setup link in email
8. Set password
9. Verify user status changes to "Active"

---

## 8. VALIDATION RULES

### 8.1 Create User Validation
```php
[
    'name' => ['required', 'string', 'max:255'],
    'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
    'role_id' => ['required', 'exists:roles,id'],
    'company_name' => ['nullable', 'string', 'max:255'],
    'contact_name' => ['nullable', 'string', 'max:255'],
    'contact_number' => ['nullable', 'string', 'max:20'],
    'contact_email' => ['nullable', 'email', 'max:255'],
    'vat_number' => ['nullable', 'string', 'max:50'],
]
```

### 8.2 Update User Validation
```php
[
    'name' => ['required', 'string', 'max:255'],
    'email' => ['required', 'string', 'email', 'max:255',
                Rule::unique('users')->ignore($user->id)],
    'role_id' => ['required', 'exists:roles,id'],
    // ... same optional fields as create
]
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-09
**Module:** User Management

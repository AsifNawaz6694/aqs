# 06 - ACTIVITY LOGS MODULE

## Overview

The Activity Logs module provides comprehensive audit trail functionality for tracking all system activities. It records user actions, data changes, IP addresses, and role information. The system uses a combination of Observers, a dedicated Service class, and a global helper function for flexible activity logging throughout the application.

## Database Design

### Table: `activity_logs`

```sql
CREATE TABLE activity_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL,
    subject_id BIGINT UNSIGNED NULL,
    subject_type VARCHAR(255) NULL,
    causer_id BIGINT UNSIGNED NULL,
    causer_type VARCHAR(255) NULL,
    role_name VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    module VARCHAR(255) NULL,
    data JSON NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,

    INDEX idx_type (type),
    INDEX idx_module (module),
    INDEX idx_role_name (role_name),
    INDEX idx_created_at (created_at),
    INDEX idx_causer (causer_id, causer_type),
    INDEX idx_subject (subject_id, subject_type)
);
```

### Column Specifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY | Unique identifier |
| `type` | VARCHAR(255) | NOT NULL | Action type (e.g., `user_created`, `product_updated`) |
| `description` | VARCHAR(255) | NULL | Human-readable description |
| `subject_id` | BIGINT UNSIGNED | NULL | ID of affected entity (polymorphic) |
| `subject_type` | VARCHAR(255) | NULL | Class name of affected entity |
| `causer_id` | BIGINT UNSIGNED | NULL | ID of user who performed action |
| `causer_type` | VARCHAR(255) | NULL | Class name of causer (usually User) |
| `role_name` | VARCHAR(255) | NULL | Role of the user at time of action |
| `ip_address` | VARCHAR(45) | NULL | IP address (supports IPv6) |
| `module` | VARCHAR(255) | NULL | Module name (Users, Products, etc.) |
| `data` | JSON | NULL | Additional context data |
| `old_values` | JSON | NULL | Values before change |
| `new_values` | JSON | NULL | Values after change |
| `created_at` | TIMESTAMP | NULL | When activity occurred |
| `updated_at` | TIMESTAMP | NULL | Last update timestamp |
| `deleted_at` | TIMESTAMP | NULL | Soft delete timestamp |

### Migration History

**Initial Migration (2025_07_24_074524):**
```php
Schema::create('activity_logs', function (Blueprint $table) {
    $table->id();
    $table->string('type');  // e.g.: 'product_created', 'product_status_updated'
    $table->string('description')->nullable();
    $table->nullableMorphs('subject');  // subject_id, subject_type
    $table->nullableMorphs('causer');   // causer_id, causer_type
    $table->json('data')->nullable();   // for old/new values or extra info
    $table->timestamps();
    $table->softDeletes();
});
```

**Enhanced Fields Migration (2026_01_04_000010):**
```php
Schema::table('activity_logs', function (Blueprint $table) {
    $table->string('role_name')->nullable()->after('causer_type');
    $table->string('ip_address', 45)->nullable()->after('role_name');
    $table->string('module')->nullable()->after('ip_address');
    $table->json('old_values')->nullable()->after('data');
    $table->json('new_values')->nullable()->after('old_values');

    // Performance indexes
    $table->index('type');
    $table->index('module');
    $table->index('role_name');
    $table->index('created_at');
    $table->index(['causer_id', 'causer_type']);
    $table->index(['subject_id', 'subject_type']);
});
```

## Backend Architecture

### Model: `app/Models/ActivityLog.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivityLog extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'type',
        'description',
        'subject_id',
        'subject_type',
        'causer_id',
        'causer_type',
        'role_name',
        'ip_address',
        'module',
        'data',
        'old_values',
        'new_values',
    ];

    protected $casts = [
        'data' => 'array',
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    /**
     * Get the subject of the activity (Product, User, etc.)
     */
    public function subject()
    {
        return $this->morphTo();
    }

    /**
     * Get the user who caused the activity
     */
    public function causer()
    {
        return $this->morphTo();
    }
}
```

### Model Scopes

```php
/**
 * Scope to filter by module
 */
public function scopeForModule($query, $module)
{
    return $query->where('module', $module);
}

/**
 * Scope to filter by action type
 */
public function scopeForType($query, $type)
{
    return $query->where('type', $type);
}

/**
 * Scope to filter by user (causer)
 */
public function scopeByUser($query, $userId)
{
    return $query->where('causer_id', $userId)
                 ->where('causer_type', 'App\\Models\\User');
}

/**
 * Scope to filter by role
 */
public function scopeByRole($query, $roleName)
{
    return $query->where('role_name', $roleName);
}

/**
 * Scope to filter by date range
 */
public function scopeDateRange($query, $startDate, $endDate)
{
    if ($startDate) {
        $query->whereDate('created_at', '>=', $startDate);
    }
    if ($endDate) {
        $query->whereDate('created_at', '<=', $endDate);
    }
    return $query;
}
```

### Model Accessors

```php
/**
 * Get a human-readable action name
 */
public function getActionNameAttribute()
{
    $parts = explode('_', $this->type);
    $action = end($parts);
    return ucfirst($action);
}

/**
 * Get the display name for the subject
 */
public function getSubjectNameAttribute()
{
    if (!$this->subject) {
        return $this->module ?? 'Unknown';
    }

    if (method_exists($this->subject, 'getAttribute')) {
        return $this->subject->name
            ?? $this->subject->title
            ?? $this->subject->quotation_number
            ?? "#{$this->subject_id}";
    }

    return "#{$this->subject_id}";
}
```

### Static Helper Methods

```php
/**
 * Get available action types for filtering
 */
public static function getActionTypes()
{
    return self::select('type')
        ->distinct()
        ->orderBy('type')
        ->pluck('type')
        ->toArray();
}

/**
 * Get available modules for filtering
 */
public static function getModules()
{
    return self::select('module')
        ->whereNotNull('module')
        ->distinct()
        ->orderBy('module')
        ->pluck('module')
        ->toArray();
}

/**
 * Get available roles for filtering
 */
public static function getRoles()
{
    return self::select('role_name')
        ->whereNotNull('role_name')
        ->distinct()
        ->orderBy('role_name')
        ->pluck('role_name')
        ->toArray();
}
```

### Helper Function: `app/Helpers/activity_logger.php`

```php
<?php

if (!function_exists('activity_log')) {
    /**
     * Universal function to log activity.
     *
     * Supports both legacy and enhanced formats:
     *
     * Legacy:  activity_log($type, $description, $subject, $data)
     * Enhanced: activity_log($type, $description, $subject, [
     *     'old_values' => [...],
     *     'new_values' => [...],
     *     'module' => 'Users',
     *     'data' => [...],
     * ])
     *
     * @param string $type Activity type
     * @param string|null $description Human-readable description
     * @param mixed|null $subject The affected model
     * @param array|null $data Additional data or options array
     * @return \App\Models\ActivityLog
     */
    function activity_log($type, $description = null, $subject = null, $data = null)
    {
        $user = auth()->user();
        $request = request();

        // Determine subject ID/type
        $subject_id = null;
        $subject_type = null;
        $module = null;

        if ($subject && is_object($subject) && method_exists($subject, 'getKey')) {
            $subject_id = $subject->getKey();
            $subject_type = get_class($subject);
            // Extract module name from class
            $module = class_basename($subject_type);
            if (!str_ends_with($module, 's')) {
                $module .= 's';
            }
        }

        // Determine causer ID/type
        $causer_id = null;
        $causer_type = null;
        $role_name = null;

        if ($user && is_object($user) && method_exists($user, 'getKey')) {
            $causer_id = $user->getKey();
            $causer_type = get_class($user);
            if (method_exists($user, 'role') && $user->role) {
                $role_name = $user->role->name ?? null;
            }
        }

        // Get IP address
        $ip_address = $request ? $request->ip() : null;

        // Handle data/options
        $old_values = null;
        $new_values = null;
        $extra_data = null;
        $explicit_module = null;

        if (is_array($data)) {
            if (isset($data['old_values']) || isset($data['new_values']) || isset($data['module'])) {
                // Enhanced format
                $old_values = $data['old_values'] ?? null;
                $new_values = $data['new_values'] ?? null;
                $explicit_module = $data['module'] ?? null;
                $extra_data = $data['data'] ?? null;
            } else {
                // Legacy format
                $extra_data = $data;
            }
        }

        $final_module = $explicit_module ?? $module;

        // Extract module from type if not determined
        if (!$final_module && $type) {
            $type_parts = explode('_', $type);
            if (count($type_parts) >= 2) {
                $entity = ucfirst($type_parts[0]);
                if (!str_ends_with($entity, 's')) {
                    $entity .= 's';
                }
                $final_module = $entity;
            }
        }

        return \App\Models\ActivityLog::create([
            'type' => $type,
            'description' => $description,
            'subject_id' => $subject_id,
            'subject_type' => $subject_type,
            'causer_id' => $causer_id,
            'causer_type' => $causer_type,
            'role_name' => $role_name,
            'ip_address' => $ip_address,
            'module' => $final_module,
            'data' => $extra_data ? (is_array($extra_data) ? $extra_data : ['value' => $extra_data]) : null,
            'old_values' => $old_values,
            'new_values' => $new_values,
        ]);
    }
}

if (!function_exists('activity_log_with_changes')) {
    /**
     * Convenience function to log activity with old and new values.
     */
    function activity_log_with_changes($type, $description = null, $subject = null, $oldValues = null, $newValues = null, $module = null)
    {
        return activity_log($type, $description, $subject, [
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'module' => $module,
        ]);
    }
}
```

### Service Class: `app/Services/ActivityLogService.php`

```php
<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogService
{
    /**
     * Log an activity
     */
    public static function log(
        string $type,
        string $description,
        $subject = null,
        array $data = [],
        array $oldValues = null,
        array $newValues = null
    ): ActivityLog {
        $user = Auth::user();

        return ActivityLog::create([
            'type' => $type,
            'description' => $description,
            'subject_id' => $subject?->id,
            'subject_type' => $subject ? get_class($subject) : null,
            'causer_id' => $user?->id,
            'causer_type' => $user ? get_class($user) : null,
            'role_name' => $user?->role?->name,
            'ip_address' => Request::ip(),
            'module' => self::extractModule($type),
            'data' => !empty($data) ? $data : null,
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }

    /**
     * Extract module name from type
     */
    private static function extractModule(string $type): string
    {
        if (str_starts_with($type, 'prospecting_customer')) {
            return 'prospecting_customers';
        }
        if (str_starts_with($type, 'prospecting_import')) {
            return 'prospecting_import';
        }
        if (str_starts_with($type, 'prospecting_email')) {
            return 'prospecting_email';
        }
        if (str_starts_with($type, 'email_template')) {
            return 'email_templates';
        }
        return 'general';
    }

    /**
     * Log a prospecting customer activity
     */
    public static function logProspectingCustomer(
        string $action,
        $customer,
        array $oldValues = null,
        array $newValues = null,
        array $additionalData = []
    ): ActivityLog {
        $description = match ($action) {
            'created' => "Created prospecting customer: {$customer->company}",
            'updated' => "Updated prospecting customer: {$customer->company}",
            'deleted' => "Deleted prospecting customer: {$customer->company}",
            'toggled' => "Toggled active status for: {$customer->company}",
            'imported' => "Imported prospecting customer: {$customer->company}",
            default => "Prospecting customer action: {$action}",
        };

        return self::log(
            "prospecting_customer_{$action}",
            $description,
            $customer,
            $additionalData,
            $oldValues,
            $newValues
        );
    }

    /**
     * Log an email template activity
     */
    public static function logEmailTemplate(
        string $action,
        $template,
        array $oldValues = null,
        array $newValues = null,
        array $additionalData = []
    ): ActivityLog {
        $description = match ($action) {
            'created' => "Created email template: {$template->name}",
            'updated' => "Updated email template: {$template->name}",
            'deleted' => "Deleted email template: {$template->name}",
            'set_default' => "Set email template as default: {$template->name}",
            default => "Email template action: {$action}",
        };

        return self::log(
            "email_template_{$action}",
            $description,
            $template,
            $additionalData,
            $oldValues,
            $newValues
        );
    }
}
```

### Controller: `app/Http/Controllers/ActivityLogController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends BaseController
{
    /**
     * Display a listing of activity logs with filters
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $userId = $request->input('user_id');
        $role = $request->input('role');
        $module = $request->input('module');
        $actionType = $request->input('action_type');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $perPage = $request->input('per_page', 25);

        $query = ActivityLog::with('causer')
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhere('module', 'like', "%{$search}%")
                    ->orWhereHas('causer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($userId) $query->byUser($userId);
        if ($role) $query->byRole($role);
        if ($module) $query->forModule($module);
        if ($actionType) $query->forType($actionType);
        if ($startDate || $endDate) $query->dateRange($startDate, $endDate);

        $logs = $query->paginate($perPage)->withQueryString();

        // Transform logs with computed attributes
        $logs->getCollection()->transform(function ($log) {
            $log->causer_name = $log->causer ? $log->causer->name : 'System';
            $log->causer_email = $log->causer ? $log->causer->email : null;
            $log->action_name = $log->action_name;
            $log->formatted_date = $log->created_at->format('M d, Y');
            $log->formatted_time = $log->created_at->format('H:i:s');
            $log->formatted_datetime = $log->created_at->format('M d, Y H:i:s');
            $log->time_ago = $log->created_at->diffForHumans();
            return $log;
        });

        // Get filter options
        $users = User::select('id', 'name', 'email')->orderBy('name')->get();
        $modules = ActivityLog::getModules();
        $actionTypes = ActivityLog::getActionTypes();
        $roles = ActivityLog::getRoles();

        return Inertia::render('ActivityLogs/Index', [
            'logs' => $logs,
            'users' => $users,
            'modules' => $modules,
            'actionTypes' => $actionTypes,
            'roles' => $roles,
            'filters' => [
                'search' => $search,
                'user_id' => $userId,
                'role' => $role,
                'module' => $module,
                'action_type' => $actionType,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Display the specified activity log details
     */
    public function show(ActivityLog $activityLog)
    {
        $activityLog->load('causer', 'subject');
        // Add computed attributes
        $activityLog->causer_name = $activityLog->causer ? $activityLog->causer->name : 'System';
        $activityLog->formatted_datetime = $activityLog->created_at->format('M d, Y H:i:s');
        $activityLog->time_ago = $activityLog->created_at->diffForHumans();

        return Inertia::render('ActivityLogs/Show', [
            'log' => $activityLog,
        ]);
    }

    /**
     * Get activity log details via API (for modal view)
     */
    public function details(ActivityLog $activityLog)
    {
        $activityLog->load('causer', 'subject');

        return response()->json([
            'log' => [
                'id' => $activityLog->id,
                'type' => $activityLog->type,
                'description' => $activityLog->description,
                'module' => $activityLog->module,
                'role_name' => $activityLog->role_name,
                'ip_address' => $activityLog->ip_address,
                'data' => $activityLog->data,
                'old_values' => $activityLog->old_values,
                'new_values' => $activityLog->new_values,
                'causer_name' => $activityLog->causer ? $activityLog->causer->name : 'System',
                'causer_email' => $activityLog->causer ? $activityLog->causer->email : null,
                'subject_type' => $activityLog->subject_type ? class_basename($activityLog->subject_type) : null,
                'subject_id' => $activityLog->subject_id,
                'created_at' => $activityLog->created_at->format('M d, Y H:i:s'),
                'time_ago' => $activityLog->created_at->diffForHumans(),
            ],
        ]);
    }

    /**
     * Export activity logs as CSV
     */
    public function export(Request $request)
    {
        $query = ActivityLog::with('causer')
            ->orderBy('created_at', 'desc');

        // Apply same filters as index
        // ... (filter application code)

        $logs = $query->limit(10000)->get();
        $filename = 'activity_logs_' . now()->format('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($logs) {
            $file = fopen('php://output', 'w');

            // Header row
            fputcsv($file, [
                'ID', 'Date/Time', 'User', 'Role', 'Action Type',
                'Module', 'Description', 'IP Address', 'Subject ID',
            ]);

            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->created_at->format('Y-m-d H:i:s'),
                    $log->causer ? $log->causer->name : 'System',
                    $log->role_name ?? '-',
                    $log->type,
                    $log->module ?? '-',
                    $log->description,
                    $log->ip_address ?? '-',
                    $log->subject_id ?? '-',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Get activity statistics for dashboard
     */
    public function stats()
    {
        $today = now()->startOfDay();
        $thisWeek = now()->startOfWeek();
        $thisMonth = now()->startOfMonth();

        $stats = [
            'today' => ActivityLog::where('created_at', '>=', $today)->count(),
            'this_week' => ActivityLog::where('created_at', '>=', $thisWeek)->count(),
            'this_month' => ActivityLog::where('created_at', '>=', $thisMonth)->count(),
            'total' => ActivityLog::count(),
            'by_module' => ActivityLog::selectRaw('module, count(*) as count')
                ->whereNotNull('module')
                ->groupBy('module')
                ->orderByDesc('count')
                ->limit(5)
                ->get(),
            'by_action' => ActivityLog::selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->orderByDesc('count')
                ->limit(10)
                ->get(),
            'recent' => ActivityLog::with('causer')
                ->orderByDesc('created_at')
                ->limit(5)
                ->get()
                ->map(fn($log) => [
                    'id' => $log->id,
                    'type' => $log->type,
                    'description' => $log->description,
                    'user' => $log->causer ? $log->causer->name : 'System',
                    'time_ago' => $log->created_at->diffForHumans(),
                ]),
        ];

        return response()->json($stats);
    }
}
```

## Routes Configuration

```php
// routes/web.php

// ACTIVITY LOGS ROUTES
Route::middleware(['permission:activity.view'])->group(function () {
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])
        ->name('activity-logs.index');

    Route::get('/activity-logs/export', [ActivityLogController::class, 'export'])
        ->name('activity-logs.export');

    Route::get('/activity-logs/{activityLog}', [ActivityLogController::class, 'show'])
        ->name('activity-logs.show');

    Route::get('/api/activity-logs/{activityLog}', [ActivityLogController::class, 'details'])
        ->name('activity-logs.details');

    Route::get('/api/activity-logs/stats', [ActivityLogController::class, 'stats'])
        ->name('activity-logs.stats');
});
```

### Route Summary

| Route | Method | Permission | Description |
|-------|--------|------------|-------------|
| `/activity-logs` | GET | `activity.view` | List all logs with filters |
| `/activity-logs/export` | GET | `activity.view` | Export filtered logs to CSV |
| `/activity-logs/{id}` | GET | `activity.view` | View log details page |
| `/api/activity-logs/{id}` | GET | `activity.view` | API endpoint for modal details |
| `/api/activity-logs/stats` | GET | `activity.view` | Dashboard statistics API |

## Frontend Implementation

### Index Page: `resources/js/Pages/ActivityLogs/Index.jsx`

**Features:**
- Paginated activity log list with configurable page size
- Multi-filter system (search, user, role, module, action type, date range)
- CSV export with current filters
- Detail view modal via API
- Color-coded action badges
- Statistics summary bar

**Props Interface:**
```javascript
{
    logs: {
        data: Array<ActivityLog>,
        current_page: number,
        last_page: number,
        per_page: number,
        total: number,
        from: number,
        to: number,
        links: Array<PaginationLink>
    },
    users: Array<{ id: number, name: string, email: string }>,
    modules: Array<string>,
    actionTypes: Array<string>,
    roles: Array<string>,
    filters: {
        search: string,
        user_id: string,
        role: string,
        module: string,
        action_type: string,
        start_date: string,
        end_date: string,
        per_page: number
    }
}
```

**State Management:**
```javascript
const [search, setSearch] = useState(filters?.search || '');
const [selectedUser, setSelectedUser] = useState(filters?.user_id || '');
const [selectedRole, setSelectedRole] = useState(filters?.role || '');
const [selectedModule, setSelectedModule] = useState(filters?.module || '');
const [selectedActionType, setSelectedActionType] = useState(filters?.action_type || '');
const [startDate, setStartDate] = useState(filters?.start_date || '');
const [endDate, setEndDate] = useState(filters?.end_date || '');
const [perPage, setPerPage] = useState(filters?.per_page || 25);
const [showFilters, setShowFilters] = useState(false);
const [selectedLog, setSelectedLog] = useState(null);
const [showDetailModal, setShowDetailModal] = useState(false);
```

**Debounced Search:**
```javascript
useEffect(() => {
    const timer = setTimeout(() => {
        if (search !== (filters?.search || '')) {
            applyFilters({ search });
        }
    }, 400);  // 400ms debounce
    return () => clearTimeout(timer);
}, [search]);
```

**Filter Application:**
```javascript
const applyFilters = (newFilters = {}) => {
    router.get('/activity-logs', {
        search: newFilters.search !== undefined ? newFilters.search : search,
        user_id: newFilters.user_id !== undefined ? newFilters.user_id : selectedUser,
        role: newFilters.role !== undefined ? newFilters.role : selectedRole,
        module: newFilters.module !== undefined ? newFilters.module : selectedModule,
        action_type: newFilters.action_type !== undefined ? newFilters.action_type : selectedActionType,
        start_date: newFilters.start_date !== undefined ? newFilters.start_date : startDate,
        end_date: newFilters.end_date !== undefined ? newFilters.end_date : endDate,
        per_page: newFilters.per_page !== undefined ? newFilters.per_page : perPage,
    }, { preserveState: true, replace: true });
};
```

**CSV Export:**
```javascript
const handleExport = () => {
    const params = new URLSearchParams({
        search,
        user_id: selectedUser,
        role: selectedRole,
        module: selectedModule,
        action_type: selectedActionType,
        start_date: startDate,
        end_date: endDate,
    });
    window.location.href = `/activity-logs/export?${params.toString()}`;
};
```

**Detail Modal Loading:**
```javascript
const viewDetails = async (log) => {
    setLoadingDetails(true);
    setShowDetailModal(true);
    try {
        const response = await fetch(`/api/activity-logs/${log.id}`);
        const data = await response.json();
        setSelectedLog(data.log);
    } catch (error) {
        console.error('Failed to load details:', error);
    }
    setLoadingDetails(false);
};
```

### Action Type Visual Helpers

```javascript
const getActionIcon = (type) => {
    if (type.includes('created')) return <PlusCircleIcon className="w-4 h-4 text-green-500" />;
    if (type.includes('updated') || type.includes('edit')) return <PencilSquareIcon className="w-4 h-4 text-blue-500" />;
    if (type.includes('deleted')) return <TrashIcon className="w-4 h-4 text-red-500" />;
    if (type.includes('restored')) return <ArrowPathIcon className="w-4 h-4 text-purple-500" />;
    if (type.includes('import') || type.includes('upload')) return <ArrowUpTrayIcon className="w-4 h-4 text-indigo-500" />;
    if (type.includes('status')) return <CheckCircleIcon className="w-4 h-4 text-amber-500" />;
    return <DocumentTextIcon className="w-4 h-4 text-gray-500" />;
};

const getActionBadgeColor = (type) => {
    if (type.includes('created')) return 'bg-green-100 text-green-800 border-green-200';
    if (type.includes('updated') || type.includes('edit')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (type.includes('deleted')) return 'bg-red-100 text-red-800 border-red-200';
    if (type.includes('restored')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (type.includes('import') || type.includes('upload')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (type.includes('status')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
};

const getModuleBadgeColor = (module) => {
    const colors = {
        'Users': 'bg-blue-50 text-blue-700',
        'Products': 'bg-green-50 text-green-700',
        'Clients': 'bg-amber-50 text-amber-700',
        'Quotations': 'bg-indigo-50 text-indigo-700',
        'Roles': 'bg-red-50 text-red-700',
        'Profiles': 'bg-pink-50 text-pink-700',
    };
    return colors[module] || 'bg-gray-50 text-gray-700';
};
```

## Observer Integration

Activity logging is automatically triggered via Eloquent Observers. Example from `ClientObserver`:

```php
class ClientObserver
{
    public function created(Client $client)
    {
        activity_log(
            'client_created',
            'Client created: ' . $client->name,
            $client,
            ['client' => $client->toArray()]
        );
    }

    public function updated(Client $client)
    {
        $changes = $client->getChanges();
        if (!empty($changes)) {
            activity_log(
                'client_updated',
                'Client updated: ' . $client->name,
                $client,
                ['changes' => $changes]
            );
        }
    }

    public function deleted(Client $client)
    {
        activity_log(
            'client_deleted',
            'Client deleted: ' . $client->name,
            $client
        );
    }

    public function restored(Client $client)
    {
        activity_log(
            'client_restored',
            'Client restored: ' . $client->name,
            $client
        );
    }
}
```

## Activity Type Naming Convention

Use consistent naming pattern: `{entity}_{action}`

| Type | Module | Description |
|------|--------|-------------|
| `user_created` | Users | New user created |
| `user_updated` | Users | User profile updated |
| `user_deleted` | Users | User soft deleted |
| `product_created` | Products | New product added |
| `product_updated` | Products | Product modified |
| `product_status_updated` | Products | Product status changed |
| `client_created` | Clients | New client added |
| `client_updated` | Clients | Client modified |
| `role_created` | Roles | New role created |
| `role_permissions_updated` | Roles | Role permissions changed |
| `login_success` | Auth | Successful login |
| `login_failed` | Auth | Failed login attempt |
| `2fa_verified` | Auth | 2FA code verified |

## Helper Registration

Register the helper in `composer.json`:

```json
{
    "autoload": {
        "files": [
            "app/Helpers/activity_logger.php"
        ]
    }
}
```

Then run:
```bash
composer dump-autoload
```

## Implementation Guide

### Step 1: Create Migration

```bash
php artisan make:migration create_activity_logs_table
```

### Step 2: Create Model

```bash
php artisan make:model ActivityLog
```

Add fillable fields, casts, relationships, scopes, and accessors.

### Step 3: Create Helper File

Create `app/Helpers/activity_logger.php` with the global `activity_log()` function.

### Step 4: Register Helper in Composer

Add to `composer.json` autoload files array and run `composer dump-autoload`.

### Step 5: Create Service (Optional)

Create `app/Services/ActivityLogService.php` for more complex logging scenarios.

### Step 6: Create Controller

```bash
php artisan make:controller ActivityLogController
```

Implement index, show, details, export, and stats methods.

### Step 7: Define Routes

Add routes with `activity.view` permission middleware.

### Step 8: Create Frontend

Create `resources/js/Pages/ActivityLogs/Index.jsx` with filters, table, and detail modal.

### Step 9: Set Up Observers

Create and register observers for each model that needs activity logging.

## Usage Examples

### Basic Logging

```php
// Log a simple activity
activity_log('user_login', 'User logged in successfully');

// Log with subject
activity_log('product_viewed', 'Product viewed', $product);

// Log with additional data
activity_log('order_placed', 'Order placed', $order, [
    'total' => $order->total,
    'items' => $order->items->count()
]);
```

### Logging with Changes

```php
// Using enhanced format
activity_log('user_updated', 'User profile updated', $user, [
    'old_values' => ['name' => 'Old Name'],
    'new_values' => ['name' => 'New Name'],
]);

// Using convenience function
activity_log_with_changes(
    'product_updated',
    'Product price updated',
    $product,
    ['price' => 100],
    ['price' => 150],
    'Products'
);
```

### Using Service Class

```php
use App\Services\ActivityLogService;

ActivityLogService::log(
    'import_completed',
    'Import completed successfully',
    $importLog,
    ['records' => 500],
    null,
    null
);

ActivityLogService::logProspectingCustomer(
    'created',
    $customer,
    null,
    $customer->toArray()
);
```

## Testing Scenarios

### Manual Testing Checklist

- [ ] Activity logs page loads with pagination
- [ ] Search filters by description, type, and user name
- [ ] User filter shows only logs by selected user
- [ ] Role filter works correctly
- [ ] Module filter works correctly
- [ ] Action type filter works correctly
- [ ] Date range filter works correctly
- [ ] Combining multiple filters works
- [ ] Clear filters resets all filters
- [ ] CSV export includes all filtered records
- [ ] Detail modal shows full log information
- [ ] Old/new values display correctly in modal
- [ ] Pagination preserves filter state
- [ ] Per-page selector changes page size
- [ ] Observer-triggered logging works
- [ ] IP address captured correctly
- [ ] Role name captured at time of action

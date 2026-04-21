<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RoleController extends Controller
{
    /**
     * Display a listing of roles.
     */
    public function index(Request $request)
    {
        $query = Role::query()->withCount(['users', 'permissions']);

        // Search across all visible columns
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('level', 'like', "%{$search}%");
            });
        }

        // Type filter (system / custom)
        if ($request->filled('type')) {
            $types = array_filter(explode(',', $request->type));
            $query->where(function ($q) use ($types) {
                if (in_array('system', $types)) $q->orWhere('is_system', true);
                if (in_array('custom', $types)) $q->orWhere('is_system', false);
            });
        }

        // Level multi-select
        if ($request->filled('level')) {
            $levels = array_filter(explode(',', $request->level), fn($v) => $v !== '');
            if (count($levels)) {
                $query->whereIn('level', $levels);
            }
        }

        // Level range
        if ($request->filled('level_min')) {
            $query->where('level', '>=', (int) $request->level_min);
        }
        if ($request->filled('level_max')) {
            $query->where('level', '<=', (int) $request->level_max);
        }

        // Usage filter (with-users / no-users)
        if ($request->filled('usage')) {
            $usages = array_filter(explode(',', $request->usage));
            $query->where(function ($q) use ($usages) {
                if (in_array('with_users', $usages)) $q->orHas('users');
                if (in_array('no_users', $usages)) $q->orDoesntHave('users');
            });
        }

        // Permissions presence filter
        if ($request->filled('permissions_state')) {
            $states = array_filter(explode(',', $request->permissions_state));
            $query->where(function ($q) use ($states) {
                if (in_array('with_permissions', $states)) $q->orHas('permissions');
                if (in_array('no_permissions', $states)) $q->orDoesntHave('permissions');
            });
        }

        // Sort
        $sortField = $request->get('sort', 'level');
        $sortDirection = $request->get('direction', 'desc');
        $allowedSorts = ['name', 'level', 'created_at', 'users_count'];

        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $roles = $query->paginate(10)->withQueryString();

        $availableLevels = Role::distinct()->orderBy('level')->pluck('level')->values();

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'availableLevels' => $availableLevels,
            'filters' => $request->only([
                'search', 'type', 'level', 'level_min', 'level_max',
                'usage', 'permissions_state', 'sort', 'direction',
            ]),
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create()
    {
        $permissions = Permission::getAllGrouped();

        return Inertia::render('Roles/Create', [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:500',
            'level' => 'required|integer|min:1|max:99',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        try {
            $role = Role::create([
                'name' => $validated['name'],
                'slug' => Str::slug($validated['name']),
                'description' => $validated['description'] ?? null,
                'level' => $validated['level'],
                'is_system' => false,
            ]);

            // Sync permissions
            if (!empty($validated['permissions'])) {
                $role->permissions()->sync($validated['permissions']);
            }

            Log::info('Role created', ['role_id' => $role->id, 'name' => $role->name, 'user_id' => auth()->id()]);

            // Log activity
            ActivityLog::log(
                'created',
                "Created role: {$role->name}",
                $role,
                auth()->user(),
                ['name' => $role->name, 'permissions_count' => count($validated['permissions'] ?? [])]
            );

            return redirect()->route('roles.index')->with('success', 'Role created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating role: ' . $e->getMessage(), ['user_id' => auth()->id(), 'name' => $validated['name']]);
            return back()->withInput()->with('error', 'Failed to create role. Please try again.');
        }
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role)
    {
        $role->load(['permissions', 'users']);

        return Inertia::render('Roles/Show', [
            'role' => $role,
        ]);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role)
    {
        $permissions = Permission::getAllGrouped();
        $rolePermissions = $role->permissions->pluck('id')->toArray();

        return Inertia::render('Roles/Edit', [
            'role' => $role,
            'permissions' => $permissions,
            'rolePermissions' => $rolePermissions,
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(Request $request, Role $role)
    {
        try {
            // Prevent editing system roles' core properties
            if ($role->is_system) {
                $validated = $request->validate([
                    'description' => 'nullable|string|max:500',
                    'permissions' => 'array',
                    'permissions.*' => 'exists:permissions,id',
                ]);

                // System roles can only update description and permissions (except super-admin)
                if ($role->slug !== 'super-admin') {
                    $role->update([
                        'description' => $validated['description'] ?? $role->description,
                    ]);

                    if (isset($validated['permissions'])) {
                        $oldPermissions = $role->permissions->pluck('id')->toArray();
                        $role->permissions()->sync($validated['permissions']);

                        Log::info('System role permissions updated', ['role_id' => $role->id, 'name' => $role->name, 'user_id' => auth()->id()]);

                        ActivityLog::log(
                            'updated',
                            "Updated role permissions: {$role->name}",
                            $role,
                            auth()->user(),
                            [],
                            ['old' => ['permissions' => $oldPermissions], 'new' => ['permissions' => $validated['permissions']]]
                        );
                    }
                }
            } else {
                $validated = $request->validate([
                    'name' => ['required', 'string', 'max:255', Rule::unique('roles')->ignore($role->id)],
                    'description' => 'nullable|string|max:500',
                    'level' => 'required|integer|min:1|max:99',
                    'permissions' => 'array',
                    'permissions.*' => 'exists:permissions,id',
                ]);

                $oldData = $role->toArray();

                $role->update([
                    'name' => $validated['name'],
                    'slug' => Str::slug($validated['name']),
                    'description' => $validated['description'] ?? null,
                    'level' => $validated['level'],
                ]);

                if (isset($validated['permissions'])) {
                    $role->permissions()->sync($validated['permissions']);
                }

                Log::info('Role updated', ['role_id' => $role->id, 'name' => $role->name, 'user_id' => auth()->id()]);

                ActivityLog::log(
                    'updated',
                    "Updated role: {$role->name}",
                    $role,
                    auth()->user(),
                    [],
                    ['old' => $oldData, 'new' => $role->toArray()]
                );
            }

            return redirect()->route('roles.index')->with('success', 'Role updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating role: ' . $e->getMessage(), ['role_id' => $role->id, 'user_id' => auth()->id()]);
            return back()->withInput()->with('error', 'Failed to update role. Please try again.');
        }
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role)
    {
        // Prevent deleting system roles
        if ($role->is_system) {
            Log::warning('Attempt to delete system role', ['role_id' => $role->id, 'name' => $role->name, 'user_id' => auth()->id()]);
            return redirect()->route('roles.index')->with('error', 'System roles cannot be deleted.');
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            return redirect()->route('roles.index')->with('error', 'Cannot delete role with assigned users. Please reassign users first.');
        }

        try {
            $roleData = $role->toArray();
            $role->permissions()->detach();
            $role->delete();

            Log::info('Role deleted', ['role_id' => $roleData['id'], 'name' => $roleData['name'], 'user_id' => auth()->id()]);

            ActivityLog::log(
                'deleted',
                "Deleted role: {$roleData['name']}",
                null,
                auth()->user(),
                $roleData,
                [],
                'Role'
            );

            return redirect()->route('roles.index')->with('success', 'Role deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting role: ' . $e->getMessage(), ['role_id' => $role->id, 'user_id' => auth()->id()]);
            return back()->with('error', 'Failed to delete role. Please try again.');
        }
    }
}

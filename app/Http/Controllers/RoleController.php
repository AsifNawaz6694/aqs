<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
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

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
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

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'filters' => $request->only(['search', 'sort', 'direction']),
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

        // Log activity
        ActivityLog::log(
            'created',
            "Created role: {$role->name}",
            $role,
            auth()->user(),
            ['name' => $role->name, 'permissions_count' => count($validated['permissions'] ?? [])]
        );

        return redirect()->route('roles.index')->with('success', 'Role created successfully.');
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
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role)
    {
        // Prevent deleting system roles
        if ($role->is_system) {
            return redirect()->route('roles.index')->with('error', 'System roles cannot be deleted.');
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            return redirect()->route('roles.index')->with('error', 'Cannot delete role with assigned users. Please reassign users first.');
        }

        $roleData = $role->toArray();
        $role->permissions()->detach();
        $role->delete();

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
    }
}

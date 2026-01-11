<?php

namespace App\Observers;

use App\Models\Role;
use App\Models\ActivityLog;

class RoleObserver
{
    /**
     * Handle the Role "created" event.
     */
    public function created(Role $role): void
    {
        ActivityLog::log(
            event: 'created',
            description: "Role created: {$role->name}",
            subject: $role,
            causer: auth()->user(),
            properties: [
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'level' => $role->level,
                'is_system' => $role->is_system,
            ],
            module: 'roles'
        );
    }

    /**
     * Handle the Role "updated" event.
     */
    public function updated(Role $role): void
    {
        $changes = $role->getChanges();

        if (empty($changes)) {
            return;
        }

        // Remove timestamps from changes
        unset($changes['updated_at']);

        if (!empty($changes)) {
            ActivityLog::log(
                event: 'updated',
                description: "Role updated: {$role->name}",
                subject: $role,
                causer: auth()->user(),
                properties: [
                    'name' => $role->name,
                    'slug' => $role->slug,
                ],
                changes: [
                    'old' => array_intersect_key($role->getOriginal(), $changes),
                    'new' => $changes,
                ],
                module: 'roles'
            );
        }
    }

    /**
     * Handle the Role "deleted" event.
     */
    public function deleted(Role $role): void
    {
        ActivityLog::log(
            event: 'deleted',
            description: "Role deleted: {$role->name}",
            subject: $role,
            causer: auth()->user(),
            properties: [
                'name' => $role->name,
                'slug' => $role->slug,
            ],
            module: 'roles'
        );
    }
}

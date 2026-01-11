<?php

namespace App\Observers;

use App\Models\User;
use App\Models\ActivityLog;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        ActivityLog::log(
            event: 'created',
            description: 'User created: ' . $user->name,
            subject: $user,
            causer: auth()->user(),
            properties: ['name' => $user->name, 'email' => $user->email],
            module: 'users'
        );
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        $changes = $user->getChanges();

        if (empty($changes)) {
            return;
        }

        // Mask password in logs
        if (isset($changes['password'])) {
            $changes['password'] = '***hashed***';
        }

        // Remove timestamps from changes
        unset($changes['updated_at']);

        if (!empty($changes)) {
            ActivityLog::log(
                event: 'updated',
                description: 'User updated: ' . $user->name,
                subject: $user,
                causer: auth()->user(),
                properties: [],
                changes: [
                    'old' => array_intersect_key($user->getOriginal(), $changes),
                    'new' => $changes,
                ],
                module: 'users'
            );
        }
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        ActivityLog::log(
            event: 'deleted',
            description: 'User deleted: ' . $user->name,
            subject: $user,
            causer: auth()->user(),
            module: 'users'
        );
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user): void
    {
        ActivityLog::log(
            event: 'restored',
            description: 'User restored: ' . $user->name,
            subject: $user,
            causer: auth()->user(),
            module: 'users'
        );
    }

    /**
     * Handle the User "force deleted" event.
     */
    public function forceDeleted(User $user): void
    {
        ActivityLog::log(
            event: 'force_deleted',
            description: 'User permanently deleted: ' . $user->name,
            subject: $user,
            causer: auth()->user(),
            module: 'users'
        );
    }
}

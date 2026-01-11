<?php

namespace App\Observers;

use App\Models\Client;
use App\Models\ActivityLog;

class ClientObserver
{
    /**
     * Handle the Client "created" event.
     */
    public function created(Client $client): void
    {
        ActivityLog::log(
            event: 'created',
            description: 'Client created: ' . $client->display_name,
            subject: $client,
            causer: auth()->user(),
            properties: ['name' => $client->name, 'email' => $client->email],
            module: 'clients'
        );
    }

    /**
     * Handle the Client "updated" event.
     */
    public function updated(Client $client): void
    {
        $changes = $client->getChanges();

        if (empty($changes)) {
            return;
        }

        // Remove timestamps from changes
        unset($changes['updated_at']);

        if (!empty($changes)) {
            ActivityLog::log(
                event: 'updated',
                description: 'Client updated: ' . $client->display_name,
                subject: $client,
                causer: auth()->user(),
                properties: [],
                changes: [
                    'old' => array_intersect_key($client->getOriginal(), $changes),
                    'new' => $changes,
                ],
                module: 'clients'
            );
        }
    }

    /**
     * Handle the Client "deleted" event.
     */
    public function deleted(Client $client): void
    {
        ActivityLog::log(
            event: 'deleted',
            description: 'Client deleted: ' . $client->display_name,
            subject: $client,
            causer: auth()->user(),
            module: 'clients'
        );
    }

    /**
     * Handle the Client "restored" event.
     */
    public function restored(Client $client): void
    {
        ActivityLog::log(
            event: 'restored',
            description: 'Client restored: ' . $client->display_name,
            subject: $client,
            causer: auth()->user(),
            module: 'clients'
        );
    }
}

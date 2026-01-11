<?php

namespace App\Observers;

use App\Models\Quotation;
use App\Models\ActivityLog;

class QuotationObserver
{
    /**
     * Handle the Quotation "created" event.
     */
    public function created(Quotation $quotation): void
    {
        ActivityLog::log(
            event: 'created',
            description: "Quotation created: {$quotation->quotation_number}",
            subject: $quotation,
            causer: auth()->user(),
            properties: [
                'quotation_number' => $quotation->quotation_number,
                'client_id' => $quotation->client_id,
                'client_name' => $quotation->client?->display_name,
                'subject' => $quotation->subject,
                'status' => $quotation->status,
                'subtotal' => $quotation->subtotal,
                'total' => $quotation->total,
                'currency' => $quotation->currency,
                'valid_until' => $quotation->valid_until?->format('Y-m-d'),
            ],
            module: 'quotations'
        );
    }

    /**
     * Handle the Quotation "updated" event.
     */
    public function updated(Quotation $quotation): void
    {
        $changes = $quotation->getChanges();

        if (empty($changes)) {
            return;
        }

        // Remove timestamps from changes
        unset($changes['updated_at']);

        // Track important field changes
        $trackedFields = [
            'status',
            'subject',
            'client_id',
            'subtotal',
            'vat_amount',
            'total',
            'discount_type',
            'discount_value',
            'valid_until',
            'notes',
            'terms_and_conditions',
            'payment_terms',
            'delivery_terms',
            'warranty_terms',
            'assigned_to',
            'approved_by',
            'rejection_reason',
        ];

        // Filter to only track important changes
        $importantChanges = array_intersect_key($changes, array_flip($trackedFields));

        if (!empty($importantChanges)) {
            $oldValues = array_intersect_key($quotation->getOriginal(), $importantChanges);

            // Format client names for better readability
            if (isset($importantChanges['client_id'])) {
                $importantChanges['client_name'] = $quotation->client?->display_name ?? 'Unknown';
                $oldValues['client_name'] = 'Previous Client';
            }

            // Determine event type based on what changed
            $event = 'updated';
            $description = "Quotation updated: {$quotation->quotation_number}";

            if (isset($importantChanges['status'])) {
                $event = 'status_changed';
                $oldStatus = $oldValues['status'] ?? 'unknown';
                $newStatus = $importantChanges['status'];
                $description = "Quotation {$quotation->quotation_number} status changed from {$oldStatus} to {$newStatus}";
            }

            ActivityLog::log(
                event: $event,
                description: $description,
                subject: $quotation,
                causer: auth()->user(),
                properties: [
                    'quotation_number' => $quotation->quotation_number,
                    'current_status' => $quotation->status,
                ],
                changes: [
                    'old' => $oldValues,
                    'new' => $importantChanges,
                ],
                module: 'quotations'
            );
        }
    }

    /**
     * Handle the Quotation "deleted" event.
     */
    public function deleted(Quotation $quotation): void
    {
        ActivityLog::log(
            event: 'deleted',
            description: "Quotation deleted: {$quotation->quotation_number}",
            subject: $quotation,
            causer: auth()->user(),
            properties: [
                'quotation_number' => $quotation->quotation_number,
                'client_name' => $quotation->client?->display_name,
                'subject' => $quotation->subject,
                'total' => $quotation->total,
                'status' => $quotation->status,
            ],
            module: 'quotations'
        );
    }

    /**
     * Handle the Quotation "restored" event.
     */
    public function restored(Quotation $quotation): void
    {
        ActivityLog::log(
            event: 'restored',
            description: "Quotation restored: {$quotation->quotation_number}",
            subject: $quotation,
            causer: auth()->user(),
            properties: [
                'quotation_number' => $quotation->quotation_number,
            ],
            module: 'quotations'
        );
    }

    /**
     * Handle the Quotation "force deleted" event.
     */
    public function forceDeleted(Quotation $quotation): void
    {
        ActivityLog::log(
            event: 'force_deleted',
            description: "Quotation permanently deleted: {$quotation->quotation_number}",
            subject: $quotation,
            causer: auth()->user(),
            properties: [
                'quotation_number' => $quotation->quotation_number,
                'client_name' => $quotation->client?->display_name,
                'subject' => $quotation->subject,
                'total' => $quotation->total,
            ],
            module: 'quotations'
        );
    }
}

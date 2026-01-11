<?php

namespace App\Observers;

use App\Models\Product;
use App\Models\ActivityLog;

class ProductObserver
{
    /**
     * Handle the Product "created" event.
     */
    public function created(Product $product): void
    {
        ActivityLog::log(
            event: 'created',
            description: 'Product created: ' . $product->name,
            subject: $product,
            causer: auth()->user(),
            properties: ['name' => $product->name, 'sku' => $product->sku],
            module: 'products'
        );
    }

    /**
     * Handle the Product "updated" event.
     */
    public function updated(Product $product): void
    {
        $changes = $product->getChanges();

        if (empty($changes)) {
            return;
        }

        // Remove timestamps from changes
        unset($changes['updated_at']);

        if (!empty($changes)) {
            ActivityLog::log(
                event: 'updated',
                description: 'Product updated: ' . $product->name,
                subject: $product,
                causer: auth()->user(),
                properties: [],
                changes: [
                    'old' => array_intersect_key($product->getOriginal(), $changes),
                    'new' => $changes,
                ],
                module: 'products'
            );
        }
    }

    /**
     * Handle the Product "deleted" event.
     */
    public function deleted(Product $product): void
    {
        ActivityLog::log(
            event: 'deleted',
            description: 'Product deleted: ' . $product->name,
            subject: $product,
            causer: auth()->user(),
            module: 'products'
        );
    }

    /**
     * Handle the Product "restored" event.
     */
    public function restored(Product $product): void
    {
        ActivityLog::log(
            event: 'restored',
            description: 'Product restored: ' . $product->name,
            subject: $product,
            causer: auth()->user(),
            module: 'products'
        );
    }
}

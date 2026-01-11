<?php

namespace App\Providers;

use App\Models\User;
use App\Models\Product;
use App\Models\Client;
use App\Observers\UserObserver;
use App\Observers\ProductObserver;
use App\Observers\ClientObserver;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Register model observers
        User::observe(UserObserver::class);
        Product::observe(ProductObserver::class);
        Client::observe(ClientObserver::class);
    }
}

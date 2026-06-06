<?php

namespace App\Providers;

use App\Models\Transaksi;
use App\Observers\TransaksiObserver;
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
        Transaksi::observe(TransaksiObserver::class);
    }
}

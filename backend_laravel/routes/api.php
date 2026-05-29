<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\PesananController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\MerchantController;


// ─── PUBLIC ──────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::get('/menus',     [MenuController::class, 'index']);
Route::post('/auth/google/callback', [AuthController::class, 'googleCallback']);

// ─── AUTH REQUIRED ───────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/password', [AuthController::class, 'updatePassword']);
    Route::post('/upload-photo', [AuthController::class, 'uploadPhoto']);

    // Menu (Merchant)
    Route::post('/menus',          [MenuController::class, 'store']);
    Route::put('/menus/{id}',      [MenuController::class, 'update']);
    Route::delete('/menus/{id}',   [MenuController::class, 'destroy']);
    Route::get('/merchant/status', [MerchantController::class, 'getStatus']);
    Route::put('/merchant/status', [MerchantController::class, 'updateStatus']);

    // Pesanan
    Route::get('/pesanans',                    [PesananController::class, 'index']);
    Route::post('/pesanans',                   [PesananController::class, 'store']);
    Route::put('/pesanans/{id}/status',        [PesananController::class, 'updateStatus']);

    // Admin only
    Route::middleware('role:ADMIN')->prefix('admin')->group(function () {
        Route::get('/dashboard',              [AdminController::class, 'dashboard']);
        Route::get('/users',                  [AdminController::class, 'users']);
        Route::delete('/users/{id}',          [AdminController::class, 'deleteUser']);
        Route::put('/transaksi/{id}/lunas',   [AdminController::class, 'lunasTransaksi']);
    });

    // Merchant only
    Route::middleware('role:MERCHANT')->prefix('merchant')->group(function () {
        Route::get('/dashboard',       [MerchantController::class, 'dashboard']);
    });
});

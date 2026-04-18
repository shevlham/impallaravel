<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\PesananController;
use App\Http\Controllers\AdminController;

// ─── PUBLIC ──────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::get('/menus',     [MenuController::class, 'index']);
Route::get('/menus/{id}',[MenuController::class, 'show']);
Route::post('/auth/google/callback', [AuthController::class, 'googleCallback']);

// ─── AUTH REQUIRED ───────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Menu (Merchant)
    Route::post('/menus',          [MenuController::class, 'store']);
    Route::put('/menus/{id}',      [MenuController::class, 'update']);
    Route::delete('/menus/{id}',   [MenuController::class, 'destroy']);

    // Pesanan
    Route::get('/pesanans',                    [PesananController::class, 'index']);
    Route::post('/pesanans',                   [PesananController::class, 'store']);
    Route::get('/pesanans/{id}',               [PesananController::class, 'show']);
    Route::put('/pesanans/{id}/status',        [PesananController::class, 'updateStatus']);

    // Admin only
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard',       [AdminController::class, 'dashboard']);
        Route::get('/users',           [AdminController::class, 'users']);
        Route::delete('/users/{id}',   [AdminController::class, 'deleteUser']);
    });
});

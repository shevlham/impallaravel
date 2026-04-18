<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Admin;
use App\Models\Merchant;
use App\Models\Pelanggan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'nama'     => 'required|string|max:100',
            'username' => 'required|string|unique:users,username|max:50',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:ADMIN,PELANGGAN,MERCHANT',
        ]);

        $user = User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        match ($request->role) {
            'ADMIN'     => Admin::create(['user_id' => $user->id, 'nama' => $request->nama]),
            'MERCHANT'  => Merchant::create(['user_id' => $user->id, 'nama_merchant' => $request->nama]),
            'PELANGGAN' => Pelanggan::create(['user_id' => $user->id, 'nama' => $request->nama]),
        };

        $token = $user->createToken('auth_token')->plainTextToken;

        $user->load(['admin', 'merchant', 'pelanggan']); // ← DITAMBAHKAN

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => $this->userWithProfile($user),
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Username atau password salah'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $user->load(['admin', 'merchant', 'pelanggan']); // ← DITAMBAHKAN

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => $this->userWithProfile($user),
        ]);
    }
    
    public function googleCallback(Request $request)
    {
        $request->validate([
            'id_token' => 'required|string',
        ]);

        try {
            // Verifikasi id_token ke Google dan ambil data user
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->userFromToken($request->id_token);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Token Google tidak valid: ' . $e->getMessage()
            ], 401);
        }

        // Cari atau buat user berdasarkan google_id atau email
        $user = User::where('google_id', $googleUser->getId())
                    ->orWhere('email', $googleUser->getEmail())
                    ->first();

        if ($user) {
            // Update google_id jika belum ada (user lama yg daftar email)
            if (! $user->google_id) {
                $user->update(['google_id' => $googleUser->getId()]);
            }
        } else {
            // Buat user baru dari akun Google
            $username = $this->generateUsername($googleUser->getEmail(), $googleUser->getName());

            $user = User::create([
                'username'  => $username,
                'email'     => $googleUser->getEmail(),
                'password'  => Hash::make(Str::random(24)), // random password (tidak dipakai)
                'google_id' => $googleUser->getId(),
                'role'      => 'PELANGGAN', // default role untuk Google sign-up
            ]);

            // Buat profile pelanggan
            $user->pelanggan()->create([
                'nama'      => $googleUser->getName(),
                'foto'      => $googleUser->getAvatar(),
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user->load('profile'),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $user->load(['admin', 'merchant', 'pelanggan']); // ← DITAMBAHKAN
        return response()->json($this->userWithProfile($user));
    }

    private function userWithProfile(User $user): array
    {
        $profile = match ($user->role) {
            'ADMIN'     => $user->admin,
            'MERCHANT'  => $user->merchant,
            'PELANGGAN' => $user->pelanggan,
            default     => null,
        };

        return [
            'id'       => $user->id,
            'username' => $user->username,
            'role'     => $user->role,
            'profile'  => $profile,
        ];
    }

     private function generateUsername(string $email, string $name): string
    {
        // Coba pakai bagian depan email dulu
        $base = Str::slug(explode('@', $email)[0], '_');
        if (! User::where('username', $base)->exists()) {
            return $base;
        }
        // Kalau sudah ada, tambah angka random
        return $base . '_' . rand(100, 9999);
    }
}
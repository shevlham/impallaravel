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
            'nama'        => 'required|string|max:100',
            'username'    => 'required|string|unique:users,username|max:50',
            'password'    => 'required|string|min:6',
            'role'        => 'required|in:ADMIN,PELANGGAN,MERCHANT',
            'foto_profil' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto_profil')) {
            $result = cloudinary()->uploadApi()->upload($request->file('foto_profil')->getRealPath(), [
                'folder' => 'profile',
                'verify' => false
            ]);
            $fotoPath = $result['secure_url'];
        }

        $user = User::create([
            'username'    => $request->username,
            'password'    => Hash::make($request->password),
            'role'        => $request->role,
            'foto_profil' => $fotoPath,
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
            'user' => $user,
            'token' => $token
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
            'id'          => $user->id,
            'name'        => $user->name,           // ✅ TAMBAHKAN
            'email'       => $user->email, 
            'username'    => $user->username,
            'role'        => $user->role,
            'foto_profil' => $user->foto_profil,
            'profile'     => $profile,
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
    public function updateProfile(Request $request)
{
    $user = $request->user();
    
    $request->validate([
        'username' => 'sometimes|string|min:3|max:50|unique:users,username,' . $user->id,
        'email' => 'sometimes|email|unique:users,email,' . $user->id,  // ✅ TAMBAHKAN INI
        'foto_profil' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
    ]);
    
    if ($request->has('username')) {
        $user->username = $request->username;
    }
    
    if ($request->has('email')) {  
        $user->email = $request->email;
    }
    
    if ($request->hasFile('foto_profil')) {
        $result = cloudinary()->uploadApi()->upload($request->file('foto_profil')->getRealPath(), [
            'folder' => 'profile',
            'verify' => false
        ]);
        $user->foto_profil = $result['secure_url'];
    }
    
    $user->save();
    
    $user->load(['merchant', 'pelanggan', 'admin']);
    
    return response()->json([
        'success' => true,
        'data' => ['user' => $user],
        'message' => 'Profil berhasil diupdate'
    ]);
}

    public function updatePassword(Request $request)
{
    $user = $request->user();
    
    $request->validate([
        'current_password' => 'required',
        'new_password' => 'required|string|min:6',
        'new_password_confirmation' => 'required|same:new_password',
    ]);
    
    if (!Hash::check($request->current_password, $user->password)) {
        return response()->json(['message' => 'Password saat ini salah'], 422);
    }
    
    $user->password = Hash::make($request->new_password);
    $user->save();
    
    return response()->json(['success' => true, 'message' => 'Password berhasil diubah']);
}
    public function uploadPhoto(Request $request)
{
    $user = $request->user();
    
    $request->validate([
        'foto_profil' => 'required|image|mimes:jpg,jpeg,png|max:2048',
    ]);
    
    if ($request->hasFile('foto_profil')) {
        $result = cloudinary()->uploadApi()->upload($request->file('foto_profil')->getRealPath(), [
            'folder' => 'profile',
            'verify' => false
        ]);
        $user->foto_profil = $result['secure_url'];
        $user->save();
    }
    
    $user->load(['merchant', 'pelanggan', 'admin']);
    
    return response()->json([
        'success' => true,
        'data' => ['user' => $user],
        'message' => 'Foto profil berhasil diupdate'
    ]);
}
}
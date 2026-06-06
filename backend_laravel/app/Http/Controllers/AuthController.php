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
    /**
     * Mendaftar user baru (ADMIN, PELANGGAN, MERCHANT).
     *
     * @OA\Post(
     *     path="/api/register",
     *     summary="Daftar user baru",
     *     description="Mendaftarkan akun baru dengan role ADMIN, MERCHANT, atau PELANGGAN.",
     *     tags={"Autentikasi"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nama", "username", "email", "password", "role"},
     *             @OA\Property(property="nama", type="string", example="Budi Santoso"),
     *             @OA\Property(property="username", type="string", example="budisantoso"),
     *             @OA\Property(property="email", type="string", format="email", example="budi@gmail.com"),
     *             @OA\Property(property="password", type="string", format="password", example="password123"),
     *             @OA\Property(property="role", type="string", enum={"ADMIN", "PELANGGAN", "MERCHANT"}, example="PELANGGAN"),
     *             @OA\Property(property="foto_profil", type="string", format="binary", nullable=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Pendaftaran sukses",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="token", type="string", example="1|abcde..."),
     *             @OA\Property(property="user", type="object")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Validasi gagal")
     * )
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $request->validate([
            'nama'        => 'required|string|max:100',
            'username'    => 'required|string|unique:users,username|max:50',
            'email'       => 'required|email|unique:users,email|max:255',
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
            'email'       => $request->email,
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

    /**
     * Autentikasi user (Login).
     *
     * @OA\Post(
     *     path="/api/login",
     *     summary="Login user",
     *     description="Masuk ke aplikasi menggunakan username dan password untuk mendapatkan token JWT.",
     *     tags={"Autentikasi"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"username", "password"},
     *             @OA\Property(property="username", type="string", example="budisantoso"),
     *             @OA\Property(property="password", type="string", format="password", example="password123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login berhasil",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="token", type="string", example="1|abcde..."),
     *             @OA\Property(property="user", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Kredensial salah")
     * )
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
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
    
    /**
     * Google OAuth callback login/register.
     *
     * @OA\Post(
     *     path="/api/auth/google",
     *     summary="Login via Google",
     *     description="Masuk atau daftar otomatis menggunakan ID Token dari Google OAuth.",
     *     tags={"Autentikasi"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"id_token"},
     *             @OA\Property(property="id_token", type="string", description="Google ID Token")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login berhasil",
     *         @OA\JsonContent(
     *             @OA\Property(property="user", type="object"),
     *             @OA\Property(property="token", type="string", example="1|abcde...")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Token tidak valid")
     * )
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
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

        $user->load(['admin', 'merchant', 'pelanggan']);

        return response()->json([
            'user' => $this->userWithProfile($user),
            'token' => $token
        ]);
    }

    /**
     * Keluar dari sesi aplikasi (Logout).
     *
     * @OA\Post(
     *     path="/api/logout",
     *     summary="Logout user",
     *     description="Menghapus access token saat ini.",
     *     tags={"Autentikasi"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Logout berhasil",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Logout berhasil")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }

    /**
     * Ambil data profil user saat ini (Me).
     *
     * @OA\Get(
     *     path="/api/me",
     *     summary="Data user saat ini",
     *     description="Mendapatkan informasi detail user beserta profilnya berdasarkan token Sanctum.",
     *     tags={"Autentikasi"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Berhasil mengambil data",
     *         @OA\JsonContent(
     *             @OA\Property(property="id", type="integer", example=1),
     *             @OA\Property(property="username", type="string", example="budisantoso"),
     *             @OA\Property(property="email", type="string", example="budi@gmail.com"),
     *             @OA\Property(property="role", type="string", example="PELANGGAN"),
     *             @OA\Property(property="profile", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
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
        'user' => $this->userWithProfile($user),
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
        'user' => $this->userWithProfile($user),
        'message' => 'Foto profil berhasil diupdate'
    ]);
}
}
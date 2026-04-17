<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Admin;
use App\Models\Merchant;
use App\Models\Pelanggan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
{
    $request->validate([
        'username'  => 'required|unique:users',
        'password'  => 'required|min:4',
        'role'      => 'required|in:ADMIN,MERCHANT,PELANGGAN',
        'nama'      => 'required|string',
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

    return response()->json([
        'success' => true,
        'token'   => $token,
        'user'    => $this->userWithProfile($user),
    ], 201);
}

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Username atau password salah'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => $this->userWithProfile($user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }

    public function me(Request $request)
    {
        return response()->json($this->userWithProfile($request->user()));
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
}

<?php
// app/Http/Controllers/AdminController.php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Pesanan;
use App\Models\Transaksi;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // GET /api/admin/users
    public function users()
    {
        $users = User::with(['admin', 'merchant', 'pelanggan'])->get()->map(function ($u) {
            return [
                'id'       => $u->id,
                'username' => $u->username,
                'role'     => $u->role,
                'nama'     => $u->admin?->nama ?? $u->merchant?->nama_merchant ?? $u->pelanggan?->nama,
            ];
        });
        return response()->json(['success' => true, 'data' => $users]);
    }

    // DELETE /api/admin/users/{id}
    public function deleteUser($id)
    {
        User::findOrFail($id)->delete();
        return response()->json(['message' => 'User dihapus']);
    }

    // GET /api/admin/dashboard
    public function dashboard()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_user'      => User::count(),
                'total_pesanan'   => Pesanan::count(),
                'total_transaksi' => Transaksi::sum('total_bayar'),
                'pesanan_pending' => Pesanan::where('status', 'PENDING')->count(),
            ]
        ]);
    }
}

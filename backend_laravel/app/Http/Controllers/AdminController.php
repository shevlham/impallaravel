<?php
// app/Http/Controllers/AdminController.php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Pesanan;
use App\Models\Transaksi;
use App\Models\Menu;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // GET /api/admin/users
    public function users()
    {
        $users = User::with(['admin', 'merchant', 'pelanggan'])->get()->map(function ($u) {
            return [
                'id'          => $u->id,
                'username'    => $u->username,
                'role'        => $u->role,
                'nama'        => $u->admin?->nama ?? $u->merchant?->nama_merchant ?? $u->pelanggan?->nama,
                'foto_profil' => $u->foto_profil,
                'merchant_id' => $u->merchant?->id,
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
        $transaksis = Transaksi::with(['pesanan.pelanggan', 'pesanan.merchant'])->latest()->get();

        $grafik_pendapatan = Transaksi::where('status_bayar', 'LUNAS')
                                     ->selectRaw('DATE(created_at) as tanggal, SUM(total_bayar) as total')
                                     ->groupBy('tanggal')
                                     ->orderBy('tanggal', 'desc')
                                     ->take(7)
                                     ->get()
                                     ->reverse()
                                     ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'total_user'      => User::count(),
                'total_pesanan'   => Pesanan::count(),
                'total_transaksi' => Transaksi::where('status_bayar', 'LUNAS')->sum('total_bayar'),
                'pesanan_pending' => Pesanan::where('status', 'PENDING')->count(),
                'transaksis'      => $transaksis,
                'grafik_pendapatan' => $grafik_pendapatan
            ]
        ]);
    }

    // PUT /api/admin/transaksi/{id}/lunas
    public function lunasTransaksi($id)
    {
        $transaksi = Transaksi::findOrFail($id);
        $transaksi->update(['status_bayar' => 'LUNAS']);
        
        if ($transaksi->pesanan && $transaksi->pesanan->status === 'PENDING') {
            $transaksi->pesanan->update(['status' => 'DIPROSES']);
        }

        return response()->json(['success' => true, 'message' => 'Pembayaran berhasil dikonfirmasi']);
    }

    // GET /api/admin/menus
    public function menus()
    {
        $menus = Menu::with('merchant')->latest()->get();
        return response()->json(['success' => true, 'data' => $menus]);
    }

    // POST/PUT /api/admin/menus/{id}
    public function updateMenu(Request $request, $id)
    {
        $menu = Menu::findOrFail($id);
        $validated = $request->validate([
            'nama_menu' => 'sometimes|required|string',
            'harga'     => 'sometimes|required|numeric',
            'stok'      => 'sometimes|required|integer',
            'kategori'  => 'sometimes|required|string',
        ]);

        if ($request->hasFile('gambar')) {
            $path = $request->file('gambar')->store('menus', 'public');
            $validated['gambar'] = $path;
        }

        $menu->update($validated);
        return response()->json(['success' => true, 'data' => $menu, 'message' => 'Menu berhasil diupdate']);
    }

    // DELETE /api/admin/menus/{id}
    public function deleteMenu($id)
    {
        Menu::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Menu berhasil dihapus']);
    }
}

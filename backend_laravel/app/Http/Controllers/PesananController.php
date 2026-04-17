<?php
// app/Http/Controllers/PesananController.php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Pesanan;
use App\Models\DetailPesanan;
use App\Models\Transaksi;
use Illuminate\Http\Request;

class PesananController extends Controller
{
    // GET /api/pesanans — list pesanan sesuai role
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Pesanan::with(['pelanggan:id,nama', 'merchant:id,nama_merchant', 'details.menu']);

        if ($user->role === 'PELANGGAN') {
            $query->where('pelanggan_id', $user->pelanggan->id);
        } elseif ($user->role === 'MERCHANT') {
            $query->where('merchant_id', $user->merchant->id);
        }
        // ADMIN lihat semua

        return response()->json(['success' => true, 'data' => $query->latest()->get()]);
    }

    // POST /api/pesanans — pelanggan buat pesanan
    public function store(Request $request)
    {
        $request->validate([
            'merchant_id' => 'required|exists:merchants,id',
            'items'       => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.jumlah'  => 'required|integer|min:1',
        ]);

        $pelanggan = $request->user()->pelanggan;
        if (!$pelanggan) {
            return response()->json(['message' => 'Hanya pelanggan yang bisa memesan'], 403);
        }

        $pesanan = Pesanan::create([
            'pelanggan_id' => $pelanggan->id,
            'merchant_id'  => $request->merchant_id,
            'status'       => 'PENDING',
        ]);

        $totalBayar = 0;
        foreach ($request->items as $item) {
            $menu = Menu::findOrFail($item['menu_id']);
            $subtotal = $menu->harga * $item['jumlah'];
            $totalBayar += $subtotal;

            DetailPesanan::create([
                'pesanan_id' => $pesanan->id,
                'menu_id'    => $item['menu_id'],
                'jumlah'     => $item['jumlah'],
                'subtotal'   => $subtotal,
            ]);
        }

        // Buat transaksi otomatis
        Transaksi::create([
            'pesanan_id'  => $pesanan->id,
            'total_bayar' => $totalBayar,
            'metode_bayar'=> $request->metode_bayar ?? 'CASH',
            'status_bayar'=> 'PENDING',
        ]);

        return response()->json([
            'success' => true,
            'data'    => $pesanan->load(['details.menu', 'transaksi']),
        ], 201);
    }

    // PUT /api/pesanans/{id}/status — merchant update status
    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:PENDING,DIPROSES,SELESAI,BATAL']);

        $pesanan = Pesanan::findOrFail($id);
        $merchant = $request->user()->merchant;

        if (!$merchant || $pesanan->merchant_id !== $merchant->id) {
            return response()->json(['message' => 'Tidak diizinkan'], 403);
        }

        $pesanan->update(['status' => $request->status]);

        // Jika selesai, update status transaksi
        if ($request->status === 'SELESAI') {
            $pesanan->transaksi?->update(['status_bayar' => 'LUNAS']);
        }

        return response()->json(['success' => true, 'data' => $pesanan]);
    }

    // GET /api/pesanans/{id}
    public function show($id)
    {
        $pesanan = Pesanan::with(['pelanggan', 'merchant', 'details.menu', 'transaksi'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $pesanan]);
    }
}

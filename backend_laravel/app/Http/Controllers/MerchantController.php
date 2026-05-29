<?php
// app/Http/Controllers/MerchantController.php

namespace App\Http\Controllers;

use App\Models\Pesanan;
use App\Models\Transaksi;
use Illuminate\Http\Request;

class MerchantController extends Controller
{
    // GET /api/merchant/dashboard
    public function dashboard(Request $request)
    {
        $merchant = $request->user()->merchant;

        if (!$merchant) {
            return response()->json(['message' => 'Hanya merchant yang diizinkan'], 403);
        }

        $pesanans = Pesanan::with(['pelanggan', 'merchant', 'details.menu', 'transaksi'])
            ->where('merchant_id', $merchant->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_pesanan'   => Pesanan::where('merchant_id', $merchant->id)->count(),
                'total_transaksi' => Transaksi::whereHas('pesanan', function($q) use ($merchant) {
                                         $q->where('merchant_id', $merchant->id);
                                     })->where('status_bayar', 'LUNAS')->sum('total_bayar'),
                'pesanan_pending' => Pesanan::where('merchant_id', $merchant->id)->where('status', 'PENDING')->count(),
                'pesanans'        => $pesanans
            ]
        ]);
    }
    public function updateStatus(Request $request)
    {
        $request->validate([
            'status_toko' => 'required|in:BUKA,TUTUP'
        ]);

        $merchant = $request->user()->merchant;
        
        if (!$merchant) {
            return response()->json(['message' => 'Merchant tidak ditemukan'], 404);
        }

        $merchant->update(['status_toko' => $request->status_toko]);

        return response()->json([
            'success' => true,
            'data' => $merchant,
            'message' => 'Status toko berhasil diubah menjadi ' . $request->status_toko
        ]);
    }
        public function getStatus(Request $request)
    {
        $merchant = $request->user()->merchant;
        
        if (!$merchant) {
            return response()->json([
                'success' => false, 
                'message' => 'Merchant tidak ditemukan'
            ], 404);
        }
        return response()->json([
            'success' => true, 
            'data' => [
                'status_toko' => $merchant->status_toko ?? 'BUKA'
            ]
        ]);
    }
}
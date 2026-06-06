<?php
// app/Http/Controllers/PesananController.php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Pesanan;
use App\Models\DetailPesanan;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PesananController extends Controller
{
    /**
     * Tampilkan daftar pesanan sesuai role user.
     *
     * @OA\Get(
     *     path="/api/pesanans",
     *     summary="Daftar pesanan",
     *     description="Mengambil daftar riwayat pesanan. Pelanggan hanya melihat pesanan miliknya, Merchant hanya melihat pesanan ke tokonya, dan Admin melihat semua.",
     *     tags={"Pesanan"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Berhasil mengambil data",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="array", @OA\Items(type="object"))
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Pesanan::with(['pelanggan:id,nama', 'merchant:id,nama_merchant', 'details.menu', 'transaksi']);

        if ($user->role === 'PELANGGAN') {
            $query->where('pelanggan_id', $user->pelanggan->id);
        } elseif ($user->role === 'MERCHANT') {
            $query->where('merchant_id', $user->merchant->id);
        }
        // ADMIN lihat semua

        return response()->json(['success' => true, 'data' => $query->latest()->get()]);
    }

    /**
     * Membuat pesanan baru (Pelanggan).
     *
     * @OA\Post(
     *     path="/api/pesanans",
     *     summary="Buat pesanan baru",
     *     description="Hanya pelanggan yang dapat membuat pesanan. Mengurangi stok menu secara otomatis dan membuat transaksi dengan metode pembayaran CASH atau MIDTRANS.",
     *     tags={"Pesanan"},
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"merchant_id", "items"},
     *             @OA\Property(property="merchant_id", type="integer", example=1),
     *             @OA\Property(property="catatan", type="string", example="Pedas sedang ya", nullable=true),
     *             @OA\Property(property="nomor_meja", type="string", example="5", nullable=true),
     *             @OA\Property(property="tipe_pemesanan", type="string", enum={"DINE_IN", "TAKE_AWAY"}, example="DINE_IN"),
     *             @OA\Property(property="metode_bayar", type="string", enum={"CASH", "MIDTRANS"}, example="CASH"),
     *             @OA\Property(
     *                 property="items",
     *                 type="array",
     *                 @OA\Items(
     *                     required={"menu_id", "jumlah"},
     *                     @OA\Property(property="menu_id", type="integer", example=2),
     *                     @OA\Property(property="jumlah", type="integer", example=1)
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Pesanan berhasil dibuat",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Stok tidak mencukupi"),
     *     @OA\Response(response=403, description="Hanya pelanggan yang bisa memesan"),
     *     @OA\Response(response=422, description="Validasi gagal")
     * )
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'merchant_id' => 'required|exists:merchants,id',
            'items'       => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.jumlah'  => 'required|integer|min:1',
            'catatan'     => 'nullable|string|max:1000',
            'nomor_meja'  => 'nullable|string|max:50',
            'tipe_pemesanan' => 'nullable|string|in:DINE_IN,TAKE_AWAY',
        ]);

        $pelanggan = $request->user()->pelanggan;
        if (!$pelanggan) {
            return response()->json(['message' => 'Hanya pelanggan yang bisa memesan'], 403);
        }

        try {
            DB::beginTransaction();

            $pesanan = Pesanan::create([
                'pelanggan_id' => $pelanggan->id,
                'merchant_id'  => $request->merchant_id,
                'status'       => 'PENDING',
                'catatan'      => $request->catatan ?? null,
                'nomor_meja'   => $request->nomor_meja ?? null,
                'tipe_pemesanan'=> $request->tipe_pemesanan ?? 'DINE_IN',
            ]);

            $totalBayar = 0;
            foreach ($request->items as $item) {
                $menu = Menu::lockForUpdate()->findOrFail($item['menu_id']);

                if ($menu->stok < $item['jumlah']) {
                    DB::rollBack();
                    return response()->json(['message' => 'Stok ' . $menu->nama_menu . ' tidak mencukupi'], 400);
                }

                $subtotal = $menu->harga * $item['jumlah'];
                $totalBayar += $subtotal;

                DetailPesanan::create([
                    'pesanan_id' => $pesanan->id,
                    'menu_id'    => $item['menu_id'],
                    'jumlah'     => $item['jumlah'],
                    'subtotal'   => $subtotal,
                ]);

                // Kurangi stok
                $menu->decrement('stok', $item['jumlah']);
            }

            // Buat transaksi otomatis
            Transaksi::create([
                'pesanan_id'  => $pesanan->id,
                'total_bayar' => $totalBayar,
                'metode_bayar'=> $request->metode_bayar ?? 'CASH',
                'status_bayar'=> 'PENDING',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data'    => $pesanan->load(['details.menu', 'transaksi']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Terjadi kesalahan: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Memperbarui status pesanan (Merchant).
     *
     * @OA\Put(
     *     path="/api/pesanans/{id}/status",
     *     summary="Update status pesanan",
     *     description="Hanya merchant pemilik pesanan yang dapat memperbarui status pesanan. Mengubah status transaksi menjadi LUNAS atau BATAL sesuai status baru.",
     *     tags={"Pesanan"},
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID Pesanan",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"status"},
     *             @OA\Property(property="status", type="string", enum={"PENDING", "DIPROSES", "SELESAI", "BATAL"}, example="DIPROSES")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Status berhasil diubah",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Status tidak dapat diubah lagi"),
     *     @OA\Response(response=403, description="Tidak diizinkan"),
     *     @OA\Response(response=404, description="Pesanan tidak ditemukan"),
     *     @OA\Response(response=422, description="Validasi gagal")
     * )
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:PENDING,DIPROSES,SELESAI,BATAL']);

        $pesanan = Pesanan::with(['details.menu', 'transaksi'])->findOrFail($id);
        $merchant = $request->user()->merchant;

        if (!$merchant || $pesanan->merchant_id !== $merchant->id) {
            return response()->json(['message' => 'Tidak diizinkan'], 403);
        }

        if ($pesanan->status === 'BATAL' || $pesanan->status === 'SELESAI') {
             return response()->json(['message' => 'Status pesanan tidak dapat diubah lagi'], 400);
        }

        try {
            DB::beginTransaction();

            $pesanan->update(['status' => $request->status]);

            // Jika selesai, update status transaksi
            if ($request->status === 'SELESAI') {
                $pesanan->transaksi?->update(['status_bayar' => 'LUNAS']);
            }

            // Jika batal, kembalikan stok dan set status transaksi jadi BATAL
            if ($request->status === 'BATAL') {
                foreach ($pesanan->details as $detail) {
                    if ($detail->menu) {
                        $detail->menu->increment('stok', $detail->jumlah);
                    }
                }
                $pesanan->transaksi?->update(['status_bayar' => 'BATAL']);
            }

            DB::commit();

            return response()->json(['success' => true, 'data' => $pesanan]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal memperbarui status: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Membatalkan pesanan (Pelanggan).
     *
     * @OA\Put(
     *     path="/api/pesanans/{id}/batal",
     *     summary="Batalkan pesanan",
     *     description="Hanya pelanggan pemilik pesanan yang dapat membatalkan pesanan jika belum SELESAI atau BATAL. Mengkembalikan stok menu yang dipesan.",
     *     tags={"Pesanan"},
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID Pesanan",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Pesanan berhasil dibatalkan",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Pesanan berhasil dibatalkan"),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Pesanan sudah selesai atau batal"),
     *     @OA\Response(response=403, description="Tidak diizinkan"),
     *     @OA\Response(response=404, description="Pesanan tidak ditemukan")
     * )
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function batalPesanan(Request $request, $id)
    {
        $pesanan = Pesanan::with(['details.menu', 'transaksi'])->findOrFail($id);
        $pelanggan = $request->user()->pelanggan;

        if (!$pelanggan || $pesanan->pelanggan_id !== $pelanggan->id) {
            return response()->json(['message' => 'Tidak diizinkan'], 403);
        }

        if (in_array($pesanan->status, ['SELESAI', 'BATAL'])) {
            return response()->json(['message' => 'Pesanan yang sudah selesai atau batal tidak dapat dibatalkan.'], 400);
        }

        try {
            DB::beginTransaction();

            $pesanan->update(['status' => 'BATAL']);

            // Restore stok
            foreach ($pesanan->details as $detail) {
                if ($detail->menu) {
                    $detail->menu->increment('stok', $detail->jumlah);
                }
            }

            // Set status transaksi jadi BATAL
            if ($pesanan->transaksi) {
                $pesanan->transaksi->update(['status_bayar' => 'BATAL']);
            }

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Pesanan berhasil dibatalkan', 'data' => $pesanan]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membatalkan pesanan: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Tampilkan detail pesanan.
     *
     * @OA\Get(
     *     path="/api/pesanans/{id}",
     *     summary="Detail pesanan",
     *     description="Mengambil rincian detail satu pesanan beserta relasinya (pelanggan, merchant, detail pesanan, menu, dan transaksi).",
     *     tags={"Pesanan"},
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID Pesanan",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Data berhasil diambil",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated"),
     *     @OA\Response(response=404, description="Pesanan tidak ditemukan")
     * )
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $pesanan = Pesanan::with(['pelanggan', 'merchant', 'details.menu', 'transaksi'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $pesanan]);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Order;
use App\Models\Pesanan;
use App\Models\Transaksi;
use Carbon\Carbon;

class PaymentController extends Controller
{
    public function createInvoice(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'order_id' => 'required'
        ]);

        $apiKey = env('XENDIT_SECRET_KEY');

        // Ambil order dari database
        $order = Order::find($request->order_id);

        // Jika order tidak ditemukan di tabel `orders`, coba cari dari tabel `pesanans` dan buat dynamic order record!
        if (!$order) {
            $pesanan = Pesanan::with('transaksi')->find($request->order_id);
            if ($pesanan) {
                $user = $request->user();
                $totalBayar = $pesanan->transaksi ? (int)$pesanan->transaksi->total_bayar : 0;
                
                // Buat record order secara dinamis agar terintegrasi sempurna dengan Xendit
                $order = Order::create([
                    'id' => $pesanan->id, // Samakan ID agar memudahkan tracking
                    'user_id' => $user ? $user->id : ($pesanan->pelanggan->user_id ?? 1),
                    'total_price' => $totalBayar,
                    'status' => 'PENDING',
                    'payment_method' => $pesanan->transaksi ? $pesanan->transaksi->metode_bayar : 'XENDIT',
                ]);
            } else {
                return response()->json([
                    'message' => 'Order / Pesanan tidak ditemukan'
                ], 404);
            }
        }

        // ID unik invoice
        $externalId = 'order-' . $order->id . '-' . time();

        $payload = [
            'external_id' => $externalId,
            'amount' => (int) $order->total_price, // Selalu ambil dari database untuk keamanan (anti price tampering)
            'payer_email' => $request->email,
            'description' => 'Pembayaran TelEat Order #' . $order->id,
            'success_redirect_url' => 'http://localhost:3000/payment/success',
            'failure_redirect_url' => 'http://localhost:3000/payment/failed',
        ];

        $response = Http::withBasicAuth($apiKey, '')
            ->post('https://api.xendit.co/v2/invoices', $payload);

        if (!$response->successful()) {
            Log::error('Gagal membuat invoice Xendit:', [
                'order_id' => $order->id,
                'response' => $response->body()
            ]);
            return response()->json([
                'message' => 'Gagal membuat invoice',
                'error' => $response->body()
            ], 500);
        }

        $data = $response->json();

        // Simpan invoice id & external id ke database
        $order->update([
            'xendit_invoice_id' => $data['id'],
            'external_id' => $externalId,
            'status' => 'PENDING'
        ]);

        return response()->json([
            'invoice_url' => $data['invoice_url'],
            'invoice_id' => $data['id'],
            'external_id' => $externalId
        ]);
    }

    public function webhook(Request $request)
    {
        // 1. Simpan semua payload webhook ke log Laravel untuk debugging
        Log::info('Xendit Webhook payload received:', $request->all());

        // 2. Validasi keamanan webhook (X-Callback-Token)
        $callbackToken = env('XENDIT_CALLBACK_TOKEN');
        $requestToken = $request->header('x-callback-token');

        if ($callbackToken && $requestToken !== $callbackToken) {
            Log::warning('Xendit Webhook: Invalid callback token attempt', [
                'expected' => $callbackToken,
                'received' => $requestToken
            ]);
            return response()->json([
                'message' => 'Unauthorized signature'
            ], 401);
        }

        $data = $request->all();
        $status = $data['status'] ?? null;
        $externalId = $data['external_id'] ?? null;

        if (!$externalId) {
            return response()->json([
                'message' => 'External ID is required'
            ], 400);
        }

        // 3. Gunakan external_id sebagai primary reference untuk update order
        $order = Order::where('external_id', $externalId)->first();

        if (!$order) {
            Log::error('Xendit Webhook: Order not found for external_id: ' . $externalId);
            return response()->json([
                'message' => 'Order not found'
            ], 404);
        }

        // 4. PROTECTION (IDEMPOTENCY) - Jangan update order yang sudah PAID
        if ($order->status === 'PAID') {
            Log::info('Xendit Webhook: Order is already PAID. Skipping update.', [
                'order_id' => $order->id,
                'external_id' => $externalId
            ]);
            return response()->json([
                'message' => 'Order already processed (PAID)'
            ]);
        }

        // 5. Tambahkan validasi status Xendit (PAID, SETTLED, EXPIRED)
        if ($status === 'PAID' || $status === 'SETTLED') {
            $order->update([
                'status' => 'PAID',
                'paid_at' => Carbon::now()
            ]);

            // Sync status ke tabel `pesanans` dan `transaksis` yang bersangkutan
            $pesanan = Pesanan::find($order->id);
            if ($pesanan) {
                $pesanan->update([
                    'status' => 'DIPROSES' // Ubah status pesanan ke DIPROSES agar Merchant bisa memproses makanan
                ]);
                if ($pesanan->transaksi) {
                    $pesanan->transaksi->update([
                        'status_bayar' => 'LUNAS' // Tandai transaksi sebagai LUNAS
                    ]);
                }
            }

            Log::info('Xendit Webhook: Order, Pesanan, and Transaksi successfully updated to PAID/LUNAS.', [
                'order_id' => $order->id,
                'external_id' => $externalId
            ]);
        } elseif ($status === 'EXPIRED') {
            $order->update([
                'status' => 'EXPIRED'
            ]);

            $pesanan = Pesanan::find($order->id);
            if ($pesanan) {
                $pesanan->update([
                    'status' => 'BATAL' // Jika expired, batalkan pesanan
                ]);
            }

            Log::info('Xendit Webhook: Order and Pesanan marked as EXPIRED/BATAL.', [
                'order_id' => $order->id,
                'external_id' => $externalId
            ]);
        } else {
            Log::info('Xendit Webhook: Unhandled status received: ' . $status, [
                'order_id' => $order->id,
                'external_id' => $externalId
            ]);
        }

        return response()->json([
            'message' => 'Webhook processed successfully'
        ]);
    }

    public function getOrderStatus(Request $request, $id)
    {
        // Temukan order berdasarkan ID
        $order = Order::find($id);

        if (!$order) {
            // Coba cari di Pesanan jika belum tercatat di Order
            $pesanan = Pesanan::with('transaksi')->find($id);
            if ($pesanan) {
                return response()->json([
                    'id' => $pesanan->id,
                    'status' => $pesanan->status,
                    'total_price' => $pesanan->transaksi ? $pesanan->transaksi->total_bayar : 0,
                    'paid_at' => $pesanan->transaksi && $pesanan->transaksi->status_bayar === 'LUNAS' ? Carbon::now()->toIso8601String() : null
                ]);
            }

            return response()->json([
                'message' => 'Order tidak ditemukan'
            ], 404);
        }

        // Opsional: Validasi keamanan agar user hanya bisa melihat order miliknya
        $user = $request->user();
        if ($user && $order->user_id !== $user->id && $user->role !== 'ADMIN') {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke order ini'
            ], 403);
        }

        return response()->json([
            'id' => $order->id,
            'status' => $order->status,
            'total_price' => $order->total_price,
            'paid_at' => $order->paid_at ? $order->paid_at->toIso8601String() : null
        ]);
    }
}
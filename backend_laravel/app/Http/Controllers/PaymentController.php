<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Order;
use App\Models\Pesanan;
use App\Models\Transaksi;
use Carbon\Carbon;
use Midtrans\Config;
use Midtrans\Snap;

class PaymentController extends Controller
{
    public function __construct()
    {
        Config::$serverKey = env('MIDTRANS_SERVER_KEY');
        Config::$isProduction = env('MIDTRANS_IS_PRODUCTION', false);
        Config::$isSanitized = true;
        Config::$is3ds = true;
        Config::$curlOptions = [
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_SSL_VERIFYPEER => 0,
            CURLOPT_HTTPHEADER => []
        ];
    }

    public function createInvoice(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'order_id' => 'required'
        ]);

        // Ambil order dari database
        $order = Order::find($request->order_id);

        // Jika order tidak ditemukan di tabel `orders`, coba cari dari tabel `pesanans` dan buat dynamic order record!
        if (!$order) {
            $pesanan = Pesanan::with('transaksi')->find($request->order_id);
            if ($pesanan) {
                $user = $request->user();
                $totalBayar = $pesanan->transaksi ? (int)$pesanan->transaksi->total_bayar : 0;
                
                // Buat record order secara dinamis
                $order = Order::create([
                    'id' => $pesanan->id, // Samakan ID agar memudahkan tracking
                    'user_id' => $user ? $user->id : ($pesanan->pelanggan->user_id ?? 1),
                    'total_price' => $totalBayar,
                    'status' => 'PENDING',
                    'payment_method' => $pesanan->transaksi ? $pesanan->transaksi->metode_bayar : 'MIDTRANS',
                ]);
            } else {
                return response()->json([
                    'message' => 'Order / Pesanan tidak ditemukan'
                ], 404);
            }
        }

        // ID unik external untuk order
        $externalId = 'order-' . $order->id . '-' . time();
        $order->update(['external_id' => $externalId]);

        $params = array(
            'transaction_details' => array(
                'order_id' => $externalId,
                'gross_amount' => (int) $order->total_price,
            ),
            'customer_details' => array(
                'first_name' => $request->user() ? $request->user()->username : 'Customer',
                'email' => $request->email,
            ),
        );

        try {
            $snapToken = Snap::getSnapToken($params);
            
            return response()->json([
                'snap_token' => $snapToken,
                'external_id' => $externalId
            ]);
        } catch (\Exception $e) {
            Log::error('Gagal membuat Snap Token Midtrans:', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Gagal membuat Snap Token',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function webhook(Request $request)
    {
        Log::info('Midtrans Webhook payload received:', $request->all());

        $data = $request->all();
        $status = $data['transaction_status'] ?? null;
        $externalId = $data['order_id'] ?? null;
        $fraudStatus = $data['fraud_status'] ?? null;

        if (!$externalId) {
            return response()->json([
                'message' => 'Order ID (external_id) is required'
            ], 400);
        }

        $order = Order::where('external_id', $externalId)->first();

        if (!$order) {
            Log::error('Midtrans Webhook: Order not found for external_id: ' . $externalId);
            return response()->json([
                'message' => 'Order not found'
            ], 404);
        }

        if ($order->status === 'PAID') {
            Log::info('Midtrans Webhook: Order is already PAID. Skipping update.');
            return response()->json([
                'message' => 'Order already processed (PAID)'
            ]);
        }

        // Handle transaction status
        if ($status == 'capture') {
            if ($fraudStatus == 'challenge') {
                $order->update(['status' => 'PENDING']);
            } else if ($fraudStatus == 'accept') {
                $this->markOrderAsPaid($order, $externalId);
            }
        } else if ($status == 'settlement') {
            $this->markOrderAsPaid($order, $externalId);
        } else if ($status == 'cancel' || $status == 'deny' || $status == 'expire') {
            $order->update(['status' => 'EXPIRED']);
            $pesanan = Pesanan::find($order->id);
            if ($pesanan) {
                $pesanan->update(['status' => 'BATAL']);
            }
            Log::info('Midtrans Webhook: Order marked as EXPIRED/BATAL.');
        } else if ($status == 'pending') {
            $order->update(['status' => 'PENDING']);
        }

        return response()->json([
            'message' => 'Webhook processed successfully'
        ]);
    }

    private function markOrderAsPaid($order, $externalId) 
    {
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

        Log::info('Midtrans Webhook: Order successfully updated to PAID/LUNAS.', [
            'order_id' => $order->id,
            'external_id' => $externalId
        ]);
    }

    public function getOrderStatus(Request $request, $id)
    {
        $order = Order::find($id);

        if (!$order) {
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

        return response()->json([
            'id' => $order->id,
            'status' => $order->status,
            'total_price' => $order->total_price,
            'paid_at' => $order->paid_at ? $order->paid_at->toIso8601String() : null
        ]);
    }
}
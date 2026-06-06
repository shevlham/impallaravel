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
            'order_id' => 'required',
            'order_ids' => 'nullable|array',
        ]);

        $user = $request->user();

        // Cek jika order_ids dikirim sebagai array (kasus multi-merchant)
        if ($request->has('order_ids') && is_array($request->order_ids) && count($request->order_ids) > 0) {
            $orderIds = $request->order_ids;
            $pesanans = Pesanan::with('transaksi')->whereIn('id', $orderIds)->get();

            if ($pesanans->isEmpty()) {
                return response()->json([
                    'message' => 'Pesanan-pesanan tidak ditemukan'
                ], 404);
            }

            // Hitung total harga gabungan dari semua transaksi pesanan
            $totalBayar = 0;
            foreach ($pesanans as $pesanan) {
                $totalBayar += $pesanan->transaksi ? (int)$pesanan->transaksi->total_bayar : 0;
            }

            // Gunakan ID pesanan pertama sebagai base ID untuk record Order
            $baseOrderId = $pesanans->first()->id;

            $order = Order::find($baseOrderId);
            if (!$order) {
                $order = Order::create([
                    'id' => $baseOrderId,
                    'user_id' => $user ? $user->id : ($pesanans->first()->pelanggan->user_id ?? 1),
                    'pesanan_ids' => implode(',', $orderIds),
                    'total_price' => $totalBayar,
                    'status' => 'PENDING',
                    'payment_method' => 'MIDTRANS',
                ]);
            } else {
                $order->update([
                    'pesanan_ids' => implode(',', $orderIds),
                    'total_price' => $totalBayar,
                    'status' => 'PENDING',
                    'payment_method' => 'MIDTRANS',
                ]);
            }
        } else {
            // Fallback: Kasus satu pesanan biasa (single-merchant)
            $pesanan = Pesanan::with('transaksi')->find($request->order_id);
            if (!$pesanan) {
                return response()->json([
                    'message' => 'Order / Pesanan tidak ditemukan'
                ], 404);
            }

            $totalBayar = $pesanan->transaksi ? (int)$pesanan->transaksi->total_bayar : 0;

            $order = Order::find($request->order_id);
            if (!$order) {
                $order = Order::create([
                    'id' => $pesanan->id,
                    'user_id' => $user ? $user->id : ($pesanan->pelanggan->user_id ?? 1),
                    'pesanan_ids' => (string) $pesanan->id,
                    'total_price' => $totalBayar,
                    'status' => 'PENDING',
                    'payment_method' => $pesanan->transaksi ? $pesanan->transaksi->metode_bayar : 'MIDTRANS',
                ]);
            } else {
                $order->update([
                    'pesanan_ids' => (string) $pesanan->id,
                    'total_price' => $totalBayar,
                    'status' => 'PENDING',
                    'payment_method' => $pesanan->transaksi ? $pesanan->transaksi->metode_bayar : 'MIDTRANS',
                ]);
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
                'first_name' => $user ? $user->username : 'Customer',
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
            
            $pesananIds = [];
            if (!empty($order->pesanan_ids)) {
                $pesananIds = explode(',', $order->pesanan_ids);
            } else {
                $pesananIds = [$order->id];
            }

            foreach ($pesananIds as $pId) {
                $pesanan = Pesanan::find(trim($pId));
                if ($pesanan) {
                    $pesanan->update(['status' => 'BATAL']);
                }
            }
            Log::info('Midtrans Webhook: Orders marked as EXPIRED/BATAL.', ['pesanan_ids' => $pesananIds]);
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

        // Sync status ke semua tabel `pesanans` dan `transaksis` yang bersangkutan
        $pesananIds = [];
        if (!empty($order->pesanan_ids)) {
            $pesananIds = explode(',', $order->pesanan_ids);
        } else {
            // Fallback jika pesanan_ids kosong (misal data legacy)
            $pesananIds = [$order->id];
        }

        foreach ($pesananIds as $pId) {
            $pesanan = Pesanan::find(trim($pId));
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
        }

        Log::info('Midtrans Webhook: Orders successfully updated to PAID/LUNAS.', [
            'order_id' => $order->id,
            'pesanan_ids' => $pesananIds,
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
<?php

namespace App\Observers;

use App\Models\Transaksi;
use App\Mail\NotaTransaksiMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class TransaksiObserver
{
    /**
     * Handle the Transaksi "saved" event (covers both created and updated).
     *
     * @param Transaksi $transaksi
     * @return void
     */
    public function saved(Transaksi $transaksi): void
    {
        // Jika status_bayar bernilai LUNAS dan (baru dibuat atau status_bayar berubah menjadi LUNAS)
        if ($transaksi->status_bayar === 'LUNAS' && ($transaksi->wasRecentlyCreated || $transaksi->isDirty('status_bayar'))) {
            try {
                // Pastikan relasi diload untuk mendapatkan data user pelanggan
                $transaksi->load(['pesanan.pelanggan.user']);
                
                $pesanan = $transaksi->pesanan;
                if ($pesanan && $pesanan->pelanggan && $pesanan->pelanggan->user) {
                    $email = $pesanan->pelanggan->user->email;
                    if ($email) {
                        Mail::to($email)->send(new NotaTransaksiMail($transaksi));
                        Log::info('Email nota transaksi berhasil dijadwalkan ke antrean untuk: ' . $email . ' (Transaksi ID #' . $transaksi->transaksi_id . ')');
                    } else {
                        Log::warning('Gagal mengirim email nota: Pelanggan tidak memiliki email valid (Transaksi ID #' . $transaksi->transaksi_id . ')');
                    }
                } else {
                    Log::warning('Gagal mengirim email nota: Hubungan pesanan/pelanggan/user tidak lengkap (Transaksi ID #' . $transaksi->transaksi_id . ')');
                }
            } catch (\Exception $e) {
                Log::error('Terjadi kesalahan saat mengirim email nota transaksi ID #' . $transaksi->transaksi_id . ': ' . $e->getMessage());
            }
        }
    }
}

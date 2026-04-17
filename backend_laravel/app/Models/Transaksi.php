<?php

namespace App\Models;

class Transaksi
{
    public int $idTransaksi;
    public string $status;
    public string $metodeBayar;
    public ?Pesanan $pesanan = null;

    public function prosesTransaksi()
    {
        echo "Memproses transaksi ID: {$this->idTransaksi}\n";

        if ($this->pesanan && $this->pesanan->totalHarga > 0) {
            $this->status = "SELESAI";
            $this->pesanan->updateStatus("SELESAI");

            echo "Transaksi berhasil dengan metode: {$this->metodeBayar}\n";
        } else {
            $this->status = "GAGAL";

            if ($this->pesanan) {
                $this->pesanan->updateStatus("GAGAL");
            }

            echo "Transaksi gagal!\n";
        }
    }
}
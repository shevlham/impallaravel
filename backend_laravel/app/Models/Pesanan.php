<?php

namespace App\Models;

class Pesanan
{
    public int $idPesanan;
    public float $totalHarga;
    public string $status;

    public function hitungTotal()
    {
        echo "Total harga: " . $this->totalHarga . "\n";
    }

    public function updateStatus($status)
    {
        $this->status = $status;
        echo "Status pesanan: " . $status . "\n";
    }
}
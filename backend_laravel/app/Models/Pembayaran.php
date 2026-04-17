<?php

namespace App\Models;

class Pembayaran
{
    public int $idPembayaran;
    public string $metodeBayar;
    public float $totalBayar;

    public function prosesPembayaran()
    {
        echo "Pembayaran dengan metode: " . $this->metodeBayar . "\n";
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pesanan extends Model
{
    protected $table = 'pesanans';

    protected $fillable = [
        'pelanggan_id',
        'merchant_id',
        'totalHarga',
        'status',
        'catatan',
    ];

    public function pelanggan()
    {
        return $this->belongsTo(Pelanggan::class);
    }

    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public function details()
    {
        return $this->hasMany(DetailPesanan::class);
    }

    public function transaksi()
    {
        return $this->hasOne(Transaksi::class);
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    protected $table = 'transaksis'; // sesuaikan nama tabel di DB kamu

    protected $fillable = [
        'pesanan_id',
        'total_bayar',
        'status_bayar',
        'metode_bayar',
    ];

    // relasi ke pesanan
    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }
}
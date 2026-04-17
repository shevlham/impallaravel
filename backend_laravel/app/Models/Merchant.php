<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Merchant extends Model
{
    protected $fillable = [
        'user_id',
        'nama_merchant'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
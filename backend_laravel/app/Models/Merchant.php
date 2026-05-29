<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Merchant extends Model
{
    protected $fillable = [
        'user_id',
        'nama_merchant',
        'status_toko',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function menus()
    {
        return $this->hasMany(Menu::class);
    }
}
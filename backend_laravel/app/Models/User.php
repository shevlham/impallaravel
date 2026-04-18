<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasFactory;
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'username',
        'email',
        'google_id',
        'password',
        'role',
    ];

    protected $hidden = ['password'];

    protected $casts = ['password' => 'hashed'];

    public function admin()    { return $this->hasOne(Admin::class); }
    public function merchant() { return $this->hasOne(Merchant::class); }
    public function pelanggan(){ return $this->hasOne(Pelanggan::class); }
}

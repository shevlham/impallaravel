<?php
// app/Models/Admin.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Admin extends Model {
    protected $fillable = ['user_id', 'nama'];
    public function user() { return $this->belongsTo(User::class); }
}


// ─────────────────────────────────────────────
// app/Models/Merchant.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Merchant extends Model {
    protected $fillable = ['user_id', 'nama_merchant'];
    public function user()  { return $this->belongsTo(User::class); }
    public function menus() { return $this->hasMany(Menu::class); }
    public function pesanans() { return $this->hasMany(Pesanan::class); }
}


// ─────────────────────────────────────────────
// app/Models/Pelanggan.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Pelanggan extends Model {
    protected $fillable = ['user_id', 'nama'];
    public function user()     { return $this->belongsTo(User::class); }
    public function pesanans() { return $this->hasMany(Pesanan::class); }
}


// ─────────────────────────────────────────────
// app/Models/Menu.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Menu extends Model {
    protected $fillable = ['merchant_id', 'nama_menu', 'harga', 'stok'];
    public function merchant()      { return $this->belongsTo(Merchant::class); }
    public function detailPesanans(){ return $this->hasMany(DetailPesanan::class); }
}


// ─────────────────────────────────────────────
// app/Models/Pesanan.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Pesanan extends Model {
    protected $fillable = ['pelanggan_id', 'merchant_id', 'status'];
    public function pelanggan()     { return $this->belongsTo(Pelanggan::class); }
    public function merchant()      { return $this->belongsTo(Merchant::class); }
    public function details()       { return $this->hasMany(DetailPesanan::class); }
    public function transaksi()     { return $this->hasOne(Transaksi::class); }
}


// ─────────────────────────────────────────────
// app/Models/DetailPesanan.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class DetailPesanan extends Model {
    protected $table = 'detail_pesanans';
    protected $fillable = ['pesanan_id', 'menu_id', 'jumlah', 'subtotal'];
    public function pesanan() { return $this->belongsTo(Pesanan::class); }
    public function menu()    { return $this->belongsTo(Menu::class); }
}


// ─────────────────────────────────────────────
// app/Models/Transaksi.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model {
    protected $primaryKey = 'transaksi_id';
    protected $fillable = ['pesanan_id', 'total_bayar', 'metode_bayar', 'status_bayar'];
    public function pesanan() { return $this->belongsTo(Pesanan::class); }
}

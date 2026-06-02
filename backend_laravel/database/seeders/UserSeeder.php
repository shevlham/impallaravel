<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Merchant;
use App\Models\Pelanggan;
use App\Models\Admin;
use App\Models\Menu;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // =====================
        // ADMIN
        // =====================
        $admin = User::create([
            'username'    => 'admin',
            'password'    => Hash::make('admin'),
            'role'        => 'ADMIN',
            'foto_profil' => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780393497/profile/xuos4z2f8a9slpnrtatd.png',
        ]);

        Admin::create([
            'user_id' => $admin->id,
            'nama'    => 'Admin Utama',
        ]);

        // =====================
        // MERCHANT + MENU DATA
        // =====================
        $merchantData = [
            [
                'username'      => 'KATSUNA',
                'nama_merchant' => 'KATSUNA',
                'foto_profil'   => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780392685/profile/ysiurczcajxdapwvxw2e.png',
                'menus' => [
                    ['nama_menu' => 'Nasi Katsu Teriyaki', 'harga' => 15000, 'stok' => 15, 'kategori' => 'Makanan',  'gambar' => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1778867805/menu/sgfl73trlllhkrlz7dmt.jpg'],
                    ['nama_menu' => 'Nasi Katsu Kari',     'harga' => 17000, 'stok' => 28, 'kategori' => 'Makanan',  'gambar' => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1778917418/menu/zsovhouhlrldd5ozoo9g.jpg'],
                    ['nama_menu' => 'Katsu Ramen',         'harga' => 20000, 'stok' => 4,  'kategori' => 'Makanan',  'gambar' => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1778917457/menu/guro0xogvnw1n37izwr2.jpg'],
                    ['nama_menu' => 'Es Teh',              'harga' => 6000,  'stok' => 49, 'kategori' => 'Minuman',  'gambar' => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1778917487/menu/pmphiadrdm3ur4sr487u.jpg'],
                ],
            ],
            [
                'username'      => 'DFC',
                'nama_merchant' => 'DFC',
                'foto_profil'   => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780392828/profile/eondnn16gqb7d7pkv7g3.jpg',
                'menus' => [
                    ['nama_menu' => 'Ayam Goreng',      'harga' => 9000,  'stok' => 20, 'kategori' => 'Makanan', 'gambar' => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1778917619/menu/lasl3mxnomwgy4iv62on.jpg'],
                    ['nama_menu' => 'Nasi Ayam Goreng', 'harga' => 13000, 'stok' => 13, 'kategori' => 'Makanan', 'gambar' => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1778917642/menu/ys5gitcgztbe8pj3hrhu.jpg'],
                    ['nama_menu' => 'Sempol Ayam',      'harga' => 10000, 'stok' => 29, 'kategori' => 'Cemilan', 'gambar' => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1778917691/menu/wkjyiayoewbiemmfdflz.jpg'],
                ],
            ],
            [
                'username'      => 'SABANA',
                'nama_merchant' => 'SABANA',
                'foto_profil'   => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780393098/profile/jqvfukhbparaimzupep6.png',
                'menus' => [],  // belum ada menu di database
            ],
            [
                'username'      => 'BAKSO MIE AYAM MAS YONO',
                'nama_merchant' => 'BAKSO MIE AYAM MAS YONO',
                'foto_profil'   => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780392976/profile/ayydnsbndufp5rhtmrkn.jpg',
                'menus' => [
                    ['nama_menu' => 'Bakso',   'harga' => 10000, 'stok' => 36, 'kategori' => 'Makanan', 'gambar' => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1778917800/menu/az3ptw6c461seyevn2oy.jpg'],
                    ['nama_menu' => 'Mie Ayam', 'harga' => 12000, 'stok' => 43, 'kategori' => 'Makanan', 'gambar' => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1778917830/menu/zu9jrusks6gilixcneaj.jpg'],
                ],
            ],
            [
                'username'      => 'MURAH ENAK',
                'nama_merchant' => 'MURAH ENAK',
                'foto_profil'   => null,
                'menus' => [],  // belum ada menu di database
            ],
        ];

        foreach ($merchantData as $data) {
            $user = User::create([
                'username'    => $data['username'],
                'password'    => Hash::make('merchant123'),
                'role'        => 'MERCHANT',
                'foto_profil' => $data['foto_profil'] ?? null,
            ]);

            $merchant = Merchant::create([
                'user_id'       => $user->id,
                'nama_merchant' => $data['nama_merchant'],
            ]);

            foreach ($data['menus'] as $menu) {
                Menu::create([
                    'merchant_id' => $merchant->id,
                    'nama_menu'   => $menu['nama_menu'],
                    'harga'       => $menu['harga'],
                    'stok'        => $menu['stok'],
                    'kategori'    => $menu['kategori'],
                    'gambar'      => $menu['gambar'],
                ]);
            }
        }

        // =====================
        // PELANGGAN (20 ORANG)
        // =====================
        $pelangganPhotos = [
            1  => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780393401/profile/dubewtucapn8k72td3lo.png',
            2  => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780393576/profile/jrs75lsmkzowmv15njpe.png',
            3  => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780393623/profile/dosygutwnlgeoeck0tdk.png',
            4  => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780393644/profile/shv13woifjvvy9jkhehp.png',
            5  => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780393683/profile/ibtgip5qifhs3c92ylkc.png',
            6  => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780393707/profile/bbdhr5kl0fvoqjbesl4b.png',
            7  => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780393734/profile/fusszkvbdwgip9aoqmjy.png',
            8  => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780393756/profile/xgjagvtevlvyjjhwbk4x.png',
            9  => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780393775/profile/obh5yise1durm34kfmbc.png',
            10 => 'https://res.cloudinary.com/df7jtyyxr/image/upload/v1780393796/profile/os0bdeeqqxvwf7w82ecl.png',
        ];

        for ($i = 1; $i <= 20; $i++) {
            $user = User::create([
                'username'    => 'pelanggan' . $i,
                'password'    => Hash::make('pelanggan123'),
                'role'        => 'PELANGGAN',
                'foto_profil' => $pelangganPhotos[$i] ?? null,
            ]);

            Pelanggan::create([
                'user_id' => $user->id,
                'nama'    => 'Pelanggan ' . $i,
            ]);
        }

        // =====================
        // TRANSACTIONS SEEDER (DUMMY DATA FOR GRAPHS)
        // =====================
        $pelanggans = Pelanggan::all();
        $merchants = Merchant::with('menus')->get();

        foreach ($merchants as $merchant) {
            // Hanya buat transaksi jika merchant punya menu
            if ($merchant->menus->count() > 0) {
                // Buat 10 transaksi dummy per merchant dengan tanggal berbeda (10 hari terakhir)
                for ($i = 0; $i < 10; $i++) {
                    $pelanggan = $pelanggans->random();
                    $menu = $merchant->menus->random();
                    $jumlah = rand(1, 3);
                    $subtotal = $menu->harga * $jumlah;
                    
                    // Generate tanggal dari 10 hari lalu hingga hari ini
                    $date = \Carbon\Carbon::now()->subDays(9 - $i);

                    $pesanan = \App\Models\Pesanan::create([
                        'pelanggan_id' => $pelanggan->id,
                        'merchant_id'  => $merchant->id,
                        'status'       => 'SELESAI',
                        'catatan'      => 'Pesanan dummy',
                        'nomor_meja'   => rand(1, 10),
                        'created_at'   => $date,
                        'updated_at'   => $date,
                    ]);

                    \App\Models\DetailPesanan::create([
                        'pesanan_id' => $pesanan->id,
                        'menu_id'    => $menu->id,
                        'jumlah'     => $jumlah,
                        'subtotal'   => $subtotal,
                        'created_at' => $date,
                        'updated_at' => $date,
                    ]);

                    \App\Models\Transaksi::create([
                        'pesanan_id'  => $pesanan->id,
                        'total_bayar' => $subtotal,
                        'metode_bayar'=> 'CASH',
                        'status_bayar'=> 'LUNAS',
                        'created_at'  => $date,
                        'updated_at'  => $date,
                    ]);
                }
            }
        }
    }
}
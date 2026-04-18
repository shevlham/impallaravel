<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Merchant;
use App\Models\Pelanggan;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // =====================
        // ADMIN
        // =====================
        $admin = User::create([
            'username' => 'admin',
            'password' => Hash::make('admin'),
            'role' => 'ADMIN'
        ]);

        Admin::create([
            'user_id' => $admin->id,
            'nama' => 'Admin Utama'
        ]);

        // =====================
        // MERCHANT
        // =====================
        $merchants = [
            'KATSUNA',
            'DFC',
            'SABANA',
            'BAKSO MIE AYAM MAS YONO',
            'MURAH ENAK'
        ];

        foreach ($merchants as $name) {
            $user = User::create([
                'username' => $name,
                'password' => Hash::make('merchant123'),
                'role' => 'MERCHANT'
            ]);

            Merchant::create([
                'user_id' => $user->id,
                'nama_merchant' => $name
            ]);
        }

        // =====================
        // PELANGGAN (20 ORANG)
        // =====================
        for ($i = 1; $i <= 20; $i++) {
            $user = User::create([
                'username' => 'pelanggan' . $i,
                'password' => Hash::make('pelanggan123'),
                'role' => 'PELANGGAN'
            ]);

            Pelanggan::create([
                'user_id' => $user->id,
                'nama' => 'Pelanggan ' . $i
            ]);
        }
    }
}
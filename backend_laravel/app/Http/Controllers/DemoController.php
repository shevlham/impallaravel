<?php

namespace App\Http\Controllers;

use App\Models\{Admin, Merchant, Pelanggan, Menu, Pesanan, Transaksi};

class DemoController extends Controller
{
    public function index()
    {
        $pelanggan = new Pelanggan();
        $pelanggan->username = "sheva123";

        return response()->json([
            "message" => "demo jalan"
        ]);
    }
}
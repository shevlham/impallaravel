<?php
// app/Http/Controllers/MenuController.php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Merchant;
use Illuminate\Http\Request;

class MenuController extends Controller
{

    public function index(Request $request)
    {
        $user = $request->user();
        $menus = Menu::with(['merchant' => function ($query) {
            $query->select('id', 'user_id', 'nama_merchant', 'status_toko')->with(['user:id,foto_profil']);
        }]);
        
        // TAMBAHKAN FILTER STATUS TOKO untuk pelanggan
        if (!$user || $user->role !== 'MERCHANT') {
            $menus = $menus->whereHas('merchant', function ($q) {
                $q->where('status_toko', 'BUKA');
            });
        }
        
        $menus = $menus->get();
        return response()->json(['success' => true, 'data' => $menus]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_menu' => 'required|string|min:3|max:100',
            'harga'     => 'required|numeric|min:1|max:999999999',
            'stok'      => 'required|integer|min:0|max:999999',
            'gambar'    => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'kategori'  => 'nullable|string',
        ]);

        $merchant = $request->user()->merchant;
        if (!$merchant) {
            return response()->json(['message' => 'Hanya merchant yang bisa menambah menu'], 403);
        }

        if ($request->hasFile('gambar')) {
            $result = cloudinary()->uploadApi()->upload($request->file('gambar')->getRealPath(), [
                'folder' => 'menu',
                'verify' => false
            ]);
            $path = $result['secure_url'];
        } else {
            $path = null;
        }

        $menu = Menu::create([
            'merchant_id' => $merchant->id,
            'nama_menu'   => $request->nama_menu,
            'harga'       => $request->harga,
            'stok'        => $request->stok,
            'gambar'      => $path,
            'kategori'    => $request->kategori ?? 'Lainnya',
        ]);

        return response()->json(['success' => true, 'data' => $menu], 201);
    }

    public function update(Request $request, $id)
    {
        $menu = Menu::findOrFail($id);
        $merchant = $request->user()->merchant;

        if (!$merchant || $menu->merchant_id !== $merchant->id) {
            return response()->json(['message' => 'Tidak diizinkan'], 403);
        }
        $request->validate([
            'nama_menu' => 'required|string|min:3|max:100',
            'harga'     => 'required|numeric|min:1|max:999999999',
            'stok'      => 'required|integer|min:0|max:999999',
            'gambar'    => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'kategori'  => 'nullable|string',
        ]);

        if ($request->hasFile('gambar')) {
            $result = cloudinary()->uploadApi()->upload($request->file('gambar')->getRealPath(), [
                'folder' => 'menu',
                'verify' => false
            ]);
            $menu->gambar = $result['secure_url'];
        }

        $menu->update($request->only(['nama_menu', 'harga', 'stok', 'kategori']));

        return response()->json(['success' => true, 'data' => $menu]);
    }

    public function destroy(Request $request, $id)
    {
        $menu = Menu::findOrFail($id);
        $merchant = $request->user()->merchant;

        if (!$merchant || $menu->merchant_id !== $merchant->id) {
            return response()->json(['message' => 'Tidak diizinkan'], 403);
        }

        $menu->delete();
        return response()->json(['message' => 'Menu dihapus']);
    }
}

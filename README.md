# TelEat - Sistem Pemesanan Makanan

TelEat adalah aplikasi berbasis web yang dirancang untuk mempermudah pemesanan makanan secara praktis (dine-in/take-away) di lingkungan kantin atau foodcourt. Aplikasi ini memisahkan peran pengguna menjadi tiga level utama: **Pelanggan** (melakukan pemesanan & pembayaran), **Merchant** (mengelola menu toko & menerima pesanan), dan **Admin** (mengelola master data user & konfirmasi pembayaran).

---

## 🛠️ Technology Stack & Library

### 1. Backend (Laravel API)
* **Core Framework:** Laravel v11.x (PHP ^8.2)
* **Autentikasi:** Laravel Sanctum (Token-based authentication)
* **Integrasi Pembayaran:** Midtrans Snap (QRIS, Bank Transfer, Virtual Account)
* **Media Upload:** Cloudinary API integration via `cloudinary-labs/cloudinary-laravel`
* **Dokumentasi API:** Swagger OpenAPI v3 via `darkaonline/l5-swagger`
* **Library Lain:**
  - `laravel/socialite` (OAuth Login Google)
  - `doctrine/dbal` (Mengubah properti kolom database)

### 2. Frontend (React Single Page Application)
* **Core Framework:** React.js (JavaScript ES6+)
* **Routing:** React Router DOM
* **Desain UI:** Vanilla CSS dengan kustomisasi tokens modern
* **HTTP Client:** Axios / standard fetch API untuk interaksi data

---

## 📁 Arsitektur & Struktur Folder

Proyek ini menggunakan struktur monorepo terpisah antara bagian backend dan frontend:

```text
TelEat_TubesIMPAL/
├── backend_laravel/          # Sektor Backend (Laravel API)
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/  # Logika API (Auth, Pesanan, Payment, dll)
│   │   ├── Models/           # Defini tabel & hubungan Eloquent Model
│   │   ├── Observers/        # Event listener database (e.g. TransaksiObserver)
│   │   └── Mail/             # Template logika pengiriman Mailable
│   ├── config/               # File konfigurasi sistem (termasuk l5-swagger.php)
│   ├── database/
│   │   ├── migrations/       # Skema database terstruktur
│   │   └── seeders/          # Dummy data awal (Admin, Merchant, Menu, Pelanggan)
│   └── routes/
│       └── api.php           # Deklarasi seluruh routing RESTful API
│
├── frontend_react/           # Sektor Frontend (React SPA)
│   ├── public/               # Asset statis publik
│   └── src/
│       ├── components/ui/    # Komponen visual reusable (Button, Modal, dll)
│       ├── contexts/         # Manajemen state global (AuthContext, ToastContext)
│       ├── pages/            # View/Halaman utama (MenuPage, AdminPage, dll)
│       ├── services/         # Integrasi API (axios wrapper)
│       └── styles/           # Sistem pewarnaan & layouting (tokens.js)
│
├── issue.md                  # Rencana pengembangan awal
└── README.md                 # Dokumentasi sistem (Dokumen Ini)
```

---

## 🗄️ Skema Database (Database Schema)

Database menggunakan relational DBMS (MySQL) dengan relasi sebagai berikut:

1. **`users`**: Menyimpan kredensial otentikasi utama.
   - Kolom: `id` (PK), `username`, `password`, `email` (NOT NULL, UNIQUE), `role` (ADMIN/MERCHANT/PELANGGAN), `google_id`, `foto_profil`.
2. **`admins`**: Profil data Admin.
   - Relasi: One-to-one ke `users.id` via `user_id`.
3. **`merchants`**: Profil toko/merchant penjual makanan.
   - Kolom: `id` (PK), `user_id` (FK), `nama_merchant`, `status_toko` (BUKA/TUTUP).
4. **`pelanggans`**: Profil pelanggan pembeli makanan.
   - Relasi: One-to-one ke `users.id` via `user_id`.
5. **`menus`**: Data menu makanan/minuman yang dijual.
   - Kolom: `id` (PK), `merchant_id` (FK), `nama_menu`, `harga`, `stok`, `kategori`, `gambar`.
6. **`pesanans`**: Transaksi pemesanan makanan.
   - Kolom: `id` (PK), `pelanggan_id` (FK), `merchant_id` (FK), `status` (PENDING/DIPROSES/SELESAI/BATAL), `catatan`, `nomor_meja`, `tipe_pemesanan` (DINE_IN/TAKE_AWAY).
7. **`detail_pesanans`**: Komposisi item makanan di dalam pesanan.
   - Kolom: `id` (PK), `pesanan_id` (FK), `menu_id` (FK), `jumlah`, `subtotal`.
8. **`transaksis`**: Data transaksi pembayaran atas pesanan.
   - Kolom: `transaksi_id` (PK), `pesanan_id` (FK, UNIQUE), `total_bayar`, `metode_bayar` (CASH/MIDTRANS), `status_bayar` (PENDING/LUNAS/BATAL).

---

## 🔌 Dokumentasi API (Swagger OpenAPI)

Seluruh endpoint API telah terdokumentasi menggunakan spesifikasi OpenAPI (Swagger).

* **URL Akses Swagger UI:** `http://localhost:8000/api/documentation`
* **Cara Mengakses Endpoint yang Dilindungi:**
  1. Lakukan request POST ke `/api/login` (atau `/api/register`).
  2. Salin nilai `token` dari response JSON.
  3. Buka halaman Swagger UI, klik tombol **Authorize** di sudut kanan atas.
  4. Tempel token tersebut dan klik Authorize.

---

## ⚙️ Cara Setup & Menjalankan Proyek

### Prasyarat:
Pastikan Anda sudah menginstal **PHP v8.2+**, **Composer**, **Node.js (LTS)**, dan **XAMPP / MySQL Server** lokal.

### Langkah Setup Backend (Laravel)
1. Buka terminal di folder `backend_laravel`.
2. Salin file environment:
   ```bash
   copy .env.example .env
   ```
3. Instal dependencies menggunakan Composer:
   ```bash
   composer install
   ```
4. Generate key aplikasi:
   ```bash
   php artisan key:generate
   ```
5. Buat database baru bernama `tubes_impal` di MySQL lokal (phpMyAdmin).
6. Konfigurasikan koneksi database, kredensial Mailer (SMTP / Log), Midtrans, dan Cloudinary Anda di file `.env`.
   - *Tip:* Jika tidak ingin mengirim email asli secara lokal, set `MAIL_MAILER=log` agar isi email tercetak di `storage/logs/laravel.log`.
7. Jalankan migrasi tabel beserta pengisian data dummy (seeding):
   ```bash
   php artisan migrate:fresh --seed
   ```
8. Jalankan worker antrean (queue) di terminal terpisah untuk memproses pengiriman email nota transaksi secara asinkron:
   ```bash
   php artisan queue:work
   ```
9. Jalankan server lokal Laravel:
   ```bash
   php artisan serve
   ```
   *(Server akan berjalan secara default di: `http://localhost:8000`)*

### Langkah Setup Frontend (React)
1. Buka terminal di folder `frontend_react`.
2. Instal dependencies menggunakan NPM:
   ```bash
   npm install
   ```
3. Jalankan server lokal React:
   ```bash
   npm start
   ```
   *(Aplikasi frontend akan terbuka secara otomatis di browser di: `http://localhost:3000`)*

---

## 🧪 Cara Menjalankan Uji Coba (Testing)

Untuk memastikan seluruh fungsi API berjalan dengan benar tanpa ada eror regresi:

1. Buka terminal di folder `backend_laravel`.
2. Jalankan perintah test bawaan Laravel:
   ```bash
   php artisan test
   ```

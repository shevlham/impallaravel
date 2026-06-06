<x-mail::message>
# Nota Transaksi TelEat

Halo **{{ $transaksi->pesanan->pelanggan->nama }}**,

Terima kasih telah melakukan pemesanan di **TelEat**! Pembayaran Anda telah kami terima dan terkonfirmasi **LUNAS**.

Berikut rincian nota transaksi Anda:

## Informasi Pesanan
* **ID Transaksi:** #{{ $transaksi->transaksi_id }}
* **ID Pesanan:** #{{ $transaksi->pesanan->id }}
* **Merchant:** {{ $transaksi->pesanan->merchant->nama_merchant }}
* **Tipe Pemesanan:** {{ $transaksi->pesanan->tipe_pemesanan === 'TAKE_AWAY' ? 'Take Away / Bungkus' : 'Dine In / Makan di tempat' }}
@if($transaksi->pesanan->nomor_meja)
* **Nomor Meja:** {{ $transaksi->pesanan->nomor_meja }}
@endif
* **Metode Pembayaran:** {{ $transaksi->metode_bayar }}
* **Tanggal:** {{ $transaksi->created_at->setTimezone('Asia/Jakarta')->format('d M Y H:i') }} WIB

<x-mail::table>
| Menu | Qty | Harga |
| :--- | :---: | :--- |
@foreach($transaksi->pesanan->details as $detail)
| {{ $detail->menu->nama_menu }} | {{ $detail->jumlah }}x | Rp{{ number_format($detail->subtotal, 0, ',', '.') }} |
@endforeach
| **Total Bayar** | | **Rp{{ number_format($transaksi->total_bayar, 0, ',', '.') }}** |
</x-mail::table>

@if($transaksi->pesanan->catatan)
> **Catatan Pesanan:**
> _{{ $transaksi->pesanan->catatan }}_
@endif

Pesanan Anda sedang diproses oleh Merchant. Silakan tunggu informasi selanjutnya.

Salam hangat,<br>
**Tim TelEat**
</x-mail::message>

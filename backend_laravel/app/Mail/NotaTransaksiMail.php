<?php

namespace App\Mail;

use App\Models\Transaksi;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NotaTransaksiMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $transaksi;

    /**
     * Create a new message instance.
     *
     * @param Transaksi $transaksi
     */
    public function __construct(Transaksi $transaksi)
    {
        $this->transaksi = $transaksi->load(['pesanan.pelanggan', 'pesanan.merchant', 'pesanan.details.menu']);
    }

    /**
     * Get the message envelope.
     *
     * @return Envelope
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Nota Transaksi #' . $this->transaksi->transaksi_id . ' - TelEat',
        );
    }

    /**
     * Get the message content definition.
     *
     * @return Content
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.nota.transaksi',
        );
    }
}

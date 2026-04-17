<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('transaksis', function (Blueprint $table) {
        $table->id('transaksi_id');
        $table->foreignId('pesanan_id')->unique()->constrained('pesanans');
        $table->double('total_bayar');
        $table->string('metode_bayar');
        $table->string('status_bayar')->default('PENDING');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksis');
    }
};

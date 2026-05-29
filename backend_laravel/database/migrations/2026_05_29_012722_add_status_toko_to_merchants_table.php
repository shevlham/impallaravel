<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('merchants', function (Blueprint $table) {
            $table->enum('status_toko', ['BUKA', 'TUTUP'])->default('BUKA')->after('nama_merchant');
        });
    }

    public function down()
    {
        Schema::table('merchants', function (Blueprint $table) {
            $table->dropColumn('status_toko');
        });
    }
};
<?php

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="TelEat API Documentation",
 *     version="1.0.0",
 *     description="Dokumentasi API untuk aplikasi pemesanan makanan TelEat (Laravel & React)",
 *     @OA\Contact(
 *         email="admin@teleat.com"
 *     )
 * )
 * @OA\Server(
 *     url="http://localhost:8000",
 *     description="Local Development Server"
 * )
 * @OA\SecurityScheme(
 *     securityScheme="sanctum",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="Gunakan token Sanctum (auth_token) hasil login untuk mengakses endpoint yang dilindungi"
 * )
 */
abstract class Controller
{
    //
}
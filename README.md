"# impallaravel" 
"# impallaravel" 

cara run local
1. git init di cmd folder yang diinginkan
2. git clone https://github.com/shevlham/TelEat_TubesIMPAL
3. copy .env.example .env (cmd backend)

cara migrate database dari laravel
1. start apache dan my sql di xampp
2. tekan admin pada my sql di xampp
3. tambahhkan database dengan nama "tubes_impal" pada tab phpmyadmin
4. buka cmd backend "php artisan php artisan migrate:fresh --seed"
5. struktur database otomatis terbentuk dan data dummy telah dimasukkan

cara run web local 
1. buka xampp
2. start apache dan my sql
3. buka cmd backend ("php artisan serve")
4. buka cmd frontend ("npm start")

untuk login user :
// admin
username : admin
password : admin
// pelanggan
pelanggan : (liat database)
password : pelanggan123
// merchant
merchant : (liat database)
password : merchant123
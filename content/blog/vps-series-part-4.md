---
title: "Belajar VPS dari Nol — Part 4: Deploy Laravel & CodeIgniter 3 ke VPS"
date: "Mar 23, 2026"
description: "Deploy Laravel dan CI 3 ke VPS"
---

> **Seri ini terdiri dari 6 part:**
>
> - Part 1 — Mengenal VPS ✅
> - Part 2 — Setup Server: Nginx, PHP Multi-versi & Node.js Multi-versi ✅
> - Part 3 — Setup MySQL: Database Production & Staging ✅
> - **Part 4** — Deploy Laravel & CodeIgniter 3 ke VPS _(kamu di sini)_
> - Part 5 — Deploy Express.js & Next.js + PM2
> - Part 6 — Keamanan VPS: Setup UFW Firewall

---

Ini dia part yang paling ditunggu-tunggu — kita akhirnya deploy aplikasi beneran ke VPS!

Di part ini kita akan deploy dua aplikasi PHP:

1. **Laravel** — di-upload manual via WinSCP, dengan port `8000` untuk production dan `8001` untuk staging
2. **CodeIgniter 3** — di-deploy via Git, branch `main` untuk production (port `8010`) dan branch `dev` untuk staging (port `8011`)

Di tengah-tengah, kita juga akan setup **SSH key** di VPS dan daftarkan sebagai deploy key di GitHub/GitLab — ini yang memungkinkan server bisa pull kode dari repository tanpa harus ketik password setiap saat.

Sebelum mulai, pastikan kamu sudah selesai di Part 3 dan punya database yang siap.

---

## 1. Siapkan Aplikasi Laravel Sederhana

Kita akan buat aplikasi Laravel super simple — sebuah **daftar catatan (notes)** dengan fitur tambah dan lihat catatan. Cukup untuk membuktikan bahwa deploy kita berhasil, database terhubung, dan semua berjalan normal.

### 1.1 Struktur Folder yang Penting untuk Deploy

Kamu tidak perlu upload seluruh isi folder Laravel — ada beberapa folder yang sebaiknya kamu pahami fungsinya:

```
laravel-notes/
├── app/                  # Logic aplikasi (Model, Controller, dll)
├── bootstrap/
│   └── cache/            # ⚠️ Harus bisa ditulis oleh web server
├── config/               # File konfigurasi
├── database/
│   ├── migrations/       # File migration database
│   └── seeders/          # File seeder
├── public/               # ← Ini yang di-point oleh Nginx! (index.php ada di sini)
├── resources/            # View, CSS, JS
├── routes/               # Definisi route
├── storage/              # ⚠️ Harus bisa ditulis oleh web server (log, cache, upload)
│   ├── app/
│   ├── framework/
│   └── logs/
├── vendor/               # Dependencies dari Composer (jangan di-upload, install di server)
├── .env                  # ⚠️ Konfigurasi environment — JANGAN masuk ke Git
├── .env.example          # Template .env (ini boleh masuk Git)
├── composer.json         # Daftar dependencies
└── artisan               # CLI tool Laravel
```

**Tiga hal penting yang perlu diingat:**

- Folder `vendor/` tidak perlu diupload — kita akan install dependencies langsung di server menggunakan Composer
- File `.env` berisi credential sensitif — jangan pernah di-commit ke Git
- Nginx harus di-point ke folder `public/`, bukan ke root project

### 1.2 Buat Aplikasi Laravel Baru di Laptop

Buat dulu di laptop kamu:

```bash
# Buat project Laravel baru
composer create-project laravel/laravel laravel-notes

# Masuk ke folder project
cd laravel-notes
```

**Buat Migration untuk tabel notes:**

```bash
php artisan make:migration create_notes_table
```

Buka file migration yang baru dibuat di `database/migrations/xxxx_create_notes_table.php` dan edit:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
```

**Buat Model dan Controller:**

```bash
php artisan make:model Note
php artisan make:controller NoteController
```

Edit `app/Models/Note.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    protected $fillable = ['title', 'body'];
}
```

Edit `app/Http/Controllers/NoteController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index()
    {
        $notes = Note::latest()->get();
        return view('notes.index', compact('notes'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|max:255',
            'body'  => 'required',
        ]);

        Note::create($request->only('title', 'body'));

        return redirect('/')->with('success', 'Catatan berhasil disimpan!');
    }
}
```

**Buat route di `routes/web.php`:**

```php
<?php

use App\Http\Controllers\NoteController;
use Illuminate\Support\Facades\Route;

Route::get('/', [NoteController::class, 'index']);
Route::post('/notes', [NoteController::class, 'store']);
```

**Buat view di `resources/views/notes/index.blade.php`:**

```bash
mkdir -p resources/views/notes
```

```html
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Laravel Notes — {{ config('app.name') }}</title>
    <style>
      body { font-family: sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; }
      .env-badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 12px;
                   background: {{ app()->environment('production') ? '#e74c3c' : '#2ecc71' }};
                   color: white; margin-left: 8px; }
      form { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
      input, textarea { width: 100%; padding: 8px; margin: 6px 0 14px; box-sizing: border-box; border: 1px solid #ddd; border-radius: 4px; }
      button { background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
      .note { border: 1px solid #e0e0e0; padding: 16px; border-radius: 8px; margin-bottom: 12px; }
      .alert { background: #d4edda; color: #155724; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px; }
    </style>
  </head>
  <body>
    <h1>
      📝 Laravel Notes
      <span class="env-badge">{{ strtoupper(app()->environment()) }}</span>
    </h1>

    @if(session('success'))
    <div class="alert">{{ session('success') }}</div>
    @endif

    <form action="/notes" method="POST">
      @csrf
      <label>Judul</label>
      <input type="text" name="title" placeholder="Judul catatan..." required />
      <label>Isi Catatan</label>
      <textarea
        name="body"
        rows="4"
        placeholder="Tulis catatanmu di sini..."
        required
      ></textarea>
      <button type="submit">Simpan Catatan</button>
    </form>

    @forelse($notes as $note)
    <div class="note">
      <strong>{{ $note->title }}</strong>
      <p>{{ $note->body }}</p>
      <small style="color: #999"
        >{{ $note->created_at->diffForHumans() }}</small
      >
    </div>
    @empty
    <p style="color: #999">Belum ada catatan. Yuk tambahkan!</p>
    @endforelse
  </body>
</html>
```

**Buat Seeder:**

```bash
php artisan make:seeder NoteSeeder
```

Edit `database/seeders/NoteSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\Note;
use Illuminate\Database\Seeder;

class NoteSeeder extends Seeder
{
    public function run(): void
    {
        Note::insert([
            [
                'title'      => 'Catatan Pertama',
                'body'       => 'Ini adalah catatan pertama yang dibuat via seeder.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title'      => 'Belajar VPS',
                'body'       => 'Hari ini belajar cara deploy Laravel ke VPS. Seru banget!',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
```

Edit `database/seeders/DatabaseSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            NoteSeeder::class,
        ]);
    }
}
```

**Pastikan file `.gitignore` sudah mengabaikan `.env` dan `vendor/`:**

```bash
cat .gitignore | grep -E "^\.env$|^/vendor/"
```

Kalau tidak muncul, tambahkan manual ke `.gitignore`:

```
.env
/vendor/
```

Sekarang project Laravel kita siap untuk di-upload ke VPS.

---

## 2. Deploy Laravel ke VPS Menggunakan WinSCP

### 2.1 Apa Itu WinSCP?

**WinSCP** adalah aplikasi Windows untuk transfer file ke/dari server Linux via protokol SFTP atau SCP. Ini seperti "Windows Explorer" tapi untuk server remote. Kamu bisa drag-and-drop file dari laptop ke VPS dengan mudah.

Download WinSCP di [winscp.net](https://winscp.net) dan install.

### 2.2 Connect ke VPS via WinSCP

Buka WinSCP, lalu isi detail koneksi:

- **File protocol**: SFTP
- **Host name**: IP publik VPS kamu (contoh: `123.456.789.0`)
- **Port number**: `22`
- **User name**: `root` (atau user Linux yang kamu pakai)
- **Password**: password SSH VPS kamu

Klik **Login**. Kalau berhasil, kamu akan melihat dua panel:

- Panel kiri: file di laptop kamu
- Panel kanan: file di VPS

### 2.3 Buat Folder untuk Aplikasi di VPS

Sebelum upload, buat dulu folder tujuan di VPS. Buka terminal SSH dan jalankan:

```bash
# Buat folder untuk semua aplikasi web
mkdir -p /var/www/laravel-notes-production
mkdir -p /var/www/laravel-notes-staging

# Set ownership ke www-data (user yang dipakai Nginx)
chown -R www-data:www-data /var/www/laravel-notes-production
chown -R www-data:www-data /var/www/laravel-notes-staging
```

### 2.4 Upload File Project via WinSCP

Di WinSCP:

1. Di panel kiri, navigasi ke folder project Laravel kamu di laptop
2. Di panel kanan, navigasi ke `/var/www/laravel-notes-production`
3. Pilih semua file dan folder project Laravel kamu **(kecuali folder `vendor/`)**
4. Drag ke panel kanan atau tekan `F5` untuk copy

> **Kenapa tidak upload `vendor/`?**
> Folder `vendor/` berisi ratusan ribu file kecil — proses uploadnya akan sangat lama. Lebih efisien untuk install dependencies langsung di server menggunakan Composer. Hasilnya sama saja.

Ulangi untuk folder staging — upload file yang sama ke `/var/www/laravel-notes-staging`.

### 2.5 Install Dependencies dengan Composer di Server

Kembali ke terminal SSH:

```bash
# Masuk ke folder production
cd /var/www/laravel-notes-production

# Install dependencies (--no-dev untuk production: skip package yang hanya dibutuhkan saat development)
composer install --no-dev --optimize-autoloader

# Untuk staging, kita install semua termasuk dev dependencies
cd /var/www/laravel-notes-staging
composer install --optimize-autoloader
```

### 2.6 Buat File .env untuk Production

```bash
cd /var/www/laravel-notes-production

# Salin dari template
cp .env.example .env
```

Edit file `.env`:

```bash
nano .env
```

Ubah bagian-bagian berikut:

```env
APP_NAME="Laravel Notes"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://123.456.789.0:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel_production
DB_USERNAME=appuser
DB_PASSWORD=password_kuat_di_sini
```

Simpan dengan `Ctrl+X` → `Y` → `Enter`.

### 2.7 Buat File .env untuk Staging

```bash
cd /var/www/laravel-notes-staging
cp .env.example .env
nano .env
```

```env
APP_NAME="Laravel Notes"
APP_ENV=staging
APP_KEY=
APP_DEBUG=true
APP_URL=http://123.456.789.0:8001

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel_staging
DB_USERNAME=appuser
DB_PASSWORD=password_kuat_di_sini
```

### 2.8 Generate APP_KEY

Laravel butuh `APP_KEY` untuk enkripsi. Generate untuk masing-masing environment:

```bash
# Generate untuk production
cd /var/www/laravel-notes-production
php artisan key:generate

# Generate untuk staging
cd /var/www/laravel-notes-staging
php artisan key:generate
```

Cek file `.env` — sekarang `APP_KEY` sudah terisi otomatis.

### 2.9 Set Permission yang Benar

Ini langkah yang **sering dilupakan** dan menyebabkan error "Permission denied" di Laravel:

```bash
# Set permission untuk production
cd /var/www/laravel-notes-production

# Ownership ke www-data
chown -R www-data:www-data .

# Folder storage dan bootstrap/cache harus bisa ditulis
chmod -R 775 storage
chmod -R 775 bootstrap/cache

# Ulangi untuk staging
cd /var/www/laravel-notes-staging
chown -R www-data:www-data .
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

---

## 3. Setup Nginx untuk Laravel

### 3.1 Konfigurasi Nginx untuk Laravel Production (Port 8000)

```bash
nano /etc/nginx/sites-available/laravel-production
```

Isi dengan konfigurasi berikut:

```nginx
server {
    listen 8000;
    server_name _;

    root /var/www/laravel-notes-production/public;
    index index.php index.html;

    # Aktifkan logging
    access_log /var/log/nginx/laravel-production.access.log;
    error_log  /var/log/nginx/laravel-production.error.log;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass   unix:/run/php/php8.2-fpm.sock;
        fastcgi_index  index.php;
        include        fastcgi_params;
        fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### 3.2 Konfigurasi Nginx untuk Laravel Staging (Port 8001)

```bash
nano /etc/nginx/sites-available/laravel-staging
```

```nginx
server {
    listen 8001;
    server_name _;

    root /var/www/laravel-notes-staging/public;
    index index.php index.html;

    access_log /var/log/nginx/laravel-staging.access.log;
    error_log  /var/log/nginx/laravel-staging.error.log;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass   unix:/run/php/php8.2-fpm.sock;
        fastcgi_index  index.php;
        include        fastcgi_params;
        fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### 3.3 Aktifkan Konfigurasi

```bash
# Buat symlink untuk mengaktifkan kedua konfigurasi
ln -s /etc/nginx/sites-available/laravel-production /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/laravel-staging    /etc/nginx/sites-enabled/

# Test konfigurasi — pastikan tidak ada error
nginx -t

# Kalau OK, reload Nginx
systemctl reload nginx
```

### 3.4 Jalankan Migration dan Seeder

```bash
# Migration dan seeder untuk production
cd /var/www/laravel-notes-production
php artisan migrate --force
php artisan db:seed --force

# Migration dan seeder untuk staging
cd /var/www/laravel-notes-staging
php artisan migrate --force
php artisan db:seed --force
```

> **Kenapa pakai `--force`?**
> Secara default, Laravel tidak mau jalankan migration di environment production tanpa konfirmasi interaktif. Flag `--force` men-skip konfirmasi itu. Ini aman karena kita memang sengaja menjalankannya.

### 3.5 Optimize Laravel untuk Production

```bash
cd /var/www/laravel-notes-production

# Cache konfigurasi (biar tidak perlu baca file config setiap request)
php artisan config:cache

# Cache route
php artisan route:cache

# Cache view
php artisan view:cache
```

> **Catatan:** Jangan jalankan perintah cache ini di staging kalau kamu masih aktif development — setiap kali ada perubahan, kamu harus clear cache lagi. Di staging, ini opsional.

### 3.6 Test Aplikasi

Buka browser dan akses:

- **Production**: `http://IP-VPS-kamu:8000`
- **Staging**: `http://IP-VPS-kamu:8001`

Kamu akan melihat halaman aplikasi Laravel Notes. Perhatikan badge di sebelah judul — production menampilkan badge merah "PRODUCTION", staging menampilkan badge hijau "STAGING". Ini membantu memastikan kamu mengakses environment yang benar.

---

## 4. Setup SSH Key dan Deploy Key GitHub/GitLab

Sebelum deploy CodeIgniter 3 via Git, kita perlu setup SSH key dulu. SSH key adalah cara autentikasi yang lebih aman dan nyaman daripada password — server kamu bisa "buktikan identitasnya" ke GitHub/GitLab tanpa harus ketik password setiap pull.

### 4.1 Generate SSH Key di VPS

```bash
# Generate SSH key baru (ED25519 adalah algoritma modern yang direkomendasikan)
# Ganti email dengan email GitHub/GitLab kamu
ssh-keygen -t ed25519 -C "email@kamu.com" -f ~/.ssh/id_ed25519_deploy

# Kamu akan ditanya passphrase — tekan Enter dua kali untuk tidak pakai passphrase
# (Untuk deploy key di server, lebih praktis tanpa passphrase)
```

Perintah ini membuat dua file:

- `~/.ssh/id_ed25519_deploy` — **private key** (jaga ini seperti password, jangan pernah dibagikan)
- `~/.ssh/id_ed25519_deploy.pub` — **public key** (ini yang kita daftarkan ke GitHub/GitLab)

### 4.2 Lihat Public Key

```bash
cat ~/.ssh/id_ed25519_deploy.pub
```

Outputnya akan terlihat seperti ini:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBvQ8... email@kamu.com
```

Copy seluruh teks ini — kita akan paste ke GitHub/GitLab.

### 4.3 Daftarkan sebagai Deploy Key di GitHub

1. Buka repository kamu di GitHub
2. Klik **Settings** → **Deploy keys** → **Add deploy key**
3. Isi **Title**: `VPS Deploy Key`
4. Paste public key tadi ke kolom **Key**
5. Centang **Allow write access** kalau kamu butuh push dari server (biasanya tidak perlu — centang jika diperlukan)
6. Klik **Add key**

**Untuk GitLab:**

1. Buka repository → **Settings** → **Repository** → **Deploy keys**
2. Klik **Add new deploy key**
3. Isi nama dan paste public key
4. Klik **Add key**

### 4.4 Konfigurasi SSH agar Pakai Key yang Benar

```bash
nano ~/.ssh/config
```

Tambahkan konfigurasi berikut:

```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_deploy

Host gitlab.com
    HostName gitlab.com
    User git
    IdentityFile ~/.ssh/id_ed25519_deploy
```

Simpan file, lalu set permission yang benar:

```bash
chmod 600 ~/.ssh/config
```

### 4.5 Test Koneksi

```bash
# Test koneksi ke GitHub
ssh -T git@github.com

# Test koneksi ke GitLab
ssh -T git@gitlab.com
```

Kalau berhasil, GitHub akan balas dengan:

```
Hi username/repo-name! You've successfully authenticated, but GitHub does not provide shell access.
```

---

## 5. Deploy CodeIgniter 3 via Git

### 5.1 Buat Aplikasi CodeIgniter 3 Sederhana

Kita buat aplikasi CI3 super simple — **buku tamu (guestbook)**. Pengguna bisa tulis nama dan pesan, lalu melihat daftar pesan yang masuk.

Buat dulu di laptop kamu. Download CodeIgniter 3 dari [codeigniter.com](https://codeigniter.com/download) atau clone dari GitHub, lalu setup struktur berikut:

**Buat database migration — karena CI3 tidak punya built-in migration, kita buat file SQL:**

Buat file `database.sql` di root project:

```sql
CREATE TABLE IF NOT EXISTS `guests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `guests` (`name`, `message`) VALUES
('Budi Santoso', 'Halo semua! Ini pesan pertama di buku tamu.'),
('Ani Rahayu', 'Selamat datang di aplikasi CI3 kita!');
```

**Edit `application/config/database.php`:**

Kita akan pakai environment variable sederhana melalui deteksi hostname. Cara yang lebih bersih adalah dengan file `.env` — tapi karena CI3 tidak punya support `.env` native, kita akan gunakan pendekatan config file terpisah.

Buat dua file config database — satu untuk production, satu untuk staging:

Buat `application/config/database.production.php`:

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$active_group = 'default';
$query_builder = TRUE;

$db['default'] = array(
    'dsn'      => '',
    'hostname' => '127.0.0.1',
    'username' => 'appuser',
    'password' => 'password_kuat_di_sini',
    'database' => 'ci3_production',
    'dbdriver' => 'mysqli',
    'dbprefix' => '',
    'pconnect' => FALSE,
    'db_debug' => FALSE,
    'cache_on'  => FALSE,
    'cachedir'  => '',
    'char_set'  => 'utf8mb4',
    'dbcollat'  => 'utf8mb4_unicode_ci',
);
```

Buat `application/config/database.staging.php` dengan isi yang sama tapi:

- `'database' => 'ci3_staging'`
- `'db_debug' => TRUE`

Edit `application/config/database.php` untuk auto-detect environment:

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

// Auto-detect environment dari file .env-flag
$env = file_exists(APPPATH . 'config/.env-flag')
    ? trim(file_get_contents(APPPATH . 'config/.env-flag'))
    : 'production';

require_once APPPATH . 'config/database.' . $env . '.php';
```

> **Penjelasan:** Kita akan buat file kecil bernama `.env-flag` di server yang isinya hanya satu kata: `production` atau `staging`. File ini tidak di-commit ke Git — jadi setiap environment bisa punya konfigurasi berbeda. Ini adalah cara praktis untuk CI3 yang tidak punya sistem `.env` bawaan.

**Tambahkan ke `.gitignore`:**

```
application/config/.env-flag
application/config/database.production.php
application/config/database.staging.php
```

**Edit `application/controllers/Welcome.php`:**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Welcome extends CI_Controller {

    public function index()
    {
        $this->load->database();
        $query = $this->db->order_by('created_at', 'DESC')->get('guests');
        $data['guests'] = $query->result();
        $data['env'] = file_exists(APPPATH . 'config/.env-flag')
            ? trim(file_get_contents(APPPATH . 'config/.env-flag'))
            : 'production';
        $this->load->view('welcome_message', $data);
    }

    public function store()
    {
        $this->load->database();
        $this->load->helper('security');

        $data = [
            'name'    => $this->input->post('name', TRUE),
            'message' => $this->input->post('message', TRUE),
        ];

        $this->db->insert('guests', $data);
        redirect('/');
    }
}
```

**Edit `application/views/welcome_message.php`:**

```html
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <title>CI3 Guestbook</title>
    <style>
      body { font-family: sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; }
      .env-badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 12px;
                   background: <?= $env === 'production' ? '#e74c3c' : '#2ecc71' ?>; color: white; margin-left: 8px; }
      form { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
      input, textarea { width: 100%; padding: 8px; margin: 6px 0 14px; box-sizing: border-box; border: 1px solid #ddd; border-radius: 4px; }
      button { background: #e67e22; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
      .guest { border: 1px solid #e0e0e0; padding: 16px; border-radius: 8px; margin-bottom: 12px; }
    </style>
  </head>
  <body>
    <h1>
      📖 CI3 Guestbook
      <span class="env-badge"><?= strtoupper($env) ?></span>
    </h1>

    <form action="<?= base_url('welcome/store') ?>" method="POST">
      <label>Nama</label>
      <input type="text" name="name" placeholder="Nama kamu..." required />
      <label>Pesan</label>
      <textarea
        name="message"
        rows="3"
        placeholder="Tulis pesanmu..."
        required
      ></textarea>
      <button type="submit">Kirim Pesan</button>
    </form>

    <?php if (empty($guests)): ?>
    <p style="color: #999">Belum ada pesan. Jadilah yang pertama!</p>
    <?php else: ?> <?php foreach ($guests as $guest): ?>
    <div class="guest">
      <strong><?= htmlspecialchars($guest->name) ?></strong>
      <p><?= htmlspecialchars($guest->message) ?></p>
      <small style="color: #999"><?= $guest->created_at ?></small>
    </div>
    <?php endforeach; ?> <?php endif; ?>
  </body>
</html>
```

**Edit `application/config/config.php`** — set base URL ke kosong agar dinamis:

```php
$config['base_url'] = '';
```

**Edit `application/config/routes.php`:**

```php
$route['default_controller'] = 'welcome';
$route['welcome/store'] = 'welcome/store';
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;
```

### 5.2 Push ke GitHub/GitLab

Dari laptop kamu:

```bash
cd ci3-guestbook

# Inisialisasi Git
git init

# Tambahkan remote repository (ganti dengan URL repo kamu)
git remote add origin git@github.com:username/ci3-guestbook.git

# Commit semua file
git add .
git commit -m "Initial commit: CI3 Guestbook"

# Push ke branch main (untuk production)
git push -u origin main

# Buat dan push branch dev (untuk staging)
git checkout -b dev
git push -u origin dev
```

### 5.3 Clone Repository ke VPS

Kembali ke terminal SSH VPS:

```bash
# Clone untuk production (dari branch main)
git clone -b main git@github.com:username/ci3-guestbook.git /var/www/ci3-guestbook-production

# Clone untuk staging (dari branch dev)
git clone -b dev git@github.com:username/ci3-guestbook.git /var/www/ci3-guestbook-staging
```

### 5.4 Setup File Konfigurasi di Server

**Untuk production:**

```bash
cd /var/www/ci3-guestbook-production

# Buat file env-flag
echo "production" > application/config/.env-flag

# Buat file database config untuk production
cat > application/config/database.production.php << 'EOF'
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$active_group = 'default';
$query_builder = TRUE;

$db['default'] = array(
    'dsn'      => '',
    'hostname' => '127.0.0.1',
    'username' => 'appuser',
    'password' => 'password_kuat_di_sini',
    'database' => 'ci3_production',
    'dbdriver' => 'mysqli',
    'dbprefix' => '',
    'pconnect' => FALSE,
    'db_debug' => FALSE,
    'cache_on'  => FALSE,
    'cachedir'  => '',
    'char_set'  => 'utf8mb4',
    'dbcollat'  => 'utf8mb4_unicode_ci',
);
EOF
```

**Untuk staging:**

```bash
cd /var/www/ci3-guestbook-staging

echo "staging" > application/config/.env-flag

cat > application/config/database.staging.php << 'EOF'
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$active_group = 'default';
$query_builder = TRUE;

$db['default'] = array(
    'dsn'      => '',
    'hostname' => '127.0.0.1',
    'username' => 'appuser',
    'password' => 'password_kuat_di_sini',
    'database' => 'ci3_staging',
    'dbdriver' => 'mysqli',
    'dbprefix' => '',
    'pconnect' => FALSE,
    'db_debug' => TRUE,
    'cache_on'  => FALSE,
    'cachedir'  => '',
    'char_set'  => 'utf8mb4',
    'dbcollat'  => 'utf8mb4_unicode_ci',
);
EOF
```

### 5.5 Import Database

```bash
# Import database untuk production
mysql -u appuser -p ci3_production < /var/www/ci3-guestbook-production/database.sql

# Import database untuk staging
mysql -u appuser -p ci3_staging < /var/www/ci3-guestbook-staging/database.sql
```

### 5.6 Set Permission

```bash
# Production
chown -R www-data:www-data /var/www/ci3-guestbook-production
chmod -R 755 /var/www/ci3-guestbook-production
chmod -R 775 /var/www/ci3-guestbook-production/application/cache
chmod -R 775 /var/www/ci3-guestbook-production/application/logs

# Staging
chown -R www-data:www-data /var/www/ci3-guestbook-staging
chmod -R 755 /var/www/ci3-guestbook-staging
chmod -R 775 /var/www/ci3-guestbook-staging/application/cache
chmod -R 775 /var/www/ci3-guestbook-staging/application/logs
```

### 5.7 Setup Nginx untuk CodeIgniter 3

**Production (port 8010):**

```bash
nano /etc/nginx/sites-available/ci3-production
```

```nginx
server {
    listen 8010;
    server_name _;

    root /var/www/ci3-guestbook-production;
    index index.php index.html;

    access_log /var/log/nginx/ci3-production.access.log;
    error_log  /var/log/nginx/ci3-production.error.log;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Blok akses ke folder sensitif CI3
    location ~ ^/(application|system|\.git) {
        deny all;
        return 403;
    }

    location ~ \.php$ {
        fastcgi_pass   unix:/run/php/php7.4-fpm.sock;
        fastcgi_index  index.php;
        include        fastcgi_params;
        fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

> **Perhatikan:** CI3 menggunakan `php7.4-fpm.sock` — kita sengaja pakai PHP 7.4 di sini untuk simulasi skenario nyata di mana aplikasi lama butuh PHP versi lama.

**Staging (port 8011):**

```bash
nano /etc/nginx/sites-available/ci3-staging
```

```nginx
server {
    listen 8011;
    server_name _;

    root /var/www/ci3-guestbook-staging;
    index index.php index.html;

    access_log /var/log/nginx/ci3-staging.access.log;
    error_log  /var/log/nginx/ci3-staging.error.log;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ ^/(application|system|\.git) {
        deny all;
        return 403;
    }

    location ~ \.php$ {
        fastcgi_pass   unix:/run/php/php7.4-fpm.sock;
        fastcgi_index  index.php;
        include        fastcgi_params;
        fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

**Aktifkan dan reload:**

```bash
ln -s /etc/nginx/sites-available/ci3-production /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/ci3-staging    /etc/nginx/sites-enabled/

nginx -t
systemctl reload nginx
```

### 5.8 Test Aplikasi CI3

Buka browser:

- **Production**: `http://IP-VPS-kamu:8010`
- **Staging**: `http://IP-VPS-kamu:8011`

Kamu akan melihat halaman CI3 Guestbook dengan badge environment yang sesuai.

### 5.9 Update Aplikasi CI3 di kemudian hari

Ini alur yang akan kamu pakai setiap kali ada update kode:

```bash
# Update production (ambil dari branch main)
cd /var/www/ci3-guestbook-production
git pull origin main

# Update staging (ambil dari branch dev)
cd /var/www/ci3-guestbook-staging
git pull origin dev
```

Sesimpel itu! Bandingkan dengan deploy manual via WinSCP — Git jauh lebih efisien untuk workflow yang berulang.

---

## Rangkuman Port yang Dipakai

| Aplikasi      | Environment | Port   |
| ------------- | ----------- | ------ |
| Laravel Notes | Production  | `8000` |
| Laravel Notes | Staging     | `8001` |
| CI3 Guestbook | Production  | `8010` |
| CI3 Guestbook | Staging     | `8011` |

---

## Troubleshooting Umum

### Laravel: "No application encryption key has been specified"

```bash
cd /var/www/laravel-notes-production
php artisan key:generate
```

### Laravel: "Permission denied" di storage atau bootstrap/cache

```bash
chown -R www-data:www-data /var/www/laravel-notes-production
chmod -R 775 /var/www/laravel-notes-production/storage
chmod -R 775 /var/www/laravel-notes-production/bootstrap/cache
```

### Laravel: Halaman tampil tapi CSS/JS tidak muncul (404)

Pastikan `root` di Nginx mengarah ke folder `public/`, bukan root project.

### CI3: "Unable to connect to your database server"

```bash
# Cek isi file env-flag
cat /var/www/ci3-guestbook-production/application/config/.env-flag

# Cek file database config yang sesuai sudah ada
ls /var/www/ci3-guestbook-production/application/config/database.production.php
```

### CI3: "403 Forbidden" untuk semua halaman

Cek permission — pastikan `www-data` punya akses baca ke folder project:

```bash
chown -R www-data:www-data /var/www/ci3-guestbook-production
```

### Git: "Permission denied (publickey)"

```bash
# Pastikan SSH key sudah terdaftar di ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_deploy

# Test koneksi lagi
ssh -T git@github.com
```

---

## Rangkuman Part 4

Di part ini kita sudah:

- ✅ Membuat aplikasi **Laravel Notes** dan deploy ke VPS via WinSCP
- ✅ Setup Nginx untuk Laravel production (port `8000`) dan staging (port `8001`)
- ✅ Konfigurasi database production dan staging di Laravel, jalankan migration dan seeder
- ✅ Generate **SSH key** di VPS dan daftarkan sebagai deploy key di GitHub/GitLab
- ✅ Membuat aplikasi **CI3 Guestbook** dan deploy via Git menggunakan branch `main` untuk production dan `dev` untuk staging
- ✅ Setup Nginx untuk CI3 production (port `8010`) dan staging (port `8011`)

Server kita sekarang sudah menjalankan **4 aplikasi sekaligus** di port yang berbeda!

---

## Selanjutnya: Part 5 — Deploy Express.js & Next.js + PM2

Di **Part 5**, kita beralih ke dunia Node.js. Kita akan:

1. Deploy aplikasi **Express.js** sebagai REST API sederhana
2. Deploy aplikasi **Next.js App Router**
3. Setup **Nginx sebagai reverse proxy** untuk kedua aplikasi tersebut
4. Pakai **PM2** agar aplikasi Node.js tetap jalan meski terminal ditutup atau server reboot

Sampai ketemu di Part 5! 🚀

---

_Deploy pertama memang terasa banyak langkahnya. Tapi setelah sekali berhasil, kamu akan lihat polanya selalu sama — buat config Nginx, set permission, jalankan migration. Setelah itu jadi hafal di luar kepala._

---
title: "Belajar VPS dari Nol — Part 2: Setup Server, Nginx, PHP Multi-versi & Node.js Multi-versi"
date: "Mar 23, 2026"
description: "Setup Nginx, PHP dan Node.js di VPS"
---

> **Seri ini terdiri dari 6 part:**
>
> - Part 1 — Mengenal VPS ✅
> - **Part 2** — Setup Server: Nginx, PHP Multi-versi & Node.js Multi-versi _(kamu di sini)_
> - Part 3 — Setup MySQL: Database Production & Staging
> - Part 4 — Deploy Laravel & CodeIgniter 3 ke VPS
> - Part 5 — Deploy Express.js & Next.js + PM2
> - Part 6 — Keamanan VPS: Setup UFW Firewall

---

Halo lagi! Kalau kamu sudah baca Part 1, sekarang kamu sudah paham apa itu VPS, bisa SSH ke server, dan familiar dengan perintah Linux dasar. Bagus banget.

Sekarang kita mulai yang seru — **setup server**. Di part ini, kita akan install dan konfigurasi tiga hal besar:

1. **Nginx** — web server yang akan jadi "pintu depan" semua aplikasi kita
2. **PHP 7.4 dan PHP 8.2** — dua versi PHP sekaligus di satu server
3. **Node.js versi LTS dan versi 20** — dua versi Node.js yang bisa dipakai bergantian

Sebelum mulai, pastikan kamu sudah SSH ke VPS dan jalankan update dulu:

```bash
apt update && apt upgrade -y
```

Oke, kita mulai!

---

## 1. Nginx — Web Server Pilihan Kita

### 1.1 Apa Itu Nginx dan Kenapa Kita Pakai Ini?

**Nginx** (dibaca "engine-x") adalah web server yang tugasnya menerima request dari browser atau client, lalu meneruskan ke aplikasi yang tepat. Bayangkan Nginx seperti **resepsionis di kantor besar** — semua tamu (request) datang ke resepsionis dulu, lalu diarahkan ke ruangan (aplikasi) yang sesuai.

Kenapa Nginx, bukan yang lain?

- **Ringan dan cepat** — Nginx sangat efisien dalam menangani banyak koneksi sekaligus
- **Populer** — banyak tutorial, dokumentasi, dan komunitas yang besar
- **Fleksibel** — bisa jadi web server biasa, reverse proxy, load balancer, semuanya
- **Lebih efisien dari Apache** untuk traffic tinggi — ini salah satu alasan banyak perusahaan migrasi dari Apache ke Nginx

Di seri ini, Nginx akan kita pakai untuk dua tujuan:

1. **Serve aplikasi PHP** (Laravel, CodeIgniter) langsung
2. **Reverse proxy** untuk aplikasi Node.js (Express, Next.js) — artinya Nginx yang nerima request, lalu forward ke aplikasi Node.js yang jalan di port tertentu

### 1.2 Install Nginx

```bash
# Update daftar paket terlebih dahulu
apt update

# Install Nginx
apt install nginx -y
```

Setelah install, Nginx langsung jalan otomatis. Coba buka browser dan akses `http://IP-VPS-kamu` — kalau muncul halaman "Welcome to nginx!", berarti berhasil!

### 1.3 Start, Stop, Restart, dan Reload Nginx

Ini adalah perintah yang akan sering banget kamu pakai:

```bash
# Cek status Nginx (jalan atau tidak, ada error atau tidak)
systemctl status nginx

# Start Nginx (jalankan kalau belum jalan)
systemctl start nginx

# Stop Nginx (matikan)
systemctl stop nginx

# Restart Nginx (matikan lalu jalankan ulang — koneksi yang sedang berjalan akan terputus sebentar)
systemctl restart nginx

# Reload Nginx (muat ulang konfigurasi TANPA memutus koneksi yang sedang berjalan)
systemctl reload nginx

# Pastikan Nginx otomatis jalan setelah server reboot
systemctl enable nginx
```

> **Kapan pakai `restart` vs `reload`?**
> Pakai `reload` kalau kamu hanya mengubah konfigurasi Nginx. Ini lebih baik karena tidak memutus koneksi yang sedang aktif. Pakai `restart` kalau ada perubahan yang lebih fundamental, atau kalau `reload` tidak berhasil.

### 1.4 Struktur Folder Nginx yang Penting

Ini adalah folder-folder yang akan sering kamu kunjungi:

```
/etc/nginx/
├── nginx.conf              # Konfigurasi utama Nginx
├── sites-available/        # Semua konfigurasi virtual host tersimpan di sini
│   └── default             # Konfigurasi default bawaan Nginx
└── sites-enabled/          # Konfigurasi yang AKTIF (biasanya symlink ke sites-available)
    └── default -> ../sites-available/default
```

```
/var/www/
└── html/                   # Folder default untuk file web
    └── index.nginx-debian.html   # Halaman "Welcome to nginx!" yang tadi kamu lihat
```

```
/var/log/nginx/
├── access.log              # Log semua request yang masuk
└── error.log               # Log semua error
```

**Cara kerja `sites-available` dan `sites-enabled`:**

- `sites-available` adalah **gudang** — semua konfigurasi disimpan di sini, tapi belum tentu aktif
- `sites-enabled` adalah **yang aktif** — isinya symlink (shortcut) ke file di `sites-available`

Jadi alurnya: buat konfigurasi di `sites-available` → aktifkan dengan buat symlink ke `sites-enabled` → reload Nginx.

```bash
# Cara mengaktifkan konfigurasi (buat symlink)
ln -s /etc/nginx/sites-available/nama-app /etc/nginx/sites-enabled/

# Cara menonaktifkan konfigurasi (hapus symlink)
rm /etc/nginx/sites-enabled/nama-app
```

### 1.5 Apa Itu Server Block (Virtual Host)?

**Server block** adalah bagian konfigurasi Nginx yang mendefinisikan bagaimana Nginx menangani request untuk satu aplikasi tertentu. Karena kita tidak punya domain (kita pakai port), setiap aplikasi akan punya server block dengan port yang berbeda.

Contoh server block paling sederhana:

```nginx
server {
    listen 8000;          # Nginx mendengarkan di port 8000

    root /var/www/aplikasi-ku/public;   # Folder utama file web
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
}
```

Kita akan bahas server block lebih dalam di Part 4 saat deploy aplikasi.

### 1.6 Test Konfigurasi Sebelum Reload

Ini kebiasaan yang **wajib** kamu miliki. Setiap kali kamu mengubah konfigurasi Nginx, test dulu sebelum reload:

```bash
nginx -t
```

Kalau konfigurasi benar, outputnya akan seperti ini:

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Kalau ada error, Nginx akan memberitahu di baris mana masalahnya. Ini jauh lebih baik daripada langsung reload dan tiba-tiba Nginx crash karena konfigurasi salah.

Alur yang benar setiap mengubah konfigurasi Nginx:

```bash
# 1. Edit konfigurasi
nano /etc/nginx/sites-available/nama-app

# 2. Test konfigurasi
nginx -t

# 3. Kalau OK, baru reload
systemctl reload nginx
```

### 1.7 Cara Cek Log Error Nginx

Kalau aplikasi kamu bermasalah, log Nginx adalah tempat pertama yang harus kamu cek:

```bash
# Lihat log error secara real-time (Ctrl+C untuk stop)
tail -f /var/log/nginx/error.log

# Lihat log access (semua request yang masuk)
tail -f /var/log/nginx/access.log

# Lihat 50 baris terakhir dari error log
tail -n 50 /var/log/nginx/error.log
```

---

## 2. Install PHP Multi-versi (7.4 dan 8.2)

### 2.1 Kenapa Butuh Multi-versi PHP?

Ini skenario yang sangat umum di dunia nyata: kamu punya aplikasi lama yang hanya jalan di PHP 7.4 (misalnya CodeIgniter 3 lama), tapi kamu juga perlu jalan aplikasi baru di PHP 8.2 (Laravel terbaru).

Kalau kamu install PHP versi tunggal, kamu harus milih satu dan yang lain tidak bisa jalan. Dengan multi-versi, keduanya bisa hidup berdampingan di satu server.

### 2.2 Tambahkan Repository ondrej/php

Repository bawaan Ubuntu tidak selalu punya versi PHP terbaru atau versi lama tertentu. Kita perlu tambahkan repository dari **Ondřej Surý** — orang yang memaintain paket PHP untuk Debian/Ubuntu. Repositorynya sangat terpercaya dan dipakai jutaan server di seluruh dunia.

```bash
# Install software-properties-common (dibutuhkan untuk menambah repository)
apt install software-properties-common -y

# Tambahkan repository ondrej/php
add-apt-repository ppa:ondrej/php -y

# Update daftar paket setelah tambah repository baru
apt update
```

### 2.3 Install PHP 7.4 Beserta Extension-nya

```bash
apt install php7.4 php7.4-fpm \
    php7.4-mysql \
    php7.4-curl \
    php7.4-mbstring \
    php7.4-xml \
    php7.4-zip \
    php7.4-gd \
    php7.4-bcmath \
    php7.4-intl \
    php7.4-soap \
    php7.4-readline -y
```

> **Apa itu php7.4-fpm?**
> FPM singkatan dari **FastCGI Process Manager**. Ini adalah cara PHP berkomunikasi dengan Nginx. Kalau PHP adalah tukang masak, FPM adalah jembatan antara tukang masak dan pelayan (Nginx). Kita **harus** install ini agar Nginx bisa menjalankan PHP.

### 2.4 Install PHP 8.2 Beserta Extension-nya

```bash
apt install php8.2 php8.2-fpm \
    php8.2-mysql \
    php8.2-curl \
    php8.2-mbstring \
    php8.2-xml \
    php8.2-zip \
    php8.2-gd \
    php8.2-bcmath \
    php8.2-intl \
    php8.2-soap \
    php8.2-readline -y
```

### 2.5 Verifikasi Instalasi

```bash
# Cek PHP 7.4
php7.4 --version

# Cek PHP 8.2
php8.2 --version

# Cek status PHP-FPM 7.4
systemctl status php7.4-fpm

# Cek status PHP-FPM 8.2
systemctl status php8.2-fpm
```

Pastikan keduanya menampilkan status **active (running)**.

### 2.6 Cek Versi PHP Default di CLI

```bash
# Cek versi PHP yang saat ini aktif sebagai default
php --version
```

### 2.7 Switch PHP Default di CLI

Kadang kamu perlu jalankan perintah PHP di terminal (misalnya `php artisan migrate` untuk Laravel) menggunakan versi tertentu. Cara switch versi default:

```bash
# Lihat versi PHP yang tersedia
update-alternatives --list php

# Switch ke PHP 8.2
update-alternatives --set php /usr/bin/php8.2

# Switch ke PHP 7.4
update-alternatives --set php /usr/bin/php7.4

# Atau gunakan cara interaktif (pilih dari daftar)
update-alternatives --config php
```

Setelah switch, verifikasi:

```bash
php --version
```

### 2.8 Set Versi PHP Berbeda untuk Setiap Aplikasi di Nginx

Inilah keunggulan multi-versi PHP — setiap aplikasi bisa pakai versi yang berbeda. Caranya adalah dengan menentukan socket PHP-FPM yang berbeda di konfigurasi Nginx.

- PHP 7.4 FPM socket: `/run/php/php7.4-fpm.sock`
- PHP 8.2 FPM socket: `/run/php/php8.2-fpm.sock`

Contoh penggunaan di konfigurasi Nginx:

```nginx
# Untuk aplikasi yang pakai PHP 8.2
location ~ \.php$ {
    fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

```nginx
# Untuk aplikasi yang pakai PHP 7.4
location ~ \.php$ {
    fastcgi_pass unix:/run/php/php7.4-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

Kita akan pakai ini di Part 4 saat setup Nginx untuk Laravel dan CodeIgniter.

### 2.9 Install Composer

Selagi kita di bagian PHP, sekalian install **Composer** — package manager untuk PHP yang wajib ada kalau mau pakai Laravel atau framework PHP modern lainnya.

```bash
# Download installer Composer
curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php

# Install Composer secara global
php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer

# Verifikasi instalasi
composer --version
```

---

## 3. Install Node.js Multi-versi Menggunakan nvm

### 3.1 Kenapa Pakai nvm, Bukan Install Langsung?

Kalau kamu install Node.js langsung dari repository Ubuntu (`apt install nodejs`), kamu akan dapat satu versi saja — dan biasanya versi itu sudah ketinggalan zaman.

**nvm** (Node Version Manager) adalah tool yang memungkinkan kamu:

- Install banyak versi Node.js sekaligus
- Switch antar versi dengan mudah — bahkan per-project
- Update ke versi terbaru dengan satu perintah

Ini sangat penting karena ekosistem Node.js bergerak cepat — aplikasi lama mungkin butuh Node 16 atau 18, sementara project baru butuh Node.js versi terbaru.

### 3.2 Install nvm

```bash
# Download dan jalankan script installer nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Setelah install, **tutup dan buka ulang terminal SSH kamu**, atau jalankan perintah ini agar nvm langsung bisa dipakai tanpa perlu reconnect:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

Verifikasi nvm terinstall:

```bash
nvm --version
```

### 3.3 Install Node.js LTS Terbaru

**LTS** (Long Term Support) adalah versi yang direkomendasikan untuk production — stabil, didukung jangka panjang, dan punya ekosistem yang matang.

```bash
# Install Node.js LTS terbaru
nvm install --lts

# Verifikasi
node --version
npm --version
```

### 3.4 Install Node.js Versi 20

```bash
# Install Node.js versi 20
nvm install 20

# Verifikasi bahwa versi 20 terinstall
nvm list
```

Output `nvm list` akan terlihat seperti ini:

```
->     v20.x.x
       v22.x.x   (latest LTS)
default -> lts/* (-> v22.x.x)
```

Tanda `->` menunjukkan versi yang sedang aktif.

### 3.5 Switch Antar Versi Node.js

```bash
# Switch ke versi 20
nvm use 20

# Switch ke LTS terbaru
nvm use --lts

# Switch ke versi spesifik
nvm use 22

# Cek versi yang sedang aktif
node --version
```

### 3.6 Set Versi Default Node.js

Versi default adalah versi yang otomatis aktif setiap kali kamu buka terminal baru:

```bash
# Set LTS sebagai default
nvm alias default lts/*

# Atau set versi spesifik sebagai default
nvm alias default 20

# Lihat semua alias yang ada
nvm alias
```

### 3.7 Perintah nvm Lain yang Berguna

```bash
# Lihat semua versi yang terinstall
nvm list

# Lihat semua versi yang tersedia untuk diinstall
nvm list-remote

# Hapus versi yang tidak dibutuhkan
nvm uninstall 18

# Jalankan perintah dengan versi tertentu tanpa switch
nvm run 20 app.js
```

---

## Cek Ulang Semua Instalasi

Sebelum tutup Part 2, mari verifikasi semua yang sudah kita install berjalan dengan baik:

```bash
# Nginx
systemctl status nginx

# PHP-FPM
systemctl status php7.4-fpm
systemctl status php8.2-fpm

# Versi PHP
php7.4 --version
php8.2 --version

# Composer
composer --version

# Node.js & npm
node --version
npm --version

# Semua versi Node.js yang terinstall
nvm list
```

Kalau semua menampilkan status aktif dan versi yang benar, kamu berhasil! 🎉

---

## Troubleshooting Umum

### Nginx Tidak Mau Start

```bash
# Cek ada error apa
systemctl status nginx
journalctl -xeu nginx.service

# Paling sering: ada konfigurasi yang salah
nginx -t
```

### PHP-FPM Tidak Jalan

```bash
# Restart PHP-FPM
systemctl restart php8.2-fpm
systemctl restart php7.4-fpm

# Cek log error
tail -f /var/log/php8.2-fpm.log
```

### nvm Command Not Found Setelah Install

Ini artinya nvm belum ter-load ke shell session kamu. Jalankan:

```bash
source ~/.bashrc
# atau
source ~/.zshrc  # kalau pakai zsh
```

Kalau masih tidak mau, cek apakah baris konfigurasi nvm sudah ada di `~/.bashrc`:

```bash
cat ~/.bashrc | grep nvm
```

Kalau tidak ada, tambahkan manual:

```bash
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
source ~/.bashrc
```

---

## Rangkuman Part 2

Kita sudah setup tiga komponen penting:

- **Nginx** sudah terinstall dan jalan. Kamu tahu cara start/stop/restart/reload, paham struktur foldernya, dan tahu cara test konfigurasi sebelum reload.
- **PHP 7.4 dan 8.2** terinstall berdampingan. Kamu bisa switch versi default di CLI dan tahu cara set versi berbeda per-aplikasi di Nginx via PHP-FPM socket.
- **Node.js LTS dan versi 20** terinstall via nvm. Kamu bisa switch antar versi kapanpun dibutuhkan.

Server kita sekarang siap untuk menjalankan aplikasi PHP maupun Node.js.

---

## Selanjutnya: Part 3 — Setup MySQL

Di **Part 3**, kita akan setup database. Kita akan:

1. Install MySQL Server
2. Buat user MySQL khusus untuk aplikasi (ingat, jangan pakai root!)
3. Buat database production dan staging
4. Cara akses database dari **DataGrip** di laptop kamu via SSH tunnel

Sampai ketemu di Part 3! 🚀

---

_Kalau ada command yang error atau output yang berbeda dari yang kamu harapkan, jangan panik. Cek pesan errornya dengan teliti — biasanya Nginx dan PHP memberikan petunjuk yang cukup jelas tentang apa yang salah._

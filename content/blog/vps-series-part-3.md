---
title: "Belajar VPS dari Nol — Part 3: Setup MySQL, Database Production & Staging"
date: "Mar 23, 2026"
description: "Setup MySQL di VPS"
---

> **Seri ini terdiri dari 6 part:**
>
> - Part 1 — Mengenal VPS ✅
> - Part 2 — Setup Server: Nginx, PHP Multi-versi & Node.js Multi-versi ✅
> - **Part 3** — Setup MySQL: Database Production & Staging _(kamu di sini)_
> - Part 4 — Deploy Laravel & CodeIgniter 3 ke VPS
> - Part 5 — Deploy Express.js & Next.js + PM2
> - Part 6 — Keamanan VPS: Setup UFW Firewall

---

Halo lagi! Di Part 2 kita sudah berhasil setup Nginx, PHP multi-versi, dan Node.js multi-versi. Server kita makin siap.

Sekarang giliran **database**. Hampir semua aplikasi web butuh database — tempat menyimpan data pengguna, transaksi, konten, dan seterusnya. Di seri ini kita akan pakai **MySQL**, salah satu database paling populer di dunia.

Di part ini kita akan:

1. Install MySQL Server
2. Buat user MySQL khusus untuk aplikasi
3. Buat database production dan staging
4. Akses database dari **DataGrip** di laptop kamu via SSH tunnel

Yuk mulai!

---

## 1. Install MySQL Server

### 1.1 Install

```bash
# Update daftar paket
apt update

# Install MySQL Server
apt install mysql-server -y
```

Setelah install, MySQL langsung jalan otomatis. Verifikasi:

```bash
# Cek status MySQL
systemctl status mysql
```

Kalau muncul **active (running)**, berarti MySQL sudah jalan. Pastikan juga MySQL otomatis start saat server reboot:

```bash
systemctl enable mysql
```

### 1.2 Jalankan mysql_secure_installation

Ini adalah langkah keamanan yang **wajib** dilakukan setelah install MySQL. Perintah ini akan memandu kamu melalui beberapa konfigurasi keamanan dasar.

```bash
mysql_secure_installation
```

Kamu akan ditanya beberapa pertanyaan. Berikut penjelasan tiap pertanyaan dan rekomendasi jawabannya:

---

**Pertanyaan 1: VALIDATE PASSWORD component**

```
Securing the MySQL server deployment.

VALIDATE PASSWORD COMPONENT can be used to test passwords
and improve security. It checks the strength of password...

Press y|Y for Yes, any other key for No:
```

Plugin ini memaksa password MySQL harus memenuhi standar tertentu (panjang, kombinasi huruf-angka-simbol). Untuk VPS production, rekomendasi: **tekan `Y`**.

Setelah itu akan ada pilihan level validasi:

```
LOW    Length >= 8
MEDIUM Length >= 8, numeric, mixed case, and special characters
STRONG Length >= 8, numeric, mixed case, special characters and dictionary file

Please enter 0 = LOW, 1 = MEDIUM and 2 = STRONG:
```

Pilih `1` (MEDIUM) sudah cukup untuk kebanyakan kasus.

---

**Pertanyaan 2: Password untuk root MySQL**

```
Please set the password for root here.

New password:
Re-enter new password:
```

Masukkan password yang kuat untuk user **root MySQL**. Perhatikan: ini adalah root MySQL, berbeda dengan root Linux. Simpan password ini di tempat yang aman!

---

**Pertanyaan 3: Remove anonymous users**

```
By default, a fresh install of MySQL will have an anonymous user,
allowing anyone to log into MySQL without having to have
a user account created for them...

Remove anonymous users? (Press y|Y for Yes, any other key for No):
```

Jawab **`Y`**. User anonim adalah celah keamanan — hapus saja.

---

**Pertanyaan 4: Disallow root login remotely**

```
Normally, root should only be allowed to connect from
'localhost'. This ensures that someone cannot guess at
the root password from the network...

Disallow root login remotely? (Press y|Y for Yes, any other key for No):
```

Jawab **`Y`**. Root MySQL tidak perlu bisa diakses dari luar server. Ini penting banget untuk keamanan.

---

**Pertanyaan 5: Remove test database**

```
By default, MySQL comes with a database named 'test' that
anyone can access...

Remove test database and access to it? (Press y|Y for Yes, any other key for No):
```

Jawab **`Y`**. Database test tidak dibutuhkan di production.

---

**Pertanyaan 6: Reload privilege tables**

```
Reloading the privilege tables will ensure that all changes
made so far will take effect immediately.

Reload privilege tables now? (Press y|Y for Yes, any other key for No):
```

Jawab **`Y`**. Ini memastikan semua perubahan di atas langsung berlaku.

---

Selesai! MySQL sekarang sudah dikonfigurasi dengan aman.

### 1.3 Masuk ke MySQL sebagai Root

```bash
mysql -u root -p
```

Masukkan password root MySQL yang tadi kamu buat. Kalau berhasil, kamu akan masuk ke MySQL prompt:

```
Welcome to the MySQL monitor.  Commands end with ; or \g.

mysql>
```

Semua perintah SQL yang kita jalankan selanjutnya diketik di sini. Ingat: setiap perintah SQL diakhiri dengan titik koma (`;`).

Untuk keluar dari MySQL prompt, ketik:

```sql
EXIT;
```

---

## 2. Setup User MySQL

### 2.1 Kenapa Tidak Pakai Root untuk Aplikasi?

Ini prinsip yang sama seperti di Part 1 tentang user Linux — **jangan pernah pakai root untuk aplikasi**.

Bayangkan kalau aplikasi Laravel kamu pakai user root MySQL dan ada celah keamanan di aplikasi. Penyerang bisa masuk lewat aplikasi dan punya akses penuh ke SEMUA database di server — bukan cuma database aplikasi kamu, tapi semua database lain juga.

Solusinya: buat user MySQL khusus yang hanya punya akses ke database yang dia butuhkan. Prinsip ini namanya **least privilege** — berikan hak akses seminimal mungkin.

### 2.2 Buat User MySQL Baru

Masuk dulu ke MySQL sebagai root:

```bash
mysql -u root -p
```

Kemudian buat user baru:

```sql
-- Buat user baru
-- Ganti 'password_kuat_di_sini' dengan password yang benar-benar kuat
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'password_kuat_di_sini';
```

> **Kenapa `'appuser'@'localhost'`?**
> Format `user@host` menentukan dari mana user ini boleh connect. `localhost` artinya user ini hanya boleh connect dari server itu sendiri — tidak bisa dari luar. Ini lebih aman karena database kita memang tidak perlu diakses langsung dari internet.

Verifikasi user sudah dibuat:

```sql
-- Lihat semua user MySQL yang ada
SELECT user, host FROM mysql.user;
```

---

## 3. Buat Database Production dan Staging

### 3.1 Konvensi Penamaan

Sebelum buat database, penting untuk konsisten dalam penamaan. Di seri ini kita akan pakai konvensi berikut:

| Aplikasi      | Database Production  | Database Staging  |
| ------------- | -------------------- | ----------------- |
| Laravel       | `laravel_production` | `laravel_staging` |
| CodeIgniter 3 | `ci3_production`     | `ci3_staging`     |

Aturan penamaan yang baik:

- Gunakan huruf kecil semua
- Gunakan underscore (`_`) sebagai pemisah kata, bukan spasi atau strip
- Akhiri dengan `_production` atau `_staging` agar jelas tujuannya
- Jangan pakai nama generik seperti `db` atau `database`

### 3.2 Buat Semua Database

Masih di MySQL prompt, jalankan:

```sql
-- Database untuk Laravel
CREATE DATABASE laravel_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE laravel_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Database untuk CodeIgniter 3
CREATE DATABASE ci3_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE ci3_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> **Kenapa `utf8mb4`?**
> `utf8mb4` adalah encoding yang mendukung semua karakter Unicode termasuk emoji. Ini standar yang direkomendasikan untuk aplikasi modern. Jangan pakai `utf8` biasa karena tidak support semua karakter Unicode.

Verifikasi semua database sudah terbuat:

```sql
SHOW DATABASES;
```

Output yang diharapkan:

```
+--------------------+
| Database           |
+--------------------+
| ci3_production     |
| ci3_staging        |
| information_schema |
| laravel_production |
| laravel_staging    |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
```

### 3.3 Grant Akses User ke Setiap Database

Sekarang kita kasih `appuser` akses ke semua database yang baru dibuat:

```sql
-- Grant akses ke database Laravel
GRANT ALL PRIVILEGES ON laravel_production.* TO 'appuser'@'localhost';
GRANT ALL PRIVILEGES ON laravel_staging.* TO 'appuser'@'localhost';

-- Grant akses ke database CodeIgniter 3
GRANT ALL PRIVILEGES ON ci3_production.* TO 'appuser'@'localhost';
GRANT ALL PRIVILEGES ON ci3_staging.* TO 'appuser'@'localhost';

-- Terapkan perubahan privilege
FLUSH PRIVILEGES;
```

> **Apa itu `FLUSH PRIVILEGES`?**
> Perintah ini memaksa MySQL untuk memuat ulang tabel privilege dari disk. Selalu jalankan ini setelah memberikan atau mencabut privilege agar perubahan langsung berlaku.

Verifikasi privilege yang diberikan:

```sql
SHOW GRANTS FOR 'appuser'@'localhost';
```

Output yang diharapkan:

```
+-----------------------------------------------------------------------+
| Grants for appuser@localhost                                          |
+-----------------------------------------------------------------------+
| GRANT USAGE ON *.* TO `appuser`@`localhost`                          |
| GRANT ALL PRIVILEGES ON `laravel_production`.* TO `appuser`@`localhost` |
| GRANT ALL PRIVILEGES ON `laravel_staging`.* TO `appuser`@`localhost` |
| GRANT ALL PRIVILEGES ON `ci3_production`.* TO `appuser`@`localhost`  |
| GRANT ALL PRIVILEGES ON `ci3_staging`.* TO `appuser`@`localhost`     |
+-----------------------------------------------------------------------+
```

Sekarang keluar dari MySQL:

```sql
EXIT;
```

### 3.4 Test Login dengan User Baru

Pastikan `appuser` bisa login dan akses database yang sudah di-grant:

```bash
# Login sebagai appuser
mysql -u appuser -p
```

Masukkan password `appuser`. Setelah masuk:

```sql
-- Cek database apa saja yang bisa diakses oleh appuser
SHOW DATABASES;
```

Kamu hanya akan melihat database yang sudah di-grant ke `appuser` — bukan semua database di server. Ini yang kita inginkan!

```
+--------------------+
| Database           |
+--------------------+
| ci3_production     |
| ci3_staging        |
| information_schema |
| laravel_production |
| laravel_staging    |
+--------------------+
```

---

## 4. Akses Database dari DataGrip via SSH Tunnel

### 4.1 Kenapa Pakai SSH Tunnel?

MySQL secara default hanya mendengarkan koneksi dari `localhost` (dari dalam server itu sendiri). Port MySQL (3306) tidak terbuka ke internet — dan memang **tidak seharusnya dibuka**.

Lalu bagaimana kita bisa akses database dari DataGrip di laptop?

Jawabannya: **SSH Tunnel**. Kita membuat "terowongan" aman melalui koneksi SSH kita. DataGrip akan connect ke server via SSH dulu, lalu dari dalam server, connect ke MySQL di localhost. Dari sudut pandang MySQL, koneksinya datang dari localhost — aman!

```
Laptop kamu  ──(SSH)──▶  VPS  ──(localhost)──▶  MySQL
```

### 4.2 Setup Koneksi di DataGrip

Buka DataGrip, lalu ikuti langkah-langkah berikut:

**Langkah 1: Buat koneksi baru**

Klik tombol **`+`** (New) di panel kiri atas → pilih **Data Source** → pilih **MySQL**.

---

**Langkah 2: Konfigurasi tab SSH/SSL**

Sebelum isi detail database, pergi ke tab **SSH/SSL** terlebih dahulu.

- Centang **Use SSH tunnel**
- **Proxy host**: isi dengan IP publik VPS kamu (contoh: `123.456.789.0`)
- **Proxy port**: `22`
- **Proxy user**: `root` (atau user Linux yang kamu pakai)
- **Auth type**: pilih `Password` (atau `Key pair` kalau kamu pakai SSH key — kita setup SSH key di Part 4)
- **Proxy password**: isi password SSH VPS kamu

---

**Langkah 3: Konfigurasi tab General (koneksi database)**

Kembali ke tab **General**:

- **Host**: `127.0.0.1` ← bukan IP VPS! Ini adalah localhost dari sudut pandang server
- **Port**: `3306`
- **User**: `appuser`
- **Password**: password yang kamu buat untuk `appuser`
- **Database**: pilih salah satu, misalnya `laravel_production`

---

**Langkah 4: Test koneksi**

Klik tombol **Test Connection** di bagian bawah. Kalau muncul tanda centang hijau dan pesan "Successful", kamu berhasil!

Kalau ada error, cek bagian troubleshooting di bawah.

---

**Langkah 5: Buat koneksi terpisah untuk staging**

Ulangi langkah 1-4 untuk staging. Satu-satunya yang berbeda adalah di kolom **Database**, ganti ke `laravel_staging` (atau database staging yang kamu inginkan).

Tips: beri nama yang jelas untuk setiap koneksi. Misalnya:

- `VPS - Laravel Production`
- `VPS - Laravel Staging`
- `VPS - CI3 Production`
- `VPS - CI3 Staging`

Ini mencegah kamu salah jalankan query di database yang tidak tepat — bayangkan kalau kamu tidak sengaja `DROP TABLE` di production 😱

### 4.3 Tips Keamanan Tambahan di DataGrip

DataGrip punya fitur yang bisa membantu mencegah kecelakaan di production:

**Beri warna berbeda untuk koneksi production vs staging:**

Klik kanan pada koneksi → **Color** → pilih warna merah untuk production, hijau untuk staging. Dengan begitu, kamu selalu tahu di database mana kamu sedang bekerja hanya dari warna tab query.

---

## Troubleshooting Umum

### Error: Access denied for user 'appuser'@'localhost'

```bash
# Cek apakah user sudah dibuat dan punya privilege yang benar
mysql -u root -p -e "SHOW GRANTS FOR 'appuser'@'localhost';"
```

Kalau kosong atau tidak ada, ulangi langkah membuat user dan grant privileges.

### Error: Can't connect to MySQL server

```bash
# Cek apakah MySQL sedang jalan
systemctl status mysql

# Kalau tidak jalan, start MySQL
systemctl start mysql

# Cek log MySQL untuk error detail
tail -f /var/log/mysql/error.log
```

### DataGrip: Connection timed out

Ini biasanya masalah SSH tunnel-nya, bukan MySQL-nya. Pastikan:

- IP VPS sudah benar
- Username SSH sudah benar
- Password SSH sudah benar
- Port SSH adalah 22 (kecuali kamu sudah ganti di Part 6 nanti)

### DataGrip: Public Key Retrieval is not allowed

Tambahkan parameter ini di URL koneksi DataGrip. Di tab **Advanced**, cari `allowPublicKeyRetrieval` dan set ke `true`. Atau tambahkan di URL:

```
jdbc:mysql://127.0.0.1:3306/laravel_production?allowPublicKeyRetrieval=true&useSSL=false
```

---

## Rangkuman Part 3

Di part ini kita sudah:

- ✅ Install MySQL Server dan amankan dengan `mysql_secure_installation`
- ✅ Buat user MySQL `appuser` yang hanya bisa connect dari localhost
- ✅ Buat 4 database: `laravel_production`, `laravel_staging`, `ci3_production`, `ci3_staging`
- ✅ Grant privilege `appuser` ke semua database tersebut
- ✅ Akses semua database dari DataGrip via SSH Tunnel

Database kita sekarang sudah siap dipakai oleh aplikasi.

Berikut adalah **ringkasan credential** yang perlu kamu catat dan simpan di tempat aman:

```
MySQL Root Password : [password yang kamu buat tadi]
MySQL App User      : appuser
MySQL App Password  : [password appuser yang kamu buat]

Databases:
  - laravel_production
  - laravel_staging
  - ci3_production
  - ci3_staging
```

> ⚠️ **Penting:** Jangan pernah commit credential ini ke Git. Nanti kita akan simpan credential ini di file `.env` masing-masing aplikasi — dan file `.env` harus masuk ke `.gitignore`.

---

## Selanjutnya: Part 4 — Deploy Laravel & CodeIgniter 3

Di **Part 4**, server kita sudah punya semua yang dibutuhkan. Saatnya deploy aplikasi! Kita akan:

1. Buat aplikasi Laravel sederhana dan deploy ke VPS via **WinSCP**
2. Setup Nginx untuk Laravel production (port 8000) dan staging (port 8001)
3. Konfigurasi database Laravel untuk production dan staging
4. Setup **SSH key** di VPS dan pakai sebagai deploy key di GitHub/GitLab
5. Buat aplikasi CodeIgniter 3 sederhana dan deploy via **Git** — branch `main` untuk production, branch `dev` untuk staging

Sampai ketemu di Part 4! 🚀

---

_Ingat, di dunia nyata credential database adalah aset yang sangat sensitif. Gunakan password manager seperti Bitwarden atau 1Password untuk menyimpan semua password dengan aman._

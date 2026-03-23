---
title: "Belajar VPS dari Nol — Part 1: Mengenal VPS, Fondasi yang Harus Kamu Tahu"
date: "Mar 23, 2026"
description: "Dasar-dasar VPS"
---

> **Seri ini terdiri dari 6 part:**
>
> - **Part 1** — Mengenal VPS _(kamu di sini)_
> - Part 2 — Setup Server: Nginx, PHP Multi-versi & Node.js Multi-versi
> - Part 3 — Setup MySQL: Database Production & Staging
> - Part 4 — Deploy Laravel & CodeIgniter 3 ke VPS
> - Part 5 — Deploy Express.js & Next.js + PM2
> - Part 6 — Keamanan VPS: Setup UFW Firewall

---

Halo! Selamat datang di part pertama dari seri **Belajar VPS dari Nol**.

Kalau kamu pernah dengar kata "VPS" dan langsung pusing, tenang — aku juga pernah di posisi yang sama. Dulu waktu pertama kali bos minta deploy aplikasi ke VPS, aku cuma bengong di depan terminal hitam dengan kursor yang kedip-kedip. Rasanya kayak disuruh nyetir mobil manual padahal belum pernah pegang setir sama sekali.

Di seri ini, kita akan belajar bareng dari nol. Beneran dari nol. Kita bakal setup server dari kosong sampai bisa jalan beberapa aplikasi sekaligus — Laravel, CodeIgniter 3, Express.js, dan Next.js. Semuanya ada versi production dan staging-nya.

Tapi sebelum kita nyentuh terminal, kita perlu ngerti dulu **apa yang kita hadapi**. Itu yang akan kita bahas di Part 1 ini.

---

## 1. Apa Itu VPS?

**VPS** singkatan dari **Virtual Private Server**. Tapi definisi teknis itu belum tentu bikin kamu paham, jadi mari kita pakai analogi.

### Analogi: Rumah vs Apartemen vs Kamar Kos

Bayangkan kamu mau "tinggal" di internet — artinya kamu butuh tempat untuk nyimpen dan jalanin aplikasi kamu.

Ada beberapa pilihan:

| Pilihan              | Analogi       | Penjelasan                                                                                                                                                                              |
| -------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shared Hosting**   | Kamar kos     | Kamu berbagi satu "rumah" (server) dengan banyak orang lain. Murah, tapi kamu nggak bisa renovasi, nggak bebas, dan kalau tetangga berisik (pakai resource banyak), kamu kena imbasnya. |
| **VPS**              | Apartemen     | Kamu punya unit sendiri. Boleh cat dinding, pasang lemari, beli AC sendiri. Masih satu gedung dengan orang lain, tapi unit kamu terisolasi.                                             |
| **Dedicated Server** | Rumah sendiri | Satu gedung, satu penghuni. Bebas total, tapi mahal banget.                                                                                                                             |

VPS adalah **virtual machine** — artinya satu server fisik dipotong-potong jadi beberapa mesin virtual yang masing-masing berdiri sendiri. Kamu dapat "jatah" CPU, RAM, dan storage yang sudah ditentukan, dan itu punya kamu sendiri. Nggak bocor ke user lain.

### Apa yang Bisa Kamu Lakukan dengan VPS?

Dengan VPS, kamu bisa:

- 🚀 **Deploy aplikasi web** — PHP, Node.js, Python, Ruby, apapun
- 🗄️ **Jalankan database** — MySQL, PostgreSQL, MongoDB, Redis
- 📁 **Buat file server atau object storage** sendiri
- 🤖 **Jalankan bot, cron job, atau background worker**
- 🔒 **Setup VPN** pribadi
- Dan masih banyak lagi — basically apapun yang bisa dijalankan di Linux

### Kenapa Developer Perlu Tahu VPS?

Di dunia kerja nyata, banyak perusahaan — terutama startup dan perusahaan menengah — masih pakai VPS untuk hosting aplikasi mereka. Kalau kamu cuma bisa deploy ke platform seperti Vercel atau Heroku, kamu akan mentok waktu diminta setup server sendiri.

Selain itu, paham VPS bikin kamu mengerti **bagaimana aplikasi kamu benar-benar jalan di balik layar**. Ini pengetahuan yang sangat berharga dan bikin kamu lebih confident sebagai developer.

---

## 2. Apa Bedanya VPS dengan cPanel?

Ini pertanyaan yang sering banget muncul dari pemula, jadi aku mau jelaskan dengan jelas.

### cPanel itu Bukan Pengganti VPS

**cPanel** adalah sebuah **panel kontrol** — antarmuka grafis berbasis web yang memudahkan kamu mengelola hosting tanpa perlu paham command line. Kamu bisa upload file, buat email, manage database, semua lewat klik-klik di browser.

**VPS** adalah **infrastrukturnya** — server tempat semuanya berjalan.

Jadi hubungannya begini: **cPanel bisa dipasang di atas VPS**. Tapi kamu juga bisa pakai VPS tanpa cPanel sama sekali — inilah yang akan kita pelajari di seri ini.

### Perbandingan Langsung

|                   | cPanel (Shared/VPS)                         | VPS Tanpa cPanel                        |
| ----------------- | ------------------------------------------- | --------------------------------------- |
| **Cara kelola**   | Lewat antarmuka web (GUI)                   | Lewat terminal (command line)           |
| **Kemudahan**     | Lebih mudah untuk pemula                    | Butuh belajar lebih banyak              |
| **Fleksibilitas** | Terbatas pada fitur yang tersedia           | Bebas, bisa install apapun              |
| **Biaya**         | Lisensi cPanel mahal (~$20+/bulan)          | Gratis (pakai software open source)     |
| **Cocok untuk**   | Blog, toko online sederhana, website statis | Aplikasi web modern, API, multi-service |

### Kapan Pakai cPanel, Kapan Langsung VPS?

**Pakai cPanel kalau:**

- Kamu atau klien kamu butuh tampilan visual yang mudah dioperasikan
- Aplikasinya sederhana — blog, company profile, toko online kecil
- Kamu nggak mau pusing urusan server dan mau fokus ke konten

**Langsung ke VPS tanpa cPanel kalau:**

- Kamu developer yang mau deploy aplikasi custom
- Kamu butuh kontrol penuh atas environment (versi PHP, Node.js, dsb)
- Kamu mau belajar cara kerja server yang sesungguhnya
- Aplikasi kamu butuh setup yang tidak tersedia di cPanel (WebSocket, background worker, dll)

Di seri ini, kita akan jalan tanpa cPanel. Kita pegang sendiri semuanya, dari install Nginx sampai manage database. Ini lebih kerja keras di awal, tapi hasilnya jauh lebih powerful.

---

## 3. Hal-Hal yang Perlu Diketahui Pemula Tentang VPS

Sebelum kita mulai ngoprek, ada beberapa konsep dasar yang **wajib** kamu pahami. Jangan skip bagian ini — ini fondasi dari segalanya.

### 3.1 IP Publik, SSH, dan Terminal

#### IP Publik

Setiap VPS punya **IP publik** — alamat unik di internet yang bisa diakses dari mana saja. Kalau kamu punya VPS dengan IP `123.456.789.0`, maka siapapun di dunia (termasuk kamu) bisa mengakses server itu melalui IP tersebut.

Nanti IP inilah yang kita pakai untuk connect ke server, deploy aplikasi, dan mengakses aplikasi yang sudah berjalan.

#### SSH

**SSH** (Secure Shell) adalah protokol untuk **remote login** ke server secara aman. Bayangkan SSH seperti "pintu belakang" server kamu — kamu bisa masuk ke server dari jarak jauh dan ngobrol langsung dengan sistem operasinya.

Saat kamu SSH ke VPS, kamu akan masuk ke **terminal** server. Dari sini, semua yang kamu ketik adalah perintah langsung ke server.

#### Terminal

Terminal adalah antarmuka berbasis teks tempat kamu berkomunikasi dengan server. Nggak ada tombol, nggak ada ikon — semua lewat perintah teks. Kedengarannya menakutkan, tapi kamu akan terbiasa sangat cepat.

### 3.2 Cara Connect ke VPS via SSH

Untuk connect ke VPS, kamu butuh:

- **IP publik** VPS kamu (dapat dari provider VPS seperti DigitalOcean, Vultr, Linode, dll)
- **Username** (biasanya `root` untuk pertama kali)
- **Password** atau **SSH Key** (kita bahas SSH Key di Part 4)

**Di Linux/macOS**, buka terminal dan ketik:

```bash
ssh root@123.456.789.0
```

Ganti `123.456.789.0` dengan IP VPS kamu. Setelah itu masukkan password saat diminta.

**Di Windows**, kamu bisa pakai:

- [PuTTY](https://www.putty.org/) — aplikasi gratis untuk SSH di Windows
- Windows Terminal / PowerShell (sudah support SSH di Windows 10/11)

```powershell
# Di Windows Terminal / PowerShell
ssh root@123.456.789.0
```

Kalau berhasil, kamu akan disambut dengan tampilan seperti ini:

```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-89-generic x86_64)

Last login: Mon Jan 15 10:23:41 2024 from 192.168.1.1

root@vps-kamu:~#
```

Selamat! Kamu sudah masuk ke server. Kursor `root@vps-kamu:~#` itu menunggu perintah dari kamu.

### 3.3 Perintah Linux Dasar yang Wajib Tahu

Ini adalah perintah-perintah yang akan sering banget kamu pakai. Hafalkan, atau minimal bookmark bagian ini.

#### Navigasi File dan Folder

```bash
# Lihat isi folder saat ini
ls

# Lihat isi folder dengan detail (permission, size, tanggal)
ls -la

# Lihat kamu sedang di folder mana
pwd

# Pindah ke folder lain
cd /var/www

# Kembali ke folder sebelumnya
cd ..

# Kembali ke home directory
cd ~
```

#### Membuat dan Mengelola File/Folder

```bash
# Buat folder baru
mkdir nama-folder

# Buat folder beserta parent-nya sekaligus
mkdir -p /var/www/aplikasi-ku

# Buat file baru
touch nama-file.txt

# Hapus file
rm nama-file.txt

# Hapus folder beserta isinya (HATI-HATI! Tidak bisa di-undo)
rm -rf nama-folder

# Salin file
cp file-asal.txt file-tujuan.txt

# Pindah / rename file
mv file-lama.txt file-baru.txt
```

#### Membaca dan Mengedit File

```bash
# Baca isi file (tampilkan di terminal)
cat nama-file.txt

# Baca file yang panjang dengan navigasi atas-bawah (tekan Q untuk keluar)
less nama-file.txt

# Edit file menggunakan nano (editor teks di terminal)
nano nama-file.txt
```

> **Tips nano:** Setelah selesai edit di nano, tekan `Ctrl+X` untuk keluar. Nano akan tanya apakah mau save — tekan `Y`, lalu Enter untuk konfirmasi nama file.

#### Mengelola Paket/Software

Di VPS Ubuntu/Debian, kita pakai `apt` untuk install software:

```bash
# Update daftar software yang tersedia (lakukan ini sebelum install apapun)
apt update

# Install software
apt install nama-software

# Update semua software yang terinstall
apt upgrade

# Hapus software
apt remove nama-software
```

#### Perintah Lain yang Sering Dipakai

```bash
# Lihat proses yang sedang berjalan
ps aux

# Lihat penggunaan disk
df -h

# Lihat penggunaan RAM
free -h

# Tampilkan beberapa baris terakhir dari sebuah file (berguna untuk lihat log)
tail -f /var/log/nginx/error.log

# Cari teks di dalam file
grep "kata-yang-dicari" nama-file.txt

# Jalankan perintah dengan hak akses administrator
sudo perintah-yang-dimaksud
```

### 3.4 Konsep Permission dan Kenapa Jangan Sembarangan Pakai Root

#### Apa Itu Root?

Di Linux, ada satu user spesial bernama **root**. Root adalah "tuhan" di sistem operasi — bisa melakukan APAPUN tanpa batasan. Hapus file sistem? Bisa. Matiin server? Bisa. Install software berbahaya? Bisa.

Masalahnya, karena root bisa melakukan segalanya, satu kesalahan kecil bisa berakibat fatal. Misalnya, kamu salah ketik:

```bash
# JANGAN PERNAH JALANKAN INI — ini akan menghapus SEMUA FILE di server!
rm -rf /
```

Satu command di atas bisa bikin server kamu habis total. Dengan root, nggak ada konfirmasi, nggak ada peringatan — langsung eksekusi.

#### Solusi: Buat User Biasa

Praktik terbaik adalah **membuat user biasa** untuk aktivitas sehari-hari, dan hanya pakai root kalau benar-benar dibutuhkan.

```bash
# Buat user baru (jalankan sebagai root)
adduser nama-user-kamu

# Berikan akses sudo ke user tersebut
usermod -aG sudo nama-user-kamu

# Pindah ke user yang baru dibuat
su - nama-user-kamu

# Sekarang kalau mau jalankan perintah admin, pakai sudo
sudo apt update
```

Dengan `sudo`, kamu bisa menjalankan perintah administrator, tapi harus ketik password dulu. Ini mencegah kecelakaan karena minimal ada satu lapisan konfirmasi — yaitu kamu harus sadar bahwa kamu sedang menjalankan perintah "berbahaya".

#### Memahami Permission File

Di Linux, setiap file dan folder punya **permission** yang menentukan siapa yang boleh baca, tulis, dan jalankan file tersebut.

Kalau kamu ketik `ls -la`, kamu akan lihat sesuatu seperti ini:

```
drwxr-xr-x  2 www-data www-data 4096 Jan 15 10:00 storage
-rw-r--r--  1 root     root      256 Jan 15 10:00 .env
```

Kolom pertama (`drwxr-xr-x`) adalah kode permission:

- Karakter pertama: `d` = folder, `-` = file
- 3 karakter berikutnya (`rwx`): permission untuk **owner** (baca, tulis, eksekusi)
- 3 karakter berikutnya (`r-x`): permission untuk **group**
- 3 karakter terakhir (`r-x`): permission untuk **orang lain**

Perintah untuk ubah permission:

```bash
# Berikan permission baca-tulis-eksekusi untuk semua (777 — HINDARI kecuali terpaksa)
chmod 777 nama-folder

# Permission yang umum untuk folder website: owner full, group & others baca+eksekusi
chmod 755 nama-folder

# Permission yang umum untuk file: owner baca+tulis, group & others hanya baca
chmod 644 nama-file

# Ubah ownership file/folder
chown www-data:www-data nama-folder

# Ubah ownership secara rekursif (seluruh isi folder)
chown -R www-data:www-data /var/www/aplikasi-ku
```

### 3.5 Tips Keamanan Dasar

Ini bukan seri tentang keamanan server secara mendalam, tapi ada beberapa hal dasar yang **wajib** kamu lakukan sejak awal:

#### 1. Ganti Password Root yang Kuat

```bash
passwd root
```

Masukkan password baru yang panjang dan tidak mudah ditebak. Kombinasi huruf besar, kecil, angka, dan simbol.

#### 2. Update Server Segera Setelah Setup

```bash
apt update && apt upgrade -y
```

Update ini menutup celah keamanan yang sudah diketahui. Lakukan ini pertama kali setelah masuk ke VPS baru.

#### 3. Jangan Expose Port yang Tidak Perlu

Nanti di Part 6, kita akan setup **UFW** (firewall) untuk memblokir semua port kecuali yang memang dibutuhkan. Ini penting banget — jangan sampai port database kamu bisa diakses dari internet!

#### 4. Jangan Simpan Credential di File yang Bisa Diakses Publik

File `.env` berisi password database, API key, dan hal-hal sensitif lainnya. Pastikan file ini **tidak masuk ke Git repository** dan permission-nya tidak terbuka ke semua orang.

```bash
# Set permission .env agar hanya owner yang bisa baca/tulis
chmod 600 .env
```

#### 5. Perhatikan Log Server

Biasakan cek log secara berkala untuk mendeteksi aktivitas mencurigakan:

```bash
# Cek log autentikasi (siapa aja yang coba login ke server)
tail -f /var/log/auth.log

# Cek log Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## Rangkuman Part 1

Oke, kita sudah cover banyak hal di Part 1 ini. Mari recap:

- **VPS** adalah virtual machine yang memberikan kamu "server sendiri" dengan resource yang terisolasi — lebih fleksibel dari shared hosting, lebih terjangkau dari dedicated server.
- **cPanel** adalah panel kontrol, bukan pengganti VPS. Kita bisa pakai VPS tanpa cPanel, dan itu yang akan kita lakukan di seri ini.
- **SSH** adalah cara kita berkomunikasi dengan server dari jarak jauh lewat terminal.
- **Root** adalah user dengan akses penuh — gunakan dengan bijak, dan buat user biasa untuk aktivitas sehari-hari.
- Perintah-perintah Linux dasar seperti `ls`, `cd`, `mkdir`, `nano`, `apt`, `chmod`, dan `chown` adalah senjata utama kamu di VPS.
- Keamanan dasar: password kuat, update rutin, jangan expose port sembarangan, jaga file `.env`.

---

## Selanjutnya: Part 2 — Setup Server

Di **Part 2**, kita akan langsung terjun ke setup server. Kita akan:

1. Install dan konfigurasi **Nginx** — web server yang akan kita pakai sepanjang seri ini
2. Install **PHP 7.4 dan PHP 8.2** secara bersamaan di satu server
3. Install **Node.js** dalam dua versi berbeda menggunakan nvm

Pastikan kamu sudah punya akses ke VPS sebelum lanjut ke Part 2. Kalau belum punya VPS, kamu bisa coba [DigitalOcean](https://digitalocean.com), [Vultr](https://vultr.com), atau [Linode/Akamai](https://linode.com) — semuanya punya opsi VPS mulai dari $4-6/bulan. Pilih Ubuntu 22.04 LTS sebagai OS-nya.

Sampai ketemu di Part 2! 🚀

---

_Ditulis dengan semangat berbagi. Kalau ada yang membingungkan, jangan ragu buat tanya di kolom komentar._

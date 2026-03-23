---
title: "Belajar VPS dari Nol — Part 6: Keamanan VPS dengan UFW Firewall"
date: "Mar 23, 2026"
description: "Setup UFW di VPS"
---

> **Seri ini terdiri dari 6 part:**
>
> - Part 1 — Mengenal VPS ✅
> - Part 2 — Setup Server: Nginx, PHP Multi-versi & Node.js Multi-versi ✅
> - Part 3 — Setup MySQL: Database Production & Staging ✅
> - Part 4 — Deploy Laravel & CodeIgniter 3 ke VPS ✅
> - Part 5 — Deploy Express.js & Next.js + PM2 ✅
> - **Part 6** — Keamanan VPS: Setup UFW Firewall _(kamu di sini — part terakhir!)_

---

Kita sudah sampai di part terakhir dari seri **Belajar VPS dari Nol**. Tepuk tangan untuk diri sendiri dulu — kamu sudah jauh banget dari Part 1 yang cuma belajar apa itu VPS dan cara SSH! 👏

Sekarang server kamu menjalankan 8 aplikasi sekaligus. Tapi ada satu masalah besar yang belum kita selesaikan.

Coba bayangkan ini: server kamu saat ini ibarat **rumah yang semua jendelanya terbuka lebar**. Semua port bisa diakses dari internet — bukan cuma port yang kamu izinkan, tapi juga port-port lain yang mungkin bisa dieksploitasi oleh orang yang tidak bertanggung jawab.

Di part terakhir ini, kita akan pasang **UFW (Uncomplicated Firewall)** — semacam "satpam" yang berdiri di pintu server dan memutuskan siapa yang boleh masuk dan siapa yang tidak.

> ⚠️ **PERINGATAN PALING PENTING DI SELURUH SERI INI:**
> Sebelum enable UFW, pastikan kamu sudah allow port SSH (22). Kalau lupa, kamu akan **terkunci keluar dari server sendiri** dan tidak bisa masuk lagi. Tidak ada tombol "undo" untuk ini. Baca seluruh bagian ini dulu sebelum menjalankan satu perintah pun.

---

## 1. Apa Itu UFW dan Kenapa Penting?

### 1.1 Firewall Itu Seperti Apa?

**Firewall** adalah sistem yang memfilter lalu lintas jaringan yang masuk dan keluar dari server. Dia memeriksa setiap "paket data" yang mencoba masuk dan memutuskan: boleh lewat atau tidak, berdasarkan aturan yang sudah kita tentukan.

Tanpa firewall, semua port di server kamu terbuka dan bisa dicoba oleh siapapun di internet. Ada ribuan bot otomatis yang setiap detik mencari server dengan port terbuka dan mencoba mengeksploitasinya.

**UFW** (Uncomplicated Firewall) adalah antarmuka yang mempermudah konfigurasi firewall `iptables` di Linux. `iptables` sangat powerful tapi sintaksnya rumit. UFW hadir untuk membuat manajemen firewall menjadi sederhana — sesuai namanya, "uncomplicated".

### 1.2 Strategi Dasar: Default Deny

Strategi yang kita pakai adalah **"tolak semua, izinkan yang dipilih"**:

- **Semua koneksi masuk** → diblokir secara default
- **Semua koneksi keluar** → diizinkan secara default
- Port tertentu yang kita butuhkan → izinkan satu per satu

Ini jauh lebih aman daripada strategi sebaliknya. Dengan begini, satu-satunya yang bisa masuk ke server adalah yang sudah kita izinkan secara eksplisit.

---

## 2. Install UFW

Di Ubuntu, UFW biasanya sudah terinstall. Cek dulu:

```bash
ufw --version
```

Kalau belum ada, install:

```bash
apt install ufw -y
```

Cek status UFW saat ini:

```bash
ufw status
```

Hasilnya kemungkinan `Status: inactive` — artinya UFW belum aktif. **Jangan aktifkan dulu** sebelum kita tambahkan semua rule yang dibutuhkan.

---

## 3. Konfigurasi Rules UFW

### 3.1 Set Default Policy

Pertama, set kebijakan default:

```bash
# Blokir semua koneksi masuk secara default
ufw default deny incoming

# Izinkan semua koneksi keluar secara default
ufw default allow outgoing
```

### 3.2 Allow SSH — LANGKAH PALING KRITIS

**Ini adalah langkah yang tidak boleh kamu lewatkan atau lakukan salah.**

```bash
# Allow SSH di port 22
ufw allow 22/tcp
```

Atau bisa juga dengan cara ini (hasilnya sama):

```bash
ufw allow ssh
```

Verifikasi rule SSH sudah masuk:

```bash
ufw show added
```

Pastikan ada baris yang menyebutkan port 22 sebelum lanjut ke langkah berikutnya.

> 💡 **Kalau kamu sudah ganti port SSH** (misalnya ke port 2222 untuk keamanan tambahan), sesuaikan perintah di atas:
>
> ```bash
> ufw allow 2222/tcp
> ```
>
> Jangan allow port 22 kalau SSH kamu sudah berjalan di port lain — itu tidak berguna dan kamu tetap akan terkunci keluar.

### 3.3 Allow HTTP dan HTTPS untuk Nginx

```bash
# Allow HTTP (port 80)
ufw allow 80/tcp

# Allow HTTPS (port 443) — untuk nanti kalau kamu pasang SSL
ufw allow 443/tcp

# Atau bisa sekaligus dengan nama service
ufw allow 'Nginx Full'
```

### 3.4 Allow Semua Port Aplikasi Kita

Ini port-port yang sudah kita setup di Part 4 dan Part 5:

```bash
# Laravel Production & Staging
ufw allow 8000/tcp
ufw allow 8001/tcp

# CodeIgniter 3 Production & Staging
ufw allow 8010/tcp
ufw allow 8011/tcp

# Express.js Production & Staging
ufw allow 3000/tcp
ufw allow 3001/tcp

# Next.js Production & Staging
ufw allow 4000/tcp
ufw allow 4001/tcp
```

### 3.5 Port MySQL — JANGAN Dibuka ke Publik

Ini kebalikannya — port MySQL (3306) **tidak** kita tambahkan ke daftar allow.

Kenapa? Karena kita **tidak pernah** butuh akses MySQL langsung dari internet. Semua akses database dilakukan lewat:

- Aplikasi yang berjalan di server itu sendiri (koneksi dari localhost)
- DataGrip di laptop kamu via **SSH Tunnel** (seperti yang kita setup di Part 3)

Kalau port 3306 dibuka ke publik, siapapun di internet bisa mencoba brute-force password MySQL kamu. Tidak ada alasan yang cukup baik untuk membuka port ini.

Begitu juga dengan port internal lainnya yang tidak perlu diakses dari luar.

### 3.6 Cek Semua Rule Sebelum Enable

Sebelum mengaktifkan UFW, lihat semua rule yang sudah ditambahkan:

```bash
ufw show added
```

Output yang kamu harapkan:

```
Added user rules (see 'ufw status' for running firewall):
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp
ufw allow 8001/tcp
ufw allow 8010/tcp
ufw allow 8011/tcp
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw allow 4000/tcp
ufw allow 4001/tcp
```

Pastikan port **22** ada di daftar. Kalau tidak ada, jalankan `ufw allow 22/tcp` sekarang juga sebelum lanjut.

---

## 4. Aktifkan UFW

Setelah semua rule sudah ditambahkan dan kamu sudah verifikasi port 22 ada di daftar, baru kita aktifkan:

```bash
ufw enable
```

UFW akan memberikan peringatan:

```
Command may disrupt existing ssh connections. Proceed with operation (y|n)?
```

Ketik `y` dan tekan Enter.

```
Firewall is active and enabled on system startup
```

UFW sekarang aktif dan akan otomatis jalan setiap server reboot.

### 4.1 Verifikasi Status UFW

```bash
ufw status verbose
```

Output yang kamu harapkan:

```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
8000/tcp                   ALLOW IN    Anywhere
8001/tcp                   ALLOW IN    Anywhere
8010/tcp                   ALLOW IN    Anywhere
8011/tcp                   ALLOW IN    Anywhere
3000/tcp                   ALLOW IN    Anywhere
3001/tcp                   ALLOW IN    Anywhere
4000/tcp                   ALLOW IN    Anywhere
4001/tcp                   ALLOW IN    Anywhere
```

Kalau semua port yang kamu butuhkan ada di sini, berarti konfigurasi sudah benar.

---

## 5. Manajemen Rules UFW

### 5.1 Lihat Rules dengan Nomor

Untuk menghapus rule tertentu, kamu perlu tahu nomornya:

```bash
ufw status numbered
```

Output:

```
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     ALLOW IN    Anywhere
[ 2] 80/tcp                     ALLOW IN    Anywhere
[ 3] 443/tcp                    ALLOW IN    Anywhere
[ 4] 8000/tcp                   ALLOW IN    Anywhere
...
```

### 5.2 Hapus Rule Berdasarkan Nomor

```bash
# Hapus rule nomor 4 (misalnya port 8000)
ufw delete 4
```

UFW akan minta konfirmasi — ketik `y` untuk konfirmasi.

### 5.3 Hapus Rule Berdasarkan Definisi

Cara lain yang lebih intuitif:

```bash
# Hapus rule berdasarkan definisinya
ufw delete allow 8000/tcp
```

### 5.4 Tambah Rule Baru Kapanpun

Kalau nanti kamu deploy aplikasi baru di port baru, tinggal tambahkan rule:

```bash
# Contoh: izinkan port 5000 untuk aplikasi baru
ufw allow 5000/tcp

# UFW langsung aktif — tidak perlu reload atau restart
```

### 5.5 Disable UFW (Kalau Dibutuhkan)

Kalau ada masalah dan kamu perlu matikan UFW sementara:

```bash
ufw disable
```

Ini **tidak** menghapus rules — hanya menonaktifkan firewall sementara. Semua rules tetap tersimpan dan akan aktif kembali saat kamu `ufw enable` lagi.

---

## 6. Tips Tambahan Keamanan

Kita sudah selesai dengan UFW, tapi aku mau bagi beberapa tips keamanan tambahan yang worth diketahui:

### 6.1 Ganti Port SSH (Opsional tapi Direkomendasikan)

Port default SSH (22) adalah target pertama yang dicoba oleh bot otomatis. Menggantinya ke port lain mengurangi noise secara signifikan.

```bash
# Edit konfigurasi SSH
nano /etc/ssh/sshd_config

# Cari baris: #Port 22
# Ubah menjadi (misalnya): Port 2222
```

Kalau kamu ganti port SSH, **jangan lupa** update rule UFW:

```bash
ufw allow 2222/tcp    # Allow port baru
ufw delete allow 22/tcp    # Hapus port lama
```

Dan restart SSH service:

```bash
systemctl restart sshd
```

> **PENTING:** Jangan tutup terminal SSH yang sedang aktif sebelum kamu berhasil konek ulang dengan port baru dari terminal lain. Kalau gagal konek, kamu masih punya sesi yang terbuka untuk memperbaiki.

### 6.2 Nonaktifkan Login Password SSH (Gunakan SSH Key)

Setelah kamu setup SSH key (kita sudah buat di Part 4), kamu bisa nonaktifkan login via password untuk keamanan ekstra:

```bash
nano /etc/ssh/sshd_config
```

Cari dan ubah baris berikut:

```
PasswordAuthentication no
PermitRootLogin prohibit-password
```

Restart SSH:

```bash
systemctl restart sshd
```

> **PASTIKAN** SSH key kamu sudah terdaftar dan bisa dipakai login sebelum melakukan ini. Kalau salah konfigurasi dan SSH key kamu belum terdaftar, kamu akan terkunci keluar.

### 6.3 Pantau Aktivitas Login Mencurigakan

```bash
# Lihat percobaan login yang gagal
grep "Failed password" /var/log/auth.log | tail -20

# Lihat login yang berhasil
grep "Accepted" /var/log/auth.log | tail -20

# Lihat siapa yang sedang login saat ini
who
```

---

## 7. Ringkasan Lengkap Semua Perintah UFW

Untuk referensi, berikut adalah semua perintah UFW yang penting dalam satu tempat:

```bash
# Status dan info
ufw status                    # Status singkat
ufw status verbose            # Status lengkap dengan rules
ufw status numbered           # Status dengan nomor rule
ufw show added                # Rules yang belum aktif (sebelum enable)

# Aktifkan / matikan
ufw enable                    # Aktifkan firewall
ufw disable                   # Nonaktifkan sementara

# Default policy
ufw default deny incoming     # Blokir semua masuk
ufw default allow outgoing    # Izinkan semua keluar

# Tambah rule
ufw allow 22/tcp              # Allow port tertentu
ufw allow ssh                 # Allow berdasarkan nama service
ufw allow 'Nginx Full'        # Allow berdasarkan app profile
ufw deny 3306/tcp             # Blokir port tertentu secara eksplisit

# Hapus rule
ufw delete allow 8000/tcp     # Hapus berdasarkan definisi
ufw delete 4                  # Hapus berdasarkan nomor

# Reset semua rules (mulai dari awal)
ufw reset
```

---

## 8. Recap Lengkap Seri Belajar VPS dari Nol

Kita sudah menyelesaikan perjalanan panjang ini. Mari kita lihat apa saja yang sudah kamu pelajari dan bangun dari nol:

### Part 1 — Fondasi

- Memahami apa itu VPS dan bedanya dengan shared hosting dan cPanel
- Cara connect ke VPS via SSH
- Perintah-perintah Linux dasar
- Konsep permission, user, dan keamanan dasar

### Part 2 — Setup Server

- Install dan konfigurasi **Nginx** sebagai web server
- Install **PHP 7.4 dan 8.2** secara bersamaan dengan semua extension yang dibutuhkan
- Install **Node.js** dalam dua versi menggunakan **nvm**
- Install **Composer** untuk manajemen package PHP

### Part 3 — Database

- Install dan amankan **MySQL** dengan `mysql_secure_installation`
- Membuat **user MySQL** dengan prinsip least privilege
- Membuat **4 database** (production dan staging untuk dua aplikasi)
- Akses database dari laptop via **DataGrip dengan SSH Tunnel**

### Part 4 — Deploy PHP

- Build dan deploy **Laravel Notes** via **WinSCP**
- Konfigurasi **Nginx** untuk Laravel dengan PHP 8.2 FPM
- Jalankan **database migration dan seeder** di production dan staging
- Setup **SSH Key** sebagai deploy key di GitHub/GitLab
- Deploy **CodeIgniter 3 Guestbook** via **Git** (branch `main` = production, `dev` = staging)
- Konfigurasi **Nginx** untuk CI3 dengan PHP 7.4 FPM

### Part 5 — Deploy Node.js

- Build dan deploy **Express.js Books API** (REST API sederhana)
- Build dan deploy **Next.js Profile Page** dengan App Router
- Setup **Nginx sebagai reverse proxy** untuk kedua aplikasi Node.js
- Install dan konfigurasi **PM2** untuk menjaga aplikasi tetap hidup
- Membuat **`ecosystem.config.js`** untuk manajemen terpusat
- Setup **PM2 startup** agar auto-start setelah reboot

### Part 6 — Keamanan

- Setup **UFW Firewall** dengan strategi default deny
- Allow hanya port yang benar-benar dibutuhkan
- Blokir port sensitif (MySQL) dari akses publik
- Tips keamanan tambahan: ganti port SSH, nonaktifkan password auth

### Gambaran Akhir Server Kamu

```
VPS (Ubuntu 22.04)
│
├── Nginx (Web Server + Reverse Proxy)
│   ├── :8000  → Laravel Notes (Production)       [PHP 8.2]
│   ├── :8001  → Laravel Notes (Staging)           [PHP 8.2]
│   ├── :8010  → CI3 Guestbook (Production)        [PHP 7.4]
│   ├── :8011  → CI3 Guestbook (Staging)           [PHP 7.4]
│   ├── :3000  → Express Books API (Production)    [Node.js]
│   ├── :3001  → Express Books API (Staging)       [Node.js]
│   ├── :4000  → Next.js Profile (Production)      [Node.js]
│   └── :4001  → Next.js Profile (Staging)         [Node.js]
│
├── PHP-FPM
│   ├── php7.4-fpm  (untuk CI3)
│   └── php8.2-fpm  (untuk Laravel)
│
├── MySQL
│   ├── laravel_production
│   ├── laravel_staging
│   ├── ci3_production
│   └── ci3_staging
│
├── PM2 (Process Manager)
│   ├── express-production  (:3000)
│   ├── express-staging     (:3001)
│   ├── nextjs-production   (:4000)
│   └── nextjs-staging      (:4001)
│
└── UFW Firewall
    └── Allow: 22, 80, 443, 3000, 3001, 4000, 4001, 8000, 8001, 8010, 8011
```

---

## 9. Apa Selanjutnya?

Kamu sudah punya fondasi yang kuat. Tapi dunia server management sangat luas — masih banyak hal seru yang bisa kamu pelajari setelah ini:

### 🔒 Domain dan SSL/HTTPS

Saat ini kita pakai IP dan port langsung. Di dunia nyata, aplikasi production harusnya punya domain dan HTTPS. Pelajari cara:

- Daftarkan domain dan arahkan DNS ke IP VPS kamu
- Install SSL certificate gratis dengan **Certbot + Let's Encrypt**
- Konfigurasi Nginx untuk redirect HTTP ke HTTPS

### 🚀 CI/CD Pipeline

Saat ini kita deploy manual — pull kode, restart PM2, dan seterusnya. Pelajari cara otomasi ini dengan:

- **GitHub Actions** atau **GitLab CI/CD**
- Buat pipeline yang otomatis deploy setiap kali ada push ke branch `main`

### 📊 Monitoring dan Alerting

Bagaimana kamu tahu kalau aplikasi kamu down di jam 3 pagi? Pelajari:

- **Uptime Kuma** — self-hosted monitoring yang bisa kamu install di VPS sendiri
- **PM2 Plus** — monitoring untuk aplikasi Node.js
- Setup notifikasi via Telegram atau email kalau ada yang down

### 💾 Backup Database

Data adalah segalanya. Pelajari cara:

- Setup **cron job** untuk backup database otomatis setiap hari
- Upload backup ke object storage (seperti Minio, atau cloud storage)
- Test restore backup secara berkala — backup yang tidak pernah ditest sama dengan tidak punya backup

### 🐳 Docker

Setelah paham setup manual seperti yang kita lakukan di seri ini, kamu akan jauh lebih appreciate Docker. Docker mengemas aplikasi beserta semua dependency-nya dalam **container** yang terisolasi — tidak ada lagi masalah "di laptop ku jalan, di server kok nggak".

### 🔄 Load Balancing

Kalau traffic aplikasimu sudah besar dan satu server tidak cukup, pelajari cara setup Nginx sebagai load balancer yang mendistribusikan traffic ke beberapa server.

---

## Penutup

Aku mau jujur — waktu aku pertama kali belajar VPS, aku butuh berminggu-minggu cuma untuk bisa deploy satu aplikasi sederhana. Nggak ada satu tempat yang njelasin semuanya dari awal sampai akhir dengan bahasa yang mudah dipahami.

Seri ini aku tulis supaya kamu tidak perlu melewati kebingungan yang sama. Kalau kamu berhasil mengikuti dari Part 1 sampai Part 6 dan semua 8 aplikasinya jalan — itu bukan hal kecil. Itu bukti bahwa kamu serius belajar dan mau keluar dari zona nyaman.

Beberapa hal yang perlu kamu ingat ke depannya:

**Tidak ada yang langsung berjalan sempurna.** Setiap developer yang berpengalaman sudah pernah terkunci keluar dari server, salah hapus database, atau break production. Yang membedakan bukan apakah kamu pernah membuat kesalahan — tapi seberapa cepat kamu bisa debug dan recovery.

**Dokumentasikan apa yang kamu kerjakan.** Buat catatan untuk diri sendiri — command apa yang kamu jalankan, konfigurasi apa yang kamu ubah. Tiga bulan dari sekarang, kamu akan sangat berterima kasih pada diri sendiri yang rajin mencatat.

**Komunitas itu penting.** Stack Overflow, forum Laravel, komunitas Next.js, grup developer di Telegram atau Discord — jangan malu untuk bertanya. Semua senior developer yang kamu kagumi juga pernah jadi pemula yang kebingungan.

Selamat belajar dan selamat nge-deploy! Semoga seri ini bermanfaat. 🚀

---

_Terima kasih sudah membaca sampai akhir. Kalau seri ini membantu kamu, bagikan ke teman developer lainnya yang mungkin butuh panduan yang sama._

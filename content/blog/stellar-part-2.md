---
title: "Introduction to Stellar Part 2"
date: "Mar 28, 2026"
description: "Introduction to Stellar Part 2"
---

## Membedah Stellar (Part 2): Jembatan Dunia Nyata & Rute Ajaib "Path Payments"

Halo lagi! Selamat datang di Part 2 dari seri "Membedah Stellar".

Di Part 1, kita sudah membahas bagaimana Stellar bekerja sebagai mesin _database_ global yang super cepat dan anti-spam. Tapi, ada satu pertanyaan besar yang tertinggal: _"Bagaimana caranya uang Rupiah lembaran di dompet saya bisa masuk ke dalam database global tersebut?"_

Stellar tidak bisa "mencetak" Rupiah. Oleh karena itu, Stellar membutuhkan pihak ketiga di dunia nyata. Di sinilah kita berkenalan dengan konsep **Anchor**, **Trustline**, dan sihir utama Stellar: **Path Payments**.

Mari kita bedah satu per satu!

## 1. Anchors: Kasir Penghubung Dunia Nyata (API Gateway)

Bagi seorang _software engineer_, kita mengenal istilah _API Gateway_—sebuah pintu masuk yang menghubungkan sistem luar dengan sistem internal kita. Di ekosistem Stellar, pintu masuk ini disebut **Anchor** (Jangkar).

Anchor adalah institusi finansial di dunia nyata (bisa berupa bank, _fintech_, atau dompet digital) yang dipercaya untuk memegang uang fisikmu, lalu menerbitkan versi digitalnya di jaringan Stellar.

**Analogi Sederhananya:**
Bayangkan kamu pergi ke sebuah minimarket (sebut saja Toko A).

1. **Deposit:** Kamu memberikan uang tunai Rp100.000 ke kasir Toko A.
2. **Minting (Pencetakan):** Kasir menyimpannya di brankas toko, lalu mengirimkan saldo digital "Token Rupiah Toko A" ke aplikasimu.
3. **Withdrawal:** Kapan pun kamu butuh uang fisik, kamu tinggal kembalikan token tersebut ke kasir, dan mereka akan mencairkannya kembali menjadi uang tunai.

Tanpa Anchor, jaringan Stellar hanyalah ruang hampa. Anchor-lah yang "menjangkarkan" nilai aset digital ke dunia nyata.

## 2. Trustlines: Fitur "Whitelist" Agar Akun Tidak Kebobolan Sampah

Di banyak jaringan _blockchain_ lain, siapa saja bisa mengirim token apa saja ke alamat dompetmu. Ini sering dimanfaatkan penipu untuk mengirim token palsu atau aset promosi bodong (spam).

Stellar sangat membenci spam. Karena itu, mereka memiliki aturan wajib bernama **Trustline** (Garis Kepercayaan).

Sebagai _programmer_, anggap saja Trustline ini seperti pengaturan _Whitelisting_. Akun Stellar kamu secara _default_ akan **menolak** semua jenis token yang masuk, _kecuali_ token bawaan (XLM).

Jika kamu ingin menerima "Token Rupiah Toko A", kamu harus memencet tombol persetujuan di aplikasimu: _"Saya percaya pada Toko A, dan saya mengizinkan akun saya menerima token dari mereka."_ Tanpa izin ini, dompetmu akan selalu bersih dari aset sampah.

## 3. Path Payments: Sihir Rute Pembayaran Otomatis

Sekarang kita masuk ke fitur yang membuat saya sebagai _engineer_ paling kagum: **Path Payments**.

Mari kita buat studi kasus:
Kamu punya saldo **Rupiah** di aplikasimu. Kamu ingin mentransfer uang ke temanmu di Amerika, yang hanya bisa mencairkan uangnya lewat **Dolar AS**.

Di Stellar, proses ini selesai dalam **3-5 detik**. Bagaimana caranya?

Stellar memiliki fitur **Decentralized Exchange (DEX)**—sebuah bursa penukaran yang tertanam langsung di dalam inti jaringannya. Saat kamu menekan tombol "Kirim", mesin _routing_ Stellar akan otomatis mencari jalan layaknya algoritma _pathfinding_:

1. Kamu menembakkan token **Rupiah**.
2. Mesin DEX secara instan mencari orang di jaringan yang mau menukar **Rupiah** menjadi aset universal (biasanya **XLM**).
3. Kemudian, mesin mencari lagi orang yang mau menukar **XLM** tersebut menjadi **Dolar AS**.
4. Temanmu menerima **Dolar AS** utuh di dompetnya.

Semua proses "jual-beli-tukar" di tengah jalan ini terjadi secara otomatis di belakang layar.

## 4. Evolusi Stellar: Masuknya "Smart Contract" (Soroban)

Sejauh ini, kita melihat Stellar murni sebagai "mesin pemindah uang". Tapi, dunia teknologi terus berkembang. Bagaimana jika kita ingin membuat aturan yang lebih rumit?

Misalnya: _"Saya mau mengirim Rp100.000 ke Budi, TAPI uang itu baru bisa cair jika Budi sudah mengirimkan file desain ke saya."_

Aturan sebab-akibat seperti ini tidak bisa diatasi oleh transfer biasa. Kita membutuhkan **Smart Contract** (Kontrak Pintar).

_Smart Contract_ pada dasarnya adalah **kode program backend** yang diunggah dan dijalankan langsung di dalam jaringan _blockchain_. Kode ini tidak bisa diubah (anti-kecurangan) dan akan mengeksekusi instruksi secara otomatis jika syaratnya terpenuhi.

Untuk menjawab kebutuhan ini, Stellar meluncurkan **Soroban**—platform _Smart Contract_ yang sangat cepat dan ditulis menggunakan bahasa pemrograman modern, **Rust**. Dengan Soroban, Stellar bukan lagi sekadar alat transfer, melainkan sebuah komputer global tempat kita bisa membangun aplikasi Web3 sesungguhnya (seperti lelang desentralisasi, urun dana, hingga sistem _loyalty_).

---

**Kesimpulan Part 2**

Kini kita sudah melihat gambaran utuhnya. Uang masuk lewat **Anchor**, dilindungi oleh **Trustline**, dikirim melintasi negara lewat **Path Payments**, dan kini bisa diatur logikanya menggunakan **Smart Contract (Soroban)**.

Teori sudah lengkap. Di **Part 3 (Terakhir)** nanti, kita akan membuka _code editor_. Kita akan mencoba men- _deploy_ Smart Contract sederhana menggunakan Soroban dan bahasa Rust ke jaringan Stellar. Siapkan terminal kalian, dan sampai jumpa di Part 3!

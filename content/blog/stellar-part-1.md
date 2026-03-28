---
title: "Introduction to Stellar Part 1"
date: "Mar 28, 2026"
description: "Introduction to Stellar Part 1"
---

## Membedah Stellar (Part 1): Arsitektur Dasar & Mesin Jaringan Pembayaran Global

Halo semuanya! Kalau mendengar kata "blockchain" atau "kripto", apa yang pertama kali terlintas di pikiran kalian? Mungkin harga koin yang naik turun tajam, grafik _trading_ yang rumit, atau janji-janji cepat kaya.

Sebagai seorang _software engineer_, saya punya perspektif yang sedikit berbeda. Di balik hiruk-pikuk spekulasi pasar, ada teknologi infrastruktur yang sangat elegan dan memecahkan masalah nyata. Salah satunya adalah **Stellar**.

Hari ini, kita akan membedah Stellar perlahan-lahan. Kita tidak akan bicara soal investasi, melainkan soal **arsitektur sistem**. Bayangkan seri tulisan ini sebagai panduan bedah mesin. Di Part 1 ini, kita akan melihat apa yang sebenarnya ada di balik kap mesin jaringan Stellar.

Mari kita mulai!

## 1. Arsitektur: _Database_ Terpusat vs. _Database_ Global

Untuk memahami jaringan Stellar, kita harus membandingkannya dengan sistem yang sudah biasa kita pakai. Di Indonesia, kita sangat terbantu dengan layanan seperti BI-FAST. Kita bisa mengirim uang dari Bank A ke Bank B secara instan dengan biaya murah (Rp2.500).

Tapi, bagaimana cara kerja BI-FAST di balik layar?
Sederhananya, ini adalah sebuah **sistem terpusat**. Ada satu _database_ raksasa di tengah (milik Bank Indonesia) yang mengatur dan mencatat pencatatan saldo. Bank A mengirim pesan ke pusat, pusat memvalidasi, lalu mengubah saldo di Bank B. Sangat efisien, _tapi_ ruang lingkupnya terbatas hanya untuk bank-bank yang terdaftar di dalam satu negara.

**Lalu, bagaimana jika kita ingin mengirim uang ke benua lain?**
Di sinilah letak masalahnya. Sistem perbankan dunia terfragmentasi. Tidak ada satu "Bank Sentral Dunia" yang mencatat semuanya.

Stellar hadir sebagai solusi infrastruktur untuk masalah ini. Alih-alih menggunakan satu _database_ terpusat, Stellar menggunakan arsitektur **buku besar terdesentralisasi (Decentralized Ledger)**. Artinya, _database_ transaksi Stellar disalin dan didistribusikan ke ratusan _server_ (disebut _node_) di seluruh dunia. Siapa pun bisa melihat catatan ini, dan tidak ada satu pun perusahaan atau negara yang memonopoli _database_ tersebut. Stellar bertindak seperti "jalan tol publik" untuk uang.

## 2. Stellar Consensus Protocol (SCP): Sinkronisasi Tanpa "Lemot"

Pertanyaan teknis yang sering muncul: _"Kalau databasenya ada di ratusan server yang berbeda, bagaimana cara mereka tahu saldo mana yang benar? Bagaimana kalau ada yang curang mengubah saldo?"_

Di jaringan Bitcoin, masalah ini diselesaikan dengan sistem _Proof of Work_ (mining). Ribuan komputer berlomba memecahkan teka-teki matematika yang sangat berat untuk memvalidasi transaksi. Kelemahannya? Proses ini memakan waktu lambat (sekitar 10 menit per transaksi) dan memboroskan banyak sekali listrik.

Stellar dirancang untuk sistem pembayaran instan. Menunggu 10 menit di kasir tentu bukan pengalaman yang bagus. Oleh karena itu, Stellar menggunakan algoritma yang disebut **Stellar Consensus Protocol (SCP)**.

Cara kerja SCP jauh lebih ramah lingkungan dan cepat. Daripada berlomba menghitung matematika, _server-server_ (node) di jaringan Stellar saling berkomunikasi dan melakukan **"voting"**. Mereka saling memeriksa catatan transaksi satu sama lain. Jika mayoritas _node_ terpercaya sepakat bahwa _"Ya, Budi memang mengirim Rp100.000 ke Andi"_, maka transaksi itu disahkan dan dicatat selamanya.

Berkat mekanisme mufakat ini, satu transaksi di Stellar hanya membutuhkan waktu **3 hingga 5 detik** untuk selesai dan tersinkronisasi di seluruh dunia.

## 3. XLM (Lumen): "Pulsa" Jaringan, Bukan Saham Gorengan

Setiap kali kita membahas jaringan publik, ada satu ancaman utama: **Spam**.
Jika jalan tol dibuka gratis tanpa gerbang, orang jahil bisa mengirim miliaran mobil kosong untuk membuat jalanan macet total. Sama halnya dengan _database_ publik; jika gratis, peretas bisa membuat jutaan transaksi palsu sampai _server_ Stellar lumpuh.

Di sinilah **Lumen (XLM)** masuk. XLM adalah aset kripto bawaan (_native asset_) dari jaringan Stellar.

Fungsi utama XLM bukanlah untuk ditimbun agar kita cepat kaya, melainkan sebagai **utilitas jaringan (pulsa/tiket masuk)**.

1. **Biaya Transaksi (Gas Fee):** Setiap kali kamu mengirim transaksi di Stellar, kamu harus membayar biaya sebesar 0.00001 XLM. Ini sangat amat murah (jauh di bawah satu Rupiah), pengguna asli tidak akan merasakannya. Tapi bagi _spammer_ yang mau mengirim jutaan transaksi palsu, biaya ini akan membakar kantong mereka.
2. **Saldo Minimum:** Setiap akun di Stellar wajib menyimpan sedikitnya **1 XLM** agar akun tersebut aktif. Tujuannya agar _database_ tidak dipenuhi oleh pembuatan akun-akun palsu yang dibiarkan kosong.

Dalam kacamata _backend_, XLM pada dasarnya adalah mekanisme _Rate Limiting_ alami yang menjaga performa jaringan agar tetap super cepat dan bersih dari sampah digital.

---

**Kesimpulan Part 1**

Sampai di sini, kita sudah memahami bahwa Stellar adalah sebuah mesin _database_ global yang diamankan oleh sistem "voting" antar _server_ (SCP), dan menggunakan token XLM murni sebagai biaya administrasi pencegah antrean panjang.

Namun, jaringan canggih ini tidak akan ada gunanya jika kita tidak bisa memasukkan uang fisik kita ke dalamnya. Bagaimana cara mengubah uang lembaran Rupiah atau Dolar di dompet kita menjadi angka digital di Stellar?

Kita akan membedah proses ajaib tersebut di **Part 2: Jembatan ke Dunia Nyata & Routing Pembayaran**. Sampai jumpa di artikel selanjutnya!

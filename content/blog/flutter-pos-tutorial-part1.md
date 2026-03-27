---
title: "Seri Tutorial Flutter Part 1: Rahasia Performa UI dan Render Object"
date: "Mar 26, 2026"
description: "Seri Tutorial Flutter Part 1: Rahasia Performa UI dan Render Object"
---

> **Seri Tutorial:** Flutter Fundamental Desain & UI Tingkat Lanjut
> **Studi Kasus:** Dashboard Aplikasi Mini Point-of-Sale (POS)
> **Versi Flutter:** 3.41.5
> **Level:** Intermediate (cocok juga untuk pemula yang serius)

Selamat datang di part pertama dari seri tiga bagian ini. Di sini, aku tidak akan langsung melempar kode ke kamu dan menyuruh kamu menjalankannya. Kita akan mulai dari fondasi yang sesungguhnya: **memahami apa yang sebenarnya terjadi di balik layar ketika Flutter menggambar sebuah widget.**

Ini penting karena pemahaman itulah yang akan membuat kamu bisa menulis kode Flutter yang tidak hanya berfungsi, tapi juga **cepat** dan **efisien** — bahkan ketika daftar produk di kasirmu memanjang sampai ratusan item.

---

## Daftar Isi

1. [Kenapa Kita Perlu Bicara Soal Performa?](#1-kenapa-kita-perlu-bicara-soal-performa)
2. [Flutter Menggambar Layar: Tiga Pohon yang Wajib Kamu Tahu](#2-flutter-menggambar-layar-tiga-pohon-yang-wajib-kamu-tahu)
3. [Musuh Performa Nomor Satu: Rebuild yang Tidak Perlu](#3-musuh-performa-nomor-satu-rebuild-yang-tidak-perlu)
4. [Senjata Pertama: Keyword `const`](#4-senjata-pertama-keyword-const)
5. [Senjata Kedua: Memisahkan Widget dengan Benar](#5-senjata-kedua-memisahkan-widget-dengan-benar)
6. [Senjata Ketiga: ListView yang Efisien untuk Daftar Produk Panjang](#6-senjata-ketiga-listview-yang-efisien-untuk-daftar-produk-panjang)
7. [Mengenal Flutter DevTools: Dokter untuk Aplikasimu](#7-mengenal-flutter-devtools-dokter-untuk-aplikasimu)
8. [Studi Kasus: Membangun Halaman Kasir POS yang Sudah Dioptimasi](#8-studi-kasus-membangun-halaman-kasir-pos-yang-sudah-dioptimasi)
9. [Apa yang Akan Kita Lakukan di Part Selanjutnya?](#9-apa-yang-akan-kita-lakukan-di-part-selanjutnya)

---

## 1. Kenapa Kita Perlu Bicara Soal Performa?

Bayangkan kamu adalah seorang kasir di sebuah warung makan yang ramai. Di depanmu ada sebuah tablet yang menjalankan aplikasi POS. Setiap kali pelanggan memesan, kamu mengetuk item di layar. Tapi setiap ketukan, layar terasa "lag" sebentar. Mungkin hanya 50-100 milidetik. Tapi dalam satu hari kerja yang sibuk, itu terasa menjengkelkan.

Itulah masalah performa UI.

Flutter secara default menargetkan **60 frame per detik (FPS)**. Artinya, setiap frame harus selesai digambar dalam waktu maksimal **16 milidetik**. Jika Flutter terlambat menyelesaikan satu frame, layar akan tampak "jank" — gerakan yang tidak mulus, seperti film yang tiba-tiba patah-patah.

Penyebab paling umum dari jank di Flutter adalah satu hal: **widget yang di-rebuild terlalu sering dan tidak perlu.**

---

## 2. Flutter Menggambar Layar: Tiga Pohon yang Wajib Kamu Tahu

Sebelum aku jelaskan cara menghindari rebuild, kamu perlu tahu dulu bagaimana Flutter bekerja. Flutter menggunakan tiga struktur data berbeda untuk mengelola tampilan:

### Widget Tree (Pohon Widget)

Ini adalah kode yang kamu tulis. `Text`, `Column`, `Container` — semua itu adalah widget. Widget di Flutter bersifat **immutable** (tidak bisa diubah). Setiap kali ada perubahan state, Flutter membuat widget baru dari nol.

```
Widget Tree:
MaterialApp
  └── Scaffold
        ├── AppBar
        │     └── Text("Kasir POS")
        └── Column
              ├── Text("Total: Rp 50.000")
              └── ElevatedButton("Bayar")
```

### Element Tree (Pohon Elemen)

Element adalah "perantara" antara Widget dan RenderObject. Flutter membuat Element dari setiap Widget. Element bersifat **mutable** — dia bisa di-update tanpa harus dihancurkan dan dibuat ulang. Element juga yang memegang referensi ke `BuildContext`.

### Render Object Tree (Pohon Render Object)

Inilah yang benar-benar "menggambar" di layar. RenderObject mengerjakan layout (menghitung ukuran dan posisi) dan painting (menggambar pixel ke canvas). Ini adalah lapisan yang paling mahal secara komputasi.

```
Alur kerja Flutter:
[Widget dibuat] --> [Element diupdate] --> [RenderObject menghitung layout] --> [Pixel digambar ke layar]
```

**Poin kuncinya:** Membuat ulang Widget itu murah. Tapi jika update Widget menyebabkan RenderObject harus menghitung ulang layout atau menggambar ulang, itu yang mahal. Tujuan kita adalah **meminimalkan pekerjaan yang jatuh ke level RenderObject.**

---

## 3. Musuh Performa Nomor Satu: Rebuild yang Tidak Perlu

Mari kita lihat contoh kasus nyata. Berikut adalah kode yang sering ditulis oleh pemula (dan bahkan developer berpengalaman yang tidak hati-hati):

```dart
// CONTOH BURUK - Jangan ditiru dulu, baca penjelasannya
class KasirPage extends StatefulWidget {
  const KasirPage({super.key});

  @override
  State<KasirPage> createState() => _KasirPageState();
}

class _KasirPageState extends State<KasirPage> {
  int totalItem = 0;
  double totalHarga = 0;

  void tambahItem(double harga) {
    setState(() {
      totalItem++;
      totalHarga += harga;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        // MASALAH: Setiap kali setState dipanggil, AppBar ini
        // ikut di-rebuild, padahal tidak ada yang berubah di sini!
        title: const Row(
          children: [
            Icon(Icons.store),
            SizedBox(width: 8),
            Text('Kasir POS'),
          ],
        ),
        actions: [
          // MASALAH: Widget ini juga ikut rebuild padahal tidak berubah!
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          // MASALAH: Seluruh daftar produk ini di-rebuild
          // hanya karena total harga berubah!
          DaftarProduk(onTambah: tambahItem),
          // Ini yang sebenarnya berubah:
          RingkasanBelanja(totalItem: totalItem, totalHarga: totalHarga),
        ],
      ),
    );
  }
}
```

**Apa masalahnya?**

Setiap kali `setState()` dipanggil (misalnya karena pengguna menambah satu item), Flutter akan menjalankan ulang method `build()` dari `_KasirPageState`. Ini berarti Flutter akan membuat ulang **semua widget** yang ada di dalam `build()` — termasuk `AppBar`, `DaftarProduk`, dan seterusnya — meskipun yang benar-benar berubah hanyalah `totalItem` dan `totalHarga`.

Bayangkan `DaftarProduk` berisi 100 item. Setiap penambahan satu item ke keranjang belanja akan memicu rebuild 100 widget produk. Ini sangat boros.

---

## 4. Senjata Pertama: Keyword `const`

Keyword `const` adalah cara paling mudah dan efektif untuk meningkatkan performa. Ketika kamu menandai sebuah widget dengan `const`, kamu memberitahu Flutter:

> "Widget ini **tidak akan pernah berubah**. Kamu bisa membuat satu instance dan menggunakannya berulang kali tanpa perlu membuat yang baru."

Flutter akan menggunakan kembali instance widget yang sama alih-alih membuat yang baru setiap kali `build()` dipanggil. Ini menghemat alokasi memori dan menghilangkan beban kerja yang tidak perlu.

**Kapan kamu bisa menggunakan `const`?**

Sebuah widget bisa dijadikan `const` jika:

1. Semua nilai yang dimasukkan ke dalamnya juga bersifat konstanta (sudah diketahui saat waktu kompilasi).
2. Widget tersebut tidak bergantung pada nilai yang bisa berubah.

```dart
// Contoh penggunaan const yang benar:

// Bisa const: nilainya sudah pasti saat kompilasi
const Text('Kasir POS')
const Icon(Icons.store)
const SizedBox(width: 8)
const EdgeInsets.all(16)

// TIDAK bisa const: nilainya baru diketahui saat runtime
Text('Total: Rp $totalHarga')  // totalHarga adalah variabel
Text(namaKasir)                 // namaKasir berasal dari luar
```

**Tips penting:** Jika kamu menggunakan VS Code atau Android Studio, aktifkan linter `prefer_const_constructors`. Linter ini akan otomatis menunjukkan di mana kamu seharusnya menggunakan `const` tapi belum.

Tambahkan ini ke file `analysis_options.yaml` di root project-mu:

```yaml
# analysis_options.yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    prefer_const_constructors: true
    prefer_const_literals_to_create_immutables: true
    prefer_const_declarations: true
```

---

## 5. Senjata Kedua: Memisahkan Widget dengan Benar

Ini adalah teknik yang lebih "arsitektur" dibanding `const`, tapi dampaknya sangat signifikan. Prinsipnya sederhana:

**Pisahkan bagian UI yang berubah dari bagian UI yang tidak berubah.**

Cara paling mudah adalah dengan memecah widget besar menjadi widget-widget kecil yang lebih mandiri. Khususnya, pisahkan bagian yang memiliki state-nya sendiri ke dalam `StatefulWidget` terpisah.

Mari kita lihat perbedaannya:

**Pendekatan salah (satu `StatefulWidget` besar):**

```
_KasirPageState.build() dipanggil
  --> AppBar di-rebuild (padahal tidak perlu)
  --> DaftarProduk di-rebuild (padahal tidak perlu, 100 item!)
  --> RingkasanBelanja di-rebuild (ini yang seharusnya berubah)
```

**Pendekatan benar (state dibagi ke widget yang tepat):**

```
_RingkasanBelanjaState.build() dipanggil (hanya widget kecil ini!)
  --> Hanya RingkasanBelanja yang di-rebuild
  --> AppBar tidak tersentuh
  --> DaftarProduk tidak tersentuh
```

Tapi tunggu — kalau state dipisahkan ke `RingkasanBelanja`, bagaimana `DaftarProduk` bisa memberi tahu `RingkasanBelanja` bahwa ada item yang ditambahkan?

Jawabannya: gunakan **callback (fungsi yang dioper sebagai parameter)**. Ini adalah pola yang sangat umum di Flutter dan kamu akan sering menemuinya.

```dart
// Widget anak (DaftarProduk) memberitahu parent melalui callback
class DaftarProduk extends StatelessWidget {
  final void Function(String nama, double harga) onItemDitambahkan;

  const DaftarProduk({super.key, required this.onItemDitambahkan});

  // ...
}
```

Untuk state management yang lebih kompleks di aplikasi besar, biasanya developer menggunakan paket seperti `provider`, `riverpod`, atau `bloc`. Tapi untuk tutorial ini, kita akan menggunakan pendekatan callback yang lebih sederhana agar konsep dasarnya jelas terlebih dahulu.

---

## 6. Senjata Ketiga: ListView yang Efisien untuk Daftar Produk Panjang

Ini adalah salah satu optimasi yang paling berdampak besar untuk aplikasi POS.

### Masalah dengan `ListView` biasa

```dart
// JANGAN lakukan ini untuk list yang panjang!
ListView(
  children: produkList.map((produk) => ProdukCard(produk: produk)).toList(),
)
```

Kode di atas akan membuat **semua** widget `ProdukCard` sekaligus saat pertama kali ditampilkan, meskipun hanya 5-6 item yang terlihat di layar. Jika kamu punya 200 produk, Flutter akan membuat 200 widget sekaligus. Ini sangat boros memori dan memperlambat waktu load pertama.

### Solusi: `ListView.builder`

```dart
// LAKUKAN ini untuk list yang panjang
ListView.builder(
  itemCount: produkList.length,
  itemBuilder: (context, index) {
    return ProdukCard(produk: produkList[index]);
  },
)
```

`ListView.builder` adalah **lazy list** — dia hanya membuat widget untuk item yang **saat ini terlihat di layar** (ditambah sedikit buffer). Ketika pengguna scroll ke bawah, item di atas dihancurkan dan item baru dibuat. Ini jauh lebih hemat memori.

Perbandingan sederhana:

| Cara               | 200 produk, scroll ke tengah | Penggunaan Memori |
| ------------------ | ---------------------------- | ----------------- |
| `ListView` biasa   | Buat 200 widget              | Tinggi            |
| `ListView.builder` | Buat ~10-15 widget saja      | Rendah            |

### Senjata tambahan: `itemExtent`

Jika semua item dalam listmu memiliki tinggi yang sama (misalnya semua `ProdukCard` tingginya 72 pixel), tambahkan properti `itemExtent`:

```dart
ListView.builder(
  itemCount: produkList.length,
  itemExtent: 72.0, // tinggi setiap item, dalam pixel
  itemBuilder: (context, index) {
    return ProdukCard(produk: produkList[index]);
  },
)
```

Dengan `itemExtent`, Flutter tidak perlu lagi mengukur tinggi setiap item satu per satu untuk menghitung posisi scroll. Dia langsung menghitung secara matematis. Ini membuat scrolling terasa lebih halus, terutama untuk list yang sangat panjang.

---

## 7. Mengenal Flutter DevTools: Dokter untuk Aplikasimu

Sebelum kita masuk ke kode utama, aku ingin mengenalkan alat yang akan menjadi sahabat terbaikmu dalam urusan optimasi performa: **Flutter DevTools**.

DevTools adalah suite alat debugging dan profiling yang disertakan langsung bersama Flutter SDK. Kamu tidak perlu menginstall apa pun.

### Cara Membuka DevTools

**Di VS Code:**

1. Jalankan aplikasimu dalam mode debug (`F5` atau `flutter run`)
2. Buka Command Palette (`Ctrl+Shift+P` atau `Cmd+Shift+P`)
3. Ketik `Flutter: Open DevTools`
4. Browser akan otomatis terbuka

**Di Terminal:**

```bash
flutter run
# Setelah aplikasi berjalan, tekan 'v' di terminal
# atau jalankan:
flutter pub global activate devtools
flutter pub global run devtools
```

### Fitur yang Paling Penting untuk Kita: Widget Rebuild Stats

Di DevTools, buka tab **"Performance"**. Di sana ada satu fitur yang sangat berguna: **"Track Widget Rebuilds"**.

Ketika fitur ini aktif, setiap widget yang di-rebuild akan ditandai dengan kotak berwarna merah di layar aplikasimu. Semakin sering sebuah widget di-rebuild, semakin terang warna merahnya.

Cara menggunakannya:

1. Buka tab **Performance** di DevTools
2. Centang **"Track Widget Rebuilds"**
3. Lakukan interaksi di aplikasimu (misalnya tambah item ke keranjang)
4. Lihat widget mana yang menyala merah — widget itulah yang perlu kamu optimasi

### Fitur Lain yang Perlu Kamu Ketahui

**Widget Inspector:** Menampilkan widget tree secara visual dan interaktif. Kamu bisa klik widget mana saja di layar dan langsung melihat propertinya di panel kiri.

**Memory Tab:** Menampilkan penggunaan memori aplikasimu dari waktu ke waktu. Berguna untuk mendeteksi memory leak.

Untuk tutorial ini, fokus saja dulu pada Track Widget Rebuilds. Itu sudah cukup untuk merasakan manfaat langsung dari optimasi yang kita lakukan.

---

## 8. Studi Kasus: Membangun Halaman Kasir POS yang Sudah Dioptimasi

Sekarang saatnya kita buat kodenya. Kita akan membangun halaman kasir POS yang menerapkan semua prinsip yang sudah kita pelajari:

1. Penggunaan `const` di mana pun memungkinkan
2. Pemisahan widget yang tepat untuk menghindari rebuild berlebih
3. `ListView.builder` dengan `itemExtent` untuk daftar produk

Struktur file yang akan kita buat:

```
lib/
  main.dart
  models/
    produk.dart
    item_keranjang.dart
  screens/
    kasir_screen.dart
  widgets/
    produk_card.dart
    keranjang_panel.dart
    ringkasan_total.dart
    header_kasir.dart
```

### Langkah 1: Buat Model Data

Pertama, buat folder `models` di dalam folder `lib`. Lalu buat dua file model.

**`lib/models/produk.dart`**

```dart
// lib/models/produk.dart

class Produk {
  final String id;
  final String nama;
  final double harga;
  final String kategori;
  final String ikon; // Kita pakai emoji sebagai pengganti gambar

  const Produk({
    required this.id,
    required this.nama,
    required this.harga,
    required this.kategori,
    required this.ikon,
  });
}

// Data dummy untuk keperluan tutorial
// Di aplikasi nyata, data ini berasal dari database
final List<Produk> daftarProdukDummy = [
  const Produk(id: 'P001', nama: 'Nasi Goreng', harga: 25000, kategori: 'Makanan', ikon: ''),
  const Produk(id: 'P002', nama: 'Mie Ayam', harga: 20000, kategori: 'Makanan', ikon: ''),
  const Produk(id: 'P003', nama: 'Es Teh Manis', harga: 5000, kategori: 'Minuman', ikon: ''),
  const Produk(id: 'P004', nama: 'Jus Alpukat', harga: 18000, kategori: 'Minuman', ikon: ''),
  const Produk(id: 'P005', nama: 'Soto Ayam', harga: 22000, kategori: 'Makanan', ikon: ''),
  const Produk(id: 'P006', nama: 'Bakso', harga: 20000, kategori: 'Makanan', ikon: ''),
  const Produk(id: 'P007', nama: 'Ayam Geprek', harga: 28000, kategori: 'Makanan', ikon: ''),
  const Produk(id: 'P008', nama: 'Air Mineral', harga: 5000, kategori: 'Minuman', ikon: ''),
  const Produk(id: 'P009', nama: 'Kopi Hitam', harga: 8000, kategori: 'Minuman', ikon: ''),
  const Produk(id: 'P010', nama: 'Cappuccino', harga: 22000, kategori: 'Minuman', ikon: ''),
  const Produk(id: 'P011', nama: 'Pisang Goreng', harga: 12000, kategori: 'Snack', ikon: ''),
  const Produk(id: 'P012', nama: 'Singkong Goreng', harga: 10000, kategori: 'Snack', ikon: ''),
  const Produk(id: 'P013', nama: 'Tempe Goreng', harga: 8000, kategori: 'Snack', ikon: ''),
  const Produk(id: 'P014', nama: 'Gado-Gado', harga: 18000, kategori: 'Makanan', ikon: ''),
  const Produk(id: 'P015', nama: 'Lontong Sayur', harga: 15000, kategori: 'Makanan', ikon: ''),
  const Produk(id: 'P016', nama: 'Teh Botol', harga: 7000, kategori: 'Minuman', ikon: ''),
  const Produk(id: 'P017', nama: 'Sprite', harga: 8000, kategori: 'Minuman', ikon: ''),
  const Produk(id: 'P018', nama: 'Kerupuk', harga: 3000, kategori: 'Snack', ikon: ''),
  const Produk(id: 'P019', nama: 'Pecel Lele', harga: 25000, kategori: 'Makanan', ikon: ''),
  const Produk(id: 'P020', nama: 'Pindang Tongkol', harga: 23000, kategori: 'Makanan', ikon: ''),
];
```

**`lib/models/item_keranjang.dart`**

```dart
// lib/models/item_keranjang.dart

import 'produk.dart';

class ItemKeranjang {
  final Produk produk;
  int jumlah;

  ItemKeranjang({
    required this.produk,
    this.jumlah = 1,
  });

  double get subtotal => produk.harga * jumlah;
}
```

### Langkah 2: Buat Widget-Widget Kecil

Buat folder `widgets` di dalam `lib`.

**`lib/widgets/header_kasir.dart`**

Widget ini tidak akan pernah berubah selama sesi kasir, jadi kita akan membuatnya semandiri mungkin.

```dart
// lib/widgets/header_kasir.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

// Perhatikan: ini adalah StatelessWidget
// Karena tidak ada state di sini, Flutter tidak perlu
// membuat instance baru dari widget ini saat state parent berubah
class HeaderKasir extends StatelessWidget {
  const HeaderKasir({super.key});

  @override
  Widget build(BuildContext context) {
    // DateFormat membutuhkan intl package
    // Tambahkan: flutter pub add intl
    final tanggalSekarang = DateFormat('EEEE, dd MMMM yyyy', 'id_ID')
        .format(DateTime.now());

    return Container(
      color: const Color(0xFF1A1A2E),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          // Semua widget di sini menggunakan const karena nilainya tetap
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF16213E),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.point_of_sale,
              color: Color(0xFF0F3460),
              size: 28,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Warung Maju Jaya',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  tanggalSekarang,
                  style: const TextStyle(
                    color: Color(0xFF8892B0),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          // Badge nama kasir
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF0F3460),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.person, color: Colors.white, size: 14),
                SizedBox(width: 6),
                Text(
                  'Budi',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

> **Catatan:** Kita menggunakan package `intl` untuk memformat tanggal. Jalankan `flutter pub add intl` di terminal project-mu.

**`lib/widgets/produk_card.dart`**

```dart
// lib/widgets/produk_card.dart

import 'package:flutter/material.dart';
import '../models/produk.dart';
import 'package:intl/intl.dart';

// Formatter mata uang - dibuat sekali di luar class
// agar tidak perlu membuat instance baru setiap kali widget di-rebuild
final _formatRupiah = NumberFormat.currency(
  locale: 'id_ID',
  symbol: 'Rp ',
  decimalDigits: 0,
);

class ProdukCard extends StatelessWidget {
  final Produk produk;
  final VoidCallback onTambah;

  const ProdukCard({
    super.key,
    required this.produk,
    required this.onTambah,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF16213E),
      // Kita wrap dengan Material agar InkWell bisa bekerja dengan baik
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTambah,
        borderRadius: BorderRadius.circular(12),
        splashColor: const Color(0xFF0F3460).withOpacity(0.3),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              // Ikon produk dalam container bulat
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFF1A1A2E),
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Text(
                  produk.ikon,
                  style: const TextStyle(fontSize: 22),
                ),
              ),
              const SizedBox(width: 12),
              // Nama dan kategori produk
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      produk.nama,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      produk.kategori,
                      style: const TextStyle(
                        color: Color(0xFF8892B0),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              // Harga dan tombol tambah
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _formatRupiah.format(produk.harga),
                    style: const TextStyle(
                      color: Color(0xFF64FFDA),
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Color(0xFF0F3460),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.add,
                      size: 14,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

**`lib/widgets/keranjang_panel.dart`**

```dart
// lib/widgets/keranjang_panel.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/item_keranjang.dart';

final _formatRupiah = NumberFormat.currency(
  locale: 'id_ID',
  symbol: 'Rp ',
  decimalDigits: 0,
);

class KeranjangPanel extends StatelessWidget {
  final List<ItemKeranjang> items;
  final void Function(ItemKeranjang item, int perubahan) onUbahJumlah;
  final void Function(ItemKeranjang item) onHapus;

  const KeranjangPanel({
    super.key,
    required this.items,
    required this.onUbahJumlah,
    required this.onHapus,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Expanded(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.shopping_cart_outlined,
                size: 48,
                color: Color(0xFF4A5568),
              ),
              SizedBox(height: 12),
              Text(
                'Keranjang kosong',
                style: TextStyle(
                  color: Color(0xFF4A5568),
                  fontSize: 14,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Ketuk produk untuk menambahkan',
                style: TextStyle(
                  color: Color(0xFF4A5568),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Expanded(
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: items.length,
        // itemExtent tidak kita gunakan di sini karena tinggi item keranjang
        // bisa bervariasi (nama produk yang panjang bisa wrap)
        separatorBuilder: (_, __) => const Divider(
          color: Color(0xFF1A1A2E),
          height: 1,
        ),
        itemBuilder: (context, index) {
          final item = items[index];
          return _ItemKeranjangTile(
            key: ValueKey(item.produk.id), // Key penting untuk efisiensi list!
            item: item,
            onUbahJumlah: onUbahJumlah,
            onHapus: onHapus,
          );
        },
      ),
    );
  }
}

// Widget private untuk satu baris item di keranjang
// Dipisahkan agar bisa menggunakan key dengan tepat
class _ItemKeranjangTile extends StatelessWidget {
  final ItemKeranjang item;
  final void Function(ItemKeranjang, int) onUbahJumlah;
  final void Function(ItemKeranjang) onHapus;

  const _ItemKeranjangTile({
    super.key,
    required this.item,
    required this.onUbahJumlah,
    required this.onHapus,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Text(item.produk.ikon, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.produk.nama,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  _formatRupiah.format(item.produk.harga),
                  style: const TextStyle(
                    color: Color(0xFF8892B0),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          // Kontrol jumlah
          Row(
            children: [
              _TombolJumlah(
                ikon: Icons.remove,
                onTap: () => onUbahJumlah(item, -1),
              ),
              Container(
                width: 32,
                alignment: Alignment.center,
                child: Text(
                  '${item.jumlah}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              _TombolJumlah(
                ikon: Icons.add,
                onTap: () => onUbahJumlah(item, 1),
              ),
            ],
          ),
          const SizedBox(width: 10),
          // Subtotal
          SizedBox(
            width: 70,
            child: Text(
              _formatRupiah.format(item.subtotal),
              style: const TextStyle(
                color: Color(0xFF64FFDA),
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.right,
            ),
          ),
          const SizedBox(width: 8),
          // Tombol hapus
          GestureDetector(
            onTap: () => onHapus(item),
            child: const Icon(
              Icons.close,
              size: 16,
              color: Color(0xFF4A5568),
            ),
          ),
        ],
      ),
    );
  }
}

// Widget kecil untuk tombol + dan -
// Dipisahkan dan bisa jadi const karena nilainya tetap
class _TombolJumlah extends StatelessWidget {
  final IconData ikon;
  final VoidCallback onTap;

  const _TombolJumlah({required this.ikon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 26,
        height: 26,
        decoration: BoxDecoration(
          color: const Color(0xFF16213E),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: const Color(0xFF0F3460)),
        ),
        child: Icon(ikon, size: 14, color: const Color(0xFF64FFDA)),
      ),
    );
  }
}
```

**`lib/widgets/ringkasan_total.dart`**

Widget ini adalah yang paling sering di-rebuild (karena menampilkan total yang berubah), tapi sekarang sudah terisolasi sehingga tidak mengganggu widget lain.

```dart
// lib/widgets/ringkasan_total.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

final _formatRupiah = NumberFormat.currency(
  locale: 'id_ID',
  symbol: 'Rp ',
  decimalDigits: 0,
);

class RingkasanTotal extends StatelessWidget {
  final int totalItem;
  final double totalHarga;
  final VoidCallback onBayar;
  final VoidCallback onReset;

  const RingkasanTotal({
    super.key,
    required this.totalItem,
    required this.totalHarga,
    required this.onBayar,
    required this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    final pajak = totalHarga * 0.1;
    final grandTotal = totalHarga + pajak;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFF16213E),
        border: Border(
          top: BorderSide(color: Color(0xFF0F3460), width: 1),
        ),
      ),
      child: Column(
        children: [
          // Baris ringkasan harga
          _BarisTotalItem(
            label: 'Subtotal ($totalItem item)',
            nilai: _formatRupiah.format(totalHarga),
          ),
          const SizedBox(height: 6),
          _BarisTotalItem(
            label: 'Pajak (10%)',
            nilai: _formatRupiah.format(pajak),
            warnaNilai: const Color(0xFFFFB74D),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Divider(color: Color(0xFF0F3460)),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'TOTAL',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  letterSpacing: 1,
                ),
              ),
              Text(
                _formatRupiah.format(grandTotal),
                style: const TextStyle(
                  color: Color(0xFF64FFDA),
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Tombol aksi
          Row(
            children: [
              // Tombol reset
              Expanded(
                flex: 1,
                child: OutlinedButton.icon(
                  onPressed: totalItem > 0 ? onReset : null,
                  icon: const Icon(Icons.delete_outline, size: 16),
                  label: const Text('Reset'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFFC5C7D),
                    side: const BorderSide(color: Color(0xFFFC5C7D)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              // Tombol bayar
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: totalItem > 0 ? onBayar : null,
                  icon: const Icon(Icons.payment, size: 16),
                  label: const Text(
                    'BAYAR',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF64FFDA),
                    foregroundColor: const Color(0xFF0A0A1A),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Widget kecil untuk satu baris ringkasan harga
class _BarisTotalItem extends StatelessWidget {
  final String label;
  final String nilai;
  final Color warnaNilai;

  const _BarisTotalItem({
    required this.label,
    required this.nilai,
    this.warnaNilai = const Color(0xFF8892B0),
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF8892B0),
            fontSize: 13,
          ),
        ),
        Text(
          nilai,
          style: TextStyle(
            color: warnaNilai,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
```

### Langkah 3: Buat Screen Utama Kasir

**`lib/screens/kasir_screen.dart`**

```dart
// lib/screens/kasir_screen.dart

import 'package:flutter/material.dart';
import '../models/produk.dart';
import '../models/item_keranjang.dart';
import '../widgets/header_kasir.dart';
import '../widgets/produk_card.dart';
import '../widgets/keranjang_panel.dart';
import '../widgets/ringkasan_total.dart';

class KasirScreen extends StatefulWidget {
  const KasirScreen({super.key});

  @override
  State<KasirScreen> createState() => _KasirScreenState();
}

class _KasirScreenState extends State<KasirScreen> {
  // State utama: daftar item di keranjang
  final List<ItemKeranjang> _keranjang = [];

  // Cached getters untuk menghindari kalkulasi berulang
  // di setiap pemanggilan build
  double get _totalHarga =>
      _keranjang.fold(0, (sum, item) => sum + item.subtotal);

  int get _totalItem =>
      _keranjang.fold(0, (sum, item) => sum + item.jumlah);

  // --- Logika Bisnis ---

  void _tambahkeProdukKeKeranjang(Produk produk) {
    setState(() {
      final indexExisting = _keranjang.indexWhere(
        (item) => item.produk.id == produk.id,
      );

      if (indexExisting != -1) {
        // Produk sudah ada, tambah jumlahnya
        _keranjang[indexExisting].jumlah++;
      } else {
        // Produk baru, tambahkan ke daftar
        _keranjang.add(ItemKeranjang(produk: produk));
      }
    });
  }

  void _ubahJumlahItem(ItemKeranjang item, int perubahan) {
    setState(() {
      final index = _keranjang.indexOf(item);
      if (index == -1) return;

      final jumlahBaru = _keranjang[index].jumlah + perubahan;
      if (jumlahBaru <= 0) {
        _keranjang.removeAt(index);
      } else {
        _keranjang[index].jumlah = jumlahBaru;
      }
    });
  }

  void _hapusItem(ItemKeranjang item) {
    setState(() {
      _keranjang.remove(item);
    });
  }

  void _resetKeranjang() {
    setState(() {
      _keranjang.clear();
    });
  }

  void _prosesPermbayaran() {
    // Di Part 2, kita akan mengganti ini dengan dialog platform-aware
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Transaksi berhasil diproses!'),
        backgroundColor: Color(0xFF64FFDA),
      ),
    );
    _resetKeranjang();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A1A),
      body: SafeArea(
        child: Column(
          children: [
            // Header tidak pernah rebuild karena ia StatelessWidget
            // dan tidak menerima nilai dari state manapun
            const HeaderKasir(),
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Panel Kiri: Daftar Produk (60% lebar layar)
                  Expanded(
                    flex: 6,
                    child: _PanelDaftarProduk(
                      // Kita mengoper fungsi callback, bukan state langsung
                      onProdukDipilih: _tambahkeProdukKeKeranjang,
                    ),
                  ),
                  // Divider vertikal
                  const VerticalDivider(
                    width: 1,
                    color: Color(0xFF1A1A2E),
                  ),
                  // Panel Kanan: Keranjang Belanja (40% lebar layar)
                  Expanded(
                    flex: 4,
                    child: _PanelKeranjang(
                      keranjang: _keranjang,
                      totalItem: _totalItem,
                      totalHarga: _totalHarga,
                      onUbahJumlah: _ubahJumlahItem,
                      onHapus: _hapusItem,
                      onBayar: _prosesPermbayaran,
                      onReset: _resetKeranjang,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// --- Widget Private untuk Panel Kiri ---
//
// KENAPA dibuat widget terpisah dan bukan langsung di build() di atas?
//
// Karena dengan memisahkannya ke class sendiri, _PanelDaftarProduk
// hanya akan di-rebuild jika prop-nya berubah (yaitu onProdukDipilih).
// Fungsi callback ini tidak berubah (didefinisikan di State, bukan di build),
// jadi praktisnya _PanelDaftarProduk TIDAK AKAN PERNAH di-rebuild
// karena perubahan keranjang!
//
// Bandingkan jika kita tulis langsung di build() di atas:
// setiap setState() dari _KasirScreenState akan memaksa semua
// kode di build() berjalan ulang, termasuk bagian daftar produk.

class _PanelDaftarProduk extends StatelessWidget {
  final void Function(Produk) onProdukDipilih;

  const _PanelDaftarProduk({required this.onProdukDipilih});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header panel kiri
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text(
            'MENU',
            style: TextStyle(
              color: Color(0xFF8892B0),
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 2,
            ),
          ),
        ),
        // Search bar (placeholder untuk Part selanjutnya)
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: TextField(
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Cari produk...',
              hintStyle: const TextStyle(color: Color(0xFF4A5568), fontSize: 13),
              prefixIcon: const Icon(Icons.search, color: Color(0xFF4A5568), size: 18),
              filled: true,
              fillColor: const Color(0xFF16213E),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
          ),
        ),
        // Daftar produk menggunakan ListView.builder
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: daftarProdukDummy.length,
            // itemExtent membuat scroll lebih efisien karena
            // Flutter tidak perlu mengukur tinggi setiap item
            itemExtent: 72.0,
            itemBuilder: (context, index) {
              final produk = daftarProdukDummy[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
                // Key membantu Flutter mengidentifikasi widget dengan tepat
                // saat list berubah urutan atau isinya
                child: ProdukCard(
                  key: ValueKey(produk.id),
                  produk: produk,
                  onTambah: () => onProdukDipilih(produk),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// --- Widget Private untuk Panel Kanan ---
//
// Panel ini AKAN di-rebuild setiap kali keranjang berubah,
// tapi itu memang yang kita inginkan karena panel ini
// bertugas menampilkan informasi keranjang.
// Yang penting, rebuild ini tidak lagi menyebar ke panel kiri.

class _PanelKeranjang extends StatelessWidget {
  final List<ItemKeranjang> keranjang;
  final int totalItem;
  final double totalHarga;
  final void Function(ItemKeranjang, int) onUbahJumlah;
  final void Function(ItemKeranjang) onHapus;
  final VoidCallback onBayar;
  final VoidCallback onReset;

  const _PanelKeranjang({
    required this.keranjang,
    required this.totalItem,
    required this.totalHarga,
    required this.onUbahJumlah,
    required this.onHapus,
    required this.onBayar,
    required this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Header panel kanan
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'PESANAN',
                  style: TextStyle(
                    color: Color(0xFF8892B0),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                ),
              ),
              Icon(Icons.receipt_long_outlined, color: Color(0xFF4A5568), size: 18),
            ],
          ),
        ),
        // Daftar item di keranjang
        KeranjangPanel(
          items: keranjang,
          onUbahJumlah: onUbahJumlah,
          onHapus: onHapus,
        ),
        // Ringkasan total dan tombol bayar
        RingkasanTotal(
          totalItem: totalItem,
          totalHarga: totalHarga,
          onBayar: onBayar,
          onReset: onReset,
        ),
      ],
    );
  }
}
```

### Langkah 4: File `main.dart`

Terakhir, update `main.dart` untuk mengkonfigurasi locale dan menjalankan aplikasi.

**`lib/main.dart`**

```dart
// lib/main.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'screens/kasir_screen.dart';

void main() async {
  // Wajib dipanggil sebelum menggunakan plugin atau async di main
  WidgetsFlutterBinding.ensureInitialized();

  // Inisialisasi data locale untuk format tanggal bahasa Indonesia
  await initializeDateFormatting('id_ID', null);

  // Paksa orientasi landscape untuk UI kasir yang menggunakan dua panel
  // Di Part 2, kita akan membuat ini lebih adaptif
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  // Hilangkan status bar agar UI lebih lega di layar kasir
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const POSApp());
}

class POSApp extends StatelessWidget {
  const POSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mini POS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0A0A1A),
        fontFamily: 'Roboto',
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF64FFDA),
          brightness: Brightness.dark,
        ),
        // Kustomisasi divider theme agar konsisten
        dividerTheme: const DividerThemeData(
          color: Color(0xFF1A1A2E),
          thickness: 1,
        ),
        // Kustomisasi snackbar theme
        snackBarTheme: const SnackBarThemeData(
          contentTextStyle: TextStyle(
            color: Color(0xFF0A0A1A),
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      home: const KasirScreen(),
    );
  }
}
```

### Langkah 5: Tambahkan Dependency

Update file `pubspec.yaml`:

```yaml
# pubspec.yaml

name: mini_pos
description: Dashboard Mini POS - Flutter Tutorial Series

publish_to: "none"
version: 1.0.0+1

environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter

  # Untuk formatting tanggal dan mata uang dalam Bahasa Indonesia
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true
```

Setelah update `pubspec.yaml`, jalankan:

```bash
flutter pub get
```

Lalu jalankan aplikasi:

```bash
flutter run
```

---

## 9. Apa yang Akan Kita Lakukan di Part Selanjutnya?

Sejauh ini kita sudah membangun fondasi yang solid: sebuah halaman kasir POS dengan arsitektur yang dioptimasi untuk performa. Kamu bisa membuka Flutter DevTools dan mengaktifkan "Track Widget Rebuilds" — kamu akan melihat bahwa ketika kamu menambahkan produk ke keranjang, hanya panel kanan (keranjang) yang menyala merah. Panel kiri (daftar produk) tetap diam, tidak di-rebuild sama sekali.

**Di Part 2**, kita akan mempermasalahkan sesuatu yang berbeda: pengalaman pengguna berdasarkan platform. Kita akan:

1. Membuat dialog konfirmasi pembayaran yang bentuknya berbeda di Android (Material Design) dan di iOS (Cupertino) — secara otomatis, tanpa perlu kode `if-else` yang berantakan.
2. Membuat layout dashboard kita beradaptasi dengan cerdas: tampilan dua panel yang kita buat sekarang akan tetap ada di landscape (tablet kasir), tapi di portrait (HP karyawan yang ingin melihat laporan), layout akan berubah menjadi satu panel dengan tab navigation yang lebih nyaman.

Sampai jumpa di Part 2!

---

## Referensi Tambahan

- [Flutter Performance Best Practices (flutter.dev)](https://docs.flutter.dev/perf/best-practices)
- [Flutter DevTools (flutter.dev)](https://docs.flutter.dev/tools/devtools/overview)
- [Understanding Widget Rebuilds (YouTube - Flutter)](https://www.youtube.com/watch?v=3ehC7C2gx9I)
- [ListView.builder documentation](https://api.flutter.dev/flutter/widgets/ListView/ListView.builder.html)

---

_Seri Tutorial Flutter: Dashboard POS yang Optimal dan Adaptif_
_Part 1 dari 3 | Ditulis untuk Flutter 3.41.5_

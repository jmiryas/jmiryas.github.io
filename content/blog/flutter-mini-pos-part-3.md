---
title: "Best Practice Flutter Part 3: Dari Arsitektur Clean hingga Multithreading di Aplikasi POS"
date: "Mar 27, 2026"
description: "Best Practice Flutter 3: Dari Arsitektur Clean hingga Multithreading di Aplikasi POS"
---

> Seri Tutorial Flutter: Membangun Aplikasi Mini Point-of-Sale (POS)
> Flutter versi: 3.41.5 | Dart versi: 3.7.x

---

## Daftar Isi

1. [Di Mana Kita Sekarang?](#1-di-mana-kita-sekarang)
2. [Dart adalah Single-Threaded --- dan Itu Bukan Kelemahan](#2-dart-adalah-single-threaded-dan-itu-bukan-kelemahan)
3. [Mengenal Isolate: Thread-nya Dart](#3-mengenal-isolate-thread-nya-dart)
4. [Kapan Harus Pakai Isolate?](#4-kapan-harus-pakai-isolate)
5. [Implementasi: Parsing Ribuan Produk dengan compute()](#5-implementasi-parsing-ribuan-produk-dengan-compute)
6. [Memperbarui ProductService untuk Mendukung Isolate](#6-memperbarui-productservice-untuk-mendukung-isolate)
7. [Mengenal CustomPainter: Menggambar di Canvas Flutter](#7-mengenal-custompainter-menggambar-di-canvas-flutter)
8. [Membangun Struk Belanja dengan CustomPainter](#8-membangun-struk-belanja-dengan-custompainter)
9. [Widget Grafik Ringkasan Penjualan Sederhana](#9-widget-grafik-ringkasan-penjualan-sederhana)
10. [Finalisasi: Kode Lengkap Semua File](#10-finalisasi-kode-lengkap-semua-file)
11. [Penutup dan Langkah Selanjutnya](#11-penutup-dan-langkah-selanjutnya)

---

## 1. Di Mana Kita Sekarang?

Setelah dua part sebelumnya, aplikasi Mini POS kita sudah punya:

- Fondasi arsitektur yang bersih dengan DI via `get_it`
- State management keranjang yang efisien via `Provider`
- Persistensi data dengan `Hive` dan autentikasi aman via `flutter_secure_storage`

Sekarang kita masuk ke materi paling teknis sekaligus paling menarik. Di Part 3 ini kita akan menyelesaikan dua tantangan terakhir:

**Tantangan pertama --- Performa.** Di aplikasi POS yang nyata, katalog produk bisa berisi ribuan item. Kalau kita memuat dan mem-parsing semua data itu di thread utama (UI thread), aplikasi akan freeze beberapa detik --- pengguna tidak bisa scroll, tidak bisa klik tombol, tidak ada response apapun. Ini pengalaman yang sangat buruk. Solusinya adalah `Isolate`.

**Tantangan kedua --- UI yang berkesan.** Widget standar Flutter (Container, Row, Column, Text) sudah cukup untuk membangun UI fungsional. Tapi untuk elemen-elemen yang benar-benar custom --- seperti struk belanja bergaya atau grafik mini --- kita butuh `CustomPainter`: kemampuan menggambar langsung di atas canvas, piksel demi piksel.

Di akhir Part 3, kamu akan punya aplikasi Mini POS yang utuh, performa optimal, dan siap dijadikan referensi proyek nyata.

---

## 2. Dart adalah Single-Threaded --- dan Itu Bukan Kelemahan

Sebelum bicara solusi, kita perlu benar-benar paham masalahnya.

Dart, bahasa yang digunakan Flutter, berjalan di satu thread utama yang disebut **Main Isolate**. Satu thread ini menangani segalanya: menjalankan logika bisnis, merespons input pengguna, dan --- yang paling krusial --- merender frame UI.

Flutter merender UI pada 60fps (atau 120fps di perangkat modern). Artinya thread ini punya waktu sekitar **16 milidetik** untuk menyelesaikan semua pekerjaan sebelum frame berikutnya harus dirender. Kalau ada operasi yang memakan waktu lebih dari 16ms di thread ini, Flutter akan melewatkan frame --- yang terlihat sebagai **jank** (layar berkedip atau animasi yang tidak mulus).

Perhatikan perbedaan ini:

```dart
// OPERASI ASYNC (aman, tidak memblokir UI):
// Future/await hanya menangguhkan eksekusi dan menyerahkan kontrol
// ke event loop. Thread utama tetap bebas merender UI sementara menunggu.
final response = await http.get(Uri.parse('https://api.example.com/products'));

// OPERASI KOMPUTASI BERAT (berbahaya, MEMBLOKIR UI):
// jsonDecode dari string berisi 10.000 item akan berjalan terus-menerus
// di thread utama selama mungkin 500ms+. Selama itu, UI BEKU.
final products = jsonDecode(hugeJsonString); // Ini masalah!
```

`async/await` sering disalahpahami sebagai "multi-threading". Bukan. `async/await` adalah cara Dart mengelola operasi yang **menunggu** (I/O: membaca file, network request) tanpa memblokir thread. Tapi kalau pekerjaannya adalah komputasi murni (kalkulasi, parsing data), tidak ada "menunggu" --- CPU benar-benar sibuk, dan thread utama benar-benar blokir.

---

## 3. Mengenal Isolate: Thread-nya Dart

Solusi Dart untuk komputasi berat adalah **Isolate**. Isolate adalah unit eksekusi yang benar-benar terpisah, punya memory heap sendiri, dan berjalan secara paralel di core CPU yang berbeda.

Yang membuat Isolate unik dibanding thread konvensional di bahasa lain (Java, C++): **Isolate tidak berbagi memori**. Tidak ada shared state, tidak ada race condition, tidak ada mutex. Satu-satunya cara Isolate berkomunikasi adalah dengan mengirim **pesan** (message passing) melalui `SendPort` dan `ReceivePort`.

```
Main Isolate (UI Thread)         Worker Isolate
────────────────────────         ──────────────
[Render UI]          ──data──>  [Parse JSON]
[Handle input]                  [Komputasi berat]
[Animasi smooth]    <──result── [Kirim balik hasil]
```

### compute() --- Isolate yang Ramah Pemula

Menggunakan Isolate raw membutuhkan setup yang cukup verbose: buat `ReceivePort`, buat `SendPort`, kirim pesan, terima pesan. Flutter menyediakan helper function `compute()` dari package `flutter/foundation.dart` yang menyembunyikan semua kerumitan itu.

Cara kerja `compute()`:

1. Kamu berikan sebuah **top-level function** (bukan method dalam class, bukan lambda --- harus top-level atau static)
2. Kamu berikan **satu argumen** untuk function tersebut
3. `compute()` akan menjalankan function itu di Isolate baru
4. Hasilnya dikembalikan sebagai `Future`

Syarat paling penting: function yang dijalankan via `compute()` **harus** berupa top-level function atau static method. Ini karena Isolate baru tidak bisa mengakses memori Isolate lama, jadi function-nya harus bisa di-"serialize" dan dikirim ke Isolate baru.

---

## 4. Kapan Harus Pakai Isolate?

Ini pertanyaan penting. Isolate punya overhead --- membuat Isolate baru, mengirim data, menerima hasil. Untuk operasi yang cepat (kurang dari ~5ms), overhead ini bisa lebih besar dari pekerjaan itu sendiri.

**Gunakan Isolate (via `compute()`) untuk:**

- Parsing JSON yang besar (ratusan/ribuan item)
- Komputasi matematika yang berat (rendering gambar, enkripsi massal)
- Sorting atau filtering terhadap dataset yang sangat besar
- Operasi file yang besar

**Jangan gunakan Isolate untuk:**

- Operasi I/O (network request, baca file) --- gunakan `async/await` saja
- Operasi kecil yang selesai dalam milidetik
- Apapun yang butuh akses ke Flutter widget tree (Isolate tidak bisa menyentuh UI)

---

## 5. Implementasi: Parsing Ribuan Produk dengan compute()

Kita akan mensimulasikan skenario nyata: aplikasi menerima JSON berisi 2.000 produk dari server, lalu harus mem-parsingnya tanpa membekukan UI.

Pertama, kita butuh sebuah **top-level function** yang akan dijalankan di Isolate. Letakkan fungsi ini di luar class manapun, di level file:

```dart
// lib/features/products/data/product_parser.dart

import 'dart:convert';
import 'package:mini_pos/features/products/models/product_model.dart';

// Fungsi ini adalah top-level function --- tidak berada di dalam class apapun.
// WAJIB top-level agar bisa dijalankan via compute().
// Parameter-nya adalah satu String (raw JSON).
// Return value-nya adalah List<Product>.
List<Product> parseProductsInIsolate(String jsonString) {
  // Semua kode di dalam fungsi ini berjalan di Isolate terpisah.
  // Thread utama (UI) tetap bebas dan responsif selama fungsi ini berjalan.

  final List<dynamic> jsonList = jsonDecode(jsonString) as List<dynamic>;

  // map() + toList() untuk mengkonversi setiap JSON object menjadi Product.
  // Ini bisa memakan waktu signifikan untuk ribuan item ---
  // itulah kenapa kita offload ke Isolate.
  return jsonList
      .map((json) => Product.fromJson(json as Map<String, dynamic>))
      .toList();
}

// Fungsi helper untuk men-generate JSON dummy yang besar.
// Di aplikasi nyata, ini akan datang dari response API.
// Kita letakkan di sini agar mudah digunakan dari mana saja.
String generateLargeProductJson(int count) {
  // Daftar template produk yang akan kita variasikan
  final templates = [
    {'name': 'Produk Minuman', 'category': 'Minuman', 'emoji': '🧋'},
    {'name': 'Produk Makanan', 'category': 'Makanan', 'emoji': '🍳'},
    {'name': 'Produk Snack', 'category': 'Snack', 'emoji': '🍪'},
    {'name': 'Produk Dessert', 'category': 'Dessert', 'emoji': '🍰'},
    {'name': 'Produk Frozen', 'category': 'Frozen', 'emoji': '🧊'},
  ];

  final products = List.generate(count, (index) {
    final template = templates[index % templates.length];
    return {
      'id': 'bulk_${index + 1}',
      'name': '${template['name']} ${index + 1}',
      'category': template['category'],
      'price': 5000.0 + (index % 20) * 1000,
      'stock': 10 + (index % 50),
      'imageEmoji': template['emoji'],
    };
  });

  // jsonEncode mengkonversi List<Map> menjadi JSON string.
  return jsonEncode(products);
}
```

Sekarang, buat service baru yang memanfaatkan `compute()`:

```dart
// lib/features/products/data/bulk_product_loader.dart

import 'package:flutter/foundation.dart'; // compute() ada di sini
import 'package:mini_pos/features/products/data/product_parser.dart';
import 'package:mini_pos/features/products/models/product_model.dart';

// BulkProductLoader bertanggung jawab memuat data produk dalam jumlah besar
// secara efisien tanpa membekukan UI.
class BulkProductLoader {
  // Muat dan parse produk dari JSON string secara asinkron di background.
  // Ini adalah method publik yang dipanggil oleh UI atau Provider.
  Future<List<Product>> loadFromJson(String jsonString) async {
    // compute() menerima dua argumen:
    // 1. Top-level function yang akan dijalankan di Isolate baru
    // 2. Satu argumen yang akan di-pass ke function tersebut
    //
    // compute() mengembalikan Future yang selesai saat Isolate selesai bekerja.
    // Selama Isolate bekerja, thread utama tetap bebas sepenuhnya.
    final products = await compute(parseProductsInIsolate, jsonString);
    return products;
  }

  // Method convenience untuk demo: generate JSON dummy lalu parse di Isolate.
  Future<List<Product>> loadDummyProducts(int count) async {
    // generateLargeProductJson berjalan di thread utama --- ini hanya
    // string generation yang relatif cepat, jadi masih aman.
    final jsonString = generateLargeProductJson(count);

    // Parsing-nya yang berat, kita offload ke Isolate.
    return loadFromJson(jsonString);
  }
}
```

---

## 6. Memperbarui ProductService untuk Mendukung Isolate

Kita perbarui `ProductService` agar bisa memuat produk bulk dari Isolate, sekaligus tetap mempertahankan katalog produk lokal dari Part 1:

```dart
// lib/features/products/data/product_service.dart (versi final)

import 'package:mini_pos/features/products/data/bulk_product_loader.dart';
import 'package:mini_pos/features/products/models/product_model.dart';
import 'package:uuid/uuid.dart';

class ProductService {
  final _uuid = const Uuid();
  final _bulkLoader = BulkProductLoader();

  late final List<Product> _localProducts;

  // Flag untuk melacak apakah produk bulk sudah dimuat.
  bool _bulkLoaded = false;
  List<Product> _bulkProducts = [];

  ProductService() {
    _localProducts = _generateDummyProducts();
  }

  // Semua produk: gabungan lokal + bulk (jika sudah dimuat)
  List<Product> getAllProducts() {
    return List.unmodifiable([..._localProducts, ..._bulkProducts]);
  }

  // Muat produk dalam jumlah besar dari background Isolate.
  // Setelah selesai, notifikasi pemanggil via callback agar UI bisa diperbarui.
  Future<void> loadBulkProducts({
    int count = 2000,
    void Function(int loaded)? onComplete,
  }) async {
    if (_bulkLoaded) return; // Hindari memuat ulang jika sudah pernah dimuat

    // Ini berjalan di Isolate terpisah --- UI tidak freeze!
    _bulkProducts = await _bulkLoader.loadDummyProducts(count);
    _bulkLoaded = true;

    onComplete?.call(_bulkProducts.length);
  }

  List<Product> getProductsByCategory(String category) {
    if (category == 'Semua') return getAllProducts();
    return getAllProducts().where((p) => p.category == category).toList();
  }

  List<String> getCategories() {
    final categories = getAllProducts().map((p) => p.category).toSet().toList();
    categories.sort();
    return ['Semua', ...categories];
  }

  List<Product> searchProducts(String query) {
    if (query.isEmpty) return getAllProducts();
    final lowerQuery = query.toLowerCase();
    return getAllProducts()
        .where((p) => p.name.toLowerCase().contains(lowerQuery))
        .toList();
  }

  // Ambil produk dari katalog lokal berdasarkan ID.
  // Digunakan oleh CartStorageService saat restore dari Hive.
  Product? getProductById(String id) {
    try {
      return getAllProducts().firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }

  bool get isBulkLoaded => _bulkLoaded;
  int get bulkProductCount => _bulkProducts.length;

  List<Product> _generateDummyProducts() {
    final rawData = [
      {'name': 'Es Teh Manis', 'category': 'Minuman', 'price': 5000.0, 'stock': 50, 'emoji': '🧋'},
      {'name': 'Kopi Hitam', 'category': 'Minuman', 'price': 8000.0, 'stock': 30, 'emoji': '☕'},
      {'name': 'Jus Jeruk', 'category': 'Minuman', 'price': 12000.0, 'stock': 20, 'emoji': '🍊'},
      {'name': 'Air Mineral', 'category': 'Minuman', 'price': 4000.0, 'stock': 100, 'emoji': '💧'},
      {'name': 'Susu Coklat', 'category': 'Minuman', 'price': 10000.0, 'stock': 25, 'emoji': '🥛'},
      {'name': 'Nasi Goreng', 'category': 'Makanan', 'price': 20000.0, 'stock': 15, 'emoji': '🍳'},
      {'name': 'Mie Ayam', 'category': 'Makanan', 'price': 18000.0, 'stock': 20, 'emoji': '🍜'},
      {'name': 'Gado-gado', 'category': 'Makanan', 'price': 15000.0, 'stock': 10, 'emoji': '🥗'},
      {'name': 'Soto Ayam', 'category': 'Makanan', 'price': 22000.0, 'stock': 12, 'emoji': '🍲'},
      {'name': 'Roti Bakar', 'category': 'Makanan', 'price': 14000.0, 'stock': 30, 'emoji': '🍞'},
      {'name': 'Keripik Singkong', 'category': 'Snack', 'price': 7000.0, 'stock': 40, 'emoji': '🥨'},
      {'name': 'Pisang Goreng', 'category': 'Snack', 'price': 9000.0, 'stock': 25, 'emoji': '🍌'},
      {'name': 'Donat', 'category': 'Snack', 'price': 6000.0, 'stock': 35, 'emoji': '🍩'},
      {'name': 'Martabak Mini', 'category': 'Snack', 'price': 11000.0, 'stock': 15, 'emoji': '🥞'},
    ];

    return rawData.map((data) {
      return Product(
        id: _uuid.v4(),
        name: data['name'] as String,
        category: data['category'] as String,
        price: data['price'] as double,
        stock: data['stock'] as int,
        imageEmoji: data['emoji'] as String,
      );
    }).toList();
  }
}
```

---

## 7. Mengenal CustomPainter: Menggambar di Canvas Flutter

Selama ini kita membangun UI dengan menyusun widget seperti `Container`, `Row`, `Text`. Cara ini bekerja dengan baik untuk layout standar. Tapi ada kelas UI yang tidak bisa dicapai hanya dengan menyusun widget: grafik dengan kurva bebas, struk belanja bergaya, animasi yang benar-benar custom.

Di situlah `CustomPainter` masuk.

### Cara Kerja CustomPainter

`CustomPainter` adalah interface di mana kamu mengambil alih proses menggambar sepenuhnya. Flutter memberikanmu sebuah `Canvas` (kanvas kosong) dan sebuah `Size` (dimensi area), lalu kamu bebas menggambar apa saja menggunakan `Paint` (seperti kuas) dan berbagai perintah gambar.

```dart
class MyPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Canvas adalah koordinat 2D.
    // (0, 0) adalah pojok kiri atas.
    // (size.width, size.height) adalah pojok kanan bawah.

    final paint = Paint()
      ..color = Colors.blue
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke; // stroke = hanya garis tepinya

    // Contoh: gambar lingkaran di tengah
    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2), // titik pusat
      50, // radius
      paint,
    );
  }

  @override
  bool shouldRepaint(MyPainter oldDelegate) {
    // Kembalikan true jika painter perlu menggambar ulang.
    // Jika data yang kamu gambar tidak berubah, kembalikan false
    // untuk menghindari penggambaran ulang yang tidak perlu.
    return false;
  }
}
```

Untuk menggunakan painter di widget tree:

```dart
CustomPaint(
  painter: MyPainter(),
  size: const Size(300, 200), // atau biarkan parent yang menentukan ukuran
  child: ..., // widget lain bisa diletakkan di atas canvas
)
```

### Perintah Gambar yang Akan Kita Gunakan

| Perintah                                   | Kegunaan                                      |
| ------------------------------------------ | --------------------------------------------- |
| `canvas.drawLine(p1, p2, paint)`           | Gambar garis lurus                            |
| `canvas.drawRect(rect, paint)`             | Gambar persegi panjang                        |
| `canvas.drawRRect(rrect, paint)`           | Gambar persegi dengan sudut membulat          |
| `canvas.drawCircle(center, radius, paint)` | Gambar lingkaran                              |
| `canvas.drawPath(path, paint)`             | Gambar bentuk bebas (kurva, poligon, dll.)    |
| `canvas.drawParagraph(paragraph, offset)`  | Gambar teks (lebih powerful dari Text widget) |

---

## 8. Membangun Struk Belanja dengan CustomPainter

Kita akan membuat struk belanja yang terlihat seperti print dari thermal printer --- dengan garis putus-putus, header bergaya, dan footer yang rapi. Ini tidak bisa dicapai dengan rapi menggunakan widget standar saja.

```dart
// lib/features/cart/presentation/widgets/receipt_painter.dart

import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:mini_pos/features/cart/models/cart_item_model.dart';
import 'package:mini_pos/core/theme/app_theme.dart';

// ReceiptPainter menerima data transaksi dan menggambar struk secara penuh.
class ReceiptPainter extends CustomPainter {
  final List<CartItem> items;
  final double totalPrice;
  final String transactionId;
  final DateTime transactionTime;

  ReceiptPainter({
    required this.items,
    required this.totalPrice,
    required this.transactionId,
    required this.transactionTime,
  });

  // Konstanta visual --- semua dikelola di satu tempat agar mudah disesuaikan.
  static const double _padding = 20.0;
  static const double _lineHeight = 22.0;
  static const double _headerHeight = 80.0;

  @override
  void paint(Canvas canvas, Size size) {
    // Gambar background struk: putih dengan sudut membulat.
    _drawBackground(canvas, size);

    double currentY = _padding;

    // Gambar setiap bagian struk dari atas ke bawah.
    currentY = _drawHeader(canvas, size, currentY);
    currentY = _drawDivider(canvas, size, currentY, dashed: false);
    currentY = _drawTransactionInfo(canvas, size, currentY);
    currentY = _drawDivider(canvas, size, currentY, dashed: true);
    currentY = _drawItemsHeader(canvas, size, currentY);
    currentY = _drawDivider(canvas, size, currentY, dashed: true);
    currentY = _drawItems(canvas, size, currentY);
    currentY = _drawDivider(canvas, size, currentY, dashed: true);
    currentY = _drawTotal(canvas, size, currentY);
    currentY = _drawDivider(canvas, size, currentY, dashed: false);
    _drawFooter(canvas, size, currentY);
  }

  void _drawBackground(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.white;
    final rect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      const Radius.circular(12),
    );
    canvas.drawRRect(rect, paint);

    // Efek "gigi" di sisi kanan untuk nuansa struk printer thermal
    _drawPerforatedEdge(canvas, size);
  }

  // Gambar efek lubang perforasi seperti struk kertas asli.
  void _drawPerforatedEdge(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primary // Warna background aplikasi
      ..style = PaintingStyle.fill;

    const double holeRadius = 4.0;
    const double spacing = 14.0;
    double y = spacing;

    // Gambar lubang kecil di sisi kiri dan kanan secara berulang
    while (y < size.height - spacing) {
      // Sisi kiri
      canvas.drawCircle(Offset(0, y), holeRadius, paint);
      // Sisi kanan
      canvas.drawCircle(Offset(size.width, y), holeRadius, paint);
      y += spacing;
    }
  }

  double _drawHeader(Canvas canvas, Size size, double y) {
    // Logo teks "MINI POS" dengan gaya bold besar
    _drawText(
      canvas,
      text: 'MINI POS',
      x: size.width / 2,
      y: y + 10,
      fontSize: 22,
      fontWeight: FontWeight.bold,
      color: AppColors.primary,
      align: TextAlign.center,
      maxWidth: size.width - _padding * 2,
    );

    _drawText(
      canvas,
      text: 'Kasir Digital Terpercaya',
      x: size.width / 2,
      y: y + 38,
      fontSize: 10,
      color: Colors.grey.shade600,
      align: TextAlign.center,
      maxWidth: size.width - _padding * 2,
    );

    return y + _headerHeight;
  }

  double _drawTransactionInfo(Canvas canvas, Size size, double y) {
    final dateStr =
        '${transactionTime.day.toString().padLeft(2, '0')}/'
        '${transactionTime.month.toString().padLeft(2, '0')}/'
        '${transactionTime.year}';
    final timeStr =
        '${transactionTime.hour.toString().padLeft(2, '0')}:'
        '${transactionTime.minute.toString().padLeft(2, '0')}';

    // Baris No. Transaksi
    _drawKeyValue(canvas, size, y, 'No. Transaksi', transactionId);
    _drawKeyValue(canvas, size, y + _lineHeight, 'Tanggal', dateStr);
    _drawKeyValue(canvas, size, y + _lineHeight * 2, 'Waktu', timeStr);
    _drawKeyValue(
        canvas, size, y + _lineHeight * 3, 'Kasir', 'kasir');

    return y + _lineHeight * 4 + 8;
  }

  double _drawItemsHeader(Canvas canvas, Size size, double y) {
    // Header kolom tabel
    _drawText(
      canvas,
      text: 'Item',
      x: _padding,
      y: y + 4,
      fontSize: 10,
      fontWeight: FontWeight.bold,
      color: Colors.grey.shade700,
      maxWidth: size.width * 0.4,
    );
    _drawText(
      canvas,
      text: 'Qty',
      x: size.width * 0.6,
      y: y + 4,
      fontSize: 10,
      fontWeight: FontWeight.bold,
      color: Colors.grey.shade700,
      align: TextAlign.center,
      maxWidth: 40,
    );
    _drawText(
      canvas,
      text: 'Harga',
      x: size.width - _padding,
      y: y + 4,
      fontSize: 10,
      fontWeight: FontWeight.bold,
      color: Colors.grey.shade700,
      align: TextAlign.right,
      maxWidth: size.width * 0.3,
    );

    return y + _lineHeight;
  }

  double _drawItems(Canvas canvas, Size size, double y) {
    for (final item in items) {
      // Nama produk (dengan emoji)
      _drawText(
        canvas,
        text: '${item.product.imageEmoji} ${item.product.name}',
        x: _padding,
        y: y,
        fontSize: 11,
        color: AppColors.primary,
        maxWidth: size.width * 0.55,
      );

      // Quantity
      _drawText(
        canvas,
        text: 'x${item.quantity}',
        x: size.width * 0.62,
        y: y,
        fontSize: 11,
        color: Colors.grey.shade600,
        align: TextAlign.center,
        maxWidth: 40,
      );

      // Subtotal
      _drawText(
        canvas,
        text: 'Rp ${_formatPrice(item.subtotal)}',
        x: size.width - _padding,
        y: y,
        fontSize: 11,
        color: AppColors.primary,
        align: TextAlign.right,
        maxWidth: size.width * 0.3,
      );

      y += _lineHeight;
    }
    return y + 4;
  }

  double _drawTotal(Canvas canvas, Size size, double y) {
    // Highlight box untuk total
    final highlightPaint = Paint()
      ..color = AppColors.accent.withAlpha(15)
      ..style = PaintingStyle.fill;

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
            _padding - 4, y - 4, size.width - _padding * 2 + 8, 36),
        const Radius.circular(6),
      ),
      highlightPaint,
    );

    _drawText(
      canvas,
      text: 'TOTAL',
      x: _padding,
      y: y + 6,
      fontSize: 14,
      fontWeight: FontWeight.bold,
      color: AppColors.primary,
      maxWidth: size.width * 0.5,
    );

    _drawText(
      canvas,
      text: 'Rp ${_formatPrice(totalPrice)}',
      x: size.width - _padding,
      y: y + 6,
      fontSize: 16,
      fontWeight: FontWeight.bold,
      color: AppColors.accent,
      align: TextAlign.right,
      maxWidth: size.width * 0.5,
    );

    return y + 44;
  }

  void _drawFooter(Canvas canvas, Size size, double y) {
    _drawText(
      canvas,
      text: 'Terima kasih telah berbelanja!',
      x: size.width / 2,
      y: y + 8,
      fontSize: 11,
      color: Colors.grey.shade600,
      align: TextAlign.center,
      maxWidth: size.width - _padding * 2,
    );

    // Garis dekoratif bawah
    final decorPaint = Paint()
      ..color = AppColors.accent
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final startX = size.width / 2 - 40;
    final endX = size.width / 2 + 40;
    canvas.drawLine(
      Offset(startX, y + 28),
      Offset(endX, y + 28),
      decorPaint,
    );
  }

  // Helper: gambar garis pemisah, bisa solid atau putus-putus.
  double _drawDivider(Canvas canvas, Size size, double y, {required bool dashed}) {
    final paint = Paint()
      ..color = Colors.grey.shade300
      ..strokeWidth = 1;

    if (!dashed) {
      // Garis solid biasa
      canvas.drawLine(
        Offset(_padding, y + 6),
        Offset(size.width - _padding, y + 6),
        paint,
      );
    } else {
      // Garis putus-putus: gambar segmen kecil dengan jarak antar segmen
      const dashWidth = 5.0;
      const dashSpace = 3.0;
      double x = _padding;
      while (x < size.width - _padding) {
        canvas.drawLine(
          Offset(x, y + 6),
          Offset(x + dashWidth, y + 6),
          paint,
        );
        x += dashWidth + dashSpace;
      }
    }

    return y + 16;
  }

  // Helper: gambar pasangan key-value dalam satu baris (kiri-kanan).
  void _drawKeyValue(Canvas canvas, Size size, double y, String key, String value) {
    _drawText(
      canvas,
      text: key,
      x: _padding,
      y: y,
      fontSize: 10,
      color: Colors.grey.shade600,
      maxWidth: size.width * 0.5,
    );
    _drawText(
      canvas,
      text: value,
      x: size.width - _padding,
      y: y,
      fontSize: 10,
      fontWeight: FontWeight.w600,
      color: AppColors.primary,
      align: TextAlign.right,
      maxWidth: size.width * 0.5,
    );
  }

  // Helper utama untuk menggambar teks di canvas.
  // Lebih verbose dari Text widget, tapi memberikan kontrol penuh
  // atas posisi, alignment, dan gaya teks.
  void _drawText(
    Canvas canvas, {
    required String text,
    required double x,
    required double y,
    required double fontSize,
    FontWeight fontWeight = FontWeight.normal,
    Color color = Colors.black,
    TextAlign align = TextAlign.left,
    required double maxWidth,
  }) {
    // ParagraphBuilder adalah API lower-level untuk membuat teks di canvas.
    // Lebih powerful dari TextPainter untuk kasus seperti ini.
    final paragraphStyle = ui.ParagraphStyle(
      textAlign: align,
      maxLines: 1,
      ellipsis: '...',
    );

    final textStyle = ui.TextStyle(
      color: color,
      fontSize: fontSize,
      fontWeight: fontWeight,
    );

    final builder = ui.ParagraphBuilder(paragraphStyle)
      ..pushStyle(textStyle)
      ..addText(text);

    final paragraph = builder.build()
      ..layout(ui.ParagraphConstraints(width: maxWidth));

    // Hitung offset X berdasarkan alignment
    double offsetX;
    switch (align) {
      case TextAlign.center:
        offsetX = x - maxWidth / 2;
        break;
      case TextAlign.right:
        offsetX = x - maxWidth;
        break;
      default:
        offsetX = x;
    }

    canvas.drawParagraph(paragraph, Offset(offsetX, y));
  }

  // Helper format angka harga
  String _formatPrice(double price) {
    final intPrice = price.toInt().toString();
    final buffer = StringBuffer();
    for (int i = 0; i < intPrice.length; i++) {
      if (i > 0 && (intPrice.length - i) % 3 == 0) buffer.write('.');
      buffer.write(intPrice[i]);
    }
    return buffer.toString();
  }

  @override
  bool shouldRepaint(ReceiptPainter oldDelegate) {
    // Gambar ulang hanya kalau data transaksi berubah.
    // Perbandingan cukup dengan transactionId karena itu unik per transaksi.
    return oldDelegate.transactionId != transactionId;
  }
}
```

Sekarang buat widget yang menggunakan painter ini di dalam sebuah dialog:

```dart
// lib/features/cart/presentation/widgets/receipt_dialog.dart

import 'package:flutter/material.dart';
import 'package:mini_pos/core/theme/app_theme.dart';
import 'package:mini_pos/features/cart/models/cart_item_model.dart';
import 'package:mini_pos/features/cart/presentation/widgets/receipt_painter.dart';

class ReceiptDialog extends StatelessWidget {
  final List<CartItem> items;
  final double totalPrice;

  const ReceiptDialog({
    super.key,
    required this.items,
    required this.totalPrice,
  });

  // Hitung tinggi canvas yang dibutuhkan berdasarkan jumlah item.
  // Ini penting agar struk tidak terpotong.
  double _calculateReceiptHeight() {
    const baseHeight = 340.0;   // Header + info + total + footer
    const itemHeight = 22.0;    // Tinggi per baris item
    return baseHeight + (items.length * itemHeight);
  }

  @override
  Widget build(BuildContext context) {
    final transactionId = 'TXN${DateTime.now().millisecondsSinceEpoch % 100000}';
    final now = DateTime.now();
    final receiptHeight = _calculateReceiptHeight();

    return Dialog(
      backgroundColor: Colors.transparent,
      // Hapus elevation default agar tidak ada shadow kotak di sekitar dialog
      elevation: 0,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Area struk yang bisa di-scroll jika item banyak
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.sizeOf(context).height * 0.75,
              maxWidth: 320,
            ),
            child: SingleChildScrollView(
              child: SizedBox(
                width: 300,
                height: receiptHeight,
                // CustomPaint adalah widget yang mengekspos CustomPainter ke widget tree
                child: CustomPaint(
                  painter: ReceiptPainter(
                    items: items,
                    totalPrice: totalPrice,
                    transactionId: transactionId,
                    transactionTime: now,
                  ),
                  // Size harus diberikan agar CustomPaint tahu seberapa besar area gambar
                  size: Size(300, receiptHeight),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Tombol aksi di bawah struk
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              OutlinedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close),
                label: const Text('Tutup'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.textSecondary,
                  side: const BorderSide(color: AppColors.divider),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                onPressed: () {
                  // Di aplikasi nyata: cetak struk ke printer Bluetooth
                  Navigator.pop(context, true); // true = konfirmasi checkout
                },
                icon: const Icon(Icons.check),
                label: const Text('Selesai'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
```

---

## 9. Widget Grafik Ringkasan Penjualan Sederhana

Sebagai bonus, kita buat widget grafik batang (bar chart) sederhana menggunakan CustomPainter untuk menampilkan ringkasan penjualan per kategori. Ini mendemonstrasikan kekuatan CustomPainter untuk visualisasi data:

```dart
// lib/features/dashboard/presentation/widgets/sales_chart_painter.dart

import 'package:flutter/material.dart';
import 'package:mini_pos/core/theme/app_theme.dart';

// Data untuk satu batang di grafik
class ChartBar {
  final String label;
  final double value;
  final Color color;

  const ChartBar({
    required this.label,
    required this.value,
    required this.color,
  });
}

class SalesChartPainter extends CustomPainter {
  final List<ChartBar> bars;
  final double maxValue;

  SalesChartPainter({required this.bars})
    : maxValue = bars.isEmpty
        ? 1
        : bars.map((b) => b.value).reduce((a, b) => a > b ? a : b);

  @override
  void paint(Canvas canvas, Size size) {
    if (bars.isEmpty) return;

    const double paddingLeft = 8.0;
    const double paddingBottom = 24.0;   // Ruang untuk label sumbu X
    const double paddingTop = 8.0;

    final chartWidth = size.width - paddingLeft;
    final chartHeight = size.height - paddingBottom - paddingTop;
    final barWidth = chartWidth / bars.length;
    const barPadding = 6.0;

    for (int i = 0; i < bars.length; i++) {
      final bar = bars[i];
      // Normalisasi tinggi batang: nilai / nilai_maksimum * tinggi_chart
      final normalizedHeight = (bar.value / maxValue) * chartHeight;
      final left = paddingLeft + i * barWidth + barPadding;
      final barW = barWidth - barPadding * 2;
      final top = paddingTop + (chartHeight - normalizedHeight);

      // Gambar batang dengan gradient warna
      final barRect = Rect.fromLTWH(left, top, barW, normalizedHeight);
      final gradient = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          bar.color,
          bar.color.withAlpha(180),
        ],
      );

      final paint = Paint()
        ..shader = gradient.createShader(barRect)
        ..style = PaintingStyle.fill;

      // Batang dengan sudut membulat di atas saja
      final rrect = RRect.fromRectAndCorners(
        barRect,
        topLeft: const Radius.circular(4),
        topRight: const Radius.circular(4),
      );
      canvas.drawRRect(rrect, paint);

      // Label nilai di atas batang
      if (normalizedHeight > 20) {
        _drawCenteredText(
          canvas,
          text: bar.value.toInt().toString(),
          centerX: left + barW / 2,
          y: top - 14,
          fontSize: 9,
          color: bar.color,
          fontWeight: FontWeight.bold,
        );
      }

      // Label kategori di bawah batang
      _drawCenteredText(
        canvas,
        text: bar.label,
        centerX: left + barW / 2,
        y: size.height - paddingBottom + 4,
        fontSize: 8,
        color: AppColors.textSecondary,
        maxWidth: barWidth,
      );
    }

    // Garis baseline (sumbu X)
    final baselinePaint = Paint()
      ..color = AppColors.divider
      ..strokeWidth = 1;
    canvas.drawLine(
      Offset(paddingLeft, size.height - paddingBottom),
      Offset(size.width, size.height - paddingBottom),
      baselinePaint,
    );
  }

  void _drawCenteredText(
    Canvas canvas, {
    required String text,
    required double centerX,
    required double y,
    required double fontSize,
    Color color = Colors.white,
    FontWeight fontWeight = FontWeight.normal,
    double? maxWidth,
  }) {
    final tp = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: color,
          fontSize: fontSize,
          fontWeight: fontWeight,
        ),
      ),
      textDirection: TextDirection.ltr,
      maxLines: 1,
    );
    tp.layout(maxWidth: maxWidth ?? 100);
    tp.paint(canvas, Offset(centerX - tp.width / 2, y));
  }

  @override
  bool shouldRepaint(SalesChartPainter oldDelegate) {
    return oldDelegate.bars != bars;
  }
}

// Widget pembungkus yang mudah digunakan dari mana saja
class SalesChartWidget extends StatelessWidget {
  final List<ChartBar> bars;
  final String title;
  final double height;

  const SalesChartWidget({
    super.key,
    required this.bars,
    required this.title,
    this.height = 120,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: height,
            child: CustomPaint(
              painter: SalesChartPainter(bars: bars),
              size: Size.infinite, // Gunakan ukuran parent (SizedBox di atas)
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 10. Finalisasi: Kode Lengkap Semua File

Bagian ini adalah muara dari seluruh seri tutorial. Semua file ditulis ulang dalam bentuk final yang bersih --- siap copy-paste, siap run.

### Struktur Folder Final

```
lib/
├── core/
│   ├── constants/
│   │   └── app_constants.dart
│   ├── di/
│   │   └── service_locator.dart
│   └── theme/
│       └── app_theme.dart
│
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   └── auth_service.dart
│   │   └── presentation/
│   │       ├── login_screen.dart
│   │       └── splash_screen.dart
│   │
│   ├── cart/
│   │   ├── data/
│   │   │   └── cart_storage_service.dart
│   │   ├── models/
│   │   │   └── cart_item_model.dart
│   │   ├── presentation/
│   │   │   └── widgets/
│   │   │       ├── receipt_dialog.dart
│   │   │       └── receipt_painter.dart
│   │   └── providers/
│   │       └── cart_provider.dart
│   │
│   ├── dashboard/
│   │   └── presentation/
│   │       ├── dashboard_screen.dart
│   │       └── widgets/
│   │           ├── cart_panel.dart
│   │           ├── product_card.dart
│   │           ├── product_grid.dart
│   │           └── sales_chart_painter.dart
│   │
│   └── products/
│       ├── data/
│       │   ├── bulk_product_loader.dart
│       │   ├── product_parser.dart
│       │   └── product_service.dart
│       └── models/
│           └── product_model.dart
│
└── main.dart
```

### DashboardScreen Final dengan Isolate + Receipt

`DashboardScreen` di Part 3 mengintegrasikan tiga hal baru: trigger loading produk bulk via Isolate, menampilkan `ReceiptDialog` saat checkout, dan menampilkan grafik ringkasan:

```dart
// lib/features/dashboard/presentation/dashboard_screen.dart (versi FINAL)

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mini_pos/core/constants/app_constants.dart';
import 'package:mini_pos/core/di/service_locator.dart';
import 'package:mini_pos/core/theme/app_theme.dart';
import 'package:mini_pos/features/auth/data/auth_service.dart';
import 'package:mini_pos/features/auth/presentation/login_screen.dart';
import 'package:mini_pos/features/cart/presentation/widgets/receipt_dialog.dart';
import 'package:mini_pos/features/cart/providers/cart_provider.dart';
import 'package:mini_pos/features/dashboard/presentation/widgets/cart_panel.dart';
import 'package:mini_pos/features/dashboard/presentation/widgets/product_grid.dart';
import 'package:mini_pos/features/dashboard/presentation/widgets/sales_chart_painter.dart';
import 'package:mini_pos/features/products/data/product_service.dart';
import 'package:mini_pos/features/products/models/product_model.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _showCartOnMobile = false;

  // State untuk loading produk bulk via Isolate
  bool _isLoadingBulk = false;
  int _bulkLoadedCount = 0;

  final _authService = getIt<AuthService>();
  final _productService = getIt<ProductService>();

  @override
  void initState() {
    super.initState();
    // Mulai loading produk bulk di background segera setelah layar terbuka.
    // compute() di dalam loadBulkProducts() memastikan UI tidak freeze
    // meski kita memuat 2000 produk.
    _loadBulkProductsInBackground();
  }

  Future<void> _loadBulkProductsInBackground() async {
    setState(() => _isLoadingBulk = true);

    // Ini memanggil compute() di dalam --- thread utama bebas sepenuhnya!
    await _productService.loadBulkProducts(
      count: 2000,
      onComplete: (loaded) {
        if (mounted) {
          setState(() {
            _isLoadingBulk = false;
            _bulkLoadedCount = loaded;
          });
        }
      },
    );
  }

  void _handleProductSelected(Product product) {
    context.read<CartProvider>().addProduct(product);
    if (MediaQuery.sizeOf(context).width < AppConstants.tabletBreakpoint) {
      setState(() => _showCartOnMobile = true);
    }
  }

  Future<void> _handleCheckout() async {
    final cart = context.read<CartProvider>();
    if (cart.isEmpty) return;

    // Ambil snapshot items sebelum clear, untuk ditampilkan di struk.
    final itemsSnapshot = List.from(cart.items);
    final totalSnapshot = cart.totalPrice;

    // Tampilkan dialog struk yang digambar dengan CustomPainter.
    // showDialog mengembalikan nilai yang di-pop oleh Navigator.pop(context, value).
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false, // Paksa pengguna untuk memilih tombol
      builder: (_) => ReceiptDialog(
        items: itemsSnapshot.cast(),
        totalPrice: totalSnapshot,
      ),
    );

    // Kalau pengguna menekan "Selesai" (confirmed == true), bersihkan keranjang.
    if (confirmed == true && mounted) {
      context.read<CartProvider>().clearCart();
      setState(() => _showCartOnMobile = false);

      // Snackbar konfirmasi
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Transaksi selesai! Total: Rp ${_formatTotal(totalSnapshot)}',
          ),
          backgroundColor: AppColors.accentGreen,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  Future<void> _handleLogout() async {
    await _authService.logout();
    if (!mounted) return;
    context.read<CartProvider>().clearCart();
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isTablet = screenWidth >= AppConstants.tabletBreakpoint;

    return Scaffold(
      appBar: _buildAppBar(),
      body: isTablet ? _buildTabletLayout() : _buildMobileLayout(),
      floatingActionButton: isTablet ? null : _buildCartFab(),
    );
  }

  AppBar _buildAppBar() {
    return AppBar(
      title: Row(
        children: [
          const Icon(Icons.point_of_sale, color: AppColors.accent, size: 24),
          const SizedBox(width: 8),
          const Text(AppConstants.appName),
          const SizedBox(width: 8),
          // Indicator loading Isolate --- muncul saat produk bulk sedang dimuat.
          // UI tetap responsif penuh saat indicator ini terlihat!
          if (_isLoadingBulk)
            const SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(
                strokeWidth: 1.5,
                color: AppColors.accentAmber,
              ),
            )
          else if (_bulkLoadedCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.accentGreen.withAlpha(40),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '+$_bulkLoadedCount produk',
                style: const TextStyle(
                  color: AppColors.accentGreen,
                  fontSize: 10,
                ),
              ),
            ),
          const Spacer(),
          Text(
            'Halo, ${_authService.currentUserName ?? 'Kasir'}',
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
              fontWeight: FontWeight.normal,
            ),
          ),
        ],
      ),
      actions: [
        Consumer<CartProvider>(
          builder: (context, cart, _) {
            return Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.shopping_cart_outlined),
                  onPressed: () {
                    if (MediaQuery.sizeOf(context).width <
                        AppConstants.tabletBreakpoint) {
                      setState(() => _showCartOnMobile = !_showCartOnMobile);
                    }
                  },
                ),
                if (cart.totalItems > 0)
                  Positioned(
                    right: 6,
                    top: 6,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: AppColors.accent,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        '${cart.totalItems}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
        IconButton(
          icon: const Icon(Icons.bar_chart_outlined),
          tooltip: 'Ringkasan',
          onPressed: _showSalesChart,
        ),
        IconButton(
          icon: const Icon(Icons.logout),
          tooltip: 'Keluar',
          onPressed: _handleLogout,
        ),
      ],
    );
  }

  // Tampilkan bottom sheet dengan grafik ringkasan menggunakan CustomPainter
  void _showSalesChart() {
    final cart = context.read<CartProvider>();

    // Hitung penjualan per kategori dari isi keranjang saat ini
    final Map<String, int> categorySales = {};
    for (final item in cart.items) {
      final cat = item.product.category;
      categorySales[cat] = (categorySales[cat] ?? 0) + item.quantity;
    }

    // Warna untuk setiap kategori
    final categoryColors = [
      AppColors.accent,
      AppColors.accentGreen,
      AppColors.accentAmber,
      const Color(0xFF4FC3F7),
      const Color(0xFFCE93D8),
    ];

    final bars = categorySales.entries.toList().asMap().entries.map((entry) {
      final idx = entry.key;
      final kv = entry.value;
      return ChartBar(
        label: kv.key,
        value: kv.value.toDouble(),
        color: categoryColors[idx % categoryColors.length],
      );
    }).toList();

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.secondary,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ringkasan Keranjang Saat Ini',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            bars.isEmpty
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'Keranjang masih kosong.\nTambahkan produk untuk melihat grafik.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    ),
                  )
                : SalesChartWidget(
                    bars: bars,
                    title: 'Item per Kategori',
                    height: 140,
                  ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildTabletLayout() {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: ProductGrid(onProductSelected: _handleProductSelected),
        ),
        SizedBox(
          width: 320,
          child: CartPanel(onCheckout: _handleCheckout),
        ),
      ],
    );
  }

  Widget _buildMobileLayout() {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 250),
      child: _showCartOnMobile
          ? CartPanel(
              key: const ValueKey('cart'),
              onCheckout: _handleCheckout,
            )
          : ProductGrid(
              key: const ValueKey('products'),
              onProductSelected: _handleProductSelected,
            ),
    );
  }

  Widget _buildCartFab() {
    return Consumer<CartProvider>(
      builder: (context, cart, _) {
        return FloatingActionButton.extended(
          onPressed: () =>
              setState(() => _showCartOnMobile = !_showCartOnMobile),
          backgroundColor: AppColors.accent,
          icon: Icon(
              _showCartOnMobile ? Icons.grid_view : Icons.shopping_cart),
          label: Text(
            _showCartOnMobile
                ? 'Lihat Produk'
                : 'Keranjang (${cart.totalItems})',
          ),
        );
      },
    );
  }

  String _formatTotal(double total) {
    final intTotal = total.toInt().toString();
    final buffer = StringBuffer();
    for (int i = 0; i < intTotal.length; i++) {
      if (i > 0 && (intTotal.length - i) % 3 == 0) buffer.write('.');
      buffer.write(intTotal[i]);
    }
    return buffer.toString();
  }
}
```

### File Final: service_locator.dart

Daftarkan `BulkProductLoader` juga agar tersedia via DI:

```dart
// lib/core/di/service_locator.dart (versi FINAL)

import 'package:get_it/get_it.dart';
import 'package:mini_pos/features/auth/data/auth_service.dart';
import 'package:mini_pos/features/cart/data/cart_storage_service.dart';
import 'package:mini_pos/features/cart/providers/cart_provider.dart';
import 'package:mini_pos/features/products/data/bulk_product_loader.dart';
import 'package:mini_pos/features/products/data/product_service.dart';

final GetIt getIt = GetIt.instance;

Future<void> setupServiceLocator() async {
  // Inisialisasi Hive sebelum service apapun yang membutuhkannya
  await CartStorageService.initialize();

  // ProductService: tidak bergantung pada service lain
  getIt.registerLazySingleton<ProductService>(() => ProductService());

  // BulkProductLoader: tool terpisah untuk parsing di Isolate
  getIt.registerLazySingleton<BulkProductLoader>(() => BulkProductLoader());

  // CartStorageService: bergantung pada ProductService
  getIt.registerLazySingleton<CartStorageService>(
    () => CartStorageService(productService: getIt<ProductService>()),
  );

  // CartProvider: bergantung pada CartStorageService
  // Didaftarkan sebagai registerSingleton (bukan lazy) karena dibutuhkan
  // segera di SplashScreen untuk restore data dari storage.
  getIt.registerSingleton<CartProvider>(
    CartProvider(storageService: getIt<CartStorageService>()),
  );

  // AuthService: independen, tidak bergantung pada service lain
  getIt.registerLazySingleton<AuthService>(() => AuthService());
}
```

### File Final: pubspec.yaml

Pastikan semua dependensi lengkap dan versinya konsisten:

```yaml
# pubspec.yaml (versi FINAL)

name: mini_pos
description: Aplikasi Mini Point-of-Sale Tutorial - Flutter Series

publish_to: "none"

version: 1.0.0+1

environment:
  sdk: ">=3.7.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter

  # Dependency Injection
  get_it: ^8.0.3

  # State Management
  provider: ^6.1.2

  # Local Storage
  hive_flutter: ^1.1.0

  # Secure Storage (token autentikasi)
  flutter_secure_storage: ^9.2.4

  # UUID generator
  uuid: ^4.5.1

  # Ikon Material
  cupertino_icons: ^1.0.8

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0

flutter:
  uses-material-design: true
```

---

## 11. Penutup dan Langkah Selanjutnya

Selamat. Kamu baru saja menyelesaikan seri tutorial tiga part yang membangun aplikasi Mini POS dari nol sampai production-ready. Mari kita lihat apa yang sudah kita pelajari bersama.

### Peta Konsep yang Sudah Kamu Kuasai

**Part 1 --- Fondasi:**

- Feature-first architecture: kode diorganisir berdasarkan fitur, bukan tipe file
- Dependency Injection dengan `get_it`: komponen tidak saling mengunci
- Immutable data model dengan `copyWith` dan operator `==` yang benar
- UI responsif dengan `LayoutBuilder` yang beradaptasi ke berbagai ukuran layar

**Part 2 --- Alur Data:**

- `ChangeNotifier` + `Provider`: sumber kebenaran tunggal yang efisien
- Perbedaan `context.watch` vs `context.read`: gunakan yang tepat di konteks yang tepat
- Persistensi dengan `Hive`: simpan ID, bukan objek lengkap --- lebih ringan dan selalu fresh
- Autentikasi aman: token hidup di Keystore/Keychain, bukan plain text

**Part 3 --- Performa dan UI Mendalam:**

- Dart adalah single-threaded: `async/await` bukan multithreading
- `Isolate` dan `compute()`: offload komputasi berat ke core CPU lain
- Top-level function sebagai syarat wajib `compute()` dan alasannya
- `CustomPainter`: ambil alih rendering canvas untuk UI yang benar-benar custom
- `shouldRepaint()`: optimasi agar canvas tidak digambar ulang tanpa alasan

### Apa yang Bisa Dikembangkan Selanjutnya?

Aplikasi ini adalah fondasi yang kuat. Berikut beberapa arah pengembangan yang logis:

**Fitur bisnis:**

- Riwayat transaksi: simpan setiap checkout ke Hive dengan timestamp, tampilkan di layar terpisah
- Manajemen stok: kurangi `product.stock` setiap kali item di-checkout, beri notifikasi saat stok menipis
- Laporan harian: aggregate transaksi per hari, tampilkan dengan `SalesChartPainter` yang sudah kita buat
- Printer Bluetooth: integrasikan dengan package `esc_pos_bluetooth` untuk cetak struk fisik

**Kualitas teknis:**

- Unit testing untuk `CartProvider`: verifikasi logika `addProduct`, `decrementProduct`, kalkulasi total
- Widget testing untuk `ProductCard`: pastikan badge muncul dan callback dipanggil dengan benar
- Migrasi ke `Riverpod`: konsepnya mirip Provider tapi lebih compile-safe dan lebih powerful untuk app yang tumbuh
- CI/CD dengan GitHub Actions: otomasi build dan test setiap kali ada push ke repository

**Satu pesan terakhir:**

Arsitektur, state management, Isolate, CustomPainter --- semuanya adalah alat. Alat yang baik tidak menjamin hasil yang baik kalau pemakainya tidak memahami _mengapa_ alat itu digunakan. Tutorial ini sengaja menghabiskan banyak ruang untuk menjelaskan filosofi dan trade-off di balik setiap keputusan desain, bukan hanya menunjukkan _bagaimana_ caranya.

Ke depannya, saat kamu menghadapi keputusan teknis baru, tanyakan selalu: "Apa masalah yang sedang aku selesaikan? Apa trade-off dari solusi ini? Apa yang paling sederhana yang masih bisa bekerja?"

Selamat membangun.

---

> **Kompatibilitas Flutter 3.41.5**: Seluruh kode di seri ini menggunakan API yang stabil dan tidak bergantung pada fitur experimental. `compute()` tetap tersedia dari `flutter/foundation.dart`. `CustomPainter` dan `Canvas` API tidak mengalami breaking change sejak Flutter 2.x. Semua package yang digunakan mendukung Dart 3.7.x.
>
> **Catatan Android Sekuriti**: Untuk `flutter_secure_storage` di Android, tambahkan `android:networkSecurityConfig` di `AndroidManifest.xml` jika aplikasi perlu berkomunikasi dengan server development yang menggunakan HTTP. Untuk produksi, selalu gunakan HTTPS.

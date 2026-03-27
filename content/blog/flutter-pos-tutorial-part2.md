---
title: "Seri Tutorial Flutter Part 2: Platform Awareness dan UI Adaptif"
date: "Mar 26, 2026"
description: "Seri Tutorial Flutter Part 2: Platform Awareness dan UI Adaptif"
---

> **Seri Tutorial:** Flutter Fundamental Desain & UI Tingkat Lanjut
> **Studi Kasus:** Dashboard Aplikasi Mini Point-of-Sale (POS)
> **Versi Flutter:** 3.41.5
> **Prerequisite:** Sudah menyelesaikan Part 1 dan memiliki project yang berjalan

Di Part 1, kita sudah membangun fondasi yang kokoh: halaman kasir dengan arsitektur yang dioptimasi sehingga rebuild widget terisolasi dan tidak menyebar ke mana-mana.

Sekarang, kita naik satu tingkat. Kita akan bicara tentang sesuatu yang sering diabaikan oleh developer Flutter pemula: **bagaimana membuat aplikasi yang terasa "benar" di tangan penggunanya, terlepas dari perangkat apa yang mereka pegang.**

Pengguna Android dan iOS punya kebiasaan yang berbeda. Pengguna tablet dan HP punya kebutuhan tata letak yang berbeda. Di Part ini, kita akan membuat aplikasi POS kita peka terhadap semua perbedaan itu.

---

## Daftar Isi

1. [Masalah "Rasa" yang Sering Diabaikan](#1-masalah-rasa-yang-sering-diabaikan)
2. [Platform Awareness: Mendeteksi OS dengan Benar](#2-platform-awareness-mendeteksi-os-dengan-benar)
3. [Material vs Cupertino: Dua Bahasa Desain](#3-material-vs-cupertino-dua-bahasa-desain)
4. [Membuat Dialog Konfirmasi yang Platform-Aware](#4-membuat-dialog-konfirmasi-yang-platform-aware)
5. [Responsive vs Adaptive: Jangan Tertukar](#5-responsive-vs-adaptive-jangan-tertukar)
6. [Mendeteksi Ukuran Layar dan Orientasi](#6-mendeteksi-ukuran-layar-dan-orientasi)
7. [Membangun Layout Adaptif untuk POS](#7-membangun-layout-adaptif-untuk-pos)
8. [Mengintegrasikan Semua Perubahan](#8-mengintegrasikan-semua-perubahan)
9. [Apa yang Akan Kita Lakukan di Part Selanjutnya?](#9-apa-yang-akan-kita-lakukan-di-part-selanjutnya)

---

## 1. Masalah "Rasa" yang Sering Diabaikan

Pernahkah kamu menggunakan aplikasi Android yang terasa "aneh"? Bukan karena lambat atau jelek, tapi sesuatu yang susah dijelaskan — tombol-tombolnya ada di tempat yang tidak kamu duga, dialognya berperilaku tidak seperti biasanya, atau navigasinya terasa asing.

Kemungkinan besar itu adalah aplikasi iOS yang di-port ke Android (atau sebaliknya) tanpa memperhatikan **konvensi platform**.

Setiap platform punya "bahasa" desain sendiri:

- Pengguna **Android** terbiasa dengan dialog yang tombol aksinya ada di kanan bawah dengan gaya teks datar, tombol navigasi back berbasis sistem, dan elemen-elemen Material Design seperti ripple effect saat disentuh.
- Pengguna **iOS** terbiasa dengan dialog yang tombolnya tersusun vertikal atau horizontal di bagian bawah dengan border pemisah tipis, navigasi berbasis swipe-back dari sisi kiri, dan elemen Cupertino yang terasa lebih "smooth" dan translucent.

Ketika kamu melanggar konvensi ini, pengguna tidak akan bisa menjelaskan masalahnya. Mereka hanya akan merasa: "Aplikasi ini kurang enak dipakai." Dan itu cukup untuk membuat mereka beralih ke kompetitor.

Untuk aplikasi POS kita, skenarinya sangat realistis: pemilik warung mungkin memakai tablet Android murah sebagai mesin kasir, sementara dia sendiri mengecek laporan dari iPhone-nya. Keduanya harus merasa nyaman.

---

## 2. Platform Awareness: Mendeteksi OS dengan Benar

Flutter menyediakan cara yang sangat mudah untuk mendeteksi platform yang sedang dijalankan.

### Menggunakan `Platform` dari `dart:io`

```dart
import 'dart:io';

// Deteksi platform
if (Platform.isAndroid) {
  // Kode khusus Android
}
if (Platform.isIOS) {
  // Kode khusus iOS
}
if (Platform.isMacOS) {
  // Kode khusus macOS
}
// Tersedia juga: Platform.isWindows, Platform.isLinux, Platform.isFuchsia
```

### Menggunakan `Theme.of(context).platform`

Cara kedua ini lebih "Flutter-friendly" karena bekerja melalui sistem widget, bukan langsung dari OS:

```dart
final platform = Theme.of(context).platform;

if (platform == TargetPlatform.android) {
  // Kode khusus Android
}
if (platform == TargetPlatform.iOS) {
  // Kode khusus iOS
}
```

**Mana yang harus dipakai?**

Gunakan `Platform` dari `dart:io` untuk logika bisnis dan pendeteksian umum. Gunakan `Theme.of(context).platform` untuk keputusan UI karena ia bisa di-override melalui tema — ini sangat berguna saat testing dan ketika kamu ingin mensimulasikan tampilan iOS di emulator Android.

**Penting:** `Platform` dari `dart:io` tidak tersedia di Flutter Web. Jika aplikasimu juga menargetkan web, gunakan package `flutter/foundation.dart` dan `defaultTargetPlatform` sebagai gantinya:

```dart
import 'package:flutter/foundation.dart';

final bool isIOS = defaultTargetPlatform == TargetPlatform.iOS;
final bool isAndroid = defaultTargetPlatform == TargetPlatform.android;
```

Untuk tutorial ini (mobile-only), kita akan menggunakan `Theme.of(context).platform` agar kode tetap bersih dan testable.

---

## 3. Material vs Cupertino: Dua Bahasa Desain

Flutter memiliki dua set widget lengkap yang mencerminkan dua bahasa desain berbeda:

**Material Design (Android, Google)**

Widget-widget Material ada di library `package:flutter/material.dart` yang sudah otomatis kita import. Ciri-cirinya: elevation dan shadow, ripple effect saat disentuh, warna-warna yang berani, dan tipografi berbasis Roboto.

Contoh widget Material:

- `AlertDialog` — dialog dengan judul, konten, dan tombol aksi
- `SnackBar` — notifikasi sementara di bawah layar
- `TextField` — input teks dengan label floating
- `ElevatedButton`, `TextButton`, `OutlinedButton`

**Cupertino (iOS, Apple)**

Widget-widget Cupertino ada di library `package:flutter/cupertino.dart` yang perlu diimport secara eksplisit. Ciri-cirinya: blur dan translucency, animasi yang lebih "bouncy", font San Francisco, dan warna-warna yang lebih kalem.

Contoh widget Cupertino:

- `CupertinoAlertDialog` — dialog dengan gaya iOS
- `CupertinoActionSheet` — action sheet dari bawah layar
- `CupertinoTextField` — input teks bergaya iOS
- `CupertinoButton` — tombol bergaya iOS

### Menyandingkan Keduanya

Kamu bisa menggunakan widget Material dan Cupertino dalam satu proyek yang sama. Kuncinya adalah menentukan **kapan** menggunakan yang mana.

Pendekatan yang paling rapi adalah membuat **helper function atau utility class** yang mengembalikan widget yang tepat berdasarkan platform, sehingga kamu tidak perlu menulis `if-else` berulang di setiap tempat.

---

## 4. Membuat Dialog Konfirmasi yang Platform-Aware

Ini adalah fitur utama yang kita bangun di Part 2. Dialog konfirmasi pembayaran — sesuatu yang akan dilihat kasir puluhan kali sehari — harus terasa alami di platform manapun.

Di Android, dialog konfirmasi yang benar tampak seperti ini:

- Memiliki judul dan deskripsi
- Tombol aksi berupa teks datar (TextButton) di kanan bawah
- Tombol "Batal" di kiri, "Konfirmasi" di kanan

Di iOS, dialog konfirmasi yang benar tampak seperti ini:

- Memiliki judul dan deskripsi
- Tombol aksi tersusun horizontal (atau vertikal jika labelnya panjang)
- Ada border tipis memisahkan tombol dari konten
- Aksi destruktif (seperti batal) berwarna merah

Mari kita buat widget dialog yang secara otomatis menampilkan yang tepat:

Buat file baru di `lib/widgets/dialog_konfirmasi_bayar.dart`:

```dart
// lib/widgets/dialog_konfirmasi_bayar.dart

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

final _formatRupiah = NumberFormat.currency(
  locale: 'id_ID',
  symbol: 'Rp ',
  decimalDigits: 0,
);

/// Menampilkan dialog konfirmasi pembayaran yang menyesuaikan platform.
/// Mengembalikan `true` jika pengguna mengonfirmasi, `false` jika membatalkan.
Future<bool> tampilkanDialogKonfirmasiBayar({
  required BuildContext context,
  required int totalItem,
  required double totalHarga,
  required String metodePembayaran,
}) async {
  final platform = Theme.of(context).platform;

  if (platform == TargetPlatform.iOS || platform == TargetPlatform.macOS) {
    return await _tampilkanCupertinoDialog(
      context: context,
      totalItem: totalItem,
      totalHarga: totalHarga,
      metodePembayaran: metodePembayaran,
    );
  } else {
    return await _tampilkanMaterialDialog(
      context: context,
      totalItem: totalItem,
      totalHarga: totalHarga,
      metodePembayaran: metodePembayaran,
    );
  }
}

// -----------------------------------------------------------------------
// MATERIAL DIALOG (Android)
// -----------------------------------------------------------------------

Future<bool> _tampilkanMaterialDialog({
  required BuildContext context,
  required int totalItem,
  required double totalHarga,
  required String metodePembayaran,
}) async {
  final pajak = totalHarga * 0.1;
  final grandTotal = totalHarga + pajak;

  final hasil = await showDialog<bool>(
    context: context,
    barrierDismissible: false, // Harus pilih tombol, tidak bisa klik di luar
    builder: (context) {
      return AlertDialog(
        backgroundColor: const Color(0xFF16213E),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Row(
          children: [
            Icon(Icons.payment, color: Color(0xFF64FFDA), size: 22),
            SizedBox(width: 10),
            Text(
              'Konfirmasi Pembayaran',
              style: TextStyle(
                color: Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Ringkasan transaksi
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF0A0A1A),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: [
                  _BarisMaterial(
                    label: 'Total Item',
                    nilai: '$totalItem item',
                  ),
                  const SizedBox(height: 6),
                  _BarisMaterial(
                    label: 'Subtotal',
                    nilai: _formatRupiah.format(totalHarga),
                  ),
                  const SizedBox(height: 6),
                  _BarisMaterial(
                    label: 'Pajak (10%)',
                    nilai: _formatRupiah.format(pajak),
                  ),
                  const Divider(color: Color(0xFF1A1A2E), height: 16),
                  _BarisMaterial(
                    label: 'TOTAL BAYAR',
                    nilai: _formatRupiah.format(grandTotal),
                    isBold: true,
                    warnaLabel: Colors.white,
                    warnaNilai: const Color(0xFF64FFDA),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            // Metode pembayaran
            Row(
              children: [
                const Icon(
                  Icons.account_balance_wallet_outlined,
                  color: Color(0xFF8892B0),
                  size: 14,
                ),
                const SizedBox(width: 6),
                Text(
                  'Metode: $metodePembayaran',
                  style: const TextStyle(
                    color: Color(0xFF8892B0),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
        // Tombol aksi Material: teks datar, di kanan bawah
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text(
              'Batal',
              style: TextStyle(color: Color(0xFF8892B0)),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF64FFDA),
              foregroundColor: const Color(0xFF0A0A1A),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Proses Bayar',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      );
    },
  );

  return hasil ?? false;
}

// Widget kecil untuk satu baris di dalam dialog Material
class _BarisMaterial extends StatelessWidget {
  final String label;
  final String nilai;
  final bool isBold;
  final Color warnaLabel;
  final Color warnaNilai;

  const _BarisMaterial({
    required this.label,
    required this.nilai,
    this.isBold = false,
    this.warnaLabel = const Color(0xFF8892B0),
    this.warnaNilai = const Color(0xFF8892B0),
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: warnaLabel,
            fontSize: 13,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          nilai,
          style: TextStyle(
            color: warnaNilai,
            fontSize: 13,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}

// -----------------------------------------------------------------------
// CUPERTINO DIALOG (iOS)
// -----------------------------------------------------------------------

Future<bool> _tampilkanCupertinoDialog({
  required BuildContext context,
  required int totalItem,
  required double totalHarga,
  required String metodePembayaran,
}) async {
  final pajak = totalHarga * 0.1;
  final grandTotal = totalHarga + pajak;

  final hasil = await showCupertinoDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (context) {
      return CupertinoAlertDialog(
        title: const Text('Konfirmasi Pembayaran'),
        content: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Column(
            children: [
              // Di iOS, konten dialog biasanya lebih ringkas
              Text(
                '$totalItem item',
                style: const TextStyle(
                  fontSize: 13,
                  color: CupertinoColors.secondaryLabel,
                ),
              ),
              const SizedBox(height: 12),
              // Ringkasan harga bergaya iOS
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: CupertinoColors.systemGrey6,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    _BarisCupertino(
                      label: 'Subtotal',
                      nilai: _formatRupiah.format(totalHarga),
                    ),
                    const SizedBox(height: 4),
                    _BarisCupertino(
                      label: 'Pajak (10%)',
                      nilai: _formatRupiah.format(pajak),
                    ),
                    const Divider(height: 12),
                    _BarisCupertino(
                      label: 'Total Bayar',
                      nilai: _formatRupiah.format(grandTotal),
                      isBold: true,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Metode: $metodePembayaran',
                style: const TextStyle(
                  fontSize: 11,
                  color: CupertinoColors.secondaryLabel,
                ),
              ),
            ],
          ),
        ),
        // Tombol aksi Cupertino: tersusun horizontal dengan border pemisah
        // Urutan: Batal (kiri/atas), Konfirmasi (kanan/bawah)
        actions: [
          CupertinoDialogAction(
            onPressed: () => Navigator.of(context).pop(false),
            // isDestructiveAction membuat teks jadi merah — konvensi iOS
            // untuk aksi yang "membatalkan" atau bisa menyebabkan kehilangan data
            isDestructiveAction: true,
            child: const Text('Batal'),
          ),
          CupertinoDialogAction(
            onPressed: () => Navigator.of(context).pop(true),
            // isDefaultAction membuat teks jadi bold — menandai aksi utama
            isDefaultAction: true,
            child: const Text('Proses Bayar'),
          ),
        ],
      );
    },
  );

  return hasil ?? false;
}

// Widget kecil untuk satu baris di dalam dialog Cupertino
class _BarisCupertino extends StatelessWidget {
  final String label;
  final String nilai;
  final bool isBold;

  const _BarisCupertino({
    required this.label,
    required this.nilai,
    this.isBold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: CupertinoColors.label,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          nilai,
          style: TextStyle(
            fontSize: 12,
            color: isBold
                ? CupertinoColors.activeBlue
                : CupertinoColors.secondaryLabel,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}
```

**Cara menggunakannya di `kasir_screen.dart`:**

Perubahan sederhana pada method `_prosesPermbayaran`:

```dart
// Ganti fungsi _prosesPermbayaran yang lama dengan ini:
void _prosesPermbayaran() async {
  final dikonfirmasi = await tampilkanDialogKonfirmasiBayar(
    context: context,
    totalItem: _totalItem,
    totalHarga: _totalHarga,
    metodePembayaran: 'Tunai',
  );

  if (dikonfirmasi && mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Transaksi berhasil diproses!'),
        backgroundColor: Color(0xFF64FFDA),
      ),
    );
    _resetKeranjang();
  }
}
```

**Catatan penting tentang `mounted`:**

Perhatikan pengecekan `mounted` sebelum menggunakan `context` setelah operasi async. Ini adalah praktik yang wajib. Setelah `await`, ada kemungkinan widget sudah tidak lagi ada di tree (misalnya pengguna berpindah halaman saat dialog terbuka). Menggunakan `context` dari widget yang sudah tidak ada akan menyebabkan error. Pengecekan `mounted` memastikan widget masih aktif sebelum kita lanjutkan.

---

## 5. Responsive vs Adaptive: Jangan Tertukar

Dua istilah ini sering digunakan secara bergantian, padahal artinya berbeda:

**Responsive UI** adalah UI yang mengubah ukuran dan proporsinya secara mulus sesuai ukuran layar. Seperti website yang kolom-kolomnya menyempit ketika jendela browser diperkecil. Konten tetap sama, hanya ukurannya yang berubah.

**Adaptive UI** adalah UI yang benar-benar mengubah **strukturnya** berdasarkan konteks. Bukan sekadar mengubah ukuran, tapi mengganti layout, navigasi, atau bahkan komponen yang digunakan secara fundamental.

Untuk aplikasi POS kita, kita butuh keduanya:

- **Responsive**: ukuran font, padding, dan komponen yang menyesuaikan diri
- **Adaptive**: layout dua-panel untuk landscape/tablet, layout satu-panel untuk portrait/HP

Analoginya begini: bayangkan sebuah warung makan. Di jam sibuk dengan banyak meja terisi, kasir butuh tampilan yang bisa melihat menu dan keranjang sekaligus (dua panel, landscape). Tapi seorang karyawan yang sedang stok opname dengan HP di tangan, butuh tampilan yang nyaman untuk jari ibu jari (satu panel, portrait, tab navigation).

---

## 6. Mendeteksi Ukuran Layar dan Orientasi

Ada beberapa cara untuk mendeteksi ukuran layar di Flutter:

### `MediaQuery`

Ini adalah cara paling umum dan paling fleksibel:

```dart
// Di dalam method build():
final ukuranLayar = MediaQuery.sizeOf(context);
final lebarLayar = ukuranLayar.width;
final tinggiLayar = ukuranLayar.height;

// Mendeteksi orientasi
final orientasi = MediaQuery.orientationOf(context);
final isLandscape = orientasi == Orientation.landscape;
final isPortrait = orientasi == Orientation.portrait;

// Mendeteksi apakah ini "tablet" (umumnya didefinisikan sebagai lebar > 600dp)
final isTablet = lebarLayar > 600;
```

**Tips performa:** Gunakan `MediaQuery.sizeOf(context)` alih-alih `MediaQuery.of(context).size`. Dengan cara ini, widget hanya akan di-rebuild ketika ukuran layar berubah, bukan ketika properti MediaQuery lain berubah (seperti ketika keyboard muncul yang mengubah `viewInsets`).

### Breakpoint yang Umum Digunakan

Tidak ada standar resmi dari Flutter, tapi konvensi yang banyak dipakai adalah:

| Kategori                             | Lebar Layar   | Contoh Perangkat         |
| ------------------------------------ | ------------- | ------------------------ |
| Compact (HP portrait)                | < 600dp       | HP kebanyakan            |
| Medium (HP landscape / tablet kecil) | 600dp - 840dp | iPad Mini, tablet 7"     |
| Expanded (tablet / desktop)          | > 840dp       | iPad, tablet 10", laptop |

Untuk kasus POS kita, kita akan menggunakan breakpoint sederhana:

- Lebar < 600dp atau mode portrait: tampilan satu panel
- Lebar >= 600dp dan mode landscape: tampilan dua panel

### `LayoutBuilder`

Alternatif yang lebih tepat untuk layout adaptif adalah `LayoutBuilder`. Bedanya dengan `MediaQuery`, `LayoutBuilder` memberikan ukuran yang tersedia untuk **widget itu sendiri**, bukan ukuran seluruh layar.

```dart
LayoutBuilder(
  builder: (context, constraints) {
    // constraints.maxWidth adalah lebar yang tersedia untuk widget ini
    if (constraints.maxWidth > 600) {
      return TatakLetakDuaPanel();
    } else {
      return TatakLetakSatuPanel();
    }
  },
)
```

`LayoutBuilder` lebih baik untuk widget yang bisa ditempatkan di berbagai konteks dengan ukuran berbeda-beda. Untuk level screen, `MediaQuery` sudah cukup.

---

## 7. Membangun Layout Adaptif untuk POS

Sekarang kita implementasikan. Layout adaptif kita akan memiliki dua mode:

**Mode Landscape / Tablet (lebar >= 600dp):**
Ini adalah tampilan yang sudah kita buat di Part 1: dua panel bersebelahan, daftar produk di kiri dan keranjang di kanan. Cocok untuk kasir yang menaruh tablet di meja dengan posisi landscape.

**Mode Portrait / HP (lebar < 600dp):**
Tampilan satu halaman dengan dua tab: tab "Menu" untuk memilih produk dan tab "Keranjang" untuk melihat pesanan dan membayar. Cocok untuk karyawan yang menggunakan HP dalam genggaman.

Kita akan merefaktor `kasir_screen.dart` dengan signifikan. Buat file baru `lib/screens/kasir_screen.dart` (timpa yang lama):

```dart
// lib/screens/kasir_screen.dart

import 'package:flutter/material.dart';
import '../models/produk.dart';
import '../models/item_keranjang.dart';
import '../widgets/header_kasir.dart';
import '../widgets/produk_card.dart';
import '../widgets/keranjang_panel.dart';
import '../widgets/ringkasan_total.dart';
import '../widgets/dialog_konfirmasi_bayar.dart';

// Breakpoint: lebar di atas ini dianggap "lebar" (tablet/landscape)
const double _kBreakpointLebar = 600.0;

class KasirScreen extends StatefulWidget {
  const KasirScreen({super.key});

  @override
  State<KasirScreen> createState() => _KasirScreenState();
}

class _KasirScreenState extends State<KasirScreen>
    with SingleTickerProviderStateMixin {
  final List<ItemKeranjang> _keranjang = [];

  // TabController untuk mode portrait (HP)
  // Kita butuh SingleTickerProviderStateMixin untuk ini
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  // --- Getters ---
  double get _totalHarga =>
      _keranjang.fold(0, (sum, item) => sum + item.subtotal);

  int get _totalItem =>
      _keranjang.fold(0, (sum, item) => sum + item.jumlah);

  // --- Logika Bisnis ---

  void _tambahkanProdukKeKeranjang(Produk produk) {
    setState(() {
      final indexExisting = _keranjang.indexWhere(
        (item) => item.produk.id == produk.id,
      );
      if (indexExisting != -1) {
        _keranjang[indexExisting].jumlah++;
      } else {
        _keranjang.add(ItemKeranjang(produk: produk));
      }
    });

    // Di mode portrait: setelah menambahkan item, tampilkan
    // animasi singkat dengan berpindah ke tab keranjang
    // Tapi hanya jika layar sedang dalam mode portrait
    // Kita tangani ini di dalam widget menggunakan callback khusus
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
    setState(() => _keranjang.remove(item));
  }

  void _resetKeranjang() {
    setState(() => _keranjang.clear());
  }

  Future<void> _prosesPermbayaran() async {
    if (_totalItem == 0) return;

    final dikonfirmasi = await tampilkanDialogKonfirmasiBayar(
      context: context,
      totalItem: _totalItem,
      totalHarga: _totalHarga,
      metodePembayaran: 'Tunai',
    );

    // Cek mounted setelah operasi async!
    if (dikonfirmasi && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Transaksi berhasil! Terima kasih.'),
          backgroundColor: Color(0xFF64FFDA),
          behavior: SnackBarBehavior.floating,
        ),
      );
      _resetKeranjang();
      // Setelah bayar, kembali ke tab menu di mode portrait
      _tabController.animateTo(0);
    }
  }

  // --- Build Method ---
  @override
  Widget build(BuildContext context) {
    // Gunakan MediaQuery.sizeOf untuk performa yang lebih baik
    final lebarLayar = MediaQuery.sizeOf(context).width;
    final isLayarLebar = lebarLayar >= _kBreakpointLebar;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A1A),
      body: SafeArea(
        child: Column(
          children: [
            const HeaderKasir(),
            Expanded(
              // Pilih layout berdasarkan lebar layar
              child: isLayarLebar
                  ? _LayoutDuaPanel(
                      keranjang: _keranjang,
                      totalItem: _totalItem,
                      totalHarga: _totalHarga,
                      onProdukDipilih: _tambahkanProdukKeKeranjang,
                      onUbahJumlah: _ubahJumlahItem,
                      onHapus: _hapusItem,
                      onBayar: _prosesPermbayaran,
                      onReset: _resetKeranjang,
                    )
                  : _LayoutSatuPanel(
                      tabController: _tabController,
                      keranjang: _keranjang,
                      totalItem: _totalItem,
                      totalHarga: _totalHarga,
                      onProdukDipilih: (produk) {
                        _tambahkanProdukKeKeranjang(produk);
                        // Setelah tambah produk di mode portrait,
                        // otomatis pindah ke tab keranjang
                        _tabController.animateTo(1);
                      },
                      onUbahJumlah: _ubahJumlahItem,
                      onHapus: _hapusItem,
                      onBayar: _prosesPermbayaran,
                      onReset: _resetKeranjang,
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================
// LAYOUT DUA PANEL (Landscape / Tablet)
// Sama dengan yang kita buat di Part 1, tapi sekarang
// dibungkus dalam widget terpisah yang lebih bersih
// ============================================================

class _LayoutDuaPanel extends StatelessWidget {
  final List<ItemKeranjang> keranjang;
  final int totalItem;
  final double totalHarga;
  final void Function(Produk) onProdukDipilih;
  final void Function(ItemKeranjang, int) onUbahJumlah;
  final void Function(ItemKeranjang) onHapus;
  final VoidCallback onBayar;
  final VoidCallback onReset;

  const _LayoutDuaPanel({
    required this.keranjang,
    required this.totalItem,
    required this.totalHarga,
    required this.onProdukDipilih,
    required this.onUbahJumlah,
    required this.onHapus,
    required this.onBayar,
    required this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Panel Kiri: Daftar Produk (60%)
        Expanded(
          flex: 6,
          child: _PanelDaftarProduk(onProdukDipilih: onProdukDipilih),
        ),
        const VerticalDivider(width: 1, color: Color(0xFF1A1A2E)),
        // Panel Kanan: Keranjang (40%)
        Expanded(
          flex: 4,
          child: _PanelKeranjang(
            keranjang: keranjang,
            totalItem: totalItem,
            totalHarga: totalHarga,
            onUbahJumlah: onUbahJumlah,
            onHapus: onHapus,
            onBayar: onBayar,
            onReset: onReset,
          ),
        ),
      ],
    );
  }
}

// ============================================================
// LAYOUT SATU PANEL (Portrait / HP)
// Menggunakan TabBar untuk navigasi antar menu dan keranjang
// ============================================================

class _LayoutSatuPanel extends StatelessWidget {
  final TabController tabController;
  final List<ItemKeranjang> keranjang;
  final int totalItem;
  final double totalHarga;
  final void Function(Produk) onProdukDipilih;
  final void Function(ItemKeranjang, int) onUbahJumlah;
  final void Function(ItemKeranjang) onHapus;
  final VoidCallback onBayar;
  final VoidCallback onReset;

  const _LayoutSatuPanel({
    required this.tabController,
    required this.keranjang,
    required this.totalItem,
    required this.totalHarga,
    required this.onProdukDipilih,
    required this.onUbahJumlah,
    required this.onHapus,
    required this.onBayar,
    required this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Tab Bar
        Container(
          color: const Color(0xFF0A0A1A),
          child: TabBar(
            controller: tabController,
            indicatorColor: const Color(0xFF64FFDA),
            indicatorWeight: 2,
            labelColor: const Color(0xFF64FFDA),
            unselectedLabelColor: const Color(0xFF4A5568),
            labelStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
            tabs: [
              const Tab(
                icon: Icon(Icons.restaurant_menu, size: 18),
                text: 'Menu',
              ),
              Tab(
                icon: Badge(
                  // Badge merah yang menampilkan jumlah item di keranjang
                  // Hanya muncul jika ada item
                  isLabelVisible: totalItem > 0,
                  label: Text(
                    '$totalItem',
                    style: const TextStyle(fontSize: 10),
                  ),
                  child: const Icon(Icons.shopping_cart, size: 18),
                ),
                text: 'Keranjang',
              ),
            ],
          ),
        ),
        // Konten Tab
        Expanded(
          child: TabBarView(
            controller: tabController,
            children: [
              // Tab 1: Daftar Produk
              _PanelDaftarProduk(onProdukDipilih: onProdukDipilih),
              // Tab 2: Keranjang
              _PanelKeranjang(
                keranjang: keranjang,
                totalItem: totalItem,
                totalHarga: totalHarga,
                onUbahJumlah: onUbahJumlah,
                onHapus: onHapus,
                onBayar: onBayar,
                onReset: onReset,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ============================================================
// PANEL DAFTAR PRODUK
// Digunakan oleh kedua layout di atas
// ============================================================

class _PanelDaftarProduk extends StatelessWidget {
  final void Function(Produk) onProdukDipilih;

  const _PanelDaftarProduk({required this.onProdukDipilih});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: TextField(
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Cari produk...',
              hintStyle:
                  const TextStyle(color: Color(0xFF4A5568), fontSize: 13),
              prefixIcon: const Icon(
                Icons.search,
                color: Color(0xFF4A5568),
                size: 18,
              ),
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
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: daftarProdukDummy.length,
            itemExtent: 72.0,
            itemBuilder: (context, index) {
              final produk = daftarProdukDummy[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
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

// ============================================================
// PANEL KERANJANG
// Digunakan oleh kedua layout di atas
// ============================================================

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
              Icon(
                Icons.receipt_long_outlined,
                color: Color(0xFF4A5568),
                size: 18,
              ),
            ],
          ),
        ),
        KeranjangPanel(
          items: keranjang,
          onUbahJumlah: onUbahJumlah,
          onHapus: onHapus,
        ),
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

---

## 8. Mengintegrasikan Semua Perubahan

Sekarang mari kita pastikan semua perubahan sudah terintegrasi dengan benar. Berikut adalah daftar file yang berubah dan yang baru di Part 2.

**File yang diperbarui:**

- `lib/screens/kasir_screen.dart` — Ditimpa dengan versi adaptif di atas
- `lib/main.dart` — Perlu diperbarui (hapus paksa orientasi landscape)

**File baru:**

- `lib/widgets/dialog_konfirmasi_bayar.dart` — Dialog platform-aware

### Update `lib/main.dart`

Di Part 1, kita memaksa orientasi landscape. Sekarang kita hapus paksa itu agar aplikasi bisa benar-benar adaptif:

```dart
// lib/main.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'screens/kasir_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await initializeDateFormatting('id_ID', null);

  // Sekarang kita izinkan semua orientasi
  // Layout akan menyesuaikan diri secara otomatis
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

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
        dividerTheme: const DividerThemeData(
          color: Color(0xFF1A1A2E),
          thickness: 1,
        ),
        snackBarTheme: const SnackBarThemeData(
          contentTextStyle: TextStyle(
            color: Color(0xFF0A0A1A),
            fontWeight: FontWeight.w600,
          ),
        ),
        // Kustomisasi TabBar agar konsisten dengan tema
        tabBarTheme: const TabBarThemeData(
          dividerColor: Color(0xFF1A1A2E),
        ),
      ),
      home: const KasirScreen(),
    );
  }
}
```

### Struktur File Lengkap di Akhir Part 2

```
lib/
  main.dart                            (diperbarui)
  models/
    produk.dart                        (tidak berubah dari Part 1)
    item_keranjang.dart                (tidak berubah dari Part 1)
  screens/
    kasir_screen.dart                  (diperbarui: layout adaptif)
  widgets/
    produk_card.dart                   (tidak berubah dari Part 1)
    keranjang_panel.dart               (tidak berubah dari Part 1)
    ringkasan_total.dart               (tidak berubah dari Part 1)
    header_kasir.dart                  (tidak berubah dari Part 1)
    dialog_konfirmasi_bayar.dart       (baru: dialog platform-aware)
```

### Cara Menguji Layout Adaptif

**Di emulator/simulator:**

Untuk menguji mode portrait di emulator Android, rotasi emulator dengan:

- Tekan `Ctrl+F11` (Windows/Linux) atau `Cmd+F11` (Mac) untuk rotasi di Android Studio
- Di VS Code, klik ikon rotasi di toolbar emulator

**Di Flutter DevTools:**

Kamu bisa mempersempit jendela browser DevTools untuk mensimulasikan layar sempit.

**Cara mudah untuk testing:**

Kamu bisa sementara mengubah nilai breakpoint untuk menguji:

```dart
// Sementara ubah ini untuk testing di landscape:
const double _kBreakpointLebar = 99999.0; // Selalu portrait
// atau
const double _kBreakpointLebar = 0.0; // Selalu landscape
```

Jangan lupa kembalikan ke `600.0` setelah selesai testing.

### Cara Menguji Dialog Platform-Aware

Untuk menguji tampilan iOS meski kamu pakai emulator Android, kamu bisa sementara meng-override platform di `MaterialApp`:

```dart
// Sementara tambahkan ini ke MaterialApp untuk testing tampilan iOS:
theme: ThemeData(
  platform: TargetPlatform.iOS, // Override platform untuk testing
  // ... properti lain
),
```

Jangan lupa hapus baris ini setelah selesai testing.

---

## Rangkuman Konsep Part 2

Sebelum melanjutkan ke Part 3, mari kita rekapitulasi apa yang sudah kita pelajari dan kita bangun:

**Platform Awareness:**
Kita belajar cara mendeteksi platform menggunakan `Theme.of(context).platform` dan membuat fungsi helper `tampilkanDialogKonfirmasiBayar` yang secara transparan menampilkan `AlertDialog` bergaya Material di Android dan `CupertinoAlertDialog` bergaya iOS di perangkat Apple. Pengguna mendapat pengalaman yang konsisten dengan sistem operasi mereka tanpa harus melakukan apapun secara manual.

**UI Adaptif:**
Kita menggunakan `MediaQuery.sizeOf(context)` untuk mendeteksi lebar layar dan memilih antara dua layout: `_LayoutDuaPanel` untuk layar lebar (tablet/landscape) dan `_LayoutSatuPanel` untuk layar sempit (HP/portrait). Kita juga mengintegrasikan `TabController` dengan `SingleTickerProviderStateMixin` untuk navigasi tab di mode portrait, lengkap dengan badge yang menampilkan jumlah item keranjang.

**Practical Details:**
Kita belajar tentang pentingnya mengecek `mounted` setelah operasi `async`, perbedaan antara `responsive` dan `adaptive`, serta mengapa `MediaQuery.sizeOf` lebih efisien dibanding `MediaQuery.of(context).size`.

---

## 9. Apa yang Akan Kita Lakukan di Part Selanjutnya?

Di Part 3, kita akan melengkapi dashboard POS ini dengan sesuatu yang tidak bisa dibuat dengan widget bawaan Flutter: **grafik penjualan buatan sendiri.**

Kita akan menyelami `CustomPaint` dan `CustomPainter` — dua API Flutter yang memberikanmu akses langsung ke kanvas untuk menggambar garis, kurva, bentuk, dan teks di posisi pixel yang kamu tentukan sendiri. Kita akan membangun sebuah **Sales Chart** yang menampilkan ringkasan penjualan harian dengan kurva mulus (menggunakan Bezier curve), titik-titik data interaktif, dan label yang rapih.

Di akhir Part 3, kita akan menggabungkan semuanya: optimasi performa dari Part 1, layout adaptif dari Part 2, dan grafik kustom dari Part 3 — menjadi satu `main.dart` final yang siap dijalankan.

Sampai jumpa di Part 3!

---

## Referensi Tambahan

- [Adaptive and Responsive UI (flutter.dev)](https://docs.flutter.dev/ui/adaptive-responsive)
- [Platform-specific UI (flutter.dev)](https://docs.flutter.dev/platform-integration/platform-adaptations)
- [CupertinoAlertDialog API](https://api.flutter.dev/flutter/cupertino/CupertinoAlertDialog-class.html)
- [MediaQuery API](https://api.flutter.dev/flutter/widgets/MediaQuery-class.html)
- [LayoutBuilder API](https://api.flutter.dev/flutter/widgets/LayoutBuilder-class.html)

---

_Seri Tutorial Flutter: Dashboard POS yang Optimal dan Adaptif_
_Part 2 dari 3 | Ditulis untuk Flutter 3.41.5_

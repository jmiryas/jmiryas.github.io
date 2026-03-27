---
title: "Seri Tutorial Flutter Part 3: Menggambar Kanvas dengan Custom Painter"
date: "Mar 26, 2026"
description: "Seri Tutorial Flutter Part 3: Menggambar Kanvas dengan Custom Painter"
---

> **Seri Tutorial:** Flutter Fundamental Desain & UI Tingkat Lanjut
> **Studi Kasus:** Dashboard Aplikasi Mini Point-of-Sale (POS)
> **Versi Flutter:** 3.41.5
> **Prerequisite:** Sudah menyelesaikan Part 1 dan Part 2

Kita sudah menempuh perjalanan jauh. Di Part 1, kita membangun fondasi performa yang kokoh. Di Part 2, kita membuat UI yang peka terhadap platform dan ukuran layar. Di Part 3 ini, kita akan menambahkan sentuhan terakhir yang membuat dashboard POS kita benar-benar terasa seperti produk yang dibuat dengan sungguh-sungguh: **sebuah grafik penjualan yang digambar tangan di atas kanvas Flutter.**

Tidak ada package grafik pihak ketiga. Tidak ada widget bawaan. Kita akan menggambar setiap piksel, setiap garis, setiap kurva secara manual — dan kamu akan paham persis bagaimana semuanya bekerja.

---

## Daftar Isi

1. [Kenapa Harus CustomPainter?](#1-kenapa-harus-custompainter)
2. [Mengenal CustomPaint dan CustomPainter](#2-mengenal-custompaint-dan-custompainter)
3. [Koordinat Kanvas: Cara Berpikir yang Benar](#3-koordinat-kanvas-cara-berpikir-yang-benar)
4. [Toolkit Menggambar: Paint, Path, dan Canvas](#4-toolkit-menggambar-paint-path-dan-canvas)
5. [Membangun Sales Chart: Perencanaan Visual](#5-membangun-sales-chart-perencanaan-visual)
6. [Kode Sales Chart: Langkah demi Langkah](#6-kode-sales-chart-langkah-demi-langkah)
7. [Mengintegrasikan Chart ke Dashboard POS](#7-mengintegrasikan-chart-ke-dashboard-pos)
8. [main.dart Final: Semua Menyatu](#8-maindart-final-semua-menyatu)
9. [Penutup: Apa yang Sudah Kita Bangun](#9-penutup-apa-yang-sudah-kita-bangun)

---

## 1. Kenapa Harus CustomPainter?

Widget bawaan Flutter sangat kaya. Untuk 90% kebutuhan UI, kamu bisa menyusun `Container`, `Row`, `Column`, dan kawan-kawannya untuk mencapai tampilan yang kamu inginkan. Tapi ada kategori visual yang tidak bisa dicapai dengan menyusun widget:

- Grafik garis dengan kurva mulus yang melewati titik-titik data
- Animasi partikel yang bergerak bebas di layar
- Gauge melingkar seperti speedometer
- Visualisasi data yang bentuknya tidak standar
- Efek visual kustom seperti gelombang, ripple, atau shadow yang kompleks

Untuk semua itu, kamu butuh akses langsung ke **kanvas** — permukaan gambar tingkat rendah di mana kamu bisa menggambar apa saja dengan instruksi geometri: "gambar garis dari titik A ke titik B", "isi area ini dengan warna X", "tulis teks ini di posisi Y dengan ukuran Z".

Di Flutter, akses ke kanvas ini diberikan melalui dua class: `CustomPaint` (sebagai widget) dan `CustomPainter` (sebagai objek yang berisi logika menggambar).

---

## 2. Mengenal CustomPaint dan CustomPainter

### `CustomPaint`

`CustomPaint` adalah sebuah widget biasa yang bisa kamu tempatkan di mana saja dalam widget tree. Tugasnya adalah menyediakan area gambar dan mendelegasikan pekerjaan menggambar ke objek `CustomPainter`.

```dart
CustomPaint(
  size: const Size(double.infinity, 200), // Lebar penuh, tinggi 200px
  painter: GrafikPenjualanku(data: dataPenjualan), // Objek yang menggambar
  child: Container(), // Widget yang akan ditumpuk di atas gambar (opsional)
)
```

`CustomPaint` memiliki dua properti untuk painter:

- `painter`: Digambar **di bawah** `child`
- `foregroundPainter`: Digambar **di atas** `child`

### `CustomPainter`

`CustomPainter` adalah class abstrak yang harus kamu extend (turunkan). Kamu wajib mengimplementasikan dua method:

```dart
class GrafikPenjualanku extends CustomPainter {

  @override
  void paint(Canvas canvas, Size size) {
    // Di sinilah semua instruksi menggambar berada.
    // `canvas` adalah objek untuk menggambar.
    // `size` adalah ukuran area yang tersedia (dari widget CustomPaint).
  }

  @override
  bool shouldRepaint(GrafikPenjualanku oldDelegate) {
    // Flutter memanggil method ini untuk menentukan apakah
    // perlu menggambar ulang.
    // Kembalikan `true` jika data berubah, `false` jika tidak.
    return false;
  }
}
```

**Method `shouldRepaint` sangat penting untuk performa.** Jika kamu selalu mengembalikan `true`, Flutter akan menggambar ulang kanvas di setiap frame — sangat boros. Kembalikan `true` hanya jika data yang digunakan untuk menggambar benar-benar berubah.

---

## 3. Koordinat Kanvas: Cara Berpikir yang Benar

Ini adalah konsep yang paling sering membuat pemula bingung, jadi aku jelaskan dengan cermat.

Sistem koordinat kanvas Flutter bekerja seperti ini:

```
(0, 0) ──────────────────────── (size.width, 0)
  │                                      │
  │           KANVAS                     │
  │                                      │
  │   X bertambah ke kanan ──>           │
  │   Y bertambah ke bawah               │
  │             │                        │
  │             v                        │
(0, size.height) ──────────── (size.width, size.height)
```

Titik `(0, 0)` ada di **pojok kiri atas**. Sumbu X bertambah ke kanan, sumbu Y bertambah ke bawah.

Ini berbeda dari grafik matematika biasa di mana Y bertambah ke atas. Perbedaan ini penting saat kita mengkonversi nilai data ke posisi pixel.

**Contoh konversi nyata:**

Bayangkan kita punya data penjualan dengan nilai maksimum Rp 500.000. Kita ingin menggambar titik untuk nilai Rp 350.000 di sebuah kanvas tinggi 200px.

```
Nilai: 350.000
Nilai maksimum: 500.000
Tinggi kanvas: 200px

Rasio dari bawah: 350.000 / 500.000 = 0.7 (70% dari bawah)
Tinggi dari atas: 200px - (200px × 0.7) = 200px - 140px = 60px

Jadi posisi Y untuk nilai 350.000 adalah 60px dari atas kanvas.
```

Rumusnya:

```
posisiY = tinggiKanvas - (tinggiKanvas × (nilai / nilaiMaksimum))
```

Kita akan menggunakan rumus ini di kode nanti.

---

## 4. Toolkit Menggambar: Paint, Path, dan Canvas

Sebelum menulis kode grafik, mari berkenalan dengan tiga objek utama yang akan kita gunakan.

### `Paint`

`Paint` adalah objek yang mendefinisikan **gaya** gambar — warnanya apa, tebalnya berapa, apakah diisi atau hanya outlinenya. Seperti kuas dan palet cat dalam satu objek.

```dart
final kuasBiru = Paint()
  ..color = const Color(0xFF64FFDA)    // Warna
  ..strokeWidth = 2.0                   // Ketebalan garis
  ..style = PaintingStyle.stroke        // Hanya outline (stroke), bukan isi
  ..strokeCap = StrokeCap.round;        // Ujung garis membulat

final pengisiMerah = Paint()
  ..color = Colors.red.withOpacity(0.3)
  ..style = PaintingStyle.fill;         // Isi penuh (fill)

// PaintingStyle.stroke = hanya garis tepi
// PaintingStyle.fill = isi seluruh area
```

### `Path`

`Path` adalah objek yang mendefinisikan **bentuk** — serangkaian instruksi geometri yang membentuk sebuah kontur. Bayangkan seperti menggerakkan pensil di atas kertas.

```dart
final jalur = Path();
jalur.moveTo(0, 100);     // Angkat pensil, taruh di (0, 100)
jalur.lineTo(100, 50);    // Tarik garis lurus ke (100, 50)
jalur.lineTo(200, 80);    // Tarik garis lurus ke (200, 80)
jalur.close();            // Tutup path (hubungkan titik terakhir ke titik pertama)

// Untuk kurva mulus (ini yang akan kita gunakan untuk grafik):
jalur.cubicTo(
  cp1x, cp1y, // Control point pertama
  cp2x, cp2y, // Control point kedua
  x, y,       // Titik tujuan
);
```

**Tentang Bezier Curve:**

`cubicTo` menggunakan **Cubic Bezier Curve** — sebuah teknik matematika untuk membuat kurva yang mulus. Dibutuhkan dua "control point" yang menentukan arah dan kelengkungan kurva sebelum mencapai titik tujuan.

Cara paling mudah memahaminya: bayangkan kamu menarik karet gelang. Titik awal dan akhir adalah posisi kurva. Dua control point adalah "tarikan" yang membentuk lekukan kurva. Semakin jauh control point dari garis lurus, semakin melengkung kurvanya.

Untuk grafik kita, kita akan menggunakan formula sederhana untuk menghitung control point secara otomatis:

```dart
// Control point untuk smooth curve antar dua titik:
// Letakkan control point di 1/3 jarak horizontal antar titik
final cp1x = titikSebelumnya.dx + (titikBerikutnya.dx - titikSebelumnya.dx) / 3;
final cp1y = titikSebelumnya.dy;
final cp2x = titikBerikutnya.dx - (titikBerikutnya.dx - titikSebelumnya.dx) / 3;
final cp2y = titikBerikutnya.dy;
```

### `Canvas`

`Canvas` adalah objek yang menerima instruksi menggambar dan mengeksekusinya:

```dart
// Beberapa method Canvas yang paling sering digunakan:
canvas.drawLine(Offset titikAwal, Offset titikAkhir, Paint kuas);
canvas.drawPath(Path jalur, Paint kuas);
canvas.drawCircle(Offset pusat, double radius, Paint kuas);
canvas.drawRect(Rect persegi, Paint kuas);

// Untuk teks, kita menggunakan TextPainter:
final textPainter = TextPainter(
  text: TextSpan(text: 'label', style: TextStyle(...)),
  textDirection: TextDirection.ltr,
);
textPainter.layout();
textPainter.paint(canvas, Offset(x, y));
```

---

## 5. Membangun Sales Chart: Perencanaan Visual

Sebelum menulis satu baris kode pun, kita rencanakan dulu bagaimana grafik kita akan terlihat dan apa saja komponennya.

**Komponen yang akan digambar:**

```
┌─────────────────────────────────────────────────┐
│  RINGKASAN PENJUALAN                            │  <- Label judul (widget biasa)
│                                                 │
│  Rp 500rb ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │  <- Garis grid horizontal (CustomPainter)
│           /                                     │
│  Rp 250rb ─ ─ ─ ─ /─ ─\ ─ ─ ─ ─ ─ ─ ─ ─ ─   │  <- Kurva data (CustomPainter)
│         /         │    \    /                   │
│  Rp 0   ─────────────────────────────────────  │  <- Garis sumbu (CustomPainter)
│         Sn  Sl  Rb  Km  Jm  Sb  Mg             │  <- Label hari (CustomPainter)
│                                                 │
│         ●   ●   ●   ●   ●   ●   ●              │  <- Titik data (CustomPainter)
└─────────────────────────────────────────────────┘
```

**Lapisan gambar (dari bawah ke atas):**

1. Area gradient di bawah kurva (isi transparan)
2. Garis grid horizontal (putus-putus, samar)
3. Label sumbu Y (Rp 0, Rp 250rb, Rp 500rb)
4. Kurva data utama (garis tebal berwarna)
5. Titik-titik data (lingkaran kecil di setiap titik)
6. Label sumbu X (nama hari di bawah)

**Data yang dibutuhkan:**

```dart
// Struktur data satu titik dalam grafik
class DataPenjualan {
  final String label; // "Sn", "Sl", "Rb", dst
  final double nilai; // Nilai penjualan dalam Rupiah
  const DataPenjualan(this.label, this.nilai);
}
```

---

## 6. Kode Sales Chart: Langkah demi Langkah

Buat file baru: `lib/widgets/sales_chart.dart`

```dart
// lib/widgets/sales_chart.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

// ============================================================
// MODEL DATA
// ============================================================

class DataPenjualan {
  final String label;
  final double nilai;
  const DataPenjualan(this.label, this.nilai);
}

// Data dummy 7 hari terakhir
final List<DataPenjualan> dataPenjualanDummy = [
  const DataPenjualan('Sn', 320000),
  const DataPenjualan('Sl', 480000),
  const DataPenjualan('Rb', 290000),
  const DataPenjualan('Km', 510000),
  const DataPenjualan('Jm', 430000),
  const DataPenjualan('Sb', 620000),
  const DataPenjualan('Mg', 380000),
];

// ============================================================
// WIDGET PEMBUNGKUS (StatelessWidget biasa)
// ============================================================
// Widget ini bertanggung jawab untuk:
// 1. Menampilkan judul dan ringkasan angka
// 2. Membungkus CustomPaint agar ukurannya terdefinisi
// ============================================================

class SalesChartWidget extends StatelessWidget {
  final List<DataPenjualan> data;
  final String judul;

  const SalesChartWidget({
    super.key,
    required this.data,
    this.judul = 'Penjualan 7 Hari Terakhir',
  });

  double get _totalPenjualan =>
      data.fold(0, (sum, d) => sum + d.nilai);

  double get _penjualanTertinggi =>
      data.isEmpty ? 0 : data.map((d) => d.nilai).reduce((a, b) => a > b ? a : b);

  @override
  Widget build(BuildContext context) {
    final formatRupiah = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF16213E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF0F3460), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: judul dan total
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      judul.toUpperCase(),
                      style: const TextStyle(
                        color: Color(0xFF8892B0),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      formatRupiah.format(_totalPenjualan),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              // Badge perubahan (simulasi: naik 12%)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF064e3b),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.trending_up,
                      color: Color(0xFF34d399),
                      size: 14,
                    ),
                    SizedBox(width: 4),
                    Text(
                      '+12%',
                      style: TextStyle(
                        color: Color(0xFF34d399),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Area grafik — ini yang menggunakan CustomPaint
          // SizedBox dibutuhkan agar CustomPaint punya ukuran yang jelas
          SizedBox(
            height: 160,
            child: CustomPaint(
              size: Size.infinite,
              painter: _SalesChartPainter(
                data: data,
                nilaiMaksimum: (_penjualanTertinggi * 1.2).ceilToDouble(),
                warnaGaris: const Color(0xFF64FFDA),
                warnaGrid: const Color(0xFF1E3A5F),
                warnaLabel: const Color(0xFF4A5568),
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Statistik ringkas di bawah grafik
          Row(
            children: [
              _StatMini(
                label: 'Tertinggi',
                nilai: formatRupiah.format(_penjualanTertinggi),
                warna: const Color(0xFF64FFDA),
              ),
              const SizedBox(width: 16),
              _StatMini(
                label: 'Rata-rata',
                nilai: formatRupiah.format(
                  _totalPenjualan / (data.isEmpty ? 1 : data.length),
                ),
                warna: const Color(0xFF8892B0),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Widget kecil untuk stat di bawah grafik
class _StatMini extends StatelessWidget {
  final String label;
  final String nilai;
  final Color warna;

  const _StatMini({
    required this.label,
    required this.nilai,
    required this.warna,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF4A5568),
            fontSize: 10,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          nilai,
          style: TextStyle(
            color: warna,
            fontSize: 13,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

// ============================================================
// CUSTOM PAINTER — INI INTI DARI PART 3
// ============================================================

class _SalesChartPainter extends CustomPainter {
  final List<DataPenjualan> data;
  final double nilaiMaksimum;
  final Color warnaGaris;
  final Color warnaGrid;
  final Color warnaLabel;

  // Padding internal kanvas agar grafik tidak mepet ke tepi
  // Kiri: ruang untuk label sumbu Y
  // Bawah: ruang untuk label hari
  static const double _paddingKiri = 54.0;
  static const double _paddingBawah = 28.0;
  static const double _paddingKanan = 16.0;
  static const double _paddingAtas = 10.0;

  _SalesChartPainter({
    required this.data,
    required this.nilaiMaksimum,
    required this.warnaGaris,
    required this.warnaGrid,
    required this.warnaLabel,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;

    // Area yang bisa digambar (setelah dikurangi padding)
    final areaGambar = Rect.fromLTRB(
      _paddingKiri,
      _paddingAtas,
      size.width - _paddingKanan,
      size.height - _paddingBawah,
    );

    // Konversi semua data ke posisi pixel
    final titikData = _hitungTitikData(areaGambar);

    // Gambar sesuai urutan layer (bawah ke atas)
    _gambarGrid(canvas, areaGambar);
    _gambarLabelSumbuY(canvas, areaGambar);
    _gambarAreaGradient(canvas, areaGambar, titikData);
    _gambarGarisKurva(canvas, titikData);
    _gambarTitikData(canvas, titikData);
    _gambarLabelSumbuX(canvas, areaGambar, titikData);
  }

  // -------------------------------------------------------
  // HELPER: Konversi nilai data ke posisi pixel
  // -------------------------------------------------------
  List<Offset> _hitungTitikData(Rect area) {
    final lebarPerItem = area.width / (data.length - 1);

    return List.generate(data.length, (i) {
      // Posisi X: didistribusikan merata dari kiri ke kanan
      final x = area.left + (i * lebarPerItem);

      // Posisi Y: konversi nilai ke koordinat kanvas
      // Ingat: Y=0 adalah atas, Y=tinggi adalah bawah
      // Jadi nilai tinggi → Y kecil (dekat atas)
      //      nilai rendah → Y besar (dekat bawah)
      final rasio = data[i].nilai / nilaiMaksimum;
      final y = area.bottom - (area.height * rasio);

      return Offset(x, y);
    });
  }

  // -------------------------------------------------------
  // LAYER 1: Garis grid horizontal (putus-putus)
  // -------------------------------------------------------
  void _gambarGrid(Canvas canvas, Rect area) {
    final kuasGrid = Paint()
      ..color = warnaGrid
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    // Gambar 3 garis grid: di 0%, 50%, dan 100% tinggi
    const jumlahGaris = 3;
    for (int i = 0; i < jumlahGaris; i++) {
      final y = area.top + (area.height / (jumlahGaris - 1)) * i;

      // Gambar garis putus-putus secara manual
      // dengan menggambar segmen-segmen pendek
      double x = area.left;
      const panjangDash = 6.0;
      const jarakDash = 4.0;

      while (x < area.right) {
        canvas.drawLine(
          Offset(x, y),
          Offset((x + panjangDash).clamp(area.left, area.right), y),
          kuasGrid,
        );
        x += panjangDash + jarakDash;
      }
    }

    // Gambar garis sumbu X (tepi bawah area gambar)
    final kuasSumbu = Paint()
      ..color = warnaGrid.withOpacity(2.0) // Lebih terang dari grid
      ..strokeWidth = 1.5;

    canvas.drawLine(
      Offset(area.left, area.bottom),
      Offset(area.right, area.bottom),
      kuasSumbu,
    );
  }

  // -------------------------------------------------------
  // LAYER 2: Label sumbu Y (nilai Rupiah di kiri)
  // -------------------------------------------------------
  void _gambarLabelSumbuY(Canvas canvas, Rect area) {
    // Tampilkan 3 label: 0, nilai tengah, nilai maksimum
    final nilaiLabel = [
      0.0,
      nilaiMaksimum / 2,
      nilaiMaksimum,
    ];

    for (int i = 0; i < nilaiLabel.length; i++) {
      final nilai = nilaiLabel[i];
      final y = area.bottom - (area.height * (nilai / nilaiMaksimum));

      // Format angka: gunakan K untuk ribuan
      final labelTeks = _formatNilaiSingkat(nilai);

      final textPainter = TextPainter(
        text: TextSpan(
          text: labelTeks,
          style: TextStyle(
            color: warnaLabel,
            fontSize: 9,
            fontWeight: FontWeight.w500,
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();

      // Posisikan label di kiri, sejajar dengan garis grid
      textPainter.paint(
        canvas,
        Offset(
          area.left - textPainter.width - 8,
          y - textPainter.height / 2,
        ),
      );
    }
  }

  // Helper: format angka besar menjadi singkatan
  String _formatNilaiSingkat(double nilai) {
    if (nilai >= 1000000) {
      return '${(nilai / 1000000).toStringAsFixed(1)}jt';
    } else if (nilai >= 1000) {
      return '${(nilai / 1000).toStringAsFixed(0)}rb';
    }
    return nilai.toStringAsFixed(0);
  }

  // -------------------------------------------------------
  // LAYER 3: Area gradient di bawah kurva
  // -------------------------------------------------------
  void _gambarAreaGradient(
    Canvas canvas,
    Rect area,
    List<Offset> titikData,
  ) {
    // Buat path yang mengikuti kurva, lalu tutup ke bawah
    final jalurArea = Path();

    // Mulai dari pojok kiri bawah
    jalurArea.moveTo(titikData.first.dx, area.bottom);
    // Naik ke titik data pertama
    jalurArea.lineTo(titikData.first.dx, titikData.first.dy);

    // Ikuti kurva data (sama seperti garis utama)
    for (int i = 0; i < titikData.length - 1; i++) {
      final p0 = titikData[i];
      final p1 = titikData[i + 1];

      final cp1 = Offset(p0.dx + (p1.dx - p0.dx) / 3, p0.dy);
      final cp2 = Offset(p1.dx - (p1.dx - p0.dx) / 3, p1.dy);

      jalurArea.cubicTo(cp1.dx, cp1.dy, cp2.dx, cp2.dy, p1.dx, p1.dy);
    }

    // Tutup path ke pojok kanan bawah, lalu kembali ke kiri
    jalurArea.lineTo(titikData.last.dx, area.bottom);
    jalurArea.close();

    // Isi dengan gradient vertikal: warna di atas, transparan di bawah
    final kuasGradient = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          warnaGaris.withOpacity(0.25),
          warnaGaris.withOpacity(0.0),
        ],
      ).createShader(area)
      ..style = PaintingStyle.fill;

    canvas.drawPath(jalurArea, kuasGradient);
  }

  // -------------------------------------------------------
  // LAYER 4: Garis kurva utama
  // -------------------------------------------------------
  void _gambarGarisKurva(Canvas canvas, List<Offset> titikData) {
    final jalurKurva = Path();
    jalurKurva.moveTo(titikData.first.dx, titikData.first.dy);

    for (int i = 0; i < titikData.length - 1; i++) {
      final p0 = titikData[i];
      final p1 = titikData[i + 1];

      // Hitung control points untuk kurva Bezier yang mulus
      // Letakkan di 1/3 dan 2/3 jarak horizontal antar dua titik
      final cp1 = Offset(p0.dx + (p1.dx - p0.dx) / 3, p0.dy);
      final cp2 = Offset(p1.dx - (p1.dx - p0.dx) / 3, p1.dy);

      jalurKurva.cubicTo(
        cp1.dx, cp1.dy, // Control point 1
        cp2.dx, cp2.dy, // Control point 2
        p1.dx, p1.dy,   // Titik tujuan
      );
    }

    // Kuas untuk garis utama
    final kuasGaris = Paint()
      ..color = warnaGaris
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(jalurKurva, kuasGaris);
  }

  // -------------------------------------------------------
  // LAYER 5: Titik data (dot di setiap titik)
  // -------------------------------------------------------
  void _gambarTitikData(Canvas canvas, List<Offset> titikData) {
    // Kuas untuk lingkaran dalam (warna solid)
    final kuasDalam = Paint()
      ..color = warnaGaris
      ..style = PaintingStyle.fill;

    // Kuas untuk lingkaran luar (border warna gelap)
    final kuasLuar = Paint()
      ..color = const Color(0xFF16213E) // Sama dengan background container
      ..style = PaintingStyle.fill;

    for (final titik in titikData) {
      // Gambar lingkaran luar (border) lebih dulu
      canvas.drawCircle(titik, 5.5, kuasLuar);
      // Gambar lingkaran dalam di atasnya
      canvas.drawCircle(titik, 3.5, kuasDalam);
    }
  }

  // -------------------------------------------------------
  // LAYER 6: Label sumbu X (nama hari di bawah)
  // -------------------------------------------------------
  void _gambarLabelSumbuX(
    Canvas canvas,
    Rect area,
    List<Offset> titikData,
  ) {
    for (int i = 0; i < data.length; i++) {
      final textPainter = TextPainter(
        text: TextSpan(
          text: data[i].label,
          style: TextStyle(
            color: warnaLabel,
            fontSize: 10,
            fontWeight: FontWeight.w500,
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();

      // Pusatkan label di bawah titik datanya
      textPainter.paint(
        canvas,
        Offset(
          titikData[i].dx - textPainter.width / 2,
          area.bottom + 8,
        ),
      );
    }
  }

  // -------------------------------------------------------
  // shouldRepaint: kapan gambar ulang diperlukan?
  // -------------------------------------------------------
  @override
  bool shouldRepaint(_SalesChartPainter oldDelegate) {
    // Gambar ulang hanya jika data atau nilai maksimum berubah
    return oldDelegate.data != data ||
        oldDelegate.nilaiMaksimum != nilaiMaksimum;
  }
}
```

---

## 7. Mengintegrasikan Chart ke Dashboard POS

Sekarang kita integrasikan `SalesChartWidget` ke dalam aplikasi POS. Kita akan menambahkan tab atau halaman baru: **Dashboard** — yang menampilkan ringkasan penjualan dan grafik.

Kita akan membuat `DashboardScreen` sebagai halaman terpisah, lalu membungkus semuanya dengan `NavigationDrawer` atau `BottomNavigationBar` tergantung platform.

Buat file baru: `lib/screens/dashboard_screen.dart`

```dart
// lib/screens/dashboard_screen.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../widgets/sales_chart.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A1A),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header dashboard
              const _HeaderDashboard(),
              const SizedBox(height: 24),

              // Kartu statistik ringkas (4 kotak)
              const _GridStatistik(),
              const SizedBox(height: 24),

              // Grafik penjualan — inilah bintang Part 3
              SalesChartWidget(data: dataPenjualanDummy),
              const SizedBox(height: 24),

              // Transaksi terbaru
              const _TransaksiTerbaru(),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

// -------------------------------------------------------
// Sub-widget: Header Dashboard
// -------------------------------------------------------
class _HeaderDashboard extends StatelessWidget {
  const _HeaderDashboard();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Dashboard',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Warung Maju Jaya',
                style: TextStyle(
                  color: Color(0xFF8892B0),
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF16213E),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF0F3460)),
          ),
          child: IconButton(
            icon: const Icon(
              Icons.notifications_outlined,
              color: Color(0xFF8892B0),
              size: 20,
            ),
            onPressed: () {},
          ),
        ),
      ],
    );
  }
}

// -------------------------------------------------------
// Sub-widget: Grid 4 Kartu Statistik
// -------------------------------------------------------
class _GridStatistik extends StatelessWidget {
  const _GridStatistik();

  @override
  Widget build(BuildContext context) {
    // Kita tidak pakai GridView agar layout lebih terkontrol
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _KartuStat(
                ikon: Icons.receipt_long,
                label: 'Transaksi Hari Ini',
                nilai: '47',
                warna: const Color(0xFF64FFDA),
                perubahan: '+8 dari kemarin',
                naik: true,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _KartuStat(
                ikon: Icons.payments_outlined,
                label: 'Pendapatan Hari Ini',
                nilai: 'Rp 1,2jt',
                warna: const Color(0xFFFFB74D),
                perubahan: '+12% dari kemarin',
                naik: true,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _KartuStat(
                ikon: Icons.inventory_2_outlined,
                label: 'Produk Terjual',
                nilai: '183',
                warna: const Color(0xFFB39DDB),
                perubahan: '-3% dari kemarin',
                naik: false,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _KartuStat(
                ikon: Icons.star_outline,
                label: 'Produk Terlaris',
                nilai: 'Nasi Goreng',
                warna: const Color(0xFFFC5C7D),
                perubahan: '23 porsi hari ini',
                naik: true,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _KartuStat extends StatelessWidget {
  final IconData ikon;
  final String label;
  final String nilai;
  final Color warna;
  final String perubahan;
  final bool naik;

  const _KartuStat({
    required this.ikon,
    required this.label,
    required this.nilai,
    required this.warna,
    required this.perubahan,
    required this.naik,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF16213E),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF0F3460), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: warna.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(ikon, color: warna, size: 16),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            nilai,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF8892B0),
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(
                naik ? Icons.arrow_upward : Icons.arrow_downward,
                size: 10,
                color: naik
                    ? const Color(0xFF34d399)
                    : const Color(0xFFFC5C7D),
              ),
              const SizedBox(width: 3),
              Expanded(
                child: Text(
                  perubahan,
                  style: TextStyle(
                    color: naik
                        ? const Color(0xFF34d399)
                        : const Color(0xFFFC5C7D),
                    fontSize: 10,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// -------------------------------------------------------
// Sub-widget: Daftar Transaksi Terbaru
// -------------------------------------------------------

class _TransaksiTerbaru extends StatelessWidget {
  const _TransaksiTerbaru();

  // Data dummy transaksi
  static final List<Map<String, dynamic>> _transaksi = [
    {
      'id': '#TRX-0047',
      'waktu': '14:32',
      'item': 3,
      'total': 68000.0,
      'metode': 'Tunai',
    },
    {
      'id': '#TRX-0046',
      'waktu': '14:18',
      'item': 1,
      'total': 25000.0,
      'metode': 'QRIS',
    },
    {
      'id': '#TRX-0045',
      'waktu': '13:55',
      'item': 5,
      'total': 112000.0,
      'metode': 'Tunai',
    },
    {
      'id': '#TRX-0044',
      'waktu': '13:40',
      'item': 2,
      'total': 43000.0,
      'metode': 'Transfer',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final formatRupiah = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'TRANSAKSI TERBARU',
              style: TextStyle(
                color: Color(0xFF8892B0),
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5,
              ),
            ),
            Text(
              'Lihat Semua',
              style: TextStyle(
                color: Color(0xFF64FFDA),
                fontSize: 11,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF16213E),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF0F3460)),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _transaksi.length,
            separatorBuilder: (_, __) => const Divider(
              color: Color(0xFF0F3460),
              height: 1,
            ),
            itemBuilder: (context, index) {
              final trx = _transaksi[index];
              return Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFF64FFDA).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.receipt_outlined,
                        color: Color(0xFF64FFDA),
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            trx['id'] as String,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            '${trx['item']} item · ${trx['waktu']}',
                            style: const TextStyle(
                              color: Color(0xFF8892B0),
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          formatRupiah.format(trx['total']),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F3460),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            trx['metode'] as String,
                            style: const TextStyle(
                              color: Color(0xFF8892B0),
                              fontSize: 9,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
```

---

## 8. main.dart Final: Semua Menyatu

Inilah momen yang kita tunggu-tunggu. `main.dart` final ini menggabungkan semua yang kita bangun di tiga part: performa (Part 1), adaptif UI (Part 2), dan grafik kustom (Part 3) menjadi satu aplikasi yang utuh.

Kita akan membungkus `KasirScreen` dan `DashboardScreen` dengan navigasi yang juga adaptive: `NavigationDrawer` untuk layar lebar (tablet/landscape) dan `BottomNavigationBar` untuk layar sempit (HP/portrait).

Buat file baru: `lib/screens/app_shell.dart`

```dart
// lib/screens/app_shell.dart
// Shell navigasi yang adaptif untuk seluruh aplikasi

import 'package:flutter/material.dart';
import 'kasir_screen.dart';
import 'dashboard_screen.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _halamanAktif = 0;

  // Daftar semua halaman dalam aplikasi
  static const List<_ItemNavigasi> _itemNavigasi = [
    _ItemNavigasi(
      label: 'Dashboard',
      ikon: Icons.dashboard_outlined,
      ikonAktif: Icons.dashboard,
    ),
    _ItemNavigasi(
      label: 'Kasir',
      ikon: Icons.point_of_sale_outlined,
      ikonAktif: Icons.point_of_sale,
    ),
  ];

  // Halaman-halaman yang di-render
  // Menggunakan IndexedStack agar state setiap halaman
  // tidak hilang saat berpindah tab
  static final List<Widget> _halaman = [
    const DashboardScreen(),
    const KasirScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final lebarLayar = MediaQuery.sizeOf(context).width;
    final isLayarLebar = lebarLayar >= 600;

    if (isLayarLebar) {
      return _ShellLayarLebar(
        halamanAktif: _halamanAktif,
        onGantiHalaman: (i) => setState(() => _halamanAktif = i),
        itemNavigasi: _itemNavigasi,
        halaman: _halaman,
      );
    } else {
      return _ShellLayarSempit(
        halamanAktif: _halamanAktif,
        onGantiHalaman: (i) => setState(() => _halamanAktif = i),
        itemNavigasi: _itemNavigasi,
        halaman: _halaman,
      );
    }
  }
}

// -------------------------------------------------------
// Model data navigasi
// -------------------------------------------------------
class _ItemNavigasi {
  final String label;
  final IconData ikon;
  final IconData ikonAktif;

  const _ItemNavigasi({
    required this.label,
    required this.ikon,
    required this.ikonAktif,
  });
}

// -------------------------------------------------------
// Shell untuk layar lebar (tablet/landscape)
// Menggunakan NavigationRail di sisi kiri
// -------------------------------------------------------
class _ShellLayarLebar extends StatelessWidget {
  final int halamanAktif;
  final void Function(int) onGantiHalaman;
  final List<_ItemNavigasi> itemNavigasi;
  final List<Widget> halaman;

  const _ShellLayarLebar({
    required this.halamanAktif,
    required this.onGantiHalaman,
    required this.itemNavigasi,
    required this.halaman,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A1A),
      body: Row(
        children: [
          // NavigationRail: sidebar navigasi kompak di kiri
          NavigationRail(
            backgroundColor: const Color(0xFF16213E),
            selectedIndex: halamanAktif,
            onDestinationSelected: onGantiHalaman,
            labelType: NavigationRailLabelType.all,
            selectedIconTheme: const IconThemeData(
              color: Color(0xFF64FFDA),
            ),
            unselectedIconTheme: const IconThemeData(
              color: Color(0xFF4A5568),
            ),
            selectedLabelTextStyle: const TextStyle(
              color: Color(0xFF64FFDA),
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
            unselectedLabelTextStyle: const TextStyle(
              color: Color(0xFF4A5568),
              fontSize: 11,
            ),
            indicatorColor: const Color(0xFF0F3460),
            // Logo/brand di bagian atas rail
            leading: const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Icon(
                Icons.store,
                color: Color(0xFF64FFDA),
                size: 28,
              ),
            ),
            destinations: itemNavigasi
                .map(
                  (item) => NavigationRailDestination(
                    icon: Icon(item.ikon),
                    selectedIcon: Icon(item.ikonAktif),
                    label: Text(item.label),
                  ),
                )
                .toList(),
          ),
          // Divider vertikal
          const VerticalDivider(
            width: 1,
            color: Color(0xFF0F3460),
          ),
          // Konten halaman aktif
          Expanded(
            child: IndexedStack(
              index: halamanAktif,
              children: halaman,
            ),
          ),
        ],
      ),
    );
  }
}

// -------------------------------------------------------
// Shell untuk layar sempit (HP/portrait)
// Menggunakan BottomNavigationBar
// -------------------------------------------------------
class _ShellLayarSempit extends StatelessWidget {
  final int halamanAktif;
  final void Function(int) onGantiHalaman;
  final List<_ItemNavigasi> itemNavigasi;
  final List<Widget> halaman;

  const _ShellLayarSempit({
    required this.halamanAktif,
    required this.onGantiHalaman,
    required this.itemNavigasi,
    required this.halaman,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A1A),
      // IndexedStack menjaga state setiap halaman tetap hidup
      // meski tidak sedang ditampilkan
      body: IndexedStack(
        index: halamanAktif,
        children: halaman,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: Color(0xFF0F3460), width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: halamanAktif,
          onTap: onGantiHalaman,
          backgroundColor: const Color(0xFF16213E),
          selectedItemColor: const Color(0xFF64FFDA),
          unselectedItemColor: const Color(0xFF4A5568),
          selectedLabelStyle: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          type: BottomNavigationBarType.fixed,
          items: itemNavigasi
              .map(
                (item) => BottomNavigationBarItem(
                  icon: Icon(item.ikon),
                  activeIcon: Icon(item.ikonAktif),
                  label: item.label,
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}
```

### `lib/main.dart` — Versi Final

```dart
// lib/main.dart — VERSI FINAL (Part 3)

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'screens/app_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inisialisasi locale Indonesia untuk format tanggal dan mata uang
  await initializeDateFormatting('id_ID', null);

  // Izinkan semua orientasi — layout akan menyesuaikan diri
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Buat status bar transparan agar UI lebih imersif
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF16213E),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const POSApp());
}

class POSApp extends StatelessWidget {
  const POSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mini POS — Warung Maju Jaya',
      debugShowCheckedModeBanner: false,
      theme: _buildTheme(),
      // AppShell adalah root navigasi yang menentukan
      // apakah pakai sidebar (tablet) atau bottom nav (HP)
      home: const AppShell(),
    );
  }

  ThemeData _buildTheme() {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: const Color(0xFF0A0A1A),
      fontFamily: 'Roboto',
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF64FFDA),
        brightness: Brightness.dark,
        surface: const Color(0xFF16213E),
        onSurface: Colors.white,
      ),

      // Warna aksen utama aplikasi
      primaryColor: const Color(0xFF64FFDA),

      // AppBar
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF1A1A2E),
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: Color(0xFF1A1A2E),
        thickness: 1,
      ),

      // SnackBar
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: Color(0xFF64FFDA),
        contentTextStyle: TextStyle(
          color: Color(0xFF0A0A1A),
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(10)),
        ),
      ),

      // TabBar
      tabBarTheme: const TabBarThemeData(
        dividerColor: Color(0xFF1A1A2E),
        indicatorColor: Color(0xFF64FFDA),
        labelColor: Color(0xFF64FFDA),
        unselectedLabelColor: Color(0xFF4A5568),
      ),

      // NavigationRail
      navigationRailTheme: const NavigationRailThemeData(
        backgroundColor: Color(0xFF16213E),
        selectedIconTheme: IconThemeData(color: Color(0xFF64FFDA)),
        unselectedIconTheme: IconThemeData(color: Color(0xFF4A5568)),
        indicatorColor: Color(0xFF0F3460),
      ),

      // ElevatedButton
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF64FFDA),
          foregroundColor: const Color(0xFF0A0A1A),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),

      // Input/TextField
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF16213E),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
        hintStyle: const TextStyle(color: Color(0xFF4A5568)),
      ),
    );
  }
}
```

### Struktur File Lengkap — Proyek Final

Ini adalah struktur lengkap semua file yang sudah kita buat sepanjang tiga part:

```
mini_pos/
├── pubspec.yaml
├── analysis_options.yaml
└── lib/
    ├── main.dart                         (Part 3 - final)
    ├── models/
    │   ├── produk.dart                   (Part 1)
    │   └── item_keranjang.dart           (Part 1)
    ├── screens/
    │   ├── app_shell.dart                (Part 3 - navigasi adaptif)
    │   ├── kasir_screen.dart             (Part 2 - layout adaptif)
    │   └── dashboard_screen.dart         (Part 3 - dashboard + chart)
    └── widgets/
        ├── header_kasir.dart             (Part 1)
        ├── produk_card.dart              (Part 1)
        ├── keranjang_panel.dart          (Part 1)
        ├── ringkasan_total.dart          (Part 1)
        ├── dialog_konfirmasi_bayar.dart  (Part 2)
        └── sales_chart.dart              (Part 3)
```

Jalankan dengan:

```bash
flutter pub get
flutter run
```

---

## 9. Penutup: Apa yang Sudah Kita Bangun

Kita sudah menempuh perjalanan yang cukup jauh dalam tiga part ini. Mari kita tatap sejenak apa yang sebenarnya sudah kita hasilkan — bukan sekadar daftar fitur, tapi pemahaman yang lebih dalam.

### Dari Part 1: Cara Berpikir tentang Performa

Kamu belajar bahwa Flutter memiliki tiga lapisan representasi: Widget Tree, Element Tree, dan Render Object Tree. Widget itu murah, RenderObject itu mahal. Dengan memahami ini, kamu tidak lagi menulis kode yang "asal jalan" — kamu menulis kode yang sadar akan biaya komputasi dari setiap pilihan arsitektur.

Keyword `const` bukan sekadar kebiasaan baik, tapi pernyataan eksplisit kepada Flutter: "instans widget ini tidak perlu dibuat ulang." `ListView.builder` bukan sekadar alternatif syntax, tapi pilihan fundamental antara membuat 200 widget vs membuat 10. Dan memisahkan widget bukan sekadar soal kebersihan kode, tapi soal mengisolasi perambatan rebuild.

### Dari Part 2: Cara Berpikir tentang Pengguna

Kamu belajar bahwa pengguna tidak melihat kode, mereka merasakan antarmuka. Dan "rasa" itu sangat dipengaruhi oleh ekspektasi yang sudah terbentuk dari penggunaan sehari-hari platform mereka. Dialog iOS yang muncul di Android tidak akan menyebabkan error, tapi akan membuat pengguna merasa asing dengan aplikasimu.

Konsep responsive (ubah ukuran) vs adaptive (ubah struktur) memberi kamu kerangka berpikir yang jelas. Dan `MediaQuery` adalah jembatan antara dunia fisik perangkat dengan dunia abstrak widget tree-mu.

### Dari Part 3: Cara Berpikir tentang Kanvas

`CustomPainter` membuka pintu ke level paling rendah dari rendering Flutter — di mana kamu berbicara langsung dengan kanvas menggunakan bahasa geometri. Tidak ada widget yang bisa membantumu di sini; hanya koordinat, kuas, dan jalur.

Yang lebih penting: kamu belajar bahwa setiap elemen visual yang kamu gambar adalah hasil dari serangkaian keputusan matematis yang eksplisit. Kurva mulus pada grafik bukan "efek" yang kamu aktifkan, tapi hasil dari Bezier curve dengan control point yang kamu hitung sendiri. Ini adalah fondasi yang sama yang digunakan oleh semua library grafis di dunia.

### Langkah Selanjutnya

Tiga part ini adalah fondasi. Dari sini, ada banyak arah yang bisa kamu eksplorasi:

**Untuk performa lebih lanjut:** Pelajari `RepaintBoundary` untuk mengisolasi area gambar yang sering berubah, dan `compute()` untuk menjalankan kalkulasi berat di thread terpisah.

**Untuk UI yang lebih kaya:** Pelajari `AnimatedBuilder` dan `Tween` untuk menambahkan animasi pada `CustomPainter` — grafik yang beranimasi saat pertama kali muncul, atau gauge yang bergerak secara real-time.

**Untuk arsitektur yang lebih scalable:** Seiring aplikasimu bertumbuh, callback sederhana yang kita gunakan akan terasa kurang memadai. Eksplorasi `Riverpod` atau `Bloc` untuk state management yang lebih terstruktur.

**Untuk aplikasi POS yang sesungguhnya:** Tambahkan persistensi data dengan `Isar` atau `Drift`, integrasi printer thermal dengan plugin Bluetooth, dan autentikasi kasir.

Kamu sudah memiliki pondasinya. Sekarang tinggal membangun.

---

## Referensi Tambahan

- [CustomPainter API (api.flutter.dev)](https://api.flutter.dev/flutter/rendering/CustomPainter-class.html)
- [Canvas API (api.flutter.dev)](https://api.flutter.dev/flutter/dart-ui/Canvas-class.html)
- [Path API (api.flutter.dev)](https://api.flutter.dev/flutter/dart-ui/Path-class.html)
- [Flutter Rendering Pipeline — Penjelasan mendalam (flutter.dev)](https://docs.flutter.dev/resources/architectural-overview#rendering-and-layout)
- [Bezier Curves — Penjelasan visual interaktif (bezier.method.ac)](https://bezier.method.ac)
- [NavigationRail API (api.flutter.dev)](https://api.flutter.dev/flutter/material/NavigationRail-class.html)
- [IndexedStack API (api.flutter.dev)](https://api.flutter.dev/flutter/widgets/IndexedStack-class.html)

---

_Seri Tutorial Flutter: Dashboard POS yang Optimal dan Adaptif_
_Part 3 dari 3 — Selesai | Ditulis untuk Flutter 3.41.5_

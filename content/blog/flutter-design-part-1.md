---
title: "Flutter Basic Design - Part 1: Fondasi Layout Modern di Flutter"
date: "Mar 26, 2026"
description: "Part 1: Fondasi Layout Modern di Flutter"
---

Halo, selamat datang di seri tutorial Flutter pertama yang akan kubuat. Aku akan memandu kamu memahami fondasi layout modern di Flutter dengan cara yang sangat sederhana dan mudah dipahami, bahkan jika kamu baru pertama kali menyentuh Flutter.

## Pendahuluan

Flutter adalah framework yang kuat untuk membangun aplikasi lintas platform. Salah satu kekuatan utamanya adalah sistem layout yang fleksibel dan deklaratif. Sebelum kita bisa membuat UI yang indah dan responsif, kita harus memahami fondasi layout terlebih dahulu.

Dalam tutorial ini, kita akan belajar lima komponen layout fundamental: Column, Row, Container, Expanded, dan Stack. Setiap komponen ini memiliki peran spesifik dalam menyusun antarmuka pengguna.

## Persiapan Project

Pertama, buatlah project Flutter baru dengan perintah berikut:

```bash
flutter create modern_ui_tutorial
cd modern_ui_tutorial
```

Pastikan Flutter versi 3.41.5 atau lebih baru sudah terinstal di sistem kamu. Kamu bisa memeriksa versi dengan menjalankan:

```bash
flutter --version
```

## Memahami Column dan Row

### Column: Menyusun Widget Secara Vertikal

Column adalah widget yang menyusun anak-anaknya secara vertikal dari atas ke bawah. Bayangkan Column seperti tumpukan buku yang diletakkan berdiri.

**Properti utama Column:**

- `mainAxisAlignment`: Mengatur posisi anak-anak di sumbu utama (vertikal)
- `crossAxisAlignment`: Mengatur posisi anak-anak di sumbu silang (horizontal)
- `children`: List widget yang akan ditampilkan

Mari kita lihat contoh implementasi:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fondasi Layout Flutter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const ColumnExample(),
    );
  }
}

class ColumnExample extends StatelessWidget {
  const ColumnExample({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contoh Column'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 50,
            color: Colors.red,
            child: const Center(
              child: Text(
                'Item 1',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            width: 100,
            height: 50,
            color: Colors.green,
            child: const Center(
              child: Text(
                'Item 2',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            width: 100,
            height: 50,
            color: Colors.blue,
            child: const Center(
              child: Text(
                'Item 3',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

**Penjelasan kode di atas:**

1. `mainAxisAlignment: MainAxisAlignment.center` membuat semua item berada di tengah secara vertikal
2. `crossAxisAlignment: CrossAxisAlignment.center` membuat semua item berada di tengah secara horizontal
3. `SizedBox` dengan `height: 10` memberikan jarak 10 pixel antara setiap item
4. Setiap Container memiliki lebar tetap 100 dan tinggi 50

### Row: Menyusun Widget Secara Horizontal

Row adalah kebalikan dari Column. Row menyusun anak-anaknya secara horizontal dari kiri ke kanan. Bayangkan Row seperti buku-buku yang diletakkan berbaris di rak.

**Properti utama Row:**

- `mainAxisAlignment`: Mengatur posisi anak-anak di sumbu utama (horizontal)
- `crossAxisAlignment`: Mengatur posisi anak-anak di sumbu silang (vertikal)
- `children`: List widget yang akan ditampilkan

Berikut contoh implementasi Row:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fondasi Layout Flutter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const RowExample(),
    );
  }
}

class RowExample extends StatelessWidget {
  const RowExample({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contoh Row'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Center(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              color: Colors.orange,
              child: const Center(
                child: Text(
                  'A',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Container(
              width: 80,
              height: 80,
              color: Colors.purple,
              child: const Center(
                child: Text(
                  'B',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Container(
              width: 80,
              height: 80,
              color: Colors.teal,
              child: const Center(
                child: Text(
                  'C',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

**Perbedaan utama Column dan Row:**

| Aspek      | Column                   | Row                        |
| ---------- | ------------------------ | -------------------------- |
| Arah       | Vertikal (atas ke bawah) | Horizontal (kiri ke kanan) |
| Main Axis  | Vertikal                 | Horizontal                 |
| Cross Axis | Horizontal               | Vertikal                   |

## Memahami Container

Container adalah widget serbaguna yang bisa digunakan untuk mengatur tampilan, ukuran, padding, margin, dekorasi, dan banyak lagi. Container adalah salah satu widget yang paling sering digunakan dalam Flutter.

**Properti penting Container:**

- `width` dan `height`: Mengatur ukuran container
- `padding`: Ruang di dalam container (antara border dan konten)
- `margin`: Ruang di luar container
- `decoration`: Mengatur tampilan seperti warna, border, shadow, gradient
- `alignment`: Mengatur posisi child di dalam container
- `child`: Widget yang akan ditampilkan di dalam container

Mari kita lihat contoh lengkap penggunaan Container:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fondasi Layout Flutter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const ContainerExample(),
    );
  }
}

class ContainerExample extends StatelessWidget {
  const ContainerExample({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contoh Container'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Center(
        child: Container(
          width: 300,
          height: 200,
          margin: const EdgeInsets.all(20),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
            border: Border.all(
              color: Colors.deepPurple,
              width: 2,
            ),
          ),
          alignment: Alignment.center,
          child: const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.favorite,
                color: Colors.red,
                size: 50,
              ),
              SizedBox(height: 10),
              Text(
                'Container yang Indah',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.deepPurple,
                ),
              ),
              SizedBox(height: 5),
              Text(
                'Dengan shadow, border, dan border radius',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

**Penjelasan detail Container:**

1. `margin: EdgeInsets.all(20)` memberikan jarak 20 pixel di semua sisi luar container
2. `padding: EdgeInsets.all(20)` memberikan jarak 20 pixel di semua sisi dalam container
3. `BoxDecoration` memungkinkan kita mengatur tampilan yang lebih kompleks:
   - `borderRadius: BorderRadius.circular(20)` membuat sudut container melengkung
   - `boxShadow` menambahkan efek bayangan
   - `border` menambahkan garis tepi berwarna ungu
4. `alignment: Alignment.center` membuat child berada di tengah container

## Memahami Expanded

Expanded adalah widget yang memberitahu Flutter untuk memberikan ruang sebanyak mungkin kepada child-nya. Expanded sangat berguna ketika kamu ingin widget mengisi ruang yang tersisa dalam Column atau Row.

**Cara kerja Expanded:**

- Dalam Column: Expanded akan mengisi ruang vertikal yang tersisa
- Dalam Row: Expanded akan mengisi ruang horizontal yang tersisa
- Kamu bisa menggunakan `flex` property untuk mengatur proporsi ruang jika ada multiple Expanded

Mari kita lihat contoh penggunaan Expanded:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fondasi Layout Flutter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const ExpandedExample(),
    );
  }
}

class ExpandedExample extends StatelessWidget {
  const ExpandedExample({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contoh Expanded'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Column(
        children: [
          // Header dengan ukuran tetap
          Container(
            width: double.infinity,
            height: 80,
            color: Colors.deepPurple,
            alignment: Alignment.center,
            child: const Text(
              'Header (Fixed Height)',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          // Konten utama yang mengisi ruang tersisa
          Expanded(
            child: Container(
              width: double.infinity,
              color: Colors.amber[100],
              alignment: Alignment.center,
              child: const Text(
                'Konten Utama (Expanded)',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          // Footer dengan ukuran tetap
          Container(
            width: double.infinity,
            height: 60,
            color: Colors.deepPurple,
            alignment: Alignment.center,
            child: const Text(
              'Footer (Fixed Height)',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

**Contoh Expanded dengan Flex:**

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fondasi Layout Flutter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const ExpandedFlexExample(),
    );
  }
}

class ExpandedFlexExample extends StatelessWidget {
  const ExpandedFlexExample({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contoh Expanded dengan Flex'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Column(
        children: [
          Expanded(
            flex: 2,
            child: Container(
              width: double.infinity,
              color: Colors.red,
              alignment: Alignment.center,
              child: const Text(
                'Flex: 2 (2/6 ruang)',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Container(
              width: double.infinity,
              color: Colors.green,
              alignment: Alignment.center,
              child: const Text(
                'Flex: 3 (3/6 ruang)',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          Expanded(
            flex: 1,
            child: Container(
              width: double.infinity,
              color: Colors.blue,
              alignment: Alignment.center,
              child: const Text(
                'Flex: 1 (1/6 ruang)',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

**Penjelasan Flex:**

- Total flex adalah 2 + 3 + 1 = 6
- Container merah mendapat 2/6 atau 33.3% ruang
- Container hijau mendapat 3/6 atau 50% ruang
- Container biru mendapat 1/6 atau 16.7% ruang

## Memahami Stack

Stack adalah widget yang menumpuk anak-anaknya satu di atas yang lain. Stack sangat berguna untuk membuat tampilan yang kompleks seperti card dengan gambar background, badge notifikasi, atau overlay.

**Properti utama Stack:**

- `children`: List widget yang akan ditumpuk (widget pertama di paling bawah)
- `alignment`: Mengatur posisi default anak-anak
- `fit`: Mengatur bagaimana anak-anak yang non-positioned menyesuaikan diri

**Widget Positioned:**

- Digunakan di dalam Stack untuk menempatkan widget di posisi spesifik
- Properties: `top`, `bottom`, `left`, `right`

Mari kita lihat contoh penggunaan Stack:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fondasi Layout Flutter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const StackExample(),
    );
  }
}

class StackExample extends StatelessWidget {
  const StackExample({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contoh Stack'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Center(
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Layer 1: Background Container (paling bawah)
            Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Colors.deepPurple, Colors.purple.shade300],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            // Layer 2: Icon di tengah
            const Icon(
              Icons.cloud,
              size: 100,
              color: Colors.white70,
            ),
            // Layer 3: Badge notifikasi di pojok kanan atas
            Positioned(
              top: 20,
              right: 20,
              child: Container(
                width: 40,
                height: 40,
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: const Text(
                  '3',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            // Layer 4: Label di pojok kiri bawah
            Positioned(
              bottom: 20,
              left: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Premium',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

**Urutan layer dalam Stack:**

1. Container dengan gradient (paling bawah)
2. Icon cloud (di tengah)
3. Badge notifikasi (pojok kanan atas)
4. Label Premium (pojok kiri bawah, paling atas)

## Kerangka UI Dasar: Menggabungkan Semua Komponen

Sekarang kita akan menggabungkan semua komponen yang sudah dipelajari untuk membuat kerangka UI dasar yang lebih kompleks. Kerangka ini akan menjadi fondasi yang akan kita kembangkan di Part 2 dan Part 3.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fondasi Layout Flutter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const BasicUILayout(),
    );
  }
}

class BasicUILayout extends StatelessWidget {
  const BasicUILayout({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header Section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.deepPurple,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(30),
                  bottomRight: Radius.circular(30),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.deepPurple.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Selamat Datang,',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Pengguna Flutter',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.person,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.search,
                          color: Colors.white70,
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Text(
                            'Cari sesuatu...',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 16,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.tune,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Stats Section
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      icon: Icons.shopping_bag,
                      title: 'Total Order',
                      value: '1,234',
                      color: Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 15),
                  Expanded(
                    child: _buildStatCard(
                      icon: Icons.attach_money,
                      title: 'Pendapatan',
                      value: 'Rp 12M',
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
            ),
            // Content Section
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Menu Utama',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 15),
                    Expanded(
                      child: GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 15,
                        mainAxisSpacing: 15,
                        children: [
                          _buildMenuCard(
                            icon: Icons.dashboard,
                            title: 'Dashboard',
                            color: Colors.deepPurple,
                          ),
                          _buildMenuCard(
                            icon: Icons.analytics,
                            title: 'Analitik',
                            color: Colors.orange,
                          ),
                          _buildMenuCard(
                            icon: Icons.people,
                            title: 'Pelanggan',
                            color: Colors.teal,
                          ),
                          _buildMenuCard(
                            icon: Icons.settings,
                            title: 'Pengaturan',
                            color: Colors.red,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Bottom Navigation
            Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildNavItem(icon: Icons.home, label: 'Beranda', isActive: true),
                  _buildNavItem(icon: Icons.explore, label: 'Jelajah', isActive: false),
                  _buildNavItem(icon: Icons.favorite, label: 'Favorit', isActive: false),
                  _buildNavItem(icon: Icons.person, label: 'Profil', isActive: false),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: color,
              size: 24,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuCard({
    required IconData icon,
    required String title,
    required Color color,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: color,
              size: 32,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required bool isActive,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          color: isActive ? Colors.deepPurple : Colors.grey,
          size: 24,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.deepPurple : Colors.grey,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
```

## Penjelasan Struktur Kerangka UI

Mari kita bedah struktur kerangka UI yang sudah kita buat:

### 1. Header Section (Container dengan Stack internal)

- Menggunakan Container dengan dekorasi lengkap (warna, border radius, shadow)
- Di dalamnya ada Column yang berisi:
  - Row untuk welcome text dan avatar
  - Search bar dengan styling

### 2. Stats Section (Row dengan Expanded)

- Menggunakan Row dengan dua Expanded child
- Setiap stat card menggunakan Container dengan dekorasi
- Expanded memastikan kedua card memiliki lebar yang sama

### 3. Content Section (Expanded dengan GridView)

- Expanded mengisi ruang tersisa
- GridView.count dengan 2 kolom untuk menu
- Setiap menu card menggunakan Container dengan shadow dan icon

### 4. Bottom Navigation (Container di bagian bawah)

- Container dengan shadow di bagian atas
- Row dengan 4 item navigasi
- Setiap item adalah Column berisi Icon dan Text

## Kesimpulan Part 1

Dalam tutorial ini, kita telah mempelajari:

1. **Column**: Menyusun widget secara vertikal dengan kontrol alignment
2. **Row**: Menyusun widget secara horizontal dengan kontrol alignment
3. **Container**: Widget serbaguna untuk styling, padding, margin, dan dekorasi
4. **Expanded**: Memberikan ruang fleksibel dalam Column atau Row
5. **Stack**: Menumpuk widget satu di atas yang lain dengan kontrol posisi

Kerangka UI yang kita buat akan menjadi fondasi untuk Part 2, di mana kita akan menambahkan tipografi custom, tema warna yang lebih clean, dan animasi esensial.

**Latihan untuk kamu:**

- Coba ubah warna tema dari deepPurple menjadi warna favoritmu
- Tambahkan satu stat card lagi dengan icon berbeda
- Ubah jumlah kolom di GridView dari 2 menjadi 3

Sampai jumpa di Part 2, di mana kita akan membuat UI ini terlihat lebih modern dan profesional.

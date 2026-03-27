---
title: "Best Practice Flutter 1: Dari Arsitektur Clean hingga Multithreading di Aplikasi POS"
date: "Mar 27, 2026"
description: "Best Practice Flutter 1: Dari Arsitektur Clean hingga Multithreading di Aplikasi POS"
---

> Seri Tutorial Flutter: Membangun Aplikasi Mini Point-of-Sale (POS)
> Flutter versi: 3.41.5 | Dart versi: 3.7.x

---

## Daftar Isi

1. [Kenapa Arsitektur Itu Penting Sejak Hari Pertama?](#1-kenapa-arsitektur-itu-penting-sejak-hari-pertama)
2. [Mengenal Dependency Injection dan get_it](#2-mengenal-dependency-injection-dan-get_it)
3. [Merancang Struktur Folder](#3-merancang-struktur-folder)
4. [Setup Project dan Dependensi](#4-setup-project-dan-dependensi)
5. [Konfigurasi get_it (Service Locator)](#5-konfigurasi-get_it-service-locator)
6. [Membuat Model Produk](#6-membuat-model-produk)
7. [Membuat Service Layer](#7-membuat-service-layer)
8. [Membangun UI Dashboard POS yang Responsif](#8-membangun-ui-dashboard-pos-yang-responsif)
9. [Menyatukan Semuanya di main.dart](#9-menyatukan-semuanya-di-maindart)
10. [Hasil Akhir dan Preview Part 2](#10-hasil-akhir-dan-preview-part-2)

---

## 1. Kenapa Arsitektur Itu Penting Sejak Hari Pertama?

Bayangkan kamu baru saja selesai membangun sebuah aplikasi. Kodenya berjalan dengan baik. Tapi enam bulan kemudian, klienmu meminta fitur baru: "Tolong tambahkan laporan penjualan harian." Kamu membuka kode, dan yang kamu temukan adalah ratusan baris di dalam satu file, logika bisnis bercampur dengan tampilan UI, dan variabel yang saling bergantung satu sama lain seperti benang kusut.

Situasi ini punya nama resminya: **Spaghetti Code**.

Arsitektur yang baik bukan tentang membuat kode terlihat pintar atau kompleks. Arsitektur yang baik adalah tentang membuat kode yang mudah dibaca, mudah diubah, dan mudah diuji --- bahkan oleh dirimu sendiri enam bulan ke depan.

Untuk aplikasi Mini POS ini, kita akan menggunakan pendekatan **Feature-First Architecture** yang dikombinasikan dengan **Service Layer**. Filosofinya sederhana:

- **Feature-First**: Kode diorganisir berdasarkan fitur (`products`, `cart`, `auth`), bukan berdasarkan tipe file. Jadi semua yang berkaitan dengan produk (model, UI, logika) ada di satu tempat.
- **Service Layer**: Logika bisnis (mengambil data, menghitung total) dipisahkan dari UI. Widget hanya bertanggung jawab untuk menampilkan data, bukan memprosesnya.

Kita tidak akan menerapkan Clean Architecture penuh dengan domain layer, repository layer, dan seterusnya. Itu terlalu berat untuk skala aplikasi ini. Kita mengejar **simplicity yang scalable**: sederhana sekarang, mudah diperluas nanti.

---

## 2. Mengenal Dependency Injection dan get_it

### Apa Masalahnya?

Perhatikan kode ini:

```dart
// CARA BURUK - Tightly Coupled
class CartScreen extends StatefulWidget {
  @override
  _CartScreenState createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  // CartScreen langsung membuat instance ProductService
  // Ini masalah besar!
  final ProductService _productService = ProductService();
}
```

Apa masalahnya? `CartScreen` sekarang **terkunci** (tightly coupled) dengan `ProductService`. Artinya:

- Kalau kamu mau ganti implementasi `ProductService`, kamu harus ubah `CartScreen` juga.
- Kalau kamu mau uji `CartScreen` secara terisolasi, `ProductService` akan ikut berjalan juga.
- Kalau ada 10 widget lain yang butuh `ProductService`, kamu akan membuat 10 instance berbeda --- pemborosan memori.

### Solusinya: Dependency Injection

Daripada setiap kelas **membuat** dependensinya sendiri, kita **berikan** dependensi itu dari luar. Seperti seorang karyawan yang tidak perlu membeli komputernya sendiri --- perusahaan yang menyediakan.

```dart
// CARA BAIK - Loosely Coupled
class CartScreen extends StatefulWidget {
  final ProductService productService; // Dependensi "disuntikkan" dari luar

  const CartScreen({required this.productService});
}
```

### Mengapa get_it?

Dengan `get_it`, kita punya satu tempat terpusat (disebut **Service Locator**) yang menyimpan semua instance service. Siapa pun yang butuh `ProductService` cukup "memintanya" dari get_it, tanpa perlu tahu bagaimana cara membuatnya.

```dart
// Daftar sekali
getIt.registerSingleton<ProductService>(ProductService());

// Ambil dari mana saja
final service = getIt<ProductService>();
```

`get_it` jauh lebih ringan dan sederhana dibanding solusi DI seperti `injectable` + `code generation`. Untuk skala aplikasi ini, `get_it` adalah pilihan yang tepat.

---

## 3. Merancang Struktur Folder

Berikut adalah struktur folder yang akan kita bangun. Baca komentar di setiap baris untuk memahami filosofi di baliknya:

```
lib/
├── core/                        # Fondasi aplikasi, tidak berkaitan dengan fitur apapun
│   ├── constants/
│   │   └── app_constants.dart   # Warna, ukuran, string yang digunakan global
│   ├── di/
│   │   └── service_locator.dart # Pusat registrasi get_it
│   ├── router/
│   │   └── app_router.dart      # Definisi semua rute navigasi
│   └── theme/
│       └── app_theme.dart       # Tema Material Design aplikasi
│
├── features/                    # Semua fitur aplikasi
│   ├── auth/                    # Fitur autentikasi (login/logout)
│   │   ├── data/
│   │   │   └── auth_service.dart
│   │   └── presentation/
│   │       └── login_screen.dart
│   │
│   ├── dashboard/               # Layar utama POS
│   │   └── presentation/
│   │       ├── dashboard_screen.dart
│   │       └── widgets/
│   │           ├── product_grid.dart
│   │           └── cart_panel.dart
│   │
│   └── products/                # Fitur manajemen produk
│       ├── data/
│       │   └── product_service.dart
│       └── models/
│           └── product_model.dart
│
└── main.dart                    # Entry point aplikasi
```

Pola di dalam setiap fitur juga konsisten:

- `data/` berisi service (logika bisnis, akses data).
- `models/` berisi struktur data (kelas Dart murni).
- `presentation/` berisi widget (semua yang berkaitan dengan UI).

---

## 4. Setup Project dan Dependensi

Buat project Flutter baru, lalu buka file `pubspec.yaml` dan tambahkan dependensi berikut:

```yaml
# pubspec.yaml

name: mini_pos
description: Aplikasi Mini Point-of-Sale Tutorial

publish_to: "none"

version: 1.0.0+1

environment:
  sdk: ">=3.7.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter

  # Dependency Injection - Service Locator
  get_it: ^8.0.3

  # State Management - akan digunakan mulai Part 2
  provider: ^6.1.2

  # Local Storage - akan digunakan mulai Part 2
  hive_flutter: ^1.1.0

  # Secure Storage - akan digunakan mulai Part 2
  flutter_secure_storage: ^9.2.4

  # UUID generator untuk ID produk
  uuid: ^4.5.1

  # Ikon tambahan
  cupertino_icons: ^1.0.8

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0

flutter:
  uses-material-design: true
```

Jalankan perintah ini di terminal untuk mengunduh semua dependensi:

```bash
flutter pub get
```

---

## 5. Konfigurasi get_it (Service Locator)

Ini adalah jantung dari sistem DI kita. Buat file berikut:

```dart
// lib/core/di/service_locator.dart

import 'package:get_it/get_it.dart';
import 'package:mini_pos/features/products/data/product_service.dart';
import 'package:mini_pos/features/auth/data/auth_service.dart';

// GetIt.instance adalah singleton global bawaan get_it.
// Kita buat alias "getIt" agar lebih pendek saat digunakan di file lain.
final GetIt getIt = GetIt.instance;

// Fungsi ini dipanggil SEKALI saja di main.dart sebelum aplikasi berjalan.
// Semua service didaftarkan di sini.
Future<void> setupServiceLocator() async {
  // registerLazySingleton: Instance dibuat HANYA ketika pertama kali diminta.
  // Berbeda dengan registerSingleton yang langsung dibuat saat registrasi.
  // Lazy adalah pilihan lebih efisien untuk service yang mungkin tidak selalu dibutuhkan.
  getIt.registerLazySingleton<ProductService>(() => ProductService());

  // AuthService juga didaftarkan sebagai lazy singleton.
  // Satu instance untuk seluruh siklus hidup aplikasi.
  getIt.registerLazySingleton<AuthService>(() => AuthService());
}
```

**Mengapa `registerLazySingleton` bukan `registerFactory`?**

Ada tiga cara registrasi utama di get_it:

- `registerFactory`: Membuat instance **baru** setiap kali diminta. Cocok untuk objek yang punya state dan tidak boleh dibagi.
- `registerSingleton`: Membuat **satu** instance langsung saat registrasi. Instance yang sama akan digunakan selamanya.
- `registerLazySingleton`: Membuat **satu** instance, tapi hanya saat **pertama kali** diminta. Ini yang paling sering kita gunakan untuk service karena menggabungkan efisiensi memori dengan kemudahan singleton.

Untuk service seperti `ProductService` yang akan diakses dari banyak tempat dan tidak boleh punya state yang berbeda-beda, `registerLazySingleton` adalah pilihan ideal.

---

## 6. Membuat Model Produk

Model adalah representasi data. Kelas ini murni Dart --- tidak ada logika UI, tidak ada logika bisnis, hanya struktur data.

```dart
// lib/features/products/models/product_model.dart

// Kita tidak menggunakan library code generation seperti json_serializable
// di sini untuk menjaga tutorial tetap simpel dan fokus.
// Kita tulis serialisasi JSON secara manual --- cara terbaik untuk benar-benar
// memahami apa yang terjadi di balik layar.

class Product {
  final String id;
  final String name;
  final String category;
  final double price;
  final int stock;
  final String imageEmoji; // Kita pakai emoji sebagai "gambar" produk untuk simplicity

  // Constructor menggunakan named parameters dengan "required" keyword.
  // Ini memaksa siapa pun yang membuat Product untuk mengisi semua field ---
  // tidak ada field yang terlewat secara tidak sengaja.
  const Product({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.stock,
    required this.imageEmoji,
  });

  // Factory constructor untuk membuat Product dari Map (hasil parsing JSON).
  // Pola "factory constructor" lebih idiomatis di Dart dibanding static method
  // untuk kasus seperti ini.
  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      // Operator "as String" memberikan type safety eksplisit.
      // Kalau data dari JSON ternyata bukan String, Dart akan melempar error
      // yang jelas --- lebih mudah di-debug daripada error yang misterius.
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      // Harga bisa datang sebagai int atau double dari JSON,
      // jadi kita konversi via num untuk keamanan.
      price: (json['price'] as num).toDouble(),
      stock: json['stock'] as int,
      imageEmoji: json['imageEmoji'] as String,
    );
  }

  // Method untuk mengonversi Product kembali ke Map.
  // Berguna saat kita perlu menyimpan data ke storage lokal (Part 2).
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'price': price,
      'stock': stock,
      'imageEmoji': imageEmoji,
    };
  }

  // copyWith berguna untuk memperbarui sebagian field tanpa mengubah yang lain.
  // Penting karena Product adalah immutable (semua field adalah final).
  // Contoh penggunaan: product.copyWith(stock: product.stock - 1)
  Product copyWith({
    String? id,
    String? name,
    String? category,
    double? price,
    int? stock,
    String? imageEmoji,
  }) {
    return Product(
      id: id ?? this.id,
      name: name ?? this.name,
      category: category ?? this.category,
      price: price ?? this.price,
      stock: stock ?? this.stock,
      imageEmoji: imageEmoji ?? this.imageEmoji,
    );
  }

  // Override == dan hashCode agar dua Product dengan id yang sama
  // dianggap identik saat dibandingkan (penting untuk operasi List.contains, Set, dll).
  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is Product && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Product(id: $id, name: $name, price: $price)';
}
```

Perhatikan bahwa semua field di `Product` adalah `final`. Ini menjadikan `Product` sebagai **immutable object** --- nilainya tidak bisa diubah setelah dibuat. Ini bukan sekadar gaya, tapi pilihan desain yang mencegah bug yang sulit dilacak akibat state yang berubah di tempat yang tidak terduga.

---

## 7. Membuat Service Layer

Service adalah tempat logika bisnis tinggal. Ia mengetahui cara mendapatkan data, tapi tidak peduli bagaimana data itu ditampilkan.

Pertama, buat AuthService sebagai persiapan untuk Part 2:

```dart
// lib/features/auth/data/auth_service.dart

// AuthService versi Part 1 ini masih sangat sederhana ---
// hanya menyimpan state login di memori.
// Di Part 2, kita akan menggantinya dengan implementasi yang menggunakan
// flutter_secure_storage untuk menyimpan token secara aman.
class AuthService {
  // Underscore di depan nama variabel menandakan ini adalah private member.
  // Tidak bisa diakses dari luar kelas ini secara langsung.
  bool _isLoggedIn = false;
  String? _currentUserName;

  bool get isLoggedIn => _isLoggedIn;
  String? get currentUserName => _currentUserName;

  // Simulasi login sederhana. Di Part 2, ini akan memanggil API
  // dan menyimpan token ke secure storage.
  Future<bool> login(String username, String password) async {
    // Simulasi delay jaringan agar terasa realistis
    await Future.delayed(const Duration(milliseconds: 800));

    // Kredensial hardcoded untuk tujuan tutorial.
    // JANGAN lakukan ini di aplikasi produksi.
    if (username == 'kasir' && password == '12345') {
      _isLoggedIn = true;
      _currentUserName = username;
      return true;
    }
    return false;
  }

  Future<void> logout() async {
    _isLoggedIn = false;
    _currentUserName = null;
  }
}
```

Sekarang, buat `ProductService`. Ini adalah service terpenting di Part 1:

```dart
// lib/features/products/data/product_service.dart

import 'package:mini_pos/features/products/models/product_model.dart';
import 'package:uuid/uuid.dart';

class ProductService {
  // Uuid adalah utility untuk membuat ID unik yang hampir tidak mungkin bentrok.
  // Lebih baik dari menggunakan angka berurutan (1, 2, 3) yang bisa bertabrakan
  // saat data datang dari berbagai sumber.
  final _uuid = const Uuid();

  // Kita simpan data produk di memori untuk Part 1.
  // Di Part 2, list ini akan diisi dari database lokal (Hive).
  // Dengan memisahkan data di sini, Part 2 nanti hanya perlu mengubah
  // ProductService tanpa menyentuh kode UI sama sekali.
  late final List<Product> _products;

  ProductService() {
    // Inisialisasi data dummy di constructor.
    // Kita pakai late final agar _products bisa diinisialisasi
    // di constructor body, bukan di deklarasi.
    _products = _generateDummyProducts();
  }

  // Mengembalikan semua produk. Kita kembalikan unmodifiable view
  // agar pemanggil tidak bisa memodifikasi list internal kita secara langsung.
  // Ini prinsip encapsulation: semua modifikasi HARUS melalui method di service ini.
  List<Product> getAllProducts() {
    return List.unmodifiable(_products);
  }

  // Filter produk berdasarkan kategori.
  List<Product> getProductsByCategory(String category) {
    if (category == 'Semua') return getAllProducts();
    return _products.where((p) => p.category == category).toList();
  }

  // Ambil daftar kategori unik dari data produk yang ada.
  // Kita awali dengan 'Semua' sebagai opsi default.
  List<String> getCategories() {
    final categories = _products.map((p) => p.category).toSet().toList();
    categories.sort(); // Urutkan alfabetis
    return ['Semua', ...categories];
  }

  // Cari produk berdasarkan nama (case-insensitive).
  List<Product> searchProducts(String query) {
    if (query.isEmpty) return getAllProducts();
    final lowerQuery = query.toLowerCase();
    return _products
        .where((p) => p.name.toLowerCase().contains(lowerQuery))
        .toList();
  }

  // Method privat untuk generate data dummy.
  // Prefix underscore menandakan ini hanya untuk pemakaian internal.
  List<Product> _generateDummyProducts() {
    // Data produk kita definisikan sebagai list of map agar mudah dibaca
    // dan mudah ditambahkan item baru tanpa mengulang banyak kode.
    final rawData = [
      // Minuman
      {'name': 'Es Teh Manis', 'category': 'Minuman', 'price': 5000.0, 'stock': 50, 'emoji': '🧋'},
      {'name': 'Kopi Hitam', 'category': 'Minuman', 'price': 8000.0, 'stock': 30, 'emoji': '☕'},
      {'name': 'Jus Jeruk', 'category': 'Minuman', 'price': 12000.0, 'stock': 20, 'emoji': '🍊'},
      {'name': 'Air Mineral', 'category': 'Minuman', 'price': 4000.0, 'stock': 100, 'emoji': '💧'},
      {'name': 'Susu Coklat', 'category': 'Minuman', 'price': 10000.0, 'stock': 25, 'emoji': '🥛'},
      // Makanan
      {'name': 'Nasi Goreng', 'category': 'Makanan', 'price': 20000.0, 'stock': 15, 'emoji': '🍳'},
      {'name': 'Mie Ayam', 'category': 'Makanan', 'price': 18000.0, 'stock': 20, 'emoji': '🍜'},
      {'name': 'Gado-gado', 'category': 'Makanan', 'price': 15000.0, 'stock': 10, 'emoji': '🥗'},
      {'name': 'Soto Ayam', 'category': 'Makanan', 'price': 22000.0, 'stock': 12, 'emoji': '🍲'},
      {'name': 'Roti Bakar', 'category': 'Makanan', 'price': 14000.0, 'stock': 30, 'emoji': '🍞'},
      // Snack
      {'name': 'Keripik Singkong', 'category': 'Snack', 'price': 7000.0, 'stock': 40, 'emoji': '🥨'},
      {'name': 'Pisang Goreng', 'category': 'Snack', 'price': 9000.0, 'stock': 25, 'emoji': '🍌'},
      {'name': 'Donat', 'category': 'Snack', 'price': 6000.0, 'stock': 35, 'emoji': '🍩'},
      {'name': 'Martabak Mini', 'category': 'Snack', 'price': 11000.0, 'stock': 15, 'emoji': '🥞'},
    ];

    // Map setiap raw data menjadi Product menggunakan factory constructor.
    return rawData.map((data) {
      return Product(
        id: _uuid.v4(), // Generate ID unik untuk setiap produk
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

## 8. Membangun UI Dashboard POS yang Responsif

Sekarang bagian yang menyenangkan: membangun tampilannya. Kita akan membangun beberapa widget yang akan disatukan.

### Tema Aplikasi

Pertama, tentukan palet warna dan tema. Semua nilai visual dikentralisasi di sini agar mudah diubah:

```dart
// lib/core/theme/app_theme.dart

import 'package:flutter/material.dart';

class AppColors {
  // Warna tidak bisa diinstansiasi
  AppColors._();

  static const Color primary = Color(0xFF1A1A2E);     // Dark navy - background utama
  static const Color secondary = Color(0xFF16213E);   // Dark navy lebih dalam
  static const Color surface = Color(0xFF0F3460);     // Biru gelap untuk kartu
  static const Color accent = Color(0xFFE94560);      // Merah-pink vibrant untuk aksi utama
  static const Color accentGreen = Color(0xFF4CAF50); // Hijau untuk konfirmasi/sukses
  static const Color accentAmber = Color(0xFFFFC107); // Amber untuk peringatan/badge
  static const Color textPrimary = Color(0xFFF5F5F5);
  static const Color textSecondary = Color(0xFF9E9E9E);
  static const Color cardBackground = Color(0xFF1E2A3A);
  static const Color divider = Color(0xFF2A3A4A);
}

class AppTheme {
  AppTheme._();

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.primary,

      colorScheme: const ColorScheme.dark(
        primary: AppColors.accent,
        secondary: AppColors.accentGreen,
        surface: AppColors.surface,
        onPrimary: Colors.white,
        onSurface: AppColors.textPrimary,
      ),

      // AppBar theme
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.secondary,
        elevation: 0,
        titleTextStyle: TextStyle(
          color: AppColors.textPrimary,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
        iconTheme: IconThemeData(color: AppColors.textPrimary),
      ),

      // Card theme
      cardTheme: CardThemeData(
        color: AppColors.cardBackground,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),

      // ElevatedButton theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accent,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        ),
      ),

      // Input decoration theme untuk TextField
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.cardBackground,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.accent, width: 2),
        ),
        hintStyle: const TextStyle(color: AppColors.textSecondary),
        prefixIconColor: AppColors.textSecondary,
      ),
    );
  }
}
```

### Konstanta Aplikasi

```dart
// lib/core/constants/app_constants.dart

class AppConstants {
  AppConstants._();

  // String
  static const String appName = 'Mini POS';
  static const String currency = 'Rp';

  // Layout
  // Breakpoint ini menentukan kapan tampilan beralih dari mobile ke tablet/desktop.
  // Di bawah 768px = layout mobile (satu kolom), di atasnya = layout split (dua panel).
  static const double tabletBreakpoint = 768.0;

  // Grid
  static const int mobileGridColumns = 2;
  static const int tabletGridColumns = 3;
  static const int desktopGridColumns = 4;
}
```

### Layar Login Sederhana

```dart
// lib/features/auth/presentation/login_screen.dart

import 'package:flutter/material.dart';
import 'package:mini_pos/core/di/service_locator.dart';
import 'package:mini_pos/core/theme/app_theme.dart';
import 'package:mini_pos/features/auth/data/auth_service.dart';
import 'package:mini_pos/features/dashboard/presentation/dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // TextEditingController digunakan untuk mengambil nilai dari TextField.
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  // GlobalKey untuk Form memungkinkan kita memanggil validate() dari luar widget Form.
  final _formKey = GlobalKey<FormState>();

  bool _isLoading = false;
  bool _obscurePassword = true; // Untuk toggle show/hide password

  // Kita ambil AuthService dari service locator, bukan membuat instance baru.
  // Ini adalah DI dalam aksi!
  final _authService = getIt<AuthService>();

  // Selalu dispose controller yang kamu buat untuk mencegah memory leak.
  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    // Validasi form. Kalau ada field yang tidak valid, hentikan proses.
    if (!_formKey.currentState!.validate()) return;

    // Set loading state agar tombol berubah menjadi indicator loading
    setState(() => _isLoading = true);

    try {
      final success = await _authService.login(
        _usernameController.text.trim(),
        _passwordController.text,
      );

      // Pengecekan mounted penting saat melakukan operasi async.
      // Widget bisa saja sudah di-dispose sementara kita menunggu Future selesai.
      if (!mounted) return;

      if (success) {
        // Navigasi ke dashboard dan hapus semua route sebelumnya dari stack.
        // Ini memastikan tombol back tidak membawa pengguna kembali ke login.
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const DashboardScreen()),
          (route) => false,
        );
      } else {
        // Tampilkan snackbar error jika login gagal
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Username atau password salah.'),
            backgroundColor: AppColors.accent,
          ),
        );
      }
    } finally {
      // Blok finally selalu berjalan, baik sukses maupun error.
      // Ini memastikan loading indicator selalu dimatikan.
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: ConstrainedBox(
            // Batasi lebar form agar tidak terlalu lebar di layar besar.
            constraints: const BoxConstraints(maxWidth: 400),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo / Header
                  const Icon(
                    Icons.point_of_sale,
                    size: 72,
                    color: AppColors.accent,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Mini POS',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const Text(
                    'Silakan masuk untuk melanjutkan',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 48),

                  // Field Username
                  TextFormField(
                    controller: _usernameController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'Username',
                      labelStyle: TextStyle(color: AppColors.textSecondary),
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    // Validator dijalankan saat _formKey.currentState!.validate() dipanggil
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Username tidak boleh kosong';
                      }
                      return null; // null berarti valid
                    },
                  ),
                  const SizedBox(height: 16),

                  // Field Password
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: InputDecoration(
                      labelText: 'Password',
                      labelStyle: const TextStyle(color: AppColors.textSecondary),
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off : Icons.visibility,
                          color: AppColors.textSecondary,
                        ),
                        onPressed: () {
                          setState(() => _obscurePassword = !_obscurePassword);
                        },
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Password tidak boleh kosong';
                      }
                      return null;
                    },
                    // Ini memungkinkan pengguna submit form dengan menekan "Done" di keyboard
                    onFieldSubmitted: (_) => _handleLogin(),
                  ),
                  const SizedBox(height: 32),

                  // Tombol Login
                  SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Text('Masuk', style: TextStyle(fontSize: 16)),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Hint untuk pembaca tutorial
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.cardBackground,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.divider),
                    ),
                    child: const Column(
                      children: [
                        Text(
                          'Kredensial Demo',
                          style: TextStyle(
                            color: AppColors.accentAmber,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Username: kasir\nPassword: 12345',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

### Widget Kartu Produk

```dart
// lib/features/dashboard/presentation/widgets/product_card.dart

import 'package:flutter/material.dart';
import 'package:mini_pos/core/theme/app_theme.dart';
import 'package:mini_pos/features/products/models/product_model.dart';

// Kita buat ProductCard sebagai StatelessWidget karena ia tidak punya state sendiri.
// Semua data yang dibutuhkan diberikan dari luar via constructor.
// Ini mengikuti prinsip "dumb component" --- komponen hanya menampilkan data,
// tidak pernah memodifikasinya.
class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onAddToCart; // Callback saat tombol "+" ditekan

  const ProductCard({
    super.key,
    required this.product,
    required this.onAddToCart,
  });

  @override
  Widget build(BuildContext context) {
    final isOutOfStock = product.stock == 0;

    return Card(
      clipBehavior: Clip.antiAlias, // Memastikan konten tidak keluar dari border radius
      child: InkWell(
        // InkWell memberikan efek ripple saat disentuh
        onTap: isOutOfStock ? null : onAddToCart,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Emoji sebagai "gambar" produk
              Center(
                child: Text(
                  product.imageEmoji,
                  style: const TextStyle(fontSize: 40),
                ),
              ),
              const SizedBox(height: 8),

              // Nama produk
              Text(
                product.name,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis, // Tambahkan "..." jika teks terlalu panjang
              ),
              const SizedBox(height: 4),

              // Harga
              Text(
                'Rp ${_formatPrice(product.price)}',
                style: const TextStyle(
                  color: AppColors.accent,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),

              const Spacer(), // Mendorong konten di bawah ke bagian bawah kartu

              // Baris bawah: stok dan tombol tambah
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Badge stok
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: isOutOfStock
                          ? Colors.red.withAlpha(40)
                          : AppColors.accentGreen.withAlpha(40),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      isOutOfStock ? 'Habis' : 'Stok: ${product.stock}',
                      style: TextStyle(
                        color: isOutOfStock ? Colors.red : AppColors.accentGreen,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),

                  // Tombol tambah ke keranjang
                  GestureDetector(
                    onTap: isOutOfStock ? null : onAddToCart,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: isOutOfStock ? AppColors.divider : AppColors.accent,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Icon(
                        Icons.add,
                        color: isOutOfStock ? AppColors.textSecondary : Colors.white,
                        size: 18,
                      ),
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

  // Method helper untuk memformat angka harga agar mudah dibaca.
  // Kita pisahkan logika formatting ini ke method sendiri daripada
  // menulis inline di build(), agar kode lebih bersih dan mudah ditest.
  String _formatPrice(double price) {
    // Konversi ke int jika tidak ada desimal untuk tampilan yang bersih
    if (price == price.truncateToDouble()) {
      final intPrice = price.toInt().toString();
      // Tambahkan titik sebagai pemisah ribuan
      final buffer = StringBuffer();
      for (int i = 0; i < intPrice.length; i++) {
        if (i > 0 && (intPrice.length - i) % 3 == 0) {
          buffer.write('.');
        }
        buffer.write(intPrice[i]);
      }
      return buffer.toString();
    }
    return price.toStringAsFixed(0);
  }
}
```

### Grid Produk dengan Filtering dan Search

```dart
// lib/features/dashboard/presentation/widgets/product_grid.dart

import 'package:flutter/material.dart';
import 'package:mini_pos/core/constants/app_constants.dart';
import 'package:mini_pos/core/di/service_locator.dart';
import 'package:mini_pos/core/theme/app_theme.dart';
import 'package:mini_pos/features/products/data/product_service.dart';
import 'package:mini_pos/features/products/models/product_model.dart';
import 'package:mini_pos/features/dashboard/presentation/widgets/product_card.dart';

class ProductGrid extends StatefulWidget {
  // Callback ini akan dipanggil ketika pengguna menekan "+" pada sebuah produk.
  // Dengan pola callback seperti ini, ProductGrid tidak perlu tahu apa yang
  // terjadi setelah produk ditambahkan --- itu tanggung jawab widget induk.
  final Function(Product) onProductSelected;

  const ProductGrid({
    super.key,
    required this.onProductSelected,
  });

  @override
  State<ProductGrid> createState() => _ProductGridState();
}

class _ProductGridState extends State<ProductGrid> {
  final _productService = getIt<ProductService>();
  final _searchController = TextEditingController();

  String _selectedCategory = 'Semua';
  String _searchQuery = '';

  // Cache data yang tidak berubah di initState daripada menghitung ulang di build()
  late final List<String> _categories;

  @override
  void initState() {
    super.initState();
    _categories = _productService.getCategories();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Computed property: kalkulasi produk yang tampil berdasarkan filter aktif.
  // Kita tulis ini sebagai getter agar selalu fresh setiap build() dipanggil.
  List<Product> get _filteredProducts {
    // Jika ada query pencarian, gunakan search. Jika tidak, filter by category.
    if (_searchQuery.isNotEmpty) {
      return _productService.searchProducts(_searchQuery);
    }
    return _productService.getProductsByCategory(_selectedCategory);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Area pencarian dan filter
        Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              // Search bar
              TextField(
                controller: _searchController,
                style: const TextStyle(color: AppColors.textPrimary),
                decoration: const InputDecoration(
                  hintText: 'Cari produk...',
                  prefixIcon: Icon(Icons.search),
                  contentPadding: EdgeInsets.symmetric(vertical: 10),
                ),
                onChanged: (value) {
                  // setState hanya di-trigger saat nilai benar-benar berubah,
                  // menghindari rebuild yang tidak perlu.
                  if (value != _searchQuery) {
                    setState(() => _searchQuery = value);
                  }
                },
              ),
              const SizedBox(height: 8),

              // Filter chips kategori
              // SizedBox + SingleChildScrollView memungkinkan chips di-scroll horizontal
              // tanpa memakan ruang vertikal lebih dari yang dibutuhkan.
              SizedBox(
                height: 36,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _categories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final category = _categories[index];
                    final isSelected = category == _selectedCategory && _searchQuery.isEmpty;

                    return FilterChip(
                      label: Text(
                        category,
                        style: TextStyle(
                          color: isSelected ? Colors.white : AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                      selected: isSelected,
                      onSelected: (_) {
                        setState(() {
                          _selectedCategory = category;
                          _searchQuery = '';
                          _searchController.clear();
                        });
                      },
                      backgroundColor: AppColors.cardBackground,
                      selectedColor: AppColors.accent,
                      checkmarkColor: Colors.transparent,
                      side: BorderSide(
                        color: isSelected ? AppColors.accent : AppColors.divider,
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),

        // Grid produk
        Expanded(
          child: LayoutBuilder(
            // LayoutBuilder memberikan kita constraints ukuran widget saat ini.
            // Kita gunakan ini untuk memutuskan berapa kolom yang ditampilkan ---
            // ini adalah inti dari UI responsif!
            builder: (context, constraints) {
              // Hitung jumlah kolom berdasarkan lebar yang tersedia
              final columns = constraints.maxWidth < AppConstants.tabletBreakpoint
                  ? AppConstants.mobileGridColumns
                  : constraints.maxWidth < 1024
                      ? AppConstants.tabletGridColumns
                      : AppConstants.desktopGridColumns;

              final products = _filteredProducts;

              if (products.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.search_off,
                        size: 48,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Produk tidak ditemukan',
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                );
              }

              return GridView.builder(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: columns,
                  // Rasio aspek 0.75 artinya setiap kartu 1.33x lebih tinggi dari lebarnya.
                  // Sesuaikan nilai ini jika konten kartu terasa terlalu padat atau terlalu longgar.
                  childAspectRatio: 0.75,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                ),
                itemCount: products.length,
                itemBuilder: (context, index) {
                  final product = products[index];
                  return ProductCard(
                    product: product,
                    // Kita lempar callback ke ProductGrid dari widget induk (DashboardScreen)
                    onAddToCart: () => widget.onProductSelected(product),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
```

### Panel Keranjang Belanja (Versi Dasar)

```dart
// lib/features/dashboard/presentation/widgets/cart_panel.dart

import 'package:flutter/material.dart';
import 'package:mini_pos/core/theme/app_theme.dart';
import 'package:mini_pos/features/products/models/product_model.dart';

// CartItem adalah model sederhana untuk merepresentasikan
// satu item di dalam keranjang belanja.
// Kita definisikan di sini karena ia erat kaitannya dengan CartPanel.
// Di Part 2, kelas ini akan dipindahkan ke models/ sendiri saat logikanya berkembang.
class CartItem {
  final Product product;
  int quantity;

  CartItem({required this.product, this.quantity = 1});

  double get subtotal => product.price * quantity;
}

// CartPanel dirancang sebagai StatelessWidget yang menerima data dari luar.
// Ini penting: CartPanel tidak "memiliki" data keranjang, ia hanya menampilkannya.
// State keranjang akan dikelola oleh DashboardScreen (dan di Part 2, oleh Provider).
class CartPanel extends StatelessWidget {
  final List<CartItem> items;
  final VoidCallback onCheckout;
  final VoidCallback onClear;
  final Function(CartItem) onRemoveItem;
  final Function(CartItem, int) onUpdateQuantity;

  const CartPanel({
    super.key,
    required this.items,
    required this.onCheckout,
    required this.onClear,
    required this.onRemoveItem,
    required this.onUpdateQuantity,
  });

  // Total harga semua item di keranjang
  double get _total => items.fold(0, (sum, item) => sum + item.subtotal);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.secondary,
        border: Border(
          left: BorderSide(color: AppColors.divider, width: 1),
        ),
      ),
      child: Column(
        children: [
          // Header panel
          _buildHeader(context),

          // Konten keranjang: daftar item atau pesan kosong
          Expanded(
            child: items.isEmpty ? _buildEmptyCart() : _buildCartList(),
          ),

          // Area total dan tombol checkout
          if (items.isNotEmpty) _buildCheckoutArea(),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.divider)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.shopping_cart, color: AppColors.accent, size: 20),
              const SizedBox(width: 8),
              const Text(
                'Keranjang',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              if (items.isNotEmpty) ...[
                const SizedBox(width: 8),
                // Badge jumlah item
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.accent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${items.length}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ],
          ),
          if (items.isNotEmpty)
            TextButton.icon(
              onPressed: onClear,
              icon: const Icon(Icons.delete_outline, size: 16),
              label: const Text('Kosongkan'),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.textSecondary,
                padding: EdgeInsets.zero,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEmptyCart() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_cart_outlined, size: 64, color: AppColors.divider),
          SizedBox(height: 12),
          Text(
            'Keranjang kosong',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
          ),
          SizedBox(height: 4),
          Text(
            'Tambahkan produk untuk mulai transaksi',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildCartList() {
    return ListView.separated(
      padding: const EdgeInsets.all(8),
      itemCount: items.length,
      separatorBuilder: (_, __) => const Divider(
        color: AppColors.divider,
        height: 1,
      ),
      itemBuilder: (context, index) {
        final item = items[index];
        return _CartItemTile(
          item: item,
          onRemove: () => onRemoveItem(item),
          onUpdateQuantity: (qty) => onUpdateQuantity(item, qty),
        );
      },
    );
  }

  Widget _buildCheckoutArea() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.divider)),
      ),
      child: Column(
        children: [
          // Ringkasan harga
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                'Rp ${_formatTotal(_total)}',
                style: const TextStyle(
                  color: AppColors.accentGreen,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Tombol checkout
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onCheckout,
              icon: const Icon(Icons.payment),
              label: const Text('Proses Pembayaran'),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTotal(double total) {
    final intTotal = total.toInt().toString();
    final buffer = StringBuffer();
    for (int i = 0; i < intTotal.length; i++) {
      if (i > 0 && (intTotal.length - i) % 3 == 0) {
        buffer.write('.');
      }
      buffer.write(intTotal[i]);
    }
    return buffer.toString();
  }
}

// Widget private untuk menampilkan satu baris item di keranjang.
// Kita pisahkan menjadi widget sendiri agar _buildCartList() tetap bersih.
// Konvensi underscore di nama class (_CartItemTile) menandakan ini adalah
// implementasi internal yang tidak dimaksudkan untuk digunakan di file lain.
class _CartItemTile extends StatelessWidget {
  final CartItem item;
  final VoidCallback onRemove;
  final Function(int) onUpdateQuantity;

  const _CartItemTile({
    required this.item,
    required this.onRemove,
    required this.onUpdateQuantity,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      child: Row(
        children: [
          // Emoji produk
          Text(item.product.imageEmoji, style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 10),

          // Nama dan subtotal
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.product.name,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'Rp ${item.product.price.toInt()} x ${item.quantity}',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),

          // Kontrol jumlah
          Row(
            children: [
              _QuantityButton(
                icon: item.quantity == 1 ? Icons.delete_outline : Icons.remove,
                color: item.quantity == 1 ? AppColors.accent : AppColors.textSecondary,
                onTap: () {
                  if (item.quantity == 1) {
                    onRemove();
                  } else {
                    onUpdateQuantity(item.quantity - 1);
                  }
                },
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  '${item.quantity}',
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              _QuantityButton(
                icon: Icons.add,
                color: AppColors.accentGreen,
                onTap: () => onUpdateQuantity(item.quantity + 1),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Tombol kecil untuk increment/decrement jumlah
class _QuantityButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QuantityButton({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 26,
        height: 26,
        decoration: BoxDecoration(
          color: color.withAlpha(30),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: color.withAlpha(80)),
        ),
        child: Icon(icon, size: 14, color: color),
      ),
    );
  }
}
```

### Layar Dashboard Utama

Ini adalah widget "orkestrator" yang menyatukan semua widget di atas:

```dart
// lib/features/dashboard/presentation/dashboard_screen.dart

import 'package:flutter/material.dart';
import 'package:mini_pos/core/constants/app_constants.dart';
import 'package:mini_pos/core/di/service_locator.dart';
import 'package:mini_pos/core/theme/app_theme.dart';
import 'package:mini_pos/features/auth/data/auth_service.dart';
import 'package:mini_pos/features/auth/presentation/login_screen.dart';
import 'package:mini_pos/features/dashboard/presentation/widgets/cart_panel.dart';
import 'package:mini_pos/features/dashboard/presentation/widgets/product_grid.dart';
import 'package:mini_pos/features/products/models/product_model.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  // State keranjang dikelola di sini untuk sementara.
  // Di Part 2, state ini akan dipindahkan ke CartProvider agar lebih scalable.
  final List<CartItem> _cartItems = [];

  final _authService = getIt<AuthService>();

  // Apakah panel keranjang terlihat? (untuk mode mobile)
  bool _showCartOnMobile = false;

  // Logika menambah produk ke keranjang.
  // Kalau produk sudah ada, increment quantity. Kalau belum, tambahkan item baru.
  void _addToCart(Product product) {
    setState(() {
      final existingIndex = _cartItems.indexWhere(
        (item) => item.product.id == product.id,
      );

      if (existingIndex >= 0) {
        _cartItems[existingIndex].quantity++;
      } else {
        _cartItems.add(CartItem(product: product));
      }

      // Auto-tampilkan keranjang di mobile saat item ditambahkan
      _showCartOnMobile = true;
    });
  }

  void _removeFromCart(CartItem item) {
    setState(() {
      _cartItems.remove(item);
      if (_cartItems.isEmpty) _showCartOnMobile = false;
    });
  }

  void _updateQuantity(CartItem item, int newQuantity) {
    setState(() {
      final index = _cartItems.indexOf(item);
      if (index >= 0) {
        _cartItems[index].quantity = newQuantity;
      }
    });
  }

  void _clearCart() {
    setState(() {
      _cartItems.clear();
      _showCartOnMobile = false;
    });
  }

  void _handleCheckout() {
    if (_cartItems.isEmpty) return;

    // Di Part 2, ini akan memanggil logika penyimpanan transaksi.
    // Untuk sekarang, kita tampilkan dialog konfirmasi sederhana.
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.cardBackground,
        title: const Text(
          'Transaksi Berhasil',
          style: TextStyle(color: AppColors.textPrimary),
        ),
        content: Text(
          'Total pembayaran Rp ${_calculateTotal()} telah diproses.',
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _clearCart();
            },
            child: const Text('Selesai', style: TextStyle(color: AppColors.accent)),
          ),
        ],
      ),
    );
  }

  String _calculateTotal() {
    final total = _cartItems.fold<double>(0, (sum, item) => sum + item.subtotal);
    final intTotal = total.toInt().toString();
    final buffer = StringBuffer();
    for (int i = 0; i < intTotal.length; i++) {
      if (i > 0 && (intTotal.length - i) % 3 == 0) buffer.write('.');
      buffer.write(intTotal[i]);
    }
    return buffer.toString();
  }

  Future<void> _handleLogout() async {
    await _authService.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    // MediaQuery.sizeOf adalah cara yang lebih efisien dari MediaQuery.of(context).size
    // karena hanya trigger rebuild ketika ukuran layar berubah, bukan setiap kali
    // ada perubahan di MediaQuery (seperti keyboard muncul).
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isTablet = screenWidth >= AppConstants.tabletBreakpoint;

    return Scaffold(
      appBar: _buildAppBar(),
      // Logika layout responsif ada di sini:
      // - Tablet/Desktop: tampilkan grid dan cart side-by-side
      // - Mobile: tampilkan grid atau cart secara bergantian
      body: isTablet
          ? _buildTabletLayout()
          : _buildMobileLayout(),
      // FAB hanya muncul di mobile untuk toggle tampilan keranjang
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
        IconButton(
          icon: const Icon(Icons.logout),
          tooltip: 'Keluar',
          onPressed: _handleLogout,
        ),
      ],
    );
  }

  // Layout untuk tablet: dua panel berdampingan
  Widget _buildTabletLayout() {
    return Row(
      children: [
        // Panel kiri: daftar produk (mengambil sisa ruang setelah panel kanan)
        const Expanded(
          flex: 3, // 60% lebar layar
          child: SizedBox(), // Placeholder, akan diisi ProductGrid
        ),
        Expanded(
          flex: 2, // 40% lebar layar
          child: CartPanel(
            items: _cartItems,
            onCheckout: _handleCheckout,
            onClear: _clearCart,
            onRemoveItem: _removeFromCart,
            onUpdateQuantity: _updateQuantity,
          ),
        ),
      ],
    );
  }

  // Layout sesungguhnya untuk tablet menggunakan Row dengan ProductGrid
  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isTablet = screenWidth >= AppConstants.tabletBreakpoint;

    return Scaffold(
      appBar: _buildAppBar(),
      body: isTablet
          ? Row(
              children: [
                Expanded(
                  flex: 3,
                  child: ProductGrid(onProductSelected: _addToCart),
                ),
                SizedBox(
                  width: 320,
                  child: CartPanel(
                    items: _cartItems,
                    onCheckout: _handleCheckout,
                    onClear: _clearCart,
                    onRemoveItem: _removeFromCart,
                    onUpdateQuantity: _updateQuantity,
                  ),
                ),
              ],
            )
          : _buildMobileLayout(),
      floatingActionButton: isTablet ? null : _buildCartFab(),
    );
  }

  // Layout untuk mobile: satu panel yang bisa di-toggle
  Widget _buildMobileLayout() {
    return AnimatedSwitcher(
      // AnimatedSwitcher otomatis menambahkan transisi saat child berubah.
      duration: const Duration(milliseconds: 250),
      child: _showCartOnMobile
          ? CartPanel(
              key: const ValueKey('cart'),
              items: _cartItems,
              onCheckout: _handleCheckout,
              onClear: _clearCart,
              onRemoveItem: _removeFromCart,
              onUpdateQuantity: _updateQuantity,
            )
          : ProductGrid(
              key: const ValueKey('products'),
              onProductSelected: _addToCart,
            ),
    );
  }

  Widget _buildCartFab() {
    return FloatingActionButton.extended(
      onPressed: () => setState(() => _showCartOnMobile = !_showCartOnMobile),
      backgroundColor: AppColors.accent,
      icon: Icon(_showCartOnMobile ? Icons.grid_view : Icons.shopping_cart),
      label: Text(
        _showCartOnMobile
            ? 'Lihat Produk'
            : 'Keranjang (${_cartItems.length})',
      ),
    );
  }
}
```

---

## 9. Menyatukan Semuanya di main.dart

`main.dart` adalah entry point aplikasi. Tugasnya sederhana: inisialisasi semua yang dibutuhkan, lalu jalankan aplikasi.

```dart
// lib/main.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mini_pos/core/di/service_locator.dart';
import 'package:mini_pos/core/theme/app_theme.dart';
import 'package:mini_pos/features/auth/presentation/login_screen.dart';

// main() harus async karena kita perlu menunggu inisialisasi selesai
// sebelum menjalankan aplikasi.
void main() async {
  // WidgetsFlutterBinding.ensureInitialized() wajib dipanggil sebelum
  // operasi async apapun di main() jika menggunakan Flutter.
  // Ini menginisialisasi binding antara Flutter framework dan engine-nya.
  WidgetsFlutterBinding.ensureInitialized();

  // Kunci orientasi layar ke portrait saja (umum untuk aplikasi POS mobile).
  // Untuk versi tablet, kita bisa menghapus baris ini.
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  // Setup semua dependensi sebelum aplikasi berjalan.
  // Ini memastikan getIt siap melayani permintaan dari widget manapun.
  await setupServiceLocator();

  runApp(const MiniPosApp());
}

class MiniPosApp extends StatelessWidget {
  const MiniPosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mini POS',
      theme: AppTheme.darkTheme,
      debugShowCheckedModeBanner: false,
      home: const LoginScreen(),
    );
  }
}
```

---

## 10. Hasil Akhir dan Preview Part 2

Dengan menyelesaikan Part 1 ini, kamu sudah membangun:

**Fondasi Arsitektur yang Solid**

- Struktur folder feature-first yang mudah dinavigasi
- Service Locator dengan `get_it` yang memutus ketergantungan antar komponen
- Model data immutable (`Product`) dengan serialisasi JSON bawaan

**UI Responsif yang Fungsional**

- Layar login dengan validasi form dan feedback loading
- Grid produk dengan filtering kategori dan pencarian real-time
- Panel keranjang dengan kontrol kuantitas dan kalkulasi total
- Layout adaptif: side-by-side di tablet, toggle mode di mobile
- Dark theme yang konsisten dengan sistem warna terpusat

**Pola-pola yang Akan Terus Dipakai**

- Callback pattern untuk komunikasi widget ke atas (child ke parent)
- LayoutBuilder untuk keputusan layout responsif
- `initState` dan `dispose` yang benar untuk resource management
- Pengecekan `mounted` yang benar setelah operasi async

Di **Part 2**, kita akan mengangkat aplikasi ini ke level berikutnya:

- State keranjang akan dipindahkan ke `Provider` agar lebih scalable dan mudah diakses dari mana saja tanpa prop drilling
- Keranjang akan tersimpan di database lokal menggunakan `Hive` sehingga data tidak hilang saat aplikasi ditutup
- Login akan dilengkapi dengan penyimpanan token menggunakan `flutter_secure_storage` yang dienkripsi oleh sistem operasi

---

> **Catatan Flutter 3.41.5**: Kode di tutorial ini menggunakan fitur-fitur Dart modern seperti `const` constructor, named parameters dengan `required`, `late final`, dan null safety penuh. Pastikan project kamu menggunakan Dart SDK minimal 3.7.x agar semua kode berjalan tanpa modifikasi.

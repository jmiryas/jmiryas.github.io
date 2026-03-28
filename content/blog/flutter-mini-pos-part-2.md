---
title: "Best Practice Flutter Part 2: Dari Arsitektur Clean hingga Multithreading di Aplikasi POS"
date: "Mar 27, 2026"
description: "Best Practice Flutter 2: Dari Arsitektur Clean hingga Multithreading di Aplikasi POS"
---

> Seri Tutorial Flutter: Membangun Aplikasi Mini Point-of-Sale (POS)
> Flutter versi: 3.41.5 | Dart versi: 3.7.x

---

## Daftar Isi

1. [Di Mana Kita Sekarang?](#1-di-mana-kita-sekarang)
2. [Masalah dengan State yang Hidup di Widget](#2-masalah-dengan-state-yang-hidup-di-widget)
3. [Mengenal Provider: Solusi State Management yang Elegan](#3-mengenal-provider-solusi-state-management-yang-elegan)
4. [Memilih Antara Provider, BLoC, dan Riverpod](#4-memilih-antara-provider-bloc-dan-riverpod)
5. [Membangun CartProvider](#5-membangun-cartprovider)
6. [Menyimpan Keranjang ke Hive (Local Storage)](#6-menyimpan-keranjang-ke-hive-local-storage)
7. [Login Aman dengan flutter_secure_storage](#7-login-aman-dengan-flutter_secure_storage)
8. [Memperbarui AuthService](#8-memperbarui-authservice)
9. [Menyambungkan Provider ke UI](#9-menyambungkan-provider-ke-ui)
10. [Memperbarui main.dart](#10-memperbarui-maindart)
11. [File yang Diperbarui dari Part 1](#11-file-yang-diperbarui-dari-part-1)
12. [Hasil Akhir dan Preview Part 3](#12-hasil-akhir-dan-preview-part-3)

---

## 1. Di Mana Kita Sekarang?

Di Part 1, kita berhasil membangun fondasi yang solid: arsitektur feature-first, Dependency Injection dengan `get_it`, model data immutable, dan UI dashboard yang responsif. Aplikasi sudah berjalan dan tampilannya sudah bagus.

Tapi ada dua masalah besar yang belum diselesaikan:

**Masalah pertama --- State yang rapuh.** State keranjang belanja (`_cartItems`) saat ini hidup di dalam `_DashboardScreenState`. Artinya kalau widget ini di-rebuild atau di-dispose karena alasan apapun, data keranjang bisa hilang. Lebih parahnya lagi, kalau ada widget lain di tempat berbeda yang butuh data keranjang (misalnya badge jumlah item di AppBar), kita harus melempar data itu dari widget ke widget secara manual --- pola yang dikenal sebagai **prop drilling**, dan itu melelahkan.

**Masalah kedua --- Data tidak persisten.** Tutup aplikasinya sekarang, buka lagi. Keranjang yang sudah kamu isi tadi kosong. Token login pun tidak tersimpan --- pengguna harus login ulang setiap kali membuka aplikasi.

Part 2 ini akan menyelesaikan keduanya secara tuntas.

---

## 2. Masalah dengan State yang Hidup di Widget

Mari kita bedah masalah prop drilling dengan contoh konkret. Bayangkan kamu ingin menampilkan badge jumlah item keranjang di AppBar:

```
DashboardScreen (_cartItems ada di sini)
    |
    +-- AppBar (butuh jumlah _cartItems untuk badge)
    |
    +-- ProductGrid
    |       |
    |       +-- ProductCard (butuh callback addToCart)
    |
    +-- CartPanel (butuh _cartItems)
            |
            +-- CartItemTile (butuh item dan callback)
```

Agar `AppBar` bisa menampilkan badge, `_cartItems` harus dioper turun dari `DashboardScreen` ke `AppBar`. Tapi `AppBar` itu ada di parameter `appBar:` dari `Scaffold`, bukan sebagai child langsung yang bisa menerima data dengan mudah. Kamu terpaksa menulis logika pembuatan AppBar di dalam `DashboardScreen` itu sendiri, dan setiap kali `_cartItems` berubah, **seluruh DashboardScreen harus rebuild** --- termasuk ProductGrid yang sama sekali tidak berubah.

Ini pemborosan. Seharusnya hanya widget yang **benar-benar membutuhkan** data yang rebuild.

---

## 3. Mengenal Provider: Solusi State Management yang Elegan

`Provider` adalah package state management yang direkomendasikan oleh tim Flutter sendiri untuk kasus seperti ini. Filosofi intinya:

> "Pisahkan state dari UI. Biarkan UI _mendengarkan_ perubahan state, bukan _menyimpan_ state."

Cara kerjanya menggunakan tiga konsep utama:

**ChangeNotifier** --- Kelas yang menyimpan state dan bisa memberitahu siapapun yang mendengarkannya ketika state berubah. Ini adalah "sumber kebenaran" (source of truth) data kita.

**ChangeNotifierProvider** --- Widget yang menyediakan instance ChangeNotifier ke seluruh widget tree di bawahnya. Letakkan ini setinggi mungkin di tree, biasanya di `main.dart`.

**Consumer / context.watch / context.read** --- Cara widget mengakses data dari ChangeNotifier.

- `context.watch<T>()` --- Berlangganan ke perubahan. Widget akan rebuild otomatis saat data berubah. Gunakan di `build()`.
- `context.read<T>()` --- Ambil instance tanpa berlangganan. Gunakan di callback (`onPressed`, `onTap`, dll.) karena kita tidak butuh rebuild di sana.
- `Consumer<T>` --- Alternatif untuk `context.watch` yang membatasi scope rebuild hanya pada bagian tertentu widget tree. Lebih efisien untuk widget besar.

---

## 4. Memilih Antara Provider, BLoC, dan Riverpod

Sebelum menulis kode, kamu mungkin bertanya: kenapa `provider` dan bukan BLoC atau Riverpod?

**BLoC (Business Logic Component)** adalah pilihan yang solid untuk aplikasi enterprise yang sangat besar dengan tim yang besar pula. Ia memaksakan pemisahan yang sangat ketat antara events, states, dan transformasinya. Tapi untuk aplikasi seperti Mini POS ini, boilerplate yang dihasilkan BLoC (satu fitur bisa membutuhkan 4--5 file terpisah) adalah overhead yang tidak sebanding.

**Riverpod** adalah evolusi dari Provider yang lebih powerful dan compile-safe. Ini pilihan yang sangat bagus untuk proyek baru. Namun, kurva belajarnya lebih curam, dan untuk tutorial ini aku ingin fokus pada konsepnya, bukan pada boilerplate framework-nya.

**Provider** adalah titik manis antara keduanya. Simpel, tidak ada code generation, mudah dipahami bahkan oleh pemula, dan lebih dari cukup untuk skala aplikasi ini. Kita bisa migrasi ke Riverpod kapan saja karena konsepnya hampir sama.

---

## 5. Membangun CartProvider

Pertama, kita perlukan model `CartItem` yang lebih formal. Di Part 1, kelas ini ada di dalam `cart_panel.dart`. Sekarang kita pindahkan ke file tersendiri dan perkuat:

```dart
// lib/features/cart/models/cart_item_model.dart

import 'package:mini_pos/features/products/models/product_model.dart';

class CartItem {
  final Product product;
  final int quantity;

  // CartItem sekarang sepenuhnya immutable --- persis seperti Product.
  // Perubahan quantity dilakukan dengan membuat instance baru via copyWith,
  // bukan dengan mutasi langsung. Ini membuat state lebih predictable dan
  // mudah di-debug karena tidak ada "efek samping tersembunyi".
  const CartItem({
    required this.product,
    required this.quantity,
  });

  double get subtotal => product.price * quantity;

  CartItem copyWith({int? quantity}) {
    return CartItem(
      product: product,
      quantity: quantity ?? this.quantity,
    );
  }

  // Serialisasi untuk disimpan ke Hive.
  // Kita simpan productId saja, lalu saat load kita akan lookup produknya.
  // Strategi ini lebih ringan daripada menyimpan seluruh objek Product
  // yang mungkin datanya sudah berubah.
  Map<String, dynamic> toJson() => {
        'productId': product.id,
        'quantity': quantity,
      };

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CartItem && product.id == other.product.id;

  @override
  int get hashCode => product.id.hashCode;

  @override
  String toString() => 'CartItem(${product.name} x$quantity)';
}
```

Sekarang, buat `CartProvider` --- otak dari seluruh logika keranjang:

```dart
// lib/features/cart/providers/cart_provider.dart

import 'package:flutter/foundation.dart';
import 'package:mini_pos/features/cart/models/cart_item_model.dart';
import 'package:mini_pos/features/products/models/product_model.dart';

// ChangeNotifier adalah mixin dari Flutter foundation.
// Ia menyediakan method notifyListeners() yang akan memberitahu semua
// widget yang menggunakan context.watch<CartProvider>() untuk rebuild.
class CartProvider extends ChangeNotifier {
  // List internal yang menyimpan item keranjang.
  // Privat agar tidak bisa dimodifikasi dari luar secara langsung.
  final List<CartItem> _items = [];

  // Getter publik yang mengembalikan salinan tidak-dapat-diubah dari _items.
  // Widget boleh membaca data ini, tapi tidak boleh memodifikasinya langsung.
  // Semua modifikasi wajib melalui method di class ini.
  List<CartItem> get items => List.unmodifiable(_items);

  // Kalkulasi ringkasan keranjang sebagai computed properties.
  // Nilainya dihitung ulang setiap kali dipanggil --- efisien karena
  // hanya dihitung saat benar-benar dibutuhkan oleh UI.

  int get totalItems => _items.fold(0, (sum, item) => sum + item.quantity);

  double get totalPrice => _items.fold(0.0, (sum, item) => sum + item.subtotal);

  bool get isEmpty => _items.isEmpty;

  // Cek apakah produk tertentu ada di keranjang.
  // Berguna untuk menampilkan indicator di kartu produk.
  bool containsProduct(String productId) =>
      _items.any((item) => item.product.id == productId);

  // Ambil jumlah produk tertentu di keranjang. Returns 0 jika tidak ada.
  int getQuantityOf(String productId) {
    try {
      return _items
          .firstWhere((item) => item.product.id == productId)
          .quantity;
    } catch (_) {
      return 0;
    }
  }

  // Tambahkan produk ke keranjang.
  // Kalau sudah ada, increment quantity-nya.
  // Kalau belum ada, tambahkan CartItem baru dengan quantity 1.
  void addProduct(Product product) {
    final index = _findIndex(product.id);

    if (index >= 0) {
      // Item sudah ada: buat instance baru dengan quantity bertambah 1.
      // Kita tidak mutasi langsung karena CartItem bersifat immutable.
      _items[index] = _items[index].copyWith(
        quantity: _items[index].quantity + 1,
      );
    } else {
      _items.add(CartItem(product: product, quantity: 1));
    }

    // Setelah state berubah, beritahu semua listener untuk rebuild.
    // Ini adalah satu-satunya cara CartProvider berkomunikasi dengan UI.
    notifyListeners();
  }

  // Kurangi quantity produk sebesar 1.
  // Kalau quantity sudah 1 dan dikurangi lagi, hapus item dari keranjang.
  void decrementProduct(String productId) {
    final index = _findIndex(productId);
    if (index < 0) return;

    if (_items[index].quantity <= 1) {
      _items.removeAt(index);
    } else {
      _items[index] = _items[index].copyWith(
        quantity: _items[index].quantity - 1,
      );
    }

    notifyListeners();
  }

  // Set quantity produk ke nilai tertentu.
  // Kalau nilai adalah 0 atau negatif, hapus item.
  void setQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeProduct(productId);
      return;
    }

    final index = _findIndex(productId);
    if (index < 0) return;

    _items[index] = _items[index].copyWith(quantity: quantity);
    notifyListeners();
  }

  // Hapus satu produk dari keranjang sepenuhnya, berapa pun quantity-nya.
  void removeProduct(String productId) {
    _items.removeWhere((item) => item.product.id == productId);
    notifyListeners();
  }

  // Kosongkan seluruh keranjang.
  void clearCart() {
    _items.clear();
    notifyListeners();
  }

  // Load item dari storage (dipanggil oleh CartStorageService saat inisialisasi).
  // Method ini menerima list CartItem yang sudah di-parse dari storage,
  // lalu mengisi _items dengan data tersebut.
  void loadItems(List<CartItem> items) {
    _items.clear();
    _items.addAll(items);
    // Tidak perlu notifyListeners() di sini karena ini dipanggil saat inisialisasi,
    // sebelum UI sempat berlangganan.
  }

  // Helper privat untuk mencari index item berdasarkan productId.
  // Mengembalikan -1 jika tidak ditemukan.
  int _findIndex(String productId) =>
      _items.indexWhere((item) => item.product.id == productId);
}
```

---

## 6. Menyimpan Keranjang ke Hive (Local Storage)

### Mengapa Hive?

Flutter punya beberapa opsi untuk local storage:

- `SharedPreferences` --- Cocok untuk data kecil seperti pengaturan (tema, bahasa). Tidak cocok untuk data terstruktur seperti keranjang belanja.
- `SQLite` (via `sqflite`) --- Powerful untuk data relasional yang kompleks. Tapi memerlukan definisi tabel, SQL query, dan lebih banyak setup.
- `Hive` --- Database berbasis key-value yang ringan, sangat cepat, dan bekerja dengan objek Dart secara native. Tidak butuh SQL. Pilihan ideal untuk menyimpan list of objects seperti keranjang belanja.

Hive menyimpan data dalam "box" (kotak). Anggap box seperti sebuah tabel, tapi jauh lebih sederhana. Kita bisa menyimpan apa saja ke dalam box: string, number, list, map.

### Strategi Penyimpanan

Kita akan menyimpan keranjang sebagai `List<Map<String, dynamic>>` di Hive. Setiap map berisi `productId` dan `quantity`. Saat aplikasi dibuka lagi, kita load data ini, lalu cari produk lengkapnya dari `ProductService` menggunakan `productId` yang tersimpan.

Mengapa tidak menyimpan seluruh objek `Product`? Karena data produk (nama, harga) bisa berubah. Kalau kita simpan objek Product yang sudah "basi", keranjang akan menampilkan harga lama. Dengan hanya menyimpan `productId`, kita selalu mendapatkan data produk yang paling baru.

Buat service khusus untuk mengelola penyimpanan keranjang:

```dart
// lib/features/cart/data/cart_storage_service.dart

import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mini_pos/features/cart/models/cart_item_model.dart';
import 'package:mini_pos/features/cart/providers/cart_provider.dart';
import 'package:mini_pos/features/products/data/product_service.dart';

class CartStorageService {
  // Nama box harus unik di seluruh aplikasi.
  // Kita gunakan const agar tidak ada typo saat dipanggil dari tempat lain.
  static const String _boxName = 'cart_box';
  static const String _cartKey = 'cart_items';

  final ProductService _productService;

  // ProductService diinjeksikan via constructor --- bukan diambil langsung dari getIt.
  // Ini membuat CartStorageService lebih testable: kita bisa inject mock ProductService
  // saat testing tanpa perlu setup getIt.
  CartStorageService({required ProductService productService})
      : _productService = productService;

  // Inisialisasi Hive dan buka box yang dibutuhkan.
  // Dipanggil sekali di setupServiceLocator() sebelum aplikasi berjalan.
  static Future<void> initialize() async {
    // Hive.initFlutter() menentukan path penyimpanan yang sesuai dengan platform
    // (Documents di iOS, data directory di Android, dll.)
    await Hive.initFlutter();
    // Buka box. Box yang sudah terbuka bisa langsung diakses via Hive.box().
    await Hive.openBox(_boxName);
  }

  Box get _box => Hive.box(_boxName);

  // Simpan state keranjang saat ini ke Hive.
  // Dipanggil setiap kali keranjang berubah.
  Future<void> saveCart(List<CartItem> items) async {
    // Konversi setiap CartItem ke Map, lalu encode seluruh list ke JSON string.
    // Kita encode ke JSON string (bukan simpan Map langsung) karena Hive
    // lebih andal menyimpan tipe primitif daripada nested Map/List.
    final encoded = jsonEncode(items.map((e) => e.toJson()).toList());
    await _box.put(_cartKey, encoded);
  }

  // Load keranjang dari Hive dan kembalikan sebagai list CartItem.
  // Mengembalikan list kosong jika belum ada data tersimpan.
  Future<List<CartItem>> loadCart() async {
    final encoded = _box.get(_cartKey) as String?;

    // Kalau tidak ada data tersimpan, kembalikan list kosong.
    if (encoded == null) return [];

    try {
      // Decode JSON string kembali ke List<Map>
      final List<dynamic> decoded = jsonDecode(encoded) as List<dynamic>;

      // Untuk setiap item yang tersimpan, cari produk lengkapnya dari ProductService.
      final List<CartItem> items = [];
      for (final itemMap in decoded) {
        final map = itemMap as Map<String, dynamic>;
        final productId = map['productId'] as String;
        final quantity = map['quantity'] as int;

        // Cari produk berdasarkan ID.
        // Kalau produk tidak ditemukan (mungkin sudah dihapus dari katalog),
        // kita skip item ini agar keranjang tetap valid.
        try {
          final product = _productService
              .getAllProducts()
              .firstWhere((p) => p.id == productId);
          items.add(CartItem(product: product, quantity: quantity));
        } catch (_) {
          // Produk dengan ID ini tidak ditemukan, lewati.
          continue;
        }
      }
      return items;
    } catch (e) {
      // Kalau data korup atau formatnya tidak sesuai, hapus dan mulai fresh.
      await _box.delete(_cartKey);
      return [];
    }
  }

  // Hapus data keranjang dari storage.
  Future<void> clearCart() async {
    await _box.delete(_cartKey);
  }
}
```

Sekarang kita perlu menghubungkan `CartProvider` dengan `CartStorageService`. Caranya: setiap kali provider memanggil `notifyListeners()`, kita juga otomatis simpan ke storage. Kita akan lakukan ini di `CartProvider` sendiri dengan sebuah metode yang dipanggil setelah setiap perubahan.

Perbarui `CartProvider` untuk mengintegrasikan penyimpanan:

```dart
// lib/features/cart/providers/cart_provider.dart (versi final dengan storage)

import 'package:flutter/foundation.dart';
import 'package:mini_pos/features/cart/data/cart_storage_service.dart';
import 'package:mini_pos/features/cart/models/cart_item_model.dart';
import 'package:mini_pos/features/products/models/product_model.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];

  // CartStorageService diinjeksikan lewat constructor.
  // Dengan cara ini, di masa depan kita bisa mengganti implementasi storage
  // (misalnya dari Hive ke SQLite) tanpa mengubah satu baris pun kode CartProvider.
  final CartStorageService _storageService;

  CartProvider({required CartStorageService storageService})
      : _storageService = storageService;

  List<CartItem> get items => List.unmodifiable(_items);
  int get totalItems => _items.fold(0, (sum, item) => sum + item.quantity);
  double get totalPrice => _items.fold(0.0, (sum, item) => sum + item.subtotal);
  bool get isEmpty => _items.isEmpty;

  bool containsProduct(String productId) =>
      _items.any((item) => item.product.id == productId);

  int getQuantityOf(String productId) {
    try {
      return _items
          .firstWhere((item) => item.product.id == productId)
          .quantity;
    } catch (_) {
      return 0;
    }
  }

  void addProduct(Product product) {
    final index = _findIndex(product.id);
    if (index >= 0) {
      _items[index] = _items[index].copyWith(quantity: _items[index].quantity + 1);
    } else {
      _items.add(CartItem(product: product, quantity: 1));
    }
    _persist(); // Simpan ke storage setiap ada perubahan
  }

  void decrementProduct(String productId) {
    final index = _findIndex(productId);
    if (index < 0) return;
    if (_items[index].quantity <= 1) {
      _items.removeAt(index);
    } else {
      _items[index] = _items[index].copyWith(quantity: _items[index].quantity - 1);
    }
    _persist();
  }

  void setQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeProduct(productId);
      return;
    }
    final index = _findIndex(productId);
    if (index < 0) return;
    _items[index] = _items[index].copyWith(quantity: quantity);
    _persist();
  }

  void removeProduct(String productId) {
    _items.removeWhere((item) => item.product.id == productId);
    _persist();
  }

  void clearCart() {
    _items.clear();
    _storageService.clearCart(); // Hapus juga dari storage
    notifyListeners();
  }

  // Method ini dipanggil oleh service_locator.dart setelah provider dibuat,
  // untuk mengisi keranjang dengan data yang tersimpan dari sesi sebelumnya.
  Future<void> restoreFromStorage() async {
    final savedItems = await _storageService.loadCart();
    _items.clear();
    _items.addAll(savedItems);
    // notifyListeners() di sini aman karena saat dipanggil, Provider
    // sudah terdaftar di widget tree (dipanggil setelah runApp).
    notifyListeners();
  }

  // Helper privat: simpan state saat ini ke storage, lalu notify listeners.
  // Kita gabungkan keduanya dalam satu method agar tidak ada yang terlewat.
  void _persist() {
    _storageService.saveCart(_items); // Fire-and-forget, tidak perlu await
    notifyListeners();
  }

  int _findIndex(String productId) =>
      _items.indexWhere((item) => item.product.id == productId);
}
```

---

## 7. Login Aman dengan flutter_secure_storage

### Mengapa Tidak Cukup dengan SharedPreferences?

`SharedPreferences` menyimpan data sebagai plain text di file sistem. Di perangkat yang sudah di-root atau di-jailbreak, data ini bisa dibaca oleh aplikasi lain atau oleh penyerang dengan akses fisik ke perangkat.

`flutter_secure_storage` berbeda. Ia menggunakan mekanisme keamanan bawaan sistem operasi:

- **Android**: Android Keystore System --- kunci enkripsi disimpan di hardware (TEE/Secure Enclave) yang tidak bisa diekstrak.
- **iOS**: Keychain --- area penyimpanan terenkripsi yang dikelola oleh sistem operasi, dilindungi oleh enkripsi hardware dan FaceID/TouchID.

Untuk menyimpan token autentikasi, ini adalah satu-satunya pilihan yang benar.

### Simulasi Alur Autentikasi

Alur yang akan kita implementasikan:

```
[Pengguna input username + password]
          |
          v
[AuthService.login() --- validasi kredensial]
          |
    [Berhasil]
          |
          v
[Generate "session token" (simulasi)]
          |
          v
[Simpan token ke flutter_secure_storage]
          |
          v
[Navigasi ke DashboardScreen]


[Aplikasi dibuka kembali]
          |
          v
[AuthService.checkSession() --- baca token dari storage]
          |
    [Token ada] -----> [Navigasi langsung ke Dashboard]
          |
    [Token tidak ada] --> [Tampilkan LoginScreen]
```

---

## 8. Memperbarui AuthService

`AuthService` di Part 1 hanya menyimpan state di memori. Sekarang kita ganti dengan implementasi yang sesungguhnya:

```dart
// lib/features/auth/data/auth_service.dart (versi final)

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  // FlutterSecureStorage adalah interface ke Keystore/Keychain.
  // Instance ini aman untuk disimpan sebagai field karena tidak punya state internal.
  final FlutterSecureStorage _secureStorage;

  // Key untuk menyimpan token di secure storage.
  // Kita definisikan sebagai const agar tidak ada typo.
  static const String _tokenKey = 'auth_token';
  static const String _usernameKey = 'auth_username';

  // AuthService menerima FlutterSecureStorage dari luar (DI).
  // Kalau tidak disediakan, kita buat instance default.
  // Pola ini memberikan fleksibilitas untuk testing tanpa mengubah signature.
  AuthService({FlutterSecureStorage? secureStorage})
      : _secureStorage = secureStorage ?? const FlutterSecureStorage();

  // Cache username di memori agar tidak perlu baca storage setiap saat.
  String? _currentUserName;
  String? get currentUserName => _currentUserName;

  // Cek apakah ada sesi aktif (token tersimpan di secure storage).
  // Dipanggil di SplashScreen / main.dart saat aplikasi baru dibuka.
  Future<bool> checkSession() async {
    final token = await _secureStorage.read(key: _tokenKey);
    if (token != null) {
      // Token ditemukan, baca juga username-nya
      _currentUserName = await _secureStorage.read(key: _usernameKey);
      return true;
    }
    return false;
  }

  // Proses login.
  // Di aplikasi nyata, ini akan mengirim request ke server dan menerima JWT token.
  // Untuk tutorial ini, kita simulasikan dengan validasi hardcoded dan token palsu.
  Future<bool> login(String username, String password) async {
    // Simulasi network delay
    await Future.delayed(const Duration(milliseconds: 800));

    // Validasi kredensial (hardcoded untuk tutorial)
    if (username == 'kasir' && password == '12345') {
      // Generate token simulasi. Di produksi, ini adalah JWT dari server.
      // Format: "sim_token_{username}_{timestamp}" untuk membuat token unik.
      final token = 'sim_token_${username}_${DateTime.now().millisecondsSinceEpoch}';

      // Simpan token dan username ke secure storage.
      // writeAll tidak ada, jadi kita tulis satu per satu.
      // Urutan penulisan tidak kritis, tapi username ditulis lebih dulu
      // agar konsisten.
      await _secureStorage.write(key: _usernameKey, value: username);
      await _secureStorage.write(key: _tokenKey, value: token);

      _currentUserName = username;
      return true;
    }

    return false;
  }

  // Logout: hapus semua data sesi dari secure storage.
  Future<void> logout() async {
    // deleteAll menghapus semua key yang tersimpan oleh aplikasi ini.
    // Gunakan ini dengan hati-hati kalau kamu punya data lain di secure storage
    // yang tidak ingin terhapus saat logout. Dalam kasus itu, hapus per-key.
    await _secureStorage.delete(key: _tokenKey);
    await _secureStorage.delete(key: _usernameKey);
    _currentUserName = null;
  }

  // Ambil token yang tersimpan. Berguna jika perlu dilampirkan ke request API.
  Future<String?> getToken() async {
    return _secureStorage.read(key: _tokenKey);
  }
}
```

---

## 9. Menyambungkan Provider ke UI

### Memperbarui service_locator.dart

Kita perlu mendaftarkan `CartProvider` dan `CartStorageService` ke `get_it`:

```dart
// lib/core/di/service_locator.dart (versi final)

import 'package:get_it/get_it.dart';
import 'package:mini_pos/features/auth/data/auth_service.dart';
import 'package:mini_pos/features/cart/data/cart_storage_service.dart';
import 'package:mini_pos/features/cart/providers/cart_provider.dart';
import 'package:mini_pos/features/products/data/product_service.dart';

final GetIt getIt = GetIt.instance;

Future<void> setupServiceLocator() async {
  // 1. Inisialisasi Hive sebelum mendaftarkan CartStorageService.
  //    Ini harus dilakukan lebih dulu karena CartStorageService butuh Hive siap.
  await CartStorageService.initialize();

  // 2. Daftarkan ProductService terlebih dahulu karena CartStorageService
  //    membutuhkannya. Urutan registrasi penting di sini!
  getIt.registerLazySingleton<ProductService>(() => ProductService());

  // 3. Daftarkan CartStorageService dengan menyuntikkan ProductService ke dalamnya.
  getIt.registerLazySingleton<CartStorageService>(
    () => CartStorageService(productService: getIt<ProductService>()),
  );

  // 4. Daftarkan CartProvider.
  //    Kita gunakan registerSingleton (bukan lazy) karena kita butuh
  //    instance ini segera untuk restore data dari storage di main.dart.
  getIt.registerSingleton<CartProvider>(
    CartProvider(storageService: getIt<CartStorageService>()),
  );

  // 5. AuthService tidak butuh dependensi eksternal.
  getIt.registerLazySingleton<AuthService>(() => AuthService());
}
```

### Membuat SplashScreen untuk Cek Sesi

Kita butuh satu layar perantara yang muncul saat aplikasi pertama dibuka, bertugas mengecek apakah ada sesi aktif sebelum memutuskan ke mana pengguna diarahkan:

```dart
// lib/features/auth/presentation/splash_screen.dart

import 'package:flutter/material.dart';
import 'package:mini_pos/core/di/service_locator.dart';
import 'package:mini_pos/core/theme/app_theme.dart';
import 'package:mini_pos/features/auth/data/auth_service.dart';
import 'package:mini_pos/features/auth/presentation/login_screen.dart';
import 'package:mini_pos/features/cart/providers/cart_provider.dart';
import 'package:mini_pos/features/dashboard/presentation/dashboard_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // Kita jalankan pengecekan sesi setelah frame pertama selesai render.
    // addPostFrameCallback memastikan context sudah valid saat kita melakukan navigasi.
    WidgetsBinding.instance.addPostFrameCallback((_) => _initialize());
  }

  Future<void> _initialize() async {
    final authService = getIt<AuthService>();
    final cartProvider = getIt<CartProvider>();

    // Jalankan kedua operasi secara bersamaan menggunakan Future.wait.
    // Lebih efisien daripada menjalankan satu per satu secara sequential.
    await Future.wait([
      authService.checkSession(),
      cartProvider.restoreFromStorage(),
    ]);

    if (!mounted) return;

    final isLoggedIn = await authService.checkSession();

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) =>
            isLoggedIn ? const DashboardScreen() : const LoginScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.point_of_sale,
              size: 80,
              color: AppColors.accent,
            ),
            SizedBox(height: 16),
            Text(
              'Mini POS',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 32),
            CircularProgressIndicator(color: AppColors.accent),
          ],
        ),
      ),
    );
  }
}
```

### Memperbarui main.dart

```dart
// lib/main.dart (versi final Part 2)

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:mini_pos/core/di/service_locator.dart';
import 'package:mini_pos/core/theme/app_theme.dart';
import 'package:mini_pos/features/auth/presentation/splash_screen.dart';
import 'package:mini_pos/features/cart/providers/cart_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  // Inisialisasi semua service. Hive sudah diinisialisasi di dalamnya.
  await setupServiceLocator();

  runApp(const MiniPosApp());
}

class MiniPosApp extends StatelessWidget {
  const MiniPosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      // MultiProvider memungkinkan kita mendaftarkan banyak provider sekaligus.
      // Semua widget di bawah MaterialApp bisa mengakses provider ini.
      providers: [
        // ChangeNotifierProvider membuat dan menyediakan CartProvider ke widget tree.
        // Kita ambil instance yang sudah terdaftar di get_it --- satu instance
        // yang sama akan digunakan di seluruh aplikasi.
        //
        // Mengapa tidak create: (_) => CartProvider() langsung?
        // Karena CartProvider butuh CartStorageService yang sudah punya Hive yang
        // sudah terinialisasi. get_it memastikan semua dependensi sudah siap.
        ChangeNotifierProvider<CartProvider>.value(
          value: getIt<CartProvider>(),
        ),
      ],
      child: MaterialApp(
        title: 'Mini POS',
        theme: AppTheme.darkTheme,
        debugShowCheckedModeBanner: false,
        // SplashScreen sekarang menjadi home, bukan LoginScreen.
        // SplashScreen yang akan memutuskan ke mana navigasi berikutnya.
        home: const SplashScreen(),
      ),
    );
  }
}
```

---

## 10. Memperbarui main.dart

Sudah ditulis di bagian sebelumnya. Sekarang mari kita perbarui widget-widget UI dari Part 1 untuk menggunakan `CartProvider`.

### Memperbarui ProductCard

Kartu produk perlu menunjukkan berapa banyak item yang sudah ada di keranjang:

```dart
// lib/features/dashboard/presentation/widgets/product_card.dart (versi final)

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mini_pos/core/theme/app_theme.dart';
import 'package:mini_pos/features/cart/providers/cart_provider.dart';
import 'package:mini_pos/features/products/models/product_model.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onAddToCart;

  const ProductCard({
    super.key,
    required this.product,
    required this.onAddToCart,
  });

  @override
  Widget build(BuildContext context) {
    final isOutOfStock = product.stock == 0;

    // context.watch<CartProvider>() membuat ProductCard berlangganan ke CartProvider.
    // Setiap kali isi keranjang berubah, HANYA ProductCard ini yang rebuild ---
    // bukan seluruh ProductGrid atau DashboardScreen.
    // Ini jauh lebih efisien daripada setState di widget induk.
    final cartProvider = context.watch<CartProvider>();
    final quantityInCart = cartProvider.getQuantityOf(product.id);
    final isInCart = quantityInCart > 0;

    return Card(
      clipBehavior: Clip.antiAlias,
      // Beri highlight subtle pada kartu yang sudah ada di keranjang
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isInCart
            ? const BorderSide(color: AppColors.accent, width: 1.5)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: isOutOfStock ? null : onAddToCart,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Emoji produk dengan badge quantity
              Stack(
                children: [
                  Center(
                    child: Text(
                      product.imageEmoji,
                      style: const TextStyle(fontSize: 40),
                    ),
                  ),
                  // Badge quantity di pojok kanan atas, hanya muncul kalau ada di keranjang
                  if (isInCart)
                    Positioned(
                      top: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: AppColors.accent,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '$quantityInCart',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                product.name,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                'Rp ${_formatPrice(product.price)}',
                style: const TextStyle(
                  color: AppColors.accent,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
              const Spacer(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: isOutOfStock
                          ? Colors.red.withAlpha(40)
                          : AppColors.accentGreen.withAlpha(40),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      isOutOfStock ? 'Habis' : 'Stok: ${product.stock}',
                      style: TextStyle(
                        color:
                            isOutOfStock ? Colors.red : AppColors.accentGreen,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: isOutOfStock ? null : onAddToCart,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: isOutOfStock
                            ? AppColors.divider
                            : AppColors.accent,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Icon(
                        Icons.add,
                        color: isOutOfStock
                            ? AppColors.textSecondary
                            : Colors.white,
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

  String _formatPrice(double price) {
    final intPrice = price.toInt().toString();
    final buffer = StringBuffer();
    for (int i = 0; i < intPrice.length; i++) {
      if (i > 0 && (intPrice.length - i) % 3 == 0) buffer.write('.');
      buffer.write(intPrice[i]);
    }
    return buffer.toString();
  }
}
```

### Memperbarui CartPanel

`CartPanel` sekarang membaca langsung dari `CartProvider` via `context.watch`, tidak lagi menerima data lewat constructor:

```dart
// lib/features/dashboard/presentation/widgets/cart_panel.dart (versi final)

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mini_pos/core/theme/app_theme.dart';
import 'package:mini_pos/features/cart/models/cart_item_model.dart';
import 'package:mini_pos/features/cart/providers/cart_provider.dart';

// CartPanel sekarang tidak butuh parameter apapun.
// Semua data dan aksi diambil dari CartProvider via context.
class CartPanel extends StatelessWidget {
  final VoidCallback onCheckout;

  const CartPanel({
    super.key,
    required this.onCheckout,
  });

  @override
  Widget build(BuildContext context) {
    // Satu context.watch di sini: CartPanel dan semua child-nya akan rebuild
    // setiap kali CartProvider memanggil notifyListeners().
    final cart = context.watch<CartProvider>();

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.secondary,
        border: Border(left: BorderSide(color: AppColors.divider)),
      ),
      child: Column(
        children: [
          _buildHeader(context, cart),
          Expanded(
            child: cart.isEmpty ? _buildEmptyCart() : _buildCartList(cart),
          ),
          if (!cart.isEmpty) _buildCheckoutArea(context, cart),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, CartProvider cart) {
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
              if (!cart.isEmpty) ...[
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.accent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${cart.totalItems}',
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
          if (!cart.isEmpty)
            TextButton.icon(
              // context.read: kita hanya memanggil method, tidak butuh listen.
              onPressed: () => context.read<CartProvider>().clearCart(),
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

  Widget _buildCartList(CartProvider cart) {
    return ListView.separated(
      padding: const EdgeInsets.all(8),
      itemCount: cart.items.length,
      separatorBuilder: (_, __) =>
          const Divider(color: AppColors.divider, height: 1),
      itemBuilder: (context, index) {
        final item = cart.items[index];
        return _CartItemTile(item: item);
      },
    );
  }

  Widget _buildCheckoutArea(BuildContext context, CartProvider cart) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.divider)),
      ),
      child: Column(
        children: [
          // Ringkasan: jumlah item dan total harga
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${cart.totalItems} item',
                style: const TextStyle(color: AppColors.textSecondary),
              ),
              Text(
                'Rp ${_formatTotal(cart.totalPrice)}',
                style: const TextStyle(
                  color: AppColors.accentGreen,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
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
      if (i > 0 && (intTotal.length - i) % 3 == 0) buffer.write('.');
      buffer.write(intTotal[i]);
    }
    return buffer.toString();
  }
}

// Widget internal untuk satu baris item keranjang.
// Menggunakan context.read karena kita hanya perlu memanggil method,
// tidak perlu berlangganan (rebuild sudah ditangani CartPanel di atas).
class _CartItemTile extends StatelessWidget {
  final CartItem item;

  const _CartItemTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      child: Row(
        children: [
          Text(item.product.imageEmoji, style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 10),
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
          // Kontrol kuantitas
          Row(
            children: [
              _QuantityButton(
                icon: item.quantity == 1 ? Icons.delete_outline : Icons.remove,
                color: item.quantity == 1
                    ? AppColors.accent
                    : AppColors.textSecondary,
                onTap: () => context
                    .read<CartProvider>()
                    .decrementProduct(item.product.id),
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
                onTap: () => context
                    .read<CartProvider>()
                    .addProduct(item.product),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

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

---

## 11. File yang Diperbarui dari Part 1

### DashboardScreen yang Dipangkas

`DashboardScreen` sekarang jauh lebih ramping. State keranjang tidak lagi dikelola di sini --- semua sudah dipindahkan ke `CartProvider`:

```dart
// lib/features/dashboard/presentation/dashboard_screen.dart (versi final)

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mini_pos/core/constants/app_constants.dart';
import 'package:mini_pos/core/di/service_locator.dart';
import 'package:mini_pos/core/theme/app_theme.dart';
import 'package:mini_pos/features/auth/data/auth_service.dart';
import 'package:mini_pos/features/auth/presentation/login_screen.dart';
import 'package:mini_pos/features/cart/providers/cart_provider.dart';
import 'package:mini_pos/features/dashboard/presentation/widgets/cart_panel.dart';
import 'package:mini_pos/features/dashboard/presentation/widgets/product_grid.dart';
import 'package:mini_pos/features/products/models/product_model.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  // DashboardScreen sekarang hanya punya satu state lokal:
  // toggle tampilan keranjang di mode mobile.
  // Semua state keranjang ada di CartProvider.
  bool _showCartOnMobile = false;

  final _authService = getIt<AuthService>();

  void _handleProductSelected(Product product) {
    // Aksi: tambah produk ke keranjang via CartProvider.
    // context.read karena ini di dalam callback, bukan build().
    context.read<CartProvider>().addProduct(product);

    // Auto-tampilkan keranjang di mobile saat item ditambahkan.
    if (MediaQuery.sizeOf(context).width < AppConstants.tabletBreakpoint) {
      setState(() => _showCartOnMobile = true);
    }
  }

  void _handleCheckout() {
    final cart = context.read<CartProvider>();
    if (cart.isEmpty) return;

    final totalFormatted = _formatTotal(cart.totalPrice);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.cardBackground,
        title: const Text(
          'Transaksi Berhasil',
          style: TextStyle(color: AppColors.textPrimary),
        ),
        content: Text(
          'Total pembayaran Rp $totalFormatted telah diproses.\n'
          'Terima kasih!',
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              // Kosongkan keranjang setelah checkout.
              // CartProvider akan otomatis simpan state kosong ke Hive.
              context.read<CartProvider>().clearCart();
              setState(() => _showCartOnMobile = false);
            },
            child: const Text(
              'Selesai',
              style: TextStyle(color: AppColors.accent),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLogout() async {
    await _authService.logout();
    // Bersihkan keranjang juga saat logout agar tidak ada data sisa.
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
    // Consumer membatasi scope rebuild hanya pada bagian AppBar yang perlu,
    // yaitu badge jumlah item. Baris username tidak perlu ikut rebuild.
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
        // Badge keranjang di AppBar: update otomatis via Consumer
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
          icon: const Icon(Icons.logout),
          tooltip: 'Keluar',
          onPressed: _handleLogout,
        ),
      ],
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
    // Consumer di sini agar FAB tahu jumlah item terkini tanpa rebuild seluruh Scaffold.
    return Consumer<CartProvider>(
      builder: (context, cart, _) {
        return FloatingActionButton.extended(
          onPressed: () =>
              setState(() => _showCartOnMobile = !_showCartOnMobile),
          backgroundColor: AppColors.accent,
          icon: Icon(
            _showCartOnMobile ? Icons.grid_view : Icons.shopping_cart,
          ),
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

### ProductGrid (Perubahan Minor)

`ProductGrid` di Part 1 sudah hampir sempurna. Satu-satunya perubahan: callback `onProductSelected` sekarang dipanggil dari `DashboardScreen` yang sudah terhubung ke `CartProvider`, jadi tidak ada perubahan di `ProductGrid` itu sendiri. File ini tetap sama persis dari Part 1.

---

## 12. Hasil Akhir dan Preview Part 3

### Struktur Folder Setelah Part 2

Berikut struktur lengkap yang kamu miliki sekarang:

```
lib/
├── core/
│   ├── constants/
│   │   └── app_constants.dart
│   ├── di/
│   │   └── service_locator.dart       *** DIPERBARUI
│   └── theme/
│       └── app_theme.dart
│
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   └── auth_service.dart      *** DIPERBARUI (secure storage)
│   │   └── presentation/
│   │       ├── login_screen.dart
│   │       └── splash_screen.dart     *** BARU
│   │
│   ├── cart/                          *** FITUR BARU SEPENUHNYA
│   │   ├── data/
│   │   │   └── cart_storage_service.dart
│   │   ├── models/
│   │   │   └── cart_item_model.dart
│   │   └── providers/
│   │       └── cart_provider.dart
│   │
│   ├── dashboard/
│   │   └── presentation/
│   │       ├── dashboard_screen.dart  *** DIPERBARUI (dipangkas)
│   │       └── widgets/
│   │           ├── product_grid.dart  (tidak berubah)
│   │           ├── product_card.dart  *** DIPERBARUI (badge quantity)
│   │           └── cart_panel.dart    *** DIPERBARUI (pakai Provider)
│   │
│   └── products/
│       ├── data/
│       │   └── product_service.dart
│       └── models/
│           └── product_model.dart
│
└── main.dart                          *** DIPERBARUI (MultiProvider + SplashScreen)
```

### Apa yang Sudah Kita Capai di Part 2?

**State Management yang Benar**

- `CartProvider` sebagai satu sumber kebenaran data keranjang
- Rebuild yang efisien: hanya widget yang berlangganan yang rebuild
- Badge di AppBar dan kartu produk update otomatis tanpa setState manual

**Persistensi Data**

- Keranjang tersimpan otomatis ke Hive setiap ada perubahan
- Restore data keranjang saat aplikasi dibuka kembali
- Strategi penyimpanan yang cerdas: simpan ID produk, bukan seluruh objek

**Keamanan Autentikasi**

- Token disimpan di Keystore (Android) / Keychain (iOS) via `flutter_secure_storage`
- Auto-login: pengguna tidak perlu input ulang saat buka aplikasi
- Logout bersih: token dan data sesi dihapus dari secure storage

Di **Part 3**, kita akan menyelesaikan aplikasi ini dengan:

- **Isolates / `compute()`**: Parsing ribuan data produk JSON di background thread agar UI tidak freeze. Kita akan buat simulasi yang nyata --- scroll produk tetap mulus bahkan saat komputasi berat berjalan.
- **CustomPainter**: Membuat widget struk belanja bergaya dengan elemen grafis yang digambar manual --- bukan sekadar Text dan Row, tapi benar-benar menggambar di atas canvas.
- **Finalisasi**: Semua kode dari Part 1, 2, dan 3 disatukan dalam satu set file final yang bersih, siap dijalankan, dan siap digunakan sebagai referensi proyek nyata.

---

> **Catatan Penting untuk Android**: `flutter_secure_storage` di Android memerlukan minimum SDK versi 18. Pastikan `minSdkVersion` di `android/app/build.gradle` kamu adalah `18` atau lebih tinggi. Kalau kamu menggunakan template Flutter terbaru, ini biasanya sudah terpenuhi secara default.
>
> **Catatan untuk iOS**: Tidak ada konfigurasi tambahan yang dibutuhkan untuk `flutter_secure_storage` di iOS. Keychain sudah tersedia secara default.

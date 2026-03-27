---
title: "Masterclass Flutter Part 3: Slicing dan Logika Aplikasi Mini POS Siap Produksi"
date: "Mar 27, 2026"
description: "Masterclass Flutter Part 3: Slicing dan Logika Aplikasi Mini POS Siap Produksi"
---

## Pendahuluan

Selamat datang di part terakhir dari seri tutorial Mini POS. Setelah membangun fondasi arsitektur di Part 1 dan mengimplementasikan keamanan autentikasi di Part 2, sekarang kita akan membuat aplikasi yang benar-benar tangguh dengan fitur offline-first. Ini adalah pembeda antara aplikasi amatir dan aplikasi production-grade.

## Mengapa Offline-First Itu Penting

Bayangkan kamu memiliki restoran dengan aplikasi POS ini. Ada beberapa skenario yang akan terjadi di dunia nyata:

1. **Koneksi internet putus saat sibuk** - Di jam makan siang, banyak pelanggan, tiba-tiba WiFi mati. Tanpa offline-first, kamu tidak bisa mencatat pesanan baru.

2. **Event di lokasi tanpa sinyal** - Kamu melayani event outdoor di taman atau gedung dengan sinyal buruk.

3. **Gangguan dari provider** - Indihome atau provider mobile sedang maintenance.

4. **Perjalanan dengan koneksi intermittent** - Food truck yang berpindah-pindah lokasi.

Dengan arsitektur offline-first, aplikasi tetap 100% fungsional dalam semua skenario ini. Data disimpan lokal dulu, lalu disinkronkan ke server ketika online.

## Apa yang Akan Kita Pelajari

1. **Konsep Offline-First Architecture** - Local-first data, optimistic UI, sync strategies
2. **Isar Database** - Database NoSQL yang cepat dan powerful untuk Flutter
3. **Network Connectivity Management** - Deteksi status koneksi dan respons yang tepat
4. **Sync Engine** - Mekanisme sinkronisasi data lokal-ke-server dan sebaliknya
5. **Conflict Resolution** - Menangani konflik data saat sync
6. **Final Integration** - Menggabungkan semua part menjadi aplikasi utuh

## Memahami Offline-First Architecture

### Paradigma Traditional vs Offline-First

**Traditional Approach (Online-First):**

```
User Action -> API Call -> Server Response -> Update UI
                     |
                     v (jika gagal)
              Error, data hilang
```

**Offline-First Approach (Local-First):**

```
User Action -> Save to Local DB -> Update UI (instant)
                     |
                     v (background)
              Sync to Server (when online)
                     |
                     v
              Update sync status
```

### Tiga Pilar Offline-First

#### 1. Local-First Data Storage

Semua operasi tulis selalu ke database lokal terlebih dahulu. Server dianggap sebagai "backup" dan "sync target", bukan sumber utama data.

**Keuntungan:**

- UI selalu responsif (tidak ada loading spinner)
- Data tidak hilang meskipun network error
- Aplikasi tetap fungsional 100% tanpa internet

#### 2. Optimistic UI Updates

UI diupdate segera setelah data tersimpan lokal, tanpa menunggu response dari server. Jika sync gagal nanti, baru ditampilkan status error atau retry.

**Contoh:**

- User tap "Tambah ke Keranjang"
- Data langsung masuk ke Isar database
- UI langsung update (badge keranjang nambah)
- Di background, coba sync ke server (jika online)

#### 3. Intelligent Sync Strategies

Sync tidak dilakukan per-operation (terlalu boros), tapi menggunakan strategi yang efisien:

- **Periodic Sync**: Setiap X menit
- **Trigger-based Sync**: Saat koneksi kembali, saat app resume, dll
- **Delta Sync**: Hanya kirim data yang berubah, bukan seluruh dataset
- **Batch Sync**: Kumpulkan beberapa operasi, kirim sekalian

## Memilih Database Lokal: Kenapa Isar?

Flutter memiliki beberapa pilihan database lokal:

| Database      | Tipe              | Kelebihan                                       | Kekurangan                         | Cocok untuk                            |
| ------------- | ----------------- | ----------------------------------------------- | ---------------------------------- | -------------------------------------- |
| **Isar**      | NoSQL             | Super cepat, reactive queries, indexing, relasi | Web support experimental           | Complex apps, POS, e-commerce          |
| **Drift**     | SQL (SQLite)      | Mature, SQL power, ACID                         | Lebih verbose, butuh SQL knowledge | Apps dengan complex queries, reporting |
| **Hive**      | NoSQL (key-value) | Simple, cepat, low overhead                     | Limited query capabilities         | Simple caching, preferences            |
| **ObjectBox** | NoSQL             | Built-in sync, ACID                             | Komersial untuk fitur advanced     | Apps yang butuh sync built-in          |

Untuk aplikasi POS kita, Isar adalah pilihan terbaik karena:

1. **Performance**: Benchmark menunjukkan Isar 10-70x lebih cepat dari SQLite untuk operasi create/update [^29^]
2. **Reactive**: Built-in stream/watcher untuk auto-update UI
3. **Query Power**: Filtering, sorting, full-text search tanpa SQL
4. **Type Safety**: Compile-time checked queries
5. **Zero-Copy**: Membaca data tanpa duplikasi di memory

## Implementasi Offline-First di Aplikasi POS

### Step 1: Update pubspec.yaml

Tambahkan dependency untuk Part 3:

```yaml
dependencies:
  flutter:
    sdk: flutter
  provider: ^6.1.2
  intl: ^0.19.0
  flutter_secure_storage: ^9.2.2
  dio: ^5.7.0
  jwt_decoder: ^2.0.1
  # NEW: Isar Database
  isar: ^3.1.0
  isar_flutter_libs: ^3.1.0
  # NEW: Connectivity
  connectivity_plus: ^6.1.0
  internet_connection_checker: ^3.0.1
  # NEW: Path provider untuk lokasi database
  path_provider: ^2.1.2
  # NEW: UUID generator untuk local IDs
  uuid: ^4.5.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
  # NEW: Isar code generator
  isar_generator: ^3.1.0
  build_runner: ^2.4.13

flutter:
  uses-material-design: true
```

Jalankan:

```bash
flutter pub get
```

### Step 2: Setup Isar Database

**lib/database/isar_database.dart**

```dart
import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import '../models/local_product.dart';
import '../models/local_transaction.dart';
import '../models/sync_queue.dart';

/// Singleton class untuk mengelola instance Isar database.
///
/// Isar menggunakan file-based storage yang terletak di app documents directory.
/// Database ini akan persist meskipun app di-restart.
class IsarDatabase {
  static final IsarDatabase _instance = IsarDatabase._internal();
  factory IsarDatabase() => _instance;
  IsarDatabase._internal();

  Isar? _isar;

  /// Getter untuk mengakses instance Isar.
  /// Pastikan initialize() sudah dipanggil sebelum mengakses ini.
  Isar get isar {
    if (_isar == null) {
      throw Exception('Isar belum diinisialisasi. Panggil initialize() terlebih dahulu.');
    }
    return _isar!;
  }

  /// Inisialisasi database Isar.
  ///
  /// Method ini harus dipanggil sekali saat app startup, sebelum menggunakan database.
  /// Biasanya dipanggil di main.dart atau splash screen.
  Future<void> initialize() async {
    if (_isar != null) return; // Sudah diinisialisasi

    try {
      final dir = await getApplicationDocumentsDirectory();

      _isar = await Isar.open(
        [
          LocalProductSchema,
          LocalTransactionSchema,
          SyncQueueSchema,
        ],
        directory: dir.path,
        name: 'pos_database', // Nama file database
        inspector: true, // Enable inspector untuk debugging (jangan di production)
      );

      print('Isar database initialized at: ${dir.path}/pos_database.isar');
    } catch (e) {
      throw Exception('Gagal menginisialisasi Isar: $e');
    }
  }

  /// Menutup database.
  ///
  /// Panggil method ini saat app di-terminate untuk membersihkan resources.
  /// Meskipun tidak dipanggil, Isar akan menutup sendiri saat process di-kill.
  Future<void> close() async {
    await _isar?.close();
    _isar = null;
  }

  /// Cek apakah database sudah diinisialisasi
  bool get isInitialized => _isar != null;
}

// Global instance untuk kemudahan akses
final isarDb = IsarDatabase();
```

### Step 3: Membuat Model untuk Isar

Isar menggunakan annotation-based models dengan code generation. Setiap model harus memiliki `@Collection()` annotation.

**lib/models/local_product.dart**

```dart
import 'package:isar/isar.dart';

part 'local_product.g.dart'; // File generated oleh build_runner

/// Model produk yang disimpan di database lokal Isar.
///
/// Model ini berbeda dengan Product model di Part 1 karena:
/// 1. Menggunakan annotation Isar untuk schema definition
/// 2. Memiliki field untuk sync status (isSynced, lastModified, serverId)
/// 3. Menggunakan Id Isar (int) sebagai primary key lokal
@Collection()
class LocalProduct {
  /// Primary key lokal yang di-generate otomatis oleh Isar.
  /// Gunakan Isar.autoIncrement untuk auto-increment ID.
  Id id = Isar.autoIncrement;

  /// ID dari server (nullable sampai sync pertama kali).
  /// Ini digunakan untuk mapping antara data lokal dan server.
  @Index(unique: true) // Index untuk pencarian cepat dan mencegah duplikat
  String? serverId;

  /// Nama produk
  late String name;

  /// Deskripsi produk
  String? description;

  /// Harga produk dalam satuan terkecil (rupiah tanpa desimal)
  late int price;

  /// Kategori produk
  @Index() // Index untuk filtering berdasarkan kategori
  late String category;

  /// Jumlah stock tersedia
  late int stock;

  /// URL atau path gambar produk
  String? imageUrl;

  /// Timestamp kapan data terakhir dimodifikasi (dalam milliseconds)
  /// Digunakan untuk conflict resolution dan delta sync
  @Index() // Index untuk sorting dan query berdasarkan waktu
  late int lastModified;

  /// Status apakah data sudah tersinkronisasi dengan server
  @Index() // Index untuk query data yang belum sync
  late bool isSynced;

  /// Timestamp kapan data terakhir disinkronisasi
  int? lastSyncedAt;

  /// Versi data untuk optimistic concurrency control
  /// Jika versi di server lebih tinggi, berarti ada konflik
  late int version;

  /// Constructor default
  LocalProduct();

  /// Factory method untuk membuat dari Product model (Part 1)
  factory LocalProduct.fromProduct(dynamic product) {
    return LocalProduct()
      ..serverId = product.id
      ..name = product.name
      ..description = product.description
      ..price = (product.price * 100).toInt() // Konversi ke rupiah tanpa desimal
      ..category = product.category
      ..stock = product.stock
      ..lastModified = DateTime.now().millisecondsSinceEpoch
      ..isSynced = false
      ..version = 1;
  }

  /// Mengkonversi ke format untuk UI (Product model Part 1)
  ///
  /// Ini memungkinkan kita menggunakan data lokal dengan UI yang sudah dibuat
  dynamic toProduct() {
    // Kita return Map yang compatible dengan Product model
    return {
      'id': serverId ?? id.toString(),
      'name': name,
      'description': description ?? '',
      'price': price / 100, // Konversi kembali ke double
      'category': category,
      'stock': stock,
    };
  }

  /// Helper untuk mengupdate timestamp modifikasi
  void touch() {
    lastModified = DateTime.now().millisecondsSinceEpoch;
    isSynced = false;
    version++;
  }
}
```

**lib/models/local_transaction.dart**

```dart
import 'package:isar/isar.dart';
import 'package:uuid/uuid.dart';

part 'local_transaction.g.dart';

/// Status transaksi dalam lifecycle-nya
enum TransactionStatus {
  pending,    // Baru dibuat, belum diproses
  processing, // Sedang diproses (sync ke server)
  completed,  // Berhasil disinkronisasi
  failed,     // Gagal sync, akan di-retry
  cancelled,  // Dibatalkan oleh user
}

/// Model untuk menyimpan transaksi/penjualan di database lokal.
///
/// Setiap transaksi POS akan disimpan di sini terlebih dahulu,
/// kemudian disinkronkan ke server saat online.
@Collection()
class LocalTransaction {
  /// Primary key lokal (auto-increment)
  Id id = Isar.autoIncrement;

  /// UUID untuk identifikasi global (digunakan untuk sync)
  /// UUID ini di-generate sekali dan tidak berubah
  @Index(unique: true)
  late String uuid;

  /// ID transaksi di server (nullable sampai sync berhasil)
  @Index(unique: true)
  String? serverId;

  /// ID user kasir yang membuat transaksi
  @Index()
  late String cashierId;

  /// Nama kasir (denormalized untuk tampilan offline)
  late String cashierName;

  /// Timestamp transaksi dibuat
  @Index()
  late int createdAt;

  /// Total jumlah item dalam transaksi
  late int itemCount;

  /// Total nilai transaksi (dalam rupiah tanpa desimal)
  late int totalAmount;

  /// List item dalam transaksi (disimpan sebagai JSON string)
  /// Format: [{"productId": "1", "name": "Nasi Goreng", "qty": 2, "price": 25000}, ...]
  late String itemsJson;

  /// Status transaksi
  @Index()
  late String status; // Simpan sebagai string enum

  /// Jumlah pembayaran dari customer
  late int paymentAmount;

  /// Kembalian
  int get changeAmount => paymentAmount - totalAmount;

  /// Catatan tambahan
  String? notes;

  /// Timestamp terakhir dicoba sync
  int? lastSyncAttempt;

  /// Jumlah percobaan sync yang gagal
  late int syncRetryCount;

  /// Error message terakhir jika sync gagal
  String? lastError;

  /// Constructor
  LocalTransaction() {
    uuid = const Uuid().v4();
    createdAt = DateTime.now().millisecondsSinceEpoch;
    status = TransactionStatus.pending.name;
    syncRetryCount = 0;
  }

  /// Helper untuk mengubah status
  void setStatus(TransactionStatus newStatus) {
    status = newStatus.name;
  }

  TransactionStatus getStatus() {
    return TransactionStatus.values.firstWhere(
      (e) => e.name == status,
      orElse: () => TransactionStatus.pending,
    );
  }

  /// Cek apakah transaksi perlu di-sync
  bool get needsSync {
    final currentStatus = getStatus();
    return currentStatus == TransactionStatus.pending ||
           currentStatus == TransactionStatus.failed;
  }

  /// Mark transaksi sedang diproses
  void markProcessing() {
    setStatus(TransactionStatus.processing);
    lastSyncAttempt = DateTime.now().millisecondsSinceEpoch;
  }

  /// Mark transaksi berhasil
  void markCompleted(String serverTransactionId) {
    serverId = serverTransactionId;
    setStatus(TransactionStatus.completed);
    lastSyncAttempt = DateTime.now().millisecondsSinceEpoch;
    syncRetryCount = 0;
    lastError = null;
  }

  /// Mark transaksi gagal
  void markFailed(String error) {
    setStatus(TransactionStatus.failed);
    lastSyncAttempt = DateTime.now().millisecondsSinceEpoch;
    syncRetryCount++;
    lastError = error;
  }
}
```

**lib/models/sync_queue.dart**

```dart
import 'package:isar/isar.dart';

part 'sync_queue.g.dart';

/// Tipe operasi yang perlu di-sync
enum SyncOperationType {
  createProduct,
  updateProduct,
  deleteProduct,
  createTransaction,
  updateTransaction,
}

/// Model untuk antrian sinkronisasi.
///
/// Setiap operasi yang perlu di-sync ke server akan ditambahkan ke antrian ini.
/// Sync engine akan memproses antrian ini secara berkala atau saat online.
@Collection()
class SyncQueue {
  /// Primary key lokal
  Id id = Isar.autoIncrement;

  /// Tipe operasi
  @Index()
  late String operationType; // Enum sebagai string

  /// Nama koleksi/target (e.g., "products", "transactions")
  @Index()
  late String collection;

  /// ID data lokal yang terkait
  @Index()
  late int localId;

  /// ID data di server (jika sudah ada)
  String? serverId;

  /// Data yang akan di-sync (JSON string)
  /// Berisi field-field yang berubah untuk delta sync
  String? payload;

  /// Timestamp saat operasi ditambahkan ke antrian
  @Index()
  late int createdAt;

  /// Prioritas (lebih rendah = lebih penting, diproses duluan)
  late int priority;

  /// Jumlah percobaan yang sudah dilakukan
  late int retryCount;

  /// Timestamp percobaan terakhir
  int? lastAttempt;

  /// Error message terakhir
  String? lastError;

  /// Status antrian
  @Index()
  late String status; // "pending", "processing", "failed", "completed"

  /// Constructor
  SyncQueue() {
    createdAt = DateTime.now().millisecondsSinceEpoch;
    retryCount = 0;
    priority = 10; // Default priority
    status = 'pending';
  }

  SyncOperationType getOperationType() {
    return SyncOperationType.values.firstWhere(
      (e) => e.name == operationType,
      orElse: () => SyncOperationType.createProduct,
    );
  }

  void setOperationType(SyncOperationType type) {
    operationType = type.name;
  }
}
```

### Step 4: Generate Kode Isar

Setelah membuat model dengan annotation `@Collection()`, jalankan code generator:

```bash
flutter pub run build_runner build
```

Ini akan menghasilkan file `.g.dart` untuk setiap model yang berisi:

- Schema definition
- Query builders
- Serialization/deserialization code

Jika ada perubahan pada model, jalankan:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### Step 5: Membuat Repository untuk Operasi Database

**lib/repositories/product_repository.dart**

```dart
import 'package:isar/isar.dart';
import '../database/isar_database.dart';
import '../models/local_product.dart';
import '../models/sync_queue.dart';

/// Repository untuk mengelola produk dengan dukungan offline-first.
///
/// Repository ini menangani:
/// - CRUD operations ke database lokal Isar
/// - Queueing sync operations
/// - Reactive queries untuk auto-update UI
class ProductRepository {
  Isar get _isar => isarDb.isar;

  /// Stream untuk mendapatkan semua produk secara reactive.
  ///
  /// UI akan otomatis ter-update ketika ada perubahan data.
  Stream<List<LocalProduct>> watchAllProducts() {
    return _isar.localProducts.where().watch(fireImmediately: true);
  }

  /// Stream untuk mendapatkan produk berdasarkan kategori.
  Stream<List<LocalProduct>> watchByCategory(String category) {
    return _isar.localProducts
        .filter()
        .categoryEqualTo(category)
        .watch(fireImmediately: true);
  }

  /// Mendapatkan semua produk (one-time query).
  Future<List<LocalProduct>> getAllProducts() async {
    return await _isar.localProducts.where().findAll();
  }

  /// Mencari produk berdasarkan nama (full-text search).
  Future<List<LocalProduct>> searchProducts(String query) async {
    return await _isar.localProducts
        .filter()
        .nameContains(query, caseSensitive: false)
        .or()
        .descriptionContains(query, caseSensitive: false)
        .findAll();
  }

  /// Menambah atau mengupdate produk.
  ///
  /// Flow:
  /// 1. Simpan ke database lokal
  /// 2. Tambahkan ke sync queue untuk sync ke server
  /// 3. Return produk yang tersimpan
  Future<LocalProduct> saveProduct(LocalProduct product) async {
    return await _isar.writeTxn(() async {
      // Update timestamp
      product.touch();

      // Simpan produk
      await _isar.localProducts.put(product);

      // Tambahkan ke sync queue
      await _addToSyncQueue(product, product.serverId == null
          ? SyncOperationType.createProduct
          : SyncOperationType.updateProduct);

      return product;
    });
  }

  /// Menambah batch produk (untuk sync dari server).
  ///
  /// Method ini digunakan saat menerima data dari server,
  /// tidak menambahkan ke sync queue karena data sudah ada di server.
  Future<void> saveProductsFromServer(List<LocalProduct> products) async {
    await _isar.writeTxn(() async {
      for (final product in products) {
        product.isSynced = true;
        product.lastSyncedAt = DateTime.now().millisecondsSinceEpoch;
        await _isar.localProducts.put(product);
      }
    });
  }

  /// Menghapus produk.
  Future<void> deleteProduct(int localId) async {
    await _isar.writeTxn(() async {
      final product = await _isar.localProducts.get(localId);
      if (product != null && product.serverId != null) {
        // Jika sudah sync ke server, tambahkan ke queue untuk delete di server
        await _addToSyncQueue(product, SyncOperationType.deleteProduct);
      }
      await _isar.localProducts.delete(localId);
    });
  }

  /// Mendapatkan produk yang belum tersinkronisasi.
  Future<List<LocalProduct>> getUnsyncedProducts() async {
    return await _isar.localProducts
        .filter()
        .isSyncedEqualTo(false)
        .findAll();
  }

  /// Helper untuk menambahkan ke sync queue
  Future<void> _addToSyncQueue(
    LocalProduct product,
    SyncOperationType operationType,
  ) async {
    final queue = SyncQueue()
      ..setOperationType(operationType)
      ..collection = 'products'
      ..localId = product.id
      ..serverId = product.serverId
      ..payload = '{"lastModified": ${product.lastModified}, "version": ${product.version}}'
      ..priority = operationType == SyncOperationType.deleteProduct ? 5 : 10;

    await _isar.syncQueues.put(queue);
  }

  /// Sinkronisasi produk dari server.
  ///
  /// Method ini dipanggil saat app startup atau pull-to-refresh.
  /// Mengimplementasikan delta sync berdasarkan lastModified.
  Future<void> syncFromServer(List<Map<String, dynamic>> serverProducts) async {
    await _isar.writeTxn(() async {
      for (final serverData in serverProducts) {
        // Cek apakah produk sudah ada di lokal
        final existing = await _isar.localProducts
            .filter()
            .serverIdEqualTo(serverData['id'])
            .findFirst();

        if (existing != null) {
          // Cek conflict: jika lokal lebih baru, skip (last-write-wins)
          final serverModified = serverData['lastModified'] as int? ?? 0;
          if (existing.lastModified > serverModified && !existing.isSynced) {
            // Konflik: lokal lebih baru, biarkan lokal yang menang
            continue;
          }

          // Update data lokal dengan data server
          existing
            ..serverId = serverData['id']
            ..name = serverData['name']
            ..description = serverData['description']
            ..price = (serverData['price'] * 100).toInt()
            ..category = serverData['category']
            ..stock = serverData['stock']
            ..lastModified = serverModified
            ..isSynced = true
            ..lastSyncedAt = DateTime.now().millisecondsSinceEpoch
            ..version = serverData['version'] ?? 1;

          await _isar.localProducts.put(existing);
        } else {
          // Produk baru dari server
          final newProduct = LocalProduct()
            ..serverId = serverData['id']
            ..name = serverData['name']
            ..description = serverData['description']
            ..price = (serverData['price'] * 100).toInt()
            ..category = serverData['category']
            ..stock = serverData['stock']
            ..lastModified = serverData['lastModified'] ?? DateTime.now().millisecondsSinceEpoch
            ..isSynced = true
            ..lastSyncedAt = DateTime.now().millisecondsSinceEpoch
            ..version = serverData['version'] ?? 1;

          await _isar.localProducts.put(newProduct);
        }
      }
    });
  }
}
```

**lib/repositories/transaction_repository.dart**

```dart
import 'package:isar/isar.dart';
import '../database/isar_database.dart';
import '../models/local_transaction.dart';
import '../models/sync_queue.dart';

/// Repository untuk mengelola transaksi dengan dukungan offline-first.
class TransactionRepository {
  Isar get _isar => isarDb.isar;

  /// Stream untuk mendapatkan semua transaksi.
  Stream<List<LocalTransaction>> watchAllTransactions() {
    return _isar.localTransactions
        .where()
        .sortByCreatedAtDesc()
        .watch(fireImmediately: true);
  }

  /// Stream untuk transaksi yang perlu di-sync.
  Stream<List<LocalTransaction>> watchPendingTransactions() {
    return _isar.localTransactions
        .filter()
        .statusEqualTo(TransactionStatus.pending.name)
        .or()
        .statusEqualTo(TransactionStatus.failed.name)
        .watch(fireImmediately: true);
  }

  /// Mendapatkan transaksi berdasarkan UUID.
  Future<LocalTransaction?> getByUuid(String uuid) async {
    return await _isar.localTransactions
        .filter()
        .uuidEqualTo(uuid)
        .findFirst();
  }

  /// Menyimpan transaksi baru.
  ///
  /// Transaksi akan disimpan dengan status "pending" dan otomatis
  /// ditambahkan ke sync queue.
  Future<LocalTransaction> createTransaction({
    required String cashierId,
    required String cashierName,
    required List<Map<String, dynamic>> items,
    required int totalAmount,
    required int paymentAmount,
    String? notes,
  }) async {
    final transaction = LocalTransaction()
      ..cashierId = cashierId
      ..cashierName = cashierName
      ..itemCount = items.length
      ..totalAmount = totalAmount
      ..itemsJson = _encodeItems(items)
      ..paymentAmount = paymentAmount
      ..notes = notes;

    return await _isar.writeTxn(() async {
      await _isar.localTransactions.put(transaction);

      // Tambahkan ke sync queue dengan prioritas tinggi (transaksi penting)
      final queue = SyncQueue()
        ..setOperationType(SyncOperationType.createTransaction)
        ..collection = 'transactions'
        ..localId = transaction.id
        ..priority = 1; // Prioritas tinggi

      await _isar.syncQueues.put(queue);

      return transaction;
    });
  }

  /// Mendapatkan semua transaksi yang perlu di-sync ke server.
  Future<List<LocalTransaction>> getPendingSync() async {
    return await _isar.localTransactions
        .filter()
        .statusEqualTo(TransactionStatus.pending.name)
        .or()
        .statusEqualTo(TransactionStatus.failed.name)
        .and()
        .syncRetryCountLessThan(5) // Max 5 retry
        .findAll();
  }

  /// Update status transaksi setelah sync.
  Future<void> markAsSynced(
    int localId,
    String serverId, {
    String? error,
  }) async {
    await _isar.writeTxn(() async {
      final transaction = await _isar.localTransactions.get(localId);
      if (transaction != null) {
        if (error != null) {
          transaction.markFailed(error);
        } else {
          transaction.markCompleted(serverId);
        }
        await _isar.localTransactions.put(transaction);
      }
    });
  }

  /// Mendapatkan summary transaksi hari ini.
  Future<Map<String, dynamic>> getTodaySummary() async {
    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day).millisecondsSinceEpoch;
    final endOfDay = DateTime(now.year, now.month, now.day, 23, 59, 59).millisecondsSinceEpoch;

    final transactions = await _isar.localTransactions
        .filter()
        .createdAtBetween(startOfDay, endOfDay)
        .and()
        .statusEqualTo(TransactionStatus.completed.name)
        .findAll();

    final totalSales = transactions.fold<int>(0, (sum, t) => sum + t.totalAmount);

    return {
      'count': transactions.length,
      'totalSales': totalSales,
      'averageTicket': transactions.isEmpty ? 0 : totalSales / transactions.length,
    };
  }

  String _encodeItems(List<Map<String, dynamic>> items) {
    // Simplified JSON encoding
    return items.toString(); // Dalam produksi, gunakan jsonEncode
  }
}
```

### Step 6: Membuat Sync Engine

**lib/services/sync_service.dart**

```dart
import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import '../database/isar_database.dart';
import '../models/sync_queue.dart';
import '../repositories/product_repository.dart';
import '../repositories/transaction_repository.dart';

/// Service untuk mengelola sinkronisasi data antara lokal dan server.
///
/// Sync engine ini akan:
/// 1. Monitoring koneksi internet
/// 2. Memproses sync queue saat online
/// 3. Melakukan periodic sync
/// 4. Menangani conflict resolution
class SyncService {
  final Dio _dio;
  final ProductRepository _productRepo;
  final TransactionRepository _transactionRepo;

  Timer? _periodicSyncTimer;
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;
  bool _isSyncing = false;

  // Controller untuk broadcast sync status
  final _syncStatusController = StreamController<SyncStatus>.broadcast();
  Stream<SyncStatus> get syncStatus => _syncStatusController.stream;

  SyncService({
    Dio? dio,
    ProductRepository? productRepo,
    TransactionRepository? transactionRepo,
  })  : _dio = dio ?? Dio(),
        _productRepo = productRepo ?? ProductRepository(),
        _transactionRepo = transactionRepo ?? TransactionRepository();

  /// Inisialisasi sync service.
  ///
  /// Panggil method ini di main.dart setelah Isar diinisialisasi.
  void initialize() {
    // Listen untuk perubahan konektivitas
    _connectivitySubscription = Connectivity()
        .onConnectivityChanged
        .listen(_onConnectivityChanged);

    // Setup periodic sync setiap 5 menit
    _periodicSyncTimer = Timer.periodic(
      const Duration(minutes: 5),
      (_) => _performSync(),
    );

    // Cek koneksi awal dan sync jika online
    _checkInitialConnectivity();
  }

  /// Dispose resources.
  void dispose() {
    _periodicSyncTimer?.cancel();
    _connectivitySubscription?.cancel();
    _syncStatusController.close();
  }

  /// Cek koneksi saat app startup.
  Future<void> _checkInitialConnectivity() async {
    final result = await Connectivity().checkConnectivity();
    if (result != ConnectivityResult.none) {
      _performSync();
    }
  }

  /// Handler untuk perubahan konektivitas.
  void _onConnectivityChanged(ConnectivityResult result) {
    if (result == ConnectivityResult.none) {
      _syncStatusController.add(SyncStatus.offline);
    } else {
      _syncStatusController.add(SyncStatus.online);
      // Sync segera saat kembali online
      _performSync();
    }
  }

  /// Melakukan sinkronisasi.
  ///
  /// Method ini akan:
  /// 1. Push data lokal yang belum sync ke server
  /// 2. Pull data baru dari server
  /// 3. Proses antrian sync
  Future<void> _performSync() async {
    if (_isSyncing) return; // Hindari concurrent sync

    _isSyncing = true;
    _syncStatusController.add(SyncStatus.syncing);

    try {
      // 1. Sync transaksi yang pending (prioritas tinggi)
      await _syncPendingTransactions();

      // 2. Sync produk yang belum sync
      await _syncPendingProducts();

      // 3. Pull data produk dari server (delta sync)
      await _pullProductsFromServer();

      _syncStatusController.add(SyncStatus.completed);
    } catch (e) {
      print('Sync error: $e');
      _syncStatusController.add(SyncStatus.error);
    } finally {
      _isSyncing = false;
    }
  }

  /// Sinkronisasi transaksi pending ke server.
  Future<void> _syncPendingTransactions() async {
    final pending = await _transactionRepo.getPendingSync();

    for (final transaction in pending) {
      try {
        transaction.markProcessing();
        await isarDb.isar.writeTxn(() async {
          await isarDb.isar.localTransactions.put(transaction);
        });

        // Kirim ke server
        final response = await _dio.post(
          '/api/transactions',
          data: {
            'uuid': transaction.uuid,
            'cashierId': transaction.cashierId,
            'items': transaction.itemsJson,
            'totalAmount': transaction.totalAmount,
            'paymentAmount': transaction.paymentAmount,
            'createdAt': transaction.createdAt,
          },
        );

        if (response.statusCode == 201) {
          await _transactionRepo.markAsSynced(
            transaction.id,
            response.data['id'],
          );
        }
      } on DioException catch (e) {
        final error = e.response?.data['message'] ?? e.message ?? 'Network error';
        await _transactionRepo.markAsSynced(
          transaction.id,
          '',
          error: error,
        );
      }
    }
  }

  /// Sinkronisasi produk yang belum sync.
  Future<void> _syncPendingProducts() async {
    final unsynced = await _productRepo.getUnsyncedProducts();

    for (final product in unsynced) {
      try {
        final isNew = product.serverId == null;

        final response = isNew
            ? await _dio.post('/api/products', data: product.toProduct())
            : await _dio.put(
                '/api/products/${product.serverId}',
                data: product.toProduct(),
              );

        if (response.statusCode == 200 || response.statusCode == 201) {
          await isarDb.isar.writeTxn(() async {
            product
              ..serverId = response.data['id']
              ..isSynced = true
              ..lastSyncedAt = DateTime.now().millisecondsSinceEpoch;
            await isarDb.isar.localProducts.put(product);
          });
        }
      } catch (e) {
        print('Failed to sync product ${product.id}: $e');
        // Retry akan dilakukan di sync berikutnya
      }
    }
  }

  /// Pull data produk dari server (delta sync).
  Future<void> _pullProductsFromServer() async {
    try {
      // Ambil timestamp sync terakhir
      final lastSync = await _getLastSyncTimestamp();

      final response = await _dio.get(
        '/api/products',
        queryParameters: {
          'since': lastSync,
          'limit': 100,
        },
      );

      if (response.statusCode == 200) {
        final products = (response.data as List)
            .map((json) => LocalProduct.fromJson(json)) // Perlu tambah fromJson
            .toList();

        await _productRepo.saveProductsFromServer(products as List<Map<String, dynamic>>);
      }
    } catch (e) {
      print('Failed to pull products: $e');
    }
  }

  Future<int> _getLastSyncTimestamp() async {
    // Ambil dari shared preferences atau database
    // Simplified: return 0 untuk sync semua data
    return 0;
  }

  /// Trigger manual sync.
  ///
  /// Panggil method ini dari UI (misalnya pull-to-refresh).
  Future<void> syncNow() async {
    await _performSync();
  }

  /// Cek apakah sedang sync.
  bool get isSyncing => _isSyncing;
}

/// Status sinkronisasi untuk UI.
enum SyncStatus {
  offline,    // Tidak ada koneksi
  online,     // Online tapi tidak sedang sync
  syncing,    // Sedang proses sync
  completed,  // Sync berhasil
  error,      // Sync gagal
}
```

### Step 7: Update Provider untuk Menggunakan Database Lokal

**lib/providers/product_provider.dart**

```dart
import 'package:flutter/foundation.dart';
import '../models/local_product.dart';
import '../repositories/product_repository.dart';

/// Provider untuk mengelola state produk dengan data dari Isar database.
///
/// Provider ini menggunakan reactive queries dari Isar, sehingga UI
/// akan otomatis ter-update ketika data di database berubah.
class ProductProvider with ChangeNotifier {
  final ProductRepository _repository;
  List<LocalProduct> _products = [];
  bool _isLoading = false;
  String? _error;
  Stream<List<LocalProduct>>? _productsStream;

  ProductProvider({ProductRepository? repository})
      : _repository = repository ?? ProductRepository() {
    _initStream();
  }

  List<LocalProduct> get products => _products;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Inisialisasi stream untuk reactive updates.
  void _initStream() {
    _productsStream = _repository.watchAllProducts();
    _productsStream!.listen(
      (products) {
        _products = products;
        notifyListeners();
      },
      onError: (e) {
        _error = 'Error loading products: $e';
        notifyListeners();
      },
    );
  }

  /// Menambah produk baru.
  Future<void> addProduct(LocalProduct product) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _repository.saveProduct(product);
      _error = null;
    } catch (e) {
      _error = 'Failed to add product: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Mencari produk.
  Future<void> search(String query) async {
    if (query.isEmpty) {
      _initStream(); // Reset ke semua produk
      return;
    }

    _isLoading = true;
    notifyListeners();

    try {
      _products = await _repository.searchProducts(query);
      _error = null;
    } catch (e) {
      _error = 'Search failed: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Refresh data dari server (manual sync).
  Future<void> refresh() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Trigger sync dari server
      // Implementasi tergantung pada SyncService
      _error = null;
    } catch (e) {
      _error = 'Refresh failed: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    // Cleanup jika diperlukan
    super.dispose();
  }
}
```

### Step 8: Update Cart Provider untuk Simpan Transaksi

**lib/providers/cart_provider.dart** (Update dari Part 1)

```dart
import 'package:flutter/foundation.dart';
import '../models/product.dart';
import '../models/cart_item.dart';
import '../models/local_transaction.dart';
import '../repositories/transaction_repository.dart';

class CartProvider with ChangeNotifier {
  final List<CartItem> _items = [];
  final TransactionRepository _transactionRepo;

  CartProvider({TransactionRepository? transactionRepo})
      : _transactionRepo = transactionRepo ?? TransactionRepository();

  List<CartItem> get items => List.unmodifiable(_items);
  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);
  double get totalAmount => _items.fold(0.0, (sum, item) => sum + item.subtotal);
  bool get isEmpty => _items.isEmpty;

  void addToCart(Product product) {
    final existingIndex = _items.indexWhere(
      (item) => item.product.id == product.id,
    );

    if (existingIndex >= 0) {
      final existingItem = _items[existingIndex];
      if (existingItem.quantity < product.stock) {
        existingItem.increment();
        notifyListeners();
      }
    } else {
      _items.add(CartItem(product: product));
      notifyListeners();
    }
  }

  void removeFromCart(String productId) {
    final existingIndex = _items.indexWhere(
      (item) => item.product.id == productId,
    );

    if (existingIndex >= 0) {
      final existingItem = _items[existingIndex];
      if (existingItem.quantity > 1) {
        existingItem.decrement();
      } else {
        _items.removeAt(existingIndex);
      }
      notifyListeners();
    }
  }

  void removeItemCompletely(String productId) {
    _items.removeWhere((item) => item.product.id == productId);
    notifyListeners();
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }

  bool isInCart(String productId) {
    return _items.any((item) => item.product.id == productId);
  }

  int getQuantity(String productId) {
    final item = _items.firstWhere(
      (item) => item.product.id == productId,
      orElse: () => CartItem(
        product: Product(id: '', name: '', description: '', price: 0, category: '', stock: 0),
        quantity: 0,
      ),
    );
    return item.quantity;
  }

  /// Checkout dan simpan transaksi ke database lokal.
  ///
  /// Transaksi akan otomatis masuk ke sync queue untuk dikirim ke server.
  Future<LocalTransaction?> checkout({
    required String cashierId,
    required String cashierName,
    required int paymentAmount,
    String? notes,
  }) async {
    if (_items.isEmpty) return null;

    try {
      final items = _items.map((item) => {
        'productId': item.product.id,
        'name': item.product.name,
        'quantity': item.quantity,
        'price': item.product.price,
        'subtotal': item.subtotal,
      }).toList();

      final transaction = await _transactionRepo.createTransaction(
        cashierId: cashierId,
        cashierName: cashierName,
        items: items,
        totalAmount: (totalAmount * 100).toInt(),
        paymentAmount: paymentAmount * 100,
        notes: notes,
      );

      clearCart();
      return transaction;
    } catch (e) {
      throw Exception('Checkout failed: $e');
    }
  }
}
```

### Step 9: Membuat UI untuk Network Status

**lib/widgets/sync_status_bar.dart**

```dart
import 'package:flutter/material.dart';
import '../services/sync_service.dart';

/// Widget untuk menampilkan status koneksi dan sinkronisasi.
///
/// Widget ini menunjukkan:
/// - Status online/offline
/// - Status sync (sedang sync, sync berhasil, error)
/// - Jumlah item yang pending sync
class SyncStatusBar extends StatelessWidget {
  final SyncService syncService;

  const SyncStatusBar({
    super.key,
    required this.syncService,
  });

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<SyncStatus>(
      stream: syncService.syncStatus,
      initialData: SyncStatus.online,
      builder: (context, snapshot) {
        final status = snapshot.data ?? SyncStatus.online;

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: _getBackgroundColor(status),
          child: SafeArea(
            child: Row(
              children: [
                Icon(
                  _getIcon(status),
                  color: _getTextColor(status),
                  size: 18,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _getMessage(status),
                    style: TextStyle(
                      color: _getTextColor(status),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                if (status == SyncStatus.error)
                  TextButton(
                    onPressed: () => syncService.syncNow(),
                    child: Text(
                      'RETRY',
                      style: TextStyle(
                        color: _getTextColor(status),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Color _getBackgroundColor(SyncStatus status) {
    switch (status) {
      case SyncStatus.offline:
        return Colors.orange.shade100;
      case SyncStatus.syncing:
        return Colors.blue.shade100;
      case SyncStatus.completed:
        return Colors.green.shade100;
      case SyncStatus.error:
        return Colors.red.shade100;
      case SyncStatus.online:
        return Colors.grey.shade100;
    }
  }

  Color _getTextColor(SyncStatus status) {
    switch (status) {
      case SyncStatus.offline:
        return Colors.orange.shade900;
      case SyncStatus.syncing:
        return Colors.blue.shade900;
      case SyncStatus.completed:
        return Colors.green.shade900;
      case SyncStatus.error:
        return Colors.red.shade900;
      case SyncStatus.online:
        return Colors.grey.shade700;
    }
  }

  IconData _getIcon(SyncStatus status) {
    switch (status) {
      case SyncStatus.offline:
        return Icons.wifi_off;
      case SyncStatus.syncing:
        return Icons.sync;
      case SyncStatus.completed:
        return Icons.check_circle;
      case SyncStatus.error:
        return Icons.error_outline;
      case SyncStatus.online:
        return Icons.wifi;
    }
  }

  String _getMessage(SyncStatus status) {
    switch (status) {
      case SyncStatus.offline:
        return 'Offline mode - Data disimpan lokal';
      case SyncStatus.syncing:
        return 'Menyinkronkan data...';
      case SyncStatus.completed:
        return 'Data tersinkronisasi';
      case SyncStatus.error:
        return 'Gagal sync - Tap retry';
      case SyncStatus.online:
        return 'Online - Siap sync';
    }
  }
}
```

### Step 10: Main.dart Final (Integrasi Semua Part)

**lib/main.dart** (Final Complete Version)

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'database/isar_database.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/product_provider.dart';
import 'services/sync_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'widgets/sync_status_bar.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inisialisasi Isar database
  await isarDb.initialize();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => ProductProvider()),
        Provider(create: (_) => SyncService()..initialize()),
      ],
      child: MaterialApp(
        title: 'Mini POS - Offline First',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
          useMaterial3: true,
          appBarTheme: const AppBarTheme(
            centerTitle: true,
            elevation: 0,
          ),
          cardTheme: CardTheme(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        home: const AuthWrapper(),
      ),
    );
  }
}

/// Wrapper untuk menentukan halaman berdasarkan autentikasi.
class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isInitializing = true;

  @override
  void initState() {
    super.initState();
    _initializeAuth();
  }

  Future<void> _initializeAuth() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.initialize();

    if (mounted) {
      setState(() {
        _isInitializing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isInitializing) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Memuat aplikasi...'),
            ],
          ),
        ),
      );
    }

    return Consumer<AuthProvider>(
      builder: (context, auth, child) {
        if (auth.isAuthenticated) {
          return const MainAppScreen();
        } else {
          return const LoginScreen();
        }
      },
    );
  }
}

/// Screen utama yang menampilkan HomeScreen dengan SyncStatusBar.
class MainAppScreen extends StatelessWidget {
  const MainAppScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final syncService = Provider.of<SyncService>(context);

    return Column(
      children: [
        SyncStatusBar(syncService: syncService),
        const Expanded(child: HomeScreen()),
      ],
    );
  }
}
```

## Alur Data dalam Aplikasi Offline-First

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTION                              │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────────────┐
│  UI Layer (Widget)                                               │
│  - Menerima input user                                           │
│  - Memanggil method Provider                                     │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────────────┐
│  Provider Layer (Business Logic)                                 │
│  - Validasi business rules                                       │
│  - Memanggil Repository                                          │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────────────┐
│  Repository Layer                                                │
│  - Write ke Isar Database (LOCAL-FIRST)                          │
│  - Add to Sync Queue                                             │
│  - Return hasil                                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────────────┐
│  Isar Database (Local Storage)                                   │
│  - Simpan data                                                   │
│  - Trigger reactive update                                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────────────┐
│  UI Auto-Update (Reactive Stream)                                │
│  - Widget rebuild dengan data baru                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────────────┐
│  Background Sync (SyncService)                                   │
│  - Monitor connectivity                                          │
│  - Process Sync Queue                                            │
│  - Push to Server (when online)                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────────────┐
│  Server (Backend API)                                              │
│  - Menerima data sync                                              │
│  - Return confirmation                                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────────────┐
│  Update Local Sync Status                                        │
│  - Mark as synced                                                │
│  - Update serverId jika baru                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Conflict Resolution Strategy

Dalam sistem offline-first, konflik bisa terjadi ketika:

1. User A mengedit data offline
2. User B (atau admin) mengedit data yang sama di server
3. User A kembali online dan mencoba sync

Strategi yang kita implementasikan adalah **Last-Write-Wins dengan Prioritas**:

```dart
// Pseudocode untuk conflict resolution
if (localLastModified > serverLastModified) {
  // Data lokal lebih baru, kirim ke server (client wins)
  pushToServer(localData);
} else if (localLastModified < serverLastModified) {
  // Data server lebih baru, update lokal (server wins)
  updateLocal(serverData);
} else {
  // Timestamp sama, bandingkan version number
  if (localVersion >= serverVersion) {
    clientWins();
  } else {
    serverWins();
  }
}
```

## Testing Offline-First App

### 1. Testing dengan Airplane Mode

```dart
// Test case: Checkout saat offline
void main() {
  test('Checkout should save to local DB when offline', () async {
    // Arrange
    final cart = CartProvider();
    cart.addToCart(dummyProduct);

    // Act - Simulate offline checkout
    final transaction = await cart.checkout(
      cashierId: '1',
      cashierName: 'Test',
      paymentAmount: 50000,
    );

    // Assert
    expect(transaction, isNotNull);
    expect(transaction!.getStatus(), TransactionStatus.pending);

    // Verify saved in local DB
    final saved = await isarDb.isar.localTransactions.get(transaction.id);
    expect(saved, isNotNull);
  });
}
```

### 2. Testing Sync Mechanism

```dart
test('Pending transactions should sync when online', () async {
  // Create pending transaction
  final transaction = await createPendingTransaction();

  // Trigger sync
  await syncService.syncNow();

  // Verify status updated
  final updated = await isarDb.isar.localTransactions.get(transaction.id);
  expect(updated!.getStatus(), TransactionStatus.completed);
  expect(updated.serverId, isNotNull);
});
```

## Best Practices untuk Offline-First Apps

### 1. Data Persistence

- SELALU simpan ke lokal terlebih dahulu
- Gunakan transaction untuk operasi atomic
- Implementasikan retry mechanism dengan exponential backoff

### 2. UX Patterns

- Optimistic updates: Update UI segera, sync di background
- Indikator status: Tunjukkan status online/offline/syncing
- Queue visualization: Beritahu user ada data yang pending
- Conflict resolution UI: Beri pilihan user saat ada konflik

### 3. Error Handling

- Graceful degradation: Fitur non-kritis bisa nonaktif saat offline
- Retry dengan batas: Max 5 retry, kemudian tandai sebagai failed
- Dead letter queue: Data yang gagal sync setelah max retry perlu perhatian manual

### 4. Performance

- Delta sync: Hanya kirim data yang berubah
- Batch operations: Kumpulkan beberapa operasi sebelum sync
- Compression: Kompres data sebelum kirim ke server
- Pagination: Jangan load semua data sekaligus

## Troubleshooting Common Issues

### Issue 1: Data tidak muncul setelah restart app

**Penyebab:** Isar belum diinisialisasi sebelum query
**Solusi:** Pastikan `isarDb.initialize()` selesai sebelum app berjalan

### Issue 2: Sync tidak berjalan otomatis

**Penyebab:** SyncService tidak diinisialisasi atau connectivity listener tidak aktif
**Solusi:** Panggil `syncService.initialize()` di main.dart dan cek permission

### Issue 3: Konflik data tidak ter-resolve dengan benar

**Penyebab:** Timestamp tidak sinkron antara client dan server
**Solusi:** Gunakan server timestamp sebagai authoritative source

## Kesimpulan Part 3

Di part ini kita telah membangun sistem offline-first yang lengkap:

1. **Isar Database Setup** - Database NoSQL yang cepat dan reactive
2. **Local-First Architecture** - Semua write ke lokal dulu, sync di background
3. **Sync Engine** - Monitoring koneksi, periodic sync, queue processing
4. **Conflict Resolution** - Last-write-wins dengan timestamp dan version
5. **Reactive UI** - Auto-update menggunakan Isar streams
6. **Network Status** - Indikator online/offline/syncing untuk UX yang baik

Aplikasi POS kita sekarang memiliki karakteristik:

- 100% fungsional tanpa internet
- Data tidak pernah hilang meskipun network error
- Auto-sync saat kembali online
- Conflict resolution otomatis
- UX yang smooth dengan optimistic updates

## Source Code Lengkap Part 3

Struktur folder final:

```
lib/
├── main.dart
├── database/
│   └── isar_database.dart
├── models/
│   ├── product.dart (Part 1)
│   ├── cart_item.dart (Part 1)
│   ├── local_product.dart (+ generated)
│   ├── local_transaction.dart (+ generated)
│   └── sync_queue.dart (+ generated)
├── providers/
│   ├── auth_provider.dart (Part 2)
│   ├── cart_provider.dart (Updated)
│   └── product_provider.dart (New)
├── repositories/
│   ├── auth_repository.dart (Part 2)
│   ├── product_repository.dart (New)
│   └── transaction_repository.dart (New)
├── screens/
│   ├── login_screen.dart (Part 2)
│   ├── home_screen.dart (Part 2)
│   └── cart_screen.dart (Part 1)
├── services/
│   ├── secure_storage_service.dart (Part 2)
│   ├── api_interceptor.dart (Part 2)
│   └── sync_service.dart (New)
└── widgets/
    ├── product_card.dart (Part 1)
    └── sync_status_bar.dart (New)
```

## Catatan Penting

1. **Code Generation**: Jangan lupa jalankan `flutter pub run build_runner build` setiap kali mengubah model Isar.

2. **Backend Integration**: Kode di atas menggunakan placeholder API endpoints. Sesuaikan dengan backend-mu (Laravel, Node.js, Firebase, dll).

3. **Testing**: Test secara intensif dengan skenario:
   - Checkout saat offline
   - Edit produk saat offline kemudian online
   - Konflik data (edit di 2 device berbeda)
   - Recovery dari crash saat sync

4. **Production**: Sebelum production, matikan `inspector: true` di Isar initialization untuk keamanan.

---

Selamat! Kamu sekarang memiliki aplikasi POS Flutter yang:

- Menggunakan Clean Architecture (Part 1)
- Memiliki keamanan autentikasi yang kuat (Part 2)
- Bekerja offline-first dengan sync yang handal (Part 3)

Seri tutorial ini selesai. Semoga bermanfaat dan selamat mengembangkan aplikasi POS-mu!

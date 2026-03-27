---
title: "Masterclass Flutter Part 2: Slicing dan Logika Aplikasi Mini POS Siap Produksi"
date: "Mar 27, 2026"
description: "Masterclass Flutter Part 2: Slicing dan Logika Aplikasi Mini POS Siap Produksi"
---

## Pendahuluan

Selamat datang kembali di seri tutorial Mini POS. Di Part 1, kita sudah membangun fondasi aplikasi dengan state management untuk keranjang belanja. Sekarang, kita akan membahas sesuatu yang sangat penting tapi sering diabaikan oleh developer pemula: keamanan autentikasi dan penyimpanan token.

## Mengapa Pembahasan Ini Penting

Bayangkan skenario ini: Kamu sudah membuat aplikasi POS yang bagus, user sudah login, dan token disimpan di aplikasi. Tapi ternyata kamu menyimpannya di SharedPreferences (penyimpanan biasa yang tidak terenkripsi). Suatu hari, ada yang menginstall aplikasi malicious di HP kasir, dan token tersebut dicuri. Penjahat itu sekarang bisa mengakses API backend-mu seolah-olah dia adalah kasir yang sah, melihat data transaksi, bahkan membuat transaksi palsu.

Ini bukan cerita fiksi. Kejadian seperti ini sering terjadi karena banyak developer menganggap "yang penting jalan dulu" dan mengabaikan aspek keamanan.

## Apa yang Akan Kita Pelajari

1. Cara kerja autentikasi JWT (JSON Web Token) secara fundamental
2. Mengapa SharedPreferences tidak aman untuk data sensitif
3. Cara menggunakan flutter_secure_storage untuk menyimpan token dengan aman
4. Implementasi login, logout, dan proteksi route di aplikasi POS
5. Pattern Repository untuk memisahkan logika autentikasi dari UI

## Memahami JWT (JSON Web Token)

Sebelum kita coding, kita harus paham dulu apa itu JWT dan kenapa kita menggunakannya.

### Apa itu JWT

JWT adalah standar terbuka (RFC 7519) yang mendefinisikan cara kompak dan self-contained untuk mengirim informasi antar pihak sebagai objek JSON. Dalam konteks autentikasi mobile, JWT digunakan sebagai "tiket" yang dibawa aplikasi setiap kali berkomunikasi dengan server.

### Struktur JWT

Sebuah JWT terdiri dari 3 bagian yang dipisahkan oleh titik (.):

```
xxxxx.yyyyy.zzzzz
     |     |     |
     |     |     └── Signature (verifikasi integritas)
     |     └──────── Payload (data user, expired, dll)
     └────────────── Header (algoritma, tipe token)
```

**Header** berisi metadata seperti algoritma yang digunakan (HS256, RS256, dll).

**Payload** berisi klaim atau data, seperti:

- `sub` (subject): ID user
- `iat` (issued at): kapan token dibuat
- `exp` (expiration): kapan token expired
- Data tambahan seperti nama, role, dll

**Signature** adalah hasil enkripsi dari header + payload menggunakan secret key. Ini memastikan token tidak bisa dimanipulasi.

### Kenapa JWT Populer untuk Mobile

1. **Stateless**: Server tidak perlu menyimpan sesi di database. Token sudah berisi semua informasi yang dibutuhkan.
2. **Self-contained**: Semua informasi ada di dalam token itu sendiri.
3. **Cross-domain**: Bisa digunakan untuk komunikasi antar service yang berbeda domain.
4. **Mobile-friendly**: Format string yang mudah disimpan dan dikirim via HTTP header.

### Jenis Token yang Umum Digunakan

Dalam sistem modern, biasanya ada dua jenis token:

1. **Access Token**: Token dengan masa hidup pendek (15 menit - 1 jam) yang digunakan untuk mengakses API. Jika token ini dicuri, waktu yang dimiliki penjahat untuk menggunakannya sangat terbatas.

2. **Refresh Token**: Token dengan masa hidup panjang (7-30 hari) yang digunakan untuk mendapatkan access token baru ketika yang lama expired. Token ini harus disimpan dengan ekstra hati-hati karena bisa digunakan untuk memperpanjang akses tanpa batas.

## Masalah dengan SharedPreferences

Banyak tutorial Flutter di internet yang mengajarkan menggunakan SharedPreferences untuk menyimpan token. Ini adalah praktik yang berbahaya dan harus dihindari.

### Bagaimana SharedPreferences Bekerja

SharedPreferences menyimpan data sebagai key-value pairs dalam file XML (Android) atau plist (iOS). File ini:

- Tidak terenkripsi secara default
- Bisa diakses oleh aplikasi lain jika device di-root
- Bisa dibaca dengan mudah menggunakan tool seperti Android Studio atau file manager

### Demonstrasi Kerentanan

Jika kamu menyimpan token di SharedPreferences seperti ini:

```dart
// JANGAN LAKUKAN INI - TIDAK AMAN
final prefs = await SharedPreferences.getInstance();
await prefs.setString('token', 'eyJhbGciOiJIUzI1NiIs...');
```

Di Android, file ini tersimpan di:

```
/data/data/com.example.app/shared_prefs/FlutterSharedPreferences.xml
```

Isi filenya terlihat seperti ini:

```xml
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <string name="token">eyJhbGciOiJIUzI1NiIs...</string>
</map>
```

Token terlihat jelas dalam bentuk plain text. Siapa pun yang memiliki akses ke file system bisa membaca token ini.

### Solusi: flutter_secure_storage

Package `flutter_secure_storage` menyimpan data dengan cara yang berbeda:

**Di Android:** Menggunakan Android Keystore System dan EncryptedSharedPreferences

- Data dienkripsi menggunakan AES-256
- Encryption key disimpan di Android Keystore yang terpisah dari aplikasi
- Key tidak bisa diekstrak bahkan oleh aplikasi itu sendiri

**Di iOS:** Menggunakan Keychain Services

- Data dienkripsi secara hardware-accelerated
- Keychain terintegrasi dengan Secure Enclave (chip khusus untuk keamanan)
- Data tetap terenkripsi meskipun device di-backup

## Implementasi Keamanan di Aplikasi POS

Sekarang kita akan mengimplementasikan sistem autentikasi yang aman ke dalam aplikasi POS yang sudah kita buat di Part 1.

### Step 1: Update pubspec.yaml

Tambahkan dependency yang dibutuhkan:

```yaml
dependencies:
  flutter:
    sdk: flutter
  provider: ^6.1.2
  intl: ^0.19.0
  flutter_secure_storage: ^9.2.2
  dio: ^5.7.0
  jwt_decoder: ^2.0.1
  crypto: ^3.0.6

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true
```

Penjelasan dependency baru:

- `flutter_secure_storage`: Untuk penyimpanan token yang terenkripsi
- `dio`: HTTP client yang powerful untuk komunikasi dengan API
- `jwt_decoder`: Untuk decode dan validasi JWT di client side
- `crypto`: Untuk operasi kriptografi tambahan jika diperlukan

Jalankan:

```bash
flutter pub get
```

### Step 2: Membuat Secure Storage Service

Kita akan membuat service khusus yang menangani semua operasi penyimpanan aman. Ini memisahkan logika keamanan dari bagian lain aplikasi.

**lib/services/secure_storage_service.dart**

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Service untuk menangani penyimpanan data sensitif dengan enkripsi.
///
/// Service ini menggunakan flutter_secure_storage yang di-backup oleh:
/// - Android: Keystore + EncryptedSharedPreferences (AES-256)
/// - iOS: Keychain Services (hardware-accelerated encryption)
///
/// JANGAN pernah menyimpan data sensitif di SharedPreferences biasa!
class SecureStorageService {
  // Singleton pattern untuk memastikan hanya ada satu instance
  static final SecureStorageService _instance = SecureStorageService._internal();
  factory SecureStorageService() => _instance;
  SecureStorageService._internal();

  // Instance flutter_secure_storage dengan konfigurasi aman
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      // Gunakan EncryptedSharedPreferences yang modern dan aman
      encryptedSharedPreferences: true,
      // KeyCipherAlgorithm default sudah aman (RSA_ECB_PKCS1Padding)
      // StorageCipherAlgorithm default sudah aman (AES_GCM_NoPadding)
    ),
    iOptions: IOSOptions(
      // Aksesibilitas: data tetap tersedia setelah device lock
      // tapi tidak bisa di-migrate ke device lain
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  // Key constants untuk menghindari typo
  static const String _keyAccessToken = 'access_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyUserId = 'user_id';
  static const String _keyUserName = 'user_name';
  static const String _keyUserEmail = 'user_email';
  static const String _keyTokenExpiry = 'token_expiry';

  /// Menyimpan access token
  ///
  /// Access token adalah token dengan masa hidup pendek (biasanya 15-60 menit)
  /// yang digunakan untuk mengakses API. Token ini harus disimpan dengan aman
  /// karena jika dicuri, penyerang bisa mengakses API sebagai user tersebut.
  Future<void> saveAccessToken(String token) async {
    try {
      await _storage.write(key: _keyAccessToken, value: token);
    } catch (e) {
      throw Exception('Gagal menyimpan access token: $e');
    }
  }

  /// Mengambil access token
  ///
  /// Returns null jika token tidak ditemukan atau terjadi error.
  Future<String?> getAccessToken() async {
    try {
      return await _storage.read(key: _keyAccessToken);
    } catch (e) {
      // Log error untuk debugging (di production, gunakan proper logging)
      print('Error membaca access token: $e');
      return null;
    }
  }

  /// Menyimpan refresh token
  ///
  /// Refresh token adalah token dengan masa hidup panjang (7-30 hari) yang
  /// digunakan untuk mendapatkan access token baru. Token ini LEBIH BERHARGA
  /// dari access token karena bisa digunakan untuk memperpanjang akses tanpa batas.
  ///
  /// Jika refresh token dicuri, penyerang bisa:
  /// 1. Mendapatkan access token baru kapan saja
  /// 2. Mengakses API selama refresh token belum expired
  /// 3. Membuat access token baru bahkan setelah user logout (jika tidak di-revoke)
  Future<void> saveRefreshToken(String token) async {
    try {
      await _storage.write(key: _keyRefreshToken, value: token);
    } catch (e) {
      throw Exception('Gagal menyimpan refresh token: $e');
    }
  }

  /// Mengambil refresh token
  Future<String?> getRefreshToken() async {
    try {
      return await _storage.read(key: _keyRefreshToken);
    } catch (e) {
      print('Error membaca refresh token: $e');
      return null;
    }
  }

  /// Menyimpan informasi user
  ///
  /// Meskipun tidak se-sensitif token, data user juga sebaiknya disimpan
  /// dengan aman untuk mencegah profiling atau social engineering.
  Future<void> saveUserInfo({
    required String userId,
    required String name,
    required String email,
  }) async {
    try {
      await Future.wait([
        _storage.write(key: _keyUserId, value: userId),
        _storage.write(key: _keyUserName, value: name),
        _storage.write(key: _keyUserEmail, value: email),
      ]);
    } catch (e) {
      throw Exception('Gagal menyimpan info user: $e');
    }
  }

  /// Mengambil user ID
  Future<String?> getUserId() async {
    return await _storage.read(key: _keyUserId);
  }

  /// Mengambil nama user
  Future<String?> getUserName() async {
    return await _storage.read(key: _keyUserName);
  }

  /// Mengambil email user
  Future<String?> getUserEmail() async {
    return await _storage.read(key: _keyUserEmail);
  }

  /// Menyimpan waktu expired token (dalam milliseconds since epoch)
  ///
  /// Ini digunakan untuk mengecek apakah token sudah expired tanpa
  /// perlu decode JWT setiap saat.
  Future<void> saveTokenExpiry(int expiryMillis) async {
    try {
      await _storage.write(
        key: _keyTokenExpiry,
        value: expiryMillis.toString(),
      );
    } catch (e) {
      throw Exception('Gagal menyimpan token expiry: $e');
    }
  }

  /// Mengambil waktu expired token
  Future<DateTime?> getTokenExpiry() async {
    try {
      final expiryStr = await _storage.read(key: _keyTokenExpiry);
      if (expiryStr != null) {
        return DateTime.fromMillisecondsSinceEpoch(int.parse(expiryStr));
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Mengecek apakah token sudah expired
  ///
  /// Returns true jika token expired atau tidak ada.
  Future<bool> isTokenExpired() async {
    final expiry = await getTokenExpiry();
    if (expiry == null) return true;
    return DateTime.now().isAfter(expiry);
  }

  /// Menghapus semua data autentikasi
  ///
  /// Fungsi ini dipanggil saat user logout atau saat token di-revoke.
  /// Pastikan SEMUA data sensitif dihapus, tidak hanya token.
  Future<void> clearAll() async {
    try {
      await Future.wait([
        _storage.delete(key: _keyAccessToken),
        _storage.delete(key: _keyRefreshToken),
        _storage.delete(key: _keyUserId),
        _storage.delete(key: _keyUserName),
        _storage.delete(key: _keyUserEmail),
        _storage.delete(key: _keyTokenExpiry),
      ]);
    } catch (e) {
      throw Exception('Gagal menghapus data autentikasi: $e');
    }
  }

  /// Mengecek apakah user sudah login (memiliki access token)
  Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
```

### Step 3: Membuat Auth Repository

Repository pattern memisahkan logika bisnis autentikasi dari UI. Repository bertanggung jawab untuk:

1. Berkomunikasi dengan API
2. Menyimpan/mengambil data dari secure storage
3. Menangani refresh token

**lib/repositories/auth_repository.dart**

```dart
import 'package:dio/dio.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import '../services/secure_storage_service.dart';

/// Model untuk response login dari API
class LoginResponse {
  final String accessToken;
  final String refreshToken;
  final String userId;
  final String name;
  final String email;
  final DateTime expiry;

  LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.userId,
    required this.name,
    required this.email,
    required this.expiry,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    // Decode JWT untuk mendapatkan expiry time
    final decoded = JwtDecoder.decode(json['access_token']);
    final exp = decoded['exp'] as int;

    return LoginResponse(
      accessToken: json['access_token'],
      refreshToken: json['refresh_token'],
      userId: decoded['sub'] ?? json['user_id'] ?? '',
      name: decoded['name'] ?? json['name'] ?? '',
      email: decoded['email'] ?? json['email'] ?? '',
      expiry: DateTime.fromMillisecondsSinceEpoch(exp * 1000),
    );
  }
}

/// Repository untuk menangani semua operasi autentikasi
///
/// Repository ini mengabstraksikan:
/// - HTTP calls ke API autentikasi
/// - Penyimpanan token yang aman
/// - Refresh token otomatis
/// - Pengecekan status login
class AuthRepository {
  final Dio _dio;
  final SecureStorageService _secureStorage;

  // Base URL API (ganti dengan URL backend-mu)
  static const String _baseUrl = 'https://api.yourpos.com';
  static const String _loginEndpoint = '/api/auth/login';
  static const String _refreshEndpoint = '/api/auth/refresh';
  static const String _logoutEndpoint = '/api/auth/logout';

  AuthRepository({
    Dio? dio,
    SecureStorageService? secureStorage,
  })  : _dio = dio ?? Dio(BaseOptions(
          baseUrl: _baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        )),
        _secureStorage = secureStorage ?? SecureStorageService();

  /// Login dengan email dan password
  ///
  /// Flow:
  /// 1. Kirim credentials ke API
  /// 2. Jika sukses, simpan token ke secure storage
  /// 3. Return data user
  ///
  /// Throws Exception jika login gagal.
  Future<LoginResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        _loginEndpoint,
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final loginData = LoginResponse.fromJson(response.data);

        // Simpan token ke secure storage
        await _saveAuthData(loginData);

        return loginData;
      } else {
        throw Exception('Login gagal: ${response.statusMessage}');
      }
    } on DioException catch (e) {
      // Handle specific HTTP errors
      if (e.response?.statusCode == 401) {
        throw Exception('Email atau password salah');
      } else if (e.response?.statusCode == 403) {
        throw Exception('Akun tidak aktif');
      } else if (e.type == DioExceptionType.connectionTimeout) {
        throw Exception('Koneksi timeout. Periksa internet kamu.');
      } else {
        throw Exception('Terjadi kesalahan: ${e.message}');
      }
    } catch (e) {
      throw Exception('Login gagal: $e');
    }
  }

  /// Logout user
  ///
  /// Flow:
  /// 1. Kirim request logout ke API (untuk revoke token di server)
  /// 2. Hapus semua data dari secure storage
  ///
  /// Meskipun API call gagal, data lokal tetap dihapus untuk keamanan.
  Future<void> logout() async {
    try {
      // Coba revoke token di server (best effort)
      final token = await _secureStorage.getAccessToken();
      if (token != null) {
        try {
          await _dio.post(
            _logoutEndpoint,
            options: Options(
              headers: {'Authorization': 'Bearer $token'},
            ),
          );
        } catch (e) {
          // Ignore error, tetap lanjut hapus data lokal
          print('Warning: Gagal revoke token di server: $e');
        }
      }
    } finally {
      // SELALU hapus data lokal, meskipun API call gagal
      await _secureStorage.clearAll();
    }
  }

  /// Refresh access token menggunakan refresh token
  ///
  /// Flow:
  /// 1. Ambil refresh token dari storage
  /// 2. Kirim ke API refresh endpoint
  /// 3. Simpan token baru
  ///
  /// Returns true jika refresh berhasil, false jika gagal.
  Future<bool> refreshToken() async {
    try {
      final refreshToken = await _secureStorage.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await _dio.post(
        _refreshEndpoint,
        data: {'refresh_token': refreshToken},
      );

      if (response.statusCode == 200) {
        final loginData = LoginResponse.fromJson(response.data);
        await _saveAuthData(loginData);
        return true;
      }
      return false;
    } catch (e) {
      print('Token refresh failed: $e');
      // Jika refresh gagal, logout user
      await logout();
      return false;
    }
  }

  /// Mendapatkan access token yang valid
  ///
  /// Jika token sudah expired, otomatis refresh.
  /// Returns null jika tidak ada token atau refresh gagal.
  Future<String?> getValidAccessToken() async {
    if (await _secureStorage.isTokenExpired()) {
      final refreshed = await refreshToken();
      if (!refreshed) return null;
    }
    return await _secureStorage.getAccessToken();
  }

  /// Mengecek apakah user sudah login
  Future<bool> isLoggedIn() async {
    return await _secureStorage.isLoggedIn();
  }

  /// Mendapatkan info user yang sedang login
  Future<Map<String, String?>> getCurrentUser() async {
    return {
      'id': await _secureStorage.getUserId(),
      'name': await _secureStorage.getUserName(),
      'email': await _secureStorage.getUserEmail(),
    };
  }

  /// Helper method untuk menyimpan data autentikasi
  Future<void> _saveAuthData(LoginResponse data) async {
    await Future.wait([
      _secureStorage.saveAccessToken(data.accessToken),
      _secureStorage.saveRefreshToken(data.refreshToken),
      _secureStorage.saveUserInfo(
        userId: data.userId,
        name: data.name,
        email: data.email,
      ),
      _secureStorage.saveTokenExpiry(data.expiry.millisecondsSinceEpoch),
    ]);
  }
}
```

### Step 4: Membuat Dio Interceptor untuk Token

Interceptor adalah middleware yang menangani setiap request dan response HTTP. Kita akan membuat interceptor yang:

1. Menambahkan Authorization header ke setiap request
2. Menangani 401 Unauthorized dengan refresh token otomatis
3. Retry request yang gagal karena token expired

**lib/services/api_interceptor.dart**

```dart
import 'package:dio/dio.dart';
import '../repositories/auth_repository.dart';

/// Dio interceptor untuk menangani autentikasi
///
/// Interceptor ini akan:
/// 1. Menambahkan access token ke setiap request
/// 2. Menangani 401 error dengan refresh token
/// 3. Retry request yang gagal setelah refresh
class AuthInterceptor extends Interceptor {
  final AuthRepository _authRepository;
  final Dio _dio;

  // Flag untuk mencegah multiple refresh secara bersamaan
  bool _isRefreshing = false;

  // Queue untuk request yang menunggu refresh token
  final List<RequestOptions> _pendingRequests = [];

  AuthInterceptor({
    required AuthRepository authRepository,
    required Dio dio,
  })  : _authRepository = authRepository,
        _dio = dio;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip jika endpoint tidak memerlukan autentikasi
    if (_isPublicEndpoint(options.path)) {
      return handler.next(options);
    }

    // Ambil token yang valid (refresh otomatis jika expired)
    final token = await _authRepository.getValidAccessToken();

    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    return handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // Handle 401 Unauthorized
    if (err.response?.statusCode == 401) {
      final requestOptions = err.requestOptions;

      // Cek apakah ini adalah retry setelah refresh
      if (requestOptions.headers['X-Retry-After-Refresh'] == 'true') {
        // Sudah retry tapi masih 401, berarti refresh token juga invalid
        await _authRepository.logout();
        return handler.reject(err);
      }

      // Jika sedang refresh, queue request ini
      if (_isRefreshing) {
        _pendingRequests.add(requestOptions);
        return;
      }

      // Lakukan refresh token
      _isRefreshing = true;
      final refreshed = await _authRepository.refreshToken();
      _isRefreshing = false;

      if (refreshed) {
        // Retry request yang gagal
        final newToken = await _authRepository.getValidAccessToken();
        requestOptions.headers['Authorization'] = 'Bearer $newToken';
        requestOptions.headers['X-Retry-After-Refresh'] = 'true';

        try {
          final response = await _dio.fetch(requestOptions);
          return handler.resolve(response);
        } catch (e) {
          return handler.reject(e as DioException);
        }
      } else {
        // Refresh gagal, logout user
        await _authRepository.logout();
        return handler.reject(err);
      }
    }

    return handler.next(err);
  }

  /// Cek apakah endpoint tidak memerlukan autentikasi
  bool _isPublicEndpoint(String path) {
    final publicEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/products', // Asumsikan daftar produk bisa diakses publik
    ];
    return publicEndpoints.any((endpoint) => path.contains(endpoint));
  }
}
```

### Step 5: Membuat Auth Provider untuk State Management

Provider ini akan mengelola state autentikasi dan memberi tahu UI ketika status login berubah.

**lib/providers/auth_provider.dart**

```dart
import 'package:flutter/foundation.dart';
import '../repositories/auth_repository.dart';

/// State untuk merepresentasikan status autentikasi
enum AuthStatus {
  initial,      // Status awal, belum dicek
  loading,      // Sedang proses login/logout
  authenticated,// Sudah login
  unauthenticated,// Belum login atau sudah logout
  error,        // Terjadi error
}

class AuthProvider with ChangeNotifier {
  final AuthRepository _authRepository;

  AuthStatus _status = AuthStatus.initial;
  String? _errorMessage;
  Map<String, String?> _userData = {};

  AuthProvider({AuthRepository? authRepository})
      : _authRepository = authRepository ?? AuthRepository();

  // Getters
  AuthStatus get status => _status;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get isLoading => _status == AuthStatus.loading;
  String? get userName => _userData['name'];
  String? get userEmail => _userData['email'];

  /// Inisialisasi: cek apakah user sudah login saat app startup
  Future<void> initialize() async {
    _status = AuthStatus.loading;
    notifyListeners();

    try {
      final isLoggedIn = await _authRepository.isLoggedIn();
      if (isLoggedIn) {
        _userData = await _authRepository.getCurrentUser();
        _status = AuthStatus.authenticated;
      } else {
        _status = AuthStatus.unauthenticated;
      }
    } catch (e) {
      _status = AuthStatus.error;
      _errorMessage = 'Gagal memeriksa status login: $e';
    }

    notifyListeners();
  }

  /// Login dengan email dan password
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _authRepository.login(
        email: email,
        password: password,
      );

      _userData = {
        'id': response.userId,
        'name': response.name,
        'email': response.email,
      };
      _status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } catch (e) {
      _status = AuthStatus.error;
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  /// Logout user
  Future<void> logout() async {
    _status = AuthStatus.loading;
    notifyListeners();

    try {
      await _authRepository.logout();
      _userData = {};
      _status = AuthStatus.unauthenticated;
    } catch (e) {
      _errorMessage = 'Gagal logout: $e';
    }

    notifyListeners();
  }

  /// Clear error message
  void clearError() {
    _errorMessage = null;
    if (_status == AuthStatus.error) {
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }
}
```

### Step 6: Membuat UI Login

**lib/screens/login_screen.dart**

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    final success = await authProvider.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo/Icon
                  Icon(
                    Icons.point_of_sale,
                    size: 80,
                    color: Colors.blue.shade700,
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Text(
                    'Mini POS',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue.shade700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Silakan login untuk melanjutkan',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Error Message
                  Consumer<AuthProvider>(
                    builder: (context, auth, child) {
                      if (auth.errorMessage != null) {
                        return Container(
                          padding: const EdgeInsets.all(12),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.red.shade200),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.error_outline, color: Colors.red.shade700),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  auth.errorMessage!,
                                  style: TextStyle(color: Colors.red.shade700),
                                ),
                              ),
                            ],
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),

                  // Email Field
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: 'Email',
                      hintText: 'kasir@tokoku.com',
                      prefixIcon: const Icon(Icons.email_outlined),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Email tidak boleh kosong';
                      }
                      if (!value.contains('@')) {
                        return 'Format email tidak valid';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Password Field
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      hintText: 'Masukkan password',
                      prefixIcon: const Icon(Icons.lock_outlined),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Password tidak boleh kosong';
                      }
                      if (value.length < 6) {
                        return 'Password minimal 6 karakter';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),

                  // Login Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: Consumer<AuthProvider>(
                      builder: (context, auth, child) {
                        return ElevatedButton(
                          onPressed: auth.isLoading ? null : _login,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue.shade700,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: auth.isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.white,
                                    ),
                                  ),
                                )
                              : const Text(
                                  'LOGIN',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Demo credentials info
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'Demo Credentials:',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey.shade700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Email: kasir@demo.com',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        Text(
                          'Password: password123',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
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

### Step 7: Update Home Screen dengan Fitur Logout

**lib/screens/home_screen.dart** (Update dari Part 1)

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../widgets/product_card.dart';
import 'cart_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  List<Product> get dummyProducts {
    return [
      Product(
        id: '1',
        name: 'Nasi Goreng Spesial',
        description: 'Nasi goreng dengan ayam, telur, dan sayuran segar',
        price: 25000,
        category: 'Makanan',
        stock: 20,
      ),
      Product(
        id: '2',
        name: 'Mie Ayam Bakso',
        description: 'Mie ayam dengan bakso sapi homemade',
        price: 22000,
        category: 'Makanan',
        stock: 15,
      ),
      Product(
        id: '3',
        name: 'Es Teh Manis',
        description: 'Teh manis dingin yang menyegarkan',
        price: 5000,
        category: 'Minuman',
        stock: 50,
      ),
      Product(
        id: '4',
        name: 'Kopi Hitam',
        description: 'Kopi robusta pilihan dengan aroma khas',
        price: 8000,
        category: 'Minuman',
        stock: 30,
      ),
      Product(
        id: '5',
        name: 'Ayam Goreng Crispy',
        description: 'Ayam goreng tepung crispy dengan sambal',
        price: 18000,
        category: 'Makanan',
        stock: 12,
      ),
      Product(
        id: '6',
        name: 'Puding Coklat',
        description: 'Puding coklat lembut dengan vla vanila',
        price: 12000,
        category: 'Dessert',
        stock: 10,
      ),
    ];
  }

  Future<void> _showLogoutDialog(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Konfirmasi Logout'),
        content: const Text('Apakah kamu yakin ingin keluar dari aplikasi?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await authProvider.logout();

      if (context.mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mini POS'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          // User info
          Consumer<AuthProvider>(
            builder: (context, auth, child) {
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Row(
                  children: [
                    Icon(Icons.person_outline, size: 20),
                    const SizedBox(width: 4),
                    Text(
                      auth.userName ?? 'Kasir',
                      style: const TextStyle(fontSize: 14),
                    ),
                  ],
                ),
              );
            },
          ),

          // Cart icon with badge
          Consumer<CartProvider>(
            builder: (context, cart, child) {
              return Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.shopping_cart),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const CartScreen(),
                        ),
                      );
                    },
                  ),
                  if (cart.itemCount > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          '${cart.itemCount}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
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

          // Logout button
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _showLogoutDialog(context),
            tooltip: 'Logout',
          ),
        ],
      ),
      body: Column(
        children: [
          // Welcome banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: Colors.blue.shade50,
            child: Consumer<AuthProvider>(
              builder: (context, auth, child) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Selamat datang, ${auth.userName ?? 'Kasir'}!',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Siap melayani pelanggan hari ini.',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

          // Products header
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(Icons.store, color: Colors.blue),
                const SizedBox(width: 8),
                Text(
                  'Daftar Produk',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade800,
                  ),
                ),
                const Spacer(),
                Text(
                  '${dummyProducts.length} item',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),

          // Products list
          Expanded(
            child: ListView.builder(
              itemCount: dummyProducts.length,
              itemBuilder: (context, index) {
                return ProductCard(product: dummyProducts[index]);
              },
            ),
          ),

          // Cart summary
          Consumer<CartProvider>(
            builder: (context, cart, child) {
              if (cart.isEmpty) return const SizedBox.shrink();

              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.grey.shade300,
                      blurRadius: 4,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
                child: SafeArea(
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '${cart.itemCount} item di keranjang',
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 12,
                              ),
                            ),
                            Text(
                              'Total: Rp ${cart.totalAmount.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.green,
                              ),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const CartScreen(),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                        ),
                        child: const Text('Lihat Keranjang'),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
```

### Step 8: Update Main.dart dengan Auth Provider

**lib/main.dart** (Final untuk Part 2)

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
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
      ],
      child: MaterialApp(
        title: 'Mini POS',
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

/// Widget untuk menentukan halaman awal berdasarkan status autentikasi
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
              Text('Memuat...'),
            ],
          ),
        ),
      );
    }

    return Consumer<AuthProvider>(
      builder: (context, auth, child) {
        if (auth.isAuthenticated) {
          return const HomeScreen();
        } else {
          return const LoginScreen();
        }
      },
    );
  }
}
```

## Penjelasan Alur Autentikasi

Mari kita bahas alur lengkap dari login sampai logout:

### 1. Alur Login

```
User input email & password
         |
         v
LoginScreen -> AuthProvider.login()
         |
         v
AuthRepository.login() -> API Call (/api/auth/login)
         |
         v
Response JWT (access_token + refresh_token)
         |
         v
SecureStorageService.saveAccessToken()
SecureStorageService.saveRefreshToken()
SecureStorageService.saveUserInfo()
         |
         v
AuthProvider update state -> UI rebuild
         |
         v
Navigate to HomeScreen
```

### 2. Alur Request API dengan Token

```
App membuat API call
         |
         v
Dio Interceptor -> onRequest()
         |
         v
AuthRepository.getValidAccessToken()
         |
         v
Cek expired? -> Ya -> Refresh token
         |              |
         |              v
         |      API Call (/api/auth/refresh)
         |              |
         |              v
         |      Simpan token baru
         |
         v
Tambahkan header: Authorization: Bearer <token>
         |
         v
Kirim request ke server
```

### 3. Alur Logout

```
User tap logout
         |
         v
Show confirmation dialog
         |
         v
AuthProvider.logout()
         |
         v
AuthRepository.logout()
         |
         v
API Call (/api/auth/logout) [optional]
         |
         v
SecureStorageService.clearAll()
         |
         v
AuthProvider update state -> UI rebuild
         |
         v
Navigate to LoginScreen
```

## Keamanan yang Sudah Diimplementasikan

### 1. Penyimpanan Token yang Aman

- Access token dan refresh token disimpan di flutter_secure_storage
- Data dienkripsi dengan AES-256 (Android) atau Keychain (iOS)
- Encryption key dikelola oleh OS, tidak bisa diakses aplikasi

### 2. Token Expiration Handling

- Token di-decode untuk mendapatkan waktu expired
- Expiry time disimpan terpisah untuk pengecekan cepat
- Auto-refresh token sebelum melakukan API call

### 3. Refresh Token Pattern

- Access token berumur pendek (15-60 menit)
- Refresh token berumur panjang (7-30 hari)
- Refresh token digunakan untuk mendapatkan access token baru tanpa login ulang

### 4. Logout Security

- Token di-revoke di server (jika API tersedia)
- Semua data dihapus dari secure storage
- Tidak ada jejak token tersisa di device

### 5. Error Handling

- Graceful degradation saat storage error
- Clear error message untuk debugging
- Auto-logout saat refresh token invalid

## Testing Aplikasi

Karena kita belum memiliki backend, kamu bisa menggunakan mock API atau mengubah `AuthRepository` untuk simulasi:

```dart
// Tambahkan method ini di AuthRepository untuk testing
Future<LoginResponse> loginMock({
  required String email,
  required String password,
}) async {
  // Simulasi delay network
  await Future.delayed(const Duration(seconds: 1));

  // Validasi dummy
  if (email == 'kasir@demo.com' && password == 'password123') {
    // Buat JWT dummy (dalam produksi, ini dari server)
    final mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikthc2lyIERlbW8iLCJlbWFpbCI6Imthc2lyQGRlbW8uY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.' +
        'signature';

    return LoginResponse(
      accessToken: mockJwt,
      refreshToken: 'mock_refresh_token',
      userId: '123',
      name: 'Kasir Demo',
      email: email,
      expiry: DateTime.now().add(const Duration(hours: 1)),
    );
  } else {
    throw Exception('Email atau password salah');
  }
}
```

## Checklist Keamanan

Sebelum deploy ke production, pastikan:

- [ ] Backend menggunakan HTTPS dengan sertifikat valid
- [ ] JWT menggunakan algoritma yang kuat (RS256 atau ES256, hindari HS256 untuk production)
- [ ] Access token expired dalam waktu singkat (15-60 menit)
- [ ] Refresh token bisa di-revoke dari server
- [ ] Password di-hash dengan bcrypt/Argon2 di server (bukan MD5 atau SHA1)
- [ ] Rate limiting diimplementasikan di endpoint login
- [ ] Input validation di server untuk mencegah injection
- [ ] Logging untuk mendeteksi aktivitas mencurigakan

## Kesimpulan Part 2

Di part ini kita telah mempelajari:

1. **Fundamental JWT**: Cara kerja, struktur, dan best practices
2. **Secure Storage**: Mengapa SharedPreferences tidak aman dan cara menggunakan flutter_secure_storage
3. **Repository Pattern**: Pemisahan logika autentikasi dari UI
4. **Token Management**: Implementasi access token, refresh token, dan auto-refresh
5. **Dio Interceptor**: Middleware untuk menangani autentikasi di setiap request

Aplikasi POS kita sekarang sudah memiliki:

- Login screen dengan validasi
- Penyimpanan token yang terenkripsi
- Auto-refresh token sebelum expired
- Logout yang menghapus semua data sensitif
- Protected routes (hanya bisa akses HomeScreen jika sudah login)

## Yang Akan Datang di Part 3

Di part berikutnya, kita akan menambahkan fitur offline-first menggunakan database lokal (SQLite/Isar). Kita akan belajar:

- Sinkronisasi data produk dari API ke database lokal
- Menyimpan transaksi sementara saat offline
- Sinkronisasi transaksi ke server saat online kembali

## Source Code Lengkap Part 2

Struktur folder akhir:

```
lib/
├── main.dart
├── models/
│   ├── product.dart
│   └── cart_item.dart
├── providers/
│   ├── auth_provider.dart
│   └── cart_provider.dart
├── repositories/
│   └── auth_repository.dart
├── screens/
│   ├── home_screen.dart
│   ├── cart_screen.dart
│   └── login_screen.dart
├── services/
│   ├── secure_storage_service.dart
│   └── api_interceptor.dart
└── widgets/
    └── product_card.dart
```

Semua kode di atas sudah siap di-copy dan di-run. Pastikan untuk mengganti `_baseUrl` di `AuthRepository` dengan URL backend-mu yang sebenarnya.

---

Sampai jumpa di Part 3. Jika ada pertanyaan atau ada bagian yang kurang jelas, jangan ragu untuk bertanya.

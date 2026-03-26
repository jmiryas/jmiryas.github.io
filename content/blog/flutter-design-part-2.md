---
title: "Flutter Basic Design - Part 2: Tipografi, Styling, dan Animasi Esensial"
date: "Mar 26, 2026"
description: "Part 2: Tipografi, Styling, dan Animasi Esensial"
---

Selamat datang kembali di Part 2 dari seri tutorial Flutter. Di Part 1, kita sudah membangun fondasi layout dengan Column, Row, Container, Expanded, dan Stack. Sekarang saatnya kita membuat UI tersebut terlihat lebih modern dan profesional dengan tipografi custom, tema warna yang clean, dan animasi esensial.

## Pendahuluan

Estetika dan interaksi adalah dua hal penting dalam desain aplikasi modern. Pengguna tidak hanya menghargai fungsionalitas, tetapi juga pengalaman visual yang menyenangkan. Dalam tutorial ini, kita akan belajar:

1. Cara mengintegrasikan font custom dari Google Fonts
2. Cara membuat tema warna yang clean dan konsisten
3. Cara mengimplementasikan animasi dasar seperti AnimatedContainer dan Hero animation

## Menambahkan Dependency Google Fonts

Pertama, kita perlu menambahkan package Google Fonts ke project kita. Buka file `pubspec.yaml` dan tambahkan dependency berikut:

```yaml
dependencies:
  flutter:
    sdk: flutter
  google_fonts: ^6.2.1
```

Setelah itu, jalankan perintah berikut di terminal untuk mengunduh package:

```bash
flutter pub get
```

Google Fonts akan secara otomatis mengunduh font yang kita gunakan saat aplikasi berjalan, jadi kita tidak perlu menambahkan file font ke project secara manual.

## Membuat Tema Warna yang Clean

Sebelum kita mulai mengubah kode, mari kita pahami konsep tema warna yang clean. Desain modern cenderung menggunakan:

- Warna primary yang soft dan tidak terlalu mencolok
- Warna surface yang clean (putih atau abu-abu sangat muda)
- Warna aksen yang digunakan secara minimalis
- Kontras yang cukup untuk readability

Kita akan membuat tema warna dengan palet berikut:

- Primary: Deep Indigo (indigo yang lebih soft dari purple)
- Surface: Pure White dengan sedikit shadow
- Aksen: Teal untuk elemen interaktif
- Text: Dark Grey untuk readability yang baik

Mari kita buat file tema terlebih dahulu:

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Warna utama aplikasi
  static const Color primaryColor = Color(0xFF4F46E5);
  static const Color primaryLight = Color(0xFF818CF8);
  static const Color primaryDark = Color(0xFF3730A3);

  // Warna surface dan background
  static const Color surfaceColor = Colors.white;
  static const Color backgroundColor = Color(0xFFF8FAFC);
  static const Color cardColor = Colors.white;

  // Warna teks
  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);

  // Warna aksen dan status
  static const Color accentColor = Color(0xFF14B8A6);
  static const Color successColor = Color(0xFF22C55E);
  static const Color warningColor = Color(0xFFF59E0B);
  static const Color errorColor = Color(0xFFEF4444);

  // Warna untuk stat card
  static const Color statBlue = Color(0xFF3B82F6);
  static const Color statGreen = Color(0xFF10B981);
  static const Color statOrange = Color(0xFFF97316);
  static const Color statPurple = Color(0xFF8B5CF6);

  // Method untuk mendapatkan tema light
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        secondary: accentColor,
        surface: surfaceColor,
        background: backgroundColor,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textPrimary,
        onBackground: textPrimary,
      ),
      scaffoldBackgroundColor: backgroundColor,
      textTheme: GoogleFonts.interTextTheme().copyWith(
        displayLarge: GoogleFonts.inter(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        displayMedium: GoogleFonts.inter(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        displaySmall: GoogleFonts.inter(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        headlineLarge: GoogleFonts.inter(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        headlineMedium: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        headlineSmall: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        titleLarge: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        titleMedium: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        titleSmall: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textSecondary,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          color: textPrimary,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: textPrimary,
        ),
        bodySmall: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: textSecondary,
        ),
        labelLarge: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textSecondary,
        ),
        labelMedium: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textMuted,
        ),
        labelSmall: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: textMuted,
        ),
      ),
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: surfaceColor,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        iconTheme: const IconThemeData(
          color: textPrimary,
        ),
      ),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        color: cardColor,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 14,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: backgroundColor,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: primaryColor,
            width: 1.5,
          ),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        hintStyle: GoogleFonts.inter(
          fontSize: 14,
          color: textMuted,
        ),
      ),
    );
  }
}
```

## Memahami AnimatedContainer

AnimatedContainer adalah widget yang memungkinkan kita membuat animasi transisi secara otomatis ketika properties-nya berubah. Berbeda dengan Container biasa, AnimatedContainer akan menganimasikan perubahan ukuran, warna, border radius, dan properties lainnya.

**Keuntungan menggunakan AnimatedContainer:**

- Tidak perlu menggunakan AnimationController
- Animasi berjalan secara otomatis saat state berubah
- Sangat mudah diimplementasikan
- Performa yang baik

Mari kita lihat contoh implementasi AnimatedContainer:

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Animasi Esensial Flutter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        textTheme: GoogleFonts.interTextTheme(),
      ),
      home: const AnimatedContainerExample(),
    );
  }
}

class AnimatedContainerExample extends StatefulWidget {
  const AnimatedContainerExample({super.key});

  @override
  State<AnimatedContainerExample> createState() =>
      _AnimatedContainerExampleState();
}

class _AnimatedContainerExampleState extends State<AnimatedContainerExample> {
  bool isExpanded = false;
  bool isFavorite = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AnimatedContainer Demo'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Contoh 1: Card yang bisa expand
            GestureDetector(
              onTap: () {
                setState(() {
                  isExpanded = !isExpanded;
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 400),
                curve: Curves.easeInOutCubic,
                width: double.infinity,
                height: isExpanded ? 250 : 120,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: isExpanded
                        ? [const Color(0xFF4F46E5), const Color(0xFF7C3AED)]
                        : [const Color(0xFF4F46E5), const Color(0xFF6366F1)],
                  ),
                  borderRadius: BorderRadius.circular(isExpanded ? 24 : 16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF4F46E5).withOpacity(isExpanded ? 0.4 : 0.2),
                      blurRadius: isExpanded ? 20 : 10,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Premium',
                            style: GoogleFonts.inter(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        AnimatedRotation(
                          turns: isExpanded ? 0.5 : 0,
                          duration: const Duration(milliseconds: 400),
                          child: const Icon(
                            Icons.keyboard_arrow_down,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Total Balance',
                      style: GoogleFonts.inter(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Rp 12.580.000',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (isExpanded) ...[
                      const SizedBox(height: 20),
                      const Divider(color: Colors.white24),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildExpandedItem('Income', 'Rp 8.5M', Icons.arrow_upward),
                          _buildExpandedItem('Expense', 'Rp 4.1M', Icons.arrow_downward),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 30),
            // Contoh 2: Favorite button dengan animasi
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                GestureDetector(
                  onTap: () {
                    setState(() {
                      isFavorite = !isFavorite;
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.elasticOut,
                    width: isFavorite ? 80 : 60,
                    height: isFavorite ? 80 : 60,
                    decoration: BoxDecoration(
                      color: isFavorite ? Colors.red : Colors.grey[200],
                      shape: BoxShape.circle,
                      boxShadow: isFavorite
                          ? [
                              BoxShadow(
                                color: Colors.red.withOpacity(0.4),
                                blurRadius: 20,
                                spreadRadius: 5,
                              ),
                            ]
                          : [],
                    ),
                    child: Icon(
                      isFavorite ? Icons.favorite : Icons.favorite_border,
                      color: isFavorite ? Colors.white : Colors.grey,
                      size: isFavorite ? 40 : 28,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              'Tap the heart!',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExpandedItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(
          icon,
          color: Colors.white70,
          size: 20,
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.inter(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: GoogleFonts.inter(
            color: Colors.white70,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
```

**Penjelasan AnimatedContainer:**

1. `duration`: Menentukan berapa lama animasi berlangsung (400ms)
2. `curve`: Menentukan gaya animasi (easeInOutCubic untuk animasi yang smooth)
3. Properties yang berubah secara otomatis dianimasi:
   - `height`: Dari 120 ke 250
   - `borderRadius`: Dari 16 ke 24
   - `boxShadow`: Intensitas shadow meningkat
   - `colors`: Gradient berubah saat expand

## Memahami Hero Animation

Hero animation adalah animasi transisi yang membuat suatu elemen terlihat seperti "terbang" dari satu layar ke layar lain. Hero animation sangat umum digunakan untuk transisi gambar, card, atau elemen lain yang memiliki korelasi visual antara dua layar.

**Cara kerja Hero animation:**

1. Bungkus widget di layar pertama dengan widget Hero
2. Bungkus widget yang sama di layar kedua dengan widget Hero
3. Pastikan kedua Hero memiliki tag yang sama
4. Flutter akan otomatis menganimasikan transisinya

Mari kita lihat contoh implementasi Hero animation:

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hero Animation Flutter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        textTheme: GoogleFonts.interTextTheme(),
      ),
      home: const HeroListScreen(),
    );
  }
}

// Model data untuk item
class Product {
  final String id;
  final String name;
  final String price;
  final String imageUrl;
  final String description;
  final Color color;

  Product({
    required this.id,
    required this.name,
    required this.price,
    required this.imageUrl,
    required this.description,
    required this.color,
  });
}

// Data dummy
final List<Product> products = [
  Product(
    id: '1',
    name: 'Wireless Headphone',
    price: 'Rp 899.000',
    imageUrl: 'https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=Headphone',
    description: 'Premium wireless headphone dengan noise cancellation aktif dan battery life hingga 30 jam.',
    color: const Color(0xFF4F46E5),
  ),
  Product(
    id: '2',
    name: 'Smart Watch Pro',
    price: 'Rp 1.299.000',
    imageUrl: 'https://via.placeholder.com/400x400/14B8A6/FFFFFF?text=Watch',
    description: 'Smartwatch dengan fitur health monitoring lengkap dan water resistant.',
    color: const Color(0xFF14B8A6),
  ),
  Product(
    id: '3',
    name: 'Portable Speaker',
    price: 'Rp 599.000',
    imageUrl: 'https://via.placeholder.com/400x400/F59E0B/FFFFFF?text=Speaker',
    description: 'Speaker portable dengan suara bass yang powerful dan desain yang compact.',
    color: const Color(0xFFF59E0B),
  ),
];

// Layar pertama: List produk
class HeroListScreen extends StatelessWidget {
  const HeroListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Produk Kami',
          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView.builder(
          itemCount: products.length,
          itemBuilder: (context, index) {
            final product = products[index];
            return GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => HeroDetailScreen(product: product),
                  ),
                );
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Hero widget untuk gambar
                    Hero(
                      tag: 'product-image-${product.id}',
                      child: Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: product.color.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            color: product.color,
                            child: Center(
                              child: Icon(
                                Icons.image,
                                color: Colors.white.withOpacity(0.5),
                                size: 40,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Hero widget untuk nama produk
                          Hero(
                            tag: 'product-name-${product.id}',
                            child: Material(
                              color: Colors.transparent,
                              child: Text(
                                product.name,
                                style: GoogleFonts.inter(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF1E293B),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            product.description,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Hero(
                            tag: 'product-price-${product.id}',
                            child: Material(
                              color: Colors.transparent,
                              child: Text(
                                product.price,
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: product.color,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.arrow_forward_ios,
                      color: Color(0xFF94A3B8),
                      size: 16,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

// Layar kedua: Detail produk
class HeroDetailScreen extends StatelessWidget {
  final Product product;

  const HeroDetailScreen({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 400,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Hero(
                tag: 'product-image-${product.id}',
                child: Container(
                  color: product.color,
                  child: Center(
                    child: Icon(
                      Icons.image,
                      color: Colors.white.withOpacity(0.3),
                      size: 100,
                    ),
                  ),
                ),
              ),
            ),
            leading: IconButton(
              onPressed: () => Navigator.pop(context),
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back, size: 20),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Hero(
                    tag: 'product-name-${product.id}',
                    child: Material(
                      color: Colors.transparent,
                      child: Text(
                        product.name,
                        style: GoogleFonts.inter(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Hero(
                    tag: 'product-price-${product.id}',
                    child: Material(
                      color: Colors.transparent,
                      child: Text(
                        product.price,
                        style: GoogleFonts.inter(
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          color: product.color,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Deskripsi Produk',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    product.description,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      color: const Color(0xFF64748B),
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: product.color,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Tambah ke Keranjang',
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

**Penjelasan Hero Animation:**

1. **Tag yang sama**: Setiap Hero widget harus memiliki tag yang unik dan sama di kedua layar
2. **Tag unik per item**: Kita menggunakan `product-image-${product.id}` agar setiap produk memiliki animasi yang terpisah
3. **Material widget**: Dibungkus dengan Material untuk menghindari masalah rendering saat transisi
4. **Otomatis**: Flutter menangani semua perhitungan animasi secara otomatis

## Mengaplikasikan Styling pada Kerangka UI Part 1

Sekarang kita akan menggabungkan semua ilmu yang sudah dipelajari dan mengaplikasikannya pada kerangka UI yang kita buat di Part 1. Kita akan menambahkan:

1. Tema warna yang clean
2. Font Inter dari Google Fonts
3. AnimatedContainer untuk interaksi
4. Shadow dan efek visual modern

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Modern UI Flutter',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const ModernDashboard(),
    );
  }
}

// Theme configuration
class AppTheme {
  static const Color primaryColor = Color(0xFF4F46E5);
  static const Color primaryLight = Color(0xFF818CF8);
  static const Color primaryDark = Color(0xFF3730A3);
  static const Color surfaceColor = Colors.white;
  static const Color backgroundColor = Color(0xFFF8FAFC);
  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color accentColor = Color(0xFF14B8A6);
  static const Color statBlue = Color(0xFF3B82F6);
  static const Color statGreen = Color(0xFF10B981);
  static const Color statOrange = Color(0xFFF97316);
  static const Color statPurple = Color(0xFF8B5CF6);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        secondary: accentColor,
        surface: surfaceColor,
        background: backgroundColor,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textPrimary,
        onBackground: textPrimary,
      ),
      scaffoldBackgroundColor: backgroundColor,
      textTheme: GoogleFonts.interTextTheme(),
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: surfaceColor,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        iconTheme: const IconThemeData(color: textPrimary),
      ),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        color: cardColor,
      ),
    );
  }
}

class ModernDashboard extends StatefulWidget {
  const ModernDashboard({super.key});

  @override
  State<ModernDashboard> createState() => _ModernDashboardState();
}

class _ModernDashboardState extends State<ModernDashboard> {
  int selectedMenuIndex = 0;
  bool isSearchFocused = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Header Section dengan styling modern
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(32),
                  bottomRight: Radius.circular(32),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Selamat Datang,',
                            style: GoogleFonts.inter(
                              color: Colors.white.withOpacity(0.8),
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Pengguna Flutter',
                            style: GoogleFonts.inter(
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
                          border: Border.all(
                            color: Colors.white.withOpacity(0.3),
                            width: 2,
                          ),
                        ),
                        child: const Icon(
                          Icons.person,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Search bar dengan animasi
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        isSearchFocused = !isSearchFocused;
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(isSearchFocused ? 0.25 : 0.15),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSearchFocused
                              ? Colors.white.withOpacity(0.5)
                              : Colors.transparent,
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.search,
                            color: Colors.white.withOpacity(0.7),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Cari sesuatu...',
                              style: GoogleFonts.inter(
                                color: Colors.white.withOpacity(0.7),
                                fontSize: 15,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(10),
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
                  ),
                ],
              ),
            ),
            // Stats Section dengan card modern
            Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      icon: Icons.shopping_bag_outlined,
                      title: 'Total Order',
                      value: '1,234',
                      color: AppTheme.statBlue,
                      index: 0,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildStatCard(
                      icon: Icons.account_balance_wallet_outlined,
                      title: 'Pendapatan',
                      value: 'Rp 12M',
                      color: AppTheme.statGreen,
                      index: 1,
                    ),
                  ),
                ],
              ),
            ),
            // Content Section
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Menu Utama',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: 1.1,
                        children: [
                          _buildMenuCard(
                            icon: Icons.dashboard_outlined,
                            title: 'Dashboard',
                            subtitle: 'Ringkasan data',
                            color: AppTheme.primaryColor,
                            index: 0,
                          ),
                          _buildMenuCard(
                            icon: Icons.analytics_outlined,
                            title: 'Analitik',
                            subtitle: 'Laporan detail',
                            color: AppTheme.statOrange,
                            index: 1,
                          ),
                          _buildMenuCard(
                            icon: Icons.people_outline,
                            title: 'Pelanggan',
                            subtitle: 'Data pelanggan',
                            color: AppTheme.statGreen,
                            index: 2,
                          ),
                          _buildMenuCard(
                            icon: Icons.settings_outlined,
                            title: 'Pengaturan',
                            subtitle: 'Konfigurasi',
                            color: AppTheme.statPurple,
                            index: 3,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Bottom Navigation modern
            Container(
              margin: const EdgeInsets.all(24),
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildNavItem(
                    icon: Icons.home_rounded,
                    label: 'Beranda',
                    isActive: true,
                  ),
                  _buildNavItem(
                    icon: Icons.explore_outlined,
                    label: 'Jelajah',
                    isActive: false,
                  ),
                  _buildNavItem(
                    icon: Icons.favorite_outline,
                    label: 'Favorit',
                    isActive: false,
                  ),
                  _buildNavItem(
                    icon: Icons.person_outline,
                    label: 'Profil',
                    isActive: false,
                  ),
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
    required int index,
  }) {
    return StatefulBuilder(
      builder: (context, setState) {
        bool isPressed = false;
        return GestureDetector(
          onTapDown: (_) => setState(() => isPressed = true),
          onTapUp: (_) => setState(() => isPressed = false),
          onTapCancel: () => setState(() => isPressed = false),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            curve: Curves.easeInOut,
            transform: Matrix4.identity()..scale(isPressed ? 0.95 : 1.0),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.15),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    icon,
                    color: color,
                    size: 24,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMenuCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required int index,
  }) {
    return StatefulBuilder(
      builder: (context, setState) {
        bool isPressed = false;
        return GestureDetector(
          onTapDown: (_) => setState(() => isPressed = true),
          onTapUp: (_) => setState(() => isPressed = false),
          onTapCancel: () => setState(() => isPressed = false),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
            transform: Matrix4.identity()..scale(isPressed ? 0.96 : 1.0),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: isPressed
                      ? color.withOpacity(0.3)
                      : Colors.black.withOpacity(0.05),
                  blurRadius: isPressed ? 15 : 10,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      icon,
                      color: color,
                      size: 28,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required bool isActive,
  }) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isActive ? AppTheme.primaryColor.withOpacity(0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: isActive ? AppTheme.primaryColor : AppTheme.textMuted,
            size: 24,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.inter(
              color: isActive ? AppTheme.primaryColor : AppTheme.textMuted,
              fontSize: 11,
              fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
```

## Penjelasan Perubahan dari Part 1

Mari kita bedah apa saja yang berubah dan ditambahkan:

### 1. Tema Warna yang Clean

- Menggunakan palet warna yang lebih soft dan modern
- Primary color menggunakan indigo (#4F46E5) yang lebih profesional
- Background menggunakan abu-abu sangat muda (#F8FAFC) untuk kesan clean
- Semua warna didefinisikan di AppTheme untuk konsistensi

### 2. Tipografi dengan Google Fonts

- Menggunakan font Inter yang modern dan highly readable
- Semua teks menggunakan GoogleFonts.inter() untuk konsistensi
- Hierarki tipografi yang jelas dengan font weight yang bervariasi

### 3. Animasi Esensial

- **AnimatedContainer** pada search bar: Berubah opacity dan border saat focused
- **AnimatedContainer** pada stat card: Efek scale saat ditekan
- **AnimatedContainer** pada menu card: Efek scale dan shadow saat ditekan
- **AnimatedContainer** pada nav item: Background berubah saat active

### 4. Shadow dan Efek Visual

- Shadow yang lebih soft dengan opacity rendah
- Shadow berwarna sesuai dengan tema (primary color untuk bottom nav)
- Border radius yang konsisten (16-20 untuk card, 24-32 untuk container besar)

### 5. Icon yang Lebih Modern

- Menggunakan outlined icons untuk kesan yang lebih light
- Menggunakan rounded icons untuk navigasi
- Ukuran icon yang proporsional

## Kesimpulan Part 2

Dalam tutorial ini, kita telah mempelajari:

1. **Google Fonts**: Cara mengintegrasikan font custom dengan package google_fonts
2. **Tema Warna Clean**: Cara membuat palet warna yang modern dan konsisten
3. **AnimatedContainer**: Animasi sederhana tanpa AnimationController
4. **Hero Animation**: Transisi antar layar yang smooth dan profesional
5. **Efek Visual Modern**: Shadow, border radius, dan micro-interactions

Kerangka UI kita sekarang terlihat jauh lebih modern dan profesional. Di Part 3, kita akan membuat UI ini responsif dan membuat aplikasi Mini POS yang fungsional secara utuh.

**Latihan untuk kamu:**

- Coba ganti font dari Inter menjadi Poppins atau font lain yang kamu suka
- Tambahkan Hero animation saat menu card ditekan
- Buat animasi lain menggunakan AnimatedOpacity atau AnimatedPositioned

Sampai jumpa di Part 3, di mana kita akan membuat aplikasi Mini POS yang responsif dan siap digunakan.

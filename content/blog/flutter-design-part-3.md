---
title: "Flutter Basic Design - Part 3: Responsivitas dan Final Slicing Project"
date: "Mar 26, 2026"
description: "Part 3: Responsivitas dan Final Slicing Project"
---

Selamat datang di Part 3, bagian terakhir dari seri tutorial Flutter ini. Di Part 1 kita membangun fondasi layout, dan di Part 2 kita menambahkan tipografi, styling, dan animasi. Sekarang saatnya kita membuat UI yang responsif dan membangun aplikasi Mini Point-of-Sale (POS) yang fungsional secara utuh.

## Pendahuluan

Responsivitas adalah kemampuan aplikasi untuk menyesuaikan tampilannya dengan baik di berbagai ukuran layar, dari ponsel kecil hingga tablet besar. Flutter menyediakan beberapa tools untuk membantu kita mencapai ini, dan yang paling umum digunakan adalah MediaQuery dan LayoutBuilder.

Di bagian kedua dari tutorial ini, kita akan menggabungkan semua ilmu dari Part 1 dan Part 2 untuk membuat aplikasi Mini POS yang lengkap dengan fitur:

- Dashboard dengan statistik penjualan
- Daftar produk dengan kategori
- Keranjang belanja
- Riwayat transaksi

## Memahami Responsivitas di Flutter

### MediaQuery

MediaQuery adalah cara paling sederhana untuk mendapatkan informasi tentang ukuran layar dan karakteristik device. Dengan MediaQuery, kita bisa mendapatkan:

- Ukuran layar (width dan height)
- Orientasi (portrait atau landscape)
- Padding yang aman (safe area)
- Ukuran teks yang disukai user

### LayoutBuilder

LayoutBuilder memberikan kita constraints yang tersedia untuk widget, bukan ukuran layar penuh. Ini sangat berguna ketika kita ingin widget menyesuaikan diri dengan ruang yang tersedia, bukan ukuran layar keseluruhan.

Mari kita lihat contoh implementasi responsivitas:

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
      title: 'Responsivitas Flutter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        textTheme: GoogleFonts.interTextTheme(),
      ),
      home: const ResponsivenessExample(),
    );
  }
}

class ResponsivenessExample extends StatelessWidget {
  const ResponsivenessExample({super.key});

  @override
  Widget build(BuildContext context) {
    // Mendapatkan ukuran layar dengan MediaQuery
    final screenSize = MediaQuery.of(context).size;
    final screenWidth = screenSize.width;
    final screenHeight = screenSize.height;
    final orientation = MediaQuery.of(context).orientation;

    // Menentukan breakpoint
    final isMobile = screenWidth < 600;
    final isTablet = screenWidth >= 600 && screenWidth < 1200;
    final isDesktop = screenWidth >= 1200;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Contoh Responsivitas'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Informasi layar dari MediaQuery
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Informasi Layar (MediaQuery)',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text('Lebar: ${screenWidth.toStringAsFixed(1)} px'),
                  Text('Tinggi: ${screenHeight.toStringAsFixed(1)} px'),
                  Text('Orientasi: ${orientation == Orientation.portrait ? "Portrait" : "Landscape"}'),
                  Text('Device: ${isMobile ? "Mobile" : isTablet ? "Tablet" : "Desktop"}'),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Contoh LayoutBuilder
            LayoutBuilder(
              builder: (context, constraints) {
                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Informasi Constraints (LayoutBuilder)',
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text('Max Width: ${constraints.maxWidth.toStringAsFixed(1)}'),
                      Text('Max Height: ${constraints.maxHeight.toStringAsFixed(1)}'),
                      const SizedBox(height: 12),
                      // Widget yang menyesuaikan dengan constraints
                      Container(
                        width: constraints.maxWidth * 0.5,
                        height: 50,
                        decoration: BoxDecoration(
                          color: Colors.green,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          '50% dari Max Width',
                          style: TextStyle(color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 20),
            // Contoh Grid yang responsif
            Text(
              'Grid Responsif',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: isMobile ? 2 : isTablet ? 3 : 4,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              children: List.generate(
                8,
                (index) => Container(
                  decoration: BoxDecoration(
                    color: Colors.deepPurple.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    'Item ${index + 1}',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                    ),
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

## Responsive Widgets yang Sering Digunakan

Selain MediaQuery dan LayoutBuilder, ada beberapa widget bawaan Flutter yang sudah responsif:

### 1. Wrap

Wrap menyusun widget secara horizontal dan otomatis pindah ke baris baru jika ruang tidak cukup.

### 2. FittedBox

FittedBox menyesuaikan ukuran child-nya agar pas di dalam ruang yang tersedia.

### 3. AspectRatio

AspectRatio memastikan widget memiliki rasio aspek tertentu.

### 4. FractionallySizedBox

FractionallySizedBox menentukan ukuran widget sebagai fraksi dari ruang yang tersedia.

Mari kita lihat contoh penggunaannya:

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
      title: 'Responsive Widgets',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        textTheme: GoogleFonts.interTextTheme(),
      ),
      home: const ResponsiveWidgetsExample(),
    );
  }
}

class ResponsiveWidgetsExample extends StatelessWidget {
  const ResponsiveWidgetsExample({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Responsive Widgets'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Wrap Example
            Text(
              'Wrap Widget',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                'Flutter',
                'Dart',
                'Mobile',
                'Development',
                'UI',
                'UX',
                'Design',
                'Responsive',
                'Layout',
                'Widget',
              ].map((tag) => Chip(
                label: Text(tag),
                backgroundColor: Colors.blue.withOpacity(0.1),
              )).toList(),
            ),
            const SizedBox(height: 24),
            // FittedBox Example
            Text(
              'FittedBox Widget',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              height: 60,
              color: Colors.grey[200],
              child: const FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  'Teks ini akan mengecil jika tidak muat',
                  style: TextStyle(fontSize: 30),
                ),
              ),
            ),
            const SizedBox(height: 24),
            // AspectRatio Example
            Text(
              'AspectRatio Widget',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.deepPurple,
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: const Text(
                  '16:9 Aspect Ratio',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            // FractionallySizedBox Example
            Text(
              'FractionallySizedBox Widget',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              height: 100,
              color: Colors.grey[200],
              child: Row(
                children: [
                  FractionallySizedBox(
                    widthFactor: 0.3,
                    child: Container(
                      color: Colors.red,
                      alignment: Alignment.center,
                      child: const Text(
                        '30%',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ),
                  FractionallySizedBox(
                    widthFactor: 0.7,
                    child: Container(
                      color: Colors.green,
                      alignment: Alignment.center,
                      child: const Text(
                        '70%',
                        style: TextStyle(color: Colors.white),
                      ),
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
```

## Aplikasi Mini POS: Final Project

Sekarang kita akan membangun aplikasi Mini Point-of-Sale (POS) yang lengkap. Aplikasi ini akan menggabungkan semua konsep yang sudah kita pelajari:

1. **Layout**: Column, Row, Stack, Expanded, GridView
2. **Styling**: Tema warna clean, Google Fonts (Inter), shadow, border radius
3. **Animasi**: AnimatedContainer, Hero animation, micro-interactions
4. **Responsivitas**: MediaQuery, LayoutBuilder, breakpoint

Berikut adalah full source code untuk aplikasi Mini POS:

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  runApp(const MiniPosApp());
}

// ==================== THEME CONFIGURATION ====================

class AppTheme {
  static const Color primaryColor = Color(0xFF4F46E5);
  static const Color primaryLight = Color(0xFF818CF8);
  static const Color primaryDark = Color(0xFF3730A3);
  static const Color surfaceColor = Colors.white;
  static const Color backgroundColor = Color(0xFFF8FAFC);
  static const Color cardColor = Colors.white;
  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color accentColor = Color(0xFF14B8A6);
  static const Color successColor = Color(0xFF22C55E);
  static const Color warningColor = Color(0xFFF59E0B);
  static const Color errorColor = Color(0xFFEF4444);
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
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

// ==================== MAIN APP ====================

class MiniPosApp extends StatelessWidget {
  const MiniPosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mini POS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const MainScreen(),
    );
  }
}

// ==================== MAIN SCREEN WITH NAVIGATION ====================

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const ProductsScreen(),
    const CartScreen(),
    const TransactionsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    // Responsiveness check
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth >= 600;

    return Scaffold(
      body: Row(
        children: [
          // Navigation Rail untuk tablet/desktop
          if (isTablet)
            NavigationRail(
              selectedIndex: _selectedIndex,
              onDestinationSelected: (index) {
                setState(() {
                  _selectedIndex = index;
                });
              },
              backgroundColor: Colors.white,
              selectedIconTheme: const IconThemeData(color: AppTheme.primaryColor),
              selectedLabelTextStyle: GoogleFonts.inter(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.w600,
              ),
              unselectedIconTheme: IconThemeData(color: Colors.grey[400]),
              unselectedLabelTextStyle: GoogleFonts.inter(color: Colors.grey[400]),
              destinations: const [
                NavigationRailDestination(
                  icon: Icon(Icons.dashboard_outlined),
                  selectedIcon: Icon(Icons.dashboard),
                  label: Text('Dashboard'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.inventory_2_outlined),
                  selectedIcon: Icon(Icons.inventory_2),
                  label: Text('Produk'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.shopping_cart_outlined),
                  selectedIcon: Icon(Icons.shopping_cart),
                  label: Text('Keranjang'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.receipt_long_outlined),
                  selectedIcon: Icon(Icons.receipt_long),
                  label: Text('Transaksi'),
                ),
              ],
            ),
          // Main content
          Expanded(child: _screens[_selectedIndex]),
        ],
      ),
      // Bottom Navigation untuk mobile
      bottomNavigationBar: !isTablet
          ? Container(
              margin: const EdgeInsets.all(16),
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
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: BottomNavigationBar(
                  currentIndex: _selectedIndex,
                  onTap: (index) {
                    setState(() {
                      _selectedIndex = index;
                    });
                  },
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  type: BottomNavigationBarType.fixed,
                  selectedItemColor: AppTheme.primaryColor,
                  unselectedItemColor: AppTheme.textMuted,
                  selectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
                  items: const [
                    BottomNavigationBarItem(
                      icon: Icon(Icons.dashboard_outlined),
                      activeIcon: Icon(Icons.dashboard),
                      label: 'Dashboard',
                    ),
                    BottomNavigationBarItem(
                      icon: Icon(Icons.inventory_2_outlined),
                      activeIcon: Icon(Icons.inventory_2),
                      label: 'Produk',
                    ),
                    BottomNavigationBarItem(
                      icon: Icon(Icons.shopping_cart_outlined),
                      activeIcon: Icon(Icons.shopping_cart),
                      label: 'Keranjang',
                    ),
                    BottomNavigationBarItem(
                      icon: Icon(Icons.receipt_long_outlined),
                      activeIcon: Icon(Icons.receipt_long),
                      label: 'Transaksi',
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }
}

// ==================== DASHBOARD SCREEN ====================

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth >= 600;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: Container(
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
                              'Admin POS',
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
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(16),
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
                              'Cari transaksi...',
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
                  ],
                ),
              ),
            ),
            // Stats Grid
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final crossAxisCount = isTablet ? 4 : 2;
                    return GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: crossAxisCount,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 1.2,
                      children: [
                        _buildStatCard(
                          icon: Icons.shopping_bag_outlined,
                          title: 'Total Penjualan',
                          value: '156',
                          change: '+12%',
                          color: AppTheme.statBlue,
                        ),
                        _buildStatCard(
                          icon: Icons.account_balance_wallet_outlined,
                          title: 'Pendapatan',
                          value: 'Rp 24.5M',
                          change: '+8%',
                          color: AppTheme.statGreen,
                        ),
                        _buildStatCard(
                          icon: Icons.people_outline,
                          title: 'Pelanggan',
                          value: '89',
                          change: '+5%',
                          color: AppTheme.statOrange,
                        ),
                        _buildStatCard(
                          icon: Icons.inventory_2_outlined,
                          title: 'Produk',
                          value: '234',
                          change: '+3%',
                          color: AppTheme.statPurple,
                        ),
                      ],
                    );
                  },
                ),
              ),
            ),
            // Recent Transactions Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Transaksi Terbaru',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    TextButton(
                      onPressed: () {},
                      child: Text(
                        'Lihat Semua',
                        style: GoogleFonts.inter(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Recent Transactions List
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    _buildTransactionItem(
                      id: '#TRX-001',
                      customer: 'Budi Santoso',
                      amount: 'Rp 450.000',
                      time: '2 menit yang lalu',
                      status: 'success',
                    ),
                    _buildTransactionItem(
                      id: '#TRX-002',
                      customer: 'Ani Wijaya',
                      amount: 'Rp 275.000',
                      time: '15 menit yang lalu',
                      status: 'success',
                    ),
                    _buildTransactionItem(
                      id: '#TRX-003',
                      customer: 'Citra Dewi',
                      amount: 'Rp 890.000',
                      time: '1 jam yang lalu',
                      status: 'pending',
                    ),
                  ],
                ),
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
    required String change,
    required Color color,
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
            padding: const EdgeInsets.all(16),
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
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(height: 12),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.successColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    change,
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.successColor,
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

  Widget _buildTransactionItem({
    required String id,
    required String customer,
    required String amount,
    required String time,
    required String status,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.receipt,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  id,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  customer,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                amount,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                time,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ==================== PRODUCTS SCREEN ====================

class ProductsScreen extends StatelessWidget {
  const ProductsScreen({super.key});

  final List<Map<String, dynamic>> products = const [
    {'name': 'Kopi Arabica', 'price': 'Rp 45.000', 'stock': 50, 'category': 'Minuman'},
    {'name': 'Kopi Robusta', 'price': 'Rp 38.000', 'stock': 35, 'category': 'Minuman'},
    {'name': 'Teh Hijau', 'price': 'Rp 25.000', 'stock': 42, 'category': 'Minuman'},
    {'name': 'Roti Bakar', 'price': 'Rp 18.000', 'stock': 20, 'category': 'Makanan'},
    {'name': 'Nasi Goreng', 'price': 'Rp 35.000', 'stock': 15, 'category': 'Makanan'},
    {'name': 'Mie Goreng', 'price': 'Rp 28.000', 'stock': 18, 'category': 'Makanan'},
  ];

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth >= 600;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Daftar Produk'),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.add),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Search Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
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
                  const Icon(Icons.search, color: AppTheme.textMuted),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(
                        hintText: 'Cari produk...',
                        hintStyle: GoogleFonts.inter(color: AppTheme.textMuted),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            // Products Grid
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final crossAxisCount = isTablet ? 3 : 2;
                  return GridView.builder(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: crossAxisCount,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.85,
                    ),
                    itemCount: products.length,
                    itemBuilder: (context, index) {
                      final product = products[index];
                      return _buildProductCard(product);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(Map<String, dynamic> product) {
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
            transform: Matrix4.identity()..scale(isPressed ? 0.96 : 1.0),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: isPressed
                      ? AppTheme.primaryColor.withOpacity(0.2)
                      : Colors.black.withOpacity(0.05),
                  blurRadius: isPressed ? 15 : 10,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 3,
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(20),
                      ),
                    ),
                    child: Center(
                      child: Icon(
                        Icons.inventory_2,
                        size: 48,
                        color: AppTheme.primaryColor.withOpacity(0.5),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              product['name'],
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              product['category'],
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: AppTheme.textMuted,
                              ),
                            ),
                          ],
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              product['price'],
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: AppTheme.successColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'Stok: ${product['stock']}',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.successColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
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
}

// ==================== CART SCREEN ====================

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Keranjang Belanja'),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                _buildCartItem(
                  name: 'Kopi Arabica',
                  price: 'Rp 45.000',
                  quantity: 2,
                  image: Icons.coffee,
                ),
                _buildCartItem(
                  name: 'Roti Bakar',
                  price: 'Rp 18.000',
                  quantity: 1,
                  image: Icons.bakery_dining,
                ),
                _buildCartItem(
                  name: 'Teh Hijau',
                  price: 'Rp 25.000',
                  quantity: 3,
                  image: Icons.emoji_food_beverage,
                ),
              ],
            ),
          ),
          // Total Section
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(32),
              ),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Subtotal',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      Text(
                        'Rp 158.000',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'PPN (10%)',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      Text(
                        'Rp 15.800',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total',
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      Text(
                        'Rp 173.800',
                        style: GoogleFonts.inter(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Text(
                        'Proses Pembayaran',
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

  Widget _buildCartItem({
    required String name,
    required String price,
    required int quantity,
    required IconData image,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
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
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              image,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  price,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
          ),
          Row(
            children: [
              _buildQuantityButton(Icons.remove),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  quantity.toString(),
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              _buildQuantityButton(Icons.add),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuantityButton(IconData icon) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        icon,
        size: 16,
        color: AppTheme.textPrimary,
      ),
    );
  }
}

// ==================== TRANSACTIONS SCREEN ====================

class TransactionsScreen extends StatelessWidget {
  const TransactionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Riwayat Transaksi'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _buildDateHeader('Hari Ini'),
          _buildTransactionCard(
            id: '#TRX-001',
            customer: 'Budi Santoso',
            items: 3,
            total: 'Rp 450.000',
            time: '14:30',
            status: 'completed',
          ),
          _buildTransactionCard(
            id: '#TRX-002',
            customer: 'Ani Wijaya',
            items: 2,
            total: 'Rp 275.000',
            time: '13:15',
            status: 'completed',
          ),
          const SizedBox(height: 16),
          _buildDateHeader('Kemarin'),
          _buildTransactionCard(
            id: '#TRX-003',
            customer: 'Citra Dewi',
            items: 5,
            total: 'Rp 890.000',
            time: '16:45',
            status: 'completed',
          ),
          _buildTransactionCard(
            id: '#TRX-004',
            customer: 'Dedi Pratama',
            items: 1,
            total: 'Rp 125.000',
            time: '11:20',
            status: 'cancelled',
          ),
        ],
      ),
    );
  }

  Widget _buildDateHeader(String date) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        date,
        style: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppTheme.textSecondary,
        ),
      ),
    );
  }

  Widget _buildTransactionCard({
    required String id,
    required String customer,
    required int items,
    required String total,
    required String time,
    required String status,
  }) {
    final statusColor = status == 'completed' ? AppTheme.successColor : AppTheme.errorColor;
    final statusText = status == 'completed' ? 'Selesai' : 'Dibatalkan';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                id,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.primaryColor,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  statusText,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 20),
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.person,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      customer,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$items item',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    total,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    time,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
```

## Penjelasan Struktur Aplikasi Mini POS

### 1. Theme Configuration

- Semua warna didefinisikan di `AppTheme` untuk konsistensi
- Menggunakan Google Fonts Inter untuk tipografi
- Konfigurasi tema lengkap untuk Material 3

### 2. Navigation

- **Mobile**: BottomNavigationBar dengan floating style
- **Tablet/Desktop**: NavigationRail di sisi kiri
- Perpindahan menggunakan MediaQuery untuk deteksi ukuran layar

### 3. Dashboard Screen

- Header dengan gradient dan search bar
- Grid statistik yang responsif (2 kolom mobile, 4 kolom tablet)
- List transaksi terbaru dengan card styling

### 4. Products Screen

- Grid produk yang responsif (2 kolom mobile, 3 kolom tablet)
- Card produk dengan animasi press effect
- Badge stok dan kategori

### 5. Cart Screen

- List item keranjang dengan quantity control
- Bottom sheet untuk total dan checkout
- Perhitungan subtotal, PPN, dan total

### 6. Transactions Screen

- Grouping berdasarkan tanggal
- Status transaksi dengan color coding
- Detail transaksi yang lengkap

## Fitur Responsivitas yang Diimplementasikan

1. **Adaptive Navigation**: Bottom nav untuk mobile, side rail untuk tablet/desktop
2. **Responsive Grid**: CrossAxisCount menyesuaikan dengan lebar layar
3. **Flexible Layout**: Menggunakan Expanded dan Flexible untuk ruang yang tersedia
4. **Breakpoint Handling**: Deteksi mobile/tablet dengan threshold 600px

## Kesimpulan Seri Tutorial

Selamat! Kamu telah menyelesaikan seri tutorial Flutter yang mencakup:

### Part 1: Fondasi Layout

- Column, Row, Container, Expanded, Stack
- Kerangka UI dasar

### Part 2: Styling dan Animasi

- Google Fonts untuk tipografi
- Tema warna clean dan modern
- AnimatedContainer dan Hero animation

### Part 3: Responsivitas dan Final Project

- MediaQuery dan LayoutBuilder
- Responsive widgets
- Aplikasi Mini POS yang lengkap

Aplikasi Mini POS yang kita bangun adalah contoh nyata bagaimana menggabungkan semua konsep tersebut menjadi satu aplikasi yang fungsional, responsif, dan modern.

**Langkah Selanjutnya:**

- Integrasi dengan backend/API
- State management (Provider, Bloc, atau Riverpod)
- Local database (Hive, SQLite)
- Authentication
- Push notification

Terus berlatih dan eksplorasi. Flutter adalah framework yang sangat powerful dan menyenangkan untuk dipelajari. Selamat coding!

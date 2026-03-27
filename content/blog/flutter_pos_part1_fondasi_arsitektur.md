---
title: "Masterclass Flutter Part 1: Slicing dan Logika Aplikasi Mini POS Siap Produksi"
date: "Mar 27, 2026"
description: "Masterclass Flutter Part 1: Slicing dan Logika Aplikasi Mini POS Siap Produksi"
---

## Pendahuluan

Halo, selamat datang di seri tutorial pembuatan aplikasi Point-of-Sale (POS) menggunakan Flutter. Di part pertama ini, aku akan membimbing kamu membangun fondasi arsitektur yang kokoh dan mengimplementasikan state management untuk mengelola data keranjang belanja.

## Apa yang Akan Kita Pelajari

- Clean Architecture dasar untuk pemisahan logika dan UI
- State management menggunakan Provider
- Model data untuk produk dan keranjang
- UI daftar produk yang terhubung dengan state management

## Struktur Proyek

Kita akan mengorganisir kode dengan struktur berikut:

```
lib/
├── main.dart
├── models/
│   ├── product.dart
│   └── cart_item.dart
├── providers/
│   └── cart_provider.dart
├── screens/
│   ├── home_screen.dart
│   └── cart_screen.dart
└── widgets/
    └── product_card.dart
```

## Langkah 1: Setup Proyek

Pertama, buat proyek Flutter baru:

```bash
flutter create flutter_pos_app
cd flutter_pos_app
```

Tambahkan dependency yang dibutuhkan di `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  provider: ^6.1.2
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true
```

Kemudian jalankan:

```bash
flutter pub get
```

## Langkah 2: Membuat Model Data

### Model Produk (`lib/models/product.dart`)

Model ini merepresentasikan data produk yang akan ditampilkan dan dijual.

```dart
class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final String category;
  final int stock;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.category,
    required this.stock,
  });

  // Factory method untuk membuat Product dari JSON (persiapan untuk API)
  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'].toString(),
      name: json['name'],
      description: json['description'] ?? '',
      price: (json['price'] as num).toDouble(),
      category: json['category'] ?? 'Umum',
      stock: json['stock'] ?? 0,
    );
  }

  // Method untuk mengkonversi Product ke JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'category': category,
      'stock': stock,
    };
  }

  // Method copyWith untuk membuat salinan dengan perubahan tertentu
  Product copyWith({
    String? id,
    String? name,
    String? description,
    double? price,
    String? category,
    int? stock,
  }) {
    return Product(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      price: price ?? this.price,
      category: category ?? this.category,
      stock: stock ?? this.stock,
    );
  }

  @override
  String toString() {
    return 'Product(id: $id, name: $name, price: $price)';
  }
}
```

### Model Cart Item (`lib/models/cart_item.dart`)

Model ini merepresentasikan item yang ada di keranjang belanja, yang berisi produk dan jumlahnya.

```dart
import 'product.dart';

class CartItem {
  final Product product;
  int quantity;

  CartItem({
    required this.product,
    this.quantity = 1,
  });

  // Getter untuk menghitung subtotal item
  double get subtotal => product.price * quantity;

  // Method untuk menambah jumlah
  void increment() {
    if (quantity < product.stock) {
      quantity++;
    }
  }

  // Method untuk mengurangi jumlah
  void decrement() {
    if (quantity > 1) {
      quantity--;
    }
  }

  // Factory method untuk membuat CartItem dari JSON
  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      product: Product.fromJson(json['product']),
      quantity: json['quantity'] ?? 1,
    );
  }

  // Method untuk mengkonversi CartItem ke JSON
  Map<String, dynamic> toJson() {
    return {
      'product': product.toJson(),
      'quantity': quantity,
    };
  }

  CartItem copyWith({
    Product? product,
    int? quantity,
  }) {
    return CartItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
    );
  }

  @override
  String toString() {
    return 'CartItem(product: ${product.name}, quantity: $quantity)';
  }
}
```

## Langkah 3: Implementasi State Management dengan Provider

### Cart Provider (`lib/providers/cart_provider.dart`)

Ini adalah jantung dari state management kita. Provider akan mengelola seluruh state keranjang belanja dan memberi tahu UI ketika ada perubahan.

```dart
import 'package:flutter/foundation.dart';
import '../models/product.dart';
import '../models/cart_item.dart';

class CartProvider with ChangeNotifier {
  // Private list untuk menyimpan item keranjang
  final List<CartItem> _items = [];

  // Getter untuk mengakses item (immutable)
  List<CartItem> get items => List.unmodifiable(_items);

  // Getter untuk menghitung total item di keranjang (termasuk quantity)
  int get itemCount {
    return _items.fold(0, (sum, item) => sum + item.quantity);
  }

  // Getter untuk menghitung total harga seluruh keranjang
  double get totalAmount {
    return _items.fold(0.0, (sum, item) => sum + item.subtotal);
  }

  // Getter untuk cek apakah keranjang kosong
  bool get isEmpty => _items.isEmpty;

  // Method untuk menambah produk ke keranjang
  void addToCart(Product product) {
    // Cek apakah produk sudah ada di keranjang
    final existingIndex = _items.indexWhere(
      (item) => item.product.id == product.id,
    );

    if (existingIndex >= 0) {
      // Jika sudah ada, tambah quantity jika masih ada stock
      final existingItem = _items[existingIndex];
      if (existingItem.quantity < product.stock) {
        existingItem.increment();
        notifyListeners();
      }
    } else {
      // Jika belum ada, tambahkan sebagai item baru
      _items.add(CartItem(product: product));
      notifyListeners();
    }
  }

  // Method untuk mengurangi quantity atau menghapus item
  void removeFromCart(String productId) {
    final existingIndex = _items.indexWhere(
      (item) => item.product.id == productId,
    );

    if (existingIndex >= 0) {
      final existingItem = _items[existingIndex];

      if (existingItem.quantity > 1) {
        // Kurangi quantity jika lebih dari 1
        existingItem.decrement();
      } else {
        // Hapus item jika quantity sudah 1
        _items.removeAt(existingIndex);
      }
      notifyListeners();
    }
  }

  // Method untuk menghapus item sepenuhnya (regardless of quantity)
  void removeItemCompletely(String productId) {
    _items.removeWhere((item) => item.product.id == productId);
    notifyListeners();
  }

  // Method untuk mengupdate quantity secara langsung
  void updateQuantity(String productId, int newQuantity) {
    if (newQuantity <= 0) {
      removeItemCompletely(productId);
      return;
    }

    final existingIndex = _items.indexWhere(
      (item) => item.product.id == productId,
    );

    if (existingIndex >= 0) {
      final item = _items[existingIndex];
      if (newQuantity <= item.product.stock) {
        item.quantity = newQuantity;
        notifyListeners();
      }
    }
  }

  // Method untuk mengosongkan keranjang
  void clearCart() {
    _items.clear();
    notifyListeners();
  }

  // Method untuk cek apakah produk ada di keranjang
  bool isInCart(String productId) {
    return _items.any((item) => item.product.id == productId);
  }

  // Method untuk mendapatkan quantity produk di keranjang
  int getQuantity(String productId) {
    final item = _items.firstWhere(
      (item) => item.product.id == productId,
      orElse: () => CartItem(
        product: Product(
          id: '',
          name: '',
          description: '',
          price: 0,
          category: '',
          stock: 0,
        ),
        quantity: 0,
      ),
    );
    return item.quantity;
  }

  // Method untuk checkout (akan dikembangkan di part berikutnya)
  Future<bool> checkout() async {
    // Simulasi proses checkout
    await Future.delayed(const Duration(seconds: 1));

    if (_items.isEmpty) return false;

    // Di sini nanti akan diintegrasikan dengan API
    // Untuk sekarang, kita hanya kosongkan keranjang
    clearCart();
    return true;
  }
}
```

## Langkah 4: Membuat Widget UI

### Product Card (`lib/widgets/product_card.dart`)

Widget ini menampilkan informasi produk dan tombol untuk menambah ke keranjang.

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../providers/cart_provider.dart';

class ProductCard extends StatelessWidget {
  final Product product;

  const ProductCard({
    super.key,
    required this.product,
  });

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);
    final isInCart = cartProvider.isInCart(product.id);
    final quantity = cartProvider.getQuantity(product.id);

    return Card(
      elevation: 2,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header dengan nama dan kategori
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    product.name,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    product.category,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.blue.shade800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Deskripsi produk
            Text(
              product.description,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),

            // Footer dengan harga, stock, dan tombol
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Rp ${product.price.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                    Text(
                      'Stock: ${product.stock}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),

                // Tombol Add to Cart atau Quantity Control
                if (!isInCart)
                  ElevatedButton.icon(
                    onPressed: product.stock > 0
                        ? () {
                            cartProvider.addToCart(product);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('${product.name} ditambahkan ke keranjang'),
                                duration: const Duration(seconds: 1),
                              ),
                            );
                          }
                        : null,
                    icon: const Icon(Icons.add_shopping_cart),
                    label: const Text('Tambah'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                  )
                else
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          onPressed: () {
                            cartProvider.removeFromCart(product.id);
                          },
                          icon: const Icon(Icons.remove),
                          color: Colors.blue,
                          iconSize: 20,
                        ),
                        Text(
                          '$quantity',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        IconButton(
                          onPressed: quantity < product.stock
                              ? () {
                                  cartProvider.addToCart(product);
                                }
                              : null,
                          icon: const Icon(Icons.add),
                          color: quantity < product.stock ? Colors.blue : Colors.grey,
                          iconSize: 20,
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

## Langkah 5: Membuat Screen

### Home Screen (`lib/screens/home_screen.dart`)

Screen ini menampilkan daftar produk dan summary keranjang.

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../providers/cart_provider.dart';
import '../widgets/product_card.dart';
import 'cart_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  // Data dummy produk untuk demo
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mini POS'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          // Icon keranjang dengan badge
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
        ],
      ),
      body: Column(
        children: [
          // Header kategori
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.grey.shade100,
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

          // List produk
          Expanded(
            child: ListView.builder(
              itemCount: dummyProducts.length,
              itemBuilder: (context, index) {
                return ProductCard(product: dummyProducts[index]);
              },
            ),
          ),

          // Bottom bar summary keranjang
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

### Cart Screen (`lib/screens/cart_screen.dart`)

Screen ini menampilkan detail keranjang belanja dan tombol checkout.

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Keranjang Belanja'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Consumer<CartProvider>(
        builder: (context, cart, child) {
          if (cart.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.shopping_cart_outlined,
                    size: 80,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Keranjang masih kosong',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Silakan tambahkan produk dari daftar',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade500,
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    child: const Text('Kembali Belanja'),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(16),
                color: Colors.blue.shade50,
                child: Row(
                  children: [
                    const Icon(Icons.shopping_bag, color: Colors.blue),
                    const SizedBox(width: 8),
                    Text(
                      '${cart.itemCount} Item',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Kosongkan Keranjang'),
                            content: const Text(
                              'Apakah kamu yakin ingin mengosongkan keranjang?',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context),
                                child: const Text('Batal'),
                              ),
                              TextButton(
                                onPressed: () {
                                  cart.clearCart();
                                  Navigator.pop(context);
                                },
                                child: const Text(
                                  'Ya, Kosongkan',
                                  style: TextStyle(color: Colors.red),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                      child: const Text(
                        'Kosongkan',
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                  ],
                ),
              ),

              // List item keranjang
              Expanded(
                child: ListView.builder(
                  itemCount: cart.items.length,
                  itemBuilder: (context, index) {
                    final item = cart.items[index];

                    return Card(
                      margin: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 4,
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            // Info produk
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.product.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Rp ${item.product.price.toStringAsFixed(0)}',
                                    style: TextStyle(
                                      color: Colors.grey.shade600,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Subtotal: Rp ${item.subtotal.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                      color: Colors.green,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Quantity control
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    onPressed: () {
                                      cart.removeFromCart(item.product.id);
                                    },
                                    icon: const Icon(Icons.remove),
                                    iconSize: 20,
                                  ),
                                  Text(
                                    '${item.quantity}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                  IconButton(
                                    onPressed: item.quantity < item.product.stock
                                        ? () {
                                            cart.addToCart(item.product);
                                          }
                                        : null,
                                    icon: const Icon(Icons.add),
                                    iconSize: 20,
                                  ),
                                ],
                              ),
                            ),

                            // Tombol hapus
                            IconButton(
                              onPressed: () {
                                cart.removeItemCompletely(item.product.id);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('${item.product.name} dihapus dari keranjang'),
                                    duration: const Duration(seconds: 1),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.delete_outline),
                              color: Colors.red,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              // Bottom summary dan checkout
              Container(
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
                  child: Column(
                    children: [
                      // Total
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total Pembayaran:',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Rp ${cart.totalAmount.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Tombol Checkout
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () async {
                            final success = await cart.checkout();
                            if (success) {
                              if (context.mounted) {
                                showDialog(
                                  context: context,
                                  barrierDismissible: false,
                                  builder: (context) => AlertDialog(
                                    title: const Text('Checkout Berhasil'),
                                    content: const Text(
                                      'Terima kasih telah berbelanja. Transaksi berhasil dicatat.',
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () {
                                          Navigator.pop(context);
                                          Navigator.pop(context);
                                        },
                                        child: const Text('OK'),
                                      ),
                                    ],
                                  ),
                                );
                              }
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text(
                            'PROSES CHECKOUT',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
```

## Langkah 6: Main Application

### Main Dart (`lib/main.dart`)

Ini adalah entry point aplikasi yang menginisialisasi Provider.

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/cart_provider.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => CartProvider(),
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
        home: const HomeScreen(),
      ),
    );
  }
}
```

## Penjelasan Konsep Clean Architecture Dasar

Dalam aplikasi ini, aku menerapkan pemisahan tanggung jawab (separation of concerns) dengan cara berikut:

### 1. Layer Model (Data)

- Berisi definisi struktur data (`Product`, `CartItem`)
- Tidak memiliki dependensi ke layer lain
- Bertanggung jawab untuk serialisasi/deserialisasi JSON

### 2. Layer Provider (Business Logic)

- Berisi logika bisnis (`CartProvider`)
- Mengelola state aplikasi
- Tidak tahu apa-apa tentang cara data ditampilkan (UI agnostic)
- Menggunakan ChangeNotifier untuk memberi tahu UI tentang perubahan

### 3. Layer UI (Presentation)

- Widget dan Screen hanya fokus pada tampilan
- Mengonsumsi data dari Provider melalui Consumer atau Provider.of
- Tidak memiliki logika bisnis yang kompleks

### Alur Data

```
User Action -> UI -> Provider -> Update State -> Notify Listeners -> UI Rebuild
```

Contoh alur ketika user menambah produk:

1. User tap tombol "Tambah" di ProductCard
2. ProductCard memanggil `cartProvider.addToCart(product)`
3. CartProvider menambah item ke `_items` list
4. CartProvider memanggil `notifyListeners()`
5. Semua widget yang menggunakan Consumer<CartProvider> di-rebuild
6. UI menampilkan data terbaru (badge keranjang terupdate, dll)

## Cara Menjalankan Aplikasi

1. Pastikan Flutter SDK sudah terinstall (versi 3.41.5 atau compatible)
2. Jalankan perintah:

```bash
flutter pub get
flutter run
```

3. Aplikasi akan berjalan di emulator atau device yang terhubung

## Kesimpulan Part 1

Di part ini, kita sudah membangun fondasi yang kokoh:

- Model data yang terstruktur dengan baik
- State management menggunakan Provider yang terpisah dari UI
- UI yang reaktif terhadap perubahan data
- Fitur keranjang belanja yang fungsional

Di Part 2, kita akan menambahkan fitur autentikasi dan keamanan token. Kita akan belajar cara menyimpan token dengan aman dan mengintegrasikan login dengan API.

## Source Code Lengkap Part 1

Semua kode di atas sudah siap di-copy dan di-run. Pastikan struktur folder sesuai dengan yang dijelaskan di awal tutorial.

---

Selamat mencoba dan jangan ragu untuk bereksperimen dengan kode ini. Sampai jumpa di Part 2.

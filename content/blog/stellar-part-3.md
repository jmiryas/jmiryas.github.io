---
title: "Introduction to Stellar Part 3"
date: "Mar 28, 2026"
description: "Introduction to Stellar Part 3"
---

## Membedah Stellar (Part 3): Masuk ke Dunia Web3 – "Hello World" Smart Contract dengan Soroban dan Rust

Halo! Selamat datang di bagian penutup dari seri "Membedah Stellar".

Di dua artikel sebelumnya, kita sudah membahas infrastruktur dasar jaringan Stellar. Kini, saatnya kita masuk ke fitur paling canggihnya: **Soroban**.

Soroban adalah platform _Smart Contract_ milik Stellar. Jika sebelumnya kita hanya bisa "mengirim dan menerima uang", dengan Soroban kita bisa menanamkan logika _backend_ yang kompleks (seperti lelang, patungan dana, atau _game_) langsung ke dalam _blockchain_. Semua ini ditulis menggunakan bahasa pemrograman **Rust**.

Siapkan terminal kalian, mari kita buat _Smart Contract_ pertama kita!

## 1. Persiapan Environment

Pastikan kamu sudah menginstal **Rust** dan **Stellar CLI** di komputermu. Jika belum, kamu bisa mengikuti panduan resminya (biasanya menggunakan `rustup` dan `cargo install --locked stellar-cli`).

Setelah siap, mari kita inisialisasi _project_ Soroban baru melalui terminal:

```bash
cargo new --lib soroban-hello-world
cd soroban-hello-world
```

Buka file `Cargo.toml` dan tambahkan _dependency_ Soroban SDK:

```toml
[package]
name = "soroban-hello-world"
version = "0.1.0"
edition = "2021"

[dependencies]
soroban-sdk = "20.0.0" # Pastikan menggunakan versi terbaru

[lib]
crate-type = ["cdylib"] # Penting: Format ini dibutuhkan agar bisa di-compile ke WebAssembly (Wasm)
```

## 2. Menulis Logika Smart Contract

Di dalam Soroban, _smart contract_ hanyalah kumpulan fungsi Rust biasa yang dibungkus dengan semacam "label" (_macro_) khusus.

Buka file `src/lib.rs`, hapus semua isinya, dan _copy-paste_ kode _Hello World_ sederhana ini:

```rust
#![no_std] // Smart contract tidak punya akses ke OS (Standard Library)
use soroban_sdk::{contract, contractimpl, vec, Env, String, Vec};

// 1. Mendefinisikan Contract
#[contract]
pub struct HelloContract;

// 2. Mengimplementasikan Logika Contract
#[contractimpl]
impl HelloContract {
    // Fungsi ini menerima input nama, dan mengembalikan kalimat sapaan
    pub fn hello(env: Env, to: String) -> Vec<String> {
        vec![&env, String::from_str(&env, "Hello"), to]
    }
}
```

**Penjelasan Singkat:**

- `#[contract]`: Memberi tahu _compiler_ bahwa `HelloContract` adalah sebuah _smart contract_.
- `#[contractimpl]`: Tempat kita menaruh logika fungsinya.
- Fungsi `hello`: Menerima input `to` (misal: "Dunia") dan akan mengembalikan sebuah _array/vector_ berisi `["Hello", "Dunia"]`.

## 3. Compile ke WebAssembly (Wasm)

_Blockchain_ tidak bisa membaca kode Rust secara langsung. Kita harus mengubahnya (_compile_) menjadi format _WebAssembly_ (`.wasm`). Jalankan perintah ini di terminal:

```bash
cargo build --target wasm32-unknown-unknown --release
```

Jika berhasil, file hasil _compile_ akan muncul di folder `target/wasm32-unknown-unknown/release/soroban_hello_world.wasm`. File inilah yang nantinya siap di-_deploy_ ke jaringan Stellar!

---

**Kesimpulan Akhir**

Selamat! Kamu baru saja menulis _Smart Contract_ pertamamu menggunakan bahasa Rust di ekosistem Soroban.

Memang rasanya seperti kembali belajar _backend_ dari nol karena sintaks Rust yang ketat. Tapi bayangkan potensinya: kamu bisa membuat aplikasi lelang _real-time_, mendigitalkan aset dunia nyata, atau membuat sistem otomatisasi pembayaran tanpa perlu pusing menyewa _server_ AWS atau mengurus _database_ tersendiri. Jaringan Stellar yang akan mengeksekusi dan mengamankan kodenya untukmu.

Eksplorasi kita di ekosistem Stellar baru saja dimulai. Selamat bereksperimen di dunia Web3!

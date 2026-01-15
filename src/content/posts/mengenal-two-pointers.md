---
title: "Jurus Dua Jari: Cara Gampang Selesaikan Soal Algoritma Tanpa Pusing"
date: "2025-01-15"
readTime: "12 min read"
excerpt: "Tinggalkan cara lama yang bikin kodemu lemot. Pelajari teknik Two Pointers, strategi simpel untuk menyelesaikan soal algoritma kompleks dengan jauh lebih cepat dan efisien. Panduan lengkap dari konsep dasar, analogi visual, hingga latihan soal untuk pemula."
# image: ""
# caption: ""
---

Pernah tidak kamu bikin kode, logikanya rasanya sudah benar, tapi pas dijalankan prosesnya lambat sekali? Atau kalau kamu lagi latihan soal coding, kamu kena error **"Time Limit Exceeded"**?

Biasanya, itu karena kamu menggunakan cara **"Cek Satu-Satu" (Nested Loop)**. Bayangkan kamu punya daftar 1.000 angka, dan kamu mengecek setiap angka dengan 999 angka lainnya. Itu butuh jutaan proses.

Nah, ada teknik rahasia bernama **Two Pointers** (Dua Penunjuk). Teknik ini bisa mengubah jutaan proses tadi menjadi cuma seribu proses saja. Yuk, kita bedah pelan-pelan.

## Apa Itu "Two Pointers"?

Bayangkan kamu sedang mencari pasangan kaos kaki di jemuran yang panjang.

**Cara Lama (Lambat):**
Kamu ambil satu kaos kaki di ujung kiri, lalu kamu jalan kaki menelusuri jemuran sampai ujung kanan untuk cari pasangannya. Kalau belum ketemu, kamu balik lagi ke kiri, ambil kaos kaki kedua, lalu jalan lagi ke ujung kanan. Capek bolak-balik.

**Cara Two Pointers (Cepat):**
Kamu ajak temanmu.

- Kamu berdiri di ujung paling **Kiri**.
- Temanmu berdiri di ujung paling **Kanan**.
- Kalian bergerak bersamaan menuju ke **tengah**.

Di dunia coding, "Kamu" dan "Temanmu" itu disebut **Pointer**. Biasanya mereka hanyalah variabel yang menyimpan **Nomor Urut (Index)** array.

### Kapan Boleh Pakai Teknik Ini?

Teknik ini tidak bisa dipakai sembarangan. Ada aturan mainnya:

- **WAJIB:** Datanya harus berupa urutan (**Array** atau **String**).
- **PENTING:** Untuk pencarian angka, datanya harus **Sudah Terurut (Sorted)** dari kecil ke besar.
- Biasanya digunakan untuk mencari pasangan atau membandingkan posisi.

## LEVEL 1: EASY - Mencari Angka Penjumlah (Sum Zero)

**Misi:**
Diberikan daftar angka yang sudah urut, cari pasangan angka pertama yang kalau dijumlahkan hasilnya 0.

- **Input:** `[-4, -3, -1, 0, 1, 2, 5]`
- **Target:** Jumlahnya harus **0**.
- **Output yang Diharapkan:** `[-1, 1]`

### Logika Sederhana

Ingat aturan timbangan:

- **Angka Minus** = Ringan (Perlu ditambah biar jadi 0).
- **Angka Plus** = Berat (Perlu dikurangi biar jadi 0).

Kita taruh telunjuk **kiri (left)** di awal, dan telunjuk **kanan (right)** di akhir.

### Simulasi Gerakan

- **Cek 1:** Kiri `-4`, Kanan `5`. Jumlah: `1`.
  Hasil positif (Kebesaran). Geser **right** mundur.
- **Cek 2:** Kiri `-4`, Kanan `2`. Jumlah: `-2`.
  Hasil negatif (Kekecilan). Geser **left** maju.
- **Cek 3:** Kiri `-3`, Kanan `2`. Jumlah: `-1`.
  Hasil negatif (Kekecilan). Geser **left** maju.
- **Cek 4:** Kiri `-1`, Kanan `2`. Jumlah: `1`.
  Hasil positif (Kebesaran). Geser **right** mundur.
- **Cek 5:** Kiri `-1`, Kanan `1`. Jumlah: `0`.
  **KETEMU!** 🚀

### Kode JavaScript

```javascript:sumZero.js
function sumZero(arr) {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    let sum = arr[left] + arr[right];

    if (sum === 0) {
      return [arr[left], arr[right]];
    } else if (sum > 0) {
      right--; // Kebesaran, kurangi beban kanan
    } else {
      left++;  // Kekecilan, tambah beban kiri
    }
  }
}

// Test Run
console.log(sumZero([-4, -3, -1, 0, 1, 2, 5])); // Output: [-1, 1]
```

## LEVEL 2: EASY/MEDIUM - Hitung Nilai Unik (Count Unique Values)

**Misi:**
Hitung ada berapa banyak angka unik di dalam array yang sudah terurut.

- **Input:** `[1, 1, 2, 3, 3, 4]`
- **Output yang Diharapkan:** `4` (Karena angka uniknya adalah 1, 2, 3, 4).

### Logika Sederhana

Kali ini pointer tidak bergerak berlawanan, tapi **searah**.

- **Pointer `i` (Si Penjaga):** Diam di tempat, memegang daftar angka unik terakhir.
- **Pointer `j` (Si Pramuka):** Jalan terus ke depan mencari angka baru.

Jika `j` menemukan angka yang **sama** dengan `i`, dia lewat saja. Tapi jika `j` menemukan angka yang **beda**, dia lapor ke `i`.

1. `i` maju satu langkah.
2. Catat angka baru tersebut di posisi `i`.

### Kode JavaScript

```javascript:countUniqueValues.js
function countUniqueValues(arr) {
  if (arr.length === 0) return 0;

  let i = 0;

  // j mulai dari langkah kedua (index 1)
  for (let j = 1; j < arr.length; j++) {
    // Jika angka mereka beda, berarti nemu barang unik baru
    if (arr[i] !== arr[j]) {
      i++;             // Si penjaga maju
      arr[i] = arr[j]; // Catat angka uniknya
    }
  }

  // i adalah index (mulai dari 0), jadi jumlahnya i + 1
  return i + 1;
}

// Test Run
console.log(countUniqueValues([1, 1, 2, 3, 3, 4])); // Output: 4
```

## LEVEL 3: MEDIUM - Valid Palindrome

**Misi:**
Cek apakah sebuah kata dibaca dari depan dan belakang sama (abaikan spasi & simbol).

- **Input:** `"kasur rusak"` (Dianggap menjadi `kasurrusak`)
- **Output yang Diharapkan:** `true`

### Logika Sederhana

Dua satpam mengecek antrian. **Satpam A** di depan, **Satpam B** di belakang.

- **Satpam A** teriak: "Hurufku **K**!"
- **Satpam B** teriak: "Hurufku **K**!"
- **Sama?** Oke, Satpam A **maju**, Satpam B **mundur**.
- **Kalau beda?** Langsung bubar, itu **bukan** Palindrome.

### Kode JavaScript

```javascript:isPalindrome.js
function isPalindrome(str) {
  // Bersihkan simbol & spasi, jadikan huruf kecil semua
  str = str.toLowerCase().replace(/[^a-z0-9]/g, "");

  let left = 0;
  let right = str.length - 1;

  while (left < right) {
    if (str[left] !== str[right]) {
      return false; // Beda dikit? GAGAL.
    }
    left++;  // Satpam depan maju
    right--; // Satpam belakang mundur
  }
  return true;
}

// Test Run
console.log(isPalindrome("kasur rusak")); // Output: true
```

## LEVEL 4: HARD - Wadah Air Terbesar (Container With Most Water)

**Misi:**
Kamu punya deretan dinding. Pilih dua dinding untuk jadi tepi kolam renang agar air yang ditampung paling banyak.

- **Input:** `[1, 8, 6, 2, 5, 4, 8, 3, 7]`
- **Output yang Diharapkan:** `49`

### Logika Sederhana

**Rumus:**
`Luas = Lebar x Tinggi`

- **Lebar:** Jarak antara posisi dinding kiri dan kanan (`Index Kanan - Index Kiri`). Ingat, ini jarak index, bukan selisih tinggi dindingnya.
- **Tinggi:** Air akan tumpah mengikuti **Dinding Terpendek**.

Kita mulai dari kolam terlebar (ujung ke ujung). Untuk mencoba mendapatkan luas lebih besar, kita harus **membuang dinding yang pendek** dan berharap menemukan dinding yang lebih tinggi di bagian dalam.

### Kode JavaScript

```javascript:maxArea.js
function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let maxWater = 0;

  while (left < right) {
    // Hitung area saat ini
    let width = right - left;
    // Tinggi air dibatasi oleh dinding terpendek
    let currentHeight = Math.min(height[left], height[right]);

    let area = width * currentHeight;
    maxWater = Math.max(maxWater, area);

    // LOGIKA PERGESERAN:
    // Buang dinding yang pendek, cari yang lebih tinggi
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  return maxWater;
}

// Test Run
console.log(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])); // Output: 49
```

## LEVEL 5: VERY HARD - Menampung Air Hujan (Trapping Rain Water)

**Misi:**
Ada peta ketinggian balok-balok. Kalau hujan turun, berapa kotak air yang terjebak di sela-sela balok itu?

- **Input:** `[0,1,0,2,1,0,1,3,2,1,2,1]`
- **Output yang Diharapkan:** `6`

### Logika Sederhana

Air hanya bisa menggenang kalau ada "tembok" tinggi di kiri **DAN** di kanan. Kita butuh tahu tembok tertinggi di sebelah kiri (**leftMax**) dan tembok tertinggi di sebelah kanan (**rightMax**).

Jika **leftMax** lebih kecil dari **rightMax**, kita yakin air di sisi kiri pasti tertahan (karena ada tembok raksasa di kanan yang menjamin air tidak tumpah ke sana).

Maka kita hitung air di sisi kiri:
`leftMax - tinggiTanahSaatIni`

### Kode JavaScript

```javascript:trap.js
function trap(height) {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let totalWater = 0;

  while (left < right) {
    // Bandingkan tembok kiri dan kanan
    if (height[left] < height[right]) {
      // --- SISI KIRI (Tembok kiri lebih pendek/sama) ---
      if (height[left] >= leftMax) {
        leftMax = height[left]; // Update rekor tinggi kiri
      } else {
        totalWater += leftMax - height[left]; // Hitung air terjebak
      }
      left++;
    } else {
      // --- SISI KANAN (Tembok kanan lebih pendek) ---
      if (height[right] >= rightMax) {
        rightMax = height[right]; // Update rekor tinggi kanan
      } else {
        totalWater += rightMax - height[right]; // Hitung air terjebak
      }
      right--;
    }
  }
  return totalWater;
}

// Test Run
console.log(trap([0,1,0,2,1,0,1,3,2,1,2,1])); // Output: 6
```

## TANTANGAN LATIHAN: Detektif Kata (Is Subsequence)

Sekarang giliran kamu! Jangan cuma baca, ayo kita tes apakah jari-jari kamu sudah paham konsep Two Pointers ini.

**Misi:**
Diberikan dua string. String pertama adalah **"Kata Sandi"** (pendek), dan string kedua adalah **"Teks Panjang"**. Tugas kamu adalah mengecek apakah karakter-karakter di "Kata Sandi" muncul di dalam "Teks Panjang" **tanpa mengubah urutannya**.

Sample 1:

- **Input:** `"sing"` (Kata Sandi)
- **Input:** `"stingray"` (Teks Panjang)
- **Output:** `true` (Huruf **s**, **i**, **n**, **g** ada semua dan urut).

Sample 2:

- **Input:** `"abc"`
- **Input:** `"abracadabra"`
- **Output:** `true`

Sample 3:

- **Input:** `"abc"`
- **Input:** `"acb"`
- **Output:** `false` (Urutan salah, c muncul sebelum b).

### Aturan Main (Constraints)

- **Harus Urut:** Karakter 'a' harus muncul sebelum 'b', dan 'b' sebelum 'c'.
- **Boleh Lompat:** Karakter tidak harus nempel berdempetan. Boleh ada huruf sampah di antaranya.
- **Kasus:** Huruf kecil semua (abaikan huruf besar/kecil biar gampang).

### Analogi

Bayangkan kamu punya daftar belanja: `[Telur, Roti, Susu]`.
Kamu masuk ke lorong supermarket yang panjang.

1. Kamu jalan terus dari depan lorong sampai belakang (**Pointer J**).
2. Kamu pegang daftar belanjaan, telunjukmu menunjuk item pertama (**Pointer I**).
3. Kamu baru boleh centang "Roti" (geser **Pointer I**) kalau mata kamu sudah melihat "Telur".
4. Kalau sampai lorong habis tapi telunjukmu belum sampai bawah daftar belanja, berarti **false**.

### Detail Input & Output

**Contoh 1 (Berhasil):**

- **Input:** `kataSandi = "hello"`, `teks = "hello world"`
- **Output:** `true`
- **Penjelasan:** Huruf h, e, l, l, o muncul berurutan.

**Contoh 2 (Berhasil - Lompat):**

- **Input:** `kataSandi = "sing"`, `teks = "string"`
- **Output:** `true`
- **Penjelasan:**
  1. Ketemu **'s'** di "string".
  2. Huruf 't' dilewati.
  3. Ketemu **'i'** di "string".
  4. Huruf 'r' dilewati.
  5. ... dst sampai **'g'**. Urutannya pas.

**Contoh 3 (Gagal - Urutan Salah):**

- **Input:** `kataSandi = "abc"`, `teks = "acb"`
- **Output:** `false`
- **Penjelasan:** Di teks, huruf 'c' muncul duluan sebelum 'b'. Padahal di kata sandi, kita butuh 'b' dulu baru 'c'. Ingat, kita **tidak boleh mundur!**

---

### Bocoran Logika (Clue)

Gunakan Two Pointers dengan strategi **Fast & Slow** (mirip Level 2):

1. Pointer **`i`** menunjuk huruf pertama di `kataSandi`.
2. Pointer **`j`** menunjuk huruf pertama di `teks`.
3. Setiap putaran loop, **`j`** (si penjelajah) **SELALU** maju satu langkah.
4. Pointer **`i`** **HANYA** boleh maju kalau huruf yang ditunjuk `j` sama dengan huruf yang ditunjuk `i`.

**🏆 Kondisi Menang:**
Jika pointer **`i`** berhasil mencapai ujung panjang `kataSandi`, berarti semua huruf sudah ketemu!

_(Coba koding sendiri dulu sebelum melihat jawaban di bawah ini!)_

### Jawaban Kode Latihan

```javascript:solution.js
function isSubsequence(str1, str2) { let i = 0; // Pointer untuk
kataSandi let j = 0; // Pointer untuk teks panjang

    // Kita looping selama j belum habis
    while (j < str2.length) {
        // Jika hurufnya COCOK
        if (str1[i] === str2[j]) {
            i++; // Maju ke target huruf berikutnya
        }

        // Cek kemenangan: Apakah i sudah melewati huruf terakhir str1?
        if (i === str1.length) {
            return true; // Semua huruf ketemu!
        }

        j++; // j selalu jalan terus menyusuri teks
    }

    return false; // Loop teks habis, tapi i belum selesai

}
```

## Kesimpulan

Intinya, **Two Pointers** itu cuma permainan logika posisi. Daripada lari bolak-balik sendirian (**Nested Loop**), kamu pakai dua titik start untuk mempersempit ruang pencarian.

Cobalah ambil kertas, gambar kotak-kotak array dari soal di atas, lalu pakai **dua jari tanganmu** sebagai pointer. Simulasikan gerakannya seperti yang dijelaskan. Kalau jari kamu sudah paham, menulis kodenya pasti lancar.

Selamat mencoba! 🚀

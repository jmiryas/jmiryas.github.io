---
title: "Belajar VPS dari Nol — Part 5: Deploy Express.js & Next.js + PM2"
date: "Mar 23, 2026"
description: "Deploy Express.js dan Next.js ke VPS"
---

> **Seri ini terdiri dari 6 part:**
>
> - Part 1 — Mengenal VPS ✅
> - Part 2 — Setup Server: Nginx, PHP Multi-versi & Node.js Multi-versi ✅
> - Part 3 — Setup MySQL: Database Production & Staging ✅
> - Part 4 — Deploy Laravel & CodeIgniter 3 ke VPS ✅
> - **Part 5** — Deploy Express.js & Next.js + PM2 _(kamu di sini)_
> - Part 6 — Keamanan VPS: Setup UFW Firewall

---

Selamat datang di Part 5! Kalau kamu sudah sampai di sini, server kamu sudah cukup canggih — Nginx jalan, PHP multi-versi siap, database production & staging sudah terkonfigurasi, dan dua aplikasi PHP sudah live.

Sekarang kita beralih ke dunia **Node.js**. Di part ini kita akan deploy dua aplikasi:

1. **Express.js** — REST API sederhana, port `3000` (production) dan `3001` (staging)
2. **Next.js App Router** — aplikasi web sederhana, port `4000` (production) dan `4001` (staging)

Ada satu hal yang berbeda dengan aplikasi PHP — **aplikasi Node.js tidak dijalankan oleh Nginx secara langsung**. Aplikasi Node.js punya server sendiri yang berjalan di background. Nginx berperan sebagai **reverse proxy** — dia yang nerima request dari luar, lalu forward ke aplikasi Node.js yang jalan di port tertentu.

```
Browser → Nginx (port 3000) → forward → Express.js (port 3000 internal)
```

Dan satu masalah besar yang harus kita selesaikan: **kalau terminal SSH kamu ditutup, aplikasi Node.js ikut mati**. Untuk mengatasi ini, kita akan pakai **PM2** — process manager yang memastikan aplikasi Node.js selalu jalan, bahkan setelah server reboot sekalipun.

Yuk mulai!

---

## 1. Deploy Aplikasi Express.js

### 1.1 Buat Aplikasi Express.js Sederhana

Kita akan buat REST API sederhana — sebuah **API untuk daftar buku (books API)**. Simpel tapi cukup untuk menunjukkan bagaimana Express.js berjalan di VPS dengan environment production dan staging yang berbeda.

Buat di laptop kamu terlebih dahulu:

```bash
# Buat folder project
mkdir express-books-api
cd express-books-api

# Inisialisasi project Node.js
npm init -y

# Install Express dan dotenv
npm install express dotenv

# Install nodemon sebagai dev dependency (untuk development di lokal)
npm install --save-dev nodemon
```

**Buat file `.env.example`:**

```env
PORT=3000
NODE_ENV=production
APP_NAME=Books API
```

**Buat file `.gitignore`:**

```
node_modules/
.env
```

**Buat file `src/data.js`** — data statis sebagai pengganti database:

```javascript
const books = [
  {
    id: 1,
    title: "Laskar Pelangi",
    author: "Andrea Hirata",
    year: 2005,
  },
  {
    id: 2,
    title: "Bumi Manusia",
    author: "Pramoedya Ananta Toer",
    year: 1980,
  },
  {
    id: 3,
    title: "Cantik Itu Luka",
    author: "Eka Kurniawan",
    year: 2002,
  },
];

module.exports = books;
```

**Buat file `src/app.js`:**

```javascript
require("dotenv").config();
const express = require("express");

const app = express();
const books = require("./data");

app.use(express.json());

// Middleware untuk log setiap request
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Root endpoint — info API
app.get("/", (req, res) => {
  res.json({
    app: process.env.APP_NAME || "Books API",
    environment: process.env.NODE_ENV || "production",
    version: "1.0.0",
    endpoints: {
      books: "/api/books",
      book_detail: "/api/books/:id",
    },
  });
});

// GET semua buku
app.get("/api/books", (req, res) => {
  res.json({
    success: true,
    environment: process.env.NODE_ENV,
    total: books.length,
    data: books,
  });
});

// GET satu buku berdasarkan ID
app.get("/api/books/:id", (req, res) => {
  const book = books.find((b) => b.id === parseInt(req.params.id));

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Buku tidak ditemukan",
    });
  }

  res.json({
    success: true,
    data: book,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.url} tidak ditemukan`,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `[${process.env.APP_NAME}] Environment : ${process.env.NODE_ENV}`,
  );
  console.log(`[${process.env.APP_NAME}] Server jalan di port ${PORT}`);
});

module.exports = app;
```

**Edit `package.json`** — tambahkan scripts:

```json
{
  "name": "express-books-api",
  "version": "1.0.0",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "dotenv": "^16.0.0",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

**Test di lokal dulu:**

```bash
# Buat file .env untuk lokal
cp .env.example .env
# Edit .env: set NODE_ENV=development

npm run dev
# Buka http://localhost:3000
```

**Push ke GitHub/GitLab:**

```bash
git init
git remote add origin git@github.com:username/express-books-api.git
git add .
git commit -m "Initial commit: Express Books API"
git push -u origin main

# Buat branch dev untuk staging
git checkout -b dev
git push -u origin dev
```

### 1.2 Clone Repository ke VPS

Di terminal SSH VPS:

```bash
# Clone untuk production (branch main)
git clone -b main git@github.com:username/express-books-api.git /var/www/express-books-production

# Clone untuk staging (branch dev)
git clone -b dev git@github.com:username/express-books-api.git /var/www/express-books-staging
```

### 1.3 Install Dependencies di Server

```bash
# Production
cd /var/www/express-books-production
npm install --omit=dev

# Staging
cd /var/www/express-books-staging
npm install
```

> **`--omit=dev`** artinya kita skip install `devDependencies` di production — kita tidak butuh `nodemon` di server, hanya di lokal.

### 1.4 Buat File .env di Server

**Production:**

```bash
cd /var/www/express-books-production
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
APP_NAME=Books API
EOF
```

**Staging:**

```bash
cd /var/www/express-books-staging
cat > .env << 'EOF'
PORT=3001
NODE_ENV=staging
APP_NAME=Books API
EOF
```

### 1.5 Test Jalankan Aplikasi Secara Manual

Sebelum setup PM2, pastikan aplikasinya bisa jalan dulu:

```bash
# Test production
cd /var/www/express-books-production
node src/app.js

# Kalau muncul pesan "Server jalan di port 3000", berarti OK
# Tekan Ctrl+C untuk stop
```

### 1.6 Setup Nginx sebagai Reverse Proxy untuk Express

**Production (port 3000):**

```bash
nano /etc/nginx/sites-available/express-production
```

```nginx
server {
    listen 3000;
    server_name _;

    access_log /var/log/nginx/express-production.access.log;
    error_log  /var/log/nginx/express-production.error.log;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> **Tunggu dulu — ini membingungkan!** Kenapa `listen 3000` dan `proxy_pass` juga ke `127.0.0.1:3000`? Bukankah itu sama?
>
> Sebenarnya di konfigurasi ini, Nginx **mendengarkan** di port 3000 dan meneruskan request ke aplikasi Express yang **juga** jalan di port 3000. Keduanya memang pakai port yang sama. Yang membedakan adalah: Nginx mendengarkan dari **semua interface** (termasuk IP publik), sedangkan Express hanya terikat ke `127.0.0.1` (localhost). Nginx yang jadi "pintu depan" yang bisa diakses publik, Express yang jadi "pemroses" di belakang layar.
>
> Ini konsep reverse proxy yang paling sederhana. Di lingkungan yang lebih kompleks, Nginx akan listen di port 80/443, dan meneruskan ke port aplikasi yang tidak terekspos ke publik.

**Staging (port 3001):**

```bash
nano /etc/nginx/sites-available/express-staging
```

```nginx
server {
    listen 3001;
    server_name _;

    access_log /var/log/nginx/express-staging.access.log;
    error_log  /var/log/nginx/express-staging.error.log;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Aktifkan dan reload:**

```bash
ln -s /etc/nginx/sites-available/express-production /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/express-staging    /etc/nginx/sites-enabled/

nginx -t
systemctl reload nginx
```

---

## 2. Deploy Aplikasi Next.js App Router

### 2.1 Buat Aplikasi Next.js Sederhana

Kita buat aplikasi Next.js sederhana — sebuah **halaman profil (profile page)** yang menampilkan data dari sebuah JSON sederhana. Cukup untuk membuktikan Next.js bisa jalan di VPS dengan baik.

Buat di laptop kamu:

```bash
# Buat project Next.js dengan App Router
npx create-next-app@latest nextjs-profile --typescript --tailwind --app --no-src-dir --import-alias "@/*"

cd nextjs-profile
```

**Edit `app/page.tsx`:**

```tsx
const profile = {
  name: "Budi Developer",
  role: "Fullstack Developer",
  bio: "Suka ngoprek VPS, ngopi, dan nulis kode sampai tengah malam.",
  skills: ["Laravel", "CodeIgniter", "Express.js", "Next.js", "MySQL"],
  projects: [
    { name: "Laravel Notes", tech: "Laravel 11", port: 8000 },
    { name: "CI3 Guestbook", tech: "CodeIgniter 3", port: 8010 },
    { name: "Books API", tech: "Express.js", port: 3000 },
    { name: "Profile Page", tech: "Next.js 15", port: 4000 },
  ],
};

export default function Home() {
  const env = process.env.NODE_ENV;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Environment Badge */}
        <div className="flex justify-end mb-4">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${
              env === "production" ? "bg-red-500" : "bg-green-500"
            }`}
          >
            {env?.toUpperCase()}
          </span>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl mb-4">
            👨‍💻
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-blue-600 font-medium mt-1">{profile.role}</p>
          <p className="text-gray-500 mt-3">{profile.bio}</p>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Aplikasi di VPS Ini
          </h2>
          <div className="space-y-3">
            {profile.projects.map((project) => (
              <div
                key={project.name}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-800">{project.name}</p>
                  <p className="text-sm text-gray-500">{project.tech}</p>
                </div>
                <span className="text-sm font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  :{project.port}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
```

**Edit `next.config.ts`** — tambahkan konfigurasi untuk production:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

> **Kenapa `output: 'standalone'`?**
> Mode `standalone` membuat Next.js mengemas semua yang dibutuhkan ke dalam satu folder `.next/standalone`. Ini membuat deployment ke VPS jauh lebih mudah karena kita tidak perlu install semua `node_modules` di server — cukup copy folder standalone-nya saja.

**Test di lokal:**

```bash
npm run dev
# Buka http://localhost:3000
```

**Build untuk production:**

```bash
npm run build
```

Setelah build, cek folder `.next/standalone` — ini yang akan kita upload ke server.

**Buat `.gitignore`** — pastikan file ini ada:

```
node_modules/
.next/
.env*.local
.env.production
.env.staging
```

**Push ke GitHub/GitLab:**

```bash
git init
git remote add origin git@github.com:username/nextjs-profile.git
git add .
git commit -m "Initial commit: Next.js Profile"
git push -u origin main

git checkout -b dev
git push -u origin dev
```

### 2.2 Clone dan Build di VPS

Di terminal SSH VPS:

```bash
# Clone untuk production
git clone -b main git@github.com:username/nextjs-profile.git /var/www/nextjs-profile-production

# Clone untuk staging
git clone -b dev git@github.com:username/nextjs-profile.git /var/www/nextjs-profile-staging
```

**Install dependencies dan build:**

```bash
# Production
cd /var/www/nextjs-profile-production
npm install
npm run build

# Staging
cd /var/www/nextjs-profile-staging
npm install
npm run build
```

> **Catatan:** Proses build di VPS membutuhkan waktu lebih lama dibanding di lokal, terutama untuk VPS dengan RAM kecil. Sabar ya!

### 2.3 Buat File .env di Server

**Production:**

```bash
cd /var/www/nextjs-profile-production
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=4000
EOF
```

**Staging:**

```bash
cd /var/www/nextjs-profile-staging
cat > .env.staging << 'EOF'
NODE_ENV=staging
PORT=4001
EOF
```

### 2.4 Test Jalankan Aplikasi Secara Manual

```bash
# Test production
cd /var/www/nextjs-profile-production
PORT=4000 node .next/standalone/server.js

# Kalau muncul "Ready - started server on 0.0.0.0:4000", berarti OK
# Tekan Ctrl+C untuk stop
```

### 2.5 Setup Nginx sebagai Reverse Proxy untuk Next.js

**Production (port 4000):**

```bash
nano /etc/nginx/sites-available/nextjs-production
```

```nginx
server {
    listen 4000;
    server_name _;

    access_log /var/log/nginx/nextjs-production.access.log;
    error_log  /var/log/nginx/nextjs-production.error.log;

    # Serve static files Next.js langsung dari Nginx (lebih cepat)
    location /_next/static/ {
        alias /var/www/nextjs-profile-production/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Staging (port 4001):**

```bash
nano /etc/nginx/sites-available/nextjs-staging
```

```nginx
server {
    listen 4001;
    server_name _;

    access_log /var/log/nginx/nextjs-staging.access.log;
    error_log  /var/log/nginx/nextjs-staging.error.log;

    location /_next/static/ {
        alias /var/www/nextjs-profile-staging/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass         http://127.0.0.1:4001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Aktifkan dan reload:**

```bash
ln -s /etc/nginx/sites-available/nextjs-production /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/nextjs-staging    /etc/nginx/sites-enabled/

nginx -t
systemctl reload nginx
```

---

## 3. Pakai PM2 agar Aplikasi Node.js Selalu Jalan

### 3.1 Apa Itu PM2 dan Kenapa Penting?

Coba bayangkan kamu sudah berhasil jalankan Express dan Next.js di server. Semuanya jalan dengan baik. Lalu kamu tutup terminal SSH kamu — dan tiba-tiba semua aplikasi Node.js **mati**.

Atau, server reboot karena update otomatis — dan semua aplikasi tidak nyala lagi sampai kamu SSH dan jalankan manual.

Ini masalah nyata yang akan kamu hadapi kalau deploy Node.js tanpa process manager.

**PM2** (Process Manager 2) adalah solusinya. PM2 adalah process manager untuk Node.js yang:

- 🔄 **Restart otomatis** jika aplikasi crash
- 🚀 **Auto-start** setelah server reboot
- 📋 **Kelola banyak aplikasi** sekaligus dari satu tempat
- 📊 **Monitoring** penggunaan CPU dan RAM secara real-time
- 📝 **Log management** yang rapi

### 3.2 Install PM2

```bash
# Install PM2 secara global menggunakan npm
npm install -g pm2

# Verifikasi instalasi
pm2 --version
```

### 3.3 Jalankan Aplikasi dengan PM2

```bash
# Jalankan Express production
pm2 start /var/www/express-books-production/src/app.js \
    --name "express-production" \
    --env production

# Jalankan Express staging
pm2 start /var/www/express-books-staging/src/app.js \
    --name "express-staging" \
    --env staging

# Jalankan Next.js production
pm2 start /var/www/nextjs-profile-production/.next/standalone/server.js \
    --name "nextjs-production" \
    --env production

# Jalankan Next.js staging
PORT=4001 pm2 start /var/www/nextjs-profile-staging/.next/standalone/server.js \
    --name "nextjs-staging"
```

Cek semua aplikasi yang sedang jalan:

```bash
pm2 list
```

Output yang kamu harapkan:

```
┌─────┬──────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id  │ name                 │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │
├─────┼──────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 0   │ express-production   │ default     │ 1.0.0   │ fork    │ 12345    │ 2m     │ 0    │ online    │
│ 1   │ express-staging      │ default     │ 1.0.0   │ fork    │ 12346    │ 2m     │ 0    │ online    │
│ 2   │ nextjs-production    │ default     │ N/A     │ fork    │ 12347    │ 2m     │ 0    │ online    │
│ 3   │ nextjs-staging       │ default     │ N/A     │ fork    │ 12348    │ 2m     │ 0    │ online    │
└─────┴──────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

Kolom `status` harus **online** untuk semua aplikasi. Kolom `↺` menunjukkan berapa kali aplikasi sudah di-restart — kalau angkanya terus naik, ada masalah di aplikasinya.

### 3.4 Perintah-Perintah PM2 yang Wajib Tahu

```bash
# Lihat semua aplikasi yang dikelola PM2
pm2 list

# Lihat detail status satu aplikasi
pm2 show express-production

# Stop satu aplikasi
pm2 stop express-staging

# Start aplikasi yang sudah di-stop
pm2 start express-staging

# Restart satu aplikasi (berguna setelah update kode)
pm2 restart express-production

# Restart SEMUA aplikasi sekaligus
pm2 restart all

# Hapus aplikasi dari daftar PM2
pm2 delete express-staging

# Lihat log real-time semua aplikasi
pm2 logs

# Lihat log satu aplikasi tertentu
pm2 logs express-production

# Lihat 100 baris terakhir log
pm2 logs express-production --lines 100

# Monitor penggunaan CPU dan RAM secara real-time
pm2 monit
```

### 3.5 Buat ecosystem.config.js

Daripada ingat-ingat perintah panjang untuk setiap aplikasi, lebih baik kita buat satu file konfigurasi yang mendefinisikan semua aplikasi sekaligus. File ini namanya `ecosystem.config.js`.

```bash
nano /var/www/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    // Express.js — Production
    {
      name: "express-production",
      script: "/var/www/express-books-production/src/app.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },

    // Express.js — Staging
    {
      name: "express-staging",
      script: "/var/www/express-books-staging/src/app.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "staging",
        PORT: 3001,
      },
    },

    // Next.js — Production
    {
      name: "nextjs-production",
      script: "/var/www/nextjs-profile-production/.next/standalone/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        HOSTNAME: "0.0.0.0",
      },
    },

    // Next.js — Staging
    {
      name: "nextjs-staging",
      script: "/var/www/nextjs-profile-staging/.next/standalone/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "staging",
        PORT: 4001,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
```

**Penjelasan beberapa opsi penting:**

| Opsi                 | Penjelasan                                                                   |
| -------------------- | ---------------------------------------------------------------------------- |
| `instances`          | Berapa proses yang dijalankan. `1` untuk sekarang sudah cukup.               |
| `autorestart`        | Restart otomatis kalau aplikasi crash. Selalu `true`.                        |
| `watch`              | Pantau perubahan file dan restart otomatis. Matikan (`false`) di production. |
| `max_memory_restart` | Restart otomatis kalau penggunaan RAM melebihi batas ini.                    |

**Stop semua aplikasi yang jalan manual tadi, lalu jalankan ulang dengan ecosystem:**

```bash
# Stop dan hapus semua yang lama
pm2 delete all

# Jalankan semua menggunakan ecosystem.config.js
pm2 start /var/www/ecosystem.config.js

# Cek hasilnya
pm2 list
```

### 3.6 Setup PM2 Startup — Auto-Start Setelah Reboot

Ini langkah yang **paling sering dilupakan** dan paling penting:

```bash
# Generate perintah startup
pm2 startup
```

PM2 akan print sebuah perintah yang perlu kamu jalankan. Outputnya akan terlihat seperti ini:

```
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/home/user/.nvm/versions/node/v22.x.x/bin /home/user/.nvm/versions/node/v22.x.x/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

**Copy dan jalankan perintah `sudo env PATH=...` tersebut.** Perintahnya akan berbeda di setiap server tergantung versi Node.js dan user yang kamu pakai — jangan asal copy dari tutorial ini, gunakan output dari server kamu sendiri.

Setelah itu, simpan daftar aplikasi yang sedang jalan:

```bash
# Simpan list aplikasi saat ini agar PM2 ingat apa yang harus dijalankan saat startup
pm2 save
```

**Test apakah startup sudah benar:**

```bash
# Simulasikan reboot (ini hanya me-reset PM2, bukan reboot server)
pm2 kill

# PM2 seharusnya otomatis restart semua aplikasi
# Tunggu beberapa detik, lalu cek
pm2 list
```

Atau kalau kamu berani, reboot server beneran:

```bash
reboot
```

Setelah server nyala kembali dan kamu SSH lagi, jalankan `pm2 list` — semua aplikasi seharusnya sudah jalan otomatis.

---

## 4. Verifikasi Semua Aplikasi Berjalan

Setelah semua setup selesai, ini saatnya test semua aplikasi dari browser:

```bash
# Cek status PM2
pm2 list

# Cek status Nginx
systemctl status nginx
```

Buka browser dan akses semua aplikasi:

| Aplikasi           | URL                  |
| ------------------ | -------------------- |
| Laravel Production | `http://IP-VPS:8000` |
| Laravel Staging    | `http://IP-VPS:8001` |
| CI3 Production     | `http://IP-VPS:8010` |
| CI3 Staging        | `http://IP-VPS:8011` |
| Express Production | `http://IP-VPS:3000` |
| Express Staging    | `http://IP-VPS:3001` |
| Next.js Production | `http://IP-VPS:4000` |
| Next.js Staging    | `http://IP-VPS:4001` |

Kalau semua 8 URL bisa diakses — selamat, server kamu sekarang menjalankan **8 aplikasi sekaligus**! 🎉

---

## Alur Update Aplikasi Node.js

Setiap kali ada update kode, ini alur yang kamu pakai:

**Untuk Express.js:**

```bash
# Production
cd /var/www/express-books-production
git pull origin main
npm install --omit=dev
pm2 restart express-production

# Staging
cd /var/www/express-books-staging
git pull origin dev
npm install
pm2 restart express-staging
```

**Untuk Next.js:**

```bash
# Production
cd /var/www/nextjs-profile-production
git pull origin main
npm install
npm run build
pm2 restart nextjs-production

# Staging
cd /var/www/nextjs-profile-staging
git pull origin dev
npm install
npm run build
pm2 restart nextjs-staging
```

---

## Troubleshooting Umum

### Aplikasi tidak muncul di `pm2 list` setelah reboot

Kemungkinan besar `pm2 save` belum dijalankan atau perintah startup belum dieksekusi:

```bash
pm2 startup     # Jalankan ulang, copy dan eksekusi perintahnya
pm2 save        # Simpan list aplikasi yang sedang jalan
```

### Status PM2 `errored` atau restart terus-menerus

Aplikasinya crash saat startup. Cek lognya:

```bash
pm2 logs nama-aplikasi --lines 50
```

Paling sering penyebabnya: file `.env` tidak ada, atau ada typo di path file.

### Next.js: Error "Could not find a production build"

Ini artinya proses build belum selesai atau gagal:

```bash
cd /var/www/nextjs-profile-production
npm run build   # Jalankan ulang build
pm2 restart nextjs-production
```

### Next.js: Halaman muncul tapi gambar/CSS hilang

Pastikan konfigurasi Nginx untuk `/_next/static/` sudah benar dan path `alias` mengarah ke folder yang tepat.

### Nginx: 502 Bad Gateway

Artinya Nginx bisa jalan tapi tidak bisa reach ke aplikasi Node.js di backend. Kemungkinan:

1. Aplikasi Node.js belum jalan — cek `pm2 list`
2. Port aplikasi tidak sesuai dengan yang dikonfigurasi di Nginx

```bash
# Pastikan port yang dipakai aplikasi sesuai dengan proxy_pass di Nginx
pm2 show express-production | grep port
```

---

## Rangkuman Part 5

Di part ini kita sudah:

- ✅ Membuat **Express.js Books API** dan deploy ke VPS (production port `3000`, staging port `3001`)
- ✅ Membuat **Next.js Profile Page** dan deploy ke VPS (production port `4000`, staging port `4001`)
- ✅ Setup **Nginx sebagai reverse proxy** untuk kedua aplikasi Node.js
- ✅ Install dan konfigurasi **PM2** untuk menjaga semua aplikasi tetap jalan
- ✅ Membuat `ecosystem.config.js` untuk manajemen semua aplikasi dari satu file
- ✅ Setup **PM2 startup** agar semua aplikasi otomatis jalan setelah server reboot

Server kita sekarang menjalankan **8 aplikasi sekaligus** — 4 production dan 4 staging — semua terisolasi di port masing-masing!

---

## Selanjutnya: Part 6 — Keamanan VPS dengan UFW

Kita hampir selesai! Di **Part 6** — part terakhir dari seri ini — kita akan menutup semua port yang tidak perlu dengan **UFW (firewall)**. Selama ini semua port di server kita masih terbuka lebar, siapapun bisa mengaksesnya. Kita perlu tutup itu dan hanya biarkan port yang kita izinkan saja yang bisa diakses dari luar.

Sampai ketemu di Part 6 — the final chapter! 🚀

---

_Tips: Kalau VPS kamu punya RAM kecil (1GB atau 2GB) dan terasa lambat saat build Next.js, kamu bisa tambahkan swap memory sementara. Cari tutorial "add swap ubuntu" — ini sangat membantu untuk VPS dengan resource terbatas._

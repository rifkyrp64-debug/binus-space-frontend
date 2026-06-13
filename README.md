# 🏫 Binus Space — Frontend

> Antarmuka pengguna (UI) untuk **Binus Space**, sistem peminjaman ruangan kampus berbasis web.

![Frontend](https://img.shields.io/badge/frontend-React-blue)
![Build](https://img.shields.io/badge/build-Vite-purple)
![Styling](https://img.shields.io/badge/styling-Tailwind%20CSS-38BDF8)
![Deploy](https://img.shields.io/badge/deploy-Vercel-black)

---

## 📋 Tentang

Repository ini berisi **frontend** dari aplikasi Binus Space, dibangun menggunakan **React** dan **Tailwind CSS**. Aplikasi ini berkomunikasi dengan REST API yang dibangun terpisah menggunakan Laravel, melalui HTTP request dengan Axios.

🔗 **Repository Backend:** [binus-space-backend](https://github.com/rifkyrp64-debug/binus-space-backend)

---

## 🌐 Demo

- **Website (Live):** https://binus-space-frontend.vercel.app
- **API (Backend):** https://binus-space-backend.onrender.com

> ⚠️ Backend di-host pada paket gratis Render yang menonaktifkan layanan saat tidak aktif. Akses pertama setelah idle membutuhkan beberapa puluh detik untuk aktif kembali.

---

## ✨ Fitur

### Untuk Pengguna
- Melihat daftar ruangan dengan **pencarian** (nama/gedung) dan **filter kategori** (Kelas/Lab).
- **Booking ruangan** melalui form bertahap (3 langkah): pilih jadwal, isi data pemohon, konfirmasi.
- Format tanggal DD/MM/YYYY dan waktu 24 jam yang konsisten.
- Tampilan **"Jadwal Sudah Terisi"** untuk menghindari bentrok jadwal.

### Untuk Admin
- **Login multi-admin** dengan autentikasi berbasis database.
- Dashboard untuk melihat dan mengelola seluruh permohonan booking.
- **Filter** berdasarkan status: Semua, Menunggu, Disetujui, Selesai, Ditolak.
- **Menyetujui / menolak** permohonan, dengan alasan penolakan dan pelacakan nama admin yang memproses.

---

## 🛠️ Teknologi

- **React** — library antarmuka
- **Vite** — build tool & development server
- **Tailwind CSS** — styling utility-first
- **Axios** — HTTP client untuk komunikasi dengan REST API
- **Lucide React** — pustaka ikon

---

## 🚀 Cara Menjalankan (Lokal)

### Prasyarat
- Node.js dan NPM terinstall
- Backend Laravel sudah berjalan (lihat repo backend)

### Langkah-langkah

```bash
# Clone repository
git clone https://github.com/rifkyrp64-debug/binus-space-frontend.git
cd binus-space-frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

### Konfigurasi Alamat API

Alamat backend diatur melalui environment variable `VITE_API_BASE`. Buat file `.env` di root project:

```env
VITE_API_BASE=http://127.0.0.1:8000/api
```

> Jika `VITE_API_BASE` tidak diatur, aplikasi otomatis menggunakan `http://127.0.0.1:8000/api` sebagai default. Untuk produksi (Vercel), variabel ini diatur menunjuk ke URL backend di Render.

---

## 📂 Struktur Utama

```
binus-space-frontend/
├── src/
│   ├── App.jsx          # Komponen utama aplikasi
│   └── assets/          # Gambar (logo, foto ruangan)
├── public/
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## ☁️ Deployment

Frontend di-deploy ke **Vercel**. Setiap push ke branch utama akan otomatis memicu build dan deployment ulang. Environment variable `VITE_API_BASE` diatur pada dashboard Vercel agar terhubung ke backend produksi.

---

## 👥 Tim Pengembang

| Nama | NIM |
|------|-----|
| Muhamad Rifki Perkasa | 2802479413 |
| Aria Rahmatanto Putro | 2802495032 |
| Malvin Yonatan Muliawan | 2802480232 |
| Charly Prayoga | 2802486904 |

---

## 📄 Lisensi

Proyek ini dibuat untuk memenuhi tugas mata kuliah **COMP6100001 — Software Engineering**, Universitas Bina Nusantara.

---

_Dikembangkan oleh Tim Binus Space — 2026_

# PANDUAN PENGGUNAAN & DEPLOY: LOSCLASICOS PRE-ORDER

Sistem pemesanan merchandise/sticker **losclasicos**: pembeli mengisi data diri & kata-kata hari ini, melihat countdown waktu pemesanan, scan QRIS, upload bukti bayar, dan mengunduh struk digital resmi. Admin dapat dengan mudah mengatur batas waktu countdown, mengganti foto QRIS, dan melihat siapa saja yang memesan.

---

## 📁 Berkas Proyek

```
d:/pesen/
├── index.html   (Halaman pembeli: Countdown Lucu, Form Data Diri + Kata-Kata, QRIS, Upload Bukti, Struk Digital PNG)
├── admin.html   (Dashboard Admin Simpel: Atur Countdown, Ganti Foto QRIS, Cek Siapa Saja yang Pesan)
├── Code.gs      (Backend Google Apps Script: Database Spreadsheet + Simpan Foto Bukti ke Google Drive)
└── README.md    (Panduan ini)
```

---

## ✨ FITUR UTAMA TERBARU

### 1. Countdown Waktu Pemesanan Lucu (`index.html`)
- Terletak tepat di bawah bar navigasi utama.
- Maskot jam kartun `⏰` beranimasi lucu.
- Kartu digit Hari, Jam, Menit, dan Detik (berkedip warna pink neon).
- Micro-copy ramah Gen Z: *"Buruan amankan slot sebelum waktu habis ya min! ✨"*.
- Jika waktu pemesanan habis: Form otomatis terkunci dan muncul pemberitahuan *"Waktu habis, yah tutup deh! Sampai jumpa di batch berikutnya 🥺"*.

### 2. Dashboard Admin yang Disederhanakan (`admin.html`)
Dashboard dibuat sangat simpel dan fokus pada 2 fungsi utama:
- **Tab 1: 👥 Siapa Saja yang Pesan**
  - Ringkasan metrik: Total Pemesan, Perlu Dicek, dan Sudah Sah.
  - Kartu pemesan yang rapi: Nama pembeli, **Tombol Chat WhatsApp** langsung, **Kata-Kata Hari Ini**, dan **Tombol Lihat Bukti Foto** (membuka modal foto transfer asli).
  - Ubah status instan: *Belum Dicek*, *Sah / Lunas*, atau *Batal*.
  - Pencarian dan tombol *Export CSV* (bisa dibuka di Excel).
- **Tab 2: ⚙️ Atur Countdown & Foto QRIS**
  - **Atur Countdown**: Pilih tanggal & jam tutup pemesanan, atau klik preset cepat (+1 Hari, +3 Hari, +7 Hari, atau Tutup Sekarang).
  - **Atur Foto QRIS**: Masukkan link URL gambar QRIS atau upload file foto QRIS langsung dari HP/komputer.
  - Klik **"Simpan Pengaturan Toko"**: Pengaturan langsung aktif di web pembeli!

---

## 🚀 PANDUAN DEPLOY GOOGLE APPS SCRIPT (BACKEND GRATIS)

1. Buat Google Sheet baru di [sheets.new](https://sheets.new).
2. Klik **Extensions (Ekstensi)** > **Apps Script**.
3. Hapus kode bawaan, tempelkan seluruh isi berkas `Code.gs`.
4. Buka **Project Settings (Setelan Proyek)** di bilah kiri > **Script Properties (Properti Skrip)**:
   - Tambahkan property: `ADMIN_TOKEN`
   - Value: Masukkan password adminmu (contoh: `losclasicos2026`).
5. Klik **Deploy** > **New deployment** > pilih type **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Web App URL kamu saat ini sudah aktif dan terpasang di `index.html` dan `admin.html`:
   `https://script.google.com/macros/s/AKfycbyd8odu1Myc05Q_pSci5cKZCUEXJqicNlfwbXYaAh1t9Jk2RZkGp8rU6AP4jGKa9by2lQ/exec`

---

## 🌐 PANDUAN UPLOAD WEB (Cloudflare Pages / Netlify)

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com/) (atau [app.netlify.com/drop](https://app.netlify.com/drop)).
2. Pilih upload langsung folder `d:/pesen` (atau file `index.html` dan `admin.html`).
3. Website langsung aktif:
   - Halaman Pembeli: `https://namasitus.pages.dev/`
   - Dashboard Admin: `https://namasitus.pages.dev/admin.html`

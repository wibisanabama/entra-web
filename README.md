# Entra Web

Aplikasi web portal publik dan dashboard manajemen event untuk platform Entra, dibangun menggunakan Next.js (App Router), React, TypeScript, dan Tailwind CSS.

## Fitur Utama

- Portal Publik: Pencarian dan penjelajahan katalog event, filter kategori, detail event, dan pembelian tiket online.
- Transaksi dan Pembayaran: Integrasi Midtrans Snap untuk pembayaran digital (QRIS, Virtual Account, dan E-Wallet).
- Tiket Digital: Manajemen e-ticket berbasis QR code dinamis, bukti pembelian, dan transfer kepemilikan tiket.
- Dompet Cashless: Cek saldo digital, riwayat transaksi, dan simulasi top-up.
- Dashboard Organizer: Manajemen pembuatan dan penyuntingan event, kuota tier tiket, pemantauan daftar peserta, dan laporan penjualan.
- Manajemen Finansial: Pengajuan pencairan saldo pendapatan tiket (withdrawal) ke rekening bank serta panel persetujuan admin.

## Prasyarat Sistem

- Node.js versi 20.9.0 atau lebih baru
- npm versi 10.0.0 atau lebih baru
- Backend Entra API yang aktif dan dapat diakses melalui jaringan

## Konfigurasi Lingkungan

Salin berkas konfigurasi lingkungan pada direktori root proyek:

```bash
cp .env.example .env.local
```

Atau menggunakan PowerShell pada Windows:

```powershell
Copy-Item .env.example .env.local
```

Sesuaikan parameter berikut pada berkas `.env.local`:

| Parameter | Keterangan | Nilai Bawaan |
| --- | --- | --- |
| `NEXT_PUBLIC_AUTH_API_URL` | URL basis auth-service | http://localhost:8081 |
| `NEXT_PUBLIC_EVENT_API_URL` | URL basis event-service | http://localhost:8082 |
| `NEXT_PUBLIC_TICKET_API_URL` | URL basis ticket-service | http://localhost:8083 |
| `NEXT_PUBLIC_PAYMENT_API_URL` | URL basis payment-service | http://localhost:8084 |
| `NEXT_PUBLIC_CASHLESS_API_URL` | URL basis cashless-service | http://localhost:8085 |
| `NEXT_PUBLIC_GATE_API_URL` | URL basis gate-service | http://localhost:8086 |
| `NEXT_PUBLIC_STORAGE_API_URL` | URL basis storage-service | http://localhost:8087 |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Client Key Midtrans Sandbox untuk frontend | Sesuai akun Midtrans |

Catatan: Seluruh variabel berawalan `NEXT_PUBLIC_` terekspos ke sisi peramban (browser) dan harus mengarah ke host backend yang dapat diakses oleh client.

## Instalasi dan Menjalankan Aplikasi

### 1. Instalasi Dependensi

```bash
npm install
```

### 2. Menjalankan Server Pengembangan

```bash
npm run dev
```

Aplikasi dapat diakses melalui peramban pada alamat [http://localhost:3000](http://localhost:3000).

### 3. Build Produksi dan Eksekusi

```bash
# Kompilasi build produksi
npm run build

# Menjalankan server produksi
npm start
```

## Pengujian dan Kualitas Kode

```bash
# Menjalankan unit test
npm test

# Menjalankan linter kode
npx eslint src
```

## Struktur Direktori

```text
entra-web/
├── public/                 # Aset statis publik (gambar, ikon, logo)
├── src/
│   ├── app/
│   │   ├── (public)/       # Rute portal publik (katalog event, tiket saya, cashless, autentikasi)
│   │   └── (dashboard)/    # Rute dashboard organizer dan panel persetujuan admin
│   ├── components/
│   │   ├── features/       # Komponen spesifik modul bisnis (e-ticket, checkout, QR selector)
│   │   ├── layout/         # Komponen tata letak (navbar, sidebar, topbar, footer)
│   │   └── ui/             # Komponen antarmuka dasar berbasis Tailwind CSS
│   ├── lib/                # Klien HTTP Axios/Fetch, utilitas formatting, dan toast
│   ├── providers/          # React Context providers (autentikasi, session, react-query)
│   └── types/              # Definisi tipe TypeScript
├── next.config.ts          # Konfigurasi Next.js
├── tailwind.config.ts      # Konfigurasi styling Tailwind CSS
└── tsconfig.json           # Konfigurasi kompilator TypeScript
```

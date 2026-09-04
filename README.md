# Entra Web

Aplikasi web Entra untuk pencarian event, pembelian tiket, dan pengelolaan event oleh organizer.

## Fitur

- Katalog event, detail event, dan checkout tiket.
- Akun pengguna, profil, tiket QR, dan transfer tiket.
- Dompet cashless, top-up, dan riwayat transaksi.
- Dashboard organizer untuk event, jenis tiket, venue, pesanan, peserta, dan media.
- Pengajuan withdrawal organizer dan pengelolaan statusnya oleh admin.

## Teknologi

Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, dan TanStack Query 5.

## Prasyarat

- Node.js 20.9.0 atau lebih baru dan npm.
- Layanan [Entra API](https://github.com/wibisanabama/entra-api) yang sudah dikonfigurasi dan berjalan.

## Instalasi

```bash
git clone https://github.com/wibisanabama/entra-web.git
cd entra-web
npm ci
```

Buat `.env.local` di root repositori. Jika file sudah ada, sesuaikan nilainya tanpa menimpa konfigurasi yang masih digunakan:

```dotenv
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8081
NEXT_PUBLIC_EVENT_API_URL=http://localhost:8082
NEXT_PUBLIC_TICKET_API_URL=http://localhost:8083
NEXT_PUBLIC_PAYMENT_API_URL=http://localhost:8084
NEXT_PUBLIC_CASHLESS_API_URL=http://localhost:8085
NEXT_PUBLIC_GATE_API_URL=http://localhost:8086
NEXT_PUBLIC_STORAGE_API_URL=http://localhost:8087
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
```

Isi client key Midtrans Sandbox untuk checkout. Server key hanya boleh disimpan di backend, bukan pada variabel `NEXT_PUBLIC_*`.

URL API harus dapat dijangkau browser pengguna. `localhost` hanya sesuai jika browser dan backend berjalan pada komputer yang sama. Halaman yang mengambil data di server juga memerlukan akses ke URL tersebut.

## Menjalankan aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Pemeriksaan dan build

```bash
npm run lint
npm test
npm run build
npm start
```

`npm start` menjalankan hasil build, bukan server pengembangan. Tetapkan variabel `NEXT_PUBLIC_*` sebelum build; perubahan nilainya memerlukan build ulang.

## Struktur

- `src/app/(public)/`: katalog, autentikasi, profil, tiket, dan cashless.
- `src/app/(dashboard)/`: dashboard organizer dan admin.
- `src/components/`: komponen UI, layout, dan fitur.
- `src/lib/api.ts`: klien API dan pembaruan access token.
- `src/providers/`: state autentikasi, query, dan tema.
- `src/types/`: definisi tipe data.
- `public/`: aset statis.

## Catatan integrasi

Aplikasi memanggil layanan backend secara langsung. Checkout menggunakan Midtrans Sandbox; fitur pembayaran, media, dan cashless memerlukan konfigurasi layanan terkait. Pembatasan akses tetap harus diterapkan oleh backend.

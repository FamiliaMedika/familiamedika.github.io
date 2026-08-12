# Sahabat Familia

Aplikasi pasien dan keluarga Familia Medika.

## Identitas

- Nama: **Sahabat Familia**
- Endorsement: **by Familia Medika**
- Tagline: **Kesehatan Keluarga, Lebih Dekat**
- Web/PWA path: `/sahabat/`
- Rencana domain: `sahabat.familiamedika.id`
- Android package/iOS bundle target: `id.familiamedika.sahabat`

## Fitur MVP

- Registrasi dan login email pasien
- Pemulihan dan perubahan kata sandi
- Profil utama dan maksimal 10 anggota keluarga
- Katalog layanan Familia Medika
- Pemesanan Klinik, Online, dan Home Visit
- Asesmen awal serta peringatan tanda bahaya
- Status pemesanan dan pembatalan mandiri pada status yang diizinkan
- Notifikasi internal pasien
- Dokumen kesehatan final dan tagihan yang diterbitkan
- PWA Android/iPhone dengan shell offline; data klinis tetap network-only

## Arsitektur

```text
Sahabat Familia Web/PWA
        │
        ├── Supabase Auth pasien
        ├── Patient Portal DB + RLS
        └── assessment_requests
                 │
                 ▼
         FamiCare staff-bridge
                 │
                 ▼
          FamiCare RME internal
```

Portal pasien menggunakan Supabase project Health Assistant Production, terpisah dari database RME internal. Setiap tabel pasien menggunakan Row Level Security dan membatasi data berdasarkan `auth.uid()`.

## Batas sebelum peluncuran komersial

Komponen berikut memerlukan keputusan atau kredensial bisnis dan tidak diisi dengan data contoh:

- tarif resmi setiap layanan;
- nomor WhatsApp/kanal bantuan resmi;
- SMS/WhatsApp OTP bila login email akan diganti;
- payment gateway dan kebijakan refund;
- DNS `sahabat.familiamedika.id`;
- akun dan signing Android/iOS untuk Play Store, TestFlight, atau App Store;
- final review ketentuan penggunaan dan pemberitahuan privasi.

## Keamanan

- Publishable key boleh berada di browser; service-role key tidak boleh.
- RLS wajib aktif pada seluruh tabel portal.
- Dokumen pasien hanya ditampilkan setelah dipublikasikan oleh alur staf.
- Service worker hanya menyimpan application shell, bukan data pasien, booking, dokumen, atau tagihan.
- Kondisi gawat darurat selalu diarahkan ke layanan darurat/IGD, bukan menunggu aplikasi.

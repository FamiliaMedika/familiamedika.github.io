# Konfigurasi Email Auth Sahabat Familia

## URL Configuration

Pada Supabase project **FamiCare Health Assistant Production** (`cvfuuflnfexaqnncgjmw`), buka:

`Authentication → URL Configuration`

Gunakan nilai berikut:

- **Site URL:** `https://www.familiamedika.id/sahabat/`
- **Redirect URLs:**
  - `https://www.familiamedika.id/sahabat/`
  - `https://www.familiamedika.id/sahabat/**`
  - `https://sahabat.familiamedika.id/**` (disiapkan untuk domain pasien kelak)

Hapus `http://localhost:3000` dari Site URL produksi. Localhost hanya boleh ditempatkan sebagai additional redirect URL saat pengembangan lokal memang digunakan.

## Email Templates

Pada `Authentication → Email Templates`, isi subject dan body berikut:

| Template Supabase | Subject | File |
|---|---|---|
| Confirm signup | `Verifikasi Akun Sahabat Familia` | `confirmation.html` |
| Reset password | `Atur Ulang Kata Sandi Sahabat Familia` | `recovery.html` |
| Magic link | `Tautan Masuk Sahabat Familia` | `magic-link.html` |
| Change email address | `Konfirmasi Perubahan Email Sahabat Familia` | `email-change.html` |

Setiap template memakai `{{ .ConfirmationURL }}` yang dibuat oleh Supabase Auth. Jangan mengganti variabel tersebut dengan URL biasa.

## Sender Email yang Resmi

Agar pengirim tidak lagi tampil sebagai **Supabase Auth `<noreply@mail.app.supabase.io>`**, aktifkan Custom SMTP pada:

`Authentication → Emails → SMTP Settings`

Rekomendasi identitas pengirim:

- **Sender name:** `Sahabat Familia by Familia Medika`
- **From address:** `noreply@familiamedika.id` atau `noreply@auth.familiamedika.id`
- **Reply-to/support:** alamat bantuan resmi Familia Medika

SMTP host, port, username, dan password diperoleh dari penyedia seperti Resend, AWS SES, Postmark, SendGrid, Brevo, atau layanan email domain Familia Medika. SPF, DKIM, dan DMARC harus diverifikasi sebelum peluncuran publik. Jangan menyimpan kredensial SMTP di repository atau frontend.

## Pengujian

Setelah URL dan template disimpan:

1. Daftar memakai email uji baru.
2. Pastikan subject email adalah `Verifikasi Akun Sahabat Familia`.
3. Pastikan tombol verifikasi menuju domain Supabase terlebih dahulu, lalu kembali ke `https://www.familiamedika.id/sahabat/`.
4. Pastikan tidak ada redirect ke `localhost:3000`.
5. Uji lupa kata sandi dan perubahan kata sandi.
6. Setelah Custom SMTP aktif, pastikan pengirim memakai domain Familia Medika serta lulus SPF/DKIM/DMARC.

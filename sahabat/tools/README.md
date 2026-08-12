# Alat Konfigurasi Auth Sahabat Familia

Folder ini berisi alat satu kali untuk menerapkan konfigurasi produksi Supabase Auth pada project pasien **FamiCare Health Assistant Production** (`cvfuuflnfexaqnncgjmw`).

## Perubahan yang diterapkan

- Site URL menjadi `https://www.familiamedika.id/sahabat/`.
- Redirect verifikasi email, reset password, dan callback tidak lagi menuju `localhost:3000`.
- Email konfirmasi, reset password, magic link, dan perubahan email memakai template resmi Sahabat Familia dalam Bahasa Indonesia.
- Subject email memakai identitas Sahabat Familia.
- Password minimum ditetapkan 12 karakter.
- Opsional: Resend SMTP dengan identitas pengirim:
  - `Sahabat Familia by Familia Medika`
  - `noreply@auth.familiamedika.id`

## Menjalankan di Windows

1. Unduh repository ini sebagai ZIP atau ambil folder `sahabat/tools` bersama folder `sahabat/email-templates`.
2. Klik dua kali `TERAPKAN-AUTH-SAHABAT-FAMILIA.cmd`.
3. Pilih `Y` ketika ditanya tentang Resend SMTP bila domain dan API key Resend sudah tersedia.
4. Saat diminta:
   - masukkan Supabase Personal Access Token;
   - masukkan Resend API key untuk mengaktifkan pengirim resmi.
5. Token dan API key dimasukkan sebagai input tersembunyi, hanya digunakan di memori selama proses, dan tidak disimpan oleh skrip.

Skrip mencoba membaca sesi Supabase CLI dari `~/.supabase/access-token`. Bila token tersebut tidak tersedia, skrip meminta Personal Access Token secara aman.

## Menjalankan dari PowerShell

Tanpa SMTP:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Apply-SahabatAuth.ps1 -SkipSmtp
```

Dengan Resend SMTP:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Apply-SahabatAuth.ps1 -ConfigureSmtp
```

Alamat pengirim alternatif dapat diberikan tanpa mengubah skrip:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Apply-SahabatAuth.ps1 `
  -ConfigureSmtp `
  -SenderEmail "noreply@auth.familiamedika.id"
```

## Prasyarat SMTP resmi

Resend memerlukan:

- domain pengirim yang sudah berstatus verified;
- API key aktif;
- alamat pengirim yang berada pada domain tersebut.

Konfigurasi yang dipakai:

```text
Host     : smtp.resend.com
Port     : 465
Username : resend
Password : Resend API key
```

Jangan menempelkan Personal Access Token, service-role key, atau Resend API key ke percakapan, source code, screenshot, issue GitHub, atau file yang diunggah.

## Verifikasi otomatis

Sesudah PATCH berhasil, skrip membaca kembali konfigurasi non-sensitif dari Supabase Management API dan memeriksa:

- Site URL;
- daftar redirect;
- kewajiban konfirmasi email;
- subject verifikasi dan reset password;
- nama pengirim;
- host SMTP dan email pengirim bila SMTP diaktifkan.

Proses selesai hanya bila seluruh pemeriksaan yang relevan menampilkan `[OK]`.

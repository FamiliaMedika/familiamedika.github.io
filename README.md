# Familia Medika — Website

Website profil layanan **Familia Medika** — *Sahabat Sehat Keluarga di Rumah*.
Situs statis satu halaman (HTML/CSS/JS), siap di-hosting gratis di **GitHub Pages**.

## Struktur folder

```
familia-medika/
├── index.html          ← halaman utama
├── assets/
│   ├── logo.png        ← logo penuh (transparan)
│   ├── logo-icon.png   ← ikon logo (favicon & footer)
│   └── dokter.jpg      ← foto dokter / penanggung jawab
├── .nojekyll           ← agar GitHub Pages tidak memproses lewat Jekyll
└── README.md
```

## Cara deploy ke GitHub Pages

### Cara A — Tanpa Git (lewat web, paling mudah)

1. Login ke [github.com](https://github.com) → klik **New repository**.
2. Beri nama repo, misalnya `familia-medika`, set ke **Public**, lalu **Create**.
3. Di halaman repo, klik **Add file → Upload files**, lalu seret **semua isi folder ini** (`index.html`, folder `assets/`, `.nojekyll`). Klik **Commit changes**.
4. Buka **Settings → Pages**.
5. Pada **Source**, pilih **Deploy from a branch** → Branch: **main** → Folder: **/ (root)** → **Save**.
6. Tunggu ±1 menit. Situs akan tampil di:
   `https://USERNAME.github.io/familia-medika/`

### Cara B — Pakai Git (command line)

```bash
cd familia-medika
git init
git add .
git commit -m "Website Familia Medika"
git branch -M main
git remote add origin https://github.com/USERNAME/familia-medika.git
git push -u origin main
```

Lalu aktifkan **Settings → Pages** seperti langkah 4–6 di atas.

> **Ingin jadi situs utama?** Beri nama repo `USERNAME.github.io`. Situs akan tampil langsung di `https://USERNAME.github.io/`.

## Cara mengganti konten

Semua mudah diedit langsung di `index.html`:

- **Nama dokter** — cari teks `dr. Nurul Khafidz Subekti, AIFO-K` bila ingin mengubahnya.
- **Foto dokter** — timpa file `assets/dokter.jpg` (gunakan nama file yang sama).
- **Logo** — timpa `assets/logo.png` dan `assets/logo-icon.png`.
- **Nomor WhatsApp** — cari `6282147267448` (format internasional, dari `0821-4726-7448`) dan ganti bila perlu. Cari juga teks tampilan `0821-4726-7448`.
- **Teks layanan, keunggulan, alamat** — ubah langsung pada bagian terkait di `index.html`.

## Custom domain (opsional)

Di **Settings → Pages → Custom domain**, masukkan domain Anda (mis. `familiamedika.id`), lalu arahkan DNS domain ke GitHub Pages. GitHub akan otomatis menyediakan HTTPS.

---

© Familia Medika — Sahabat Sehat Keluarga di Rumah.

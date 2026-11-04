/*
 * Daftar Artikel Familia Medika
 * ---------------------------------------------------------------
 * Satu-satunya tempat untuk mendaftarkan artikel. Section "Artikel"
 * di beranda dan halaman /artikel/ membaca daftar ini.
 *
 * Menambah artikel baru:
 *   1. Salin folder  artikel/kapan-harus-ke-igd/  → ganti nama folder (slug)
 *   2. Edit isi index.html di folder baru
 *   3. Tambahkan satu objek di PALING ATAS array ARTIKEL di bawah
 *   4. Tambahkan URL-nya di sitemap.xml
 *
 * kategori : "Kegawatdaruratan" | "Penyakit Kronis" | "Lansia" |
 *            "Perawatan Luka" | "Ibu & Anak" | "Gaya Hidup" (bebas)
 * ikon     : "darurat" | "jantung" | "luka" | "lansia" | "anak" | "umum"
 */
window.ARTIKEL_FM = [
  {
    slug: "kapan-harus-ke-igd",
    judul: "Kapan Harus ke IGD? Kenali Tanda Kegawatdaruratan",
    ringkasan: "Kenali tanda bahaya stroke, serangan jantung, dan kondisi gawat darurat lain, kapan cukup ke puskesmas, serta hak Anda sebagai pasien BPJS di IGD.",
    kategori: "Kegawatdaruratan",
    ikon: "darurat",
    tanggal: "2026-11-04",
    menitBaca: 6,
    penulis: "dr. Nurul Khafidz Subekti, AIFO-K"
  }
];

(function () {
  var ICON = {
    darurat: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    jantung: '<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z"/>',
    luka: '<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)"/><path d="M10 10h.01M14 14h.01M12 12h.01"/>',
    lansia: '<circle cx="12" cy="5" r="2"/><path d="M10 22l1-7-2-2V9l3-1 3 3v3M16 12l2 10M9 22l1-4"/>',
    anak: '<circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0114 0v2"/>',
    umum: '<path d="M12 2v20M2 12h20"/>'
  };
  var BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

  function tgl(iso) {
    var p = iso.split("-");
    return parseInt(p[2], 10) + " " + BULAN[parseInt(p[1], 10) - 1] + " " + p[0];
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function kartu(a, base) {
    var href = base + a.slug + "/";
    var ic = ICON[a.ikon] || ICON.umum;
    return '<a class="acard" href="' + href + '">' +
      '<div class="acard-cover ic-' + esc(a.ikon || "umum") + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ic + '</svg>' +
        '<span class="acard-cat">' + esc(a.kategori) + '</span>' +
      '</div>' +
      '<div class="acard-body">' +
        '<h3>' + esc(a.judul) + '</h3>' +
        '<p>' + esc(a.ringkasan) + '</p>' +
        '<div class="acard-meta"><span>' + tgl(a.tanggal) + '</span><span>' + a.menitBaca + ' menit baca</span></div>' +
        '<span class="acard-more">Baca artikel <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' +
      '</div>' +
    '</a>';
  }

  /* Render ke elemen [data-artikel-grid]
   *   data-base  : awalan URL artikel ("/artikel/")
   *   data-limit : jumlah maksimal kartu (opsional)
   *   data-kecuali : slug yang tidak ditampilkan (opsional, untuk "artikel lain") */
  function render() {
    var list = window.ARTIKEL_FM || [];
    document.querySelectorAll("[data-artikel-grid]").forEach(function (el) {
      var base = el.getAttribute("data-base") || "/artikel/";
      var limit = parseInt(el.getAttribute("data-limit") || "0", 10);
      var kecuali = el.getAttribute("data-kecuali");
      var items = list.filter(function (a) { return a.slug !== kecuali; });
      if (limit > 0) items = items.slice(0, limit);
      if (!items.length) { el.closest("[data-artikel-wrap]") && (el.closest("[data-artikel-wrap]").style.display = "none"); return; }
      el.innerHTML = items.map(function (a) { return kartu(a, base); }).join("");
      el.classList.toggle("is-single", items.length === 1);
    });
  }

  window.FM_tglArtikel = tgl;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();

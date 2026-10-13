# PASTI-Papua — Paparan bulanan

GitHub Pages: https://pastipapua-2026.github.io/Meeting_update/

## Berkas

- `index.html`: shell HTML asli.
- `assets/dashboard.css`: CSS asli tanpa perubahan.
- `assets/data.js`: konfigurasi dan data bawaan dari HTML lama, tanpa perubahan data.
- `assets/dashboard.js`: renderer, interaksi, validasi, dan sinkronisasi Google Sheets.
- `test-sync.cjs`: tes dengan data sintetis, tanpa salinan Google Sheet.

## Aktivasi sumber

`SHEET_ID` pada `assets/data.js` tersambung ke sumber yang disetujui pemilik untuk seluruh 14 tab pada 14 Oktober 2026. Parameter `?sheet=<ID>` tetap didukung untuk pengujian sumber yang boleh dibaca. Jangan masukkan token atau kredensial di aplikasi. Persetujuan cakupan publik berlaku untuk sumber ini; periksa ulang sebelum menambah data sensitif baru.

Situs statis publik tidak dapat menyembunyikan data dari pengunjung. Endpoint yang dapat diambil browser juga dapat dibaca langsung. Jika sumber berisi data internal, gunakan sumber publik terpisah berisi hanya data yang disetujui atau hosting dengan autentikasi. Jangan memperluas izin berbagi sumber untuk mengatasi kegagalan koneksi tanpa persetujuan.

## Sinkronisasi

Browser memuat semua 14 tab sebagai satu snapshot. Polling setiap 60 detik saat tab terlihat, serta saat kembali online/aktif. Klik label status data atau fokuskan lalu tekan Enter/Spasi untuk refresh manual. Timeout 15 detik, satu permintaan sinkronisasi pada satu waktu. Status lama muncul setelah 120 detik tanpa refresh sukses.

Snapshot sama tidak merender ulang halaman. Pembaruan selama presentasi ditahan sampai keluar dari presentasi. Halaman, bulan, filter, posisi gulir, dan rincian indikator yang terbuka dipertahankan sejauh datanya masih tersedia.

Jika sinkronisasi gagal, aplikasi mempertahankan snapshot valid terakhir dan menandai kegagalannya. Kegagalan awal ditandai sebagai data bawaan belum terverifikasi. Tidak ada pencampuran tab live dengan demo: tab yang tidak tersedia membatalkan seluruh snapshot. Tab konten kosong menghasilkan keadaan kosong yang sudah tersedia di desain asli.

Google Visualization dapat menerapkan cache dan deteksi tipe kolom; polling bukan jaminan perubahan muncul tepat 60 detik. Gunakan tipe kolom konsisten. Angka dibaca tanpa format tampilan melalui `options no_format` ([dokumentasi Google](https://developers.google.com/chart/interactive/docs/querylanguage#options)).

## Schema

Nama tab dan header wajib mengikuti `SCHEMA` pada `assets/dashboard.js`; urutan kolom bebas. Header asing/duplikat ditolak. Tab wajib: Pengaturan, MTT_Indikator, MTT_Data, MTT_Ringkasan, Target_Wilayah, Capaian_Wilayah, Populasi_Sasaran, Jangkauan, Kegiatan, Anggaran, Highlight, Tantangan, Rencana, Catatan.

Tahun 2000–2100, bulan 1–12. Periode MTT: M01–M12, S1, S2, TAHUN. Periode konten: YYYY-MM. Angka nonnegatif; nilai kosong tetap kosong. Kode MTT harus merujuk indikator yang ada; baris duplikat ditolak. Enam flag contoh/draf dan bulan awal fiskal wajib ada di Pengaturan. Perbedaan target sumber dan flag contoh tetap ditampilkan, tidak diubah otomatis.

## Pengujian

Jalankan `node test-sync.cjs`. Tes mencakup parser, schema, data invalid, sanitasi, update presentasi dan kegagalan koneksi. Untuk verifikasi browser gunakan server lokal yang hanya menyajikan berkas aplikasi yang disetujui. Jangan menyajikan fixture privat, snapshot spreadsheet, atau laporan internal.

Deployment cukup berkas aplikasi, README, dan tes sintetis. Jangan commit file sumber audit, fixture privat, respons Google, atau tangkapan layar internal.

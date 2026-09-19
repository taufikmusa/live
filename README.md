# live.taufik.fyi — Bilik Skrip Live

Teleprompter statik untuk skrip live stream Taufik Musa (Authorized Dealer Public Gold PG00359605).
Satu GitHub Pages, banyak skrip. Tiada build step, tiada dependency — HTML + CSS + satu fail JS.

## Struktur

```
/
├── index.html            Hub — senarai semua skrip live
├── live-01/index.html    Shell teleprompter (set window.LIVE_ID)
├── data/live-01.json     KANDUNGAN skrip — di sini je yang perlu diedit
├── assets/css/style.css  Tema Ink + Gold, dark-first
├── assets/js/app.js      Enjin: jam, chips, auto-scroll, mod paparan
├── CNAME                 live.taufik.fyi
└── .nojekyll             Halang Jekyll proses folder
```

Prinsipnya: **kandungan dipisah daripada paparan.** Nak tambah skrip baru tak perlu sentuh
HTML/CSS/JS langsung.

## Tambah skrip baru (ver-02, ver-03, …)

1. Salin `data/live-01.json` → `data/live-02.json`, isi kandungan baru.
2. Salin folder `live-01/` → `live-02/`, tukar satu baris:
   `<script>window.LIVE_ID = 'live-02';</script>`
3. Tambah satu `<a class="card">` dalam `index.html`.

Siap. Push, Pages auto-deploy.

## Format JSON

```jsonc
{
  "tajuk": "...", "subtajuk": "...", "hos": "...", "dealer": "...",
  "format": "...", "durasi": 3600,          // saat
  "rujukanTeras": [{ "tajuk": "", "penulis": "", "nota": "" }],
  "props": ["item checklist sebelum go-live"],
  "segmen": [{
    "no": 1,
    "tajuk": "...",
    "asas": "Asas #1",                      // null kalau bukan asas
    "mula": 0, "tamat": 300,                // saat
    "objektif": "...",
    "alat": "props khas segmen ni",
    "cues": ["arahan kamera / intonasi"],
    "rujukan": [{ "buku": "housel|canfield", "poin": "Bab 15 — Nothing's Free" }],
    "skrip": ["perenggan…"]
  }]
}
```

### Markup dalam `skrip`

| Tulis | Jadi |
|---|---|
| `**teks**` | **tebal** — warna emas, untuk ayat yang kena tekan suara |
| `==teks==` | teks disorot — punchline / ayat kunci |
| `*teks*` | *condong* — arahan pentas, contoh `*(tunjuk gold bar)*` |
| `- item` | senarai berbullet |
| `> petikan` | kotak petikan (quote Housel/Canfield) |

## Kawalan semasa live

| Kekunci | Fungsi |
|---|---|
| `Space` | Mula / jeda jam |
| `←` `→` | Segmen sebelum / seterusnya |
| `1`–`9` | Lompat terus ke segmen |
| `+` `−` | Besar / kecilkan teks skrip |
| `S` | Auto-scroll on/off |
| `F` | Skrin penuh |
| `R` | Reset jam |
| `?` | Buka tetapan |

**Tiga mod paparan:**

- **Penuh** — objektif + cues + rujukan + skrip. Untuk rehearsal.
- **Skrip** — teks bacaan saja, tanpa gangguan. Untuk on-air.
- **Ringkas** — cue card saja, tanpa skrip. Untuk yang dah hafal, cuma nak peta jalan.

Jam, saiz teks, mod dan checklist disimpan dalam `localStorage`, jadi kalau browser
tertutup tengah live, buka balik terus sambung.

Skrin takkan tidur masa jam berjalan (Screen Wake Lock API, Chrome/Edge/Safari 16.4+).

## Setup GitHub Pages + custom domain

### 1. Hidupkan Pages

Repo → **Settings** → **Pages** → Source: **Deploy from a branch** →
Branch: `main` / root `/` → Save.

### 2. DNS untuk `live.taufik.fyi`

Pergi ke DNS provider untuk `taufik.fyi`, tambah **satu rekod CNAME**:

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `live` | `taufikmusa.github.io.` | Auto |

> Subdomain guna CNAME. Jangan guna A record — itu untuk apex domain (`taufik.fyi`) je.
> Kalau guna Cloudflare, set proxy status **DNS only** (awan kelabu) dulu sampai sijil SSL
> GitHub siap, lepas tu baru boleh hidupkan proxy kalau nak.

### 3. Sahkan dalam GitHub

Settings → Pages → **Custom domain** → taip `live.taufik.fyi` → Save.
Fail `CNAME` dalam repo ni dah ada nilai tu, jadi biasanya GitHub isi sendiri.

Tunggu DNS propagate (5 minit – 1 jam), lepas tu tick **Enforce HTTPS**.
Kalau checkbox tu kelabu, maksudnya sijil belum siap — tunggu sikit lagi, refresh.

### 4. Cek

```bash
dig +short live.taufik.fyi CNAME     # patut keluar taufikmusa.github.io.
curl -sI https://live.taufik.fyi | head -1
```

## Jalankan lokal

`fetch()` tak jalan atas `file://`, jadi kena guna server:

```bash
python3 -m http.server 8080
# buka http://localhost:8080
```

## Nota

- Halaman ini `noindex` — skrip dalaman, bukan untuk ranking Google.
- Nak keluarkan PDF untuk backup atas meja: buka mod Penuh → butang **Cetak / PDF**.
  Setiap segmen keluar satu muka surat.

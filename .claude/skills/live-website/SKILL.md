---
name: live-website
description: Bina dan kemas kini live.taufik.fyi milik Taufik Bin Musa — laman GitHub Pages yang menukar skrip live stream menjadi teleprompter (jam per segmen, cue kamera, auto-scroll, mod ringkas) dengan satu hub yang boleh cari merentas semua skrip. Guna skill ini SETIAP KALI Taufik muat naik .docx skrip live, sebut "tambah ver-02", "skrip live baru", "live.taufik.fyi", "repo live", "teleprompter", "hub skrip", "tukar segmen", "auto-scroll tak jalan", "update skrip live", atau minta apa-apa diubah dalam repo taufikmusa/live. Trigger juga bila dia beri skrip live mentah dalam apa-apa format dan mahu ia boleh dibaca masa on-air. BUKAN untuk taufik.fyi hub video (guna taufik-fyi-hub), bukan untuk halaman video swipe atau fake live (guna gap-swipe-qna atau gap-live-shopping), bukan untuk simpanemasfizikal.com (guna simpanemasfizikal-website), dan bukan untuk slide atau carousel.
---

# live.taufik.fyi — Bilik Skrip Live

## 1. Apa laman ini

Teleprompter statik untuk skrip live stream. Bukan laman "baca skrip" — ia alat
yang dipakai masa kamera tengah on. Skrip dalam Word tak berguna masa live:
tak tahu dah sampai mana, tak tahu dah lebih masa, dan cue kamera bercampur
dengan ayat yang nak disebut. Laman ini selesaikan tiga benda tu.

| Perkara | Nilai |
|---|---|
| Domain | `https://live.taufik.fyi` |
| Repo | `taufikmusa/live`, branch `main` |
| Hos | GitHub Pages, Deploy from a branch, `main` / `(root)` |
| DNS | Cloudflare, CNAME `live` → `taufikmusa.github.io`, **DNS only (awan kelabu)** |
| Stack | HTML + CSS + dua fail JS. Tiada framework, tiada build step |
| Pemilik | Taufik Bin Musa, Dealer Public Gold, PG00359605 |
| Indeks | `noindex` — skrip dalaman, bukan untuk Google |

## 2. Struktur fail

```
/
├── index.html              Hub — kotak carian + kad setiap skrip
├── live-01/index.html      Shell teleprompter (set window.LIVE_ID sahaja)
├── data/index.json         Manifest — senarai id, itu je
├── data/live-01.json       KANDUNGAN skrip — di sini sahaja yang diedit
├── assets/css/style.css    Tema Ink + Gold, dark-first
├── assets/js/app.js        Enjin teleprompter
├── assets/js/hub.js        Enjin hub + carian
├── CNAME                   live.taufik.fyi
└── .nojekyll               Halang Jekyll proses folder
```

Prinsip terasnya: **kandungan dipisah daripada paparan.** Shell HTML kosong,
enjin JS render semua daripada JSON. Sebab itu tambah skrip baru tak perlu
sentuh HTML, CSS atau JS langsung.

Manifest `data/index.json` sengaja simpan **id sahaja**:

```json
{ "siri": ["live-01"] }
```

Tajuk, durasi dan bilangan segmen dibaca terus daripada fail skrip. Kalau
manifest simpan tajuk juga, satu hari Taufik akan tukar tajuk dalam JSON dan
terlupa tukar dalam manifest, lalu kad hub tunjuk benda lain daripada
kandungan sebenar. Jangan perkenalkan semula pendua itu.

## 3. Tambah skrip baru (ver-02, ver-03, …)

Tiga langkah. Jangan tambah langkah keempat.

1. Salin `data/live-01.json` → `data/live-02.json`, isi kandungan baru.
2. Salin folder `live-01/` → `live-02/`, tukar satu baris dalam `index.html`:
   `<script>window.LIVE_ID = 'live-02';</script>`
3. Tambah `"live-02"` dalam array `siri` di `data/index.json`.

Kad keluar sendiri di hub, kandungan terus masuk indeks carian, dan chip
penapis per-versi muncul automatik bila dah ada lebih daripada satu skrip.

## 4. Skema JSON

```jsonc
{
  "id": "live-01",
  "ver": "ver-01",
  "tajuk": "7 Asas Simpanan Emas",
  "subtajuk": "x Psikologi Wang & Prinsip Kejayaan",
  "hos": "Taufik Musa",
  "dealer": "Authorized Dealer Public Gold PG00359605",
  "format": "Live Stream Interaktif — TikTok / Facebook / Instagram / YouTube",
  "durasi": 3600,                    // saat
  "ringkasan": "…",
  "rujukanTeras": [{ "tajuk": "", "penulis": "", "nota": "" }],
  "props": ["checklist sebelum go-live"],
  "segmen": [{
    "no": 1,
    "tajuk": "Pembukaan, Cek Audio & Formula E+R=O",
    "chip": "Buka · E+R=O",          // label pendek untuk chip navigasi
    "asas": "Asas #1",               // null kalau segmen buka/tutup
    "mula": 0, "tamat": 300,         // saat
    "objektif": "…",
    "alat": "props khas segmen ni",  // "" kalau tiada
    "cues": ["arahan kamera / intonasi"],
    "rujukan": [{ "buku": "housel", "poin": "Bab 15 — Nothing's Free" }],
    "skrip": ["perenggan…"]
  }]
}
```

`buku` ialah kod pendek untuk lencana rujukan. Yang sedia ada:

| Kod | Buku | Lencana | Warna |
|---|---|---|---|
| `housel` | The Psychology of Money | **PoM** | biru |
| `canfield` | The Success Principles | **TSP** | ungu |
| `tracy` | Eat That Frog! | **ETF** | jingga |
| `helmstetter` | What to Say When You Talk to Your Self | **WTS** | sian |

Kod yang tak dikenali akan render tanpa lencana. Bila skrip baharu guna buku
lain, tambah token warna (`--book-*`) untuk tema gelap **dan** terang dalam
`style.css`, kemudian satu pasangan `.ref.<kod>` / `.ref.<kod>::before`.
Ambil singkatan tiga huruf supaya lebar lencana konsisten.

`chip` kena pendek — ia muncul dalam baris chip mendatar yang perlu dibaca
sekali pandang masa on-air. Gaya sedia ada: `Buka · E+R=O`, `#1 Tiada
Pendapatan`, `#4 10% Setahun`, `Tutup · CTA`.

### Markup dalam `skrip`

Markup ini bukan hiasan — ia beritahu Taufik **cara baca**, bukan sekadar apa
nak baca. Guna dengan niat.

| Tulis | Jadi | Bila guna |
|---|---|---|
| `**teks**` | tebal warna emas | ayat yang kena tekan suara |
| `==teks==` | kotak sorot | punchline, ayat kunci segmen |
| `*teks*` | condong kelabu | arahan pentas, cth `*(tunjuk gold bar)*` |
| `- item` | senarai berbullet | senarai yang disebut satu-satu |
| `> petikan` | kotak petikan emas | quote Housel / Canfield |

## 5. Ciri teleprompter

**Jam dua lapis.** Atas jam jumlah (naik ke `durasi`). Bawah baki masa segmen
semasa. Baki negatif jadi merah. Segmen aktif ditentukan oleh posisi bacaan
(IntersectionObserver), bukan oleh jam — jadi baki menunjukkan masa tinggal
untuk segmen yang sedang dibaca.

**Tiga mod paparan**, dikawal oleh atribut `data-mode` pada `<html>`:

| Mod | Tunjuk | Untuk |
|---|---|---|
| `penuh` | objektif + cues + rujukan + skrip | rehearsal |
| `skrip` | teks bacaan sahaja | on-air |
| `ringkas` | cue card sahaja, skrip tersembunyi | dah hafal, nak peta jalan |

**Kekunci**: `Space` jam · `←` `→` segmen · `1`–`9` lompat · `+` `−` saiz teks ·
`S` auto-scroll · `F` skrin penuh · `R` reset · `?` tetapan

**Screen Wake Lock** hidup selagi jam berjalan supaya skrin tak tidur.
Perlu HTTPS.

**localStorage** simpan jam, saiz teks, mod, laju scroll dan checklist props.
Browser tertutup tengah live, buka balik terus sambung. Semua baca/tulis
dibalut `try/catch` sebab mod peribadi boleh lempar.

**Pautan dalam**: setiap segmen ada anchor ikut nombornya — `/live-01/#s6`
buka terus Segmen 6 dengan jam dan chip selaras. Boleh dikongsi dalam WhatsApp.

**Cetak**: CSS print letak satu segmen satu muka surat.

## 6. Enjin carian hub

Carian masuk sampai ke **dalam teks skrip**, bukan setakat tajuk. Sebabnya:
cari tajuk sahaja tak berguna — Taufik dah tahu dia ada berapa skrip.
Masalah sebenar bila dah ada 10 skrip ialah *"ayat pasal roti canai tu dalam
live mana?"*

Markah berlapis:

| Padanan di | Markah |
|---|---|
| Tajuk siri, tajuk segmen, nama asas, rujukan buku | 10 |
| Objektif dan cue kamera | 4 |
| Badan skrip | 1 |
| Bonus frasa (perkataan bersebelahan) | +12 lemah, +20 sederhana, +40 kuat |

Semua terma mesti ada (logik DAN), jadi tambah perkataan menajamkan tapisan.
Bonus frasa penting — tanpanya, `bab 7` akan padan mana-mana segmen yang ada
perkataan "bab" dan digit "7" bertaburan, bukan Bab 7 yang sebenar.

Petikan hasil: 230 aksara sekeliling padanan pertama, markup skrip dibuang
dulu, padanan disorot. Terma bawah 3 aksara tak disorot bila carian
multi-perkataan — kalau tidak "of" dan "in" bertabur kuning dan jadi bising.

## 7. Perangkap yang sudah dibetulkan — jangan ulang

Empat bug ini sudah dibaiki dan disahkan dengan ujian browser sebenar. Kalau
menulis semula mana-mana bahagian ini, ingat kenapa kodnya nampak begitu.

**Auto-scroll vs `scroll-behavior: smooth`.** CSS ada `html { scroll-behavior:
smooth }` untuk butang lompat segmen. Tapi itu menjadikan setiap
`window.scrollBy` satu animasi tersendiri, dan enjin panggil 60 kali sesaat,
jadi setiap animasi membatalkan yang sebelumnya. Hasil ujian: **0px dalam 3
saat**, atas desktop dan telefon. Penyelesaian: kelas `.autoscroll` pada
`<html>` matikan smooth selagi auto-scroll hidup.

**Pecahan piksel dibuang telefon.** Pada 28 px/s, satu frame hanya 0.46px.
Pelayar telefon buang nilai scroll pecahan, jadi setiap panggilan bernilai
sifar. Penyelesaian: kumpul baki dalam `bakiPx`, hantar hanya bila cukup
piksel penuh. Jangan "ringkaskan" balik kepada `scrollBy(0, speed * dt)`.

**Tulisan localStorage bertalu-talu.** Syarat lama `Math.floor(elapsed) % 5 === 0`
benar untuk **seluruh saat** itu, jadi storage ditulis kira-kira 60 kali setiap
kali cukup 5 saat — punca tersekat atas telefon. Penyelesaian: jejak
`saatLepas` dan tulis sekali sahaja per saat sasaran.

**`hidden` kalah dengan `display:grid`.** `#senarai` dan `#hasil` ada
`display: grid`, yang mengatasi atribut `hidden`, jadi kad lama masih nampak
masa carian aktif. Penyelesaian: peraturan global `[hidden] { display: none
!important; }`. Kekalkan ia.

Satu lagi perlindungan: `dt` dihadkan kepada 0.25s supaya tab yang tertidur
tak melompatkan skrin jauh bila kembali aktif.

## 8. Rutin kerja

**Uji sebelum push. Sentiasa.** `fetch()` tak jalan atas `file://`:

```bash
cd <repo> && python3 -m http.server 8099
# buka http://localhost:8099
```

Untuk apa-apa perubahan yang menyentuh scroll, jam, carian atau susun atur,
pandu Chromium melalui Playwright dan **ukur**, jangan hanya pandang. Tiga
daripada empat bug di atas lulus pemeriksaan mata tetapi gagal ujian. Uji
sekurang-kurangnya satu profil telefon (`devices['iPhone 13']`), bukan
desktop sahaja — dua bug tadi khusus memukul telefon.

Pola ujian yang berguna: tangkap `scrollY` sebelum dan selepas tempoh tetap,
bandingkan dengan jangkaan (`speed × saat`). Kalau membandingkan dengan versi
lama, `git archive HEAD | tar -x -C <dir>` dan hidangkan pada port berbeza.

**Deploy**: push ke `main`, GitHub Pages bina sendiri. Sahkan dengan
`mcp__github__actions_list` / `actions_get` — cari run `pages build and
deployment` berstatus `success`. Sifar run bermakna Pages tak pernah
dihidupkan (Settings → Pages, pilih branch, **tekan Save** — memilih dropdown
sahaja tidak menyimpan).

**Selepas deploy**, ingatkan Taufik hard refresh atas telefon. Browser pegang
JS lama dalam cache dan dia akan sangka fix tak jadi.

## 9. Nota persekitaran

Cloudflare mesti kekal **DNS only** untuk subdomain ini. Kalau proxy oren
dihidupkan, GitHub tak dapat isukan sijil SSL dan tersekat di "Certificate
not yet created". Kalau proxy tetap dihidupkan kemudian, SSL/TLS mode **mesti**
Full atau Full (strict) — "Flexible" dengan GitHub Pages menghasilkan
`ERR_TOO_MANY_REDIRECTS`. Cadangan tetap: biar kelabu. GitHub Pages sudah
bagi HTTPS dan CDN sendiri.

Sandbox Claude Code tak boleh capai `live.taufik.fyi` atau `github.io`
(proxy sekat). Jangan laporkan laman mati berdasarkan curl yang gagal —
guna API Actions untuk status deploy, dan minta Taufik sahkan visual.

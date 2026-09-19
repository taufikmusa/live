#!/usr/bin/env python3
"""Cari kisah yang muncul dalam lebih daripada satu siri.

    python3 .claude/skills/live-website/scripts/cari-tindih.py

Skrip-skrip ini ditulis dalam batch berasingan, jadi kisah yang sama
kerap muncul semula — Marshmallow Stanford ada dalam ver-05 dan ver-08,
Cher Ami dalam ver-05 dan ver-09. Itu bukan pepijat. Tetapi kalau dua
siri yang berkongsi kisah dijadualkan berturut-turut, audien yang sama
akan mendengar anekdot yang sama dua kali dan kesannya hilang.

Skrip ini mengumpul nama khas (frasa bermula huruf besar, 2 perkataan
ke atas) daripada teks skrip setiap siri, lalu melaporkan yang muncul
dalam dua siri atau lebih. Ia panduan penjadualan, bukan ralat — keluar
sentiasa dengan kod 0.
"""
import json
import re
from collections import defaultdict
from pathlib import Path

akar = Path(__file__).resolve().parents[4]
if not (akar / 'data' / 'index.json').exists():
    akar = Path.cwd()
data = akar / 'data'

# Perkataan ini kerap bermula ayat atau muncul dalam setiap skrip, jadi
# ia menenggelamkan isyarat sebenar kalau tidak ditapis.
BUANG = {
    'Emas', 'Perkara', 'Asas', 'Nombor', 'Satu', 'Dua', 'Tiga', 'Empat',
    'Lima', 'Enam', 'Tujuh', 'Public', 'Gold', 'Gold Accumulation',
    'Tuan', 'Tuan Mohd', 'Mohd Zulkifli', 'Zulkifli Shafie', 'Taufik',
    'Taufik Musa', 'Dealer', 'Authorized', 'Tabung', 'Tabung Haji',
    'Bila', 'Kalau', 'Tapi', 'Dan', 'Jangan', 'Kita', 'Anda', 'Saya',
    'Dalam', 'Bukan', 'Setiap', 'Selain', 'Tahun', 'Malam', 'Sebab',
    'Kenapa', 'Cuba', 'Tolong', 'Sahabat', 'Kawan', 'Beli', 'Simpan',
    'Waktu', 'Harga', 'Jangka', 'Masa', 'Duit', 'Ringgit', 'Klik',
    'Pertama', 'Kedua', 'Ketiga', 'Alhamdulillah', 'Assalamualaikum',
    'Ar-Rahnu', 'Network', 'Titik', 'Maksudnya', 'Sekarang', 'Hari',
    # Sapaan lokasi penonton dan nama tempat generik bukan kisah
    'Johor Bahru', 'Kota Kinabalu', 'Kota Bharu', 'Shah Alam',
    'Kuala Lumpur', 'Amerika Syarikat', 'Petaling Jaya', 'Sungai Petani',
    'Batu Pahat', 'Pulau Pinang', 'Bukan Emas', 'Beli Emas',
}

def bersih(t):
    """Buang markup skrip supaya frasa tak terpotong di tengah."""
    return re.sub(r'\*\*|==|\*|^[->]\s+', ' ', t)

frasa_siri = defaultdict(set)
manifest = json.loads((data / 'index.json').read_text(encoding='utf-8'))

for sid in manifest['siri']:
    d = json.loads((data / f'{sid}.json').read_text(encoding='utf-8'))
    ver = d.get('ver', sid)
    for s in d['segmen']:
        teks = bersih(' '.join(s['skrip']))
        # Frasa nama khas: dua perkataan ke atas bermula huruf besar
        for m in re.findall(r'\b([A-Z][\w\'-]+(?:\s+[A-Z][\w\'-]+){1,3})\b', teks):
            if m in BUANG or any(bahagian in BUANG for bahagian in [m]):
                continue
            if len(m) < 7 or m.isupper():
                continue
            frasa_siri[m].add(ver)

# Frasa yang muncul dalam hampir semua siri ialah ayat standard — nama
# guru, kod dealer, tajuk asas — bukan kisah yang boleh basi. Yang
# menarik ialah frasa yang dikongsi oleh dua atau tiga siri sahaja.
jum = len(manifest['siri'])
had = max(2, round(jum * 0.4))
tindih = {f: sorted(v) for f, v in frasa_siri.items() if 1 < len(v) <= had}

if not tindih:
    print('Tiada kisah bertindih dikesan.')
    raise SystemExit(0)

# Kumpul ikut pasangan siri supaya senang nampak siri mana yang berisiko
pasangan = defaultdict(list)
for f, vers in tindih.items():
    pasangan[tuple(vers)].append(f)

print(f'{len(tindih)} frasa khas dikongsi antara siri '
      f'(diabaikan yang muncul dalam lebih {had} siri — itu ayat standard).\n')
# Pasangan dengan paling banyak frasa dikongsi paling berisiko
RISIKO = 3   # 3 frasa khas dikongsi bermakna satu kisah penuh bertindih

for vers, frasa in sorted(pasangan.items(), key=lambda x: (len(x[0]), -len(x[1]))):
    tanda = '  <-- JANGAN JADUAL BERTURUTAN' if len(frasa) >= RISIKO else ''
    print(f'{" + ".join(vers)}{tanda}')
    for f in sorted(frasa)[:10]:
        print(f'    {f}')
    if len(frasa) > 10:
        print(f'    … dan {len(frasa) - 10} lagi')
    print()

print('Panduan: elakkan menjadualkan siri yang berkongsi banyak frasa')
print('secara berturut-turut kepada audien yang sama.')

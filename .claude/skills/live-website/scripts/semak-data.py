#!/usr/bin/env python3
"""Semak setiap fail skrip dalam data/ sebelum push.

    python3 .claude/skills/live-website/scripts/semak-data.py

Menangkap ralat yang senyap dalam browser tetapi merosakkan pengalaman
masa live: jurang atau pertindihan garis masa, kod buku yang tak
diisytihar (lencana render kosong), dan markup yang tak ditutup.
Keluar dengan kod 1 kalau ada apa-apa masalah, jadi boleh dipasang
dalam hook atau CI.
"""
import json
import re
import sys
from pathlib import Path

akar = Path(__file__).resolve().parents[4]
if not (akar / 'data' / 'index.json').exists():
    akar = Path.cwd()

data = akar / 'data'
salah = []


def periksa(sid):
    fail = data / f'{sid}.json'
    if not fail.exists():
        salah.append(f'{sid}: fail tiada ({fail})')
        return
    d = json.loads(fail.read_text(encoding='utf-8'))

    if not (akar / sid / 'index.html').exists():
        salah.append(f'{sid}: folder shell tiada')
    else:
        html = (akar / sid / 'index.html').read_text(encoding='utf-8')
        m = re.search(r"window\.LIVE_ID\s*=\s*'([^']+)'", html)
        if not m or m.group(1) != sid:
            salah.append(f'{sid}: LIVE_ID dalam shell = {m.group(1) if m else "tiada"}')

    segs = d.get('segmen', [])
    if not segs:
        salah.append(f'{sid}: tiada segmen')
        return

    # Garis masa mesti bersambung tanpa jurang: jam baki segmen
    # dikira daripada tamat, jadi jurang bermakna jam tipu masa live.
    if segs[0]['mula'] != 0:
        salah.append(f'{sid}: segmen 1 tak bermula pada 0')
    if segs[-1]['tamat'] != d.get('durasi'):
        salah.append(f"{sid}: segmen akhir tamat {segs[-1]['tamat']} != durasi {d.get('durasi')}")
    for a, b in zip(segs, segs[1:]):
        if a['tamat'] != b['mula']:
            salah.append(f"{sid}: jurang masa antara segmen {a['no']} dan {b['no']}")
        if a['tamat'] <= a['mula']:
            salah.append(f"{sid}: segmen {a['no']} tiada tempoh")

    diisytihar = set(d.get('buku', {}))
    for s in segs:
        for wajib in ('no', 'tajuk', 'chip', 'mula', 'tamat', 'objektif', 'skrip'):
            if wajib not in s:
                salah.append(f"segmen {s.get('no', '?')} {sid}: medan '{wajib}' tiada")
        # Kod buku tak diisytihar akan render lencana tanpa nama
        for r in s.get('rujukan', []):
            if r['buku'] not in diisytihar:
                salah.append(f"{sid} segmen {s['no']}: kod buku '{r['buku']}' tak ada dalam peta buku")
        # Markup tak berpasangan akan bocor ke skrin sebagai ** atau ==
        for baris in s.get('skrip', []):
            if baris.count('**') % 2:
                salah.append(f"{sid} segmen {s['no']}: ** tak berpasangan — {baris[:55]}…")
            if baris.count('==') % 2:
                salah.append(f"{sid} segmen {s['no']}: == tak berpasangan — {baris[:55]}…")

    lencana = {b.get('label', '') for b in d.get('buku', {}).values()}
    if len(lencana) != len(d.get('buku', {})):
        salah.append(f'{sid}: label lencana berulang')

    print(f"  {sid}  {len(segs)} segmen  {d.get('durasi', 0)//60} min  "
          f"buku: {', '.join(sorted(diisytihar)) or '-'}")


manifest = json.loads((data / 'index.json').read_text(encoding='utf-8'))
print(f"Menyemak {len(manifest['siri'])} siri dalam {akar}\n")
for sid in manifest['siri']:
    periksa(sid)

# Fail skrip yang wujud tapi terlepas daripada manifest takkan muncul di hub
yatim = {p.stem for p in data.glob('live-*.json')} - set(manifest['siri'])
for y in sorted(yatim):
    salah.append(f'{y}: ada dalam data/ tapi tiada dalam manifest index.json')

if salah:
    print('\nMASALAH:')
    for s in salah:
        print('  -', s)
    sys.exit(1)
print('\nSemua lulus.')

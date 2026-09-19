#!/usr/bin/env python3
"""Keluarkan teks skrip daripada .docx tanpa kebergantungan luar.

    python3 .claude/skills/live-website/scripts/ekstrak-docx.py fail.docx [lagi.docx ...]

Tulis <nama>.txt di sebelah setiap .docx dan cetak ringkasan: tajuk,
nombor batch (kalau ada), dan senarai tajuk segmen yang dikesan.

Word membungkus satu ayat dalam banyak <w:r> bila ada pembetulan ejaan
atau tukar fon, jadi teks tidak boleh diambil dengan satu regex ke atas
keseluruhan dokumen — ia mesti dikumpul per perenggan. Itu sebab skrip
ini wujud dan bukan satu baris grep.
"""
import re
import sys
import zipfile
from pathlib import Path

NYAHLARI = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'"}


def nyahlari(t):
    for a, b in NYAHLARI.items():
        t = t.replace(a, b)
    return t


def ekstrak(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read('word/document.xml').decode('utf-8')

    perenggan = re.findall(r'<w:p[ >].*?</w:p>|<w:p/>', xml, re.S)
    baris = []
    for p in perenggan:
        gaya = re.search(r'w:val="(Heading\d|Title|Subtitle)"', p)
        teks = ''.join(re.findall(r'<w:t[^>]*>(.*?)</w:t>', p, re.S))
        prefix = f'[{gaya.group(1)}] ' if gaya else ''
        baris.append(prefix + nyahlari(teks))

    return baris


def main(args):
    if not args:
        print(f'Guna: python3 {sys.argv[0]} <fail.docx> [lagi.docx ...]', file=sys.stderr)
        return 1

    for a in args:
        src = Path(a)
        if not src.exists():
            print(f'  {src}: tak jumpa', file=sys.stderr)
            continue

        baris = ekstrak(src)
        keluar = src.with_suffix('.txt')
        keluar.write_text('\n'.join(baris), encoding='utf-8')

        teks = '\n'.join(baris)
        batch = re.search(r'BATCH\s+(\d+)', teks, re.I)
        # Nombor segmen muncul dua kali — sekali dalam jadual ringkasan
        # garis masa, sekali sebagai tajuk. Ambil kemunculan pertama.
        segmen = {}
        for no, tajuk in re.findall(r'SEGMEN\s+(\d+)\s*:\s*([^\n]{0,60})', teks, re.I):
            segmen.setdefault(int(no), tajuk.strip())
        segmen = sorted(segmen.items())

        print(f'\n{src.name}')
        print(f'  -> {keluar.name}  ({len(teks):,} aksara, {len(baris)} perenggan)')
        print(f'  tajuk : {baris[1][:78] if len(baris) > 1 else baris[0][:78]}')
        print(f'  batch : {batch.group(1) if batch else "(tiada)"}')
        print(f'  segmen: {len(segmen)} dikesan')
        for no, tajuk in segmen:
            print(f'      {no:>2}. {tajuk[:64]}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

#!/usr/bin/env bash
# Sediakan rangka skrip live baharu dalam repo taufikmusa/live.
#
#   bash .claude/skills/live-website/scripts/tambah-siri.sh live-02 [ver-02]
#
# Buat tiga langkah yang diterangkan dalam SKILL.md:
#   1. data/<id>.json  daripada template
#   2. <id>/index.html daripada shell sedia ada, LIVE_ID ditukar
#   3. id ditambah ke dalam array siri di data/index.json
#
# Jalankan dari akar repo. Isi kandungan JSON selepas ini.
set -euo pipefail

ID="${1:-}"
VER="${2:-}"

if [[ -z "$ID" ]]; then
  echo "Guna: bash $0 <id> [ver]   cth: bash $0 live-02" >&2
  exit 1
fi
[[ -z "$VER" ]] && VER="ver-${ID##*-}"

[[ -f data/index.json ]] || { echo "Jalankan dari akar repo (data/index.json tak jumpa)." >&2; exit 1; }
[[ -e "$ID" || -e "data/$ID.json" ]] && { echo "'$ID' sudah wujud. Berhenti." >&2; exit 1; }

# Shell teleprompter: ambil yang sedia ada supaya sentiasa ikut versi terkini
SHELL_SUMBER="$(ls -d */ 2>/dev/null | grep -E '^live-[0-9]+/$' | head -1)"
[[ -n "$SHELL_SUMBER" ]] || { echo "Tiada folder live-NN untuk disalin." >&2; exit 1; }

TEMPLATE="$(dirname "$0")/../assets/skrip-template.json"
[[ -f "$TEMPLATE" ]] || { echo "Template tak jumpa: $TEMPLATE" >&2; exit 1; }

mkdir -p "$ID"
cp "$SHELL_SUMBER/index.html" "$ID/index.html"
# Tukar LIVE_ID sahaja. Tiada apa lagi dalam shell yang khusus kepada satu siri.
perl -pi -e "s/window\.LIVE_ID = '[^']*'/window.LIVE_ID = '${ID}'/" "$ID/index.html"

python3 - "$TEMPLATE" "data/$ID.json" "$ID" "$VER" <<'PY'
import json, sys, collections
tpl, keluar, sid, ver = sys.argv[1:5]
d = json.load(open(tpl, encoding='utf-8'), object_pairs_hook=collections.OrderedDict)
d['id'], d['ver'] = sid, ver
json.dump(d, open(keluar, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
PY

python3 - "$ID" <<'PY'
import json, sys, collections
sid = sys.argv[1]
p = 'data/index.json'
m = json.load(open(p, encoding='utf-8'), object_pairs_hook=collections.OrderedDict)
if sid not in m['siri']:
    m['siri'].append(sid)
json.dump(m, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
open(p, 'a', encoding='utf-8').write('\n')
PY

echo "Siap:"
echo "  data/$ID.json   <- isi kandungan di sini"
echo "  $ID/index.html  (LIVE_ID = $ID)"
echo "  data/index.json <- '$ID' ditambah"
echo
echo "Uji: python3 -m http.server 8099  ->  http://localhost:8099/$ID/"

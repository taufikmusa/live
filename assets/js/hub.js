/* ============================================================
   live.taufik.fyi — hub + carian merentas semua skrip
   Manifest data/index.json cuma senarai id. Kandungan kad
   dan indeks carian dibina terus daripada fail skrip, jadi
   tiada maklumat berulang dan tiada risiko tak sama.
   ============================================================ */
(function () {
  'use strict';

  var siri = [];     // objek skrip penuh
  var hits = [];     // rekod carian rata
  var q = '';
  var filter = 'semua';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function mmss(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  // buang markup skrip supaya snippet bersih
  function plain(s) {
    return String(s).replace(/\*\*/g, '').replace(/==/g, '').replace(/^[->]\s+/, '').replace(/\*/g, '');
  }
  function fold(s) {
    return String(s).toLowerCase()
      .replace(/[''’`]/g, "'")
      .replace(/[—–]/g, '-');
  }

  /* ---------- bina indeks ---------- */
  function buildIndex() {
    hits = [];
    siri.forEach(function (d) {
      d.segmen.forEach(function (s) {
        var badan = s.skrip.map(plain).join(' ');
        var cues = (s.cues || []).join(' ');
        // Nama penuh buku dimasukkan supaya carian "atomic habits" atau
        // "same as ever" menemui segmen, bukan hanya kod pendek lencana.
        var rujuk = (s.rujukan || []).map(function (r) {
          var b = (d.buku || {})[r.buku] || {};
          return r.poin + ' ' + (b.nama || '') + ' ' + (b.label || '');
        }).join(' ');
        hits.push({
          id: d.id,
          ver: d.ver,
          siriTajuk: d.tajuk,
          no: s.no,
          asas: s.asas,
          chip: s.chip,
          tajuk: s.tajuk,
          mula: s.mula,
          tamat: s.tamat,
          badan: badan,
          // berat: tajuk & asas paling kuat, badan paling lemah
          kuat: fold([d.tajuk, s.tajuk, s.asas || '', s.chip || '', rujuk].join(' ')),
          sederhana: fold([s.objektif, cues].join(' ')),
          lemah: fold(badan)
        });
      });
    });
  }

  /* ---------- carian ---------- */
  function cari(teks) {
    var frasa = fold(teks).trim();
    var terma = frasa.split(/\s+/).filter(Boolean);
    if (!terma.length) return [];

    return hits.map(function (h) {
      if (filter !== 'semua' && h.id !== filter) return null;
      var skor = 0;
      for (var i = 0; i < terma.length; i++) {
        var t = terma[i], ada = 0;
        if (h.kuat.indexOf(t) >= 0) { skor += 10; ada = 1; }
        if (h.sederhana.indexOf(t) >= 0) { skor += 4; ada = 1; }
        if (h.lemah.indexOf(t) >= 0) { skor += 1; ada = 1; }
        if (!ada) return null;          // semua terma mesti ada
      }
      // perkataan bersebelahan lebih bermakna daripada bertaburan
      if (terma.length > 1) {
        if (h.kuat.indexOf(frasa) >= 0) skor += 40;
        else if (h.sederhana.indexOf(frasa) >= 0) skor += 20;
        else if (h.lemah.indexOf(frasa) >= 0) skor += 12;
      }
      return { h: h, skor: skor };
    }).filter(Boolean).sort(function (a, b) {
      return b.skor - a.skor || a.h.no - b.h.no;
    });
  }

  function snippet(badan, terma) {
    var low = fold(badan), pos = -1;
    for (var i = 0; i < terma.length && pos < 0; i++) pos = low.indexOf(terma[i]);
    if (pos < 0) return esc(badan.slice(0, 160)) + '…';

    var mula = Math.max(0, pos - 70);
    var potong = badan.slice(mula, mula + 230);
    if (mula > 0) potong = '…' + potong;
    if (mula + 230 < badan.length) potong += '…';

    var out = esc(potong);
    terma.forEach(function (t) {
      // satu terma: sentiasa sorot. banyak terma: langkau kata sambung pendek
      if (!t || (terma.length > 1 && t.length < 3)) return;
      var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }

  /* ---------- render ---------- */
  function renderKad() {
    $('#senarai').innerHTML = siri.map(function (d) {
      var jumSeg = d.segmen.length;
      var h = '<article class="card kad" data-id="' + d.id + '">';
      h += '<a class="kad-top" href="' + d.id + '/">';
      h += '<span class="ver">' + esc(d.ver) + '</span>';
      h += '<h2>' + esc(d.tajuk) + '</h2>';
      h += '<p class="kad-sudut">' + esc(d.subtajuk) + '</p>';
      h += '<div class="meta">';
      h += '<span>' + Math.round(d.durasi / 60) + ' minit</span>';
      h += '<span>' + jumSeg + ' segmen</span>';
      h += '</div></a>';
      h += '<button class="kad-toggle" data-buka="' + d.id + '" aria-expanded="false">' +
           'Lompat terus ke segmen <i>▾</i></button>';
      h += '<ol class="seglist" id="sl-' + d.id + '" hidden>';
      h += d.segmen.map(function (s) {
        return '<li><a href="' + d.id + '/#s' + s.no + '">' +
               '<span class="sl-no">' + s.no + '</span>' +
               '<span class="sl-tajuk">' + esc(s.tajuk) + '</span>' +
               '<span class="sl-masa">' + mmss(s.mula) + '</span></a></li>';
      }).join('');
      h += '</ol></article>';
      return h;
    }).join('');

    // Petunjuk cara tambah siri hanya berguna masa baru ada satu skrip.
    // Lepas tu ia jadi sampah yang sentiasa mengekori senarai.
    if (siri.length < 2) {
      $('#senarai').insertAdjacentHTML('beforeend',
        '<div class="card soon"><span class="ver">seterusnya</span>' +
        '<h2>Slot kosong</h2><p>Tambah satu fail JSON dalam <code>data/</code> ' +
        'dan satu id dalam <code>data/index.json</code> — terus keluar di sini, ' +
        'terus boleh dicari.</p></div>');
    }
  }

  function renderChips() {
    if (siri.length < 2) { $('#vchips').hidden = true; return; }
    $('#vchips').hidden = false;
    $('#vchips').innerHTML =
      '<button class="chip active" data-f="semua">Semua</button>' +
      siri.map(function (d) {
        return '<button class="chip" data-f="' + d.id + '">' + esc(d.ver) + '</button>';
      }).join('');
  }

  function renderHasil() {
    var box = $('#hasil'), list = $('#senarai');

    if (!q.trim()) {
      box.hidden = true;
      list.hidden = false;
      $('#kira').textContent = '';
      return;
    }

    var res = cari(q);
    var terma = fold(q).split(/\s+/).filter(Boolean);
    list.hidden = true;
    box.hidden = false;

    $('#kira').textContent = res.length
      ? res.length + ' segmen padan'
      : 'tiada padanan';

    if (!res.length) {
      box.innerHTML = '<div class="kosong"><b>Tiada apa-apa untuk “' + esc(q) + '”</b>' +
        '<p>Cuba perkataan lain — carian merangkumi tajuk, objektif, cue kamera, ' +
        'rujukan buku dan seluruh teks skrip.</p></div>';
      return;
    }

    box.innerHTML = res.slice(0, 60).map(function (r) {
      var h = r.h;
      return '<a class="hit" href="' + h.id + '/#s' + h.no + '">' +
        '<div class="hit-top">' +
          '<span class="ver">' + esc(h.ver) + '</span>' +
          '<span>Segmen ' + h.no + (h.asas ? ' · ' + esc(h.asas) : '') + '</span>' +
          '<span class="hit-masa">' + mmss(h.mula) + ' – ' + mmss(h.tamat) + '</span>' +
        '</div>' +
        '<b>' + esc(h.tajuk) + '</b>' +
        '<p>' + snippet(h.badan, terma) + '</p>' +
      '</a>';
    }).join('');
  }

  /* ---------- peristiwa ---------- */
  function bind() {
    var input = $('#q');

    input.addEventListener('input', function () {
      q = this.value;
      $('#clearq').hidden = !q;
      renderHasil();
    });

    $('#clearq').addEventListener('click', function () {
      input.value = ''; q = ''; this.hidden = true; renderHasil(); input.focus();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !e.target.matches('input, textarea')) {
        e.preventDefault(); input.focus(); input.select();
      } else if (e.key === 'Escape' && document.activeElement === input) {
        input.value = ''; q = ''; $('#clearq').hidden = true; renderHasil(); input.blur();
      }
    });

    $('#vchips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]');
      if (!b) return;
      filter = b.getAttribute('data-f');
      $$('#vchips .chip').forEach(function (c) { c.classList.toggle('active', c === b); });
      renderHasil();
    });

    $('#senarai').addEventListener('click', function (e) {
      var b = e.target.closest('[data-buka]');
      if (!b) return;
      var ol = $('#sl-' + b.getAttribute('data-buka'));
      var buka = ol.hidden;
      ol.hidden = !buka;
      b.setAttribute('aria-expanded', String(buka));
      b.classList.toggle('open', buka);
    });
  }

  /* ---------- mula ---------- */
  fetch('data/index.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (m) {
      return Promise.all(m.siri.map(function (id) {
        return fetch('data/' + id + '.json', { cache: 'no-cache' })
          .then(function (r) { return r.json(); })
          .then(function (d) { d.id = d.id || id; return d; });
      }));
    })
    .then(function (semua) {
      siri = semua;
      buildIndex();
      renderKad();
      renderChips();
      bind();
      $('#q').disabled = false;
      $('#q').placeholder = 'Cari apa-apa — “Kaizen”, “skim cepat kaya”, “roti canai”…';
      $('#skeleton').remove();
    })
    .catch(function (err) {
      var s = $('#skeleton');
      if (s) s.innerHTML = '<p style="color:var(--warn)">Gagal muat senarai skrip: ' +
        esc(err.message) + '</p>';
    });
})();

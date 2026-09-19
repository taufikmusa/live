/* ============================================================
   live.taufik.fyi — enjin teleprompter
   Satu fail, tiada dependency. Data datang dari /data/<id>.json
   ============================================================ */
(function () {
  'use strict';

  var LIVE_ID = window.LIVE_ID || 'live-01';
  var KEY = 'live.taufik.fyi:' + LIVE_ID;

  var data = null;
  var segs = [];

  /* ---------- keadaan ---------- */
  var state = {
    running: false,
    elapsed: 0,          // saat
    active: 0,           // index segmen
    autoscroll: false,
    speed: 28,           // px sesaat
    size: 22,            // px
    mode: 'penuh',       // penuh | skrip | ringkas
    theme: 'dark',
    checked: {}
  };

  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
  ['speed', 'size', 'mode', 'theme', 'checked', 'elapsed'].forEach(function (k) {
    if (saved[k] !== undefined && saved[k] !== null) state[k] = saved[k];
  });

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        speed: state.speed, size: state.size, mode: state.mode,
        theme: state.theme, checked: state.checked, elapsed: state.elapsed
      }));
    } catch (e) { /* private mode — abaikan */ }
  }

  /* ---------- util ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function mmss(sec) {
    var neg = sec < 0;
    sec = Math.abs(Math.floor(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (neg ? '-' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Markup ringkas: **tebal**  ==sorot==  *condong*
  function inline(str) {
    return esc(str)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/==([^=]+)==/g, '<mark>$1</mark>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  // Blok: "- " senarai, "> " petikan, selainnya perenggan
  function renderSkrip(lines) {
    var html = '', list = null;
    function closeList() { if (list) { html += '<ul>' + list + '</ul>'; list = null; } }

    lines.forEach(function (raw) {
      var line = String(raw).trim();
      if (line.indexOf('- ') === 0) {
        list = (list || '') + '<li>' + inline(line.slice(2)) + '</li>';
        return;
      }
      closeList();
      if (line.indexOf('> ') === 0) {
        html += '<blockquote><p>' + inline(line.slice(2)) + '</p></blockquote>';
      } else if (line) {
        html += '<p>' + inline(line) + '</p>';
      }
    });
    closeList();
    return html;
  }

  /* ---------- render ---------- */
  function render() {
    document.title = data.tajuk + ' — Skrip Live';

    $('#judul').textContent = data.tajuk;
    $('#subjudul').textContent = data.subtajuk;
    $('#meta-hos').textContent = data.hos + ' · ' + data.dealer;
    $('#meta-format').textContent = data.format;
    $('#meta-durasi').textContent = Math.round(data.durasi / 60) + ' minit · ' + data.segmen.length + ' segmen';

    // rujukan teras
    $('#rujukan-teras').innerHTML = data.rujukanTeras.map(function (r) {
      return '<li><b>' + esc(r.tajuk) + '</b> — ' + esc(r.penulis) +
             (r.nota ? ' <span style="color:var(--text-mute)">(' + esc(r.nota) + ')</span>' : '') + '</li>';
    }).join('');

    // checklist props
    $('#props').innerHTML = data.props.map(function (p, i) {
      var on = state.checked['p' + i] ? ' checked' : '';
      return '<li><label><input type="checkbox" data-prop="p' + i + '"' + on + '>' +
             '<span>' + esc(p) + '</span></label></li>';
    }).join('');

    // chips
    $('#chips').innerHTML = data.segmen.map(function (s, i) {
      return '<button class="chip" data-go="' + i + '">' +
             esc(s.chip || (s.no + '. ' + s.tajuk)) + '</button>';
    }).join('');

    // segmen
    $('#segmen').innerHTML = data.segmen.map(function (s, i) {
      var h = '<section class="seg" id="s' + s.no + '" data-i="' + i + '">';
      h += '<div class="seg-head">';
      h += '<div class="seg-kicker">';
      h += '<span class="tag">Segmen ' + s.no + '</span>';
      if (s.asas) h += '<span class="tag gold">' + esc(s.asas) + '</span>';
      h += '<span>' + mmss(s.mula) + ' – ' + mmss(s.tamat) + '</span>';
      h += '<span>' + Math.round((s.tamat - s.mula) / 60) + ' min</span>';
      h += '</div>';
      h += '<h2>' + esc(s.tajuk) + '</h2>';
      h += '<p class="objektif">' + esc(s.objektif) + '</p>';
      h += '</div>';

      if (s.alat) {
        h += '<div class="box alat"><h3>Alat bantuan</h3><p>' + esc(s.alat) + '</p></div>';
      }
      if (s.cues && s.cues.length) {
        h += '<div class="box cues"><h3>Arahan / Cues</h3><ul>' +
             s.cues.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') +
             '</ul></div>';
      }
      if (s.rujukan && s.rujukan.length) {
        h += '<div class="refs">' + s.rujukan.map(function (r) {
          return '<span class="ref ' + esc(r.buku) + '">' + esc(r.poin) + '</span>';
        }).join('') + '</div>';
      }

      h += '<div class="skrip">' + renderSkrip(s.skrip) + '</div>';

      h += '<div class="seg-foot no-print">';
      if (i > 0) h += '<button class="btn" data-go="' + (i - 1) + '">← Segmen ' + (s.no - 1) + '</button>';
      if (i < data.segmen.length - 1) h += '<button class="btn primary" data-go="' + (i + 1) + '">Segmen ' + (s.no + 1) + ' →</button>';
      h += '</div>';

      h += '</section>';
      return h;
    }).join('');

    segs = $$('#segmen .seg');
  }

  /* ---------- jam ---------- */
  var last = 0;
  var bakiPx = 0;     // baki pecahan piksel yang belum cukup 1px
  var saatLepas = -1; // supaya save() sekali sesaat, bukan setiap frame

  function tick(ts) {
    if (state.running) {
      if (last) {
        var dt = Math.min((ts - last) / 1000, 0.25);  // lompat masa (tab tidur) jangan campak skrin
        state.elapsed += dt;

        if (state.autoscroll) {
          // Telefon buang nilai scroll pecahan. Pada 28 px/s satu frame
          // cuma 0.46px, jadi setiap panggilan jadi sifar dan skrin nampak
          // beku. Kumpul baki dulu, hantar bila dah cukup piksel penuh.
          bakiPx += state.speed * dt;
          var px = Math.floor(bakiPx);
          if (px > 0) {
            bakiPx -= px;
            window.scrollBy(0, px);
          }
        }
      }
      last = ts;
      paint();

      var saat = Math.floor(state.elapsed);
      if (saat !== saatLepas && saat % 5 === 0) { saatLepas = saat; save(); }
    } else {
      last = 0;
      bakiPx = 0;
    }
    requestAnimationFrame(tick);
  }

  function paint() {
    var total = data.durasi;
    var el = state.elapsed;
    var over = el > total;

    var clock = $('#clock-val');
    clock.textContent = mmss(el);
    $('#clock').classList.toggle('over', over);

    var pct = Math.min(100, (el / total) * 100);
    $('#bar > i').style.width = pct + '%';
    $('#bar').classList.toggle('over', over);

    var s = data.segmen[state.active];
    var baki = s.tamat - el;
    var st = $('#segtime-val');
    st.textContent = mmss(baki);
    $('#segtime').classList.toggle('over', baki < 0);
  }

  function setActive(i, scroll) {
    i = Math.max(0, Math.min(data.segmen.length - 1, i));
    state.active = i;
    var s = data.segmen[i];

    $('#now-label').textContent = 'Segmen ' + s.no + (s.asas ? ' · ' + s.asas : '');
    $('#now-title').textContent = s.tajuk;

    $$('#chips .chip').forEach(function (c, ci) {
      c.classList.toggle('active', ci === i);
      c.classList.toggle('done', ci < i);
    });
    if ($('#chips .chip.active')) {
      $('#chips .chip.active').scrollIntoView({ block: 'nearest', inline: 'center' });
    }

    if (scroll !== false && segs[i]) {
      segs[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    paint();
  }

  /* ---------- kawalan ---------- */
  function toggleRun() {
    state.running = !state.running;
    $('#play').textContent = state.running ? '⏸' : '▶';
    $('#play').classList.toggle('on', state.running);
    $('#play').setAttribute('aria-label', state.running ? 'Jeda' : 'Mula');
    if (state.running) keepAwake(); else releaseWake();
    save();
  }

  function resetAll() {
    state.running = false;
    state.elapsed = 0;
    $('#play').textContent = '▶';
    $('#play').classList.remove('on');
    releaseWake();
    setActive(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    save();
  }

  function setSize(px) {
    state.size = Math.max(15, Math.min(46, px));
    document.documentElement.style.setProperty('--skrip-size', state.size + 'px');
    var r = $('#rng-size'); if (r) r.value = state.size;
    var v = $('#val-size'); if (v) v.textContent = state.size + 'px';
    save();
  }

  function setMode(m) {
    state.mode = m;
    document.documentElement.setAttribute('data-mode', m);
    $$('[data-mode-btn]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-mode-btn') === m);
    });
    save();
  }

  function setTheme(t) {
    state.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    $('#theme').textContent = t === 'dark' ? '☾' : '☀';
    save();
  }

  function setSpeed(v) {
    state.speed = Math.max(4, Math.min(120, v));
    var r = $('#rng-speed'); if (r) r.value = state.speed;
    var l = $('#val-speed'); if (l) l.textContent = state.speed + ' px/s';
    save();
  }

  function toggleScroll() {
    state.autoscroll = !state.autoscroll;
    $('#scroll').classList.toggle('on', state.autoscroll);
    // CSS scroll-behavior:smooth jadikan setiap scrollBy satu animasi.
    // 60 animasi sesaat bergaduh sesama sendiri dan langsung tak gerak.
    document.documentElement.classList.toggle('autoscroll', state.autoscroll);
    if (state.autoscroll && !state.running) toggleRun();
  }

  /* ---------- skrin jangan tidur ---------- */
  var wake = null;
  function keepAwake() {
    if (!('wakeLock' in navigator)) return;
    navigator.wakeLock.request('screen').then(function (w) { wake = w; }).catch(function () {});
  }
  function releaseWake() { if (wake) { try { wake.release(); } catch (e) {} wake = null; } }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && state.running) keepAwake();
  });

  /* ---------- ikat peristiwa ---------- */
  function bind() {
    $('#play').addEventListener('click', toggleRun);
    $('#reset').addEventListener('click', function () {
      if (state.elapsed > 5 && !confirm('Reset jam ke 0:00?')) return;
      resetAll();
    });
    $('#scroll').addEventListener('click', toggleScroll);
    $('#theme').addEventListener('click', function () { setTheme(state.theme === 'dark' ? 'light' : 'dark'); });
    $('#gear').addEventListener('click', function () { $('#sheet').classList.add('open'); });
    $('#sheet').addEventListener('click', function (e) {
      if (e.target.id === 'sheet' || e.target.hasAttribute('data-close')) $('#sheet').classList.remove('open');
    });

    $('#prev').addEventListener('click', function () { setActive(state.active - 1); });
    $('#next').addEventListener('click', function () { setActive(state.active + 1); });

    $('#rng-size').addEventListener('input', function () { setSize(+this.value); });
    $('#rng-speed').addEventListener('input', function () { setSpeed(+this.value); });
    $$('[data-mode-btn]').forEach(function (b) {
      b.addEventListener('click', function () { setMode(b.getAttribute('data-mode-btn')); });
    });

    document.addEventListener('click', function (e) {
      var go = e.target.closest && e.target.closest('[data-go]');
      if (go) { setActive(+go.getAttribute('data-go')); $('#sheet').classList.remove('open'); }
    });

    $('#props').addEventListener('change', function (e) {
      var k = e.target.getAttribute('data-prop');
      if (k) { state.checked[k] = e.target.checked; save(); }
    });

    // segmen aktif ikut skrol
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var i = +en.target.getAttribute('data-i');
          if (i !== state.active) setActive(i, false);
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    segs.forEach(function (s) { obs.observe(s); });

    // papan kekunci
    document.addEventListener('keydown', function (e) {
      if (e.target.matches('input, textarea, select')) return;
      var k = e.key;
      if (k === ' ') { e.preventDefault(); toggleRun(); }
      else if (k === 'ArrowRight' || k === 'j') { e.preventDefault(); setActive(state.active + 1); }
      else if (k === 'ArrowLeft' || k === 'k') { e.preventDefault(); setActive(state.active - 1); }
      else if (k === '+' || k === '=') { setSize(state.size + 2); }
      else if (k === '-' || k === '_') { setSize(state.size - 2); }
      else if (k === 's') { toggleScroll(); }
      else if (k === 'f') { toggleFull(); }
      else if (k === 'r') { resetAll(); }
      else if (k === '?') { $('#sheet').classList.toggle('open'); }
      else if (k === 'Escape') { $('#sheet').classList.remove('open'); }
      else if (k >= '1' && k <= '9') { setActive(+k - 1); }
    });
  }

  // #s3 daripada hub / pautan dikongsi -> buka terus segmen itu
  function dariHash() {
    var m = /^#s(\d+)$/.exec(location.hash || '');
    if (!m) return false;
    var no = +m[1];
    for (var i = 0; i < data.segmen.length; i++) {
      if (data.segmen[i].no === no) { setActive(i, true); return true; }
    }
    return false;
  }

  function toggleFull() {
    if (!document.fullscreenElement) {
      (document.documentElement.requestFullscreen || function () {}).call(document.documentElement);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  /* ---------- mula ---------- */
  fetch('../data/' + LIVE_ID + '.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (json) {
      data = json;
      render();
      setTheme(state.theme);
      setMode(state.mode);
      setSize(state.size);
      setSpeed(state.speed);
      bind();
      if (!dariHash()) setActive(0, false);
      window.addEventListener('hashchange', dariHash);
      paint();
      requestAnimationFrame(tick);
      $('#loading').remove();
    })
    .catch(function (err) {
      var l = $('#loading');
      if (l) l.innerHTML = '<p style="color:var(--warn)">Gagal muat skrip: ' + esc(err.message) +
        '<br><small style="color:var(--text-mute)">Kalau buka fail ini terus dari komputer (file://), guna server tempatan: <code>python3 -m http.server</code></small></p>';
    });
})();

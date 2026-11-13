/* uitleg.js: tekent de plaatjes bij een uitleg (docs/uitleg.md). Geen afhankelijkheden; draait in de app (window.UitlegVis) en in de test (require).
   render(visual, safe) geeft HTML terug. Elke tekst uit een pakket gaat door safe() (PakketCheck.safeText); getallen worden als getal behandeld.
   Elk onderdeel dat "erbij komt" krijgt de klasse u-in en een vertraging, zodat de uitleg zich stap voor stap opbouwt.
   Met "minder beweging" op het toestel staan alle onderdelen er meteen (de CSS zet animaties dan uit). */
(function (root) {
  'use strict';
  var TYPES = ['bar', 'line', 'ratio', 'steps', 'zin', 'table', 'clock', 'fraction'];
  var TONES = ['mint', 'apricot', 'sky', 'lilac'];
  var W = 320;

  function num(x) { var n = Number(x); return isFinite(n) ? n : 0; }
  // getal in Nederlandse schrijfwijze: komma als decimaalteken, hooguit twee decimalen
  function fmt(x) { var n = Math.round(num(x) * 100) / 100; return String(n).replace('.', ','); }
  function tone(t) { return TONES.indexOf(t) >= 0 ? t : 'mint'; }
  function d(i, step) { return 'animation-delay:' + (i * (step || 0.45)).toFixed(2) + 's'; }
  // tekst in een attribuut: ook aanhalingstekens onschadelijk maken
  function attr(x) { return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function svg(h, body, label) { return '<svg class="u-svg" viewBox="0 0 ' + W + ' ' + h + '" role="img" aria-label="' + attr(label) + '">' + body + '</svg>'; }

  // strook: een geheel dat in stukken verdeeld wordt (procenten, breuken, deel van een bedrag)
  function bar(v, s) {
    var total = num(v.total) || 1, x = 10, w = W - 20, out = '', acc = 0, unit = v.unit ? s(v.unit) + ' ' : '';
    out += '<rect x="' + x + '" y="34" width="' + w + '" height="36" rx="8" fill="var(--surface-2)"/>';
    (v.segs || []).forEach(function (g, i) {
      var gw = Math.max(0, Math.min(w - acc, num(g.v) / total * w)), gx = x + acc, t = tone(g.tone);
      out += '<g class="u-in" style="' + d(i + 1) + '"><rect x="' + gx.toFixed(1) + '" y="34" width="' + gw.toFixed(1) + '" height="36" rx="8" fill="var(--' + t + '-fill)"/>';
      if (g.label) out += '<text x="' + (gx + gw / 2).toFixed(1) + '" y="26" text-anchor="middle" class="u-t u-b">' + s(g.label) + '</text>';
      out += '<text x="' + (gx + gw / 2).toFixed(1) + '" y="57" text-anchor="middle" class="u-t">' + unit + fmt(g.v) + '</text></g>';
      acc += gw;
    });
    out += '<text x="' + x + '" y="90" class="u-t u-m">0</text><text x="' + (x + w) + '" y="90" text-anchor="end" class="u-t u-m">' + unit + fmt(total) + (v.totalLabel ? ' = ' + s(v.totalLabel) : '') + '</text>';
    return svg(98, out, v.alt);
  }

  // getallenlijn met sprongen
  function line(v, s) {
    var a = num(v.from), b = num(v.to); if (b <= a) b = a + 1;
    var step = num(v.step) || (b - a) / 10, x0 = 16, w = W - 32, y = 70, out = '';
    var px = function (n) { return x0 + (num(n) - a) / (b - a) * w; };
    out += '<line x1="' + x0 + '" y1="' + y + '" x2="' + (x0 + w) + '" y2="' + y + '" stroke="var(--ink-2)" stroke-width="2.5" stroke-linecap="round"/>';
    for (var n = a, k = 0; n <= b + 1e-9 && k < 25; n += step, k++) {
      out += '<line x1="' + px(n).toFixed(1) + '" y1="' + (y - 5) + '" x2="' + px(n).toFixed(1) + '" y2="' + (y + 5) + '" stroke="var(--ink-2)" stroke-width="2"/>';
      out += '<text x="' + px(n).toFixed(1) + '" y="' + (y + 20) + '" text-anchor="middle" class="u-t u-m">' + fmt(n) + '</text>';
    }
    (v.jumps || []).forEach(function (j, i) {
      var x1 = px(j.a), x2 = px(j.b), mx = (x1 + x2) / 2;
      out += '<g class="u-in" style="' + d(i + 1, 0.6) + '"><path d="M' + x1.toFixed(1) + ' ' + (y - 6) + ' Q' + mx.toFixed(1) + ' ' + (y - 46) + ' ' + x2.toFixed(1) + ' ' + (y - 6) + '" fill="none" stroke="var(--' + tone(j.tone || 'apricot') + '-ink)" stroke-width="2.5" stroke-linecap="round"/>';
      out += '<circle cx="' + x2.toFixed(1) + '" cy="' + (y - 6) + '" r="3.5" fill="var(--' + tone(j.tone || 'apricot') + '-ink)"/>';
      if (j.label) out += '<text x="' + mx.toFixed(1) + '" y="' + (y - 34) + '" text-anchor="middle" class="u-t u-b">' + s(j.label) + '</text>';
      out += '</g>';
    });
    (v.marks || []).forEach(function (m, i) {
      out += '<g class="u-in" style="' + d((v.jumps || []).length + i + 1, 0.6) + '"><circle cx="' + px(m.at).toFixed(1) + '" cy="' + y + '" r="6" fill="var(--' + tone(m.tone) + '-fill)" stroke="var(--' + tone(m.tone) + '-ink)" stroke-width="2"/>';
      if (m.label) out += '<text x="' + px(m.at).toFixed(1) + '" y="' + (y + 38) + '" text-anchor="middle" class="u-t u-b">' + s(m.label) + '</text>';
      out += '</g>';
    });
    return svg(114, out, v.alt);
  }

  // verhoudingstabel: kolom voor kolom, met de stap ertussen
  function ratio(v, s) {
    var rows = v.rows || ['', ''], cols = v.cols || [], ops = v.ops || [], out = '<div class="u-ratio" role="table">';
    out += '<div class="u-rc u-rh" role="rowgroup"><span></span><span>' + s(rows[0]) + '</span><span>' + s(rows[1]) + '</span></div>';
    cols.forEach(function (c, i) {
      if (i > 0) out += '<div class="u-op u-in" style="' + d(i * 2 - 1, 0.4) + '">' + (ops[i - 1] ? s(ops[i - 1]) : '→') + '</div>';
      out += '<div class="u-rc u-in' + (c[2] ? ' u-hl' : '') + '" style="' + d(i * 2, 0.4) + '"><span></span><span>' + s(String(c[0])) + '</span><span>' + s(String(c[1])) + '</span></div>';
    });
    return out + '</div>';
  }

  // uitgewerkt voorbeeld: regel voor regel
  function steps(v, s) {
    return '<ol class="u-steps">' + (v.lines || []).map(function (l, i) {
      return '<li class="u-in' + (l.hl ? ' u-hl' : '') + '" style="' + d(i, 0.7) + '"><span>' + s(l.l) + '</span>' + (l.r != null ? '<b>' + s(l.r) + '</b>' : '') + '</li>';
    }).join('') + '</ol>';
  }

  // zinnen in blokjes: zinsdelen met een kleur (slot 1-3) of een markering (hl), bijvoorbeeld voor woordvolgorde en leestekens
  function zin(v, s, ctx) {
    var lang = ctx && ctx.lang ? ' lang="' + ctx.lang + '"' : '';
    return '<div class="u-zin">' + (v.rows || []).map(function (r, i) {
      var rl = r.lang === 'en' || r.lang === 'nl' ? ' lang="' + r.lang + '"' : lang;
      return '<div class="u-row u-in" style="' + d(i, 0.8) + '">' + (r.label ? '<span class="u-lab">' + s(r.label) + '</span>' : '') + '<span class="u-parts"' + rl + '>' + (r.parts || []).map(function (p) {
        var c = [1, 2, 3].indexOf(p.slot) >= 0 ? ' slot s' + p.slot : '';
        return '<span class="u-p' + c + (p.hl ? ' u-mark' : '') + (p.glue ? ' u-glue' : '') + '">' + s(p.t) + '</span>';
      }).join('') + '</span></div>';
    }).join('') + '</div>';
  }

  // tabel: vervoeging, vergelijking, positieschema
  function table(v, s) {
    var hl = {}; (v.hl || []).forEach(function (p) { hl[p[0] + ':' + p[1]] = 1; });
    var out = '<table class="u-table">';
    if (v.head) out += '<thead><tr>' + v.head.map(function (h) { return '<th>' + s(h) + '</th>'; }).join('') + '</tr></thead>';
    out += '<tbody>' + (v.rows || []).map(function (r, i) {
      return '<tr class="u-in" style="' + d(i, 0.5) + '">' + r.map(function (c, j) { return '<td' + (hl[i + ':' + j] ? ' class="u-hl"' : '') + '>' + s(String(c)) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table>';
    return out;
  }

  // klok met wijzers
  function clock(v, s) {
    var h = num(v.h), m = num(v.m), out = '', i, r;
    var hand = function (ang, len, w, c) { r = (ang - 90) * Math.PI / 180; return '<line x1="160" y1="80" x2="' + (160 + Math.cos(r) * len).toFixed(1) + '" y2="' + (80 + Math.sin(r) * len).toFixed(1) + '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/>'; };
    out += '<circle cx="160" cy="80" r="70" fill="var(--surface)" stroke="var(--mint-fill)" stroke-width="6"/>';
    for (i = 0; i < 12; i++) { r = (i * 30 - 90) * Math.PI / 180; out += '<line x1="' + (160 + Math.cos(r) * 57).toFixed(1) + '" y1="' + (80 + Math.sin(r) * 57).toFixed(1) + '" x2="' + (160 + Math.cos(r) * 64).toFixed(1) + '" y2="' + (80 + Math.sin(r) * 64).toFixed(1) + '" stroke="var(--ink-2)" stroke-width="' + (i % 3 ? 2 : 3.5) + '" stroke-linecap="round"/>'; }
    [12, 3, 6, 9].forEach(function (n, k) { r = (k * 90 - 90) * Math.PI / 180; out += '<text x="' + (160 + Math.cos(r) * 46).toFixed(1) + '" y="' + (85 + Math.sin(r) * 46).toFixed(1) + '" text-anchor="middle" class="u-t u-m">' + n + '</text>'; });
    out += '<g class="u-in" style="' + d(1) + '">' + hand(m * 6, 54, 4, 'var(--sky-ink)') + '</g><g class="u-in" style="' + d(2) + '">' + hand(((h % 12) + m / 60) * 30, 36, 6, 'var(--ink)') + '</g>';
    out += '<circle cx="160" cy="80" r="5" fill="var(--apricot-fill)"/>';
    return svg(160, out, v.alt);
  }

  // breuk als strook van gelijke stukken
  function fraction(v, s) {
    var den = Math.max(1, Math.min(12, Math.round(num(v.den)))), nm = Math.max(0, Math.min(den, Math.round(num(v.num)))), x = 10, w = (W - 20) / den, out = '', i;
    for (i = 0; i < den; i++) {
      out += '<rect x="' + (x + i * w + 2).toFixed(1) + '" y="20" width="' + (w - 4).toFixed(1) + '" height="44" rx="8" fill="var(--surface-2)"/>';
      if (i < nm) out += '<rect class="u-in" style="' + d(i + 1, 0.35) + '" x="' + (x + i * w + 2).toFixed(1) + '" y="20" width="' + (w - 4).toFixed(1) + '" height="44" rx="8" fill="var(--' + tone(v.tone || 'apricot') + '-fill)"/>';
    }
    out += '<text x="160" y="88" text-anchor="middle" class="u-t u-b">' + nm + ' / ' + den + (v.label ? ' = ' + s(v.label) : '') + '</text>';
    return svg(96, out, v.alt);
  }

  var DRAW = { bar: bar, line: line, ratio: ratio, steps: steps, zin: zin, table: table, clock: clock, fraction: fraction };
  function render(v, safe, ctx) {
    if (!v || TYPES.indexOf(v.type) < 0 || typeof safe !== 'function') return '';
    try { return '<div class="u-vis u-' + v.type + '">' + DRAW[v.type](v, safe, ctx || {}) + '</div>'; } catch (e) { return ''; }
  }

  var api = { TYPES: TYPES, TONES: TONES, render: render, fmt: fmt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.UitlegVis = api;
})(typeof window !== 'undefined' ? window : this);

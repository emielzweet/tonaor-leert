/* kaart.js: de kaart en de tijdlijn (docs/kaart-en-tijdlijn.md). Geen afhankelijkheden; draait in de app (window.KaartVis), in het
   bouwscript (tools/bouw-kaart.mjs) en in de tests (require). Een les geeft altijd lengte- en breedtegraad; de omrekening naar het plaatje
   staat in het kaartbestand (proj). Tekst uit een pakket komt alleen als attribuut of platte tekst in de tekening (attr). */
(function (root) {
  'use strict';
  var RAD = Math.PI / 180, R_KM = 6371;
  var MAPS = ['wereld', 'europa', 'azie', 'nederland'];
  function attr(x) { return String(x == null ? '' : x).replace(/<[^>]*>/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function num(x) { return typeof x === 'number' && isFinite(x); }   /* streng: tekst als "1500" is geen getal (codereview kaart 4) */
  function lab(x) { return x && typeof x === 'object' ? (x.nl || '') : (x == null ? '' : String(x)); }

  /* ---- projectie ---- */
  function lccConst(p) {
    var f1 = p.lat1 * RAD, f2 = p.lat2 * RAD, f0 = p.lat0 * RAD, t = function (f) { return Math.tan(Math.PI / 4 + f / 2); };
    var n = Math.abs(p.lat1 - p.lat2) < 1e-9 ? Math.sin(f1) : Math.log(Math.cos(f1) / Math.cos(f2)) / Math.log(t(f2) / t(f1));
    var F = Math.cos(f1) * Math.pow(t(f1), n) / n;
    return { n: n, F: F, r0: F / Math.pow(t(f0), n) };
  }
  // [lon, lat] → [lengte-eenheden van het model] (zonder schaal en verschuiving)
  function raw(p, ll) {
    if (p.type === 'eqr') return [ll[0], -ll[1]];
    var c = lccConst(p), f = Math.max(-89.9, Math.min(89.9, ll[1])) * RAD, r = c.F / Math.pow(Math.tan(Math.PI / 4 + f / 2), c.n), th = c.n * (ll[0] - p.lon0) * RAD;
    return [r * Math.sin(th), -(c.r0 - r * Math.cos(th))];
  }
  function project(p, ll) { var m = raw(p, ll); return [(m[0] - p.x0) * p.k, (m[1] - p.y0) * p.k]; }
  function unproject(p, xy) {
    var mx = xy[0] / p.k + p.x0, my = xy[1] / p.k + p.y0;
    if (p.type === 'eqr') return [mx, -my];
    var c = lccConst(p), y = -my, rho = (c.n < 0 ? -1 : 1) * Math.sqrt(mx * mx + (c.r0 - y) * (c.r0 - y));
    var th = Math.atan2(c.n < 0 ? -mx : mx, c.n < 0 ? -(c.r0 - y) : c.r0 - y);
    var f = 2 * Math.atan(Math.pow(c.F / rho, 1 / c.n)) - Math.PI / 2;
    return [p.lon0 + th / c.n / RAD, f / RAD];
  }
  // afstand over de aarde in kilometer
  function distKm(a, b) {
    var f1 = a[1] * RAD, f2 = b[1] * RAD, df = f2 - f1, dl = (b[0] - a[0]) * RAD;
    var h = Math.sin(df / 2) * Math.sin(df / 2) + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  // grove richting voor de terugkoppeling: noord, zuid, oost, west (van b gezien liggen we ... van a)
  function dirOf(from, to) {
    var dy = to[1] - from[1], dx = (to[0] - from[0]) * Math.cos((from[1] + to[1]) / 2 * RAD);
    var ns = dy > 0 ? 'noord' : 'zuid', ew = dx > 0 ? 'oost' : 'west';
    if (Math.abs(dy) > 2.414 * Math.abs(dx)) return ns;   /* acht gelijke vakken van 45 graden: tan 67,5 = 2,414 */
    if (Math.abs(dx) > 2.414 * Math.abs(dy)) return ew;
    return ns + ew;   // noordoost, noordwest, zuidoost, zuidwest
  }
  // de uitsnede [lon1, lat1, lon2, lat2] als rechthoek in het plaatje
  function zoomBox(data, zoom) {
    if (!zoom) { var v = data.view; return [v[0], v[1], v[2], v[3]]; }
    var xs = [], ys = [];
    for (var i = 0; i <= 8; i++) for (var j = 0; j <= 8; j++) {
      var q = project(data.proj, [zoom[0] + (zoom[2] - zoom[0]) * i / 8, zoom[1] + (zoom[3] - zoom[1]) * j / 8]); xs.push(q[0]); ys.push(q[1]);
    }
    var x0 = Math.min.apply(null, xs), y0 = Math.min.apply(null, ys);
    return [x0, y0, Math.max.apply(null, xs) - x0, Math.max.apply(null, ys) - y0];
  }

  /* ---- de kaart tekenen ---- */
  // spec: { map, zoom, hl:[ids], pins:[{at,label}], line:{pts,label,draw} }; opts: { tap: true (gebieden aantikbaar), mark: {ok:id, no:id}, dot: [lon,lat], hide: true (geen namen) }
  function renderMap(data, spec, opts) {
    if (!data || !data.regions || !spec) return '';
    var o = opts || {}, box = zoomBox(data, spec.zoom), hl = spec.hl || [], sw = Math.max(box[2], box[3]) / 340, tp = o.tap ? tappable(data, spec.zoom) : {};
    var out = '<rect x="' + box[0] + '" y="' + box[1] + '" width="' + box[2] + '" height="' + box[3] + '" fill="var(--sky,#e2eef7)"/>';
    data.regions.forEach(function (r) {
      var cls = 'k-land' + (hl.indexOf(r.id) >= 0 ? ' k-hl' : '') + (o.mark && o.mark.ok === r.id ? ' k-ok' : '') + (o.mark && o.mark.no === r.id ? ' k-no' : '');
      out += '<path class="' + cls + '" d="' + r.d + '" stroke-width="' + (0.6 * sw).toFixed(3) + '"' + (o.tap && tp[r.id] ? ' data-id="' + attr(r.id) + '" role="button" tabindex="0" aria-label="' + attr(r.name) + '"' : '') + '/>';
    });
    if (spec.line && Array.isArray(spec.line.pts)) {
      var pts = spec.line.pts.map(function (ll) { return project(data.proj, ll).map(function (n) { return n.toFixed(2); }).join(' '); });
      out += '<polyline class="k-line' + (spec.line.draw ? ' k-draw' : '') + '" points="' + pts.join(' ') + '" stroke-width="' + (2.2 * sw).toFixed(3) + '"/>';
      if (spec.line.label) { var e = project(data.proj, spec.line.pts[spec.line.pts.length - 1]); out += '<text class="k-txt" stroke-width="' + (2.5 * sw).toFixed(2) + '" x="' + e[0].toFixed(1) + '" y="' + (e[1] - 4 * sw).toFixed(1) + '" font-size="' + (9 * sw).toFixed(2) + '">' + attr(lab(spec.line.label)) + '</text>'; }
    }
    /* bij de vraag (o.hide) alleen de naam van het antwoord weg: een speld op de gevraagde plek verdwijnt helemaal; andere namen geven houvast (ontwerp, bijgesteld) */
    var isAns = function (p) { return o.hide && Array.isArray(spec.answer) && distKm(p.at, spec.answer) <= Math.max(spec.tol || 0, 1); };
    (spec.pins || []).forEach(function (p) {
      if (isAns(p)) return;
      var q = project(data.proj, p.at);
      out += '<circle class="k-pin" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (3.2 * sw).toFixed(2) + '"/>';
      if (p.label) out += '<text class="k-txt" stroke-width="' + (2.5 * sw).toFixed(2) + '" x="' + (q[0] + 5 * sw).toFixed(1) + '" y="' + (q[1] + 3 * sw).toFixed(1) + '" font-size="' + (9 * sw).toFixed(2) + '" text-anchor="start">' + attr(lab(p.label)) + '</text>';
    });
    if (o.dot) { var d = project(data.proj, o.dot); out += '<circle class="k-dot" cx="' + d[0].toFixed(1) + '" cy="' + d[1].toFixed(1) + '" r="' + (4 * sw).toFixed(2) + '"/>'; }
    if (o.dot2) { var d2 = project(data.proj, o.dot2); out += '<circle class="k-dot2" cx="' + d2[0].toFixed(1) + '" cy="' + d2[1].toFixed(1) + '" r="' + (4 * sw).toFixed(2) + '"/>'; }
    return '<div class="k-vis"><svg class="k-svg" viewBox="' + box.map(function (n) { return n.toFixed(1); }).join(' ') + '" role="' + (o.tap ? 'group' : 'img') + '" aria-label="' + attr(lab(spec.alt) || 'kaart') + '">'   /* met aantikbare gebieden geen img: dat verbergt de knoppen voor een schermlezer */ + out + '</svg></div>';
  }
  // een ring knippen op de uitsnede (Sutherland-Hodgman), zodat een groot land aan de rand niet als reepje telt en een land dat de hele uitsnede bedekt wel meetelt
  function rings(d) { return d.split('M').filter(Boolean).map(function (s) { return s.replace(/Z/g, '').split('L').map(function (p) { return p.trim().split(/\s+/).map(Number); }); }); }
  function clip(ring, b) {
    var x0 = b[0], y0 = b[1], x1 = b[0] + b[2], y1 = b[1] + b[3];
    var edges = [function (p) { return p[0] >= x0; }, function (p) { return p[0] <= x1; }, function (p) { return p[1] >= y0; }, function (p) { return p[1] <= y1; }];
    var cut = [function (a, c) { var t = (x0 - a[0]) / (c[0] - a[0]); return [x0, a[1] + t * (c[1] - a[1])]; }, function (a, c) { var t = (x1 - a[0]) / (c[0] - a[0]); return [x1, a[1] + t * (c[1] - a[1])]; },
      function (a, c) { var t = (y0 - a[1]) / (c[1] - a[1]); return [a[0] + t * (c[0] - a[0]), y0]; }, function (a, c) { var t = (y1 - a[1]) / (c[1] - a[1]); return [a[0] + t * (c[0] - a[0]), y1]; }];
    var out = ring;
    for (var e = 0; e < 4 && out.length; e++) {
      var inp = out; out = [];
      for (var i = 0; i < inp.length; i++) { var a = inp[(i + inp.length - 1) % inp.length], c = inp[i], ia = edges[e](a), ic = edges[e](c); if (ic) { if (!ia) out.push(cut[e](a, c)); out.push(c); } else if (ia) out.push(cut[e](a, c)); }
    }
    return out;
  }
  // de kleinste maat (in pixels) van elk gebied binnen de uitsnede, op de breedte van de inhoud van een kaartje op 375 (ongeveer 300 px)
  var CONTENT_W = 300;
  function regionSizes(data, zoom) {
    var box = zoomBox(data, zoom), scale = CONTENT_W / box[2], out = {};
    data.regions.forEach(function (r) {
      var xs = [], ys = [];
      rings(r.d).forEach(function (ring) { clip(ring, box).forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
      if (xs.length) out[r.id] = Math.min(Math.max.apply(null, xs) - Math.min.apply(null, xs), Math.max.apply(null, ys) - Math.min.apply(null, ys)) * scale;
    });
    return out;
  }
  // alleen gebieden die in de uitsnede minstens 24 px zijn, zijn aan te tikken (een reepje aan de rand niet)
  function tappable(data, zoom) {
    var key = JSON.stringify(zoom || null); data._tap = data._tap || {};
    if (!data._tap[key]) { var sz = regionSizes(data, zoom), ok = {}; Object.keys(sz).forEach(function (id) { if (sz[id] >= 24) ok[id] = 1; }); data._tap[key] = ok; }
    return data._tap[key];
  }

  /* ---- de tijdlijn ---- */
  function yearText(y) { return y < 0 ? (-y) + ' v.Chr.' : String(y); }
  // plek op de lijn (0 = boven = verleden, 1 = onder = nu)
  function tpos(spec, y) {
    var a = spec.from, b = spec.to;
    if (spec.scale === 'log') { var span = b - a; return 1 - Math.log(1 + (b - y)) / Math.log(1 + span); }
    return (y - a) / (b - a);
  }
  function tyear(spec, t) {
    var a = spec.from, b = spec.to;
    if (spec.scale === 'log') { var span = b - a; return Math.round(b - (Math.exp((1 - t) * Math.log(1 + span)) - 1)); }
    return Math.round(a + t * (b - a));
  }
  var TL = { w: 340, top: 24, h: 520, x: 90 };
  // spec: { from, to, scale, marks:[{y,label,known}], spans:[{from,to,label}] }; opts: { cards:[{y,label,at}] geplaatst, real: true (echte plek tonen) }
  function renderTimeline(spec, opts) {
    if (!spec || !num(spec.from) || !num(spec.to) || spec.to <= spec.from) return '';
    var o = opts || {}, Y = function (y) { return TL.top + tpos(spec, y) * TL.h; };
    var out = '<line class="t-axis" x1="' + TL.x + '" y1="' + TL.top + '" x2="' + TL.x + '" y2="' + (TL.top + TL.h) + '"/>';
    out += '<text class="t-end" x="' + (TL.x - 8) + '" y="' + (TL.top - 8) + '" text-anchor="end">' + attr(yearText(spec.from)) + '</text><text class="t-end" x="' + (TL.x - 8) + '" y="' + (TL.top + TL.h + 16) + '" text-anchor="end">' + attr(yearText(spec.to)) + '</text>';
    (spec.spans || []).forEach(function (s) { var a = Y(s.from), b = Y(s.to); out += '<rect class="t-span" x="' + (TL.x - 6) + '" y="' + a.toFixed(1) + '" width="12" height="' + Math.max(2, b - a).toFixed(1) + '" rx="4"/><text class="t-lab" x="' + (TL.x + 14) + '" y="' + ((a + b) / 2 + 4).toFixed(1) + '">' + attr(lab(s.label)) + '</text>'; });
    (spec.marks || []).forEach(function (m) { var y = Y(m.y); out += '<circle class="t-mark' + (m.known ? ' t-known' : '') + '" cx="' + TL.x + '" cy="' + y.toFixed(1) + '" r="5"/><text class="t-year" x="' + (TL.x - 10) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + attr(yearText(m.y)) + '</text><text class="t-lab" x="' + (TL.x + 12) + '" y="' + (y + 4).toFixed(1) + '">' + attr(lab(m.label)) + '</text>'; });
    (o.cards || []).forEach(function (c, i) {
      if (c.at != null) { var y = Y(c.at); out += '<g class="t-card t-c' + (i % 4) + '"><circle cx="' + TL.x + '" cy="' + y.toFixed(1) + '" r="7"/><text class="t-lab" x="' + (TL.x + 14) + '" y="' + (y + 4).toFixed(1) + '">' + attr(lab(c.label)) + '</text></g>'; }
      if (o.real) { var r = Y(c.y); out += '<g class="t-real"><circle cx="' + TL.x + '" cy="' + r.toFixed(1) + '" r="5"/><text class="t-year" x="' + (TL.x - 10) + '" y="' + (r + 4).toFixed(1) + '" text-anchor="end">' + attr(yearText(c.y)) + '</text></g>'; }
    });
    return '<div class="t-vis"><svg class="t-svg" viewBox="0 0 ' + TL.w + ' ' + (TL.h + TL.top * 2) + '" role="img" aria-label="tijdlijn">' + out + '<rect class="t-hit" x="0" y="' + TL.top + '" width="' + TL.w + '" height="' + TL.h + '"/></svg></div>';
  }
  // nakijken: volgorde klopt en elk kaartje binnen tol jaar
  function checkCards(cards, tol) {
    if (!Array.isArray(cards) || cards.length < 2) return false;   /* zonder kaartjes niets goed te rekenen (codereview kaart 2) */
    var placed = cards.every(function (c) { return num(c.at); }); if (!placed) return false;
    var byAt = cards.slice().sort(function (a, b) { return a.at - b.at; }), byY = cards.slice().sort(function (a, b) { return a.y - b.y; });
    return byAt.every(function (c, i) { return c === byY[i]; }) && cards.every(function (c) { return Math.abs(c.at - c.y) <= tol; });
  }

  // elke naam op de kaart of de lijn: tekst, of een object met minstens nl (de app toont nl; de tekening ontsnapt hem met attr)
  function labels(spec) {
    var p = [], ok = function (x) { return typeof x === 'string' ? !!x.trim() : !!(x && typeof x === 'object' && typeof x.nl === 'string' && x.nl.trim()); };
    (spec.pins || []).forEach(function (q, i) { if (q.label != null && !ok(q.label)) p.push('pins[' + i + ']: label als tekst of {nl, th, en}'); });
    if (spec.line && spec.line.label != null && !ok(spec.line.label)) p.push('line: label als tekst of {nl, th, en}');
    (spec.marks || []).forEach(function (q, i) { if (!ok(q.label)) p.push('marks[' + i + ']: label ontbreekt'); });
    (spec.spans || []).forEach(function (q, i) { if (!ok(q.label)) p.push('spans[' + i + ']: label ontbreekt'); });
    return p;
  }

  /* ---- controle voor de poort (zonder kaartgegevens: vorm; met kaartgegevens: ids, uitsnede en maat) ---- */
  function checkMapSpec(spec, data) {
    var p = [];
    if (!spec || MAPS.indexOf(spec.map) < 0) return ['onbekende kaart: ' + (spec && spec.map)];
    var inZoom = function (ll) { var z = spec.zoom; return !z || (ll[0] >= z[0] && ll[0] <= z[2] && ll[1] >= z[1] && ll[1] <= z[3]); };
    var okLL = function (ll) { return Array.isArray(ll) && ll.length === 2 && num(ll[0]) && num(ll[1]) && Math.abs(ll[0]) <= 180 && Math.abs(ll[1]) <= 90; };
    if (spec.zoom != null && !(Array.isArray(spec.zoom) && spec.zoom.length === 4 && spec.zoom.every(num) && spec.zoom[0] < spec.zoom[2] && spec.zoom[1] < spec.zoom[3])) return p.concat('zoom: [lengte, breedte, lengte, breedte] als getallen, van linksonder naar rechtsboven');
    if (spec.answer != null && typeof spec.answer !== 'string' && !Array.isArray(spec.answer)) p.push('answer: een gebied-id of een plek [lengte, breedte]');
    if (spec.tol != null && !(num(spec.tol) && spec.tol > 0)) p.push('tol: een afstand in km, groter dan 0');
    labels(spec).forEach(function (m) { p.push(m); });
    (spec.pins || []).forEach(function (q, i) { if (!okLL(q.at)) p.push('pins[' + i + ']: at [lengte, breedte]'); else if (!inZoom(q.at)) p.push('pins[' + i + ']: buiten de uitsnede'); });
    if (spec.line) { if (!Array.isArray(spec.line.pts) || spec.line.pts.length < 2 || !spec.line.pts.every(okLL)) p.push('line: minstens twee punten [lengte, breedte]'); }
    if (Array.isArray(spec.answer) && (!okLL(spec.answer) || !inZoom(spec.answer))) p.push('answer: een plek [lengte, breedte] binnen de uitsnede');
    if (Array.isArray(spec.answer) && spec.tol == null) p.push('tol: een afstand in km, groter dan 0');
    if (data) {
      var ids = {}; data.regions.forEach(function (r) { ids[r.id] = 1; });
      (spec.hl || []).forEach(function (id) { if (!ids[id]) p.push('hl: gebied ' + id + ' bestaat niet op de kaart ' + spec.map); });
      if (typeof spec.answer === 'string') {
        if (!ids[spec.answer]) p.push('answer: gebied ' + spec.answer + ' bestaat niet op de kaart ' + spec.map);
        var sz = regionSizes(data, spec.zoom);
        if (ids[spec.answer] && sz[spec.answer] == null) p.push('answer: gebied ' + spec.answer + ' ligt niet in de uitsnede');
        else if (ids[spec.answer] && sz[spec.answer] < 24) p.push('answer: gebied ' + spec.answer + ' is in deze uitsnede kleiner dan 24 px en dus niet aan te tikken: kies een kleinere uitsnede');
      }
    }
    return p;
  }
  function checkTimeline(spec, cards, tol) {
    var p = [];
    if (!spec || !num(spec.from) || !num(spec.to) || spec.to <= spec.from) return ['tijdlijn: from vóór to, als getallen'];
    labels(spec).forEach(function (m) { p.push(m); });
    if (spec.scale != null && ['lin', 'log'].indexOf(spec.scale) < 0) p.push('tijdlijn: scale lin of log');
    var inR = function (y) { return num(y) && y >= spec.from && y <= spec.to; };
    (spec.marks || []).forEach(function (m, i) { if (!inR(m.y)) p.push('marks[' + i + ']: jaartal buiten de lijn'); });
    (spec.spans || []).forEach(function (s, i) { if (!inR(s.from) || !inR(s.to) || s.to < s.from) p.push('spans[' + i + ']: van en tot op de lijn'); });
    if (cards) {
      if (!Array.isArray(cards) || cards.length < 2 || cards.length > 5) p.push('cards: twee tot vijf kaartjes');
      else {
        cards.forEach(function (c, i) { if (!inR(c.y)) p.push('cards[' + i + ']: jaartal buiten de lijn'); if (!c.label) p.push('cards[' + i + ']: label ontbreekt'); });
        var ys = cards.map(function (c) { return c.y; }); if (ys.some(function (y, i) { return ys.indexOf(y) !== i; })) p.push('cards: twee kaartjes met hetzelfde jaartal (dan is de volgorde niet eenduidig)');
      }
      if (tol != null && !(num(tol) && tol > 0)) p.push('tol: groter dan 0');
      if (spec.scale === 'log' && tol == null) p.push('tol: verplicht bij een log-tijdlijn (10% van de hele lijn zegt daar niets)');
    }
    return p;
  }
  function defaultTol(spec) { return Math.round((spec.to - spec.from) * 0.1); }

  var CSS = '.k-vis,.t-vis{border-radius:var(--r,22px);overflow:hidden;background:var(--surface)}.k-svg,.t-svg{display:block;width:100%;height:auto}' +
    '.k-vis{background:var(--sky,#e2eef7)}.k-land{fill:var(--apricot,#fbefd9);stroke:var(--apricot-deep,#d9b46a)}.k-hl{fill:var(--mint-fill,#a9d5bd)}.k-ok{fill:var(--mint-deep,#79b597);stroke:var(--mint-ink,#3e7b5d)!important;stroke-width:2.5px!important;vector-effect:non-scaling-stroke}.k-no{fill:var(--apricot-fill,#f3d89f);stroke-dasharray:4 3;stroke:var(--apricot-ink,#8a6220)!important;stroke-width:2px!important;vector-effect:non-scaling-stroke}' +
    '[data-id].k-land{cursor:pointer}[data-id].k-land:hover,[data-id].k-land:focus-visible{fill:var(--sun,#f6dc9a);outline:none}' +
    '.k-line{fill:none;stroke:var(--sky-ink,#4a7fa8);stroke-linecap:round;stroke-linejoin:round}.k-draw{stroke-dasharray:2000;stroke-dashoffset:2000;animation:k-draw 3s ease-out forwards}@keyframes k-draw{to{stroke-dashoffset:0}}' +
    '.k-pin{fill:var(--lilac-ink,#6c5d98)}.k-dot{fill:var(--apricot-ink,#8a6220)}.k-dot2{fill:var(--mint-ink,#3e7b5d)}.k-txt{fill:var(--ink);font-family:var(--f-body),sans-serif;paint-order:stroke;stroke:var(--surface)}' +
    '.t-axis{stroke:var(--ink-2,#66736c);stroke-width:2}.t-end,.t-year{fill:var(--ink-2,#66736c);font-size:13px;font-family:var(--f-body),sans-serif}.t-lab{fill:var(--ink);font-size:14px;font-family:var(--f-body),sans-serif}' +
    '.t-mark{fill:var(--surface);stroke:var(--ink-2,#66736c);stroke-width:2}.t-known{fill:var(--sky-fill,#b6d4ea)}.t-span{fill:var(--lilac-fill,#d2c7ec)}.t-card circle{fill:var(--apricot-fill,#f3d89f);stroke:var(--apricot-ink,#8a6220);stroke-width:2}' +
    '.t-real circle{fill:var(--mint-deep,#79b597)}.t-hit{fill:transparent;cursor:pointer}' +
    '@media (prefers-reduced-motion:reduce){.k-draw{animation:none;stroke-dashoffset:0}}';

  var api = { MAPS: MAPS, project: project, unproject: unproject, raw: raw, distKm: distKm, dirOf: dirOf, zoomBox: zoomBox, renderMap: renderMap, regionSizes: regionSizes, tappable: tappable,
    renderTimeline: renderTimeline, tpos: tpos, tyear: tyear, TL: TL, yearText: yearText, checkCards: checkCards, checkMapSpec: checkMapSpec, checkTimeline: checkTimeline, defaultTol: defaultTol, CSS: CSS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KaartVis = api;
})(this);

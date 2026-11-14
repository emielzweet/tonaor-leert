/* route.js: de route met tijd (docs/route-en-prognose.md, docs/ontwerp-stap4.md). Geen afhankelijkheden; draait in de app (window.RouteCalc)
   en in de tests (require). Alles is rekenen op gewone gegevens: de app geeft de opslag en de route uit het pakket mee. Tijden in ms, uren als getal. */
(function (root) {
  'use strict';
  var DAY = 864e5, WEEK = 7 * DAY, VAKKEN = ['nl', 'rk', 'en'];
  var num = function (x) { return typeof x === 'number' && isFinite(x); };

  /* ---- het routepakket controleren (pakketcheck en de test gebruiken dit) ---- */
  function checkRoute(r) {
    var p = [], ids = {}, txt = function (x) { return !!(x && typeof x === 'object' && typeof x.nl === 'string' && x.nl.trim() && typeof x.en === 'string' && typeof x.th === 'string'); };
    if (!r || r.type !== 'route') return ['geen route'];
    if (!txt(r.naam)) p.push('naam: {nl, th, en}');
    var sh = r.aandeel || {}, som = 0;
    VAKKEN.forEach(function (v) { if (!num(sh[v]) || sh[v] < 0) p.push('aandeel.' + v + ': een getal van 0 tot 1'); else som += sh[v]; });
    if (Math.abs(som - 1) > 0.001) p.push('aandeel: samen 1');
    if (!Array.isArray(r.banen) || !r.banen.length) return p.concat('banen ontbreken');
    if (r.poorten != null && !Array.isArray(r.poorten)) return p.concat('poorten moet een lijst zijn');
    var vakken = {}, gids = {};
    r.banen.forEach(function (b, i) {
      var w = 'banen[' + i + ']';
      if (!b || typeof b !== 'object') { p.push(w + ': geen baan'); return; }
      if (vakken[b.vak]) p.push(w + ': vak ' + b.vak + ' heeft al een baan'); vakken[b.vak] = 1;
      if (VAKKEN.indexOf(b.vak) < 0) p.push(w + ': vak nl, rk of en');
      if (!txt(b.naam)) p.push(w + '.naam: {nl, th, en}');
      if (!Array.isArray(b.blokken) || !b.blokken.length) { p.push(w + ': blokken ontbreken'); return; }
      b.blokken.forEach(function (k, j) {
        var u = w + '.blokken[' + j + ']';
        if (!k || typeof k !== 'object') { p.push(u + ': geen blok'); return; }
        if (typeof k.id !== 'string' || !/^[A-Za-z0-9-]{1,20}$/.test(k.id)) p.push(u + ': id'); else if (ids[k.id]) p.push(u + ': id ' + k.id + ' komt twee keer voor'); else ids[k.id] = b.vak;
        if (!txt(k.naam)) p.push(u + '.naam: {nl, th, en}');
        if (!txt(k.kan)) p.push(u + '.kan: {nl, th, en}');
        if (!(num(k.lo) && num(k.hi) && k.lo > 0 && k.hi >= k.lo)) p.push(u + ': uren lo en hi, lo > 0 en hi >= lo');
      });
    });
    (r.poorten || []).forEach(function (g, i) {
      var w = 'poorten[' + i + ']';
      if (!g || typeof g !== 'object') { p.push(w + ': geen poort'); return; }
      if (typeof g.id !== 'string' || !g.id) p.push(w + ': id'); else if (gids[g.id]) p.push(w + ': id ' + g.id + ' komt twee keer voor'); else gids[g.id] = 1;
      if (!txt(g.naam)) p.push(w + '.naam: {nl, th, en}');
      if (!ids[g.na]) p.push(w + ': na moet een blok van de route zijn');
      if (!(num(g.marge) && g.marge >= 0)) p.push(w + ': marge in weken (0 of meer)');
      (g.onderdelen || []).forEach(function (o, j) { if (!txt(o)) p.push(w + '.onderdelen[' + j + ']: {nl, th, en}'); });
      if (g.voorwaarden != null && !txt(g.voorwaarden)) p.push(w + '.voorwaarden: {nl, th, en}');
    });
    return p;
  }

  /* ---- tijd per vak ---- */
  // minuten per vak op een dag: de klok per vak (minsV), anders (oude dagen) de totale tijd verdeeld naar aandeel; tijd buiten de app telt als Nederlands
  function dayVak(S, d, sh) {
    var v = S.minsV && S.minsV[d], o = outsideMins(S, d), out = {};
    VAKKEN.forEach(function (k) { out[k] = v ? (+v[k] || 0) : (+(S.mins && S.mins[d]) || 0) * sh[k]; });
    out.nl += o;
    return out;
  }
  function outsideMins(S, d) { var o = S.outside && S.outside[d]; if (!o || typeof o !== 'object') return 0; var s = 0; for (var k in o) s += +o[k] || 0; return Math.min(60, s); }
  function days(S) { var ks = {}; [S.mins, S.minsV, S.outside].forEach(function (m) { for (var k in (m || {})) if (num(+k)) ks[k] = 1; }); return Object.keys(ks).map(Number); }
  // uren in een vak, in totaal
  function doneHours(S, vak, sh) { return days(S).reduce(function (a, d) { return a + dayVak(S, d, sh)[vak]; }, 0) / 60; }
  // uren per week in een vak: gemiddelde van de laatste vier weken; in de eerste twee weken (of zonder leertijd) het weekdoel naar aandeel
  function tempo(S, vak, sh, today, goalMins) {
    var ds = days(S).filter(function (d) { var m = dayVak(S, d, sh); return m.nl + m.rk + m.en > 0; });
    var first = ds.length ? Math.min.apply(null, ds) : null;
    if (first == null || today - first < 14 * DAY) return { h: goalMins / 60 * sh[vak], bron: 'doel' };
    var d0 = new Date(today); d0.setHours(0, 0, 0, 0); var t0 = d0.getTime();   /* hele dagen: vandaag en de 27 dagen ervoor */
    var dc = new Date(t0); dc.setDate(dc.getDate() - 27); var cut = dc.getTime();   /* met de kalender, zodat zomer- en wintertijd geen dag kosten */
    var span = Math.min(28, Math.round((t0 - first) / DAY) + 1);
    var s = ds.filter(function (d) { return d >= cut && d <= t0; }).reduce(function (a, d) { return a + dayVak(S, d, sh)[vak]; }, 0);
    return { h: s / 60 / (span / 7), bron: 'tempo' };
  }

  /* ---- de verwachting ---- */
  function baanOf(route, blockId) { for (var i = 0; i < route.banen.length; i++) if (route.banen[i].blokken.some(function (b) { return b.id === blockId; })) return route.banen[i]; return null; }
  // bijstelling per baan: een factor op de uren van wat nog komt (1 = de schatting)
  function factor(adj, vak) { var f = adj && adj[vak]; return num(f) && f > 0.2 && f < 5 ? f : 1; }
  // de blokken van een baan met hun uren van begin tot eind (lo, mid, hi), en hoe ver je bent
  function blocks(baan, done, adj) {
    var f = factor(adj, baan.vak), a = { lo: 0, mid: 0, hi: 0 };
    return baan.blokken.map(function (b) {
      var u = { lo: b.lo * f, hi: b.hi * f }; u.mid = (u.lo + u.hi) / 2;
      var o = { id: b.id, b: b, start: { lo: a.lo, mid: a.mid, hi: a.hi } };
      a = { lo: a.lo + u.lo, mid: a.mid + u.mid, hi: a.hi + u.hi };
      o.end = { lo: a.lo, mid: a.mid, hi: a.hi };
      o.prog = Math.max(0, Math.min(1, (done - o.start.mid) / (o.end.mid - o.start.mid)));
      return o;
    });
  }
  // datum (ms) waarop een aantal uur gedaan is, bij een tempo in uur per week
  function when(today, hoursLeft, perWeek) { return today + Math.max(0, hoursLeft) / perWeek * WEEK; }
  // de verwachting voor een poort: vroegst, verwacht, laatst (ms), of null zonder tempo
  function forecast(route, gate, done, perWeek, today, adj) {
    var baan = baanOf(route, gate.na); if (!baan || !(perWeek > 0.01)) return null;
    var bl = blocks(baan, done, adj), last = bl.filter(function (o) { return o.id === gate.na; })[0], m = (gate.marge || 0) * WEEK;
    return { lo: when(today, last.end.lo - done, perWeek) + m, mid: when(today, last.end.mid - done, perWeek) + m, hi: when(today, last.end.hi - done, perWeek) + m, vak: baan.vak };
  }
  // bijstellen na een afgerond blok: het gemiddelde van de schatting en wat het werkelijk kostte (route-en-prognose.md, aanname)
  function adjusted(oldF, estMid, actual) { if (!(estMid > 0) || !(actual > 0)) return oldF; var f = (oldF || 1) * ((estMid + actual) / 2) / estMid; return Math.max(0.25, Math.min(4, f)); }
  // de eerstvolgende poort: de vroegste verwachte datum
  function nextGate(list) { return list.filter(function (x) { return x.f; }).sort(function (a, b) { return a.f.mid - b.f.mid; })[0] || null; }
  // week van een datum (maandag 0:00, lokale tijd)
  function monday(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() - ((d.getDay() + 6) % 7) * DAY; }
  // verschil in hele weken tussen twee verwachtingen (+ = later)
  function shiftWeeks(oldMid, newMid) { return Math.round((newMid - oldMid) / WEEK); }
  // verschuiving van een poort ten opzichte van de vastgelegde week van minstens vier weken eerder (kalender, met een halve dag speling voor zomer- en wintertijd)
  function shiftFrom(prog, week, id) {
    if (!prog || typeof prog !== 'object') return null;
    var dc = new Date(week); dc.setDate(dc.getDate() - 28); var lim = dc.getTime() + DAY / 2;
    var ks = Object.keys(prog).map(Number).filter(function (x) { return num(x) && x <= lim; }).sort(function (a, b) { return b - a; });
    var o = ks.length && prog[ks[0]] && prog[ks[0]][id], c = prog[week] && prog[week][id];
    return Array.isArray(o) && Array.isArray(c) && num(o[1]) && num(c[1]) ? shiftWeeks(o[1], c[1]) : null;
  }

  var api = { DAY: DAY, WEEK: WEEK, VAKKEN: VAKKEN, checkRoute: checkRoute, dayVak: dayVak, outsideMins: outsideMins, doneHours: doneHours, tempo: tempo,
    blocks: blocks, shiftFrom: shiftFrom, forecast: forecast, adjusted: adjusted, nextGate: nextGate, monday: monday, shiftWeeks: shiftWeeks, baanOf: baanOf, factor: factor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RouteCalc = api;
})(this);

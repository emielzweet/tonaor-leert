/* pakketcheck.js: controle van inhoudspakketten (docs/pakketformaat.md, versie 1).
   Dezelfde code draait in de app (window.PakketCheck) en in de test (require). Geen afhankelijkheden.
   - safeText(s): maakt tekst onschadelijk en zet alleen <b> <i> <u> terug. Alle tekst uit een pakket gaat hierdoor, ook ingebouwd.
   - checkPack(pakket, anderePakketten): {errors:[], quality:[]}. Fouten blokkeren altijd; kwaliteit blokkeert alleen bij quality:"strict". */
(function (root) {
  'use strict';
  var SUP = ['th', 'en'];
  var LEARN = ['nl', 'en'];
  var FORMS = ['learn', 'recog', 'recall', 'build', 'gap', 'listen', 'dictee', 'mc', 'clock', 'money', 'discount'];
  var RESERVED = ['hear-type', 'complete', 'own', 'write', 'situation', 'match', 'spot'];
  var TOP = ['format', 'id', 'type', 'version', 'scenes', 'place', 'learn', 'level', 'order', 'quality', 'requires', 'title', 'items', 'texts', 'cards', 'exercises', 'explain', 'lesson', 'lessonShort', 'tests'];
  var TAGS = /<\/?(b|i|u)>/g;
  // id's (pakket, item, tekst, kaart, oefening, groep): alleen letters, cijfers, punt, streepje, onderstreepje
  var ID = /^[A-Za-z0-9._-]+$/;
  // vaste lijsten voor velden die de app zonder escape gebruikt (klasse, taal, sleutel)
  var TONES = ['sky', 'lilac'];
  var SKILLS = ['woorden', 'grammatica', 'luisteren', 'lezen', 'rekenen', 'engels'];
  var SORTS = ['bericht', 'portret', 'tips', 'voorlichting', 'procedure', 'brief', 'folder', 'tabel', 'dialoog', 'verhaal'];
  var QTYPES = ['geheel', 'detail', 'waarom', 'toepassen', 'woord'];
  var NOTESTYLES = ['muted'];
  var SAYLANGS = ['nl', 'en'];
  // uitleg (docs/uitleg.md): onderwerpen, soorten plaatjes en kleuren; dezelfde lijsten als in uitleg.js
  var SUBJECTS = ['rekenen', 'grammatica', 'leestekens'];
  var VIS = ['bar', 'line', 'ratio', 'steps', 'zin', 'table', 'clock', 'fraction'];
  var VTONES = ['mint', 'apricot', 'sky', 'lilac'];

  function safeText(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&lt;(\/?)(b|i|u)&gt;/g, '<$1$2>');
  }
  // alleen <b> <i> <u> toegestaan; geen andere < of >, en geen HTML-tekencodes (&lt; &#60; ...). Een losse & mag wel.
  function badMarkup(s) { var rest = String(s).replace(TAGS, ''); return /[<>]/.test(rest) || /&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i.test(rest); }

  function checkPack(p, others, opts) {
    var errors = [], quality = [];
    var err = function (m) { errors.push(m); };
    var q = function (m) { quality.push(m); };
    others = others || [];
    if (!p || typeof p !== 'object') return { errors: ['pakket is geen object'], quality: [] };
    var id = p.id || '?';
    if (p.format !== 1) err(id + ': format moet 1 zijn');
    if (typeof p.id !== 'string' || !/^[a-z0-9-]+$/.test(p.id)) { err('id ontbreekt of is ongeldig'); id = '?'; }
    if (LEARN.indexOf(p.learn) < 0) err(id + ': learn moet ' + LEARN.join(' of ') + ' zijn');
    if (typeof p.order !== 'number') err(id + ': order ontbreekt');
    if (p.quality && ['strict', 'legacy'].indexOf(p.quality) < 0) err(id + ': quality moet strict of legacy zijn');
    Object.keys(p).forEach(function (k) { if (TOP.indexOf(k) < 0) q(id + ': onbekend veld ' + k + ' (waarschuwing)'); });
    var reqLangs = ['nl'].concat(SUP); // talen in een Tekst-object: nl + elke steuntaal
    var trLangs = ['nl'].concat(SUP).filter(function (l) { return l !== p.learn; });

    // Tekst: string, of object met nl en elke steuntaal; varianten nl@th, nl@en, nl@uit
    function tekst(x, where, opt) {
      if (x == null) { if (!opt) err(where + ': tekst ontbreekt'); return; }
      if (typeof x === 'string') { if (badMarkup(x)) err(where + ': niet toegestane opmaak'); return; }
      if (typeof x !== 'object' || Array.isArray(x)) { err(where + ': tekst moet een string of object zijn'); return; }
      reqLangs.forEach(function (l) { if (typeof x[l] !== 'string' || !x[l]) err(where + ': vertaling ' + l + ' ontbreekt'); });
      Object.keys(x).forEach(function (k) {
        if (reqLangs.indexOf(k) < 0 && ['nl@th', 'nl@en', 'nl@uit'].indexOf(k) < 0) err(where + ': onbekende taal ' + k);
        else if (typeof x[k] === 'string' && badMarkup(x[k])) err(where + ' (' + k + '): niet toegestane opmaak');
      });
    }
    // vertaling bij inhoud: elke steuntaal behalve de leertaal
    function tr(x, where, isArray, n) {
      if (!x || typeof x !== 'object') { err(where + ': tr ontbreekt'); return; }
      trLangs.forEach(function (l) {
        var v = x[l];
        if (isArray) { if (!Array.isArray(v) || v.length !== n) err(where + ': tr.' + l + ' moet ' + n + ' vertalingen hebben'); else v.forEach(function (s, i) { if (badMarkup(s)) err(where + ': tr.' + l + '[' + i + '] opmaak'); }); }
        else if (typeof v !== 'string' || !v) err(where + ': tr.' + l + ' ontbreekt');
        else if (badMarkup(v)) err(where + ': tr.' + l + ' opmaak');
      });
    }
    function str(x, where) { if (typeof x !== 'string' || !x) err(where + ': ontbreekt'); else if (badMarkup(x)) err(where + ': niet toegestane opmaak'); }

    // id's uniek, ook over andere pakketten
    var seen = {};
    others.forEach(function (o) { ['items', 'texts', 'cards', 'exercises', 'explain'].forEach(function (k) { (o[k] || []).forEach(function (x) { seen[x.id] = o.id; }); }); });
    var own = {};
    ['items', 'texts', 'cards', 'exercises', 'explain'].forEach(function (k) {
      if (p[k] != null && !Array.isArray(p[k])) err(id + ': ' + k + ' moet een lijst zijn');
      (p[k] || []).forEach(function (x, i) {
        if (!x || typeof x.id !== 'string' || !x.id) { err(id + '.' + k + '[' + i + ']: id ontbreekt'); return; }
        if (!ID.test(x.id)) { err(id + '.' + k + '[' + i + ']: id mag alleen letters, cijfers, punt, streepje en onderstreepje bevatten'); return; }
        if (own[x.id]) err(id + ': dubbel id ' + x.id); else if (seen[x.id]) err(id + ': id ' + x.id + ' bestaat al in ' + seen[x.id]);
        own[x.id] = k;
      });
    });
    var reqPacks = others.filter(function (o) { return (p.requires || []).indexOf(o.id) >= 0; });
    (p.requires || []).forEach(function (r) { if (typeof r !== 'string' || !ID.test(r)) err(id + ': ongeldig id in requires'); else if (!reqPacks.some(function (o) { return o.id === r; })) err(id + ': requires ' + r + ' is niet gevonden'); });
    var find = function (kind, rid) {
      var a = (p[kind] || []).filter(function (x) { return x.id === rid; })[0];
      if (a) return a;
      for (var i = 0; i < reqPacks.length; i++) { a = (reqPacks[i][kind] || []).filter(function (x) { return x.id === rid; })[0]; if (a) return a; }
      return null;
    };
    var allItems = (p.items || []).concat.apply(p.items || [], reqPacks.map(function (o) { return o.items || []; }));
    var words = (p.items || []).filter(function (x) { return x.kind === 'word' || x.kind === 'phrase'; });

    tekst(p.title, id + '.title');
    // items
    (p.items || []).forEach(function (x) {
      var w = id + '.' + x.id;
      if (['word', 'phrase', 'rule', 'sound', 'skill'].indexOf(x.kind) < 0) { err(w + ': onbekende soort ' + x.kind); return; }
      if (x.kind === 'word' || x.kind === 'phrase') {
        str(x.w, w + '.w'); tr(x.tr, w);
        if (x.art != null && x.art !== '' && ['de', 'het'].indexOf(x.art) < 0) err(w + ': art moet de of het zijn (of leeg)'); if (x.kind === 'phrase' && x.art) err(w + ': een vaste zin (phrase) heeft geen lidwoord');
        str(x.ex, w + '.ex');
        if (p.learn === 'nl') {
          if (typeof x.gap !== 'string' || x.gap.split('___').length !== 2) err(w + ': gap moet precies één ___ hebben');
          else {
            if (!/[.!?]$/.test(x.gap)) err(w + ': gap eindigt niet met een leesteken');
            if (/^___/.test(x.gap)) err(w + ': gap begint met het gat');
            var before = x.gap.split('___')[0];
            if (!x.askArt && x.art && !new RegExp('\\b' + x.art + '\\s+(\\S+\\s+)?$', 'i').test(before)) err(w + ': lidwoord niet zichtbaar voor het gat en askArt staat uit');
            if (x.askArt && /\b(de|het|ons|onze|dit|dat|deze)\s+(\S+\s+)?$/i.test(before)) err(w + ': askArt aan terwijl het lidwoord af te leiden is');
          }
          (x.also || []).forEach(function (a) { if (a === x.id || !words.some(function (o) { return o.id === a; })) err(w + ': also verwijst naar ' + a); });
          if (words.length - 1 - (x.also || []).length < 2) err(w + ': te weinig foute keuzes');
        }
        if (!x.def) q(w + ': omschrijving in eenvoudig Nederlands (def) ontbreekt');
      }
      if (x.kind === 'rule') {
        tekst(x.title, w + '.title');
        if (!x.rule) q(w + ': regel (rule) ontbreekt'); else { tekst(x.rule, w + '.rule'); }
        if (!x.watch) q(w + ': "let op" (watch) ontbreekt'); else tekst(x.watch, w + '.watch');
        if (!x.examples || x.examples.length < 3) q(w + ': minder dan drie voorbeelden');
      }
      if (x.kind === 'sound') { tekst(x.title, w + '.title'); if (!Array.isArray(x.pair) || x.pair.length !== 2) err(w + ': pair moet twee woorden hebben'); }
      if (x.kind === 'skill') tekst(x.title, w + '.title');
    });
    // teksten
    (p.texts || []).forEach(function (t) {
      var w = id + '.' + t.id;
      if (['lees', 'luister', 'verhaal'].indexOf(t.kind) < 0) err(w + ': kind moet lees, luister of verhaal zijn');
      if (t.sort != null && SORTS.indexOf(t.sort) < 0) err(w + ': onbekende tekstsoort ' + t.sort);
      tekst(t.title, w + '.title', true);
      if (!Array.isArray(t.paras) || !t.paras.length) err(w + ': paras ontbreekt');
      else t.paras.forEach(function (para, i) { (para || []).forEach(function (s, j) { tekst(s, w + '.paras[' + i + '][' + j + ']'); }); });
      var plain = (t.paras || []).map(function (para) { return (para || []).map(function (s) { return typeof s === 'string' ? s : s.nl; }).join(' '); }).join(' ').toLowerCase();
      (t.words || []).forEach(function (wid) {
        var it = find('items', wid); if (!it) { err(w + ': woord ' + wid + ' bestaat niet'); return; }
        var forms = [it.w].concat(it.forms || []);
        if (!forms.some(function (f) { return plain.indexOf(String(f).toLowerCase()) >= 0; })) q(w + ': woord ' + wid + ' staat niet in de tekst');
      });
    });
    // kaarten
    (p.cards || []).forEach(function (c) {
      var w = id + '.' + c.id;
      tekst(c.title, w + '.title'); tekst(c.body, w + '.body', true); tekst(c.note, w + '.note', true);
      (c.items || []).forEach(function (r) { if (!find('items', r)) err(w + ': item ' + r + ' bestaat niet'); });
      (c.examples || []).forEach(function (e, i) {
        if (!Array.isArray(e.parts) || !e.parts.length) err(w + '.examples[' + i + ']: parts ontbreekt');
        else e.parts.forEach(function (pt) { str(pt.t, w + '.examples[' + i + '].t'); if (pt.slot != null && [1, 2, 3].indexOf(pt.slot) < 0) err(w + ': slot moet 1, 2 of 3 zijn'); });
        if (e.tr) tr(e.tr, w + '.examples[' + i + ']');
      });
      (c.notes || []).forEach(function (n, i) { tekst(n.text, w + '.notes[' + i + ']'); if (n.tone != null && TONES.indexOf(n.tone) < 0) err(w + '.notes[' + i + ']: tone moet ' + TONES.join(' of ') + ' zijn'); });
      if (c.noteStyle != null && NOTESTYLES.indexOf(c.noteStyle) < 0) err(w + ': onbekende noteStyle');
      if (c.sayLang != null && SAYLANGS.indexOf(c.sayLang) < 0) err(w + ': sayLang moet nl of en zijn');
      if (c.compare) { str(c.compare.nl, w + '.compare.nl'); str(c.compare.en, w + '.compare.en'); }
      if (c.say != null) str(c.say, w + '.say');
    });
    // sommen die niet opraken (docs/herhaalmodel.md sectie 4): een recept met bereiken in plaats van vaste getallen
    var COINS = [1000, 500, 200, 100, 50, 20, 10, 5], MINS = [0, 15, 30, 45], PCTS = [10, 20, 25, 30, 50];
    var rng = function (a) { return Array.isArray(a) && a.length >= 2 && a.every(function (n) { return typeof n === 'number' && isFinite(n); }) && a[0] <= a[1]; };
    var genCheck = function (e, w) {
      var g = e.gen;
      if (!g || typeof g !== 'object') { err(w + ': gen moet een object zijn'); return; }
      if (!Array.isArray(e.items) || !e.items.length) err(w + ': items ontbreekt');
      else e.items.forEach(function (r) { if (!find('items', r)) err(w + ': item ' + r + ' bestaat niet'); else useCount[r] = (useCount[r] || 0) + 1; });
      if (e.pool != null && (typeof e.pool !== 'string' || !ID.test(e.pool))) err(w + ': ongeldige groepsnaam');
      switch (e.form) {
        case 'money':
          if (!Array.isArray(g.coins) || !g.coins.length || !g.coins.every(function (c) { return COINS.indexOf(c) >= 0; })) err(w + ': gen.coins mag alleen bestaande munten en briefjes bevatten (' + COINS.join(', ') + ' cent)');
          if (!rng(g.n) || g.n[0] < 2 || g.n[1] > 8) err(w + ': gen.n moet een bereik van 2 tot 8 munten zijn'); break;
        case 'clock':
          tekst(g.q, w + '.gen.q');
          if (!rng(g.h) || g.h[0] < 1 || g.h[1] > 12) err(w + ': gen.h moet een bereik binnen 1 tot 12 zijn');
          if (!Array.isArray(g.m) || !g.m.length || !g.m.every(function (m) { return MINS.indexOf(m) >= 0; })) err(w + ': gen.m kent alleen hele uren en kwartieren (0, 15, 30, 45)'); break;
        case 'discount':
          if (['part', 'own'].indexOf(g.mode) < 0) err(w + ': gen.mode moet part of own zijn');
          if (!Array.isArray(g.pct) || !g.pct.length || !g.pct.every(function (x) { return PCTS.indexOf(x) >= 0; })) err(w + ': gen.pct kent alleen ' + PCTS.join(', ') + ' procent');
          if (!Array.isArray(g.price) || g.price.length !== 3 || !rng(g.price) || !(g.price[2] > 0)) err(w + ': gen.price moet [laagste, hoogste, stap] zijn');
          else for (var pr = g.price[0]; pr <= g.price[1]; pr += g.price[2]) (g.pct || []).forEach(function (x) { if (Math.round(pr * x) % 100) err(w + ': ' + x + '% van ' + pr + ' is geen heel bedrag'); });
          break;
        default: err(w + ': gen kan alleen bij geld, klok en korting');
      }
    };
    // oefeningen
    var tested = {};
    ((p.tests && p.tests.placement) || []).forEach(function (e) { tested[e] = 1; if (!find('exercises', e)) err(id + '.tests: oefening ' + e + ' bestaat niet'); });
    var useCount = {};
    (p.exercises || []).forEach(function (e) {
      var w = id + '.' + e.id, d = e.data || {};
      if (FORMS.indexOf(e.form) < 0) { err(w + ': ' + (RESERVED.indexOf(e.form) >= 0 ? 'vorm ' + e.form + ' is gereserveerd voor een latere fase' : 'onbekende vorm ' + e.form)); return; }
      if (!Array.isArray(e.items)) err(w + ': items ontbreekt');
      else e.items.forEach(function (r) { if (!find('items', r)) err(w + ': item ' + r + ' bestaat niet'); else useCount[r] = (useCount[r] || 0) + 1; });
      if (e.text && !find('texts', e.text)) err(w + ': tekst ' + e.text + ' bestaat niet');
      if (e.pool != null && (typeof e.pool !== 'string' || !ID.test(e.pool))) err(w + ': ongeldige groepsnaam');
      if (e.skill != null && SKILLS.indexOf(e.skill) < 0) err(w + ': onbekende vaardigheid ' + e.skill);
      if (e.qtype != null && QTYPES.indexOf(e.qtype) < 0) err(w + ': onbekend vraagtype ' + e.qtype);
      if (e.para != null && !(Number.isInteger(e.para) && e.para >= 0)) err(w + ': para moet een getal zijn');
      if (e.data && e.data.lang != null && e.data.lang !== 'en') err(w + ': data.lang kent alleen "en"');
      if (!e.data && !e.gen) err(w + ': data of gen ontbreekt');
      if (e.fade != null && [1, 2, 3].indexOf(e.fade) < 0) err(w + ': fade moet 1 (voorbeeld), 2 (laatste stap zelf) of 3 (helemaal zelf) zijn');
      if (e.gen) { genCheck(e, w); return; }
      var opts = function (o, a, n) { if (!Array.isArray(o) || o.length < 2) { err(w + ': opties ontbreken'); return; } if (n && o.length !== n) err(w + ': precies ' + n + ' opties nodig'); };
      switch (e.form) {
        case 'build':
          if (!Array.isArray(d.parts) || d.parts.length < 2) err(w + ': parts ontbreekt'); else { d.parts.forEach(function (s) { str(s, w + '.parts'); }); if (d.parts.indexOf(d.verb) < 0) err(w + ': verb staat niet in parts'); }
          tr(d.tr, w); break;
        case 'gap':
          if (typeof d.s !== 'string' || d.s.split('___').length !== 2) err(w + ': s moet precies één ___ hebben');
          opts(d.o); if (Array.isArray(d.o) && d.o.indexOf(d.a) < 0) err(w + ': goed antwoord staat niet tussen de keuzes');
          if (p.learn === 'en') { if (!d.tr || typeof d.tr.nl !== 'string') err(w + ': tr.nl ontbreekt'); } else tr(d.tr, w);
          break;
        case 'listen':
          if (d.mode != null && ['choose', 'type'].indexOf(d.mode) < 0) err(w + ': mode kent alleen choose en type');
          opts(d.opts); if (Array.isArray(d.opts) && d.opts.indexOf(d.say) < 0) err(w + ': say staat niet tussen de keuzes');
          tr(d.tr, w, true, (d.opts || []).length); break;
        case 'dictee': str(d.t, w + '.t'); tr(d.tr, w); break;
        case 'mc':
          tekst(d.q, w + '.q');
          opts(d.o, d.a, 3);
          (d.o || []).forEach(function (o, i) { tekst(o, w + '.o[' + i + ']'); });
          if (typeof d.a !== 'number' || d.a < 0 || d.a >= (d.o || []).length) err(w + ': goed antwoord (a) valt buiten de keuzes');
          if (d.say != null) str(d.say, w + '.say');
          if (d.show && d.show !== 'sup') err(w + ': show kent alleen "sup"');
          break;
        case 'clock':
          tekst(d.q, w + '.q'); opts(d.o); if ((d.o || []).indexOf(d.a) < 0) err(w + ': goed antwoord staat niet tussen de keuzes');
          if (!(d.h >= 1 && d.h <= 12) || !(d.m >= 0 && d.m < 60)) err(w + ': h of m ongeldig'); break;
        case 'money':
          if (!Array.isArray(d.coins) || !d.coins.every(function (c) { return Number.isInteger(c) && c > 0; })) err(w + ': coins moet een lijst bedragen in centen zijn');
          opts(d.o); if ((d.o || []).indexOf(d.a) < 0) err(w + ': goed antwoord staat niet tussen de keuzes');
          tekst(d.alt, w + '.alt', true); break;
        case 'discount': if (['worked', 'part', 'own'].indexOf(d.mode) < 0) err(w + ': mode moet worked, part of own zijn'); break;
      }
      if (e.fb) { tekst(e.fb.ok, w + '.fb.ok', true); tekst(e.fb.no, w + '.fb.no', true); }
      if (e.hint != null) { if (!Array.isArray(e.hint)) err(w + ': hint moet een lijst zijn'); else e.hint.forEach(function (h, i) { tekst(h, w + '.hint[' + i + ']'); }); }
      // kwaliteit (A-eisen uit het kwaliteitskader die per oefening te controleren zijn)
      if (['learn', 'discount'].indexOf(e.form) < 0 && !tested[e.id]) {
        if (!e.fb || !e.fb.ok || !e.fb.no) q(w + ': feedback met reden bij goed en fout (fb.ok, fb.no) ontbreekt');
        if (['recall', 'build', 'dictee', 'gap'].indexOf(e.form) >= 0 && (!e.hint || e.hint.length < 2)) q(w + ': hint in twee stappen ontbreekt');
      }
    });
    // recepten
    // uitleg: stappen met tekst en een plaatje, daarna controlevragen. Een plaatje bevat alleen getallen, ja/nee en tekst zonder opmaakcode.
    function visual(v, where) {
      if (!v || typeof v !== 'object' || Array.isArray(v)) { err(where + ': plaatje moet een object zijn'); return; }
      if (VIS.indexOf(v.type) < 0) { err(where + ': onbekend soort plaatje ' + v.type); return; }
      var count = 0;
      (function walk(x, at, depth) {
        if (++count > 400 || depth > 6) { if (count === 401 || depth === 7) err(where + ': plaatje is te groot of te diep'); return; }
        if (x == null || typeof x === 'boolean') return;
        if (typeof x === 'number') { if (!isFinite(x)) err(at + ': ongeldig getal'); return; }
        if (typeof x === 'string') { if (x.length > 200 || badMarkup(x)) err(at + ': niet toegestane tekst'); return; }
        if (Array.isArray(x)) { x.forEach(function (y, i) { walk(y, at + '[' + i + ']', depth + 1); }); return; }
        if (typeof x !== 'object') { err(at + ': ongeldige waarde'); return; }
        Object.keys(x).forEach(function (k) {
          if (!/^[a-z][A-Za-z]{0,15}$/.test(k)) { err(at + ': ongeldige naam ' + k); return; }
          if (k === 'tone' && VTONES.indexOf(x[k]) < 0) err(at + ': onbekende kleur');
          else if (k === 'lang' && SAYLANGS.indexOf(x[k]) < 0) err(at + ': lang moet nl of en zijn');
          else if (k === 'slot' && [1, 2, 3].indexOf(x[k]) < 0) err(at + ': slot moet 1, 2 of 3 zijn');
          else walk(x[k], at + '.' + k, depth + 1);
        });
      })(v, where, 0);
    }
    (p.explain || []).forEach(function (x) {
      if (!x || typeof x.id !== 'string') return;
      var w = id + '.' + x.id;
      if (SUBJECTS.indexOf(x.subject) < 0) err(w + ': onderwerp moet ' + SUBJECTS.join(', ') + ' zijn');
      tekst(x.title, w + '.title'); tekst(x.summary, w + '.summary', true);
      if (x.items != null && (!Array.isArray(x.items) || !x.items.every(function (r) { return typeof r === 'string' && ID.test(r); }))) err(w + ': ongeldige verwijzing in items');
      if (x.forms != null && (!Array.isArray(x.forms) || !x.forms.every(function (f) { return FORMS.indexOf(f) >= 0; }))) err(w + ': onbekende oefenvorm in forms');
      if (!Array.isArray(x.steps) || !x.steps.length || x.steps.length > 12) { err(w + ': een uitleg heeft 1 tot 12 stappen'); return; }
      x.steps.forEach(function (st, i) {
        if (!st || typeof st !== 'object') { err(w + '.steps[' + i + ']: ongeldige stap'); return; }
        tekst(st.text, w + '.steps[' + i + '].text');
        if (st.visual != null) visual(st.visual, w + '.steps[' + i + '].visual');
      });
      if (x.check != null && !Array.isArray(x.check)) err(w + ': check moet een lijst zijn');
      (Array.isArray(x.check) ? x.check : []).forEach(function (c, i) {
        var cw = w + '.check[' + i + ']';
        if (!c || typeof c !== 'object') { err(cw + ': ongeldige vraag'); return; }
        tekst(c.q, cw + '.q');
        if (!Array.isArray(c.o) || c.o.length < 2 || c.o.length > 4) err(cw + ': twee tot vier keuzes');
        else c.o.forEach(function (o, j) { tekst(o, cw + '.o[' + j + ']'); });
        if (!(Number.isInteger(c.a) && Array.isArray(c.o) && c.a >= 0 && c.a < c.o.length)) err(cw + ': het goede antwoord staat niet tussen de keuzes');
        tekst(c.why, cw + '.why', true);
      });
      if (!x.check || !x.check.length) q(w + ': een uitleg heeft minstens één controlevraag');
    });

    var pools = {};
    (p.exercises || []).forEach(function (e) { if (e.pool) (pools[e.pool] = pools[e.pool] || []).push(e.id); });
    ['lesson', 'lessonShort'].forEach(function (k) {
      if (p[k] == null) return;
      if (!Array.isArray(p[k])) { err(id + '.' + k + ': moet een lijst plekken zijn'); return; }
      p[k].forEach(function (s, i) {
        var w = id + '.' + k + '[' + i + ']';
        if (!(s.step >= 1 && s.step <= 5)) err(w + ': step moet 1 tot 5 zijn');
        if (s.card && !find('cards', s.card)) err(w + ': kaart ' + s.card + ' bestaat niet');
        if (s.ex) { if (!find('exercises', s.ex)) err(w + ': oefening ' + s.ex + ' bestaat niet'); if (tested[s.ex]) err(w + ': toetsvraag ' + s.ex + ' staat in een recept'); }
        if (s.pool) { if (!pools[s.pool] && !reqPacks.some(function (o) { return (o.exercises || []).some(function (e) { return e.pool === s.pool; }); })) err(w + ': groep ' + s.pool + ' bestaat niet'); (pools[s.pool] || []).forEach(function (e) { if (tested[e]) err(w + ': toetsvraag ' + e + ' zit in groep ' + s.pool); }); }
        if (s.words && ['due', 'new', 'first'].indexOf(s.words) < 0) err(w + ': words moet due, new of first zijn');
        if (s.practice != null) { var P = s.practice; if (!P || typeof P !== 'object' || !(Number.isInteger(P.n) && P.n >= 1) || (P.n2 != null && !(Number.isInteger(P.n2) && P.n2 >= 0)) || (P.newMax != null && !(Number.isInteger(P.newMax) && P.newMax >= 0)) || !Array.isArray(P.kinds) || !P.kinds.length || !P.kinds.every(function (k) { return ['rule', 'sound', 'skill'].indexOf(k) >= 0; })) err(w + ': practice moet n (getal) en kinds (rule, sound, skill) hebben'); }
        if (!s.card && !s.ex && !s.pool && !s.words && !s.end && !s.practice) err(w + ': lege plek');
      });
    });
    // kwaliteit per thema (alleen voor een Nederlands thema met woorden; een woordenlijst is geen thema)
    if (p.type != null && ['thema', 'woordenlijst', 'hoofdstuk'].indexOf(p.type) < 0) err(id + ': type kent alleen thema, woordenlijst en hoofdstuk');
    // scènes (docs/scenes.md): vaste stappen, gesprekken met één goede keuze en een reden bij elke keuze, de tekening uit de catalogus
    if (p.scenes != null) {
      var SV = root.SceneVis || null; if (!SV && typeof require === 'function') { try { SV = require('./scene.js'); } catch (e) { SV = null; } }
      var STEP = ['look', 'talk', 'read', 'listen', 'slot', 'explain', 'do', 'make', 'end', 'quiz', 'rule', 'extra'], ERRS = ['lidwoord', 'woordvolgorde', 'werkwoordsvorm', 'tijd', 'voorzetsel', 'spelling', 'klank', 'betekenis', 'beleefdheid', 'getal', 'rekenstap', 'lezen'], DOFORM = ['setclock', 'change', 'point', 'money', 'clock', 'discount', 'gap', 'build', 'listen'];
      var allItems = {}; [p].concat(others || []).forEach(function (o) { (o.items || []).forEach(function (x) { allItems[x.id] = 1; }); });
      var errOk = function (o, u) { if (o.err != null && ERRS.indexOf(o.err) < 0) err(u + ': err ' + o.err + ' staat niet in de lijst'); else if (o.r !== 'ok' && o.err == null) q(u + ': soort fout (err) ontbreekt bij een foute keuze'); };
      var tekstOf = function (x, u) { if (Array.isArray(x)) { if (!x.length) err(u + ': leeg'); x.forEach(function (y, i) { tekst(y, u + '[' + i + ']'); }); } else tekst(x, u); };
      // een vraag (quiz, rule, extra, en nieuwe vragen in read en listen): docs/scenes.md, "De stappen voor diepte en diagnose"
      var vraag = function (qq, u, nlOnly) { if (!qq || typeof qq !== 'object') { err(u + ': geen vraag'); return; }
        if (['choose', 'hear', 'type', 'number'].indexOf(qq.form) < 0) err(u + ': form moet choose, hear, type of number zijn');
        itemsOk(qq.items, u); if (nlOnly && qq.ask && typeof qq.ask === 'object') str(qq.ask.nl, u + '.ask.nl'); else tekst(qq.ask, u + '.ask');   // instap en controle: de vraag mag alleen in het Nederlands if (qq.say != null) str(qq.say, u + '.say');
        if (qq.help != null && [0, 1, 2].indexOf(qq.help) < 0) err(u + ': help moet 0, 1 of 2 zijn');
        if (qq.form === 'choose' || qq.form === 'hear') {
          if (!Array.isArray(qq.opts) || qq.opts.length < 2 || qq.opts.length > 4) err(u + ': twee tot vier keuzes');
          else { if (qq.opts.filter(function (o) { return o && o.r === 'ok'; }).length !== 1) err(u + ': precies één keuze met r = ok');
            qq.opts.forEach(function (o, oi) { var uo = u + '.opts[' + oi + ']'; if (!o || typeof o.t !== 'string' || !o.t) { err(uo + ': t ontbreekt'); return; } str(o.t, uo + '.t'); if (['ok', 'near', 'no'].indexOf(o.r) < 0) err(uo + ': r moet ok, near of no zijn'); if (!o.why) err(uo + ': why ontbreekt (ook bij de goede keuze)'); else tekst(o.why, uo + '.why'); errOk(o, uo); }); }
        } else if (qq.form === 'type' || qq.form === 'number') {
          var an = [].concat(qq.answer == null ? [] : qq.answer); if (!an.length || an.some(function (a) { return typeof a !== 'string' && typeof a !== 'number' || String(a).trim() === ''; })) err(u + ': answer ontbreekt');
          if (qq.form === 'number' && an.some(function (a) { return !/^-?\d+([.,]\d+)?$/.test(String(a).trim()); })) err(u + ': answer is geen getal');
          if (!qq.why) err(u + ': why ontbreekt'); else tekst(qq.why, u + '.why'); if (qq.err != null && ERRS.indexOf(qq.err) < 0) err(u + ': err ' + qq.err + ' staat niet in de lijst');
        } };
      var itemsOk = function (a, w) { if (!Array.isArray(a) || !a.length) { err(w + ': items ontbreekt (het doel op de eerste plek)'); return; } a.forEach(function (x) { if (!allItems[x]) err(w + ': item ' + x + ' bestaat niet'); }); };
      if (!Array.isArray(p.scenes)) err(id + '.scenes: moet een lijst zijn');
      else p.scenes.forEach(function (sc, si) {
        var w = id + '.scenes[' + si + ']'; if (!sc || typeof sc !== 'object') { err(w + ': geen scène'); return; }
        if (typeof sc.id !== 'string' || !ID.test(sc.id)) err(w + ': ongeldige id'); else w = id + '.' + sc.id;
        if (typeof sc.place !== 'string' || !ID.test(sc.place)) err(w + ': ongeldige plek');
        if (['nl', 'rk', 'en', 'kn'].indexOf(sc.subject) < 0) err(w + ': subject moet nl, rk, en of kn zijn');
        if (sc.n != null || sc.subject === 'nl' || sc.subject === 'en') { if (!(Number.isInteger(sc.n) && sc.n >= 1 && sc.n <= 5)) err(w + ': n moet 1 tot 5 zijn'); }   // rekenen en kennis: zonder n
        if (sc.nosup != null && typeof sc.nosup !== 'boolean') err(w + ': nosup moet true of false zijn');
        tekst(sc.title, w + '.title'); tekst(sc.intro, w + '.intro'); tekst(sc.can, w + '.can');
        if (!Array.isArray(sc.targets) || !sc.targets.length) err(w + ': targets ontbreekt'); else sc.targets.forEach(function (x) { if (!allItems[x]) err(w + ': doel ' + x + ' bestaat niet'); });
        if (SV) SV.check(sc.art).forEach(function (m) { err(w + '.art: ' + m); });
        if (sc.art && Array.isArray(sc.art.things)) sc.art.things.forEach(function (t, ti) { if (t && t.item && !allItems[t.item]) err(w + '.art.things[' + ti + ']: item ' + t.item + ' bestaat niet'); if (t && t.label) tekst(t.label, w + '.art.things[' + ti + '].label'); });
        if (!Array.isArray(sc.steps) || !sc.steps.length) { err(w + ': steps ontbreekt'); return; }
        var doen = false;
        sc.steps.forEach(function (st, k) {
          var v = w + '.steps[' + k + ']'; if (!st || STEP.indexOf(st.type) < 0) { err(v + ': onbekende stap ' + (st && st.type)); return; }
          if (st.type === 'talk') {
            if (!Array.isArray(st.turns) || !st.turns.length) err(v + ': turns ontbreekt');
            else st.turns.forEach(function (tu, ti) { var u = v + '.turns[' + ti + ']'; tekst(tu.them, u + '.them'); itemsOk(tu.items, u);
              if (!Array.isArray(tu.opts) || tu.opts.length < 2) err(u + ': minstens twee keuzes');
              else { if (tu.opts.filter(function (o) { return o && o.r === 'ok'; }).length !== 1) err(u + ': precies één keuze met r = ok');
                tu.opts.forEach(function (o, oi) { if (!o || typeof o.t !== 'string' || !o.t) err(u + '.opts[' + oi + ']: t ontbreekt'); else str(o.t, u + '.opts[' + oi + '].t'); if (['ok', 'near', 'no'].indexOf(o && o.r) < 0) err(u + '.opts[' + oi + ']: r moet ok, near of no zijn'); if (!o || !o.why) err(u + '.opts[' + oi + ']: why ontbreekt (ook bij de goede keuze)'); else tekst(o.why, u + '.opts[' + oi + '].why'); if (o) errOk(o, u + '.opts[' + oi + ']'); }); } });
          }
          if (st.type === 'read' || st.type === 'listen') {
            if (st.sources != null) { if (!Array.isArray(st.sources) || !st.sources.length) err(v + ': sources moet een lijst zijn'); else st.sources.forEach(function (b, bi) { var u = v + '.sources[' + bi + ']'; if (typeof b === 'string') str(b, u); else if (!b || typeof b !== 'object') err(u + ': geen bron'); else { tekst(b.title != null ? b.title : b.t, u + '.title'); if (b.url != null && (typeof b.url !== 'string' || !/^https:\/\/[^\s"'<>]+$/.test(b.url))) err(u + ': url moet met https:// beginnen'); } }); }
            if (st.type === 'read') tekst(st.text, v + '.text'); else if (typeof st.say !== 'string') err(v + ': say ontbreekt');
            if (!Array.isArray(st.q) || !st.q.length) err(v + ': vragen (q) ontbreken');
            else st.q.forEach(function (qq, qi) { var u = v + '.q[' + qi + ']'; if (qq && qq.form) { vraag(qq, u); return; } tekst(qq.q, u + '.q'); itemsOk(qq.items, u); if (!Array.isArray(qq.o) || qq.o.length < 2) err(u + ': minstens twee keuzes'); else qq.o.forEach(function (o, oi) { tekst(o, u + '.o[' + oi + ']'); }); if (!(Number.isInteger(qq.a) && qq.a >= 0 && qq.a < (qq.o || []).length)) err(u + ': goed antwoord (a) valt buiten de keuzes'); if (!qq.why) err(u + ': why ontbreekt'); else tekst(qq.why, u + '.why'); });
          }
          if (st.type === 'slot') { if (!(Number.isInteger(st.n) && st.n >= 1 && st.n <= 4)) err(v + ': n moet 1 tot 4 zijn'); if (!Array.isArray(st.kinds) || !st.kinds.length) err(v + ': kinds ontbreekt'); }
          if (st.type === 'explain' && (typeof st.id !== 'string' || !ID.test(st.id))) err(v + ': id van de uitleg ontbreekt');
          if (st.type === 'do' && st.opts) { doen = true; vraag({ form: 'choose', items: st.items, ask: st.ask, opts: st.opts }, v); }
          else if (st.type === 'do') { doen = true; if (DOFORM.indexOf(st.form) < 0) err(v + ': onbekende vorm ' + st.form); itemsOk(st.items, v); if (st.ask) tekst(st.ask, v + '.ask'); if (st.why) tekst(st.why, v + '.why');
            if (st.form === 'setclock' && !/^\d{1,2}:\d{2}$/.test(String(st.answer))) err(v + ': answer als u:mm');
            if (st.form === 'point' && (!sc.art || !(sc.art.things || []).some(function (t) { return t && t.hot && t.item === st.answer; }))) err(v + ': answer moet het item van een aantikbaar ding zijn');
            if (['money', 'clock', 'discount'].indexOf(st.form) >= 0 && !st.gen) err(v + ': een som in een scène heeft gen nodig'); }
          if (st.type === 'make') { doen = true; tekstOf(st.frame, v + '.frame'); tekst(st.model, v + '.model'); if (st.ask != null) tekst(st.ask, v + '.ask'); itemsOk(st.items, v); if (!Array.isArray(st.checklist) || !st.checklist.length) err(v + ': checklist ontbreekt'); else st.checklist.forEach(function (c, ci) { tekst(c, v + '.checklist[' + ci + ']'); }); }
          if (st.type === 'quiz') { if (['instap', 'ophalen', 'controle'].indexOf(st.role) < 0) err(v + ': role moet instap, ophalen of controle zijn');
            if (!Array.isArray(st.q) || !st.q.length) err(v + ': vragen (q) ontbreken'); else st.q.forEach(function (qq, qi) { vraag(qq, v + '.q[' + qi + ']', st.role !== 'ophalen'); });
            if (st.role === 'controle' && (st.q || []).length !== 2) err(v + ': de controle heeft precies twee vragen'); }
          if (st.type === 'rule') { itemsOk(st.items, v); tekst(st.example, v + '.example');
            if (!Array.isArray(st.q) || st.q.length < 3) err(v + ': minstens drie oefeningen'); else { st.q.forEach(function (qq, qi) { vraag(qq, v + '.q[' + qi + ']'); });
              var hp = st.q.map(function (qq) { return qq && qq.help; }); if (hp[hp.length - 1] !== 0 || hp.some(function (h, i) { return i && h > hp[i - 1]; })) err(v + ': de hulp (help) moet afbouwen en eindigen op 0'); } }
          if (st.type === 'extra') { if (ERRS.indexOf(st.err) < 0) err(v + ': err ontbreekt of staat niet in de lijst'); tekst(st.explain, v + '.explain');
            if (!Array.isArray(st.q) || st.q.length < 2) err(v + ': minstens twee oefeningen'); else st.q.forEach(function (qq, qi) { vraag(qq, v + '.q[' + qi + ']'); }); }
          if (st.type === 'end') { if (st.next) tekst(st.next, v + '.next'); if (st.real) tekst(st.real, v + '.real'); }
        });
        if (!doen) err(w + ': minstens één stap waarin de leerder iets doet of maakt (do of make)');
        if (sc.steps[sc.steps.length - 1].type !== 'end') err(w + ': de laatste stap is end');
      });
    }
    if (p.learn === 'nl' && words.length && p.type !== 'woordenlijst' && p.type !== 'hoofdstuk') {
      var texts = p.texts || [];
      if (words.length < 40 || words.length > 60) q(id + ': ' + words.length + ' doelwoorden (eis: 40 tot 60)');
      if (texts.length < 3) q(id + ': ' + texts.length + ' tekst(en) (eis: minstens drie)');
      var sorts = {}; texts.forEach(function (t) { sorts[t.sort] = 1; });
      if (Object.keys(sorts).length < 2) q(id + ': minder dan twee tekstsoorten');
      if (!texts.some(function (t) { return t.kind === 'luister'; })) q(id + ': geen luistertekst');
      words.forEach(function (x) {
        var inText = texts.some(function (t) { return (t.words || []).indexOf(x.id) >= 0; });
        if (!inText) q(id + '.' + x.id + ': komt in geen tekst van het thema voor');
        if ((useCount[x.id] || 0) + 3 < 4) q(id + '.' + x.id + ': minder dan vier ontmoetingen');
      });
    }
    // lenient (app, als een pakket uit requires ontbreekt): verwijzingen naar ontbrekende onderdelen zijn dan een melding, geen fout
    if (opts && opts.lenient) { var refs = errors.filter(function (m) { return /bestaat niet|is niet gevonden/.test(m); }); errors = errors.filter(function (m) { return refs.indexOf(m) < 0; }); quality = quality.concat(refs); }
    var strict = p.quality === 'strict';
    return { errors: strict ? errors.concat(quality) : errors, quality: quality };
  }
  var api = { safeText: safeText, checkPack: checkPack, FORMS: FORMS, SUBJECTS: SUBJECTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PakketCheck = api;
})(this);

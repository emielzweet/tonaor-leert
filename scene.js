/* scene.js: tekent het plaatje van een scène (docs/scenes.md). Geen afhankelijkheden; draait in de app (window.SceneVis) en in de test (require).
   render(art, safe, ctx) geeft HTML terug. Een pakket kiest alleen uit de catalogus hieronder (achtergrond + dingen met een plek);
   het brengt nooit eigen SVG mee. Tekst uit een pakket komt alleen in een attribuut (attr) of als platte tekst (txt) in de tekening.
   Een ding met "hot" is aantikbaar: het krijgt de klasse s-hot en data-i = de plek in art.things. De speler regelt de tik.
   Kleuren zijn de variabelen van de app; variabelen die de app nog niet heeft, hebben hier een terugvalwaarde.
   Elk ding komt binnen met de klasse s-in en een vertraging; met "minder beweging" staat alles er meteen (zie CSS onderaan). */
(function (root) {
  'use strict';
  var W = 340, H = 214, FLOOR = 156, MAX = 24;
  var BGS = ['room', 'clinic', 'shop', 'market', 'station', 'street'];
  var TONES = ['mint', 'apricot', 'sky', 'lilac'];
  var LOOKS = ['neutral', 'happy', 'worried', 'talk', 'think'];
  var HAIR = ['short', 'long', 'bun', 'none'];
  var WOOD = 'var(--wood,#c9a377)', SUN = 'var(--sun,#f6dc9a)', INK = 'var(--ink)', SURF = 'var(--surface)';
  var SKIN = { a: 'var(--skin-a,#f6dcc6)', b: 'var(--skin-b,#e3b98f)', c: 'var(--skin-c,#a8754f)' };
  var HAIRC = { dark: 'var(--hair-dark,#3d312c)', brown: 'var(--hair-brown,#8a6243)', grey: 'var(--hair-grey,#b9b6ae)', fair: 'var(--hair-fair,#d9b877)' };

  function num(x, dflt) { var n = Number(x); return isFinite(n) ? n : (dflt || 0); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function tone(t, dflt) { return TONES.indexOf(t) >= 0 ? t : (dflt || 'mint'); }
  function soft(t) { return 'var(--' + t + ')'; }
  function fill(t) { return 'var(--' + t + '-fill)'; }
  function ink(t) { return 'var(--' + t + '-ink)'; }
  function deep(t) { return 'var(--' + t + '-deep,var(--' + t + '-ink))'; }
  function attr(x) { return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  // platte tekst in de tekening: hooguit 14 tekens, geen opmaak
  function txt(x) { return attr(String(x == null ? '' : x).replace(/<[^>]*>/g, '').slice(0, 14)); }
  function T(x, y, s, size, color, anchor) { return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" font-family="var(--f-body),sans-serif" font-weight="800" font-size="' + size + '" fill="' + color + '">' + s + '</text>'; }

  /* ---------- achtergronden ---------- */
  var BG = {
    room: function (t) {
      return '<rect width="' + W + '" height="' + H + '" fill="' + soft(t) + '"/><rect y="' + FLOOR + '" width="' + W + '" height="' + (H - FLOOR) + '" fill="' + fill(t) + '" opacity=".75"/>' +
        '<path d="M0 ' + FLOOR + 'h' + W + '" stroke="' + deep(t) + '" stroke-width="3" opacity=".55"/>';
    },
    clinic: function (t) {
      var tiles = ''; for (var i = 1; i < 9; i++) tiles += '<path d="M' + (i * 40 - 10) + ' ' + FLOOR + 'l-14 ' + (H - FLOOR) + '" stroke="' + SURF + '" stroke-width="2" opacity=".6"/>';
      return '<rect width="' + W + '" height="' + H + '" fill="' + SURF + '"/><rect width="' + W + '" height="' + FLOOR + '" fill="' + soft(t) + '" opacity=".8"/>' +
        '<rect y="96" width="' + W + '" height="6" fill="' + fill(t) + '" opacity=".6"/><rect y="' + FLOOR + '" width="' + W + '" height="' + (H - FLOOR) + '" fill="' + fill(t) + '" opacity=".55"/>' + tiles +
        '<path d="M0 ' + FLOOR + 'h' + W + '" stroke="' + deep(t) + '" stroke-width="2.5" opacity=".5"/>';
    },
    shop: function (t) {
      var out = BG.room(t), cols = [fill('apricot'), fill('sky'), fill('lilac'), fill('mint')];
      for (var r = 0; r < 2; r++) {
        out += '<rect x="14" y="' + (50 + r * 40) + '" width="312" height="6" rx="3" fill="' + WOOD + '"/>';
        for (var i = 0; i < 12; i++) out += '<rect x="' + (22 + i * 25) + '" y="' + (50 + r * 40 - 16 - (i * 7 + r * 3) % 9) + '" width="17" height="' + (16 + (i * 7 + r * 3) % 9) + '" rx="3" fill="' + cols[(i + r) % 4] + '" opacity=".8"/>';
      }
      return out;
    },
    market: function (t) {
      return '<rect width="' + W + '" height="' + H + '" fill="' + soft('sky') + '"/><circle cx="292" cy="34" r="17" fill="' + SUN + '"/>' +
        '<g fill="' + SURF + '" opacity=".85"><ellipse cx="70" cy="32" rx="30" ry="10"/><ellipse cx="90" cy="25" rx="18" ry="10"/></g>' +
        '<path d="M0 132c50-16 110-10 170-2s120 2 170-12v96H0z" fill="' + fill('mint') + '" opacity=".6"/>' +
        '<rect y="' + (FLOOR + 6) + '" width="' + W + '" height="' + (H - FLOOR - 6) + '" fill="' + soft(t) + '"/><path d="M0 ' + (FLOOR + 6) + 'h' + W + '" stroke="' + deep(t) + '" stroke-width="2.5" opacity=".45"/>';
    },
    station: function (t) {
      return '<rect width="' + W + '" height="' + H + '" fill="' + soft(t) + '"/><path d="M0 34h' + W + 'v14H0z" fill="' + deep(t) + '" opacity=".7"/>' +
        '<path d="M44 48v112M296 48v112" stroke="' + deep(t) + '" stroke-width="8" opacity=".55"/>' +
        '<rect y="160" width="' + W + '" height="54" fill="var(--surface-2)"/><path d="M0 164h' + W + '" stroke="' + SUN + '" stroke-width="4"/><path d="M0 184h' + W + 'M0 200h' + W + '" stroke="var(--line)" stroke-width="3"/>';
    },
    street: function (t) {
      var out = '<rect width="' + W + '" height="' + H + '" fill="' + soft('sky') + '"/><circle cx="52" cy="36" r="16" fill="' + SUN + '"/>';
      var hs = [[0, 70, 'apricot'], [66, 92, 'lilac'], [140, 62, 'mint'], [204, 86, 'sky'], [272, 72, 'apricot']];
      hs.forEach(function (h) {
        var y = FLOOR - h[1];
        out += '<rect x="' + (h[0] + 2) + '" y="' + y + '" width="64" height="' + h[1] + '" fill="' + fill(h[2]) + '" opacity=".75"/><path d="M' + h[0] + ' ' + y + 'l34-22 34 22z" fill="' + deep(h[2]) + '" opacity=".5"/>' +
          '<rect x="' + (h[0] + 12) + '" y="' + (y + 14) + '" width="14" height="14" rx="2" fill="' + SURF + '" opacity=".8"/><rect x="' + (h[0] + 40) + '" y="' + (y + 14) + '" width="14" height="14" rx="2" fill="' + SURF + '" opacity=".8"/>';
      });
      return out + '<rect y="' + FLOOR + '" width="' + W + '" height="' + (H - FLOOR) + '" fill="' + soft(t) + '"/><rect y="' + FLOOR + '" width="' + W + '" height="10" fill="var(--surface-2)"/>';
    }
  };

  /* ---------- dingen: getekend rond (0,0). Staande dingen: 0,0 = midden onder. Hangende dingen: 0,0 = midden. ---------- */
  function person(t, c) {
    var shirt = fill(tone(t.tone, 'lilac')), shirtD = deep(tone(t.tone, 'lilac')), skin = SKIN[t.skin] || SKIN.a, hc = HAIRC[t.hairTone] || HAIRC.dark;
    var look = (c.looks && t.who && LOOKS.indexOf(c.looks[t.who]) >= 0) ? c.looks[t.who] : (LOOKS.indexOf(t.look) >= 0 ? t.look : 'neutral');
    var hair = HAIR.indexOf(t.hair) >= 0 ? t.hair : 'short', o = '';
    o += '<ellipse cx="0" cy="0" rx="17" ry="4" fill="' + INK + '" opacity=".12"/>';
    if (hair === 'long') o += '<path d="M-12.500-37c0-18 25-18 25 0v17c-2 3-6 3-7 0h-11c-1 3-5 3-7 0z" fill="' + hc + '"/>';
    if (t.arm === 'wave') o += '<path d="M11-13L21-30" stroke="' + shirt + '" stroke-width="6" stroke-linecap="round"/><circle cx="22" cy="-32" r="3.600" fill="' + skin + '"/>';
    o += '<path d="M-15 0v-9c0-18 30-18 30 0v9z" fill="' + shirt + '"/><path d="M-5-21q5 5 10 0" fill="none" stroke="' + shirtD + '" stroke-width="2" stroke-linecap="round" opacity=".6"/>';
    o += '<rect x="-3" y="-26" width="6" height="6" fill="' + skin + '"/><circle cx="0" cy="-35" r="11" fill="' + skin + '"/>';
    if (hair === 'short' || hair === 'bun') o += '<path d="M-11.400-35c0-17 22.800-17 22.800 0-6-6.500-16.800-6.500-22.800 0z" fill="' + hc + '"/>';
    if (hair === 'long') o += '<path d="M-11.400-34c0-18 22.800-18 22.800 0-4-7-9-8-13-8-3 4-6 6-9.800 8z" fill="' + hc + '"/>';
    if (hair === 'bun') o += '<circle cx="0" cy="-49" r="5" fill="' + hc + '"/>';
    var ey = look === 'think' ? -35.5 : -34, ex = look === 'think' ? 1.2 : 0;
    o += '<circle cx="' + (-4 + ex) + '" cy="' + ey + '" r="1.400" fill="' + INK + '"/><circle cx="' + (4 + ex) + '" cy="' + ey + '" r="1.400" fill="' + INK + '"/>';
    if (look === 'worried') o += '<path d="M-6.500-38l4-1.500M6.500-38l-4-1.500" stroke="' + INK + '" stroke-width="1.200" stroke-linecap="round"/>';
    if (look === 'happy') o += '<circle cx="-7.500" cy="-30.500" r="2.200" fill="' + fill('apricot') + '" opacity=".8"/><circle cx="7.500" cy="-30.500" r="2.200" fill="' + fill('apricot') + '" opacity=".8"/>';
    var m = { neutral: '<path d="M-3-29q3 1.800 6 0"', happy: '<path d="M-4.500-30q4.500 5 9 0"', worried: '<path d="M-3.500-27.500q3.500-3 7 0"', think: '<path d="M-1-28.500h5"' }[look];
    if (look === 'talk') o += '<ellipse class="s-talk" cx="0" cy="-28.500" rx="2.800" ry="2.400" fill="' + INK + '"/>';
    else o += m + ' fill="none" stroke="' + INK + '" stroke-width="1.500" stroke-linecap="round"/>';
    if (t.arm === 'phone') o += '<path d="M12-10L13-28" stroke="' + shirt + '" stroke-width="6" stroke-linecap="round"/><rect x="10.500" y="-41" width="5.500" height="12" rx="2" fill="' + INK + '"/>';
    return o;
  }
  function clock(t) {
    var p = String(t.value || '10:10').split(':'), h = num(p[0]) % 12, m = clamp(num(p[1]), 0, 59), tn = tone(t.tone, 'mint');
    var ticks = ''; for (var i = 0; i < 12; i++) ticks += '<line x1="0" y1="-19" x2="0" y2="-' + (i % 3 ? 17 : 15.5) + '" stroke="var(--ink-2)" stroke-width="' + (i % 3 ? 1 : 2) + '" stroke-linecap="round" transform="rotate(' + i * 30 + ')"/>';
    return '<circle r="25" fill="' + SURF + '" stroke="' + ink(tn) + '" stroke-width="5"/>' + ticks +
      '<line x1="0" y1="0" x2="0" y2="-10.500" stroke="' + INK + '" stroke-width="3.600" stroke-linecap="round" transform="rotate(' + ((h + m / 60) * 30).toFixed(1) + ')"/>' +
      '<line x1="0" y1="0" x2="0" y2="-16.500" stroke="' + ink('sky') + '" stroke-width="2.400" stroke-linecap="round" transform="rotate(' + m * 6 + ')"/><circle r="2.800" fill="' + deep('apricot') + '"/>';
  }
  var THING = {
    person: person,
    clock: clock,
    window: function () {
      return '<rect x="-52" y="-41" width="104" height="82" rx="10" fill="' + soft('sky') + '" stroke="' + SURF + '" stroke-width="6"/><circle cx="26" cy="-15" r="12" fill="' + SUN + '"/>' +
        '<path d="M-49 29c20-16 36-16 52 0s30 10 46-6v15h-98z" fill="' + fill('mint') + '"/><path d="M0-41v82M-52 0h104" stroke="' + SURF + '" stroke-width="5"/>';
    },
    door: function (t) { var tn = tone(t.tone, 'apricot'); return '<rect x="-24" y="-84" width="48" height="84" rx="5" fill="' + fill(tn) + '" stroke="' + deep(tn) + '" stroke-width="3"/><rect x="-15" y="-74" width="30" height="26" rx="3" fill="' + soft(tn) + '"/><circle cx="14" cy="-38" r="3.200" fill="' + deep(tn) + '"/>'; },
    table: function () { return '<rect x="-75" y="-30" width="150" height="13" rx="6.500" fill="' + WOOD + '"/><rect x="-63" y="-17" width="10" height="17" rx="4" fill="' + WOOD + '" opacity=".8"/><rect x="53" y="-17" width="10" height="17" rx="4" fill="' + WOOD + '" opacity=".8"/>'; },
    counter: function (t) { var tn = tone(t.tone, 'sky'); return '<rect x="-64" y="-46" width="128" height="46" rx="8" fill="' + fill(tn) + '"/><rect x="-70" y="-52" width="140" height="11" rx="5.500" fill="' + SURF + '" stroke="' + deep(tn) + '" stroke-width="2"/><rect x="-52" y="-32" width="104" height="22" rx="5" fill="' + soft(tn) + '" opacity=".7"/>'; },
    chair: function (t) { var tn = tone(t.tone, 'mint'); return '<rect x="-15" y="-46" width="30" height="26" rx="7" fill="' + fill(tn) + '"/><rect x="-17" y="-22" width="34" height="8" rx="4" fill="' + deep(tn) + '"/><path d="M-13-14v14M13-14v14" stroke="' + WOOD + '" stroke-width="4" stroke-linecap="round"/>'; },
    bench: function (t) { var tn = tone(t.tone, 'sky'); return '<rect x="-46" y="-40" width="92" height="16" rx="6" fill="' + fill(tn) + '"/><rect x="-48" y="-20" width="96" height="8" rx="4" fill="' + deep(tn) + '"/><path d="M-38-12v12M38-12v12" stroke="var(--ink-2)" stroke-width="4" stroke-linecap="round"/>'; },
    bed: function (t) { var tn = tone(t.tone, 'sky'); return '<rect x="-56" y="-30" width="112" height="12" rx="6" fill="' + fill(tn) + '"/><rect x="-56" y="-40" width="30" height="14" rx="7" fill="' + SURF + '" stroke="' + deep(tn) + '" stroke-width="1.500"/><path d="M-46-18v18M46-18v18" stroke="var(--ink-2)" stroke-width="4" stroke-linecap="round"/><path d="M-46-8h92" stroke="var(--ink-2)" stroke-width="2.500"/>'; },
    plant: function () {
      return '<path d="M-14-22h28l-4 22h-20z" fill="' + WOOD + '"/><g class="s-sway"><path d="M0-22c-12-20-9-36 0-46 9 10 12 26 0 46z" fill="' + deep('mint') + '"/>' +
        '<path d="M0-22c-20-9-25-22-23-34 12 4 21 14 23 34z" fill="' + fill('mint') + '"/><path d="M0-22c20-9 25-22 23-34-12 4-21 14-23 34z" fill="' + fill('mint') + '"/></g>';
    },
    phone: function (t) {
      return '<rect x="-14" y="-38" width="28" height="38" rx="7" fill="' + INK + '"/><rect x="-10" y="-33" width="20" height="25" rx="3" fill="' + fill('sky') + '"/>' +
        (t.on ? '<path class="s-ring" d="M18-40q8 2 10 10" fill="none" stroke="' + ink('mint') + '" stroke-width="2.500" stroke-linecap="round"/><path class="s-ring s-ring2" d="M22-48q14 4 16 18" fill="none" stroke="' + ink('mint') + '" stroke-width="2.500" stroke-linecap="round"/>' : '');
    },
    agenda: function (t) { var tn = tone(t.tone, 'lilac'); return '<rect x="-25" y="-22" width="50" height="22" rx="4" fill="' + fill(tn) + '" stroke="' + deep(tn) + '" stroke-width="2"/><path d="M-15-15h30M-15-8h20" stroke="' + ink(tn) + '" stroke-width="2.500" stroke-linecap="round"/><path d="M0-22v22" stroke="' + deep(tn) + '" stroke-width="1.500"/>'; },
    letter: function (t) { var tn = tone(t.tone, 'apricot'); return '<rect x="-18" y="-26" width="36" height="26" rx="4" fill="' + SURF + '" stroke="' + deep(tn) + '" stroke-width="2"/><path d="M-18-24l18 13 18-13" fill="none" stroke="' + deep(tn) + '" stroke-width="2" stroke-linejoin="round"/>'; },
    card: function (t) { var tn = tone(t.tone, 'sky'); return '<rect x="-17" y="-22" width="34" height="22" rx="4" fill="' + fill(tn) + '" stroke="' + deep(tn) + '" stroke-width="2"/><circle cx="-8" cy="-12" r="4" fill="' + SURF + '"/><path d="M0-15h11M0-9h8" stroke="' + ink(tn) + '" stroke-width="2" stroke-linecap="round"/>'; },
    bag: function (t) { var tn = tone(t.tone, 'apricot'); return '<path d="M-8-22c0-12 16-12 16 0" fill="none" stroke="' + deep(tn) + '" stroke-width="3"/><rect x="-14" y="-24" width="28" height="24" rx="6" fill="' + fill(tn) + '" stroke="' + deep(tn) + '" stroke-width="2"/>'; },
    medicine: function (t) { var tn = tone(t.tone, 'mint'); return '<rect x="-16" y="-24" width="32" height="24" rx="4" fill="' + SURF + '" stroke="' + deep(tn) + '" stroke-width="2"/><path d="M-2.500-19h5v4.500h4.500v5h-4.500v4.500h-5v-4.500h-4.500v-5h4.500z" fill="' + ink(tn) + '"/>'; },
    sign: function (t) {
      var s = txt(t.text), w = Math.max(34, s.length * 7.4 + 18), tn = tone(t.tone, 'sky');
      return '<rect x="' + (-w / 2).toFixed(1) + '" y="-12" width="' + w.toFixed(1) + '" height="24" rx="6" fill="' + SURF + '" stroke="' + deep(tn) + '" stroke-width="2.500"/>' + T(0, 4.5, s, 12, ink(tn));
    },
    screen: function (t) { return '<rect x="-30" y="-17" width="60" height="34" rx="6" fill="' + INK + '"/>' + T(0, 6, txt(t.text), 16, SUN); },
    shelf: function (t) { var tn = tone(t.tone, 'mint'); return '<rect x="-46" y="0" width="92" height="7" rx="3.500" fill="' + WOOD + '"/><rect x="-38" y="-22" width="18" height="22" rx="3" fill="' + fill(tn) + '"/><rect x="-14" y="-16" width="18" height="16" rx="3" fill="' + fill('apricot') + '"/><rect x="12" y="-26" width="18" height="26" rx="3" fill="' + fill('sky') + '"/>'; },
    stall: function (t) {
      var tn = tone(t.tone, 'apricot'), o = '<path d="M-118-106v106M118-106v106" stroke="' + WOOD + '" stroke-width="8"/><path d="M-130-140h260l16 34h-292z" fill="' + SURF + '"/>';
      for (var i = 0; i < 7; i++) o += '<path d="M' + (-130 + i * 40) + '-140h20l' + (i - 3) * 1.2 + ' 34h-' + 22 + 'z" fill="' + deep(tn) + '" opacity=".8"/>';
      o += '<path d="M-146-106q18 14 36.500 0q18 14 36.500 0q18 14 36.500 0q18 14 36.500 0q18 14 36.500 0q18 14 36.500 0q18 14 36.500 0q18 14 36.500 0v-2h-292z" fill="' + SURF + '"/>';
      return o + '<rect x="-126" y="-36" width="252" height="40" rx="8" fill="' + WOOD + '"/>';
    },
    apples: function (t) { return '<circle cx="-17" cy="-11" r="11" fill="' + deep('mint') + '"/><circle cx="17" cy="-11" r="11" fill="' + deep('mint') + '"/><circle cx="0" cy="-14" r="11" fill="' + deep('apricot') + '"/><path d="M0-25q2-5 6-5" fill="none" stroke="' + WOOD + '" stroke-width="2" stroke-linecap="round"/>' + price(t); },
    bread: function (t) { return '<path d="M-28-4c0-20 56-20 56 0v4h-56z" fill="' + WOOD + '"/><path d="M-14-12l6 6M0-15l6 8M14-12l6 6" stroke="' + soft('apricot') + '" stroke-width="2.500" stroke-linecap="round"/>' + price(t); },
    train: function (t) { var tn = tone(t.tone, 'apricot'); return '<rect x="-67" y="-78" width="134" height="68" rx="18" fill="' + fill(tn) + '" stroke="' + deep(tn) + '" stroke-width="3"/><rect x="-53" y="-66" width="30" height="24" rx="6" fill="' + soft('sky') + '"/><rect x="-15" y="-66" width="30" height="24" rx="6" fill="' + soft('sky') + '"/><rect x="23" y="-66" width="30" height="24" rx="6" fill="' + soft('sky') + '"/><path d="M-67-32h134" stroke="' + deep(tn) + '" stroke-width="3"/><circle cx="-37" cy="-6" r="9" fill="' + INK + '"/><circle cx="37" cy="-6" r="9" fill="' + INK + '"/>'; },
    ticket: function (t) { var tn = tone(t.tone, 'sky'); return '<rect x="-42" y="-86" width="84" height="86" rx="10" fill="' + SURF + '" stroke="' + deep(tn) + '" stroke-width="3"/><rect x="-32" y="-76" width="64" height="36" rx="6" fill="' + soft(tn) + '"/><rect x="-42" y="-34" width="84" height="10" fill="' + deep(tn) + '"/>'; },
    // heel lichaam van voren, 0,0 = tussen de voeten; hoofd op y -104, keel -90, schouder ±18,-82, arm ±24,-62, hand ±27,-42, borst -72, buik -56, rug = borst, knie ±8,-22, voet ±8,-3
    figure: function (t) {
      var tn = tone(t.tone, 'lilac'), skin = SKIN[t.skin] || SKIN.a, hc = HAIRC[t.hairTone] || HAIRC.dark;
      return '<ellipse cx="0" cy="0" rx="20" ry="4" fill="' + INK + '" opacity=".12"/>' +
        '<path d="M-8-44v38M8-44v38" stroke="' + deep(tn) + '" stroke-width="10" stroke-linecap="round"/><ellipse cx="-9" cy="-3" rx="7" ry="3.500" fill="' + INK + '" opacity=".7"/><ellipse cx="9" cy="-3" rx="7" ry="3.500" fill="' + INK + '" opacity=".7"/>' +
        '<path d="M-18-80L-26-46M18-80L26-46" stroke="' + skin + '" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M-17-86h34c4 0 6 3 5 7l-5 37h-34l-5-37c-1-4 1-7 5-7z" fill="' + fill(tn) + '"/><path d="M-18-80l-4 16M18-80l4 16" stroke="' + fill(tn) + '" stroke-width="8" stroke-linecap="round"/>' +
        '<rect x="-3.500" y="-94" width="7" height="9" fill="' + skin + '"/><circle cx="0" cy="-104" r="12" fill="' + skin + '"/><path d="M-12.400-104c0-18 24.800-18 24.800 0-6.500-7-18.300-7-24.800 0z" fill="' + hc + '"/>' +
        (t.back ? '<circle cx="0" cy="-104" r="12" fill="' + hc + '"/><path d="M0-84v40" stroke="' + deep(tn) + '" stroke-width="1.500" stroke-linecap="round" opacity=".5"/>'
          : '<circle cx="-4.200" cy="-103" r="1.400" fill="' + INK + '"/><circle cx="4.200" cy="-103" r="1.400" fill="' + INK + '"/><path d="M-3.500-97.500q3.500 2 7 0" fill="none" stroke="' + INK + '" stroke-width="1.500" stroke-linecap="round"/>');
    },
    spot: function () { return ''; }
  };
  function price(t) { if (!t.text) return ''; var s = txt(t.text), w = Math.max(40, s.length * 6.6 + 12); return '<rect x="' + (-w / 2).toFixed(1) + '" y="4" width="' + w.toFixed(1) + '" height="16" rx="5" fill="' + SURF + '"/>' + T(0, 16, s, 10.5, INK); }
  // hoe groot de gloed achter een aantikbaar ding is: [breedte, hoogte, midden-y]
  var HALO = { person: [44, 64, -28], clock: [64, 64, 0], window: [116, 94, 0], door: [60, 96, -42], table: [160, 44, -15], counter: [150, 62, -26], chair: [46, 56, -23], bench: [106, 50, -20], bed: [124, 52, -20], plant: [56, 78, -34], phone: [44, 52, -19], agenda: [62, 34, -11], letter: [48, 38, -13], card: [46, 34, -11], bag: [40, 46, -17], medicine: [44, 36, -12], sign: [80, 36, 0], screen: [72, 46, 0], shelf: [104, 44, -10], stall: [300, 150, -70], apples: [70, 48, -6], bread: [70, 44, -4], train: [146, 90, -42], ticket: [96, 98, -43], figure: [70, 124, -58] };
  var KINDS = Object.keys(THING);

  function label(x, c) { return typeof c.text === 'function' ? c.text(x) : (x && typeof x === 'object' ? (x.nl || '') : (x == null ? '' : String(x))); }

  function render(art, safe, ctx) {
    if (!art || BGS.indexOf(art.bg) < 0 || typeof safe !== 'function') return '';
    var c = ctx || {};
    try {
      var out = BG[art.bg](tone(art.tone, 'mint'));
      (art.things || []).slice(0, MAX).forEach(function (t, i) {
        if (!t || !THING[t.kind]) return;
        var x = clamp(num(t.x), -20, W + 20), y = clamp(num(t.y), -20, H + 20), s = clamp(num(t.s, 1), 0.4, 2.6);
        var body = THING[t.kind](t, c), hot = !!t.hot, halo = '';
        if (hot) {
          var h = HALO[t.kind] || [2 * clamp(num(t.r, 22), 10, 60), 2 * clamp(num(t.r, 22), 10, 60), 0];
          halo = '<rect class="s-halo" x="' + (-h[0] / 2) + '" y="' + (h[2] - h[1] / 2) + '" width="' + h[0] + '" height="' + h[1] + '" rx="' + Math.min(h[0], h[1]) / 3 + '"/>';
        }
        out += '<g transform="translate(' + x + ' ' + y + ') scale(' + (t.flip ? -s : s) + ' ' + s + ')"' +
          (hot ? ' class="s-hot" data-i="' + i + '" tabindex="0" role="button" aria-label="' + attr(label(t.label, c)) + '"' : '') + '>' +
          '<g class="s-in" style="animation-delay:' + (0.08 + i * 0.07).toFixed(2) + 's">' + halo + body + '</g></g>';
      });
      return '<div class="s-vis"><svg class="s-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + attr(label(art.alt, c)) + '">' + out + '</svg></div>';
    } catch (e) { return ''; }
  }

  // controle voor pakketcheck: geeft een lijst met meldingen (leeg = goed)
  function check(art) {
    var p = [];
    if (!art || typeof art !== 'object') return ['art ontbreekt'];
    if (BGS.indexOf(art.bg) < 0) p.push('onbekende achtergrond: ' + art.bg);
    if (!art.alt) p.push('alt ontbreekt (beschrijving van de tekening)');
    var th = art.things;
    if (!Array.isArray(th)) return p.concat('things is geen lijst');
    if (th.length > MAX) p.push('meer dan ' + MAX + ' dingen');
    th.forEach(function (t, i) {
      var w = 'things[' + i + ']';
      if (!t || KINDS.indexOf(t.kind) < 0) { p.push(w + ': onbekend ding'); return; }
      if (!isFinite(Number(t.x)) || !isFinite(Number(t.y)) || t.x < 0 || t.x > W || t.y < 0 || t.y > H) p.push(w + ': plek buiten de tekening');
      if (t.hot && !t.label) p.push(w + ': aantikbaar ding zonder label');
      if (t.kind === 'spot' && !t.hot) p.push(w + ': een spot moet aantikbaar zijn');
      if (t.kind === 'person' && t.look && LOOKS.indexOf(t.look) < 0) p.push(w + ': onbekende uitdrukking');
      if (t.kind === 'clock' && t.value && !/^\d{1,2}:\d{2}$/.test(String(t.value))) p.push(w + ': tijd als u:mm');
    });
    return p;
  }

  var CSS = '.s-vis{border-radius:var(--r,22px);overflow:hidden}.s-svg{display:block;width:100%;height:auto}' +
    '.s-in{animation:s-in .55s cubic-bezier(.2,.9,.3,1) both}@keyframes s-in{from{opacity:0;transform:translateY(10px)}}' +
    '.s-hot{cursor:pointer;outline:none}.s-halo{fill:var(--sun,#f6dc9a);opacity:0;transition:opacity .2s}.s-hot:hover .s-halo,.s-hot:focus-visible .s-halo,.s-hot.on .s-halo{opacity:.6}' +
    '.s-sway{transform-origin:center bottom;transform-box:fill-box;animation:s-sway 4.500s ease-in-out infinite}@keyframes s-sway{50%{transform:rotate(3deg)}}' +
    '.s-ring{opacity:0;animation:s-ring 1.400s ease-out infinite}.s-ring2{animation-delay:.35s}@keyframes s-ring{20%{opacity:.8}100%{opacity:0;transform:translate(6px,-6px)}}' +
    '.s-talk{transform-origin:center;transform-box:fill-box;animation:s-talk .42s ease-in-out infinite alternate}@keyframes s-talk{to{transform:scaleY(.35)}}' +
    '@media (prefers-reduced-motion:reduce){.s-in,.s-sway,.s-ring,.s-talk{animation:none}.s-ring{opacity:.6}}';

  var api = { BGS: BGS, KINDS: KINDS, LOOKS: LOOKS, TONES: TONES, W: W, H: H, render: render, check: check, CSS: CSS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SceneVis = api;
})(typeof window !== 'undefined' ? window : this);

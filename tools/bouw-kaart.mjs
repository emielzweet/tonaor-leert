// Bouwt de vier kaarten (docs/kaart-en-tijdlijn.md) uit Natural Earth (publiek domein). Draait alleen bij het maken.
// Gebruik: TONAOR_KAART=<map met de GeoJSON-bestanden van Natural Earth> node tools/bouw-kaart.mjs
// Nodig in die map: ne_110m_admin_0_countries.geojson, ne_50m_admin_0_countries.geojson, ne_10m_admin_1_states_provinces.geojson.
// Uitvoer: kaart/<naam>.json met view, proj, regions (id, naam, pad) en lic. Per kaart hooguit 80 kB: het script vereenvoudigt tot die grens.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const K = createRequire(import.meta.url)('../kaart.js');
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SRC = process.env.TONAOR_KAART;
if (!SRC) { console.error('Zet TONAOR_KAART op de map met de Natural Earth-bestanden.'); process.exit(2); }
const MAXB = 80000, W = 340;
const load = f => JSON.parse(readFileSync(join(SRC, f), 'utf8'));
const NE = { w110: 'ne_110m_admin_0_countries.geojson', w50: 'ne_50m_admin_0_countries.geojson', p10: 'ne_10m_admin_1_states_provinces.geojson' };
const version = (() => { try { return load(NE.w110).features[0].properties.NE_VERSION || '5.x'; } catch (e) { return '5.x'; } })();

// Douglas-Peucker op een ring van punten in het plaatje
function simplify(pts, eps) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let dm = 0, im = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    for (let i = a + 1; i < b; i++) { const d = L < 1e-9 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay) : Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L; /* gesloten ring: afstand tot het beginpunt */ if (d > dm) { dm = d; im = i; } }
    if (dm > eps && im > 0) { keep[im] = 1; st.push([a, im], [im, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const polys = g => g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];

function build(name, opt) {
  const { proj0, bbox, feats, idOf, nameOf } = opt;
  // schaal: de rand van de uitsnede (bbox) past in W breed
  const xs = [], ys = [];
  for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) { const m = K.raw(proj0, [bbox[0] + (bbox[2] - bbox[0]) * i / 20, bbox[1] + (bbox[3] - bbox[1]) * j / 20]); xs.push(m[0]); ys.push(m[1]); }
  const x0 = Math.min(...xs), y0 = Math.min(...ys), k = W / (Math.max(...xs) - x0);
  const proj = { ...proj0, x0, y0, k };
  const view = [0, 0, W, +((Math.max(...ys) - y0) * k).toFixed(1)];
  const near = ll => ll[0] >= bbox[0] - 15 && ll[0] <= bbox[2] + 15 && ll[1] >= bbox[1] - 10 && ll[1] <= bbox[3] + 10;
  const regs = [];
  for (const f of feats) {
    const id = idOf(f.properties); if (!id) continue;
    const parts = polys(f.geometry).filter(poly => poly[0].some(near));
    if (!parts.length) continue;
    regs.push({ id, name: nameOf(f.properties), rings: parts.map(poly => poly[0].map(ll => K.project(proj, ll))) });
  }
  let eps = 0.15, out;
  for (;;) {
    const regions = regs.map(r => {
      const d = r.rings.map(ring => simplify(ring, eps)).filter(ring => ring.length >= 4).map(ring => 'M' + ring.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z').join('');
      return d ? { id: r.id, name: r.name, d } : null;
    }).filter(Boolean);
    out = { name, view, proj, regions, lic: { src: 'Natural Earth (naturalearthdata.com), via github.com/nvkelso/natural-earth-vector', version, licentie: 'publiek domein' } };
    const n = JSON.stringify(out).length;
    if (n <= MAXB || eps > 20) break;
    eps *= 1.35;
  }
  mkdirSync(join(ROOT, 'kaart'), { recursive: true });
  writeFileSync(join(ROOT, 'kaart', name + '.json'), JSON.stringify(out) + '\n');
  console.log(name + ': ' + out.regions.length + ' gebieden, ' + JSON.stringify(out).length + ' tekens, vereenvoudiging ' + eps.toFixed(2));
}

const iso = p => { const a = p.ISO_A2_EH && p.ISO_A2_EH !== '-99' ? p.ISO_A2_EH : p.ISO_A2; return a && a !== '-99' ? a : null; };
const nl = p => p.NAME_NL || p.NAME || p.ADMIN;
const w110 = load(NE.w110).features, w50 = load(NE.w50).features;
build('wereld', { proj0: { type: 'eqr' }, bbox: [-180, -58, 180, 84], feats: w110.filter(f => f.properties.CONTINENT !== 'Antarctica'), idOf: iso, nameOf: nl });
build('europa', { proj0: { type: 'lcc', lon0: 15, lat0: 52, lat1: 43, lat2: 62 }, bbox: [-25, 34, 45, 72], feats: w50, idOf: iso, nameOf: nl });
build('azie', { proj0: { type: 'lcc', lon0: 95, lat0: 30, lat1: 15, lat2: 45 }, bbox: [25, -12, 150, 60], feats: w50, idOf: iso, nameOf: nl });
const prov = load(NE.p10).features.filter(f => f.properties.adm0_a3 === 'NLD' && f.properties.longitude > 0);
const pid = p => (p.name_nl || p.name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
build('nederland', { proj0: { type: 'lcc', lon0: 5.3, lat0: 52.1, lat1: 51, lat2: 53 }, bbox: [3.2, 50.7, 7.3, 53.6], feats: prov, idOf: pid, nameOf: p => p.name_nl || p.name });

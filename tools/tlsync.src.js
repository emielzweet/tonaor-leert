/* TLSync 2: automatische, versleutelde koppeling tussen "Tonaor leert" (iPhone) en het EDGE Masterplan (iCUE).
   Dit bestand is gedeeld: precies dezelfde tlsync.js staat in de app (repository tonaor-leert) en in de widget (scripts/tlsync.js).

   Twee formaten, gekozen op basis van de koppelcode:
   - TL1 (oud, alleen nog voor de overstap): code "maan-thee-fiets-zon-4821", sleutel = 4000x SHA-256, eigen stroomversleuteling.
     Ongewijzigd gebleven zodat bestaande koppelingen blijven werken. Zie issue #1.
   - TL2 (nieuw): code van 28 tekens (140 bits), bijv. "k7qf-m2xa-9tbr-...". Sleutel en kanaal via scrypt (N=2^15, r=8, p=1)
     en HKDF-SHA256; versleuteling AES-256-GCM-SIV (RFC 8452) met de richting (up/down) als extra gegevens.
     Bericht: "TL2." + base64(nonce[12] || versleutelde tekst + tag[16]).
   Toeval (issue #2): crypto.getRandomValues als die er is. Zonder veilig toeval wordt de nonce afgeleid uit sleutel, tijd, teller
   en bericht (HMAC-SHA256). GCM-SIV blijft daarmee veilig; er wordt nooit een gewone (voorspelbare) toevalsgenerator gebruikt. Versturen blijft dus altijd werken.
   Cryptografie: @noble/ciphers 2.4.0 en @noble/hashes 2.4.0 (MIT, Paul Miller, geaudit), gebundeld als TLNoble, zie tools/. */
(function (root) {
  "use strict";
  var N = root.TLNoble;
  var HOST = "https://ntfy.sh/";
  var enc = typeof TextEncoder !== "undefined" ? new TextEncoder() : null, dec = typeof TextDecoder !== "undefined" ? new TextDecoder() : null;
  function utf8(s) { if (enc) return enc.encode(s); var u = unescape(encodeURIComponent(s)), a = new Uint8Array(u.length); for (var i = 0; i < u.length; i++) a[i] = u.charCodeAt(i); return a; }
  function unutf8(a) { if (dec) return dec.decode(a); var s = ""; for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return decodeURIComponent(escape(s)); }
  function cat() { var t = 0, i; for (i = 0; i < arguments.length; i++) t += arguments[i].length; var o = new Uint8Array(t), p = 0; for (i = 0; i < arguments.length; i++) { o.set(arguments[i], p); p += arguments[i].length; } return o; }
  function hex(a) { var s = ""; for (var i = 0; i < a.length; i++) s += (a[i] < 16 ? "0" : "") + a[i].toString(16); return s; }
  function b64(a) { var s = ""; for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }
  function unb64(s) { var r = atob(s), a = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a; }
  function u32(n) { return new Uint8Array([n >>> 24, n >>> 16, n >>> 8, n]); }

  /* ---------- toeval ---------- */
  function cryptoObj() { var c = root.crypto || root.msCrypto; return c && typeof c.getRandomValues === "function" ? c : null; }
  function secure() { try { var c = cryptoObj(); if (!c) return false; c.getRandomValues(new Uint8Array(1)); return true; } catch (e) { return false; } }
  var ctr = 0;
  /* n willekeurige bytes. Zonder veilig toeval: HMAC(sleutel, doel|tijd|teller|bericht). Dat is uniek per bericht (tijd + teller)
     en zonder de sleutel niet te voorspellen. Alleen bruikbaar voor nonces/IV's, nooit voor codes. */
  function nonce(n, nkey, purpose, msg) {
    var c = cryptoObj(); if (c) { try { var a = new Uint8Array(n); c.getRandomValues(a); return a; } catch (e) {} }
    ctr = (ctr + 1) >>> 0;
    var t = Date.now(), p = (root.performance && root.performance.now) ? Math.floor(root.performance.now() * 1000) >>> 0 : 0;
    var info = cat(utf8(purpose), u32(Math.floor(t / 4294967296)), u32(t >>> 0), u32(p), u32(ctr), msg || new Uint8Array(0));
    return N.hmac(N.sha256, nkey, info).slice(0, n);
  }

  /* ---------- TL1 (oud formaat, ongewijzigd voor de overstap) ---------- */
  var WORDS = ["maan","zon","thee","fiets","tuin","bloem","boom","huis","raam","deur","vis","kat","hond","boot","zee","wolk","regen","sneeuw","berg","rivier","brug","weg","trein","bus","tafel","stoel","lamp","boek","pen","brief","koffie","rijst","soep","appel","peer","mango","banaan","kaas","brood","melk","ster","licht","vuur","wind","blad","gras","roos","lotus","vogel","eend","zwaan","schip","haven","duin","strand","schelp","jas","muts","sjaal","klok","bel","kaars","spiegel","lepel"];
  function newCode() { if (!secure()) throw new Error("TLSync: geen veilig toeval voor een nieuwe code"); var r = new Uint8Array(6); cryptoObj().getRandomValues(r); var w = []; for (var i = 0; i < 4; i++) w.push(WORDS[r[i] % WORDS.length]); return w.join("-") + "-" + (1000 + ((r[4] << 8 | r[5]) % 9000)); }
  function norm(code) { return String(code || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  var cache1 = {};
  function derive(code) {
    code = norm(code); if (cache1[code]) return cache1[code];
    var k = N.sha256(utf8("tonaor-leert|" + code));
    for (var i = 0; i < 4000; i++) k = N.sha256(cat(k, utf8(code)));
    var d = { code: code, key: k, nkey: N.sha256(cat(k, utf8("nonce"))), chan: "tl-" + hex(N.sha256(cat(k, utf8("kanaal")))).slice(0, 28) };
    cache1[code] = d; return d;
  }
  function stream(key, iv, n) { var o = new Uint8Array(n), c = 0, p = 0; while (p < n) { var blk = N.sha256(cat(key, iv, u32(c))); for (var i = 0; i < 32 && p < n; i++) o[p++] = blk[i]; c++; } return o; }
  function seal(code, obj) {
    var d = derive(code), pt = utf8(JSON.stringify(obj)), iv = nonce(16, d.nkey, "TL1 iv", pt), ks = stream(d.key, iv, pt.length), ct = new Uint8Array(pt.length);
    for (var i = 0; i < pt.length; i++) ct[i] = pt[i] ^ ks[i];
    var mac = N.sha256(cat(d.key, utf8("mac"), iv, ct)).subarray(0, 16);
    return "TL1." + b64(cat(iv, mac, ct));
  }
  function open(code, txt) {
    if (!txt || String(txt).indexOf("TL1.") !== 0) return null;
    try {
      var d = derive(code), a = unb64(String(txt).slice(4)), iv = a.subarray(0, 16), mac = a.subarray(16, 32), ct = a.subarray(32);
      var chk = N.sha256(cat(d.key, utf8("mac"), iv, ct)), diff = 0; for (var i = 0; i < 16; i++) diff |= chk[i] ^ mac[i]; if (diff) return null;
      var ks = stream(d.key, iv, ct.length), pt = new Uint8Array(ct.length); for (i = 0; i < ct.length; i++) pt[i] = ct[i] ^ ks[i];
      return JSON.parse(unutf8(pt));
    } catch (e) { return null; }
  }

  /* ---------- TL2 (nieuw formaat) ---------- */
  var B32 = "0123456789abcdefghjkmnpqrstvwxyz", LEN2 = 28;
  /* een oude code (4 woorden + 4 cijfers) is nooit TL2, ook niet als de woorden samen toevallig 24 letters hebben */
  function isV1(code) { return /^[a-z]+-[a-z]+-[a-z]+-[a-z]+-[0-9]{4}$/.test(norm(code)); }
  function norm2(code) {
    if (isV1(code)) return "";
    var s = String(code || "").toLowerCase().replace(/[^a-z0-9]/g, "").replace(/[il]/g, "1").replace(/o/g, "0").replace(/u/g, "v");
    if (s.length !== LEN2) return ""; for (var i = 0; i < s.length; i++) if (B32.indexOf(s[i]) < 0) return ""; return s;
  }
  function isV2(code) { return !!norm2(code); }
  function pretty2(s) { return s.match(/.{1,4}/g).join("-"); }
  function newCode2() {
    if (!secure()) throw new Error("TLSync: geen veilig toeval voor een nieuwe code");
    var r = new Uint8Array(LEN2), s = ""; cryptoObj().getRandomValues(r);
    for (var i = 0; i < LEN2; i++) s += B32[r[i] & 31]; /* 256 is een veelvoud van 32: geen scheefheid */
    return pretty2(s);
  }
  var cache2 = {};
  function derive2(code, cb) {
    var c = norm2(code); if (!c) return cb(null);
    var hit = cache2[c]; if (hit && hit.key) return cb(hit); if (hit) { hit.wait.push(cb); return; }
    hit = cache2[c] = { wait: [cb] };
    function fail() { var w = hit.wait; delete cache2[c]; w.forEach(function (f) { f(null); }); }
    var pr; try { pr = N.scryptAsync(utf8(c), utf8("tonaor-leert|TL2|scrypt"), { N: 32768, r: 8, p: 1, dkLen: 32 }); } catch (e) { return fail(); }
    pr.then(function (m) {
      hit.key = N.hkdf(N.sha256, m, undefined, utf8("tonaor-leert|TL2|sleutel"), 32);
      hit.nkey = N.hkdf(N.sha256, m, undefined, utf8("tonaor-leert|TL2|nonce"), 32);
      hit.chan = "tl2-" + hex(N.hkdf(N.sha256, m, undefined, utf8("tonaor-leert|TL2|kanaal"), 16));
      hit.code = c; var w = hit.wait; hit.wait = []; w.forEach(function (f) { f(hit); });
    }).catch(fail);
  }
  function aad(dir) { return utf8("tonaor-leert|TL2|" + dir); }
  function seal2(d, dir, obj) {
    var pt = utf8(JSON.stringify(obj)), iv = nonce(12, d.nkey, "TL2 nonce|" + dir, pt);
    return "TL2." + b64(cat(iv, N.gcmsiv(d.key, iv, aad(dir)).encrypt(pt)));
  }
  function open2(d, dir, txt) {
    if (!txt || String(txt).indexOf("TL2.") !== 0) return null;
    try { var a = unb64(String(txt).slice(4)); if (a.length < 28) return null; return JSON.parse(unutf8(N.gcmsiv(d.key, a.subarray(0, 12), aad(dir)).decrypt(a.subarray(12)))); }
    catch (e) { return null; }
  }

  /* ---------- versturen en ophalen (kiest TL1 of TL2 aan de hand van de code) ---------- */
  function post(url, body, cb) {
    try { var x = new XMLHttpRequest(); x.open("POST", url); x.onload = function () { cb && cb(x.status >= 200 && x.status < 300); }; x.onerror = function () { cb && cb(false); }; x.send(body); } catch (e) { cb && cb(false); }
  }
  function poll(url, opener, cb) {
    try {
      var x = new XMLHttpRequest(); x.open("GET", url + "/json?poll=1&since=12h");
      x.onload = function () { if (x.status !== 200) return cb(null); var out = []; String(x.responseText || "").split("\n").forEach(function (ln) { if (!ln) return; try { var j = JSON.parse(ln); if (j.event === "message") { var o = opener(j.message); if (o) out.push(o); } } catch (e) {} }); cb(out); };
      x.onerror = function () { cb(null); }; x.send();
    } catch (e) { cb(null); }
  }
  function send(code, dir, obj, cb) {
    if (isV2(code)) return derive2(code, function (d) { if (!d) return cb && cb(false); var body; try { body = seal2(d, dir, obj); } catch (e) { return cb && cb(false); } post(HOST + d.chan + "-" + dir, body, cb); });
    if (!norm(code)) return cb && cb(false);
    var body1; try { body1 = seal(code, obj); } catch (e) { return cb && cb(false); }
    post(HOST + derive(code).chan + "-" + dir, body1, cb);
  }
  /* haalt de berichten van de laatste 12 uur op, oudste eerst; cb(lijst van ontsleutelde objecten) of cb(null) bij geen verbinding */
  function fetchAll(code, dir, cb) {
    if (isV2(code)) return derive2(code, function (d) { if (!d) return cb(null); poll(HOST + d.chan + "-" + dir, function (m) { return open2(d, dir, m); }, cb); });
    if (!norm(code)) return cb(null);
    poll(HOST + derive(code).chan + "-" + dir, function (m) { return open(code, m); }, cb);
  }
  /* sleutel alvast afleiden (scrypt duurt even), zodat de eerste verzending direct gaat */
  function prepare(code, cb) { if (isV2(code)) derive2(code, function (d) { cb && cb(!!d); }); else cb && cb(!!norm(code)); }

  root.TLSync = {
    version: 2, secure: secure, newCode: newCode, newCode2: newCode2, isV2: isV2, norm: norm, norm2: norm2, prepare: prepare,
    seal: seal, open: open, send: send, fetchAll: fetchAll,
    channel: function (c, cb) { if (isV2(c)) { derive2(c, function (d) { cb && cb(d ? d.chan : null); }); return cache2[norm2(c)] && cache2[norm2(c)].chan || null; } return derive(c).chan; },
    _test: { seal2: seal2, open2: open2, derive2: derive2, nonce: nonce }
  };
})(typeof window !== "undefined" ? window : this);

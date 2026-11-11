// Bouwt tlsync.js (in de root van deze repo) = noble-bundel + tools/tlsync.src.js.
// Gebruik: node tools/build-tlsync.mjs   → kopieer daarna tlsync.js ook naar de EDGE-widget (scripts/tlsync.js).
// De noble-bundel opnieuw maken (alleen bij een nieuwe noble-versie), in een lege map:
//   npm install --ignore-scripts --save-exact @noble/ciphers@2.4.0 @noble/hashes@2.4.0 esbuild@0.28.2
//   npx esbuild noble-entry.js --bundle --minify --format=iife --global-name=TLNoble --target=es2022 --legal-comments=none --outfile=noble-2.4.0.min.js
import { readFileSync, writeFileSync } from 'node:fs';
const here = new URL('.', import.meta.url);
const noble = readFileSync(new URL('noble-2.4.0.min.js', here), 'utf8').trim();
const src = readFileSync(new URL('tlsync.src.js', here), 'utf8');
const head = '/* tlsync.js: GEBOUWD BESTAND, niet met de hand wijzigen. Bron: tools/tlsync.src.js, bouwen: node tools/build-tlsync.mjs\n' +
  '   Bevat @noble/ciphers 2.4.0 en @noble/hashes 2.4.0, (c) Paul Miller, MIT-licentie (https://paulmillr.com/noble). */\n';
writeFileSync(new URL('../tlsync.js', here), head + 'var TLNoble=(function(){' + noble.replace(/^var TLNoble=/, 'return ') + '})();\n' + src);
console.log('tlsync.js gebouwd');

#!/usr/bin/env node
// Tests du générateur .rsc : node tools/test-generator.js
const path = require('path');
const G = require(path.join(__dirname, '..', 'js', 'tools', 'rsc-generator.js'));
let fail = 0;
const ok = (n, c, i) => { if (!c) { fail++; console.log('  ✗ ' + n + (i ? ' — ' + i : '')); } else console.log('  ✓ ' + n); };
const clone = () => JSON.parse(JSON.stringify(G.defaults()));
const lines = (r) => r.script.split('\n').filter((l) => l && !l.startsWith('#'));
// quotes équilibrées une fois les \" retirés
const quotesOk = (l) => ((l.replace(/\\\\/g, '').replace(/\\"/g, '').match(/"/g) || []).length % 2) === 0;

console.log('Valeurs par défaut');
let r = G.generate(G.defaults());
ok('génération réussie', r.ok, r.errors.join(' | '));
ok('3 placeholders par défaut', r.placeholders.length === 3, r.placeholders.join(','));
ok('placeholders NON quotés', /password=<MOT_DE_PASSE_FORT>/.test(r.script) && !/"<MOT_DE_PASSE_FORT>"/.test(r.script));
ok('toutes les lignes ont des guillemets équilibrés', lines(r).every(quotesOk));
ok('vlan-filtering activé APRÈS la création des VLANs', r.script.indexOf('vlan-filtering=yes') > r.script.indexOf('/interface bridge vlan add'));
ok('« admin » désactivé EN DERNIER (après le pare-feu)', r.script.indexOf('/user set admin disabled=yes') > r.script.lastIndexOf('/ip firewall filter add'));
ok('untagged explicite sur les ports d\'accès', /vlan-ids=10 tagged=bridge-local,ether2 untagged=ether3/.test(r.script));
ok('wlan1 en untagged du VLAN Hotspot et pvid=20', /vlan-ids=20 tagged=bridge-local,ether2 untagged=ether4,wlan1/.test(r.script) && /interface=wlan1 pvid=20/.test(r.script));
ok('commentaires de règles identiques au guide', /comment="Accept ICMP"/.test(r.script) && /comment="Drop tout autre INPUT"/.test(r.script) && /comment="Drop forward non autorisé"/.test(r.script));
ok('services restreints au réseau d\'administration choisi', /ip service set winbox address=192\.168\.10\.0\/24/.test(r.script));

console.log('Injection et saisies hostiles');
const bad = (mut, name) => { const c = clone(); mut(c); const x = G.generate(c); ok(name, !x.ok && x.script === '', x.errors.join(' | ')); };
bad((c) => { c.host = 'X"; /system reset-configuration'; }, 'nom d\'hôte avec injection refusé');
bad((c) => { c.host = 'a b'; }, 'nom d\'hôte avec espace refusé');
bad((c) => { c.ssid = 'wifi"; /user remove [find]'; }, 'SSID avec injection refusé');
bad((c) => { c.adminUser = 'adm; /x'; }, 'utilisateur avec injection refusé');
bad((c) => { c.adminUser = 'admin'; }, 'utilisateur « admin » refusé');
bad((c) => { c.tz = 'Africa/Douala"; /x'; }, 'fuseau avec injection refusé');
bad((c) => { c.mgmtNet = '1.1.1.1/24"; /x'; }, 'réseau d\'administration invalide refusé');
bad((c) => { c.itGw = '192.168.10.1/16'; }, 'passerelle hors /24 refusée');
bad((c) => { c.itGw = '999.168.10.1/24'; }, 'octet > 255 refusé');
bad((c) => { c.hsGw = '192.168.10.5/24'; }, 'réseaux qui se chevauchent refusés');
bad((c) => { c.adminPass = 'court'; }, 'mot de passe admin trop court refusé');
bad((c) => { c.wifiKey = 'abc'; }, 'clé Wi-Fi trop courte refusée');
bad((c) => { c.adminPass = 'AbcdefghijkL\nsystem reset'; }, 'mot de passe avec saut de ligne refusé');
bad((c) => { c.mAntiBf = true; c.mFirewall = false; }, 'anti-brute force sans pare-feu refusé');
bad((c) => { c.wanMode = 'static'; c.wanIp = ''; c.wanGw = ''; }, 'WAN statique sans adresse refusé');
bad((c) => { c.ports.ether3 = 'x; /y'; }, 'rôle de port inconnu refusé');

console.log('Échappement des secrets');
let c = clone(); c.adminPass = 'Abc"def$ghi\\jkl?mno12'; c.wifiKey = 'k"$\\?clef-wifi'; c.hotspotUserPass = 'inv"ite$12345';
r = G.generate(c);
ok('génération avec caractères spéciaux', r.ok, r.errors.join(' | '));
ok('guillemets, $, \\ et ? échappés', r.script.includes('password="Abc\\"def\\$ghi\\\\jkl\\?mno12"'), (r.script.match(/password="[^\n]*/) || [])[0]);
ok('plus aucun placeholder', r.placeholders.length === 0);
ok('lignes toujours équilibrées', lines(r).every(quotesOk));

console.log('Variantes');
c = clone(); c.wanMode = 'static'; c.wanIp = '203.0.113.10/29'; c.wanGw = '203.0.113.9';
r = G.generate(c);
ok('WAN statique : adresse + route, pas de client DHCP', r.ok && /address=203\.0\.113\.10\/29 interface=ether1/.test(r.script) && /gateway=203\.0\.113\.9/.test(r.script) && !/dhcp-client add/.test(r.script));
c = clone(); c.mAntiBf = true; c.mDns = true; c.mNtp = true; r = G.generate(c);
ok('tous modules : succès', r.ok, r.errors.join(' | '));
ok('10 règles anti-brute force + liste blanche', (r.script.match(/comment="BF-/g) || []).length === 10 && /list=admin_whitelist/.test(r.script));
ok('règle « Accept ICMP » créée AVANT les place-before', r.script.indexOf('comment="Accept ICMP"') < r.script.indexOf('place-before=[find where comment="Accept ICMP"]'));
ok('DNS local : DHCP distribue le routeur', /dns-server=192\.168\.10\.1/.test(r.script) && /allow-remote-requests=yes/.test(r.script));
ok('sans DNS local : DHCP distribue 1.1.1.1,9.9.9.9', /dns-server=1\.1\.1\.1,9\.9\.9\.9/.test(G.generate(Object.assign(clone(), { mHarden: false })).script));
c = clone(); c.ports.ether5 = 'unused'; c.wifiOn = false; r = G.generate(c);
ok('port inutilisé hors bridge, sans Wi-Fi', !/interface=ether5/.test(r.script) && !/wlan1/.test(r.script));
c = clone(); c.mFirewall = false; c.mNtp = false; r = G.generate(c);
ok('sans pare-feu : aucune règle filter', r.ok && !/ip firewall filter add/.test(r.script));
console.log(fail ? `\n${fail} échec(s)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);

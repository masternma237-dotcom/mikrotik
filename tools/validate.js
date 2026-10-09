#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// Validation des données du guide — à lancer avant chaque commit :
//   node tools/validate.js
// Charge les mêmes fichiers que index.html (dans le même ordre) et
// contrôle la cohérence : ids, parcours, niveaux, glossaire, schémas,
// prérequis, placeholders, secrets en dur, équilibrage des blocs CLI.
// Code de sortie 1 si au moins une erreur.
// ═══════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// Le moteur (js/app.js) manipule le DOM : il n'est pas chargé ici.
const scripts = [...html.matchAll(/<script\s+src="((?:js|data)\/[^"]+)"/g)].map((m) => m[1]).filter((f) => f !== 'js/app.js');

const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of scripts) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
// renderDiagram() (js/diagrams.js) est utilisable sans DOM
const MK = ctx.MK;

let errors = 0, warns = 0;
const err = (m) => { errors++; console.log('  ✗ ' + m); };
const warn = (m) => { warns++; console.log('  ! ' + m); };

console.log(`Fichiers chargés (${scripts.length}) : ${scripts.join(', ')}`);
console.log(`Sections : ${MK.sections.length} · Termes de glossaire : ${Object.keys(MK.glossary).length}\n`);

const trackIds = MK.tracks.map((t) => t.id);
const ids = new Set(), steps = new Set();
const order = MK.sections
  .map((s, i) => ({ s, i }))
  .sort((a, b) => (trackIds.indexOf(a.s.track) - trackIds.indexOf(b.s.track)) || (a.i - b.i))
  .map((x) => x.s.id);

for (const s of MK.sections) {
  console.log(`[${s.step}] ${s.id}`);
  for (const k of ['id', 'title', 'icon', 'step', 'description']) if (!s[k]) err(`${s.id}: champ « ${k} » manquant`);
  if (ids.has(s.id)) err(`${s.id}: identifiant dupliqué`); ids.add(s.id);
  if (steps.has(s.step)) err(`${s.id}: numéro d'étape ${s.step} dupliqué`); steps.add(s.step);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) err(`${s.id}: l'identifiant doit être en kebab-case minuscule`);
  if (!trackIds.includes(s.track)) err(`${s.id}: parcours inconnu « ${s.track} »`);
  if (!MK.levels[s.level]) err(`${s.id}: niveau inconnu « ${s.level} »`);

  for (const t of s.terminology || []) if (!MK.glossary[t]) err(`${s.id}: terme sans définition « ${t} »`);

  if (s.diagram) {
    const out = ctx.renderDiagram(s.diagram, s);
    if (/\[Schéma:/.test(out)) err(`${s.id}: schéma « ${s.diagram} » introuvable`);
    else if (!/<svg/.test(out)) warn(`${s.id}: schéma « ${s.diagram} » sans SVG`);
  }

  if (s.tool && !(MK.tools && MK.tools[s.tool])) err(`${s.id}: outil « ${s.tool} » introuvable`);

  for (const r of s.requires || []) {
    if (!ids.has(r) && !MK.sections.some((x) => x.id === r)) err(`${s.id}: prérequis inconnu « ${r} »`);
    else if (order.indexOf(r) > order.indexOf(s.id)) warn(`${s.id}: le prérequis « ${r} » est placé APRÈS la section`);
  }

  // Textes rendus en HTML : un <PLACEHOLDER> brut serait avalé par le navigateur
  const htmlTexts = [s.description, ...(s.alerts || []).map((a) => a.text), ...(s.concepts || []).map((c) => c.term + ' ' + c.def), ...(s.winboxSteps || [])];
  if (s.table) htmlTexts.push(...s.table.headers, ...s.table.rows.flat());
  for (const h of htmlTexts) {
    const m = String(h).match(/<[A-Z_][A-Z0-9_]{2,}>/g);
    if (m) err(`${s.id}: placeholder HTML non échappé ${m.join(', ')} (utiliser &lt; &gt;)`);
  }
  if (/<[A-Za-z_]{3,}>/.test(s.description) || /&lt;/.test(s.description)) warn(`${s.id}: évitez les chevrons dans la description (réutilisée telle quelle par l'export PDF)`);

  (s.cliCommands || []).forEach((cmd, i) => {
    const tag = `${s.id} CLI#${i + 1}`;
    if (/\t/.test(cmd)) warn(`${tag}: tabulation (peut casser le collage dans un terminal)`);
    if (/\r/.test(cmd)) err(`${tag}: retour chariot Windows`);
    // équilibrage (hors commentaires et chaînes)
    const code = cmd.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
    const stripped = code.replace(/\\"/g, '').replace(/"[^"\n]*"/g, '""');
    const count = (re) => (stripped.match(re) || []).length;
    if (count(/\{/g) !== count(/\}/g)) err(`${tag}: accolades { } déséquilibrées`);
    if (count(/\[/g) !== count(/\]/g)) err(`${tag}: crochets [ ] déséquilibrés`);
    if (count(/\(/g) !== count(/\)/g)) err(`${tag}: parenthèses ( ) déséquilibrées`);
    if ((code.replace(/\\"/g, '').match(/"/g) || []).length % 2) err(`${tag}: nombre impair de guillemets`);
    // secrets en dur
    const pw = code.match(/password=(?!<|\$|"?<|"\$)[^\s\\]+/g);
    if (pw) err(`${tag}: mot de passe en dur ${pw.join(', ')}`);
    // continuation « \ » suivie d'une ligne vide
    if (/\\\n\s*\n/.test(cmd)) err(`${tag}: continuation « \\ » suivie d'une ligne vide`);
  });
}

// Banque de questions : cohérence et couverture
console.log('\nQuiz');
let nQ = 0;
for (const [sid, qs] of Object.entries(MK.quiz)) {
  if (!MK.sections.some((x) => x.id === sid)) err(`quiz : section inconnue « ${sid} »`);
  qs.forEach((q, i) => {
    nQ++;
    const tag = `quiz ${sid} #${i + 1}`;
    if (!Array.isArray(q) || q.length < 4) return err(`${tag}: format [question, options, index, explication] attendu`);
    const [text, opts, ans, why] = q;
    if (!text || typeof text !== 'string') err(`${tag}: question vide`);
    if (!Array.isArray(opts) || opts.length < 3 || opts.length > 5) err(`${tag}: 3 à 5 options attendues`);
    else {
      if (new Set(opts).size !== opts.length) err(`${tag}: options en double`);
      if (!Number.isInteger(ans) || ans < 0 || ans >= opts.length) err(`${tag}: index de bonne réponse invalide`);
    }
    if (!why || why.length < 15) err(`${tag}: explication manquante ou trop courte`);
  });
}
for (const s of MK.sections) {
  if (s.track === 'labs') continue;
  const n = (MK.quiz[s.id] || []).length;
  if (n < 2) err(`${s.id}: au moins 2 questions de quiz attendues (${n})`);
}
console.log(`  ${nQ} questions pour ${Object.keys(MK.quiz).length} sections`);

// Labs : liens internes et critères
for (const s of MK.sections) {
  for (const html of [...(s.steps || []), ...(s.checklist || [])]) {
    for (const m of String(html).matchAll(/href="#([^"]+)"/g)) {
      if (!MK.sections.some((x) => x.id === m[1])) err(`${s.id}: lien interne vers « #${m[1]} » introuvable`);
    }
  }
  if (s.track === 'labs' && s.tool == null && !(s.checklist && s.checklist.length)) err(`${s.id}: un lab doit avoir des critères de réussite`);
}

// Marque, PWA et mode hors ligne
console.log('\nMarque et mode hors ligne');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'site.webmanifest'), 'utf8'));
for (const ic of manifest.icons || []) if (!fs.existsSync(path.join(root, ic.src))) err(`manifeste : icône absente ${ic.src}`);
for (const m of html.matchAll(/(?:href|src)="(assets\/[^"]+)"/g)) if (!fs.existsSync(path.join(root, m[1]))) err(`index.html : fichier absent ${m[1]}`);
if (!/rel="manifest"/.test(html)) err('index.html : lien vers le manifeste absent');
if (!/rel="icon"/.test(html)) err('index.html : favicon absent');
const csp = (/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html) || [])[1] || '';
if (!csp) err('CSP : balise meta absente');
else if (/(^|;)\s*script-src[^;]*unsafe-inline/.test(csp)) err('CSP : unsafe-inline autorisé pour les scripts');
try { require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'build-sw.js'), '--check'], { stdio: 'pipe' }); console.log('  sw.js à jour'); }
catch (e) { err('sw.js périmé : lancez  node tools/build-sw.js'); }

// Le glossaire est rendu en HTML : un <PLACEHOLDER> brut y serait avalé par le navigateur
for (const [t, d] of Object.entries(MK.glossary)) {
  const m = String(d).match(/<[A-Z_][A-Z0-9_]{2,}>/g);
  if (m) err(`glossaire « ${t} » : placeholder HTML non échappé ${m.join(', ')}`);
}

// Définitions de glossaire orphelines (info)
const used = new Set(MK.sections.flatMap((s) => s.terminology || []));
const orphans = Object.keys(MK.glossary).filter((t) => !used.has(t));
if (orphans.length) console.log(`\nInfo : ${orphans.length} terme(s) défini(s) mais non référencé(s) : ${orphans.join(', ')}`);

console.log(`\nRésultat : ${errors} erreur(s), ${warns} avertissement(s)`);
process.exit(errors ? 1 : 0);

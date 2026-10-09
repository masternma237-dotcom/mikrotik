# Architecture — Guide Interactif MikroTik (v1.2)

Application 100 % statique (HTML/CSS/JS vanilla), sans build ni backend.

```
index.html              coquille HTML + CSP + ordre de chargement des scripts
css/styles.css          tous les styles (thèmes clair/sombre, responsive, print)
js/registry.js          registre global MK (parcours, niveaux, API d'enregistrement)  ← 1er chargé
data/*.js               contenu : sections, glossaire, schémas (un fichier par module)
js/diagrams.js          helpers SVG + schémas du parcours Socle
js/app.js               moteur : navigation, rendu, recherche, thème, export PDF       ← dernier chargé
tools/validate.js       contrôle de cohérence des données (node tools/validate.js)
```

## Ajouter une section

1. Choisir un parcours (`track`) parmi ceux de `MK.tracks` : `socle`, `securite`,
   `services`, `interconnexion`, `exploitation`.
2. Créer (ou compléter) un fichier `data/<parcours>.js` :

```js
(function () {
  const R = String.raw;               // blocs CLI : les « \ » RouterOS restent intacts
  MK.addSections([{
    id: "mon-module",                 // kebab-case, unique, STABLE (sert aux liens #id et à la progression)
    track: "services",
    level: "intermediaire",           // debutant | intermediaire | avance
    title: "Titre affiché",
    icon: "fa-solid fa-server",       // Font Awesome 6 (gratuit)
    step: "17",                       // numéro affiché, unique
    requires: ["firewall"],           // optionnel : ids de sections prérequises
    description: "Texte sans chevrons < >.",
    cliCommands: [ R`# 1. Titre\n/ip ...` ],
    winboxSteps: [ "<span class='wb-path'>IP → ...</span> → ..." ],
    diagram: "mon-schema",            // clé enregistrée via MK.addDiagrams
    terminology: ["Terme A"],         // doivent exister dans le glossaire
    concepts: [ { term: "...", def: "..." } ],
    alerts: [ { type: "warning|info|success", icon: "fa-triangle-exclamation", text: "..." } ],
    table: { headers: ["A", "B"], rows: [["1", "2"]] }
  }]);
})();
```

3. Ajouter les définitions : `MK.addGlossary({ "Terme A": "Définition." })`.
4. Ajouter le schéma : `MK.addDiagrams({ "mon-schema": () => \`<div class="diagram-placeholder"><svg …>…</svg><p>légende</p></div>\` })`
   (helpers : `svgBox`, `svgArrow`, `svgArrowRed`, `svgLine`).
5. Déclarer le fichier dans `index.html` (entre `registry.js` et `diagrams.js`/`app.js`).
6. Lancer `node tools/validate.js` — il doit afficher 0 erreur.

## Règles à respecter

- **Placeholders** : dans les blocs CLI, écrire `<MOT_DE_PASSE_FORT>` tel quel ; dans les
  textes HTML (alertes, concepts, tableaux) écrire `&lt;MOT_DE_PASSE_FORT&gt;`.
  Aucun mot de passe réel dans les exemples.
- **Description** : pas de chevrons (elle est réutilisée par l'export PDF).
- **Identifiants** : ne jamais renommer un `id` publié (la progression des apprenants y est liée).
- **Scripts** : aucun code inline ni `onclick=` (la CSP interdit `'unsafe-inline'` pour les scripts) ;
  utiliser `data-*` et la délégation d'événements dans `js/app.js`.
- **Ordre des parcours** : celui de `MK.tracks` ; à l'intérieur d'un parcours, l'ordre de chargement.

## Feuille de route (lots validés)

| Lot | Fichiers prévus | Contenu |
|---|---|---|
| v1.2 ✔ | `securite-*.js` | Safe Mode, anti-brute force, RAW, anti-scan/DoS, durcissement, sauvegarde auto |
| v1.3 ✔ | `services-*.js` | NAT avancé, DNS, NTP, DHCP avancé, QoS (simple queue + PCQ) |
| v1.4 | `interconnexion.js` | WireGuard, IPsec, failover / multi-WAN |
| v1.5 | `exploitation.js` | Logs / syslog, SNMP + Zabbix, API REST, générateur .rsc |
| v2.0 | plusieurs | Labs, quiz, mode hors ligne (service worker), OSPF/BGP, CAPsMAN |

# Guide Interactif MikroTik — CFP‑CMD

> Guide web de configuration MikroTik RouterOS 7 à destination des formateurs et
> étudiants en réseaux — version courante : **v2.1.0** (voir [CHANGELOG.md](CHANGELOG.md)).

## Table des matières
- [À propos du projet](#à-propos-du-projet)
- [Installation locale](#installation-locale)
- [Utilisation](#utilisation)
- [Structure du dépôt](#structure-du-dépôt)
- [Développement](#développement)
- [Outils et validation](#outils-et-validation)
- [Tests & assurance qualité](#tests--assurance-qualité)
- [Feuille de route](#feuille-de-route)
- [Contribution](#contribution)
- [Licence](#licence)

---

## À propos du projet

Application **web statique** (HTML/CSS/JS vanilla, sans framework ni backend) qui
enseigne la configuration d'équipements **MikroTik RouterOS 7**. Le contenu est
découpé en **parcours pédagogiques** :

- **Socle** — prise en main, bridge/VLAN, adressage, DHCP, routage, hotspot, pare‑feu.
- **Sécurité avancée** — filet de sécurité, anti‑brute force, firewall RAW, anti‑scan/DoS, durcissement, sauvegardes.
- **Services réseau** — NAT avancé, DNS local, NTP, DHCP avancé, QoS.
- **VPN & interconnexion** — WireGuard (accès distant et site‑à‑site), IPsec IKEv2, failover WAN, répartition de charge.
- **Exploitation & automatisation** — journalisation/syslog, alertes, supervision SNMPv3/Zabbix, API REST, générateur `.rsc`.
- **Labs & évaluation** — travaux pratiques guidés (CHR sur Proxmox VE) et quiz final.

Chaque **section** peut contenir : un énoncé, un bloc de commandes **CLI RouterOS**
(colorées par **highlight.js**), un **schéma SVG** maison, un glossaire contextuel,
des **prérequis** cliquables, un déroulé (`steps`) et des critères de réussite
cochables. Un moteur de **recherche**, des **quiz** de section et un **quiz final**
complètent le dispositif.

### Caractéristiques techniques
- **100 % statique** : sert aussi bien depuis un serveur web qu'en `file://`.
- **Progressive Web App** : installable (`site.webmanifest`) et fonctionnelle
  **hors ligne** grâce au service worker `sw.js` (généré par `tools/build-sw.js`).
- **Sécurité** : politique **CSP** stricte dans `index.html` (aucun script inline,
  `object-src 'none'`, `base-uri 'self'`). Aucun secret n'est codé en dur : les
  mots de passe et clés sont des **placeholders** explicites (`<MOT_DE_PASSE_FORT>`).
- **Aucune dépendance npm** : les seuls scripts Node servent à la validation et au
  build du service worker.

---

## Installation locale

### Prérequis
- Un serveur web capable de servir des fichiers statiques (**XAMPP**, `php -S`,
  `python -m http.server`, `npx serve`…).
- **Node.js** (facultatif) — uniquement pour exécuter les outils `tools/*.js`
  (validation, build du service worker, tests du générateur).
- **git** pour récupérer le dépôt.

### Étapes
```bash
# 1. Cloner le dépôt
git clone <url-du-dépôt>
cd formations/mikrotik

# 2. Servir le dossier (au choix)
php -S localhost:8000          # PHP intégré
# ou : python3 -m http.server 8000
# ou : npx serve .             # nécessite Node

# 3. (optionnel) Contrôler la cohérence des données
node tools/validate.js
```
Ouvrez ensuite `http://localhost:8000` (ou `…/index.html`).

> Le mode hors ligne (service worker) n'est actif qu'en **HTTPS** ou sur
> **localhost**, pas en `file://`. Ouvrir directement `index.html` fonctionne
> malgré tout, mais sans cache applicatif.


---

## Utilisation
- **Barre de recherche** (en‑tête) : recherche de commandes ou de concepts, avec
  échappement des caractères spéciaux de regex.
- **Navigation** : barre latérale par **parcours** repliables ; **filtre par niveau**
  (`Débutant`, `Intermédiaire`, `Avancé`).
- **Boutons de l'en‑tête** :
  - **Export PDF** (`#pdf-btn`) — génère une version imprimable du contenu courant.
  - **Thème sombre/clair** (`#theme-toggle`) — bascule persistance entre les palettes.
- **Glossaire** : panneau contextuel affiché **pour la section courante**
  (termes déclarés via `terminology`), et non au survol d'un mot.
- **Quiz** : deux questions par section (36 sections), options mélangées à chaque
  passage et explication après chaque réponse ; **quiz final** (section 40) avec
  tirage par parcours ou global (10/20/30 questions).
- **Progression** mémorisée par identifiant de section ; lien profond `#id` partageable.

---

## Structure du dépôt
```
.
├─ index.html            # Point d'entrée : structure, CSP, ordre de chargement
├─ site.webmanifest      # Manifeste PWA (nom, langue fr, couleurs)
├─ sw.js                 # Service worker GÉNÉRÉ (ne pas éditer à la main)
├─ css/
│  └─ styles.css         # Tous les styles (thèmes, responsive, print)
├─ js/
│  ├─ registry.js        # Registre global MK (source de vérité : MK.version)
│  ├─ app.js             # Moteur : rendu, navigation, recherche, thème, export PDF
│  ├─ diagrams.js        # Helpers SVG (svgBox, svgArrow…) + schémas Socle
│  ├─ quiz.js            # Moteur de quiz (section + final)
│  └─ tools/
│     └─ rsc-generator.js  # Outil interactif « générateur .rsc »
├─ data/                 # Contenu : un ou plusieurs fichiers par parcours
│  ├─ core.js            # Sections du parcours Socle
│  ├─ securite-*.js      # Sections « Sécurité avancée »
│  ├─ services-*.js      # Sections « Services réseau »
│  ├─ interconnexion-*.js# Sections « VPN & interconnexion »
│  ├─ exploitation-*.js  # Sections « Exploitation & automatisation »
│  ├─ labs.js            # Travaux pratiques + quiz final
│  ├─ glossary-*.js      # Définitions de glossaire
│  ├─ diagrams-*.js      # Schémas SVG (fonctions par section)
│  └─ quiz-*.js          # Banques de questions par parcours
├─ tools/                # Scripts Node (aucune dépendance externe)
│  ├─ validate.js        # Contrôle de cohérence des données (ids, liens, CSP…)
│  ├─ build-sw.js        # Génère / vérifie sw.js (--check)
│  └─ test-generator.js  # Tests du générateur .rsc (injection, échappement…)
├─ assets/               # Icônes réellement utilisées (favicon.ico, PNG 96/192/512…)
├─ favicon/              # Icônes brutes du lot fourni (favicon.svg lourd non utilisé)
├─ docs/                 # Documentation locale (non versionnée) : ARCHITECTURE, CDC…
├─ CHANGELOG.md          # Historique des versions
└─ README.md             # Vous êtes ici
```

---

## Développement

Le contenu est **déclaratif** : chaque fichier de `data/` s'enregistre dans le
registre global `MK` défini dans `js/registry.js`.

1. **Sections** : `MK.addSections([...])`. Chaque section possède un `id` unique,
   un `track` (parcours), un `level` (`debutant` / `intermediaire` / `avance`),
   et optionnellement `requires` (prérequis), `steps`, `checklist`, `tool`,
   `terminology`, `cli` (commandes).
2. **Schémas** : `MK.addDiagrams({ monSchema: (section) => \`<svg …>…</svg>\` })`.
   Ce sont des **SVG écrits à la main** (pas de Mermaid). Utilisez les helpers
   `svgBox()` / `svgArrow()` de `js/diagrams.js`.
3. **Glossaire** : `MK.addGlossary({ "Terme": "Définition" })` (fichier `glossary-*.js`).
4. **Quiz** : `MK.addQuiz({ sectionId: [ [question, [options], indexBonneRéponse, explication], … ] })`
   (fichier `quiz-*.js`).
5. **Outils interactifs** : `MK.addTool(id, { title, mount })` pour monter un outil
   (ex. `js/tools/rsc-generator.js`), référencé par le champ `tool` d'une section.
6. **UI / styles** : tout dans `css/styles.css`. Le JS reste en **vanilla** ;
   n'introduisez pas de framework sans justification.

Pour brancher un nouveau module de contenu : **1 fichier de données + 1 balise
`<script>`** dans `index.html`, sans toucher au moteur. La documentation
d'architecture détaillée est dans `docs/ARCHITECTURE.md`.

---

## Outils et validation

```bash
node tools/validate.js         # Cohérence des données (ids, parcours, niveaux,
                               # glossaire, prérequis, placeholders, CSP…)
node tools/build-sw.js         # (Re)génère sw.js
node tools/build-sw.js --check # Échoue si sw.js est périmé (utilisé par validate.js)
node tools/test-generator.js   # Tests du générateur .rsc (injection, ordre, échappement)
```

> Il n'y a **pas de `package.json`** et donc **pas de `npm install`** : ces scripts
> s'exécutent directement avec Node, sans dépendance à installer.

---

## Tests & assurance qualité
- **Validateur de données** (`tools/validate.js`) : doit afficher
  **0 erreur / 0 avertissement**. Il vérifie notamment l'absence de `unsafe-inline`
  pour les scripts dans la CSP et la présence des icônes référencées.
- **Tests navigateur** (manuels) : chargement de chaque module `data/*.js`, rendu
  des schémas SVG, moteur de recherche (dont caractères spéciaux), quiz de section
  et final, export PDF, bascule de thème, rechargement **hors ligne** depuis le cache.
- **Générateur `.rsc`** : injection de saisie hostile refusée, échappement des
  secrets, ordre des commandes, téléchargement/copie du script.
- **Avertissement** : les commandes ne sont **pas validées sur routeur réel** ;
  à tester en laboratoire (CHR sur Proxmox VE) avant diffusion aux apprenants.

---

## Feuille de route
Pistes issues des réserves documentées dans le CHANGELOG (non prioritaires) :
- **v2.x** — Valider les commandes sur **routeur réel / CHR** avant diffusion.
- **v2.x** — Épingler les **empreintes SRI** des assets CDN (Font Awesome, highlight.js).
- **v2.x** — Trancher le Wi-Fi rattaché au bridge **sans VLAN** (sections 03/04).
- **v2.x+** — Prise en charge d'**IPsec « road‑warrior »** (IKEv2 nomade), non couvert à ce jour.
- **CI** — industrialiser les contrôles navigateur et le validateur dans une intégration continue.

---

## Contribution
Les contributions sont bienvenues :
1. **Forkez** le dépôt.
2. Créez une branche dédiée (`feature/ajout-section-bgp`).
3. Respectez les conventions du projet (français, JS vanilla, contenu déclaratif,
   placeholders pour tout secret, pas de script inline). Voir `docs/ARCHITECTURE.md`.
4. Lancez `node tools/validate.js` (doit être à **0 erreur**) et, si vous modifiez
   des fichiers mis en cache, régénérez `sw.js` via `node tools/build-sw.js`.
5. Documentez le changement dans `CHANGELOG.md` et ouvrez une **Pull Request**
   décrivant précisément la modification.

---

## Licence

MIT License

Copyright (c) 2026 MASTER NMA

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.


# CHANGELOG — Guide Interactif de Configuration MikroTik (CFP-CMD)

Toutes les modifications notables de ce projet sont documentées ici.
Format inspiré de Keep a Changelog. Dates au format JJ/MM/AAAA.

## [1.3.0] — 07/10/2026 — Lot v1.3 « Services réseau »

### Contenu — 6 nouvelles sections (parcours « Services réseau »)
- 17 NAT avancé : dst-nat + règle FORWARD (connection-nat-state=dstnat), hairpin NAT,
  src-nat pour WAN statique, netmap (NAT 1:1), diagnostic ; alerte CGNAT (4G / radio).
- 18 DNS local : résolveur + cache, noms et alias locaux, redirection de domaine
  (type FWD, Active Directory), blocage par regexp, DNS forcé, blocage DoT, résolveur
  fermé au WAN (réactive allow-remote-requests désactivé en section 15).
- 19 NTP : client + serveur du LAN, option DHCP 42 (jeux d'options par VLAN),
  redirection NTP optionnelle, avertissement pour les machines de domaine.
- 20 DHCP avancé : réservations, options 66 et 121, alerte faux serveur DHCP,
  address-list des clients, ARP reply-only sur le VLAN IT, relais DHCP.
- 21 QoS : Simple Queues, hiérarchie parent/enfant, burst, priorités, débits par
  profil Hotspot.
- 22 QoS avancé : PCQ, marquage VoIP (mangle), Queue Tree en sortie WAN, FastTrack.
- 6 schémas SVG et 28 termes de glossaire associés (117 termes au total).

### Cohérence avec les lots précédents
- Les commandes réutilisent les objets existants : vlan10-IT / vlan20-Hotspot,
  dhcp-vlan10 / dhcp-vlan20, listes LAN/WAN (section 13), règles commentées
  « Drop tout autre INPUT » et « Drop forward non autorisé ».
- Chaque section déclare ses prérequis (`requires`) ; le validateur les contrôle.

### Tests
- Validateur : 0 erreur, 0 avertissement (23 sections).
- 41 contrôles navigateur (http:// et file://) rejoués, nombre de sections et de
  parcours désormais calculés dynamiquement.
- Non testé sur routeur réel : à valider en laboratoire (CHR sur Proxmox VE).
  Les exemples « fictifs » (vlan30-..., netmap, relais DHCP) sont signalés dans le texte.

## [1.2.0] — 07/10/2026 — Lot v1.2 « Sécurité avancée » + architecture modulaire

### Architecture (découpage annoncé dans le rapport d'étude)
- `index.html` (2197 lignes) découpé en : `css/styles.css`, `js/registry.js`,
  `js/app.js`, `js/diagrams.js` et `data/*.js` (un fichier par module).
- Nouveau registre `MK` : chaque fichier de données s'enregistre via
  `MK.addSections()`, `MK.addGlossary()`, `MK.addDiagrams()`. Ajouter un module =
  1 fichier + 1 balise `<script>`, sans toucher au moteur (voir docs/ARCHITECTURE.md).
- Nouveaux champs de section : `track` (parcours), `level` (débutant /
  intermédiaire / avancé), `requires` (prérequis cliquables).
- Barre latérale en parcours repliables + filtre par niveau ; badges parcours et
  niveau dans l'en-tête de section ; lien profond `#id` partageable.
- Progression mémorisée par IDENTIFIANT de section (et non plus par position) :
  l'ajout de modules ne décale plus la progression. Les anciennes valeurs
  numériques de la v1.0/1.1 sont migrées automatiquement à la lecture.
- Outil `tools/validate.js` : ids, parcours, niveaux, glossaire, schémas,
  prérequis, placeholders HTML, secrets en dur, équilibrage des blocs CLI.

### Contenu — 6 nouvelles sections (parcours « Sécurité avancée »)
- 11 Filet de sécurité : Safe Mode, backup + export, règles TEMP auto-supprimées.
- 12 Anti-brute force SSH & WinBox (paliers d'address-lists, liste blanche).
- 13 Firewall RAW : listes noires, drapeaux TCP invalides, anti-spoofing par VLAN,
  bogons WAN avec exception pour réseau amont privé (modem 4G / CGNAT).
- 14 Anti-scan de ports (PSD) & protection DoS (connection-limit, SYN cookies, limit).
- 15 Durcissement complet (MNDP, MAC-Server, UPnP, proxy, cloud, IPv6, groupe lecture
  seule, bannière, canal de mise à jour) + tableau d'audit.
- 16 Sauvegarde automatique : NTP, script RouterOS, envoi SFTP, suppression locale
  conditionnelle, planification, procédure de restauration.
- 6 schémas SVG et 28 termes de glossaire associés.

### Sécurité
- CSP : `'unsafe-inline'` RETIRÉ de `script-src` (plus aucun script ni
  gestionnaire `onclick` inline) → recommandation S2 du rapport d'étude traitée.

### Corrections de défauts hérités de la v1.1
- 21 termes de glossaire affichaient « Définition à venir » : définitions ajoutées.
- Le schéma « wifi » (section 03) était absent : schéma créé.
- Les placeholders `<MOT_DE_PASSE_FORT>` / `<CLE_WIFI_FORTE>` de l'alerte de la
  section 01 étaient avalés par le navigateur (balises inconnues) : échappés.
- Barre de progression : une section compte comme consultée dès son affichage.

### Tests
- Validateur de données : 0 erreur, 0 avertissement.
- 41 contrôles navigateur (Chromium, via http:// ET file://) : navigation des 17
  sections, filtres, prérequis, copie, recherche (dont caractères spéciaux), lien
  profond, export PDF, migration de l'ancien stockage, stockage désactivé,
  menu mobile, absence d'erreur JS et de violation CSP.
- Non testé : validation des commandes sur un routeur réel (à faire en laboratoire,
  idéalement sur CHR, avant diffusion aux apprenants).

## [1.1.0] — 07/10/2026 — Correctifs sécurité, robustesse, accessibilité

### Sécurité
- Remplacement des secrets en dur par des placeholders explicites :
  `password=S3cur3P@ss!2024` -> `password=<MOT_DE_PASSE_FORT>`,
  `wpa2-pre-shared-key="MotDePasse2024!"` -> `"<CLE_WIFI_FORTE>"`,
  `invite1/invite1` -> `invite-demo/<MOT_DE_PASSE_INVITE>`.
- Ajout d'un concept « Mot de passe fort » et d'une alerte placeholders
  dans la section Sécurisation.
- CSP durcie : ajout de `object-src 'none'` et `base-uri 'self'`,
  retrait de `fonts.googleapis.com` de `script-src` (non nécessaire).
- Export PDF : échappement HTML systématique via `escapeHtml()`.
- Recherche : snippet échappé avant surlignage `<mark>`.

### Robustesse
- Nouveau wrapper `safeStorage` (get/set avec try/catch) utilisé pour
  `mk-theme`, `mk-last-section`, `mk-visited` : plus de crash si le
  stockage est désactivé (navigation privée stricte).
- Recherche : nouvelle fonction `escapeRegExp()` — les requêtes contenant
  `[.*+?^${}()|[\]` ne provoquent plus d'exception.
- Export PDF : factorisation `buildExportHtml()` + fallback `window.print()`
  si la popup est bloquée, avec toast explicatif.

### Accessibilité
- Skip-link « Aller au contenu principal », `:focus-visible` orange.
- `aria-live="polite"` sur recherche et toasts, `aria-label` sur le champ
  de recherche, `aria-hidden` sur les icônes décoratives.
- Navigation clavier : Entrée/Espace + flèches Haut/Bas dans la sidebar,
  Échap ferme la sidebar et la recherche.
- Bouton « Retour en haut » affiché après 400px de scroll.

### Performance et dépendances
- `crossorigin="anonymous"` sur Font Awesome et Highlight.js (pré-requis SRI),
  script Highlight.js en `defer`.
- Highlight.js désormais réellement appelé via `highlightCli()` après chaque
  rendu, avec fallback silencieux si le CDN est indisponible.
- Blocs CLI : `<pre><code class="language-routeros">` pour la coloration.

### Documentation
- Création du présent CHANGELOG.
- À épingler : hashes SRI des 3 assets cdnjs après téléchargement local
  (connexion limitée lors de cette version — voir rapport).

## [1.0.0] — 07/10/2026 — Version initiale auditée
- SPA single-file (2098 lignes) : 11 sections Introduction → Validation,
  CLI RouterOS + WinBox + concepts + schémas SVG + glossaire (~35 termes).
- Recherche, thème persistant, progression, export PDF (print window),
  responsive 3 breakpoints, CSP via meta.
- Livrables : `index.html`, `prompt.md`, `CDC.md`, `RAPPORT_ETUDE_PROJET.md`.
- Tag Git : `v1.0`.

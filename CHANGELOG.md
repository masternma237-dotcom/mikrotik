# CHANGELOG — Guide Interactif de Configuration MikroTik (CFP-CMD)

Toutes les modifications notables de ce projet sont documentées ici.
Format inspiré de Keep a Changelog. Dates au format JJ/MM/AAAA.

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

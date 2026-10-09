# Rapport d'Etude Approfondie — Projet Guide Interactif MikroTik

> Projet : `mikrotik` — `/Applications/XAMPP/xamppfiles/htdocs/formations/mikrotik`
> Date : 07/10/2026 — Auteur etude : Muse Spark
> Perimetre : etude de fond en comble (code, docs, securite, qualite)

## 1. Resume executif

Le projet est une Single Page Application (SPA) 100 % front-end livree en
fichier unique `index.html` (~97 Ko, 2098 lignes). C'est un guide interactif
et pedagogique pour configurer un routeur MikroTik (RouterOS v7.x) etape par
etape : securisation, bridge, Wi-Fi, VLANs, adressage, DHCP, routage,
hotspot/anti-tethering, firewall, validation.

Chaque section presente : commandes CLI RouterOS copiables + equivalents
WinBox + concepts + schema SVG inline + glossaire contextuel.

Fonctions transverses : navigation SPA, recherche avec surlignage, theme
sombre/clair persistant, progression + historique, export PDF via impression,
responsive 3 breakpoints, CSP via meta.

Etat global : fonctionnel, coherent, visuellement abouti, fidele au
`prompt.md` a ~90 %. Points d'attention : `CDC.md` tronque, secrets en dur
dans les exemples CLI, CSP affaiblie par `unsafe-inline`, export PDF basique,
aucun test, depot Git sans commit.

## 2. Inventaire et cartographie

Arborescence reelle :

- `index.html` (2098 lignes, 97427 octets) — SPA complete
- `prompt.md` (215 lignes, 9108 octets) — spec de generation
- `CDC.md` (76 lignes, 2456 octets) — cahier des charges TRONQUE
- `.git/` — branche `main`, AUCUN commit, 3 fichiers untracked

Aucun dossier app/, config/, public/, aucun package.json, aucun CHANGELOG.md,
aucune dependance locale. Projet micro (~106 Kio), autonome.

Git : `git log` = fatal no commits yet. Risque de tracabilite.
Recommandation : `git add . && git commit -m "feat: guide MikroTik v1.0"`.

## 3. Documents de specification

### 3.1 prompt.md (reference la plus complete)

Bien redige, en francais. Impose : SPA vanilla JS sans framework, 100 %
front-end, 11 sections ordonnees, layout 5 zones (header + sidebar gauche +
centre + glossaire droit + footer), donnees en objet JS integre `appData`,
8 fonctions JS obligatoires (navigation, copie, recherche, theme, export PDF,
glossaire, progression, derniere section), responsive 1200/768/767, securite
front (CSP meta, sanitization, localStorage prefs uniquement, HTTPS),
Highlight.js, window.print() ou html2pdf.js, placeholders SVG, commentaires
par bloc, palette bleu/gris/orange, Font Awesome 6.

### 3.2 CDC.md (incomplet)

Ne contient que §1 (contexte, objectifs, public) + §2.1 (tableau
architecture) + debut §2.2 (Introduction + Prise en Main). S'interrompt
brutalement ligne 76 au milieu d'une phrase. Manquent : Bridge -> Validation,
exigences non-fonctionnelles, securite, responsive, livrables, planning.
A completer en reprenant prompt.md.
## 4. Analyse fonctionnelle — les 11 sections metier

Ordre logique de deploiement respecte. Schema par section : id, title, icon,
step, description, cliCommands[], winboxSteps[], diagram, terminology[],
concepts[], alerts[], table optionnelle.

- 00 introduction : objectifs, tableau prerequis (hAP ac2/RB3011/CCR,
  RouterOS v7.x, RJ45 Cat5e), acces 192.168.88.1 / admin sans mdp. 0 CLI.
- 01 securing : user add adm_network/full, disable admin, disable
  telnet,ftp,www,api, service set ssh/winbox address=192.168.88.0/24,
  strong-crypto, identity MK-CFP-CMD. 6 CLI / 6 WinBox. Alertes lock-out.
- 02 bridge : bridge-local + ether2-5, vlan-filtering=yes. 4 CLI / 5 WinBox.
  Concepts VLAN Filtering, STP.
- 03 wifi : profil wifi-secure WPA2-PSK, SSID CFP-CMD-WiFi (+ CFP-CMD-5G
  optionnel), ap-bridge, 2ghz-b/g/n, wlan1 vers bridge. 4 CLI / 6 WinBox.
- 04 vlans : VLAN10 IT + VLAN20 Hotspot sur bridge-local, vlan-id 10/20,
  PVID, tag 802.1Q 0x8100.
- 05 addressing : 192.168.10.1/24 sur vlan10-IT, 192.168.20.1/24 sur
  vlan20-Hotspot, ether1 DHCP client WAN. Table recap 3 lignes.
- 06 dhcp : pool-vlan10 .100-.200 lease 1d, pool-vlan20 .100-.250 lease 2h,
  networks + DNS 8.8.8.8/1.1.1.1. 7 CLI / 7 WinBox.
- 07 routing : 0.0.0.0/0 vers IP_GATEWAY_FAI, srcnat masquerade out=ether1.
  3 CLI / 5 WinBox. Alerte route auto si DHCP client.
- 08 hotspot : /ip hotspot setup sur vlan20, user invite1, http-chap, mangle
  ttl=less-than:2 mark=tethering, filter drop packet-mark=tethering.
  5 CLI / 7 WinBox.
- 09 firewall : INPUT (established accept, invalid drop, icmp accept,
  10.0/24 accept, reste drop) + FORWARD (established, VLAN10 vers all,
  VLAN20 vers VLAN10 drop, VLAN20 vers ether1 accept, reste drop).
  10 CLI / 8 WinBox. Alerte ordre des regles crucial.
- 10 validation : interface/vlan/address/route/lease/filter print,
  ping 8.8.8.8, /export, backup. 7 CLI / 6 WinBox. Table 6 tests attendus.

Plan d'adressage coherent : WAN ether1 (DHCP FAI), IT 192.168.10.0/24 GW .1,
Hotspot 192.168.20.0/24 GW .1. Pas de chevauchement, pools inclus, DNS
coherents. Chaque CLI est commentee (# 1. ...), multi-lignes avec backslash
RouterOS. WinBox avec pastilles .wb-path cyan.

## 5. Architecture technique

### 5.1 Parti architectural

Aucun framework, aucun build, aucun backend. HTML + CSS + vanilla JS ES6+
dans un seul fichier. Donnees (appData, glossaryData) en script inline.
CDN HTTPS uniquement : Google Fonts (Exo 2, JetBrains Mono, Barlow),
Font Awesome 6.5.0, Highlight.js 11.9.0 (charge mais jamais initialise via
hljs.highlightAll — coloration effective par CSS custom).
Rendu dynamique par template strings : buildNav(), renderSection(index),
renderDiagram(type), renderTable(table), updateGlossary(terms).

### 5.2 Layout et CSS (~940 lignes)

Variables :root + [data-theme=light] : base #08111f, surface #0d1e35,
accent orange #f39c12. Header fixe 60px + barre progression 3px. Grid
260px 1fr 240px. Sidebars sticky full-height, scrollbars custom.
Composants : .card, .cli-block (fond #060e1a, mono, bouton copie),
.winbox-steps (compteur bleu), .concept-box (bordure cyan), .alert-*,
.data-table, .nav-btns prev/next, .diagram-placeholder dashed, toasts,
footer. Print CSS masquant chrome et evitant coupures. Responsive conforme :
<=1199px glossaire masque + 2 col ; <=767px sidebar drawer + overlay +
header compact. Ecart mineur : pas d'accordeon explicite (drawer suffit).
Accessibilite partielle : role, aria-label, tabindex, Enter sur nav.
Manques : aria-live, skip-link, focus-visible.

### 5.3 Logique JS (lignes 1004-2085)

- DOMContentLoaded init : restaure theme / derniere section / visites,
  build nav, render, search, listeners mobile + theme.
- buildNav() : sidebar avec icone + badge step, pastille verte .visited.
- navigateTo(i) : persiste mk-last-section + mk-visited, re-render,
  scroll top.
- updateProgress() : pct = visited.size / 11.
- renderSection(i) : assemble header, alertes, subsections, concepts, CLI,
  WinBox, diagramme, table, boutons prev/next + bouton Termine.
- renderDiagram() + svgBox/Arrow/Line : 11 SVG inline (topologie
  WAN->MikroTik->VLANs->clients, flux firewall, hotspot, DHCP...).
- renderTable() : tableaux generiques (prerequis, adressage, tests).
- updateGlossary() : filtre glossaryData par terminology[] de section.
- copyCommand() / copyAllCommands() : Clipboard API + toast + fallback.
- setupSearch() / searchContent() : debounce 200ms, min 2 chars, max
  8 resultats, snippet <mark>, sanitization via sanitizeInput + escapeHtml.
- toggleTheme() : bascule data-theme, persiste mk-theme, icone lune/soleil.
- showToast() : notifications 2,5s.
- exportPDF() : window.open blank, injecte HTML formate (toutes CLI +
  WinBox), print() apres 500ms.
- Persistance : cles mk-theme, mk-last-section, mk-visited. Lecture visite
  protegee par try/catch, mais getItem init et toggleTheme non proteges :
  risque d'exception si storage bloque (navigation privee stricte).

### 5.4 Donnees et glossaire

appData.sections[11] : schema homogene, IDs kebab-case, steps "00"-"10".
Seule introduction a subsections[] + table prerequis ; addressing et
validation ont table recap/tests. glossaryData : ~35 termes (RouterOS,
WinBox, CLI, Bridge, VLAN, 802.1Q, PVID, CIDR, Gateway, DHCP lease/Pool,
NAT/Masquerade, TTL/Mangle/Tethering, Stateful, Portail captif, HTTP-CHAP,
DNS, FAI...). Riche et exact. Diagrammes : 11 SVG generes par code, zero
image externe -> 100 % offline hors CDN.

## 6. Securite — audit front-end

### 6.1 Points positifs

- CSP meta : default-src self https: data: ; script-src self unsafe-inline
  cdnjs/googleapis ; style-src idem ; font-src ; img-src self data:.
- Recherche sanitizee (sanitizeInput + escapeHtml), snippets echappes.
- rel=noopener noreferrer sur lien wiki.mikrotik.com.
- localStorage limite aux preferences, pas de donnees sensibles.
- Pas d'eval(), pas de backend donc pas d'injection SQL.

### 6.2 Vulnerabilites et correctifs

- S1 MOYENNE : mots de passe en dur dans exemples CLI
  (password=S3cur3P@ss!2024 ligne 1051, wpa2-pre-shared-key ligne 1110,
  invite1/invite1 ligne 1260). Risque : copier-coller vers routeur reel.
  Fix : placeholders <VOTRE_MDP_FORT> + encadre d'avertissement.
- S2 FAIBLE-MOYENNE : CSP avec unsafe-inline (scripts + styles inline
  indispensables ici). Fix : documenter ; a terme extraire JS/CSS + nonce,
  ajouter object-src none + base-uri self.
- S3 FAIBLE : localStorage non teste a l'init. Fix : wrapper safeStorage
  get/set avec try/catch global.
- S4 FAIBLE : window.open blank pour PDF bloque par bloqueurs popup.
  Fix : fallback window.print() in-page si popup null.
- S5 INFO : new RegExp(q, gi) sur requete non echappee -> erreur si [.*+.
  Fix : q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').
- S6 INFO : CDN sans integrity (SRI). Fix : ajouter integrity +
  crossorigin anonymous pour FA/HLJS.

## 7. Conformite prompt / realisation

- 11 sections ordonnees : OK (steps 00-10).
- CLI + WinBox + concepts + schemas : OK (intro sans CLI volontaire).
- Donnees en objet JS : OK (appData, glossaryData).
- Navigation dynamique : OK. Copie + feedback : OK. Recherche +
  surlignage : OK. Theme + persistance : OK.
- Export PDF avec CLI : PARTIEL (print window, pas html2pdf.js, pas de
  vrai binaire PDF).
- Glossaire contextuel : OK. Progression + derniere section : OK.
- Responsive 3 breakpoints : OK. CSP meta : OK. Sanitization : OK.
- HTTPS only : OK. Vanilla JS sans backend : OK.
- Highlight.js RouterOS : PARTIEL (lib chargee, jamais initialisee).
- Tailwind : non retenu, CSS custom (choix pertinent, plus autonome).
- Accessibilite clavier/ARIA : PARTIEL (tabindex, aria-label, mais pas de
  skip-link / aria-live / focus-visible).
- Robustesse localStorage desactive : PARTIEL (try/catch incomplet).
- Commentaires par bloc : OK (bandeaux === partout).
- Taux de conformite estime : ~90 %. Ecarts mineurs, aucun bloquant.

## 8. Qualite de code et UX

Forces : code lisible, nommage coherent (cliCommands, winboxSteps, mk-*),
fonctions courtes, design sombre pro (bleu nuit + orange), typos adaptees
(Exo 2 / Barlow / JetBrains Mono), feedbacks (toasts, pastilles visitees,
barre progression, prev/next), autonomie (SVG inline, zero asset local),
tables recap utiles.

Faiblesses : monolithe 2098 lignes (split styles.css / data.js / app.js
envisageable en restant statique) ; HLJS charge (~30 Ko) mais inutile ;
recherche limitee a 8 resultats sans nav clavier ; export PDF depend du
dialogue d'impression ; CDC.md tronque (dette doc) ; pas de CHANGELOG.md,
pas de tests, pas de logs centralises.

## 9. Tests et validation

Manuel requis : ouvrir via XAMPP (http://localhost/formations/mikrotik/)
et en file:// ; cliquer les 11 sections ; copier CLI ; recherche VLAN,
firewall, <script> (verifier pas d'injection) ; bascule theme + reload ;
progression 100 % ; export PDF (autoriser popup) ; responsive 375/768/1440 ;
clavier Tab+Enter ; localStorage bloque (verifier pas de crash). Console
sans erreur. Entrees invalides : recherche vide, 1 car, regex speciaux,
popup bloquee. Roles : N/A (guide public, pas d'auth).
## 10. Recommandations priorisees

P0 — Securite et docs (avant diffusion) :
1. Remplacer mots de passe d'exemple par placeholders + encadre.
2. Echapper la regex de recherche + wrapper safeStorage.
3. Completer CDC.md (reprendre prompt.md) + creer CHANGELOG.md v1.0.
4. Premier commit Git + tag v1.0.

P1 — Robustesse et accessibilite :
5. Fallback exportPDF si window.open null -> window.print() in-page.
6. SRI sur CDN, object-src none, base-uri self dans la CSP.
7. Skip-link, aria-live polite sur toasts/recherche, focus-visible.
8. Retirer ou initialiser HLJS (hljs.highlightAll()).

P2 — Evolutions (contexte camerounais/institutionnel) :
9. Split 3 fichiers + mode offline (service worker) pour salles sans net.
10. Fiche PDF avec en-tete CFP-CMD, prix en FCFA si kits, mentions
    MINEFOP/OHADA si formation certifiante.
11. Quiz QCM par section + bouton Exporter tout en .rsc.
12. Glossaire imprimable + version anglaise partielle (termes RouterOS).

## 11. Deploiement

Actuel XAMPP : http://localhost/formations/mikrotik/index.html — fonctionne
sans PHP/MySQL ni Composer. Statique pur : copiable sur Nginx/Proxmox VE
(/var/www/mikrotik/), GitHub Pages, ou cle USB. Aucune variable
d'environnement. Pre-requis client : navigateur moderne (Clipboard API ->
HTTPS ou localhost), autoriser popups pour export PDF, connexion initiale
pour CDN (ensuite cache). Prevoir fallback fonts systeme si offline.

## 12. Conclusion

Projet petit, propre, pedagogiquement solide et deployable immediatement.
L'autonomie (single-file), la coherence reseau (adressage/VLAN/DHCP/
firewall alignes) et l'UX (recherche, theme, progression, SVG) en font un
bon livrable de formation. Reserves : documentation inachevee, secrets
d'exemple et durcissement front mineur — corrigeables en moins d'1 jour.
Une fois les P0 traites + premier commit Git, le guide peut etre diffuse
aux apprenants CFP-CMD et servir de base a un module complet (quiz,
export .rsc, version offline).

— Fin du rapport —



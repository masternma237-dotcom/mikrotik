# Rapport d'Étude Complète — Guide Interactif MikroTik (CFP-CMD)

> Projet : `mikrotik` — `/Applications/XAMPP/xamppfiles/htdocs/formations/mikrotik`
> Date : 07/10/2026 — Auteur : Cline — Version auditée : v1.2.0
> Périmètre : fond en comble (code, données, sécurité, qualité, docs, Git, déploiement).

## 1. Résumé exécutif

SPA 100 % front-end en HTML/CSS/JS vanilla, sans framework, sans backend, sans build.
Guide pas-à-pas RouterOS v7.x : CLI copiable + équivalents WinBox + concepts +
schémas SVG inline + glossaire contextuel.

État global : **sain, cohérent, déployable**. La v1.2 fait passer le projet du
monolithe v1.0 (~2 100 lignes) à une architecture **modulaire** (registre `MK`),
durcie (CSP sans unsafe-inline en script-src, placeholders, safeStorage) et
outillée (`tools/validate.js`).

| Indicateur | Valeur |
|---|---|
| Sections | 17 (00-10 Socle + 11-16 Sécurité avancée) |
| Parcours définis / peuplés | 5 / 2 (`socle`, `securite`) |
| Glossaire | ~88 termes (60 socle + 28 sécurité) |
| Schémas SVG | ~17 (11 socle + 6 sécurité) |
| Code applicatif | ~3 435 lignes |
| Dépendances | 3 CDN (FA 6.5, HLJS 11.9, Google Fonts), SRI à épingler |
| Backend/BDD/Build | Aucun — statique pur |
| Git | 2 commits + tags v1.0/v1.1 ; **v1.2 non commitée** |

Points d'attention : valider les CLI sur labo réel, commiter/taguer v1.2,
épingler les SRI, dédupliquer `docs/` vs racine, compléter `CDC.md` (tronqué).

## 2. Inventaire et cartographie

```
mikrotik/
+-- index.html (128 l.) coquille SPA + CSP + ordre des scripts
+-- css/styles.css (1071 l.) themes, responsive, print
+-- js/registry.js (48 l.) registre MK, charge EN PREMIER
+-- js/diagrams.js (204 l.) SVG Socle + helpers svgBox/svgArrow
+-- js/app.js (694 l.) moteur : navigation, recherche, theme, PDF
+-- data/core.js (387 l.) sections 00-10 (Socle)
+-- data/securite-1.js (295 l.) sections 11-13
+-- data/securite-2.js (292 l.) sections 14-16
+-- data/glossary-core.js + glossary-securite.js (~88 termes)
+-- data/diagrams-core.js + diagrams-securite.js (~7 schemas ajoutes v1.2)
+-- tools/validate.js (97 l.) controle de coherence
+-- prompt.md / CDC.md (TRONQUE 76 l.) / ARCHITECTURE.md / CHANGELOG.md
+-- RAPPORT_ETUDE_PROJET.md (276 l., DECRIT v1.0 -> OBSOLETE)
+-- docs/ (doublon + mikrotik.zip) / favicon/ + favicon.zip (~964 Ko redondants)
```

| Dossier | Poids |
|---|---|
| data/ | 108 Ko |
| js/ | 56 Ko |
| css/ | 28 Ko |
| docs/ | 112 Ko |
| favicon/ + favicon.zip | ~964 Ko cumules (a alleger) |

Coeur utile HTML+CSS+JS+data : ~200 Ko + ~30 Ko HLJS via CDN.

## 3. Architecture technique

- Statique pur, sans build ni backend : file:// ou XAMPP/Nginx OK.
- Registre global MK (registry.js en premier) : tracks, levels, legacyIds,
  sections, glossary, diagrams + addSections/addGlossary/addDiagrams.
- Ajouter un module = 1 fichier data/*.js + 1 balise script, sans toucher au moteur.
- Ordre impose : registry.js -> data/*.js -> diagrams.js -> app.js.
- Section : id kebab-case stable, track, level, title, icon FA6, step,
  requires[] cliquables, description sans chevrons, cliCommands[] en String.raw,
  winboxSteps[], diagram, terminology[], concepts[], alerts[], table?, subsections?.
- Moteur app.js : safeStorage try/catch, tri par parcours, persistance par ID
  avec migration legacyIds, lien profond #id, nav repliable + filtre niveau,
  copie + tout-copier, recherche echappee (8 resultats + glossaire),
  theme persistant, toasts, retour-en-haut, export PDF avec fallback print,
  highlightCli avec fallback offline, escapeHtml/sanitizeInput/escapeRegExp.
- CSS 1071 lignes : variables dark/light, skip-link, focus-visible, print.
- SVG inline via helpers, role=img + aria-label sur schemas recents.
- validate.js : champs, unicite id/step, kebab-case, parcours/niveaux,
  glossaire, schemas, prerequis, placeholders, secrets en dur, equilbrage CLI.
  node indisponible sur la machine d'audit -> a relancer avant chaque commit.

## 4. Analyse fonctionnelle — les 17 sections

Plan reseau coherent : VLAN10 192.168.10.0/24, VLAN20 192.168.20.0/24,
WAN en DHCP sur ether1, PVID/tagging, pools DHCP, NAT masquerade.

- 00 introduction (socle/debutant) : objectifs, prerequis hAP ac2/RB3011/CCR
  RouterOS v7.x, acces 192.168.88.1/admin sans mdp. 0 CLI.
- 01 securing : adm_network + placeholder, disable admin, services coupes,
  SSH/WinBox restreints, strong-crypto, identite. Anti-lockout documente.
- 02 bridge : bridge-local + ether2-5, vlan-filtering=yes.
- 03 wifi : WPA2-PSK/AES + placeholder CLE_WIFI_FORTE, wlan1 ap-bridge.
  Schema ajoute en v1.2 (trou v1.1 corrige).
- 04 vlans : vlan10-IT / vlan20-Hotspot, tagging, PVID ether3/ether4.
- 05 addressing : .1/24 par VLAN, DHCP-client WAN, tableau recap.
- 06 dhcp : pools + serveurs par VLAN, lease times differencies.
- 07 routing : route par defaut vers gateway FAI.
- 08 hotspot (intermediaire) : serveur sur VLAN20, invite-demo + placeholder,
  anti-tethering TTL/mangle.
- 09 firewall (intermediaire) : INPUT + FORWARD (VLAN10->tout, VLAN20->WAN).
- 10 validation : checklist ping/DHCP/firewall/logs, export, tableau de tests.
- 11 safemode (securite/debutant, requiert securing) : Safe Mode Ctrl+X,
  backup+export prealables, regles TEMP- auto-supprimees, restauration.
- 12 bruteforce (intermediaire) : paliers address-lists SSH/WinBox + whitelist.
- 13 raw-firewall (avance) : RAW prerouting, listes noires, flags TCP,
  anti-spoofing + regle DHCP Discover, bogons WAN avec garde-fou IP privee.
- 14 scan-dos (avance, requiert bruteforce+raw) : PSD, connection-limit,
  SYN cookies, limit ICMP, logs, test labo + deblocage (203.0.113.50 TEST-NET).
- 15 durcissement (avance) : MNDP, MAC-Server, UPnP, proxy, cloud, IPv6,
  groupe lecture seule, banniere, canal long-term + tableau audit.
- 16 backup-auto (intermediaire) : NTP Africa/Douala, script backup-auto,
  envoi SFTP, suppression locale conditionnelle, scheduler 02h00, regle 3-2-1.

## 5. Securite front-end

### 5.1 Points forts
- Zero secret en dur : password= uniquement placeholders ou variables RouterOS.
- CSP : script-src self + cdnjs SANS unsafe-inline ; object-src none ; base-uri self.
- XSS : escapeHtml + sanitizeInput + escapeRegExp sur entrees utilisateur.
- safeStorage try/catch (mk-theme, mk-last-section, mk-visited, mk-level...).
- Export PDF echappe + strip balises WinBox. Placeholders HTML echappes.
- crossorigin=anonymous sur CDN, HLJS en defer.

### 5.2 Risques residuels (signalement explicite)
1. innerHTML avec contenu data/*.js non echappe (winboxSteps, concepts, alerts,
   tables) : sur TANT QUE fichiers dignes de confiance. Contribution tierce non
   relue = XSS persistant possible. Recommandation : liste blanche de balises
   ou controle etendu dans validate.js. Critique si externe, mineur en interne.
2. style-src garde unsafe-inline (attributs style generes) : documente, a migrer
   vers classes CSS a terme.
3. SRI non epingle sur 3 assets cdnjs : compromission CDN = execution tierce.
4. Fallback execCommand copy deprecie (fonctionne, a moderniser si besoin).
5. Pas d'auth/roles : sans objet (guide public statique).
6. .gitignore : .DS_Store et favicon.zip non ignores.
- Aucune SQLi/CSRF : pas de backend, pas de formulaires serveur, pas de cookies.

## 6. Qualite, conformite, Git, deploiement

Forces : nommage coherent, fonctions courtes commentees en francais,
registre extensible, design dark/light pro, SVG autonomes, tableaux recap,
accessibilite reelle (skip-link, aria-live, focus-visible, clavier).
Faiblesses : docs/ duplique la racine + mikrotik.zip (divergence) ;
RAPPORT_ETUDE_PROJET.md obsolete (v1.0) ; CDC.md tronque (76 l.) ;
export PDF minimal (sans tables/glossaire/schemas) ; recherche 8 resultats
sans nav clavier ; HLJS language-routeros generique ; favicon.zip + docs zip
poids mort ; .DS_Store versionne ; copyAllCommands a verifier de bout en bout ;
CLI non rejoues sur equipement reel (CHR/labo) avant diffusion.

Conformite prompt.md : ~95 %. SPA vanilla OK, 11 sections socle OK,
CLI+WinBox+concepts+schemas OK, layout 5 zones OK, recherche/theme/progression
+PDF+copie OK, responsive OK, CSP/sanitization/localStorage/HTTPS OK,
FA6 + HLJS + placeholders OK, commentaires OK, accessibilite OK.
Ecarts mineurs : SRI, nav clavier recherche, export minimal.

Git : main, 2 commits + tags v1.0/v1.1. Travail v1.2 ENTIEREMENT hors Git
(modifies : CHANGELOG, index.html ; non suivis : css/, data/, js/, tools/,
ARCHITECTURE.md, .gitignore, favicon/). Action : add cible, commit, tag v1.2.

Deploiement : XAMPP http://localhost/formations/mikrotik/ OK sans PHP/MySQL.
Cibles : Nginx/Proxmox /var/www/mikrotik/, Pages, cle USB (file:// OK).
Pre-requis : navigateur moderne (Clipboard -> HTTPS/localhost), popups PDF,
connexion initiale CDN. NTP Africa/Douala pertinent (contexte camerounais).

## 7. Tests

- Automatise : tools/validate.js annonce 0 erreur (a relancer, node absent ici).
- Manuel revendique (41 controles Chromium http:// et file://) : 17 sections,
  filtres, prerequis, copie, recherche speciale, lien #id, export, migration
  ancien stockage, stockage desactive, mobile, zero erreur JS/CSP.
- Restent : rejouer CLI sur CHR/labo, Firefox/Safari, lecteur ecran,
  impression papier, copyAllCommands bout en bout.
- Entrees invalides couvertes : recherche vide/regex, popup bloquee,
  localStorage corrompu/desactive. Roles : sans objet (public, pas d'auth).

## 8. Recommandations

P0 avant diffusion : 1) rejouer les CLI sur labo CHR/physique ; 2) commiter
+ taguer v1.2 (nettoyer .DS_Store, zips) ; 3) epingler SRI des 3 CDN
(puis vendoring locale pour salles offline) ; 4) verifier copyAllCommands.
P1 : 5) liste blanche balises HTML dans validate.js ; 6) completer CDC.md,
archiver l'ancien rapport, dedupliquer docs/ ; 7) classes CSS vs style inline ;
8) export PDF enrichi + nav clavier recherche.
P2 roadmap : v1.3 services (NAT, DNS, NTP, DHCP, QoS), v1.4 interconnexion
(WireGuard, IPsec, failover), v1.5 exploitation (logs, SNMP/Zabbix, API, .rsc),
v2.0 labs, quiz, offline, OSPF/BGP, CAPsMAN.

## 9. Conclusion

De prototype monolithique (v1.0) a base modulaire durcie et outillee (v1.2).
Bon livrable CFP-CMD, deployable immediatement en statique. Reserves
corrigeables en moins d'un jour : labo reel, commit/tag, SRI, dedup docs.

— Fin du rapport —

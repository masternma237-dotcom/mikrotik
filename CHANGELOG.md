# CHANGELOG — Guide Interactif de Configuration MikroTik (CFP-CMD)

Toutes les modifications notables de ce projet sont documentées ici.
Format inspiré de Keep a Changelog. Dates au format JJ/MM/AAAA.

## [2.1.0] — 10/11/2026 — Version de fonctionnalité : splash screen de démarrage

### Interface
- **Splash screen de démarrage (~8 s)** : logo animé (apparition échelonnée, halo pulsé, anneau),
  titre, version complète (v2.1.0), barre de progression et fondu de sortie. Passage anticipé par
  clic, Entrée, Espace ou Échap. Masquage garanti par CSS même sans JavaScript ; animations
  décoratives neutralisées en `prefers-reduced-motion` ; aucun nouveau fichier → pré-cache
  du service worker inchangé.

## [2.0.1] — 09/10/2026 — Version corrective du contenu hérité (sections 01 à 10)

Les défauts signalés lors des lots précédents sont corrigés dans les sections concernées.

### Corrections de fond
- **08 Hotspot — détection du tethering** : le test `ttl=less-than:2` ne détectait rien (les clients
  arrivent avec un TTL de 64 ou 128). Remplacé par deux règles `ttl=equal:63` et `ttl=equal:127`
  (appareil derrière un téléphone), plus une étape d'étalonnage par compteurs, et une alerte sur les
  limites de la méthode (faux positifs, TTL modifiable, appareils à TTL d'origine différent).
- **01 Sécurisation — verrouillage** : SSH/WinBox n'étaient autorisés que depuis 192.168.88.0/24 alors que
  l'administration se fait ensuite depuis 192.168.10.0/24. Les deux réseaux sont autorisés, et la
  section 10 resserre la liste à la fin (règle transitoire du pare-feu supprimée en même temps).
- **03 et 04 Wi-Fi / VLAN** : wlan1 était dans le VLAN natif 1, sans adresse ni DHCP. Il est maintenant
  rattaché au VLAN 20 (`pvid=20`, untagged du VLAN 20) ; la section 04 déclare explicitement les ports untagged.
- **02 et 04 VLAN filtering** : activé dès la section 02, avant la création des VLANs. Reporté en DERNIER à
  la section 04 (en Safe Mode), avec une alerte sur le branchement du poste d'administration.
- **05, 07, 09 liste WAN** : le masquerade et la règle Hotspot étaient liés à `ether1`. Les listes LAN et
  WAN sont créées à la section 05 ; NAT et pare-feu utilisent `out-interface-list=WAN` (le Hotspot garde
  Internet après une bascule sur un second lien). Sections 13 et 26 adaptées.
- **09 Pare-feu** : règle transitoire « Admin transitoire reseau usine » pour ne pas se couper l'accès
  avant le passage sur le VLAN IT (supprimée à la section 10).
- **03 Wi-Fi** : le placeholder de la clé WPA2 était entre guillemets (il serait devenu la vraie clé) ;
  il est désormais non quoté, comme les autres secrets.
- **10 Validation** : `/export file=backup-cfp-cmd-$(date)` n'est pas une syntaxe RouterOS ; corrigé.

### Cohérence
- Quiz et glossaire alignés (VLAN filtering « en dernier », masquerade sur la sortie WAN).
- Section 23 : commentaire sur la liste d'adresses des services mis à jour.

### Tests
- Validateur : 0 erreur ; générateur : 42 contrôles ; navigateur : 65 contrôles réussis (le contrôle de la version dans l'export PDF suit désormais 2.0.1).
- Non testé sur routeur réel : à valider en laboratoire (CHR), en priorité les sections 03 à 04 (ordre
  d'activation du VLAN filtering) et 08 (étalonnage du TTL).

## [2.0.0] — 08/10/2026 — Lot v2.0 « Labs, évaluation, hors ligne, marque »

### Marque et application installable
- Logo (photo du routeur) dans l'en-tête, favicon (.ico et PNG 96), apple-touch-icon et icônes
  192/512 intégrés depuis favicon.zip (dossier assets/), logo aussi dans l'export PDF.
- Manifeste `site.webmanifest` réécrit (nom, langue, chemins relatifs, couleurs du guide) :
  le guide s'installe comme application. Le fichier d'origine contenait des valeurs génériques
  (« MyWebSite ») et des chemins absolus « /… ».
- `favicon.svg` du lot fourni NON utilisé : c'est une image PNG de 240 Ko encapsulée dans un SVG,
  plus lourde que les PNG et non vectorielle.

### Mode hors ligne
- Service worker `sw.js` GÉNÉRÉ par `tools/build-sw.js` (liste de pré-cache et version issues
  de index.html et de MK.version ; `--check` utilisé par le validateur).
- Fichiers du guide : cache d'abord, mise à jour en arrière-plan ; polices, icônes et coloration
  externes mises en cache à la première utilisation. Actif en HTTPS ou sur localhost (pas en file://).
- Notifications « hors ligne » et « connexion rétablie ».

### Évaluation
- Quiz de section (2 questions × 36 sections = 72), options mélangées à chaque passage,
  explication après chaque réponse, meilleur score mémorisé. Textes affichés par textContent.
- Quiz final (section 40) : tirage par parcours ou global (10/20/30 questions), liste des
  sections à revoir avec liens directs.

### Contenu — 8 nouvelles sections
- 33 OSPF entre sites (loopback, zone 0, interfaces passives, authentification sha256, adresses
  multicast autorisées dans WireGuard, route statique de secours).
- 34 Introduction à BGP (eBGP en laboratoire, annonces explicites, mises en garde sur les filtres).
- 35 CAPsMAN (port hybride, sécurité, datapath avec VLAN, provisionnement, borne).
- 36 à 39 Labs : préparer CHR sur Proxmox VE ; lab 1 centre de formation ; lab 2 deux sites,
  VPN et bascule ; lab 3 exploitation et supervision. Chaque lab : scénario, déroulé avec liens
  vers les sections, vérifications et critères de réussite cochables (mémorisés).
- 40 Quiz final.
- Nouveau parcours « Labs & évaluation » ; 7 schémas SVG ; 24 termes de glossaire (188 au total).

### Moteur
- Champs de section `steps` (déroulé) et `checklist` (critères mémorisés dans mk-checks), banque
  `MK.quiz` / `MK.addQuiz()`, outil `quiz-final`.
- Export PDF : déroulé et critères inclus.

### Correction
- Le compteur de critères de réussite ne se mettait pas à jour à la case cochée (détecté par les
  tests navigateur) : corrigé.

### Réserves explicites sur le contenu
- BGP et CAPsMAN : la syntaxe RouterOS 7 évolue entre versions ; les commandes sont signalées
  comme à vérifier avec « ? » sur la version utilisée. À valider en laboratoire avant diffusion.
- CAPsMAN suit le paquet « wireless » (série hAP ac), pas le paquet « wifi ».
- Les licences CHR gratuites plafonnent le débit : les labs valident les configurations, pas les performances.

### Tests
- Validateur : 0 erreur (41 sections, 72 questions, liens internes des labs, manifeste, icônes,
  sw.js à jour, CSP sans unsafe-inline pour les scripts).
- 65 contrôles navigateur : logo, favicon et manifeste, quiz de section et final, labs (critères,
  liens), rechargement HORS LIGNE depuis le cache, plus l'ensemble des contrôles précédents.
- Générateur .rsc : 42 contrôles.
- Non testé sur routeur réel.

## [1.5.0] — 08/10/2026 — Lot v1.5 « Exploitation & automatisation »

### Contenu — 5 nouvelles sections (parcours « Exploitation & automatisation »)
- 28 Journalisation & syslog : tampon mémoire, journalisation des rejets avec limitation
  de débit, action syslog distante, une règle par sujet, serveur rsyslog + logrotate.
- 29 Alertes : e-mail depuis le routeur, Netwatch, rapport de sécurité quotidien
  (listes de blocage, rejets), notification par bot de messagerie. Complète la section 16.
- 30 Supervision SNMPv3 & Zabbix : communauté authPriv, suppression de « public »,
  port 161 limité au serveur, déclaration de l'hôte Zabbix, indicateurs et seuils.
- 31 API REST RouterOS 7 : certificat, www-ssl restreint, compte de service en lecture
  seule, exemples curl et Python, correspondance méthodes HTTP / commandes CLI.
- 32 Générateur de configuration .rsc : OUTIL INTERACTIF (voir ci-dessous).
- 4 schémas SVG et 21 termes de glossaire associés (164 termes au total).

### Moteur
- Nouveau champ de section `tool` + registre `MK.addTool()` : une section peut héberger
  un outil interactif monté après le rendu (js/tools/*.js).
- Générateur .rsc (js/tools/rsc-generator.js) : plan d'adressage, rôle de chaque port,
  Wi-Fi, WAN DHCP ou statique, et modules facultatifs (pare-feu, Hotspot, anti-brute
  force, durcissement, DNS local, NTP). Mêmes noms d'objets et mêmes commentaires de
  règles que le guide, donc les commandes `place-before=[find …]` des autres sections
  continuent de fonctionner sur le script généré.
- Sécurité du générateur : 100 % local (aucun réseau, aucun stockage) ; champs texte
  validés par liste blanche ; secrets échappés ; secret vide = placeholder NON quoté
  (la ligne échoue à l'import au lieu de créer un mot de passe faible littéral) ;
  « admin » désactivé en tout dernier ; VLAN filtering activé après la création des VLANs.
- `tools/test-generator.js` : 42 contrôles (injection, échappement, ordre, variantes).
- `tools/validate.js` : vérifie aussi l'existence de l'outil référencé et les
  placeholders bruts dans le glossaire.

### Correction
- Glossaire : une définition du lot v1.5 contenait un placeholder brut (invisible à
  l'affichage) ; le validateur contrôle désormais ce cas.

### Constat sur le contenu hérité (non modifié)
- Section 04 : le Wi-Fi (wlan1) est ajouté au bridge sans VLAN (PVID par défaut = 1) ;
  les clients Wi-Fi n'obtiendraient donc pas d'adresse DHCP. Le générateur rattache
  explicitement le Wi-Fi à un VLAN. À trancher pour les sections 03/04.

### Tests
- Validateur : 0 erreur, 0 avertissement (33 sections).
- 49 contrôles navigateur (http:// et file://), dont le générateur : sortie par défaut,
  saisie hostile refusée, modules, WAN statique, téléchargement .rsc, copie.
- Non testé sur routeur réel : à valider en laboratoire (CHR sur Proxmox VE).

## [1.4.0] — 07/10/2026 — Lot v1.4 « VPN & interconnexion »

### Contenu — 5 nouvelles sections (parcours « VPN & interconnexion »)
- 23 WireGuard : accès distant (interface, pairs, pare-feu restreint, fichier client,
  DDNS optionnel) — SSH/WinBox restent inaccessibles depuis Internet.
- 24 Interconnexion de deux sites avec WireGuard : plan d'adressage, commandes pour
  chaque extrémité, routes, keepalive, MSS clamping, tests de bout en bout.
- 25 IPsec IKEv2 site-à-site : profil, proposition, pair, identité, politique ;
  exceptions NAT, pare-feu et RAW (bogons) pour le trafic déchiffré.
- 26 Failover WAN : WAN2 sur ether5, routes récursives surveillées par ping,
  NAT/pare-feu par liste WAN, journalisation Netwatch, simulation de panne.
- 27 Répartition de charge multi-WAN : PCC (both-addresses), tables de routage,
  retour symétrique, secours croisé, variantes pondérée et ECMP.
- 5 schémas SVG et 26 termes de glossaire associés (143 termes au total).

### Incohérences héritées de la v1.1 corrigées dans les nouvelles sections
- Section 01 : SSH et WinBox limités à 192.168.88.0/24, alors que l'administration se
  fait ensuite depuis 192.168.10.0/24 (risque de verrouillage) → corrigé à la section 23
  (liste d'adresses des services). La section 01 elle-même n'a PAS été modifiée.
- Sections 07 et 09 : masquerade et règle Hotspot liées à ether1 uniquement → passage
  à la liste d'interfaces WAN à la section 26 (sans cela, plus d'Internet pour le
  Hotspot après une bascule sur le second lien).

### Limites assumées
- IPsec « road-warrior » (IKEv2 nomade, certificats/EAP) non traité : WireGuard couvre
  l'accès distant ; module éventuel ultérieur.
- Les sections 26 et 27 supposent des passerelles WAN connues et stables
  (placeholders <GW_WAN1> / <GW_WAN2>).
- Site distant 192.168.40.0/24 fictif, à adapter.

### Tests
- Validateur : 0 erreur, 0 avertissement (28 sections).
- 41 contrôles navigateur (http:// et file://) : navigation, filtres, prérequis, copie,
  recherche, lien profond, export PDF, migration du stockage, stockage désactivé, mobile.
- Non testé sur routeurs réels : à valider en laboratoire (deux CHR sur Proxmox VE avec
  un WAN simulé), en particulier IPsec, le routage récursif et le PCC.

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

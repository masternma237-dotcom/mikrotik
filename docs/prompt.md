---

# Prompt de Génération
## Application Web : Guide Interactif de Configuration MikroTik

---

### Rôle et Contexte

Tu es un développeur full-stack front-end spécialisé dans la création d’applications web éducatives et techniques. Tu dois générer une application web complète, autonome et prête à l’emploi, servant de guide interactif pour la configuration d’un routeur MikroTik.

L’application doit être livrée sous la forme d’un fichier HTML unique (ou d’un ensemble de fichiers organisés) intégrant HTML5, CSS3 et JavaScript (ES6+). Elle doit être responsive, accessible et suivre scrupuleusement le cahier des charges fourni.

---

### Objectif Général

Créer une **Single Page Application (SPA)** qui guide l’utilisateur pas à pas dans la configuration d’un routeur MikroTik, en présentant :

- Les commandes en ligne de commande (CLI RouterOS)
- Les étapes équivalentes sous WinBox (interface graphique)
- Les explications des concepts et terminologies
- Des schémas/illustrations (placeholders ou intégrés)

L’utilisateur doit pouvoir naviguer librement entre les sections, copier les commandes, rechercher du contenu, basculer en mode sombre/clair, et exporter une fiche synthétique au format PDF.

---

### Structure de l’Application

#### Organisation des Sections

L’application doit présenter les sections suivantes dans l’ordre logique :

1. **Introduction** : Objectifs, prérequis matériels/logiciels, accès initial au routeur.
2. **Prise en Main et Sécurisation** : Connexion initiale, création utilisateur, désactivation de `admin`, limitation des services SSH/Winbox.
3. **Bridge et Assignation des Ports** : Création du bridge, ajout des interfaces physiques.
4. **Configuration Wi-Fi** : Profil de sécurité (WPA2-PSK), interface physique (SSID, fréquence, mode AP), rattachement au bridge.
5. **VLANs** : Création VLAN10 (IT) et VLAN20 (Hotspot) sur le bridge.
6. **Adressage IP** : Attribution des adresses IP aux interfaces VLAN.
7. **DHCP** : Configuration des pools DHCP et des serveurs pour chaque VLAN.
8. **Routage** : Route par défaut vers le WAN.
9. **Hotspot et Blocage du Partage de Connexion** : Configuration du serveur Hotspot sur VLAN20, blocage du tethering par TTL.
10. **Pare-feu (Firewall)** : Règles INPUT (protection routeur) et FORWARD (VLAN10 → tout, VLAN20 → WAN uniquement).
11. **Validation et Tests** : Vérifications, tests de connectivité, dépannage courant.

#### Mise en Page

L’interface doit comporter :

| Zone | Contenu |
|------|--------|
| **En-tête** | Titre de l’application, bouton mode sombre/clair, bouton export PDF, champ de recherche |
| **Panneau latéral gauche** | Sommaire arborescent des sections avec ancres de navigation |
| **Panneau central** | Contenu principal : explications, blocs CLI, instructions WinBox, schémas |
| **Panneau latéral droit** | Glossaire contextuel (termes liés à la section visible) |
| **Footer** | Version, mentions légales, lien vers documentation officielle MikroTik |

---

### Spécifications Techniques

#### Technologies à Utiliser

- **HTML5** : Structure sémantique
- **CSS3** : Layout avec Flexbox/Grid, animations, thèmes clair/sombre
- **JavaScript ES6+** : Interactivité, gestion DOM, stockage local, recherche, export PDF
- **Tailwind CSS** (recommandé) ou CSS personnalisé pour le responsive
- **Font Awesome 6** (CDN) pour les icônes
- **Highlight.js** ou **Prism.js** pour la coloration syntaxique des blocs RouterOS

#### Contenu Dynamique

Le contenu textuel, les commandes CLI, les instructions WinBox et les termes de glossaire doivent être stockés dans un **objet JavaScript** ou un fichier **JSON intégré** pour faciliter la maintenance. Exemple de structure :

```javascript
const appData = {
  sections: [
    {
      id: "securing",
      title: "Prise en main et sécurisation",
      order: 1,
      description: "Description textuelle...",
      cliCommands: [
        "/user add name=adm_network group=full password=YourStrongPassword",
        "/user set admin disabled=yes",
        "/ip service disable telnet,ftp",
        "/ip service set ssh address=192.168.88.0/24"
      ],
      winboxSteps: [
        "Système > Users",
        "Double-cliquer sur admin > Password",
        "IP > Services"
      ],
      terminology: ["force brute", "ACL", "service hardening", "WinBox", "SSH"],
      diagram: "assets/images/firewall-input.svg" // placeholder si image absente
    },
    // ... autres sections
  ]
};
```

#### Fonctionnalités JavaScript Obligatoires

1. **Navigation** : Affichage dynamique du contenu central en fonction de la section sélectionnée.
2. **Copie de commandes** : Bouton “Copier” sur chaque bloc CLI avec feedback visuel (toast/notification).
3. **Recherche** : Champ de recherche filtrant les sections et mettant en surbrillance les résultats.
4. **Mode sombre/clair** : Bascule avec persistance dans `localStorage`.
5. **Export PDF** : Génération d’un PDF synthétique contenant les commandes CLI de toutes les sections (utilisation de `window.print()` ou `html2pdf.js`).
6. **Glossaire contextuel** : Affichage dans le panneau droit des définitions des termes associés à la section active.
7. **Indicateur de progression** : Barre de progression ou marqueurs de sections consultées.
8. **Sauvegarde de la dernière section consultée** : Via `localStorage`.

#### Responsive Design

| Breakpoint | Comportement |
|------------|--------------|
| ≥ 1200px | Affichage complet (3 colonnes) |
| 768px – 1199px | Panneau droit repliable (toggle), panneau gauche réduit en icônes |
| ≤ 767px | Panneaux superposés, navigation par accordéon, contenu central en pleine largeur |

---

### Exigences de Sécurité Front-End

- Mise en place d’une **CSP (Content Security Policy)** via meta tag
- **Sanitization** des entrées de recherche (pas d’injection HTML)
- Utilisation de `localStorage` uniquement pour les préférences utilisateur
- Pas de connexion externe non sécurisée (toutes les ressources en HTTPS)

---

### Livrable Attendus

Tu dois fournir :

1. **Un fichier `index.html` complet** contenant :
   - La structure HTML5 sémantique
   - Les styles CSS (intégrés ou via Tailwind CDN)
   - Le JavaScript (intégré ou en bloc séparé)
   - Les données JSON intégrées dans un `<script>` ou un fichier séparé

2. **Les assets** :
   - Placeholders pour les schémas/diagrammes (ou génération via SVG/Canvas si possible)
   - Pas d’images externes obligatoires (utilisation d’icônes Font Awesome)

3. **Commentaires clairs** dans le code pour chaque bloc fonctionnel.

---

### Exemple de Rendu pour une Section

#### Section : Bridge et Assignation des Ports

**Panneau central :**

```
Bridge et Assignation des Ports
--------------------------------

Le bridge (pont) regroupe plusieurs interfaces réseau pour qu'elles fonctionnent comme un seul commutateur logique.

CLI (RouterOS) :

[Bloc avec fond sombre]
/interface bridge add name=bridge-local
/interface bridge port add bridge=bridge-local interface=ether2
/interface bridge port add bridge=bridge-local interface=ether3
[Bouton Copier]

WinBox :
1. Bridge > Bridge > Ajouter (name: bridge-local)
2. Bridge > Ports > Ajouter (bridge: bridge-local, interface: ether2, ether3...)

Schéma : [Placeholder: Diagramme bridge.png]
```

**Panneau droit (glossaire contextuel) :**

```
Glossaire
---------
Bridge : Pont réseau qui agrège plusieurs interfaces.
STP : Spanning Tree Protocol, évite les boucles réseau.
Interface : Port physique ou virtuel du routeur.
```

---

### Critères de Qualité

- **Fonctionnalité** : Toutes les sections sont présentes et complètes.
- **Esthétique** : Interface professionnelle, cohérente, utilisation de couleurs techniques (bleu/gris/orange).
- **Responsive** : Fonctionne sur mobile, tablette et desktop.
- **Performance** : Chargement rapide, pas de dépendances externes lourdes.
- **Accessibilité** : Contrastes suffisants, navigation au clavier, labels ARIA.
- **Robustesse** : Pas d’erreurs JavaScript, gestion des cas où le localStorage est désactivé.

---

### Contraintes Supplémentaires

- Ne pas utiliser de framework JavaScript lourd (React, Vue, Angular) – privilégier du vanilla JS.
- Ne pas nécessiter de serveur back-end (100% front-end).
- Les blocs de code CLI doivent utiliser la coloration syntaxique RouterOS (si possible avec Highlight.js configuré pour `routeros`).
- Le bouton d’export PDF doit générer un document propre, formaté, contenant au minimum les commandes CLI de toutes les sections.

---

### Instructions Finales

Génère l’application complète en respectant scrupuleusement toutes les spécifications ci-dessus. Assure-toi que le code est auto-suffisant, bien structuré, prêt à être déployé sur un serveur web statique ou ouvert directement dans un navigateur.

Si certains schémas/diagrammes sont absents, utilise des placeholders SVG ou des zones grises avec du texte explicatif (ex: “[Schéma : Architecture VLANs]”).

---
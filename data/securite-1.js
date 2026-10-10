// ═══════════════════════════════════════════════════════════════
// DATA — Parcours « Sécurité avancée » (lot v1.2) — partie 1/2
//   11 Safe Mode & sauvegarde · 12 Anti-brute force · 13 Firewall RAW
// Convention : blocs CLI en String.raw (les « \ » de continuation RouterOS
// restent intacts). Texte HTML : utiliser &lt; &gt; pour les <PLACEHOLDERS>.
// ═══════════════════════════════════════════════════════════════
(function () {
  const R = String.raw;

  MK.addSections([
    // ───────────────────────────────────────────────────────────
    {
      id: "safemode",
      track: "securite",
      level: "debutant",
      title: "Filet de sécurité : Safe Mode & Sauvegarde",
      icon: "fa-solid fa-life-ring",
      step: "11",
      requires: ["securing"],
      description: "Avant de toucher au pare-feu ou aux services, posez un filet : Safe Mode (annulation automatique si votre connexion tombe), sauvegarde binaire + export, et règles temporaires qui s'auto-suppriment. À appliquer AVANT chaque section de ce parcours.",
      cliCommands: [
        R`# 1. Entrer en Safe Mode
# CLI / SSH : appuyer sur Ctrl+X → l'invite affiche <SAFE>
# WinBox    : bouton « Safe Mode » en haut à gauche de la fenêtre
# Ensuite, TOUTES les modifications sont annulées si la connexion est coupée.
# Pour valider et conserver : appuyer à nouveau sur Ctrl+X (ou re-cliquer sur le bouton).`,

        R`# 2. Point de restauration AVANT modification
# ⚠ Remplacez <MOT_DE_PASSE_BACKUP> par un mot de passe fort (chiffre le .backup)
/system backup save name=avant-modif password=<MOT_DE_PASSE_BACKUP>
/export file=avant-modif
/file print where name~"avant-modif"`,

        R`# 3. « Dead man's switch » : toute règle commentée TEMP- disparaît au bout de 5 min
/system scheduler add name=nettoyage-temp interval=5m \
  on-event="/ip firewall filter remove [find where comment~\"^TEMP-\"]" \
  policy=read,write,test comment="Supprime les règles de test (à retirer une fois validé)"`,

        R`# 4. Exemple : tester une règle sans risque de la laisser en place
/ip firewall filter add chain=input protocol=icmp action=drop \
  place-before=0 comment="TEMP-test-icmp"
# → le ping vers le routeur échoue ; après 5 min la règle est supprimée seule.
# Une fois le test validé, supprimez le nettoyeur :
/system scheduler remove nettoyage-temp`,

        R`# 5. Restaurer un backup binaire (⚠ le routeur REDÉMARRE)
/system backup load name=avant-modif password=<MOT_DE_PASSE_BACKUP>
# Un export .rsc se rejoue avec : /import file-name=avant-modif.rsc`
      ],
      winboxSteps: [
        "Cliquer sur le bouton <code>Safe Mode</code> (haut gauche) : il reste enfoncé tant que le mode est actif",
        "Effectuer les modifications, tester l'accès, puis re-cliquer sur <code>Safe Mode</code> pour valider",
        "<span class='wb-path'>System → Backup → Backup</span> → Name = <code>avant-modif</code>, saisir un mot de passe fort → Backup",
        "<span class='wb-path'>New Terminal</span> → <code>/export file=avant-modif</code> (l'export se fait au terminal)",
        "<span class='wb-path'>Files</span> → glisser les fichiers <code>avant-modif.backup</code> et <code>.rsc</code> vers votre PC (stockage HORS du routeur)",
        "<span class='wb-path'>System → Scheduler → [+]</span> → Name = <code>nettoyage-temp</code>, Interval = <code>00:05:00</code>, On Event = commande de suppression des règles TEMP-",
        "<span class='wb-path'>System → Backup → Restore</span> → choisir le fichier → Restore (redémarrage automatique)"
      ],
      diagram: "safemode",
      terminology: ["Safe Mode", "Rollback", "Backup", "Export", "Scheduler", "Dead man's switch", "Netinstall"],
      concepts: [
        { term: "Safe Mode", def: "Mode transactionnel : RouterOS garde en mémoire les modifications faites pendant la session et les annule si la session se termine sans validation (coupure réseau, fermeture de WinBox/SSH)." },
        { term: "Backup binaire vs Export .rsc", def: "Le .backup contient TOUT (utilisateurs, certificats, secrets) et se restaure sur le même modèle. Le .rsc est un script texte lisible, versionnable (Git) et portable ; en RouterOS 7 les secrets y sont masqués par défaut." },
        { term: "Règle TEMP (dead man's switch)", def: "Mécanisme d'auto-annulation : une tâche planifiée supprime périodiquement les règles marquées TEMP-. Si vous perdez la main ou oubliez la règle, elle disparaît toute seule." },
        { term: "Accès de secours", def: "Dernier recours en cas de verrouillage : MAC-WinBox depuis le LAN d'administration, console série, Netinstall ou reset matériel (ce dernier efface la configuration — d'où l'intérêt du backup hors routeur)." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Le Safe Mode ne protège que contre la PERTE DE CONNEXION. Une règle qui casse le service des clients sans couper votre session n'est PAS annulée : utilisez en plus une règle TEMP- et testez depuis un poste client." },
        { type: "warning", icon: "fa-door-open", text: "Fermer WinBox ou la session SSH en restant en Safe Mode sans valider ANNULE toutes les modifications faites depuis son activation. Validez (Ctrl+X) avant de quitter." },
        { type: "info", icon: "fa-key", text: "Un fichier .backup contient les mots de passe : chiffrez-le (password=) et stockez-le hors du routeur. Les placeholders &lt;MOT_DE_PASSE_BACKUP&gt; sont à remplacer avant toute utilisation." }
      ],
      table: {
        headers: ["Outil", "Quand l'utiliser", "Ce qu'il garantit"],
        rows: [
          ["Safe Mode", "Modification pouvant couper VOTRE session (services, VLAN, firewall INPUT)", "Retour automatique à l'état précédent si la connexion tombe"],
          ["Règle TEMP-", "Test de règle pouvant casser le trafic des CLIENTS", "Suppression automatique au bout de 5 minutes"],
          ["Backup binaire", "Avant mise à jour ou changement majeur", "Restauration complète (même modèle)"],
          ["Export .rsc", "Documentation, comparaison avant/après, Git", "Configuration relisible et rejouable"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "bruteforce",
      track: "securite",
      level: "intermediaire",
      title: "Anti-brute force SSH & WinBox",
      icon: "fa-solid fa-user-lock",
      step: "12",
      requires: ["firewall", "safemode"],
      description: "RouterOS ne verrouille pas un compte après des échecs de connexion. On construit donc des paliers de listes d'adresses : après quelques nouvelles connexions rapprochées vers SSH (22) ou WinBox (8291), l'adresse source est bloquée un jour. Une liste blanche protège les postes d'administration.",
      cliCommands: [
        R`# 1. Liste blanche : poste(s) d'administration de confiance
# ⚠ Adaptez l'adresse à VOTRE poste admin (une adresse, jamais tout un VLAN)
/ip firewall address-list add list=admin_whitelist address=192.168.10.10 comment="Poste admin IT"`,

        R`# 2. Accepter la liste blanche AVANT les paliers (juste avant la règle « Accept ICMP »)
/ip firewall filter add chain=input src-address-list=admin_whitelist action=accept \
  place-before=[find where comment="Accept ICMP"] comment="BF: whitelist admin"`,

        R`# 3. Paliers SSH (port 22) — l'ORDRE des 5 règles est essentiel
/ip firewall filter add chain=input protocol=tcp dst-port=22 connection-state=new \
  src-address-list=ssh_blacklist action=drop \
  place-before=[find where comment="Accept ICMP"] comment="BF-SSH: drop blacklist"
/ip firewall filter add chain=input protocol=tcp dst-port=22 connection-state=new \
  src-address-list=ssh_stage3 action=add-src-to-address-list \
  address-list=ssh_blacklist address-list-timeout=1d log=yes log-prefix="BF-SSH " \
  place-before=[find where comment="Accept ICMP"] comment="BF-SSH: stage3 -> blacklist (1 jour)"
/ip firewall filter add chain=input protocol=tcp dst-port=22 connection-state=new \
  src-address-list=ssh_stage2 action=add-src-to-address-list \
  address-list=ssh_stage3 address-list-timeout=1m \
  place-before=[find where comment="Accept ICMP"] comment="BF-SSH: stage2 -> stage3"
/ip firewall filter add chain=input protocol=tcp dst-port=22 connection-state=new \
  src-address-list=ssh_stage1 action=add-src-to-address-list \
  address-list=ssh_stage2 address-list-timeout=1m \
  place-before=[find where comment="Accept ICMP"] comment="BF-SSH: stage1 -> stage2"
/ip firewall filter add chain=input protocol=tcp dst-port=22 connection-state=new \
  action=add-src-to-address-list address-list=ssh_stage1 address-list-timeout=1m \
  place-before=[find where comment="Accept ICMP"] comment="BF-SSH: nouvelle connexion -> stage1"`,

        R`# 4. Mêmes paliers pour WinBox (port 8291)
/ip firewall filter add chain=input protocol=tcp dst-port=8291 connection-state=new \
  src-address-list=winbox_blacklist action=drop \
  place-before=[find where comment="Accept ICMP"] comment="BF-WINBOX: drop blacklist"
/ip firewall filter add chain=input protocol=tcp dst-port=8291 connection-state=new \
  src-address-list=winbox_stage3 action=add-src-to-address-list \
  address-list=winbox_blacklist address-list-timeout=1d log=yes log-prefix="BF-WINBOX " \
  place-before=[find where comment="Accept ICMP"] comment="BF-WINBOX: stage3 -> blacklist (1 jour)"
/ip firewall filter add chain=input protocol=tcp dst-port=8291 connection-state=new \
  src-address-list=winbox_stage2 action=add-src-to-address-list \
  address-list=winbox_stage3 address-list-timeout=1m \
  place-before=[find where comment="Accept ICMP"] comment="BF-WINBOX: stage2 -> stage3"
/ip firewall filter add chain=input protocol=tcp dst-port=8291 connection-state=new \
  src-address-list=winbox_stage1 action=add-src-to-address-list \
  address-list=winbox_stage2 address-list-timeout=1m \
  place-before=[find where comment="Accept ICMP"] comment="BF-WINBOX: stage1 -> stage2"
/ip firewall filter add chain=input protocol=tcp dst-port=8291 connection-state=new \
  action=add-src-to-address-list address-list=winbox_stage1 address-list-timeout=1m \
  place-before=[find where comment="Accept ICMP"] comment="BF-WINBOX: nouvelle connexion -> stage1"`,

        R`# 5. Vérifier et tester (depuis un poste NON whitelisté, 5 connexions SSH rapprochées)
/ip firewall filter print stats where comment~"BF-"
/ip firewall address-list print where list~"_stage" or list~"_blacklist"
/log print where message~"BF-"`,

        R`# 6. Débloquer une adresse bloquée par erreur (adresse d'exemple)
/ip firewall address-list remove [find where list=ssh_blacklist address=203.0.113.50]
/ip firewall address-list remove [find where list=winbox_blacklist address=203.0.113.50]`,

        R`# 7. (Optionnel) Changer le port SSH — adapter alors dst-port=22 dans les règles ci-dessus
/ip service set ssh port=2222`
      ],
      winboxSteps: [
        "<span class='wb-path'>IP → Firewall → Address Lists → [+]</span> → List = <code>admin_whitelist</code>, Address = IP de votre poste admin",
        "<span class='wb-path'>IP → Firewall → Filter Rules → [+]</span> → Chain = <code>input</code>, Src. Address List = <code>admin_whitelist</code>, Action = accept → glisser la règle au-dessus de « Accept ICMP »",
        "Règle 1 : Protocol = tcp, Dst. Port = <code>22</code>, Connection State = <code>new</code>, Src. Address List = <code>ssh_blacklist</code>, Action = drop",
        "Règle 2 : mêmes critères avec Src. Address List = <code>ssh_stage3</code> → Action = <code>add src to address list</code>, Address List = <code>ssh_blacklist</code>, Timeout = <code>1d 00:00:00</code>",
        "Règles 3 et 4 : stage2 → stage3 puis stage1 → stage2 (Timeout = <code>00:01:00</code>) ; règle 5 : sans Src. Address List → ajoute à <code>ssh_stage1</code>",
        "Dupliquer les 5 règles (icône Copy) en remplaçant le port par <code>8291</code> et les listes par <code>winbox_*</code>",
        "<span class='wb-path'>IP → Firewall → Address Lists</span> → les entrées dynamiques apparaissent avec la lettre <code>D</code> ; supprimer une entrée pour débloquer"
      ],
      diagram: "bruteforce",
      terminology: ["Brute force", "Address list", "Whitelist / Blacklist", "Connection state", "ACL"],
      concepts: [
        { term: "Paliers (stages)", def: "Chaque nouvelle connexion fait monter l'adresse source d'un cran (stage1 → stage2 → stage3 → blacklist) ; chaque cran expire après 1 minute. Seules des connexions rapprochées font progresser l'adresse jusqu'au blocage." },
        { term: "Address list dynamique", def: "Liste d'adresses alimentée automatiquement par une règle (action add-src-to-address-list) avec une durée de vie (address-list-timeout). C'est la mémoire commune de plusieurs règles du pare-feu." },
        { term: "connection-state=new", def: "Ne compte que le premier paquet d'une connexion : les sessions déjà établies (déjà acceptées par la règle established) ne sont jamais pénalisées." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Risque de verrouillage : travaillez en Safe Mode (section 11) et ajoutez votre poste à la liste blanche AVANT les paliers. Sans cela, quelques connexions rapides (script, Ansible, WinBox ouvert plusieurs fois) peuvent vous bloquer un jour." },
        { type: "warning", icon: "fa-network-wired", text: "Plusieurs utilisateurs derrière une même adresse (NAT, 4G partagée) partagent aussi le même sort : un seul attaquant peut faire bloquer toute l'adresse." },
        { type: "info", icon: "fa-circle-info", text: "Dans ce guide SSH et WinBox ne sont joignables que depuis le LAN : ces paliers protègent contre un poste interne compromis ou un invité curieux. Pour un accès distant, passez par un VPN (WireGuard, parcours Interconnexion) plutôt que d'exposer le port." }
      ],
      table: {
        headers: ["Connexion (en moins d'1 min)", "Liste mise à jour", "Durée", "Effet"],
        rows: [
          ["1ère nouvelle connexion", "ssh_stage1", "1 minute", "Autorisée"],
          ["2ème", "ssh_stage2", "1 minute", "Autorisée"],
          ["3ème", "ssh_stage3", "1 minute", "Autorisée"],
          ["4ème", "ssh_blacklist", "1 jour", "Autorisée, puis l'adresse est inscrite"],
          ["5ème et suivantes", "—", "tant que listée", "DROP (rejet silencieux)"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "raw-firewall",
      track: "securite",
      level: "avance",
      title: "Firewall RAW : filtrage précoce & anti-spoofing",
      icon: "fa-solid fa-bolt",
      step: "13",
      requires: ["firewall", "bruteforce"],
      description: "La table RAW s'exécute AVANT le suivi de connexions : jeter tôt les paquets manifestement hostiles ou forgés économise du CPU et réduit la surface d'attaque. On y place les listes noires, les drapeaux TCP invalides, l'anti-spoofing par VLAN et les bogons côté WAN.",
      cliCommands: [
        R`# 1. Listes d'interfaces LAN / WAN : déjà créées à la section 05 (depuis la v2.0.1) — vérifier qu'elles existent
/interface list member print
# Si vous partez d'une configuration antérieure à la v2.0.1, créez-les :
# /interface list add name=LAN
# /interface list add name=WAN
# /interface list member add list=LAN interface=vlan10-IT
# /interface list member add list=LAN interface=vlan20-Hotspot
# /interface list member add list=WAN interface=ether1`,

        R`# 2. Liste blanche et listes noires (alimentées par les sections 12 et 14)
/ip firewall raw add chain=prerouting src-address-list=admin_whitelist action=accept comment="RAW: whitelist admin"
/ip firewall raw add chain=prerouting src-address-list=ssh_blacklist action=drop comment="RAW: drop ssh_blacklist"
/ip firewall raw add chain=prerouting src-address-list=winbox_blacklist action=drop comment="RAW: drop winbox_blacklist"
/ip firewall raw add chain=prerouting src-address-list=port_scanners action=drop comment="RAW: drop port_scanners"
/ip firewall raw add chain=prerouting src-address-list=ddos_attackers action=drop comment="RAW: drop ddos_attackers"`,

        R`# 3. Drapeaux TCP invalides (scans NULL / XMAS / FIN, paquets forgés) et port 0
/ip firewall raw add chain=prerouting protocol=tcp tcp-flags=!fin,!syn,!rst,!ack action=drop comment="RAW: TCP sans drapeau valide"
/ip firewall raw add chain=prerouting protocol=tcp tcp-flags=fin,syn action=drop comment="RAW: TCP fin+syn"
/ip firewall raw add chain=prerouting protocol=tcp tcp-flags=fin,rst action=drop comment="RAW: TCP fin+rst"
/ip firewall raw add chain=prerouting protocol=tcp tcp-flags=fin,!ack action=drop comment="RAW: TCP fin sans ack"
/ip firewall raw add chain=prerouting protocol=tcp tcp-flags=fin,urg action=drop comment="RAW: TCP fin+urg"
/ip firewall raw add chain=prerouting protocol=tcp tcp-flags=syn,rst action=drop comment="RAW: TCP syn+rst"
/ip firewall raw add chain=prerouting protocol=tcp tcp-flags=rst,urg action=drop comment="RAW: TCP rst+urg"
/ip firewall raw add chain=prerouting protocol=tcp port=0 action=drop comment="RAW: TCP port 0"
/ip firewall raw add chain=prerouting protocol=udp port=0 action=drop comment="RAW: UDP port 0"`,

        R`# 4. Anti-spoofing par VLAN : un client ne peut émettre qu'avec une adresse de SON réseau
# ⚠ La règle DHCP doit venir AVANT : un client sans IP émet depuis 0.0.0.0
/ip firewall raw add chain=prerouting protocol=udp src-address=0.0.0.0 dst-address=255.255.255.255 \
  dst-port=67 in-interface-list=LAN action=accept comment="RAW: autoriser DHCP Discover"
/ip firewall raw add chain=prerouting in-interface=vlan10-IT src-address=!192.168.10.0/24 \
  action=drop comment="RAW: anti-spoof VLAN10"
/ip firewall raw add chain=prerouting in-interface=vlan20-Hotspot src-address=!192.168.20.0/24 \
  action=drop comment="RAW: anti-spoof VLAN20"`,

        R`# 5. Bogons : adresses non routables sur Internet
/ip firewall address-list add list=bogons address=0.0.0.0/8
/ip firewall address-list add list=bogons address=10.0.0.0/8
/ip firewall address-list add list=bogons address=100.64.0.0/10
/ip firewall address-list add list=bogons address=127.0.0.0/8
/ip firewall address-list add list=bogons address=169.254.0.0/16
/ip firewall address-list add list=bogons address=172.16.0.0/12
/ip firewall address-list add list=bogons address=192.0.0.0/24
/ip firewall address-list add list=bogons address=192.0.2.0/24
/ip firewall address-list add list=bogons address=192.168.0.0/16
/ip firewall address-list add list=bogons address=198.18.0.0/15
/ip firewall address-list add list=bogons address=198.51.100.0/24
/ip firewall address-list add list=bogons address=203.0.113.0/24
/ip firewall address-list add list=bogons address=224.0.0.0/4
/ip firewall address-list add list=bogons address=240.0.0.0/4`,

        R`# 6. Exception : réseau amont PRIVÉ (modem 4G / box opérateur en 192.168.x.x ou 10.x.x.x)
# ⚠ Remplacez <RESEAU_AMONT> par le réseau de votre WAN (ex. 192.168.1.0/24)
/ip firewall address-list add list=wan_upstream address=<RESEAU_AMONT> comment="Réseau amont autorisé"
/ip firewall raw add chain=prerouting in-interface-list=WAN src-address-list=wan_upstream \
  action=accept comment="RAW: exception réseau amont"
# Règle désactivée par défaut : on l'active seulement après test (étape 7)
/ip firewall raw add chain=prerouting in-interface-list=WAN src-address-list=bogons \
  action=drop disabled=yes comment="RAW: drop bogons WAN (activer apres test)"`,

        R`# 7. Contrôler les compteurs, puis activer le drop des bogons si Internet fonctionne toujours
/ip firewall raw print stats
/ping 8.8.8.8 count=3
/ip firewall raw enable [find where comment~"drop bogons WAN"]`
      ],
      winboxSteps: [
        "<span class='wb-path'>Interfaces → Interface List</span> → vérifier que les listes <code>LAN</code> et <code>WAN</code> (créées à la section 05) contiennent bien leurs membres",
        "<span class='wb-path'>IP → Firewall → RAW → [+]</span> → Chain = <code>prerouting</code>, Src. Address List = <code>admin_whitelist</code>, Action = accept",
        "Une règle par liste noire : Src. Address List = <code>ssh_blacklist</code> (puis winbox_blacklist, port_scanners, ddos_attackers), Action = drop",
        "Drapeaux TCP : Protocol = tcp, TCP Flags = <code>fin,syn</code> (puis les autres combinaisons du tableau), Action = drop",
        "Anti-spoofing : In. Interface = <code>vlan10-IT</code>, Src. Address = <code>!192.168.10.0/24</code> (case « ! »), Action = drop ; idem pour vlan20-Hotspot",
        "<span class='wb-path'>IP → Firewall → Address Lists</span> → ajouter les réseaux de la liste <code>bogons</code>",
        "Règle bogons WAN : In. Interface List = <code>WAN</code>, Src. Address List = <code>bogons</code>, Action = drop, la laisser <code>disabled</code> jusqu'au test"
      ],
      diagram: "raw",
      terminology: ["RAW firewall", "Connection tracking", "Bogons", "IP spoofing", "Interface list", "Prerouting"],
      concepts: [
        { term: "Pourquoi RAW ?", def: "Le pare-feu filter n'agit qu'après le suivi de connexions (connection tracking), qui consomme CPU et mémoire pour chaque paquet. La table RAW jette le trafic indésirable avant ce coût — décisif sous flood." },
        { term: "Action accept en RAW", def: "En RAW, accept signifie « ne plus évaluer la table RAW » ; le paquet continue ensuite vers le suivi de connexions et la table filter. Ce n'est PAS un contournement du pare-feu." },
        { term: "Anti-spoofing", def: "Vérifier que l'adresse source d'un paquet est cohérente avec l'interface d'arrivée. Un poste du VLAN 10 qui émet avec une adresse du VLAN 20 (ou publique) est forcément une anomalie ou une attaque." },
        { term: "Bogons", def: "Plages d'adresses réservées ou non allouées. Un paquet venant d'Internet avec une telle adresse source est forgé — sauf si votre opérateur utilise lui-même des adresses privées (CGNAT, modem 4G)." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Règle DHCP Discover : sans elle, l'anti-spoofing jette les demandes DHCP (source 0.0.0.0) et plus aucun client n'obtient d'adresse. Elle doit précéder les règles anti-spoof." },
        { type: "warning", icon: "fa-globe", text: "WAN en adresse privée : de nombreux accès (modem 4G, box en 192.168.x.x, CGNAT 100.64.x.x) fournissent une adresse amont privée. Déclarez ce réseau dans wan_upstream et n'activez le drop des bogons qu'après avoir vérifié que le ping 8.8.8.8 fonctionne encore." },
        { type: "info", icon: "fa-circle-info", text: "Hotspot : le mode « Universal NAT » accepte des clients configurés avec une IP quelconque. L'anti-spoofing du VLAN20 les rejettera : c'est voulu, mais prévenez les utilisateurs aux IP statiques. IPv6 n'est pas traité ici." }
      ],
      table: {
        headers: ["Règle RAW", "Ce qui est jeté", "Intérêt d'agir tôt"],
        rows: [
          ["Listes noires", "Tout trafic des adresses déjà identifiées hostiles", "Aucun suivi de connexion pour les attaquants connus"],
          ["Drapeaux TCP invalides", "Paquets NULL, XMAS, FIN scan, combinaisons impossibles", "Neutralise les scans furtifs avant analyse"],
          ["Anti-spoof VLAN", "Adresse source hors du réseau du VLAN d'arrivée", "Empêche l'usurpation entre VLANs"],
          ["Bogons WAN", "Sources non routables arrivant par ether1", "Filtre les paquets forgés venant d'Internet"]
        ]
      }
    }
  ]);
})();

// ═══════════════════════════════════════════════════════════════
// DATA — Parcours « VPN & interconnexion » (lot v1.4) — partie 2/2
//   26 Failover WAN · 27 Répartition de charge multi-WAN
// Hypothèse : WAN1 = ether1 (déjà configuré), WAN2 = ether5 (retiré du bridge).
// ═══════════════════════════════════════════════════════════════
(function () {
  const R = String.raw;

  MK.addSections([
    // ───────────────────────────────────────────────────────────
    {
      id: "failover-wan",
      track: "interconnexion",
      level: "intermediaire",
      title: "Failover WAN : bascule automatique sur un lien de secours",
      icon: "fa-solid fa-arrows-rotate",
      step: "26",
      requires: ["routing", "addressing", "raw-firewall"],
      description: "Quand le lien principal tombe, le trafic doit passer seul sur un second accès (autre opérateur, 4G). On déclare un WAN2, on remplace les routes par défaut dynamiques par des routes récursives surveillées par ping, on adapte NAT et pare-feu à deux sorties et on journalise chaque bascule avec Netwatch.",
      cliCommands: [
        R`# 1. Libérer ether5 du bridge et le déclarer comme second WAN
/interface bridge port remove [find where interface=ether5]
/interface list member add list=WAN interface=ether5
/ip dhcp-client add interface=ether5 add-default-route=no use-peer-dns=no comment="WAN2 - secours"
# Les routes par défaut seront gérées à la main : on retire celle du DHCP client du WAN1
/ip dhcp-client set [find where comment="WAN - FAI"] add-default-route=no
# Relever la passerelle de chaque lien (à reporter à l'étape 2)
:put [/ip dhcp-client get [find where interface=ether1] gateway]
:put [/ip dhcp-client get [find where interface=ether5] gateway]`,

        R`# 2. Routes récursives : le routeur teste un hôte public À TRAVERS chaque lien
# ⚠ Remplacez <GW_WAN1> et <GW_WAN2> par les passerelles relevées à l'étape 1
# 8.8.4.4 et 1.0.0.1 ne servent pas de DNS ici : on évite d'y forcer le trafic DNS d'un seul lien
/ip route add dst-address=8.8.4.4/32 gateway=<GW_WAN1> scope=10 comment="Test WAN1"
/ip route add dst-address=1.0.0.1/32 gateway=<GW_WAN2> scope=10 comment="Test WAN2"
/ip route add dst-address=0.0.0.0/0 gateway=8.8.4.4 target-scope=11 check-gateway=ping \
  distance=1 comment="Défaut via WAN1"
/ip route add dst-address=0.0.0.0/0 gateway=1.0.0.1 target-scope=11 check-gateway=ping \
  distance=2 comment="Défaut via WAN2 (secours)"`,

        R`# 3. NAT et pare-feu : depuis la v2.0.1 (sections 07 et 09) ils utilisent déjà la liste WAN : on vérifie seulement
# Le WAN2 (ether5) ayant été ajouté à la liste WAN à l'étape 1, il bénéficie du NAT et de l'accès Hotspot sans autre modification
/ip firewall nat print where comment~"Internet LAN"
/ip firewall filter print where comment~"WAN uniquement"
# Si ces règles affichent encore « out-interface=ether1 » (configuration antérieure à la v2.0.1), corrigez-les :
# /ip firewall nat set [find where comment~"Internet LAN"] !out-interface out-interface-list=WAN
# /ip firewall filter set [find where comment~"WAN uniquement"] !out-interface out-interface-list=WAN`,

        R`# 4. Journaliser chaque bascule (Netwatch surveille les deux liens)
/tool netwatch add host=8.8.4.4 interval=10s timeout=2s comment="Test WAN1" \
  down-script=":log warning \"WAN1 HORS SERVICE - bascule sur WAN2\"" \
  up-script=":log info \"WAN1 RETABLI - retour sur WAN1\""
/tool netwatch add host=1.0.0.1 interval=10s timeout=2s comment="Test WAN2" \
  down-script=":log warning \"WAN2 HORS SERVICE\"" \
  up-script=":log info \"WAN2 RETABLI\""`,

        R`# 5. Simuler une panne du WAN1 (⚠ en Safe Mode, depuis un poste du LAN)
/interface ethernet disable ether1
/ip route print where dst-address=0.0.0.0/0
/ping 8.8.8.8 count=5
# Rétablir
/interface ethernet enable ether1`,

        R`# 6. Contrôler l'état courant
/ip route print where active
/tool netwatch print
/log print where message~"WAN"`
      ],
      winboxSteps: [
        "<span class='wb-path'>Bridge → Ports</span> → supprimer l'entrée <code>ether5</code> ; <span class='wb-path'>Interfaces → Interface List</span> → ajouter <code>ether5</code> à la liste <code>WAN</code>",
        "<span class='wb-path'>IP → DHCP Client → [+]</span> → Interface = <code>ether5</code>, décocher <code>Add Default Route</code> et <code>Use Peer DNS</code> ; faire de même sur le client DHCP du WAN1",
        "Relever les passerelles dans la colonne ou la fenêtre de détail de chaque client DHCP",
        "<span class='wb-path'>IP → Routes → [+]</span> → deux routes /32 (<code>8.8.4.4</code> et <code>1.0.0.1</code>) avec Scope = 10 via chaque passerelle",
        "Routes <code>0.0.0.0/0</code> : Gateway = <code>8.8.4.4</code> (Distance 1) puis <code>1.0.0.1</code> (Distance 2), Target Scope = <code>11</code>, Check Gateway = <code>ping</code>",
        "<span class='wb-path'>IP → Firewall → NAT</span> et <span class='wb-path'>Filter Rules</span> → vérifier que le masquerade et la règle Hotspot utilisent Out. Interface List = <code>WAN</code> (sinon les corriger)",
        "<span class='wb-path'>Tools → Netwatch → [+]</span> → un enregistrement par lien avec Down Script et Up Script pour la journalisation"
      ],
      diagram: "failover-wan",
      terminology: ["Failover", "Recursive routing", "Distance administrative", "check-gateway", "Netwatch", "Masquerade", "Interface list"],
      concepts: [
        { term: "Distance administrative", def: "Quand plusieurs routes mènent à la même destination, la plus petite distance l'emporte. La route via WAN1 (distance 1) est active ; la route via WAN2 (distance 2) reste en attente et prend le relais si la première devient inactive." },
        { term: "Routage récursif", def: "La route par défaut a pour passerelle un hôte public (8.8.4.4) et non l'adresse du modem. Le routeur doit donc résoudre ce hôte via une route /32 qui passe par le bon lien : si le ping échoue à travers ce lien, la route par défaut est désactivée. On teste ainsi Internet, pas seulement le modem." },
        { term: "Détection et temps de bascule", def: "check-gateway=ping sonde la passerelle environ toutes les 10 secondes : la bascule prend de 10 à 30 secondes. Les connexions existantes sont interrompues et reprises par les applications sur le nouveau lien." },
        { term: "Retour automatique", def: "Dès que le WAN1 répond de nouveau, sa route reprend la priorité. Les nouvelles connexions repartent sur le lien principal ; le journal Netwatch conserve la trace de l'incident." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Hypothèse importante : les passerelles sont connues et stables. Les placeholders &lt;GW_WAN1&gt; et &lt;GW_WAN2&gt; sont à remplacer. Si l'opérateur change la passerelle (DHCP), les routes /32 deviennent fausses : relevez-la de nouveau ou fixez-la côté opérateur." },
        { type: "info", icon: "fa-shield-halved", text: "Depuis la version 2.0.1, le masquerade (section 07) et la règle Hotspot (section 09) s'appuient sur la liste WAN : le Hotspot garde Internet après une bascule sur WAN2 et le NAT s'applique aussi sur ether5. Sur une configuration plus ancienne, appliquez les commandes en commentaire de l'étape 3." },
        { type: "info", icon: "fa-circle-info", text: "L'accès 4G de secours est souvent derrière un CGNAT : les redirections de ports (section 17) et le VPN en écoute (section 23) ne fonctionneront pas via ce lien. Prévoyez-le dans votre plan de continuité." }
      ],
      table: {
        headers: ["Route", "Passerelle", "Distance", "Rôle"],
        rows: [
          ["8.8.4.4/32", "Passerelle WAN1", "scope 10", "Cible de test du WAN1"],
          ["1.0.0.1/32", "Passerelle WAN2", "scope 10", "Cible de test du WAN2"],
          ["0.0.0.0/0", "8.8.4.4 (récursif)", "1", "Défaut principal, surveillé par ping"],
          ["0.0.0.0/0", "1.0.0.1 (récursif)", "2", "Défaut de secours, actif si le principal tombe"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "load-balancing",
      track: "interconnexion",
      level: "avance",
      title: "Répartition de charge multi-WAN (PCC)",
      icon: "fa-solid fa-code-branch",
      step: "27",
      requires: ["failover-wan", "raw-firewall"],
      description: "Utiliser les deux liens en même temps : le PCC (Per Connection Classifier) répartit les connexions entre WAN1 et WAN2 tout en gardant chaque échange sur le même lien. On marque les connexions, on crée des tables de routage dédiées, on assure le retour symétrique et on conserve le secours en cas de panne d'un lien. Une variante ECMP plus simple est également présentée.",
      cliCommands: [
        R`# 1. Tables de routage dédiées à chaque lien (RouterOS 7)
/routing table add name=to-wan1 fib
/routing table add name=to-wan2 fib`,

        R`# 2. Retour symétrique : une connexion qui ARRIVE par un lien repart par ce même lien
/ip firewall mangle add chain=prerouting in-interface=ether1 connection-mark=no-mark \
  action=mark-connection new-connection-mark=wan1-conn passthrough=yes comment="LB: entrant WAN1"
/ip firewall mangle add chain=prerouting in-interface=ether5 connection-mark=no-mark \
  action=mark-connection new-connection-mark=wan2-conn passthrough=yes comment="LB: entrant WAN2"`,

        R`# 3. Répartition des connexions du LAN vers Internet (une sur deux par lien)
# dst-address-list=!bogons : le trafic vers les réseaux privés (VPN, sites distants) n'est PAS réparti
# both-addresses : toutes les connexions d'un même couple source/destination restent sur le même lien
/ip firewall mangle add chain=prerouting in-interface-list=LAN dst-address-list=!bogons \
  connection-mark=no-mark per-connection-classifier=both-addresses:2/0 \
  action=mark-connection new-connection-mark=wan1-conn passthrough=yes comment="LB: LAN vers WAN1"
/ip firewall mangle add chain=prerouting in-interface-list=LAN dst-address-list=!bogons \
  connection-mark=no-mark per-connection-classifier=both-addresses:2/1 \
  action=mark-connection new-connection-mark=wan2-conn passthrough=yes comment="LB: LAN vers WAN2"`,

        R`# 4. Marques de routage (trafic du LAN, puis trafic émis par le routeur lui-même)
/ip firewall mangle add chain=prerouting in-interface-list=LAN connection-mark=wan1-conn \
  action=mark-routing new-routing-mark=to-wan1 passthrough=no comment="LB: route WAN1"
/ip firewall mangle add chain=prerouting in-interface-list=LAN connection-mark=wan2-conn \
  action=mark-routing new-routing-mark=to-wan2 passthrough=no comment="LB: route WAN2"
/ip firewall mangle add chain=output connection-mark=wan1-conn \
  action=mark-routing new-routing-mark=to-wan1 passthrough=no comment="LB: sortie routeur WAN1"
/ip firewall mangle add chain=output connection-mark=wan2-conn \
  action=mark-routing new-routing-mark=to-wan2 passthrough=no comment="LB: sortie routeur WAN2"`,

        R`# 5. Routes par table : chaque lien est préféré, l'autre sert de secours (distance 2)
# ⚠ Remplacez <GW_WAN1> et <GW_WAN2> (mêmes valeurs qu'en section 26)
/ip route add dst-address=0.0.0.0/0 gateway=<GW_WAN1> routing-table=to-wan1 check-gateway=ping \
  distance=1 comment="LB: WAN1"
/ip route add dst-address=0.0.0.0/0 gateway=<GW_WAN2> routing-table=to-wan1 check-gateway=ping \
  distance=2 comment="LB: WAN1 secours via WAN2"
/ip route add dst-address=0.0.0.0/0 gateway=<GW_WAN2> routing-table=to-wan2 check-gateway=ping \
  distance=1 comment="LB: WAN2"
/ip route add dst-address=0.0.0.0/0 gateway=<GW_WAN1> routing-table=to-wan2 check-gateway=ping \
  distance=2 comment="LB: WAN2 secours via WAN1"`,

        R`# 6. Variante pondérée 2:1 (WAN1 deux fois plus rapide) : remplacer les règles de l'étape 3 par
# classifier 3/0 et 3/1 → wan1-conn, classifier 3/2 → wan2-conn
# per-connection-classifier=both-addresses:3/0   (idem 3/1 vers wan1-conn, 3/2 vers wan2-conn)`,

        R`# 7. Variante simple ECMP (sans marquage) : remplace les routes par défaut de la section 26
# La répartition est automatique mais moins maîtrisable (pas de retour symétrique garanti)
# /ip route add dst-address=0.0.0.0/0 gateway=<GW_WAN1>,<GW_WAN2> check-gateway=ping comment="ECMP"`,

        R`# 8. FastTrack contournerait le marquage : le désactiver, puis vérifier la répartition
/ip firewall filter disable [find where action=fasttrack-connection]
/ip firewall mangle print stats where comment~"LB"
/ip firewall connection print count-only where connection-mark=wan1-conn
/ip firewall connection print count-only where connection-mark=wan2-conn
/tool torch interface=ether5`
      ],
      winboxSteps: [
        "<span class='wb-path'>Routing → Tables → [+]</span> → créer <code>to-wan1</code> et <code>to-wan2</code> avec l'option <code>FIB</code> cochée",
        "<span class='wb-path'>IP → Firewall → Mangle → [+]</span> → Chain = prerouting, In. Interface = <code>ether1</code>, Connection Mark = <code>no-mark</code>, Action = mark connection, New = <code>wan1-conn</code> ; idem pour <code>ether5</code> / <code>wan2-conn</code>",
        "Règles de répartition : In. Interface List = <code>LAN</code>, Dst. Address List = <code>!bogons</code> (case « ! »), onglet Extra → Per Connection Classifier = <code>both addresses</code>, Denominator 2, Remainder 0 puis 1",
        "Règles <code>mark routing</code> : Chain = prerouting (In. Interface List = LAN) puis Chain = <code>output</code>, avec New Routing Mark = <code>to-wan1</code> ou <code>to-wan2</code>, Passthrough décoché",
        "<span class='wb-path'>IP → Routes → [+]</span> → quatre routes <code>0.0.0.0/0</code> avec Routing Table = <code>to-wan1</code> / <code>to-wan2</code>, Distance 1 ou 2, Check Gateway = ping",
        "<span class='wb-path'>IP → Firewall → Filter Rules</span> → désactiver toute règle d'action <code>fasttrack connection</code>",
        "<span class='wb-path'>IP → Firewall → Connections</span> → filtrer par Connection Mark pour constater la répartition entre les deux liens"
      ],
      diagram: "load-balancing",
      terminology: ["PCC", "ECMP", "Routing mark", "Routing table", "Connection mark", "Mangle", "FastTrack", "Failover"],
      concepts: [
        { term: "PCC : répartir par connexion, pas par paquet", def: "Le classifieur calcule une empreinte (adresses, éventuellement ports) puis la divise par un dénominateur. Le reste de la division (0 ou 1) décide du lien. Toutes les connexions de même empreinte vont toujours sur le même lien, ce qui évite de casser les sessions (banque, authentifications liées à l'adresse IP)." },
        { term: "Pourquoi both-addresses ?", def: "Avec les deux adresses (source et destination), un poste qui parle à un même serveur garde la même adresse publique de sortie. Avec les ports en plus, la répartition est plus fine mais un même site peut recevoir plusieurs adresses publiques, ce qui perturbe certaines applications." },
        { term: "Retour symétrique", def: "Une réponse doit repartir par le lien d'où est venue la requête, sinon l'opérateur la rejette (filtrage anti-spoofing). Le marquage des connexions entrantes par interface et le marquage de routage en sortie garantissent cette symétrie." },
        { term: "Secours conservé", def: "Chaque table de routage contient une route principale et une route de secours par l'autre lien. Si un lien tombe, les connexions marquées pour lui sont réacheminées sur l'autre au lieu d'être perdues." }
      ],
      alerts: [
        { type: "warning", icon: "fa-microchip", text: "Le marquage de connexions consomme du CPU et FastTrack doit rester désactivé : mesurez /system resource print sous charge avant de généraliser sur un routeur d'entrée de gamme." },
        { type: "warning", icon: "fa-triangle-exclamation", text: "Travaillez en Safe Mode (section 11) : une erreur de marquage peut couper Internet pour tout le LAN. Les placeholders &lt;GW_WAN1&gt; et &lt;GW_WAN2&gt; sont à remplacer, et la section 26 doit être fonctionnelle avant celle-ci." },
        { type: "info", icon: "fa-circle-info", text: "Les règles QoS (sections 21 et 22) restent compatibles : la file de sortie se règle alors par lien (une Queue Tree par interface WAN) plutôt que sur un seul parent." }
      ],
      table: {
        headers: ["Méthode", "Avantages", "Limites"],
        rows: [
          ["Failover (section 26)", "Simple et robuste", "Le lien de secours reste inutilisé tant que le principal fonctionne"],
          ["ECMP", "Une seule route, aucune règle", "Retour symétrique et poids peu maîtrisables"],
          ["PCC both-addresses", "Sessions stables, secours conservé", "Configuration plus longue, plus de CPU"],
          ["PCC avec pondération 2:1", "Adapté à deux liens de débits différents", "Plus de règles à maintenir"]
        ]
      }
    }
  ]);
})();

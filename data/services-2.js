// ═══════════════════════════════════════════════════════════════
// DATA — Parcours « Services réseau » (lot v1.3) — partie 2/2
//   20 DHCP avancé · 21 QoS : Simple Queues · 22 QoS : PCQ, Queue Tree & FastTrack
// ═══════════════════════════════════════════════════════════════
(function () {
  const R = String.raw;

  MK.addSections([
    // ───────────────────────────────────────────────────────────
    {
      id: "dhcp-advanced",
      track: "services",
      level: "intermediaire",
      title: "DHCP avancé : réservations, options & contrôle",
      icon: "fa-solid fa-address-card",
      step: "20",
      requires: ["dhcp", "ntp-server"],
      description: "Fixer l'adresse des équipements importants, distribuer des options (serveur de démarrage, routes statiques), relayer le DHCP vers un serveur central, détecter un faux serveur DHCP et verrouiller le VLAN IT sur les baux officiels grâce à l'ARP en réponse seule.",
      cliCommands: [
        R`# 1. Réservation : toujours la même adresse pour un équipement (hors de la plage du pool)
# ⚠ Remplacez l'adresse MAC par celle de l'équipement réel
/ip dhcp-server lease add address=192.168.10.50 mac-address=AA:BB:CC:DD:EE:FF \
  server=dhcp-vlan10 comment="Serveur interne"
# Ou figer un bail déjà attribué :
/ip dhcp-server lease make-static [find where address=192.168.10.120]`,

        R`# 2. Options DHCP supplémentaires, ajoutées au jeu d'options du VLAN10 (créé en section 19)
# Option 66 : serveur de démarrage réseau (texte entre apostrophes)
/ip dhcp-server option add name=tftp-66 code=66 value="'192.168.10.20'"
# Option 121 : route statique 10.99.0.0/24 via 192.168.10.254 → 0x18 0A6300 C0A80AFE
/ip dhcp-server option add name=route-121 code=121 value=0x180A6300C0A80AFE
/ip dhcp-server option sets set opts-vlan10 options=ntp-v10,tftp-66,route-121`,

        R`# 3. Détecter un faux serveur DHCP sur le VLAN IT (l'alerte se déclenche pour tout autre serveur)
/ip dhcp-server alert add interface=vlan10-IT valid-server=[/interface get vlan10-IT mac-address] \
  alert-timeout=1h on-alert=":log warning \"DHCP-ROGUE detecte sur vlan10-IT\"" disabled=no
/ip dhcp-server alert print`,

        R`# 4. Alimenter une liste d'adresses avec les clients DHCP (utilisable dans le pare-feu ou les queues)
/ip dhcp-server set dhcp-vlan10 address-list=clients-vlan10
/ip dhcp-server set dhcp-vlan20 address-list=clients-vlan20`,

        R`# 5. VLAN IT « DHCP uniquement » : les postes en IP statique non déclarée n'ont plus accès
# ⚠ Réservez d'abord (étape 1) les serveurs et imprimantes à IP fixe, puis testez en Safe Mode
/ip dhcp-server set dhcp-vlan10 add-arp=yes
/interface vlan set vlan10-IT arp=reply-only`,

        R`# 6. Relais DHCP — EXEMPLE FICTIF : un VLAN distant utilise le serveur DHCP central 192.168.10.20
# ⚠ vlan30-Distant n'existe pas dans ce guide : adaptez interface et adresses
/ip dhcp-relay add name=relais-vlan30 interface=vlan30-Distant dhcp-server=192.168.10.20 \
  local-address=192.168.30.1 disabled=no`,

        R`# 7. Vérifier
/ip dhcp-server lease print
/ip dhcp-server option print
/ip dhcp-server option sets print
/ip arp print`
      ],
      winboxSteps: [
        "<span class='wb-path'>IP → DHCP Server → Leases</span> → double-clic sur un bail dynamique → bouton <code>Make Static</code>, ou [+] pour une réservation (Address, MAC Address, Server)",
        "<span class='wb-path'>IP → DHCP Server → Options → [+]</span> → Name, Code (<code>66</code> ou <code>121</code>), Value ; puis onglet <code>Option Sets</code> pour regrouper les options",
        "<span class='wb-path'>IP → DHCP Server → Networks</span> → affecter le jeu d'options au réseau concerné",
        "<span class='wb-path'>IP → DHCP Server → Alerts → [+]</span> → Interface = <code>vlan10-IT</code>, Valid Server = adresse MAC du routeur, Alert Timeout = <code>01:00:00</code>",
        "Double-clic sur le serveur DHCP → champs <code>Address List</code> et <code>Add ARP For Leases</code>",
        "<span class='wb-path'>Interfaces → VLAN → vlan10-IT</span> → ARP = <code>reply-only</code> (à valider en Safe Mode)",
        "<span class='wb-path'>IP → ARP</span> → contrôler que les entrées des clients apparaissent bien avec la lettre <code>D</code> (dynamique via DHCP)"
      ],
      diagram: "dhcp-advanced",
      terminology: ["Réservation DHCP", "DHCP option", "DHCP relay", "Rogue DHCP", "ARP reply-only", "Safe Mode", "DHCP lease"],
      concepts: [
        { term: "Réservation DHCP", def: "Association durable adresse MAC → adresse IP gérée par le serveur DHCP. Les équipements importants gardent une adresse stable tout en restant configurés automatiquement, et l'inventaire reste centralisé." },
        { term: "Faux serveur DHCP (rogue)", def: "Un routeur ou une box branchés par erreur (ou par malveillance) répondent aux clients avec de mauvaises passerelles ou DNS, détournant leur trafic. L'alerte DHCP signale tout serveur autre que celui déclaré valide." },
        { term: "ARP reply-only", def: "Le routeur ne répond qu'aux demandes ARP des clients présents dans sa table ARP. Avec add-arp=yes, seuls les clients ayant obtenu un bail y figurent : une adresse fixée à la main ne reçoit plus de réponse." },
        { term: "Relais DHCP", def: "Le routeur transmet les demandes DHCP d'un VLAN vers un serveur situé ailleurs (serveur Windows central, par exemple), avec son adresse locale comme identifiant du réseau d'origine." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "ARP reply-only : un équipement à IP fixe non réservé perd immédiatement l'accès, y compris votre propre poste d'administration s'il est en adresse statique. Réservez d'abord, travaillez en Safe Mode (section 11) et gardez MAC-WinBox pour l'accès de secours." },
        { type: "info", icon: "fa-circle-info", text: "Le VLAN20 Hotspot n'est volontairement pas passé en reply-only : le Hotspot gère lui-même les associations d'adresses de ses clients." },
        { type: "info", icon: "fa-network-wired", text: "Les exemples 5 et 6 utilisent des interfaces fictives (vlan30-...) pour illustrer le relais et la traduction : adaptez-les à votre plan d'adressage avant exécution." }
      ],
      table: {
        headers: ["Fonction", "Commande clé", "Cas d'usage"],
        rows: [
          ["Réservation", "/ip dhcp-server lease make-static", "Serveur, imprimante, point d'accès"],
          ["Option 42", "code=42 (section 19)", "Serveur de temps"],
          ["Option 66", "code=66", "Démarrage réseau (PXE/TFTP)"],
          ["Option 121", "code=121", "Routes statiques envoyées aux clients"],
          ["Alerte DHCP", "/ip dhcp-server alert", "Détection d'un faux serveur"],
          ["ARP reply-only", "arp=reply-only + add-arp=yes", "Interdire les adresses fixées à la main"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "qos-simple",
      track: "services",
      level: "intermediaire",
      title: "QoS : Simple Queues, burst & priorités",
      icon: "fa-solid fa-gauge-high",
      step: "21",
      requires: ["dhcp", "routing"],
      description: "Répartir une liaison limitée (4G, radio, ADSL) entre les VLANs et les clients : limites globales par réseau, limites individuelles avec burst, hiérarchie parent/enfant, priorités et débits par profil Hotspot. Les Simple Queues sont évaluées de haut en bas : la première qui correspond s'applique.",
      cliCommands: [
        R`# 1. Limites par réseau (⚠ adaptez les débits à votre abonnement réel, valeurs « envoi/réception »)
# Pour une queue ciblant un réseau LAN : premier chiffre = envoi du client, second = téléchargement
/queue simple add name=q-vlan10 target=192.168.10.0/24 max-limit=10M/20M priority=4/4 \
  comment="VLAN10 IT : 10M envoi / 20M réception"
/queue simple add name=q-vlan20 target=192.168.20.0/24 max-limit=5M/10M priority=8/8 \
  comment="VLAN20 Hotspot : 5M envoi / 10M réception"`,

        R`# 2. Limite individuelle avec burst, enfant du VLAN10 (plafond du parent respecté)
# Le débit peut monter à 10M pendant 20 s tant que la moyenne reste sous 3M
/queue simple add name=client-demo target=192.168.10.50/32 parent=q-vlan10 \
  max-limit=5M/5M burst-limit=10M/10M burst-threshold=3M/3M burst-time=20s/20s \
  comment="Serveur interne : limite individuelle avec burst"`,

        R`# 3. Priorité : un poste critique passe avant les autres (1 = prioritaire, 8 = la plus basse)
/queue simple add name=poste-direction target=192.168.10.100/32 parent=q-vlan10 \
  max-limit=10M/20M priority=1/1 comment="Poste prioritaire"`,

        R`# 4. Hotspot : limiter par profil d'utilisateur (le routeur crée les queues dynamiquement)
# rate-limit = envoi du client / réception du client
/ip hotspot user profile add name=invite-5M rate-limit=2M/5M shared-users=1 \
  comment="Invités : 2M envoi / 5M réception, 1 appareil par compte"
/ip hotspot user set invite-demo profile=invite-5M`,

        R`# 5. L'ordre compte : placer une règle spécifique AVANT une règle générale
/queue simple print
/queue simple move [find where name=poste-direction] destination=0`,

        R`# 6. Observer les débits en direct et les compteurs
/queue simple print stats
/tool torch interface=vlan10-IT`
      ],
      winboxSteps: [
        "<span class='wb-path'>Queues → Simple Queues → [+]</span> → Name = <code>q-vlan10</code>, Target = <code>192.168.10.0/24</code>, onglet General : Max Limit Upload / Download",
        "Même démarche pour <code>q-vlan20</code> avec Priority plus basse (valeur 8)",
        "Queue individuelle : Target = <code>192.168.10.50/32</code>, Parent = <code>q-vlan10</code>, puis onglet <code>Advanced</code> pour Burst Limit, Burst Threshold et Burst Time",
        "<span class='wb-path'>IP → Hotspot → User Profiles → [+]</span> → Name = <code>invite-5M</code>, Rate Limit (rx/tx) = <code>2M/5M</code>, Shared Users = 1",
        "<span class='wb-path'>IP → Hotspot → Users</span> → affecter le profil <code>invite-5M</code> à l'utilisateur concerné",
        "Glisser-déposer les queues pour changer l'ordre d'évaluation (les spécifiques en haut)",
        "<span class='wb-path'>Queues → Simple Queues</span> → colonnes Rate et Queued Bytes pour contrôler l'effet en direct"
      ],
      diagram: "qos-simple",
      terminology: ["QoS", "Simple Queue", "Burst", "Rate limit", "Priorité de file", "Hotspot", "FastTrack"],
      concepts: [
        { term: "Simple Queue", def: "File de limitation associée à une cible (adresse ou réseau). Elle plafonne le débit dans les deux sens (max-limit envoi/réception) et peut garantir une part minimale (limit-at). Mise en place la plus rapide du QoS RouterOS." },
        { term: "Burst", def: "Autorisation de dépasser temporairement le plafond. Tant que le débit moyen des dernières secondes reste sous le seuil (burst-threshold), le client peut monter jusqu'à burst-limit pendant burst-time : les pages web s'ouvrent vite, les gros transferts sont bridés." },
        { term: "Hiérarchie parent / enfant", def: "Un enfant ne dépasse jamais le plafond de son parent. On définit une limite par VLAN, puis des limites par poste qui se partagent cette enveloppe." },
        { term: "Priorité", def: "De 1 (prioritaire) à 8. En cas de saturation, les files prioritaires sont servies d'abord. La priorité n'a d'effet que lorsque la liaison est pleine." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "FastTrack contourne les files d'attente : un trafic « fasttracké » n'est ni limité ni priorisé. Si votre routeur a la règle fasttrack de la configuration par défaut MikroTik, désactivez-la quand vous utilisez le QoS (voir section 22)." },
        { type: "warning", icon: "fa-gauge", text: "Les valeurs de débit sont des exemples. Réglez-les à environ 90 % du débit réellement mesuré de la liaison : trop haut, la file se forme chez l'opérateur et le QoS ne sert plus." },
        { type: "info", icon: "fa-circle-info", text: "Hotspot : les débits d'un profil créent des queues dynamiques automatiquement. Ne dupliquez pas la même limite dans une Simple Queue manuelle pour le même client." }
      ],
      table: {
        headers: ["Queue", "Cible", "Plafond (envoi / réception)", "Priorité"],
        rows: [
          ["q-vlan10", "192.168.10.0/24", "10M / 20M", "4"],
          ["q-vlan20", "192.168.20.0/24", "5M / 10M", "8"],
          ["client-demo", "192.168.10.50", "5M / 5M (burst 10M)", "héritée"],
          ["poste-direction", "192.168.10.100", "10M / 20M", "1"],
          ["Profil Hotspot invite-5M", "Utilisateurs authentifiés", "2M / 5M", "—"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "qos-pcq",
      track: "services",
      level: "avance",
      title: "QoS : PCQ, Queue Tree & FastTrack",
      icon: "fa-solid fa-scale-balanced",
      step: "22",
      requires: ["qos-simple"],
      description: "Partager équitablement la liaison sans régler chaque client à la main (PCQ), prioriser la voix sur le reste avec Queue Tree et marquage de paquets, puis traiter FastTrack, qui accélère le routage mais contourne les files d'attente et doit être désactivé quand le QoS est actif.",
      cliCommands: [
        R`# 1. Types de files PCQ : une sous-file équitable par client
# envoi → regroupement par adresse source ; réception → par adresse de destination
/queue type add name=pcq-up kind=pcq pcq-rate=0 pcq-classifier=src-address \
  pcq-limit=50KiB pcq-total-limit=2000KiB
/queue type add name=pcq-down kind=pcq pcq-rate=0 pcq-classifier=dst-address \
  pcq-limit=50KiB pcq-total-limit=2000KiB`,

        R`# 2. Équité pour tout le Hotspot : plafond global, partagé à parts égales entre les clients actifs
# queue=<type envoi>/<type réception>
# ⚠ Si vous utilisez ceci, retirez la queue manuelle q-vlan20 de la section 21 (même cible)
/queue simple add name=q-hotspot-pcq target=192.168.20.0/24 max-limit=10M/20M \
  queue=pcq-up/pcq-down comment="Hotspot : partage équitable (PCQ)"`,

        R`# 3. Marquer le trafic de voix sur IP (SIP et RTP) pour le prioriser en sortie
# passthrough=yes sur la connexion pour continuer à marquer les paquets
/ip firewall mangle add chain=prerouting protocol=udp port=5060,10000-20000 \
  action=mark-connection new-connection-mark=voip passthrough=yes comment="QOS: connexions VoIP"
/ip firewall mangle add chain=prerouting connection-mark=voip \
  action=mark-packet new-packet-mark=voip-pkt passthrough=no comment="QOS: paquets VoIP"`,

        R`# 4. Queue Tree en sortie WAN : la voix passe d'abord, le reste est partagé par PCQ
# ⚠ Adaptez max-limit à environ 90 % de votre débit d'envoi réel
/queue tree add name=up-total parent=ether1 max-limit=8M
/queue tree add name=up-voip parent=up-total packet-mark=voip-pkt priority=1 limit-at=2M max-limit=8M
/queue tree add name=up-reste parent=up-total packet-mark=no-mark priority=8 queue=pcq-up max-limit=8M`,

        R`# 5. FastTrack : à désactiver quand le QoS est actif (il contourne queues et marquage)
/ip firewall filter print where action=fasttrack-connection
/ip firewall filter disable [find where action=fasttrack-connection]`,

        R`# 6. Vérifier
/queue type print where kind=pcq
/queue tree print stats
/ip firewall mangle print stats where comment~"QOS"
/queue simple print stats where name=q-hotspot-pcq`
      ],
      winboxSteps: [
        "<span class='wb-path'>Queues → Queue Types → [+]</span> → Name = <code>pcq-up</code>, Kind = <code>pcq</code>, Classifier = Src. Address, Rate = 0 ; recommencer avec <code>pcq-down</code> et Dst. Address",
        "<span class='wb-path'>Queues → Simple Queues</span> → modifier la queue du Hotspot : onglet Advanced, Queue Type = <code>pcq-up / pcq-down</code>",
        "<span class='wb-path'>IP → Firewall → Mangle → [+]</span> → Chain = <code>prerouting</code>, Protocol = udp, Port = <code>5060,10000-20000</code>, Action = mark connection, Connection Mark = <code>voip</code>",
        "Deuxième règle Mangle : Connection Mark = <code>voip</code>, Action = mark packet, Packet Mark = <code>voip-pkt</code>, Passthrough décoché",
        "<span class='wb-path'>Queues → Queue Tree → [+]</span> → Name = <code>up-total</code>, Parent = <code>ether1</code>, Max Limit = 8M ; puis les files enfants <code>up-voip</code> et <code>up-reste</code> avec leurs Packet Marks",
        "<span class='wb-path'>IP → Firewall → Filter Rules</span> → repérer la règle d'action <code>fasttrack connection</code> et la désactiver (clic sur le X)",
        "<span class='wb-path'>Queues → Queue Tree</span> → colonnes Rate et Packets pour vérifier que la voix est bien classée"
      ],
      diagram: "qos-pcq",
      terminology: ["PCQ", "Queue Tree", "Packet mark", "Connection mark", "FastTrack", "Mangle", "QoS"],
      concepts: [
        { term: "PCQ (Per Connection Queuing)", def: "Crée dynamiquement une sous-file par adresse (source ou destination selon le classifieur) et partage le plafond à parts égales entre les clients actifs. Un client seul peut utiliser toute la liaison ; à dix, chacun obtient environ un dixième." },
        { term: "Marquage en deux temps", def: "On marque d'abord la connexion (une règle suffit à l'ouverture), puis tous ses paquets. C'est plus économe en CPU que de tester chaque paquet contre les critères d'origine." },
        { term: "Queue Tree", def: "Arbre de files rattachées à une interface ou à global, qui sélectionne le trafic par marque de paquet. Plus souple que les Simple Queues (priorités entre classes, débits garantis) mais plus verbeux à configurer." },
        { term: "FastTrack", def: "Raccourci qui fait traverser le routeur aux connexions établies sans repasser par le pare-feu, le mangle ni les queues. Il économise le CPU mais rend le QoS inopérant sur ces flux." }
      ],
      alerts: [
        { type: "warning", icon: "fa-tower-broadcast", text: "Le marquage de la voix par plages de ports (SIP 5060, RTP 10000-20000) est une approximation : les ports RTP varient selon le PBX ou le softphone. Adaptez la plage à votre équipement et vérifiez que les compteurs des règles QOS augmentent pendant un appel." },
        { type: "warning", icon: "fa-microchip", text: "Sur un routeur d'entrée de gamme (hAP), le PCQ et le Queue Tree consomment du CPU : surveillez /system resource print pendant un test de charge avant de généraliser." },
        { type: "info", icon: "fa-circle-info", text: "L'exemple Queue Tree ne traite que la sortie WAN (envoi), souvent le goulot sur une liaison asymétrique. Pour la réception, appliquez le même principe avec parent = interface LAN (vlan10-IT, vlan20-Hotspot) ou global." }
      ],
      table: {
        headers: ["Besoin", "Outil", "Pourquoi"],
        rows: [
          ["Limiter un réseau ou un poste précis", "Simple Queue", "Rapide, lisible"],
          ["Partager équitablement entre tous les clients", "Simple Queue + PCQ", "Sans une règle par client"],
          ["Prioriser la voix sur le reste", "Mangle + Queue Tree", "Priorités entre classes de trafic"],
          ["Économiser le CPU sans QoS", "FastTrack", "Incompatible avec les queues"]
        ]
      }
    }
  ]);
})();

// ═══════════════════════════════════════════════════════════════
// DATA — Parcours « Socle » (sections 00 à 10, v1.0/1.1)
// Format d'une section : voir docs/ARCHITECTURE.md
// ═══════════════════════════════════════════════════════════════
MK.addSections([
    {
      id: "introduction",
      track: "socle",
      level: "debutant",
      title: "Introduction",
      icon: "fa-solid fa-rocket",
      step: "00",
      description: "Ce guide vous accompagne pas à pas dans la configuration complète d'un routeur MikroTik. Que vous soyez technicien, administrateur réseau ou étudiant, vous trouverez ici les commandes CLI RouterOS, les équivalents WinBox, et les explications des concepts clés.",
      cliCommands: [],
      winboxSteps: [],
      concepts: [],
      diagram: "intro",
      terminology: ["RouterOS", "WinBox", "CLI", "Bridge", "VLAN", "Firewall", "DHCP", "NAT"],
      subsections: [
        {
          title: "Objectifs du guide",
          content: "Configurer un routeur MikroTik de A à Z : sécurisation, Wi-Fi, VLANs, adressage, DHCP, hotspot et pare-feu. Ce guide est structuré selon un ordre logique de déploiement."
        },
        {
          title: "Prérequis matériels",
          table: {
            headers: ["Élément", "Spécification"],
            rows: [
              ["Routeur MikroTik", "hAP ac², RB3011, CCR ou compatible RouterOS v7.x"],
              ["Câble Ethernet", "RJ45 Cat5e minimum pour connexion initiale"],
              ["PC de configuration", "Windows / Linux / macOS"],
              ["WinBox", "Téléchargeable sur mikrotik.com/download"]
            ]
          }
        },
        {
          title: "Accès initial",
          content: "Par défaut, le routeur MikroTik écoute sur <code>192.168.88.1</code>. L'utilisateur par défaut est <code>admin</code> sans mot de passe. Connectez-vous via WinBox (onglet Neighbors) ou SSH."
        }
      ]
    },
    {
      id: "securing",
      track: "socle",
      level: "debutant",
      title: "Prise en Main & Sécurisation",
      icon: "fa-solid fa-shield-halved",
      step: "01",
      description: "La première étape est de sécuriser l'accès au routeur. Nous créons un utilisateur administrateur fort, désactivons le compte admin par défaut, et limitons les services exposés pour réduire la surface d'attaque.",
      cliCommands: [
        "# 1. Créer un nouvel utilisateur administrateur\n# ⚠️ Remplacez <MOT_DE_PASSE_FORT> par un mot de passe robuste et unique\n/user add name=adm_network group=full password=<MOT_DE_PASSE_FORT>",
        "# 2. Désactiver le compte admin par défaut\n/user set admin disabled=yes",
        "# 3. Désactiver les services inutiles\n/ip service disable telnet,ftp,www,api,api-ssl",
        "# 4. Restreindre SSH et WinBox à un sous-réseau\n/ip service set ssh address=192.168.88.0/24 port=22\n/ip service set winbox address=192.168.88.0/24",
        "# 5. Protection brute-force SSH\n/ip ssh set strong-crypto=yes",
        "# 6. Définir le nom d'hôte\n/system identity set name=MK-CFP-CMD"
      ],
      winboxSteps: [
        "<span class='wb-path'>System → Users</span> → Cliquer sur [+] pour créer un nouvel utilisateur",
        "Renseigner : Name = <code>adm_network</code>, Group = <code>full</code>, Password = mot de passe fort",
        "<span class='wb-path'>System → Users</span> → Double-clic sur <code>admin</code> → Cocher Disabled",
        "<span class='wb-path'>IP → Services</span> → Désactiver Telnet, FTP, www, api",
        "<span class='wb-path'>IP → Services → SSH</span> → Saisir l'adresse autorisée dans le champ Available From",
        "<span class='wb-path'>System → Identity</span> → Modifier le nom du routeur"
      ],
      diagram: "securing",
      terminology: ["Brute force", "ACL", "Service hardening", "SSH", "WinBox", "Privilege escalation"],
      concepts: [
        { term: "Surface d'attaque", def: "Ensemble des points d'entrée exposés. La réduire limite les vecteurs d'attaque possibles." },
        { term: "Principe du moindre privilège", def: "N'accorder que les droits strictement nécessaires à chaque compte ou service." },
        { term: "Mot de passe fort", def: "Au moins 12 caractères, mélange majuscules/minuscules/chiffres/symboles, unique par équipement. Ne JAMAIS réutiliser les exemples de ce guide en production." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Déconnectez-vous APRÈS avoir vérifié que le nouvel utilisateur fonctionne. Ne jamais désactiver admin avant de valider le nouveau compte !" },
        { type: "warning", icon: "fa-key", text: "Les mots de passe de ce guide sont des PLACEHOLDERS (&lt;MOT_DE_PASSE_FORT&gt;, &lt;CLE_WIFI_FORTE&gt;). Remplacez-les systématiquement avant toute mise en production." },
        { type: "info", icon: "fa-circle-info", text: "WinBox se reconnecte automatiquement. Assurez-vous que votre IP est dans le sous-réseau autorisé avant de restreindre les services." }
      ]
    },
    {
      id: "bridge",
      track: "socle",
      level: "debutant",
      title: "Bridge & Assignation des Ports",
      icon: "fa-solid fa-circle-nodes",
      step: "02",
      description: "Un bridge (pont) regroupe plusieurs interfaces physiques pour qu'elles fonctionnent comme un commutateur logique unique. Toutes les interfaces LAN seront ajoutées au bridge-local.",
      cliCommands: [
        "# 1. Créer le bridge principal\n/interface bridge add name=bridge-local comment=\"Bridge LAN principal\"",
        "# 2. Ajouter les interfaces physiques au bridge\n/interface bridge port add bridge=bridge-local interface=ether2\n/interface bridge port add bridge=bridge-local interface=ether3\n/interface bridge port add bridge=bridge-local interface=ether4\n/interface bridge port add bridge=bridge-local interface=ether5",
        "# 3. Activer VLAN filtering sur le bridge\n/interface bridge set bridge-local vlan-filtering=yes",
        "# 4. Vérifier le bridge\n/interface bridge print\n/interface bridge port print"
      ],
      winboxSteps: [
        "<span class='wb-path'>Bridge → Bridge</span> → Cliquer sur [+]",
        "Name = <code>bridge-local</code> → OK",
        "<span class='wb-path'>Bridge → Ports</span> → Cliquer sur [+] pour chaque interface",
        "Interface = <code>ether2</code> (répéter pour ether3, ether4, ether5), Bridge = <code>bridge-local</code>",
        "<span class='wb-path'>Bridge → Bridge</span> → Double-clic sur bridge-local → Onglet VLANs → Cocher VLAN Filtering"
      ],
      diagram: "bridge",
      terminology: ["Bridge", "STP", "Interface", "Port", "VLAN filtering"],
      concepts: [
        { term: "VLAN Filtering", def: "Fonction du bridge qui active le traitement des tags 802.1Q sur les ports. Obligatoire pour les VLANs taggés." },
        { term: "STP", def: "Spanning Tree Protocol — évite les boucles de commutation dans un réseau bridgé." }
      ]
    },
    {
      id: "wifi",
      track: "socle",
      level: "debutant",
      title: "Configuration Wi-Fi",
      icon: "fa-solid fa-wifi",
      step: "03",
      description: "Configuration de l'interface sans fil avec sécurité WPA2-PSK, définition du SSID, de la fréquence et du mode AP, puis rattachement au bridge pour unifier filaire et sans-fil.",
      cliCommands: [
        "# 1. Créer un profil de sécurité WPA2\n# ⚠️ Remplacez <CLE_WIFI_FORTE> par une clé WPA2 robuste (min. 12 caractères)\n/interface wireless security-profiles add name=wifi-secure \\\n  mode=dynamic-keys wpa2-pre-shared-key=\"<CLE_WIFI_FORTE>\" \\\n  authentication-types=wpa2-psk",
        "# 2. Configurer l'interface Wi-Fi (2.4 GHz)\n/interface wireless set wlan1 \\\n  ssid=\"CFP-CMD-WiFi\" \\\n  mode=ap-bridge \\\n  band=2ghz-b/g/n \\\n  channel-width=20/40mhz-XX \\\n  frequency=auto \\\n  security-profile=wifi-secure \\\n  disabled=no",
        "# 3. Ajouter wlan1 au bridge\n/interface bridge port add bridge=bridge-local interface=wlan1",
        "# 4. (Optionnel) Interface 5 GHz\n/interface wireless set wlan2 \\\n  ssid=\"CFP-CMD-5G\" mode=ap-bridge \\\n  band=5ghz-a/n/ac security-profile=wifi-secure disabled=no\n/interface bridge port add bridge=bridge-local interface=wlan2"
      ],
      winboxSteps: [
        "<span class='wb-path'>Wireless → Security Profiles</span> → [+] → Name = <code>wifi-secure</code>, Mode = dynamic keys",
        "WPA2 Pre-Shared Key = votre mot de passe → OK",
        "<span class='wb-path'>Wireless → Interfaces → wlan1</span> → Double-clic",
        "Onglet Wireless : SSID = <code>CFP-CMD-WiFi</code>, Mode = ap bridge, Security Profile = wifi-secure",
        "Onglet Wireless : Band = 2GHz-B/G/N, Frequency = auto → Apply → OK",
        "<span class='wb-path'>Bridge → Ports</span> → [+] → Interface = wlan1, Bridge = bridge-local"
      ],
      diagram: "wifi",
      terminology: ["AP mode", "PSK", "AES", "SSID", "WPA2", "Band steering"],
      concepts: [
        { term: "AP Bridge mode", def: "Mode dans lequel l'interface Wi-Fi fonctionne comme point d'accès et peut être intégrée à un bridge." },
        { term: "WPA2-PSK", def: "Wi-Fi Protected Access 2 avec Pre-Shared Key. Standard de sécurité actuel pour les réseaux Wi-Fi." }
      ]
    },
    {
      id: "vlans",
      track: "socle",
      level: "intermediaire",
      title: "VLANs",
      icon: "fa-solid fa-layer-group",
      step: "04",
      description: "Segmentation du réseau en VLANs : VLAN10 pour l'IT (réseau interne), VLAN20 pour le Hotspot (accès invités contrôlé). Cette isolation améliore la sécurité et facilite la gestion du trafic.",
      cliCommands: [
        "# 1. Créer l'interface VLAN10 (IT)\n/interface vlan add name=vlan10-IT vlan-id=10 interface=bridge-local comment=\"VLAN IT\"",
        "# 2. Créer l'interface VLAN20 (Hotspot)\n/interface vlan add name=vlan20-Hotspot vlan-id=20 interface=bridge-local comment=\"VLAN Hotspot invités\"",
        "# 3. Configurer les VLANs sur le bridge (tagged/untagged)\n/interface bridge vlan add bridge=bridge-local vlan-ids=10 tagged=bridge-local,ether2\n/interface bridge vlan add bridge=bridge-local vlan-ids=20 tagged=bridge-local,ether2",
        "# 4. Configurer les ports untagged (access ports)\n/interface bridge port set [find interface=ether3] pvid=10\n/interface bridge port set [find interface=ether4] pvid=20",
        "# 5. Vérifier\n/interface vlan print\n/interface bridge vlan print"
      ],
      winboxSteps: [
        "<span class='wb-path'>Interfaces → [+] → VLAN</span>",
        "Name = <code>vlan10-IT</code>, VLAN ID = <code>10</code>, Interface = <code>bridge-local</code> → OK",
        "Répéter : Name = <code>vlan20-Hotspot</code>, VLAN ID = <code>20</code>, Interface = <code>bridge-local</code>",
        "<span class='wb-path'>Bridge → VLANs</span> → [+] → VLAN IDs = 10 → Tagged = bridge-local, ether2",
        "Répéter pour VLAN 20",
        "<span class='wb-path'>Bridge → Ports</span> → Double-clic ether3 → PVID = 10 ; ether4 → PVID = 20"
      ],
      diagram: "vlan",
      terminology: ["VLAN", "VLAN tagging", "802.1Q", "PVID", "Tagged", "Untagged", "Trunk port", "Access port"],
      concepts: [
        { term: "PVID", def: "Port VLAN ID — VLAN natif d'un port. Le trafic entrant non taggé est assigné à ce VLAN." },
        { term: "Trunk port", def: "Port qui transporte plusieurs VLANs simultanément via le tagging 802.1Q." }
      ]
    },
    {
      id: "addressing",
      track: "socle",
      level: "debutant",
      title: "Adressage IP",
      icon: "fa-solid fa-network-wired",
      step: "05",
      description: "Attribution des adresses IP aux interfaces VLAN. Chaque VLAN dispose de sa propre plage d'adresses et d'une gateway locale (le routeur lui-même sur chaque VLAN).",
      cliCommands: [
        "# Plan d'adressage\n# VLAN10 IT      : 192.168.10.0/24 → GW: 192.168.10.1\n# VLAN20 Hotspot : 192.168.20.0/24 → GW: 192.168.20.1\n# WAN (ether1)   : IP attribuée par le FAI (DHCP)",
        "# 1. IP sur VLAN10 (IT)\n/ip address add address=192.168.10.1/24 interface=vlan10-IT comment=\"GW VLAN IT\"",
        "# 2. IP sur VLAN20 (Hotspot)\n/ip address add address=192.168.20.1/24 interface=vlan20-Hotspot comment=\"GW VLAN Hotspot\"",
        "# 3. IP WAN via DHCP\n/ip dhcp-client add interface=ether1 disabled=no comment=\"WAN - FAI\"",
        "# 4. Vérifier les adresses\n/ip address print\n/ip dhcp-client print"
      ],
      winboxSteps: [
        "<span class='wb-path'>IP → Addresses → [+]</span>",
        "Address = <code>192.168.10.1/24</code>, Interface = <code>vlan10-IT</code> → OK",
        "Address = <code>192.168.20.1/24</code>, Interface = <code>vlan20-Hotspot</code> → OK",
        "<span class='wb-path'>IP → DHCP Client → [+]</span>",
        "Interface = <code>ether1</code> → OK (pour récupérer IP du FAI)"
      ],
      diagram: "addressing",
      terminology: ["CIDR", "Gateway", "Sous-réseau", "Interface virtuelle", "DHCP client", "FAI"],
      concepts: [
        { term: "CIDR", def: "Classless Inter-Domain Routing — notation /24 = 255.255.255.0, définit la taille du sous-réseau." },
        { term: "Gateway", def: "Passerelle par défaut — adresse IP du routeur qui achemine le trafic hors du sous-réseau local." }
      ],
      table: {
        headers: ["Interface", "Adresse IP", "Réseau", "Rôle"],
        rows: [
          ["vlan10-IT", "192.168.10.1/24", "192.168.10.0/24", "Gateway VLAN IT"],
          ["vlan20-Hotspot", "192.168.20.1/24", "192.168.20.0/24", "Gateway VLAN Hotspot"],
          ["ether1", "DHCP (FAI)", "WAN", "Accès Internet"]
        ]
      }
    },
    {
      id: "dhcp",
      track: "socle",
      level: "debutant",
      title: "DHCP",
      icon: "fa-solid fa-server",
      step: "06",
      description: "Configuration des serveurs DHCP pour chaque VLAN. Le routeur distribuera automatiquement des adresses IP, masques, gateways et serveurs DNS aux équipements clients.",
      cliCommands: [
        "# ─── VLAN10 (IT) ───────────────────────────────────────────────\n# 1. Pool d'adresses VLAN10\n/ip pool add name=pool-vlan10 ranges=192.168.10.100-192.168.10.200",
        "# 2. Serveur DHCP VLAN10\n/ip dhcp-server add name=dhcp-vlan10 \\\n  interface=vlan10-IT \\\n  address-pool=pool-vlan10 \\\n  lease-time=1d disabled=no",
        "# 3. Réseau DHCP VLAN10\n/ip dhcp-server network add \\\n  address=192.168.10.0/24 \\\n  gateway=192.168.10.1 \\\n  dns-server=8.8.8.8,1.1.1.1 \\\n  comment=\"Réseau VLAN IT\"",
        "# ─── VLAN20 (Hotspot) ──────────────────────────────────────────\n# 4. Pool d'adresses VLAN20\n/ip pool add name=pool-vlan20 ranges=192.168.20.100-192.168.20.250",
        "# 5. Serveur DHCP VLAN20\n/ip dhcp-server add name=dhcp-vlan20 \\\n  interface=vlan20-Hotspot \\\n  address-pool=pool-vlan20 \\\n  lease-time=2h disabled=no",
        "# 6. Réseau DHCP VLAN20\n/ip dhcp-server network add \\\n  address=192.168.20.0/24 \\\n  gateway=192.168.20.1 \\\n  dns-server=8.8.8.8,1.1.1.1 \\\n  comment=\"Réseau Hotspot invités\"",
        "# 7. Vérifier\n/ip dhcp-server print\n/ip dhcp-server lease print"
      ],
      winboxSteps: [
        "<span class='wb-path'>IP → Pool → [+]</span> → Name = <code>pool-vlan10</code>, Addresses = <code>192.168.10.100-192.168.10.200</code>",
        "Répéter : <code>pool-vlan20</code>, Addresses = <code>192.168.20.100-192.168.20.250</code>",
        "<span class='wb-path'>IP → DHCP Server → [+]</span> → Name = <code>dhcp-vlan10</code>, Interface = <code>vlan10-IT</code>",
        "Address Pool = <code>pool-vlan10</code>, Lease Time = <code>1d</code> → OK",
        "<span class='wb-path'>IP → DHCP Server → Networks → [+]</span>",
        "Address = <code>192.168.10.0/24</code>, Gateway = <code>192.168.10.1</code>, DNS = <code>8.8.8.8</code>",
        "Répéter les étapes 3-6 pour VLAN20 avec ses paramètres"
      ],
      diagram: "dhcp",
      terminology: ["DHCP", "DHCP lease", "Pool", "Broadcast", "DNS", "Lease time"],
      concepts: [
        { term: "DHCP lease", def: "Bail DHCP — durée pendant laquelle une adresse IP est réservée pour un client." },
        { term: "DHCP pool", def: "Plage d'adresses IP disponibles que le serveur DHCP peut distribuer aux clients." }
      ]
    },
    {
      id: "routing",
      track: "socle",
      level: "debutant",
      title: "Routage",
      icon: "fa-solid fa-route",
      step: "07",
      description: "Configuration de la route par défaut vers le WAN et activation du NAT (masquerading) pour permettre aux clients LAN d'accéder à Internet via l'IP publique du routeur.",
      cliCommands: [
        "# 1. Route par défaut (si WAN statique)\n# Note : si ether1 est en DHCP client, la route est automatique.\n/ip route add dst-address=0.0.0.0/0 gateway=<IP_GATEWAY_FAI> comment=\"Route par défaut WAN\"",
        "# 2. NAT Masquerade (Internet pour tous les LAN)\n/ip firewall nat add chain=srcnat \\\n  out-interface=ether1 \\\n  action=masquerade \\\n  comment=\"NAT - Accès Internet LAN\"",
        "# 3. Vérifier les routes\n/ip route print\n/ip firewall nat print"
      ],
      winboxSteps: [
        "<span class='wb-path'>IP → Routes → [+]</span>",
        "Dst. Address = <code>0.0.0.0/0</code>, Gateway = <code>IP_GATEWAY_FAI</code> → OK",
        "<span class='wb-path'>IP → Firewall → NAT → [+]</span>",
        "Chain = <code>srcnat</code>, Out. Interface = <code>ether1</code>",
        "Onglet Action : Action = <code>masquerade</code> → OK"
      ],
      diagram: "routing",
      terminology: ["Route statique", "Route par défaut", "Next-hop", "NAT", "Masquerade", "Gateway FAI"],
      concepts: [
        { term: "Masquerade", def: "Forme de NAT dynamique — remplace l'IP source des paquets sortants par l'IP WAN du routeur." },
        { term: "Route par défaut (0.0.0.0/0)", def: "Route utilisée pour tout trafic dont la destination ne correspond à aucune route plus spécifique." }
      ],
      alerts: [
        { type: "info", icon: "fa-circle-info", text: "Si ether1 est configuré en DHCP Client, la route par défaut est ajoutée automatiquement. Vérifiez avec /ip route print avant d'en ajouter une manuellement." }
      ]
    },
    {
      id: "hotspot",
      track: "socle",
      level: "intermediaire",
      title: "Hotspot & Contrôle Partage",
      icon: "fa-solid fa-satellite-dish",
      step: "08",
      description: "Configuration du serveur Hotspot sur le VLAN20 pour les invités avec portail captif d'authentification. Ajout du blocage du tethering via filtrage TTL pour empêcher le partage de connexion non autorisé.",
      cliCommands: [
        "# ─── HOTSPOT ────────────────────────────────────────────────────\n# 1. Configurer le serveur Hotspot sur VLAN20\n/ip hotspot setup\n# Répondre aux questions :\n# hotspot interface: vlan20-Hotspot\n# local address: 192.168.20.1\n# masquerade: yes\n# pool: 192.168.20.100-192.168.20.250\n# DNS: 8.8.8.8",
        "# 2. Créer un utilisateur hotspot de test\n# ⚠️ Compte de démonstration — changez le mot de passe en production\n/ip hotspot user add name=invite-demo password=<MOT_DE_PASSE_INVITE> comment=\"Utilisateur invité test\"",
        "# 3. Personnaliser le profil hotspot\n/ip hotspot profile set [find default=yes] \\\n  login-by=http-chap \\\n  http-cookie-lifetime=1d \\\n  html-directory=hotspot",
        "# ─── BLOCAGE TETHERING (TTL Filtering) ──────────────────────────\n# 4. Marquer les paquets TTL <= 1 (tethering détecté)\n/ip firewall mangle add chain=prerouting \\\n  in-interface=vlan20-Hotspot \\\n  ttl=less-than:2 \\\n  action=mark-packet new-packet-mark=tethering passthrough=no",
        "# 5. Bloquer les paquets marqués comme tethering\n/ip firewall filter add chain=forward \\\n  packet-mark=tethering \\\n  action=drop \\\n  comment=\"Blocage tethering VLAN20\""
      ],
      winboxSteps: [
        "<span class='wb-path'>IP → Hotspot → Setup</span> → Sélectionner <code>vlan20-Hotspot</code> comme interface",
        "Suivre l'assistant : adresse locale, pool DHCP, DNS → Terminer",
        "<span class='wb-path'>IP → Hotspot → Users → [+]</span> → Name = <code>invite-demo</code>, Password = <code>&lt;MOT_DE_PASSE_INVITE&gt;</code> (compte de démonstration)",
        "<span class='wb-path'>IP → Firewall → Mangle → [+]</span>",
        "Chain = <code>prerouting</code>, In. Interface = <code>vlan20-Hotspot</code>, TTL = less than 2",
        "Action = mark packet, New Mark = <code>tethering</code>",
        "<span class='wb-path'>IP → Firewall → Filter → [+]</span> Chain = forward, Packet Mark = <code>tethering</code>, Action = drop"
      ],
      diagram: "hotspot",
      terminology: ["Portail captif", "TTL", "Mangle", "Tethering", "Hotspot", "HTTP-CHAP"],
      concepts: [
        { term: "Portail captif", def: "Page web d'authentification affichée avant tout accès Internet. Les clients doivent s'authentifier pour naviguer." },
        { term: "TTL (Time To Live)", def: "Compteur decrementé à chaque saut réseau. Le tethering produit des paquets avec TTL diminué (téléphone → ordinateur)." }
      ]
    },
    {
      id: "firewall",
      track: "socle",
      level: "intermediaire",
      title: "Pare-feu (Firewall)",
      icon: "fa-solid fa-fire",
      step: "09",
      description: "Mise en place des règles de pare-feu pour protéger le routeur (chaîne INPUT) et contrôler le trafic inter-VLAN (chaîne FORWARD). VLAN10 a accès complet ; VLAN20 est limité au WAN uniquement.",
      cliCommands: [
        "# ─── CHAÎNE INPUT (Protection du routeur) ───────────────────────\n# 1. Accepter connexions établies/reliées\n/ip firewall filter add chain=input \\\n  connection-state=established,related \\\n  action=accept comment=\"Accept established/related\"",
        "# 2. Rejeter les invalides\n/ip firewall filter add chain=input \\\n  connection-state=invalid \\\n  action=drop comment=\"Drop invalides\"",
        "# 3. Autoriser ICMP (ping)\n/ip firewall filter add chain=input \\\n  protocol=icmp action=accept comment=\"Accept ICMP\"",
        "# 4. Autoriser accès admin depuis VLAN10 uniquement\n/ip firewall filter add chain=input \\\n  src-address=192.168.10.0/24 \\\n  action=accept comment=\"Admin depuis VLAN IT\"",
        "# 5. Bloquer tout autre accès au routeur\n/ip firewall filter add chain=input \\\n  action=drop comment=\"Drop tout autre INPUT\"",
        "# ─── CHAÎNE FORWARD (Inter-VLAN) ────────────────────────────────\n# 6. Accepter connexions établies\n/ip firewall filter add chain=forward \\\n  connection-state=established,related \\\n  action=accept comment=\"Accept forward established\"",
        "# 7. VLAN10 → tout (accès complet)\n/ip firewall filter add chain=forward \\\n  src-address=192.168.10.0/24 \\\n  action=accept comment=\"VLAN10 IT - accès complet\"",
        "# 8. VLAN20 → WAN uniquement (bloquer accès au LAN)\n/ip firewall filter add chain=forward \\\n  src-address=192.168.20.0/24 \\\n  dst-address=192.168.10.0/24 \\\n  action=drop comment=\"VLAN20 → VLAN10 interdit\"",
        "# 9. Autoriser VLAN20 → WAN\n/ip firewall filter add chain=forward \\\n  src-address=192.168.20.0/24 \\\n  out-interface=ether1 \\\n  action=accept comment=\"VLAN20 Hotspot → WAN uniquement\"",
        "# 10. Drop le reste\n/ip firewall filter add chain=forward \\\n  action=drop comment=\"Drop forward non autorisé\""
      ],
      winboxSteps: [
        "<span class='wb-path'>IP → Firewall → Filter Rules → [+]</span>",
        "Chain = <code>input</code>, Connection State = established, related → Action = accept",
        "Chain = <code>input</code>, Connection State = invalid → Action = drop",
        "Chain = <code>input</code>, Protocol = icmp → Action = accept",
        "Chain = <code>input</code>, Src. Address = <code>192.168.10.0/24</code> → Action = accept",
        "Chain = <code>input</code> → Action = drop (règle finale)",
        "Chain = <code>forward</code>, Src. Address = <code>192.168.10.0/24</code> → Action = accept",
        "Chain = <code>forward</code>, Src = <code>192.168.20.0/24</code>, Dst = <code>192.168.10.0/24</code> → Action = drop",
        "Chain = <code>forward</code>, Src = <code>192.168.20.0/24</code>, Out-Interface = <code>ether1</code> → Action = accept"
      ],
      diagram: "firewall",
      terminology: ["Firewall", "Chaîne (Input/Forward/Output)", "Stateful firewall", "NAT", "Connection state", "ACL"],
      concepts: [
        { term: "Stateful Firewall", def: "Pare-feu qui suit l'état des connexions (established, related, new, invalid) pour prendre ses décisions." },
        { term: "Chaîne INPUT", def: "Traite les paquets destinés au routeur lui-même (SSH, WinBox, ping vers le routeur)." },
        { term: "Chaîne FORWARD", def: "Traite les paquets qui traversent le routeur d'une interface à une autre (trafic inter-VLAN)." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "L'ordre des règles est CRUCIAL dans MikroTik. Les règles sont évaluées de haut en bas ; la première correspondance gagne." },
        { type: "info", icon: "fa-circle-info", text: "Toujours placer les règles 'accept established/related' en premier pour les performances. Cela évite de ré-évaluer les connexions actives." }
      ]
    },
    {
      id: "validation",
      track: "socle",
      level: "debutant",
      title: "Validation & Tests",
      icon: "fa-solid fa-vial-circle-check",
      step: "10",
      description: "Vérification complète de la configuration. Tests de connectivité, validation des règles de firewall, et checklist de déploiement pour s'assurer que tout fonctionne correctement.",
      cliCommands: [
        "# 1. Vérifier toutes les interfaces\n/interface print\n/interface bridge print\n/interface vlan print",
        "# 2. Vérifier les adresses IP\n/ip address print\n/ip route print",
        "# 3. Test de connectivité WAN\n/ping 8.8.8.8 count=3\n/ping google.com count=3",
        "# 4. Vérifier les baux DHCP\n/ip dhcp-server lease print",
        "# 5. Vérifier les règles Firewall\n/ip firewall filter print stats\n/ip firewall nat print",
        "# 6. Test de log en temps réel\n/log print follow-only",
        "# 7. Export de la configuration complète\n/export file=backup-cfp-cmd-$(date)\n# Ou depuis WinBox : Files → Télécharger le fichier .rsc"
      ],
      winboxSteps: [
        "<span class='wb-path'>Tools → Ping</span> → Tester vers 8.8.8.8 depuis le routeur",
        "<span class='wb-path'>IP → DHCP Server → Leases</span> → Vérifier les baux attribués",
        "<span class='wb-path'>IP → Firewall → Filter</span> → Vérifier les compteurs de paquets (Bytes/Packets)",
        "<span class='wb-path'>Log</span> → Surveiller les erreurs en temps réel",
        "<span class='wb-path'>Files</span> → Vérifier le fichier backup généré",
        "<span class='wb-path'>System → Backup → Backup</span> → Sauvegarder la configuration"
      ],
      diagram: "validation",
      terminology: ["Ping", "Traceroute", "Log", "Backup", "Export", "Lease"],
      concepts: [
        { term: "Export .rsc", def: "Fichier texte RouterOS contenant toutes les commandes de configuration. Permet la restauration ou la documentation." }
      ],
      alerts: [
        { type: "success", icon: "fa-circle-check", text: "Configuration terminée ! Pensez à sauvegarder avec /export et à stocker le fichier hors du routeur." },
        { type: "warning", icon: "fa-triangle-exclamation", text: "Testez TOUS les scénarios : client VLAN10 → Internet, client VLAN20 → Portail Hotspot, VLAN20 ↛ VLAN10." }
      ],
      table: {
        headers: ["Test", "Commande/Action", "Résultat attendu"],
        rows: [
          ["Ping WAN", "/ping 8.8.8.8", "Réponse < 50ms"],
          ["DNS", "/ping google.com", "Résolution + réponse"],
          ["DHCP VLAN10", "Brancher PC sur ether3", "IP 192.168.10.x attribuée"],
          ["DHCP VLAN20", "Brancher PC sur ether4", "Redirection portail hotspot"],
          ["Isolation VLAN", "Ping 192.168.10.1 depuis VLAN20", "Timeout (DROP)"],
          ["Hotspot auth", "Naviguer depuis VLAN20", "Portail captif affiché"]
        ]
      }
    }
  
]);

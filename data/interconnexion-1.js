// ═══════════════════════════════════════════════════════════════
// DATA — Parcours « VPN & interconnexion » (lot v1.4) — partie 1/2
//   23 WireGuard accès distant · 24 WireGuard site-à-site · 25 IPsec IKEv2 site-à-site
// Plan utilisé : siège 192.168.10.0/24 (VLAN IT), site B 192.168.40.0/24 (fictif),
// accès distant 10.10.10.0/24, tunnel inter-sites 10.20.0.0/30.
// ═══════════════════════════════════════════════════════════════
(function () {
  const R = String.raw;

  MK.addSections([
    // ───────────────────────────────────────────────────────────
    {
      id: "wireguard",
      track: "interconnexion",
      level: "intermediaire",
      title: "WireGuard : accès distant sécurisé",
      icon: "fa-solid fa-key",
      step: "23",
      requires: ["firewall", "securing"],
      description: "Donner à un administrateur ou à un enseignant en télétravail un accès chiffré au VLAN IT, sans jamais exposer SSH ni WinBox sur Internet. WireGuard n'ouvre qu'un seul port UDP, ne répond pas aux inconnus et s'installe en quelques commandes sur RouterOS 7.",
      cliCommands: [
        R`# 1. Interface WireGuard du routeur (la clé privée est générée automatiquement)
/interface wireguard add name=wg-acces listen-port=51820 comment="Accès distant"
/ip address add address=10.10.10.1/24 interface=wg-acces comment="WG accès distant"
# Clé PUBLIQUE du routeur, à copier dans la configuration du client
:put [/interface wireguard get wg-acces public-key]`,

        R`# 2. Sur le POSTE CLIENT (Linux) : générer sa paire de clés — ce n'est pas une commande RouterOS
# wg genkey | tee client.key | wg pubkey > client.pub
# Applications Windows, macOS, Android et iOS : le bouton « Ajouter un tunnel vide » génère la paire.
# La clé PRIVÉE ne quitte jamais le poste client.`,

        R`# 3. Déclarer le client (pair) : une adresse unique dans le tunnel
# ⚠ Remplacez <CLE_PUBLIQUE_CLIENT> par la clé publique du client
/interface wireguard peers add interface=wg-acces public-key="<CLE_PUBLIQUE_CLIENT>" \
  allowed-address=10.10.10.2/32 comment="PC admin (télétravail)"`,

        R`# 4. Pare-feu : ouvrir UNIQUEMENT le port WireGuard sur le WAN, puis limiter ce que le tunnel peut atteindre
/ip firewall filter add chain=input in-interface=ether1 protocol=udp dst-port=51820 action=accept \
  place-before=[find where comment="Drop tout autre INPUT"] comment="WireGuard accès distant"
/ip firewall filter add chain=input in-interface=wg-acces protocol=tcp dst-port=22,8291 action=accept \
  place-before=[find where comment="Drop tout autre INPUT"] comment="Admin SSH/WinBox via WireGuard"
/ip firewall filter add chain=input in-interface=wg-acces protocol=udp dst-port=53 action=accept \
  place-before=[find where comment="Drop tout autre INPUT"] comment="DNS via WireGuard"
/ip firewall filter add chain=forward in-interface=wg-acces dst-address=192.168.10.0/24 action=accept \
  place-before=[find where comment="Drop forward non autorisé"] comment="WireGuard -> VLAN10"`,

        R`# 5. Autoriser les réseaux réellement utilisés à joindre SSH et WinBox
# ⚠ La section 01 a limité ces services à 192.168.88.0/24 (réseau par défaut avant les VLANs) :
# sans cette correction, l'accès depuis le VLAN IT et depuis le tunnel est refusé par le service lui-même
/ip service set ssh address=192.168.10.0/24,10.10.10.0/24
/ip service set winbox address=192.168.10.0/24,10.10.10.0/24`,

        R`# 6. (Optionnel) Nom stable si l'adresse WAN change
# ⚠ La section 15 avait désactivé le cloud MikroTik : le réactiver implique un échange avec ses serveurs
/ip cloud set ddns-enabled=yes
/ip cloud print`,

        R`# 7. Fichier de configuration du CLIENT (wg-quick / application WireGuard) — pas une commande RouterOS
# [Interface]
# PrivateKey = <CLE_PRIVEE_CLIENT>
# Address = 10.10.10.2/32
# DNS = 192.168.10.1
# [Peer]
# PublicKey = <CLE_PUBLIQUE_ROUTEUR>
# Endpoint = <ADRESSE_WAN_OU_DDNS>:51820
# AllowedIPs = 192.168.10.0/24, 10.10.10.0/24
# PersistentKeepalive = 25`,

        R`# 8. Vérifier : une poignée de main récente prouve que le tunnel fonctionne
/interface wireguard print
/interface wireguard peers print detail
/ip firewall filter print stats where comment~"WireGuard"`
      ],
      winboxSteps: [
        "<span class='wb-path'>WireGuard → [+]</span> → Name = <code>wg-acces</code>, Listen Port = <code>51820</code> ; la clé publique s'affiche dans la liste",
        "<span class='wb-path'>IP → Addresses → [+]</span> → <code>10.10.10.1/24</code> sur l'interface <code>wg-acces</code>",
        "<span class='wb-path'>WireGuard → onglet Peers → [+]</span> → Interface = <code>wg-acces</code>, Public Key = clé du client, Allowed Address = <code>10.10.10.2/32</code>",
        "<span class='wb-path'>IP → Firewall → Filter Rules</span> → règle <code>input</code> UDP 51820 depuis ether1, puis règles <code>input</code> (tcp 22 et 8291, udp 53) depuis <code>wg-acces</code>, toutes au-dessus du drop final",
        "Règle <code>forward</code> : In. Interface = <code>wg-acces</code>, Dst. Address = <code>192.168.10.0/24</code>, Action = accept, au-dessus du drop final",
        "<span class='wb-path'>IP → Services</span> → double-clic sur <code>ssh</code> puis <code>winbox</code> → Available From = <code>192.168.10.0/24, 10.10.10.0/24</code>",
        "Sur le client : importer la configuration, activer le tunnel, puis tester <code>ping 192.168.10.1</code> et l'ouverture de WinBox"
      ],
      diagram: "wireguard",
      terminology: ["WireGuard", "Clé publique / privée", "Allowed address", "Handshake WireGuard", "Keepalive", "Road-warrior", "Split tunnel", "DDNS", "Safe Mode"],
      concepts: [
        { term: "Cryptographie par clés", def: "Chaque extrémité possède une clé privée (secrète) et une clé publique (partageable). On échange uniquement les clés publiques. Sans la bonne clé, le routeur ne répond tout simplement pas : le port apparaît fermé à un scan." },
        { term: "Allowed address", def: "Pour un pair, liste des adresses qu'il a le droit d'utiliser comme source. Elle joue aussi le rôle de table de routage du tunnel : un paquet n'est envoyé à un pair que si sa destination est dans ses allowed-address. Une adresse /32 par client est la règle." },
        { term: "Split tunnel et full tunnel", def: "Avec AllowedIPs limité aux réseaux du siège (192.168.10.0/24), seul le trafic d'entreprise passe par le tunnel (split tunnel). Avec 0.0.0.0/0, tout le trafic du client transite par le siège : il faut alors ajouter du NAT et des règles forward." },
        { term: "Pourquoi pas WinBox sur Internet ?", def: "Exposer WinBox ou SSH multiplie les attaques. Avec WireGuard, seul un port UDP muet est visible ; l'administration passe ensuite dans le tunnel, hors de portée des scanners." }
      ],
      alerts: [
        { type: "warning", icon: "fa-globe", text: "CGNAT et accès 4G : si le routeur n'a pas d'adresse publique joignable, les clients ne peuvent pas atteindre le port 51820. Il faut alors un serveur relais (VPS) auquel le routeur se connecte en sortie, ou un opérateur offrant une adresse publique." },
        { type: "warning", icon: "fa-triangle-exclamation", text: "Travaillez en Safe Mode (section 11) pour l'étape 5 : une mauvaise liste d'adresses sur les services peut vous couper l'accès. Les placeholders &lt;CLE_PUBLIQUE_CLIENT&gt;, &lt;CLE_PRIVEE_CLIENT&gt; et &lt;CLE_PUBLIQUE_ROUTEUR&gt; sont à remplacer ; ne partagez jamais une clé privée par messagerie." },
        { type: "info", icon: "fa-circle-info", text: "Le MTU par défaut de WireGuard (1420 octets) convient à la plupart des accès. Si certains sites web se chargent mal dans le tunnel, voir le réglage MSS de la section 24." }
      ],
      table: {
        headers: ["Élément", "Valeur dans ce guide", "Remarque"],
        rows: [
          ["Port d'écoute", "UDP 51820 (WAN)", "Seul port exposé"],
          ["Réseau du tunnel", "10.10.10.0/24", "Routeur = .1, premier client = .2"],
          ["Réseau atteint", "192.168.10.0/24", "VLAN IT uniquement, pas le Hotspot"],
          ["Services accessibles", "SSH 22, WinBox 8291, DNS 53", "Via les règles input restreintes"],
          ["Clé privée du client", "Reste sur le poste du client", "Jamais envoyée au routeur"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "site-to-site",
      track: "interconnexion",
      level: "intermediaire",
      title: "Interconnexion de deux sites avec WireGuard",
      icon: "fa-solid fa-diagram-project",
      step: "24",
      requires: ["wireguard"],
      description: "Relier le réseau du siège à celui d'un site distant par un tunnel WireGuard permanent : plan d'adressage sans chevauchement, déclaration des pairs, routes statiques, règles de pare-feu, ajustement du MSS et tests de bout en bout. Les commandes sont données pour chaque extrémité.",
      cliCommands: [
        R`# ═══ SITE A (siège) — 192.168.10.0/24 — adresse publique joignable ═══
# 1. Interface et adresse du tunnel
/interface wireguard add name=wg-site listen-port=51821 comment="Tunnel vers site B"
/ip address add address=10.20.0.1/30 interface=wg-site comment="Tunnel site A"
:put [/interface wireguard get wg-site public-key]`,

        R`# 2. Site A : déclarer le pair B et router son réseau à travers le tunnel
# ⚠ Remplacez <CLE_PUBLIQUE_SITE_B> par la clé publique du routeur B
/interface wireguard peers add interface=wg-site public-key="<CLE_PUBLIQUE_SITE_B>" \
  allowed-address=10.20.0.2/32,192.168.40.0/24 comment="Site B"
/ip route add dst-address=192.168.40.0/24 gateway=wg-site comment="Vers site B"`,

        R`# 3. Site A : pare-feu (port du tunnel + trafic entrant du site B vers le VLAN10)
/ip firewall filter add chain=input in-interface=ether1 protocol=udp dst-port=51821 action=accept \
  place-before=[find where comment="Drop tout autre INPUT"] comment="WireGuard site-à-site"
/ip firewall filter add chain=forward in-interface=wg-site dst-address=192.168.10.0/24 action=accept \
  place-before=[find where comment="Drop forward non autorisé"] comment="Site B -> VLAN10"`,

        R`# ═══ SITE B (distant) — 192.168.40.0/24 — peut être derrière un NAT ═══
# 4. Interface et adresse du tunnel
/interface wireguard add name=wg-site listen-port=51821 comment="Tunnel vers siège"
/ip address add address=10.20.0.2/30 interface=wg-site comment="Tunnel site B"
:put [/interface wireguard get wg-site public-key]`,

        R`# 5. Site B : pair A (c'est B qui initie la connexion) et route vers le siège
# ⚠ Remplacez <CLE_PUBLIQUE_SITE_A> et <IP_PUBLIQUE_SITE_A>
/interface wireguard peers add interface=wg-site public-key="<CLE_PUBLIQUE_SITE_A>" \
  allowed-address=10.20.0.1/32,192.168.10.0/24 endpoint-address=<IP_PUBLIQUE_SITE_A> \
  endpoint-port=51821 persistent-keepalive=25s comment="Siège"
/ip route add dst-address=192.168.10.0/24 gateway=wg-site comment="Vers siège"`,

        R`# 6. Site B : autoriser le trafic venant du siège vers son LAN (adaptez au pare-feu local)
/ip firewall filter add chain=forward in-interface=wg-site dst-address=192.168.40.0/24 action=accept \
  place-before=[find where comment="Drop forward non autorisé"] comment="Siège -> LAN site B"`,

        R`# 7. Les DEUX sites : ajuster le MSS TCP pour éviter la fragmentation dans le tunnel (MTU 1420)
/ip firewall mangle add chain=forward protocol=tcp tcp-flags=syn out-interface=wg-site \
  tcp-mss=1381-65535 action=change-mss new-mss=1380 passthrough=yes comment="MSS tunnel"`,

        R`# 8. Tester de bout en bout (depuis le site A ; le NAT n'intervient pas sur le trafic du tunnel)
/interface wireguard peers print detail
/ping 10.20.0.2 count=3
/ping 192.168.40.1 src-address=192.168.10.1 count=3
/tool traceroute 192.168.40.1`
      ],
      winboxSteps: [
        "Site A : <span class='wb-path'>WireGuard → [+]</span> → Name = <code>wg-site</code>, Listen Port = <code>51821</code> ; <span class='wb-path'>IP → Addresses</span> → <code>10.20.0.1/30</code>",
        "Site A : onglet <code>Peers</code> → clé publique de B, Allowed Address = <code>10.20.0.2/32, 192.168.40.0/24</code>",
        "Site A : <span class='wb-path'>IP → Routes → [+]</span> → Dst. Address = <code>192.168.40.0/24</code>, Gateway = <code>wg-site</code>",
        "Site B : mêmes étapes avec l'adresse <code>10.20.0.2/30</code>, et dans le pair : Endpoint = IP publique de A, Endpoint Port = <code>51821</code>, Persistent Keepalive = <code>25</code>",
        "Pare-feu des deux sites : règle <code>input</code> UDP 51821 (site A) et règles <code>forward</code> depuis <code>wg-site</code> vers le LAN local",
        "<span class='wb-path'>IP → Firewall → Mangle → [+]</span> → Chain = forward, Protocol = tcp, TCP Flags = syn, Out. Interface = <code>wg-site</code>, Action = <code>change MSS</code>, New MSS = 1380",
        "<span class='wb-path'>WireGuard → Peers</span> → vérifier la colonne <code>Last Handshake</code> (quelques secondes à quelques minutes) puis lancer les tests de ping"
      ],
      diagram: "site-to-site",
      terminology: ["Site-à-site", "Allowed address", "Keepalive", "MSS clamping", "Route statique", "Handshake WireGuard"],
      concepts: [
        { term: "Plan d'adressage sans chevauchement", def: "Chaque site doit avoir un réseau distinct (192.168.10.0/24 d'un côté, 192.168.40.0/24 de l'autre). Si deux sites utilisent le même réseau, aucune route ne peut décider où envoyer un paquet : il faut renuméroter l'un des deux." },
        { term: "Qui initie le tunnel ?", def: "Un seul côté doit être joignable (A, avec adresse publique). L'autre (B) peut être derrière un NAT : il ouvre le tunnel et le garde actif grâce au keepalive de 25 secondes, ce qui maintient la translation NAT en place." },
        { term: "Routes et allowed-address", def: "Deux éléments sont nécessaires : la route (le routeur sait que 192.168.40.0/24 se trouve derrière wg-site) et l'allowed-address (le pair a le droit de transporter ce réseau). L'oubli de l'un des deux est la panne la plus fréquente." },
        { term: "Pas de NAT dans le tunnel", def: "Le masquerade de la section 07 ne s'applique qu'à la sortie ether1. Le trafic vers le site distant conserve donc ses vraies adresses, ce qui permet aux serveurs de journaliser l'origine réelle des connexions." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Le site B est fictif (192.168.40.0/24) : adaptez les adresses à votre second site. Les placeholders &lt;CLE_PUBLIQUE_SITE_A&gt;, &lt;CLE_PUBLIQUE_SITE_B&gt; et &lt;IP_PUBLIQUE_SITE_A&gt; sont à remplacer avant exécution." },
        { type: "warning", icon: "fa-globe", text: "Les deux sites derrière un CGNAT ne peuvent pas se joindre directement : au moins un côté doit offrir une adresse publique accessible, sinon passez par un relais." },
        { type: "info", icon: "fa-circle-info", text: "Pour plusieurs sites, remplacez les routes statiques par un protocole de routage dynamique (OSPF, prévu au lot v2.0). Le tunnel WireGuard reste le même." }
      ],
      table: {
        headers: ["Paramètre", "Site A (siège)", "Site B (distant)"],
        rows: [
          ["Réseau LAN", "192.168.10.0/24", "192.168.40.0/24"],
          ["Adresse du tunnel", "10.20.0.1/30", "10.20.0.2/30"],
          ["Port d'écoute", "51821 (ouvert au WAN)", "51821 (local, non exposé)"],
          ["Endpoint du pair", "Non nécessaire", "IP publique de A, port 51821"],
          ["Route statique", "192.168.40.0/24 via wg-site", "192.168.10.0/24 via wg-site"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "ipsec-site",
      track: "interconnexion",
      level: "avance",
      title: "IPsec IKEv2 : tunnel site-à-site",
      icon: "fa-solid fa-lock",
      step: "25",
      requires: ["site-to-site", "raw-firewall"],
      description: "IPsec est le standard d'interconnexion pris en charge par presque tous les équipements (pare-feu, routeurs d'opérateur, Windows Server). On configure un tunnel IKEv2 avec clé partagée : profil, proposition, pair, identité et politique, puis les exceptions NAT, pare-feu et RAW indispensables à son fonctionnement.",
      cliCommands: [
        R`# ═══ SITE A (siège) — LAN 192.168.10.0/24 — adresse publique FIXE ═══
# 1. Profil IKE (phase 1) et proposition ESP (phase 2) : AES-256, SHA-256, groupe DH 14
/ip ipsec profile add name=prof-s2s hash-algorithm=sha256 enc-algorithm=aes-256 dh-group=modp2048 \
  lifetime=1d nat-traversal=yes
/ip ipsec proposal add name=prop-s2s auth-algorithms=sha256 enc-algorithms=aes-256-cbc \
  lifetime=30m pfs-group=modp2048`,

        R`# 2. Pair distant, identité (clé partagée) et politique de chiffrement
# ⚠ Remplacez <IP_PUBLIQUE_SITE_B>, <IP_PUBLIQUE_SITE_A> et <SECRET_IPSEC> (clé longue et aléatoire)
/ip ipsec peer add name=peer-siteB address=<IP_PUBLIQUE_SITE_B>/32 profile=prof-s2s exchange-mode=ike2
/ip ipsec identity add peer=peer-siteB auth-method=pre-shared-key secret="<SECRET_IPSEC>"
/ip ipsec policy add src-address=192.168.10.0/24 dst-address=192.168.40.0/24 \
  sa-src-address=<IP_PUBLIQUE_SITE_A> sa-dst-address=<IP_PUBLIQUE_SITE_B> \
  tunnel=yes action=encrypt proposal=prop-s2s peer=peer-siteB`,

        R`# 3. NE PAS traduire (NAT) le trafic du tunnel : règle placée AVANT le masquerade de la section 07
/ip firewall nat add chain=srcnat src-address=192.168.10.0/24 dst-address=192.168.40.0/24 \
  action=accept place-before=[find where comment~"Internet LAN"] comment="Pas de NAT vers site B"`,

        R`# 4. Pare-feu : IKE (UDP 500), NAT-T (UDP 4500) et ESP, puis le trafic réellement chiffré
/ip firewall filter add chain=input in-interface=ether1 protocol=udp dst-port=500,4500 action=accept \
  place-before=[find where comment="Drop tout autre INPUT"] comment="IPsec IKE / NAT-T"
/ip firewall filter add chain=input in-interface=ether1 protocol=ipsec-esp action=accept \
  place-before=[find where comment="Drop tout autre INPUT"] comment="IPsec ESP"
/ip firewall filter add chain=forward ipsec-policy=in,ipsec action=accept \
  place-before=[find where comment="Drop forward non autorisé"] comment="Trafic IPsec entrant"
/ip firewall filter add chain=forward ipsec-policy=out,ipsec action=accept \
  place-before=[find where comment="Drop forward non autorisé"] comment="Trafic IPsec sortant"`,

        R`# 5. RAW : le trafic déchiffré arrive « par ether1 » avec une source en 192.168.x.x
# Sans cette exception, le drop des bogons WAN (section 13) le jetterait
/ip firewall raw add chain=prerouting in-interface-list=WAN src-address=192.168.40.0/24 \
  dst-address=192.168.10.0/24 action=accept \
  place-before=[find where comment~"drop bogons WAN"] comment="RAW: exception tunnel IPsec site B"`,

        R`# ═══ SITE B (distant) — LAN 192.168.40.0/24 — configuration SYMÉTRIQUE ═══
# Mêmes profil et proposition, pair = site A, politique avec réseaux inversés
/ip ipsec profile add name=prof-s2s hash-algorithm=sha256 enc-algorithm=aes-256 dh-group=modp2048 \
  lifetime=1d nat-traversal=yes
/ip ipsec proposal add name=prop-s2s auth-algorithms=sha256 enc-algorithms=aes-256-cbc \
  lifetime=30m pfs-group=modp2048
/ip ipsec peer add name=peer-siteA address=<IP_PUBLIQUE_SITE_A>/32 profile=prof-s2s exchange-mode=ike2
/ip ipsec identity add peer=peer-siteA auth-method=pre-shared-key secret="<SECRET_IPSEC>"
/ip ipsec policy add src-address=192.168.40.0/24 dst-address=192.168.10.0/24 \
  sa-src-address=<IP_PUBLIQUE_SITE_B> sa-dst-address=<IP_PUBLIQUE_SITE_A> \
  tunnel=yes action=encrypt proposal=prop-s2s peer=peer-siteA`,

        R`# 6. Vérifier la négociation et le chiffrement effectif
/ip ipsec active-peers print
/ip ipsec installed-sa print
/ip ipsec policy print
/log print where topics~"ipsec"
/ping 192.168.40.1 src-address=192.168.10.1 count=3`
      ],
      winboxSteps: [
        "<span class='wb-path'>IP → IPsec → Profiles → [+]</span> → Name = <code>prof-s2s</code>, Hash = sha256, Encryption = aes-256, DH Group = <code>modp2048</code>, Lifetime = 1d, NAT Traversal activé",
        "<span class='wb-path'>IP → IPsec → Proposals → [+]</span> → Auth = sha256, Encr = <code>aes-256 cbc</code>, Lifetime = 30m, PFS Group = <code>modp2048</code>",
        "<span class='wb-path'>IP → IPsec → Peers → [+]</span> → Address = IP publique de l'autre site /32, Profile = prof-s2s, Exchange Mode = <code>IKE2</code>",
        "<span class='wb-path'>IP → IPsec → Identities → [+]</span> → Peer, Auth. Method = <code>pre shared key</code>, Secret = clé longue (identique des deux côtés)",
        "<span class='wb-path'>IP → IPsec → Policies → [+]</span> → Src. Address, Dst. Address, onglet Action : Tunnel coché, SA Src/Dst Address, Proposal = prop-s2s",
        "Règle <code>NAT</code> action <code>accept</code> (sources/destinations des deux LAN) au-dessus du masquerade ; règles <code>input</code> UDP 500, 4500 et protocole <code>ipsec-esp</code>",
        "<span class='wb-path'>IP → IPsec → Active Peers</span> et <span class='wb-path'>Installed SAs</span> → vérifier l'état « established » puis les compteurs de paquets"
      ],
      diagram: "ipsec-site",
      terminology: ["IPsec", "IKEv2", "ESP", "Security Association", "PFS", "NAT-T", "Pre-shared key", "Site-à-site", "Bogons"],
      concepts: [
        { term: "Deux étapes de négociation", def: "IKE établit d'abord un canal sécurisé entre les deux routeurs (authentification par clé partagée, échange Diffie-Hellman). Il négocie ensuite les associations de sécurité (SA) ESP qui chiffrent réellement le trafic des deux LAN." },
        { term: "La politique décide du trafic chiffré", def: "La policy (src-address → dst-address) définit quel trafic passe dans le tunnel. Tout paquet de 192.168.10.0/24 vers 192.168.40.0/24 est chiffré ; le reste sort normalement sur Internet. Les politiques des deux sites doivent être exactement symétriques." },
        { term: "Pourquoi exempter du NAT ?", def: "La règle de masquerade modifierait l'adresse source avant le chiffrement : le paquet ne correspondrait plus à la politique et partirait en clair ou serait jeté. La règle accept placée avant le masquerade protège le trafic du tunnel." },
        { term: "PFS (Perfect Forward Secrecy)", def: "Chaque renouvellement de clé ESP refait un échange Diffie-Hellman. Si une clé est un jour compromise, les échanges passés ne peuvent pas être déchiffrés rétroactivement." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Les paramètres cryptographiques (algorithmes, groupe DH, durées) doivent être compatibles des deux côtés ; sinon la négociation échoue. En cas de blocage, la cause se lit dans /log (topic ipsec) : « no proposal chosen » signale un désaccord de propositions." },
        { type: "warning", icon: "fa-network-wired", text: "Cette configuration suppose deux adresses publiques FIXES. Avec une adresse dynamique ou un CGNAT, préférez WireGuard (section 24). Remplacez les placeholders &lt;IP_PUBLIQUE_SITE_A&gt;, &lt;IP_PUBLIQUE_SITE_B&gt; et &lt;SECRET_IPSEC&gt; avant exécution." },
        { type: "info", icon: "fa-circle-info", text: "L'accès « road-warrior » (clients nomades en IKEv2 avec certificats ou EAP) n'est pas traité ici : WireGuard (section 23) couvre ce besoin plus simplement. IPsec nomade pourra faire l'objet d'un module ultérieur." }
      ],
      table: {
        headers: ["Paramètre", "Valeur", "Rôle"],
        rows: [
          ["Version IKE", "IKEv2 (exchange-mode=ike2)", "Négociation moderne et plus robuste"],
          ["Chiffrement", "AES-256 (CBC pour ESP)", "Confidentialité du trafic"],
          ["Intégrité", "SHA-256", "Détection de modification"],
          ["Groupe Diffie-Hellman", "modp2048 (groupe 14)", "Échange de clés et PFS"],
          ["Durées de vie", "IKE 1 jour · ESP 30 minutes", "Renouvellement régulier des clés"],
          ["Ports", "UDP 500, UDP 4500, ESP", "À ouvrir en INPUT sur le WAN"]
        ]
      }
    }
  ]);
})();

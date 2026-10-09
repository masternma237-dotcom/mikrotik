// ═══════════════════════════════════════════════════════════════
// DATA — Parcours « Services réseau » (lot v1.3) — partie 1/2
//   17 NAT avancé · 18 DNS local · 19 NTP
// Les commandes s'appuient sur les objets créés par les sections précédentes :
// vlan10-IT / vlan20-Hotspot, dhcp-vlan10 / dhcp-vlan20, listes LAN/WAN (section 13),
// règles commentées « Drop tout autre INPUT » et « Drop forward non autorisé ».
// ═══════════════════════════════════════════════════════════════
(function () {
  const R = String.raw;

  MK.addSections([
    // ───────────────────────────────────────────────────────────
    {
      id: "nat-advanced",
      track: "services",
      level: "intermediaire",
      title: "NAT avancé : redirections, hairpin & 1:1",
      icon: "fa-solid fa-right-left",
      step: "17",
      requires: ["routing", "firewall"],
      description: "Au-delà du masquerade : publier un service interne (dst-nat), le rendre joignable depuis le LAN par l'adresse publique (hairpin NAT), traduire un réseau entier (netmap) et choisir src-nat plutôt que masquerade quand l'adresse WAN est fixe. Chaque redirection exige aussi une règle d'autorisation dans le pare-feu.",
      cliCommands: [
        R`# 1. Redirection de port (dst-nat) : publier le serveur web interne 192.168.10.50
# Le port 8443 du WAN est traduit vers le port 443 du serveur
/ip firewall nat add chain=dstnat in-interface=ether1 protocol=tcp dst-port=8443 \
  action=dst-nat to-addresses=192.168.10.50 to-ports=443 comment="DNAT web interne"`,

        R`# 2. Autoriser le trafic redirigé dans FORWARD (sinon le « drop » final le bloque)
# Après un dst-nat, le filtre voit l'adresse et le port TRADUITS (192.168.10.50:443)
/ip firewall filter add chain=forward in-interface=ether1 connection-nat-state=dstnat \
  connection-state=new protocol=tcp dst-address=192.168.10.50 dst-port=443 action=accept \
  place-before=[find where comment="Drop forward non autorisé"] comment="Autoriser DNAT web interne"`,

        R`# 3. Hairpin NAT : les postes du VLAN10 joignent le serveur via l'adresse publique
# dst-address-type=local = « toute adresse du routeur », y compris l'IP WAN dynamique
/ip firewall nat add chain=dstnat src-address=192.168.10.0/24 dst-address-type=local \
  protocol=tcp dst-port=8443 action=dst-nat to-addresses=192.168.10.50 to-ports=443 \
  comment="DNAT depuis LAN (hairpin)"
# Le serveur et les clients sont dans le même sous-réseau : on masque la source
# pour que la réponse repasse par le routeur
/ip firewall nat add chain=srcnat src-address=192.168.10.0/24 dst-address=192.168.10.50 \
  protocol=tcp dst-port=443 out-interface=vlan10-IT action=masquerade comment="Hairpin masquerade web"`,

        R`# 4. src-nat : à préférer au masquerade quand l'adresse WAN est STATIQUE (moins de calcul)
# ⚠ Remplacez <IP_WAN_STATIQUE> par l'adresse fournie par l'opérateur
/ip firewall nat add chain=srcnat out-interface=ether1 src-address=192.168.10.0/24 \
  action=src-nat to-addresses=<IP_WAN_STATIQUE> comment="SNAT VLAN10 (WAN statique)"`,

        R`# 5. NAT 1:1 (netmap) — EXEMPLE FICTIF : un partenaire voit 192.168.50.0/24 comme 10.99.0.0/24
# ⚠ vlan30-Partenaire n'existe pas dans ce guide : adaptez le nom d'interface
/ip firewall nat add chain=srcnat src-address=192.168.50.0/24 out-interface=vlan30-Partenaire \
  action=netmap to-addresses=10.99.0.0/24 comment="NETMAP sortant"
/ip firewall nat add chain=dstnat dst-address=10.99.0.0/24 in-interface=vlan30-Partenaire \
  action=netmap to-addresses=192.168.50.0/24 comment="NETMAP entrant"`,

        R`# 6. Vérifier et diagnostiquer
/ip firewall nat print stats
/ip firewall connection print where dst-address~":8443"
/tool torch interface=ether1 port=8443`,

        R`# 7. Retirer proprement une publication
/ip firewall nat remove [find where comment~"DNAT"]
/ip firewall filter remove [find where comment="Autoriser DNAT web interne"]`
      ],
      winboxSteps: [
        "<span class='wb-path'>IP → Firewall → NAT → [+]</span> → Chain = <code>dstnat</code>, In. Interface = <code>ether1</code>, Protocol = tcp, Dst. Port = <code>8443</code>",
        "Onglet Action : Action = <code>dst-nat</code>, To Addresses = <code>192.168.10.50</code>, To Ports = <code>443</code>",
        "<span class='wb-path'>IP → Firewall → Filter Rules → [+]</span> → Chain = <code>forward</code>, Connection NAT State = <code>dstnat</code>, Dst. Address = <code>192.168.10.50</code>, Dst. Port = <code>443</code>, Action = accept → placer au-dessus de la règle drop finale",
        "Hairpin : règle NAT <code>dstnat</code> avec Src. Address = <code>192.168.10.0/24</code> et Dst. Address Type = <code>local</code>, puis règle <code>srcnat</code> action <code>masquerade</code> avec Out. Interface = <code>vlan10-IT</code>",
        "WAN statique : règle <code>srcnat</code>, Action = <code>src-nat</code>, To Addresses = adresse WAN fournie par l'opérateur",
        "<span class='wb-path'>Tools → Torch</span> → Interface = ether1, Port = 8443 pour voir passer le trafic",
        "Contrôle externe : tester le port depuis un réseau extérieur (smartphone en 4G, pas depuis le LAN)"
      ],
      diagram: "nat-advanced",
      terminology: ["DNAT", "SNAT", "Hairpin NAT", "NAT 1:1 (netmap)", "Port forwarding", "CGNAT", "Masquerade", "Connection state"],
      concepts: [
        { term: "Ordre de traitement", def: "Le paquet traverse d'abord la chaîne dstnat (traduction de destination), puis le filtrage FORWARD qui voit déjà l'adresse traduite, et enfin srcnat (traduction de la source) à la sortie. D'où la règle d'autorisation basée sur l'adresse INTERNE." },
        { term: "connection-nat-state=dstnat", def: "Ne retient que les connexions réellement redirigées par un dst-nat. Évite d'ouvrir le serveur à n'importe quel trafic et distingue la publication d'un accès direct." },
        { term: "Hairpin NAT", def: "Quand un client interne contacte un serveur interne via l'adresse publique, la réponse du serveur partirait directement vers le client (même réseau) et serait rejetée. Le masquerade interne force le retour par le routeur." },
        { term: "Masquerade vs src-nat", def: "Masquerade lit l'adresse de l'interface à chaque connexion (adapté aux IP dynamiques). src-nat utilise une adresse fixe configurée : plus léger, mais à mettre à jour si l'adresse change." }
      ],
      alerts: [
        { type: "warning", icon: "fa-globe", text: "CGNAT : de nombreux accès 4G ou radio attribuent une adresse partagée par l'opérateur. Si l'adresse WAN du routeur diffère de l'adresse vue par un site « quelle est mon IP », aucune redirection depuis Internet ne pourra aboutir : utilisez un VPN ou un tunnel sortant (parcours Interconnexion)." },
        { type: "warning", icon: "fa-triangle-exclamation", text: "Publier un service l'expose aux scans et attaques : limitez la règle FORWARD à des adresses sources connues quand c'est possible, gardez les protections des sections 12 à 14 et préférez toujours un VPN pour l'administration." },
        { type: "info", icon: "fa-circle-info", text: "Le Hotspot ajoute ses propres règles dstnat (redirection du portail). Elles concernent le VLAN20 et ne perturbent pas les redirections WAN → VLAN10 décrites ici." }
      ],
      table: {
        headers: ["Besoin", "Chaîne", "Action", "Règle d'accompagnement"],
        rows: [
          ["Publier un serveur interne", "dstnat", "dst-nat", "FORWARD accept (connection-nat-state=dstnat)"],
          ["Accès au serveur depuis le LAN par l'IP publique", "dstnat + srcnat", "dst-nat + masquerade", "Aucune (trafic LAN → LAN)"],
          ["Sortie Internet, IP WAN dynamique", "srcnat", "masquerade", "—"],
          ["Sortie Internet, IP WAN statique", "srcnat", "src-nat", "—"],
          ["Traduire un réseau entier", "srcnat + dstnat", "netmap", "FORWARD adapté au réseau traduit"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "dns-local",
      track: "services",
      level: "intermediaire",
      title: "DNS local : cache, enregistrements & DNS forcé",
      icon: "fa-solid fa-magnifying-glass-location",
      step: "18",
      requires: ["dhcp", "raw-firewall", "hardening"],
      description: "Faire du routeur le résolveur DNS du réseau : cache pour accélérer les réponses, noms locaux et alias, redirection des requêtes vers un contrôleur de domaine, blocage de domaines et DNS forcé pour empêcher le contournement. Le résolveur reste fermé au WAN, sinon il devient un relais d'attaque.",
      cliCommands: [
        R`# 1. Activer le résolveur du routeur (serveurs amont fiables, cache de 4 Mo)
# Section 15 avait mis allow-remote-requests=no : on le réactive ici, protégé à l'étape 2
/ip dns set servers=1.1.1.1,9.9.9.9 allow-remote-requests=yes cache-size=4096KiB
# Optionnel : ignorer les DNS imposés par l'opérateur
/ip dhcp-client set [find where interface=ether1] use-peer-dns=no`,

        R`# 2. Pare-feu : DNS accepté depuis le LAN uniquement (le WAN reste bloqué par le drop final)
/ip firewall filter add chain=input in-interface-list=LAN protocol=udp dst-port=53 action=accept \
  place-before=[find where comment="Drop tout autre INPUT"] comment="DNS UDP depuis LAN"
/ip firewall filter add chain=input in-interface-list=LAN protocol=tcp dst-port=53 action=accept \
  place-before=[find where comment="Drop tout autre INPUT"] comment="DNS TCP depuis LAN"`,

        R`# 3. Distribuer le routeur comme DNS aux clients (remplace 8.8.8.8 / 1.1.1.1 de la section 06)
/ip dhcp-server network set [find where address=192.168.10.0/24] dns-server=192.168.10.1
/ip dhcp-server network set [find where address=192.168.20.0/24] dns-server=192.168.20.1`,

        R`# 4. Noms locaux et alias
/ip dns static add name=serveur.cfp-cmd.lan address=192.168.10.50 comment="Serveur interne"
/ip dns static add name=portail.cfp-cmd.lan type=CNAME cname=serveur.cfp-cmd.lan comment="Alias portail"`,

        R`# 5. Domaine d'entreprise (Active Directory) : rediriger ce domaine vers le contrôleur de domaine
# Exemple : corp.cfp-cmd.lan résolu par le serveur 192.168.10.20 (disponible sur les versions 7 récentes)
/ip dns static add name=corp.cfp-cmd.lan type=FWD forward-to=192.168.10.20 match-subdomain=yes \
  comment="Split-DNS Active Directory"`,

        R`# 6. Bloquer un domaine par expression régulière (exemple pédagogique)
/ip dns static add regexp=".*\\.doubleclick\\.net" address=0.0.0.0 comment="Blocage publicité (exemple)"
/ip dns cache flush`,

        R`# 7. DNS forcé : toute requête DNS du LAN vers un autre serveur est ramenée au routeur
/ip firewall nat add chain=dstnat in-interface-list=LAN protocol=udp dst-port=53 dst-address-type=!local \
  action=redirect to-ports=53 comment="DNS force UDP"
/ip firewall nat add chain=dstnat in-interface-list=LAN protocol=tcp dst-port=53 dst-address-type=!local \
  action=redirect to-ports=53 comment="DNS force TCP"
# DNS-over-TLS (port 853) contournerait le routeur : le bloquer
/ip firewall filter add chain=forward in-interface-list=LAN protocol=tcp dst-port=853 action=drop \
  place-before=[find where comment="Drop forward non autorisé"] comment="Bloquer DoT"`,

        R`# 8. Vérifier
/ip dns print
/ip dns cache print
/ip dns static print
:put [:resolve serveur.cfp-cmd.lan]
:put [:resolve example.com]`
      ],
      winboxSteps: [
        "<span class='wb-path'>IP → DNS</span> → Servers = <code>1.1.1.1, 9.9.9.9</code>, cocher <code>Allow Remote Requests</code>, Cache Size = 4096 KiB",
        "<span class='wb-path'>IP → Firewall → Filter Rules → [+]</span> → Chain = <code>input</code>, In. Interface List = <code>LAN</code>, Protocol = udp puis tcp, Dst. Port = <code>53</code>, Action = accept, au-dessus du drop final",
        "<span class='wb-path'>IP → DHCP Server → Networks</span> → modifier chaque réseau : DNS Servers = adresse du routeur (192.168.10.1 puis 192.168.20.1)",
        "<span class='wb-path'>IP → DNS → Static → [+]</span> → Name = <code>serveur.cfp-cmd.lan</code>, Address = <code>192.168.10.50</code> ; pour un alias, Type = <code>CNAME</code>",
        "Domaine d'entreprise : Type = <code>FWD</code>, Forward To = IP du contrôleur de domaine, cocher Match Subdomain",
        "<span class='wb-path'>IP → Firewall → NAT → [+]</span> → Chain = <code>dstnat</code>, Dst. Port = 53, Dst. Address Type = <code>!local</code>, Action = <code>redirect</code>, To Ports = 53 (UDP puis TCP)",
        "<span class='wb-path'>IP → DNS → Cache</span> → consulter le contenu ; bouton <code>Flush Cache</code> après une modification d'enregistrement"
      ],
      diagram: "dns-local",
      terminology: ["DNS", "Cache DNS", "Split-DNS", "Open resolver", "DNS forcé", "DoH / DoT", "Interface list"],
      concepts: [
        { term: "Cache DNS", def: "Le routeur mémorise les réponses pendant leur durée de vie (TTL). Les requêtes répétées du LAN sont servies localement, ce qui réduit la latence et la consommation de la liaison WAN." },
        { term: "Split-DNS", def: "Les noms du domaine interne sont résolus par un serveur interne (contrôleur de domaine), les autres par les serveurs publics. Les postes n'ont qu'un seul DNS à connaître : le routeur." },
        { term: "Résolveur ouvert (open resolver)", def: "Un DNS qui répond à n'importe quelle adresse d'Internet peut être détourné pour des attaques par amplification. Ici l'acceptation est limitée à la liste LAN, le WAN reste filtré." },
        { term: "DNS forcé et ses limites", def: "Rediriger le port 53 empêche d'utiliser un DNS tiers en clair. Un navigateur configuré en DNS-over-HTTPS (port 443) passe encore : le blocage total de ce contournement n'est pas réaliste au niveau routeur." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Ne publiez jamais le DNS sur le WAN. Après configuration, testez depuis un réseau extérieur : le port 53 du routeur doit être fermé (pas de réponse)." },
        { type: "warning", icon: "fa-server", text: "Si des serveurs ou contrôleurs de domaine utilisent déjà leur propre DNS, excluez-les du DNS forcé (règle d'exception avant les règles redirect) pour ne pas casser leurs résolutions internes." },
        { type: "info", icon: "fa-circle-info", text: "Les enregistrements regexp sont évalués pour chaque requête : évitez de charger de grandes listes de blocage sur un petit routeur (hAP) et préférez un DNS de filtrage dédié pour cela." }
      ],
      table: {
        headers: ["Fonction", "Où ça se configure", "Effet"],
        rows: [
          ["Résolveur + cache", "/ip dns", "Réponses locales rapides"],
          ["Noms et alias locaux", "/ip dns static", "Résolution des serveurs internes par nom"],
          ["Redirection de domaine", "static type=FWD", "Un domaine d'entreprise résolu en interne"],
          ["Blocage de domaine", "static regexp + 0.0.0.0", "Domaine renvoyé vers une adresse nulle"],
          ["DNS forcé", "NAT dstnat redirect", "Impossible d'utiliser un autre DNS en port 53"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "ntp-server",
      track: "services",
      level: "debutant",
      title: "NTP : serveur de temps pour le LAN",
      icon: "fa-solid fa-clock",
      step: "19",
      requires: ["raw-firewall", "dhcp"],
      description: "Des horloges synchronisées sont indispensables aux journaux, aux certificats et aux sauvegardes datées. Le routeur se synchronise sur Internet, devient serveur de temps du LAN, annonce son adresse aux clients par DHCP (option 42) et peut ramener les requêtes NTP vers lui.",
      cliCommands: [
        R`# 1. Client NTP du routeur (si déjà fait en section 16, passez à l'étape 2)
/system clock set time-zone-name=Africa/Douala
/system ntp client set enabled=yes
/system ntp client servers add address=0.pool.ntp.org
/system ntp client servers add address=1.pool.ntp.org`,

        R`# 2. Activer le serveur NTP du routeur (unicast uniquement)
/system ntp server set enabled=yes broadcast=no multicast=no manycast=no`,

        R`# 3. Pare-feu : NTP (UDP 123) accepté depuis le LAN uniquement
/ip firewall filter add chain=input in-interface-list=LAN protocol=udp dst-port=123 action=accept \
  place-before=[find where comment="Drop tout autre INPUT"] comment="NTP depuis LAN"`,

        R`# 4. Annoncer le serveur aux clients par DHCP : option 42 (adresse IP en hexadécimal)
# 192.168.10.1 = 0xC0A80A01 · 192.168.20.1 = 0xC0A81401
/ip dhcp-server option add name=ntp-v10 code=42 value=0xC0A80A01
/ip dhcp-server option add name=ntp-v20 code=42 value=0xC0A81401
/ip dhcp-server option sets add name=opts-vlan10 options=ntp-v10
/ip dhcp-server option sets add name=opts-vlan20 options=ntp-v20
/ip dhcp-server network set [find where address=192.168.10.0/24] dhcp-option-set=opts-vlan10
/ip dhcp-server network set [find where address=192.168.20.0/24] dhcp-option-set=opts-vlan20`,

        R`# 5. (Optionnel) Ramener les requêtes NTP des clients vers le routeur
# ⚠ Ne pas appliquer aux serveurs Windows/contrôleurs de domaine qui ont leur propre hiérarchie de temps
/ip firewall nat add chain=dstnat in-interface-list=LAN protocol=udp dst-port=123 dst-address-type=!local \
  action=redirect to-ports=123 comment="NTP force"`,

        R`# 6. Vérifier
/system ntp client print
/system ntp client servers print
/system clock print
/ip dhcp-server network print`
      ],
      winboxSteps: [
        "<span class='wb-path'>System → Clock</span> → Time Zone Name = <code>Africa/Douala</code>",
        "<span class='wb-path'>System → NTP Client</span> → cocher Enabled, onglet Servers → ajouter <code>0.pool.ntp.org</code> et <code>1.pool.ntp.org</code>",
        "<span class='wb-path'>System → NTP Server</span> → cocher Enabled, laisser Broadcast, Multicast et Manycast décochés",
        "<span class='wb-path'>IP → Firewall → Filter Rules → [+]</span> → Chain = <code>input</code>, In. Interface List = <code>LAN</code>, Protocol = udp, Dst. Port = <code>123</code>, Action = accept, au-dessus du drop final",
        "<span class='wb-path'>IP → DHCP Server → Options → [+]</span> → Name = <code>ntp-v10</code>, Code = <code>42</code>, Value = <code>0xC0A80A01</code> ; créer ensuite un Option Set et l'affecter à chaque réseau",
        "<span class='wb-path'>System → NTP Client</span> → vérifier que le statut indique la synchronisation"
      ],
      diagram: "ntp-server",
      terminology: ["NTP", "Stratum", "DHCP option", "DHCP lease", "Interface list"],
      concepts: [
        { term: "Pourquoi un serveur de temps local ?", def: "Un seul équipement interroge Internet ; tous les autres se synchronisent sur lui. Les journaux de tous les appareils sont alors corrélables, et le trafic NTP sortant reste minimal." },
        { term: "Option DHCP 42", def: "Annonce aux clients l'adresse du serveur NTP. L'adresse est codée en hexadécimal : chaque octet de l'adresse IP devient une paire de chiffres (192 = C0, 168 = A8, 10 = 0A, 1 = 01)." },
        { term: "Strate (stratum)", def: "Distance, en nombre de sauts, entre un équipement et la source de temps de référence. Un serveur synchronisé sur Internet affiche une strate faible ; chaque relais l'incrémente de 1." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Les postes membres d'un domaine Active Directory prennent leur heure sur le contrôleur de domaine. N'imposez pas de redirection NTP à ces machines : elles risqueraient de dériver par rapport au domaine." },
        { type: "info", icon: "fa-circle-info", text: "La synchronisation initiale peut prendre quelques minutes. Le serveur NTP du routeur ne répond qu'une fois lui-même synchronisé." }
      ],
      table: {
        headers: ["Élément", "Valeur dans ce guide", "Remarque"],
        rows: [
          ["Fuseau horaire", "Africa/Douala (UTC+1)", "Pas d'heure d'été au Cameroun"],
          ["Sources amont", "0.pool.ntp.org, 1.pool.ntp.org", "Résolues par le DNS du routeur"],
          ["Serveur VLAN10", "192.168.10.1 · option 42 = 0xC0A80A01", "Annoncé par DHCP"],
          ["Serveur VLAN20", "192.168.20.1 · option 42 = 0xC0A81401", "Annoncé par DHCP"]
        ]
      }
    }
  ]);
})();

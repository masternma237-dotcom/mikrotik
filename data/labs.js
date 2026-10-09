// ═══════════════════════════════════════════════════════════════
// DATA — Parcours « Labs & évaluation » (lot v2.0)
//   36 Préparer le laboratoire (CHR sur Proxmox VE) · 37 Lab 1 · 38 Lab 2 · 39 Lab 3 · 40 Quiz final
// Les labs réutilisent les sections du guide : ils proposent un scénario, un déroulé,
// des vérifications et des critères de réussite cochables (mémorisés dans le navigateur).
// ═══════════════════════════════════════════════════════════════
(function () {
  const R = String.raw;

  MK.addSections([
    // ───────────────────────────────────────────────────────────
    {
      id: "lab-infra",
      track: "labs",
      level: "debutant",
      title: "Lab 0 : préparer le laboratoire (CHR sur Proxmox VE)",
      icon: "fa-solid fa-server",
      step: "36",
      description: "Tester chaque configuration sur du vrai RouterOS sans risquer le matériel de production : CHR (Cloud Hosted Router) tourne comme machine virtuelle sur Proxmox VE. On prépare des réseaux isolés, un modèle de routeur, deux clones (siège et site distant) et des instantanés pour revenir en arrière en quelques secondes.",
      cliCommands: [
        R`# 1. SUR L'HÔTE PROXMOX VE — réseaux du laboratoire : /etc/network/interfaces (à ajouter, puis : ifreload -a)
# vmbr100 = « Internet » simulé (10.100.0.0/24) avec NAT vers l'extérieur
# vmbr101 = LAN IT du siège · vmbr105 = LAN Hotspot du siège · vmbr102 = LAN du site B · vmbr104 = second WAN (lab 2)
#
# auto vmbr100
# iface vmbr100 inet static
#     address 10.100.0.1/24
#     bridge-ports none
#     bridge-stp off
#     bridge-fd 0
#     post-up   echo 1 > /proc/sys/net/ipv4/ip_forward
#     post-up   iptables -t nat -A POSTROUTING -s 10.100.0.0/24 -o vmbr0 -j MASQUERADE
#     post-down iptables -t nat -D POSTROUTING -s 10.100.0.0/24 -o vmbr0 -j MASQUERADE
#
# Pour vmbr101, vmbr102, vmbr104 et vmbr105 : même bloc sans adresse (« iface vmbrXXX inet manual », bridge-ports none)
# (pour le second WAN vmbr104 : même principe que vmbr100 avec 10.104.0.0/24)`,

        R`# 2. SUR L'HÔTE — télécharger CHR, créer la VM modèle (⚠ remplacez <VERSION>, ex. 7.16 ; adaptez « local-lvm » à votre stockage)
cd /tmp
wget https://download.mikrotik.com/routeros/<VERSION>/chr-<VERSION>.img.zip
unzip chr-<VERSION>.img.zip
qm create 9000 --name chr-modele --memory 512 --cores 1 --ostype l26 --scsihw virtio-scsi-pci \
  --net0 virtio,bridge=vmbr100 --serial0 socket --vga serial0
qm importdisk 9000 chr-<VERSION>.img local-lvm
qm set 9000 --scsi0 local-lvm:vm-9000-disk-0 --boot order=scsi0
qm template 9000`,

        R`# 3. SUR L'HÔTE — cloner le siège et le site B, brancher les réseaux, démarrer
qm clone 9000 101 --name chr-siege
qm set 101 --net1 virtio,bridge=vmbr101 --net2 virtio,bridge=vmbr105
qm clone 9000 102 --name chr-siteB
qm set 102 --net1 virtio,bridge=vmbr102
qm start 101
qm start 102
# Console série (quitter avec Ctrl+O) :
qm terminal 101`,

        R`# 4. DANS LA CONSOLE DE CHAQUE CHR — connexion : admin, mot de passe vide (refuser de saisir une licence)
/system resource print
/system license print
# Repartir d'une configuration vide, sans sauvegarde (le routeur redémarre)
/system reset-configuration no-defaults=yes skip-backup=yes`,

        R`# 5. Adresse WAN provisoire pour pouvoir téléverser le script du lab 1 (siège ; sur le site B : 10.100.0.12)
/ip address add address=10.100.0.11/24 interface=ether1
/ip route add dst-address=0.0.0.0/0 gateway=10.100.0.1
/ping 8.8.8.8 count=3`,

        R`# 6. SUR L'HÔTE — instantané « état initial » pour revenir en arrière entre deux exercices
qm snapshot 101 etat-initial
qm snapshot 102 etat-initial
# Revenir à l'état initial :  qm rollback 101 etat-initial`
      ],
      steps: [
        "Créer les ponts <code>vmbr100</code> (Internet simulé, NAT), <code>vmbr101</code>, <code>vmbr102</code>, <code>vmbr104</code> et <code>vmbr105</code> sur l'hôte Proxmox VE (étape 1)",
        "Télécharger l'image CHR de la version RouterOS visée et créer la VM modèle 9000 (étape 2)",
        "Cloner le modèle en <code>chr-siege</code> (3 cartes réseau) et <code>chr-siteB</code> (2 cartes), puis démarrer les deux machines (étape 3)",
        "Ouvrir la console série, se connecter en <code>admin</code> sans mot de passe et repartir d'une configuration vide (étape 4)",
        "Donner une adresse provisoire à <code>ether1</code> et vérifier l'accès Internet par un ping (étape 5)",
        "Créer un instantané <code>etat-initial</code> de chaque routeur (étape 6) : vous y reviendrez avant chaque lab",
        "Préparer deux machines clientes Debian légères : une sur <code>vmbr101</code> (poste IT) et une sur <code>vmbr105</code> (invité Hotspot), en DHCP"
      ],
      checklist: [
        "Les ponts du laboratoire sont créés et le NAT de <code>vmbr100</code> fonctionne (ping 8.8.8.8 depuis un CHR)",
        "La VM modèle CHR est créée et marquée « template »",
        "<code>chr-siege</code> et <code>chr-siteB</code> démarrent et répondent sur la console série",
        "Les deux routeurs sont remis à zéro et un instantané <code>etat-initial</code> existe pour chacun",
        "Deux clients Debian sont prêts (un par réseau du siège)"
      ],
      diagram: "lab-infra",
      terminology: ["CHR", "Proxmox VE", "Modèle de VM (template)", "Snapshot"],
      concepts: [
        { term: "Pourquoi CHR ?", def: "CHR est le RouterOS pour machines virtuelles. Il fournit la même interface (CLI, WinBox, REST) que le matériel : on peut essayer pare-feu, VPN, routage ou QoS sans toucher au réseau de production." },
        { term: "Réseaux isolés", def: "Des ponts Linux sans carte physique forment des réseaux étanches ; seul vmbr100 est relié à l'extérieur par NAT. Un test qui tourne mal ne peut pas atteindre le vrai réseau de l'établissement." },
        { term: "Instantanés", def: "Un snapshot fige l'état complet d'une VM. Après une erreur ou un exercice, un rollback restaure le routeur initial en quelques secondes, ce qui encourage à expérimenter." }
      ],
      alerts: [
        { type: "warning", icon: "fa-gauge", text: "Licence : CHR s'utilise gratuitement avec un débit limité (de l'ordre de 1 Mbit/s en envoi). Les tests de configuration, de pare-feu et de VPN fonctionnent ; les mesures de débit et le QoS (sections 21-22) ne reflètent pas un matériel réel." },
        { type: "warning", icon: "fa-triangle-exclamation", text: "Les valeurs <code>&lt;VERSION&gt;</code>, le nom de stockage (local-lvm) et les numéros de VM sont des exemples à adapter. Les adresses 10.100.0.x servent de WAN privé : si vous activez le filtrage des bogons (section 13), déclarez ce réseau en exception." },
        { type: "info", icon: "fa-circle-info", text: "CHR ne possède pas de radio : le Wi-Fi (section 03) et CAPsMAN (section 35) se testent sur du matériel réel. Décochez le Wi-Fi dans le générateur pour les labs virtuels." }
      ],
      table: {
        headers: ["Pont Proxmox", "Rôle", "Branché sur"],
        rows: [
          ["vmbr100", "WAN simulé 10.100.0.0/24 (NAT)", "ether1 des deux CHR"],
          ["vmbr101", "LAN IT du siège", "ether2 de chr-siege + poste IT"],
          ["vmbr105", "LAN Hotspot du siège", "ether3 de chr-siege + poste invité"],
          ["vmbr102", "LAN du site B", "ether2 de chr-siteB"],
          ["vmbr104", "Second WAN (lab 2)", "ether4 de chr-siege"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "lab-pme",
      track: "labs",
      level: "intermediaire",
      title: "Lab 1 : le réseau d'un centre de formation",
      icon: "fa-solid fa-school",
      step: "37",
      requires: ["lab-infra", "rsc-generator"],
      description: "Scénario : le centre doit séparer le réseau de l'administration (VLAN IT) de celui des invités (Hotspot), donner Internet aux deux et protéger le routeur. Vous générez la configuration de base, l'importez sur chr-siege, la durcissez avec les modules de sécurité, puis vous validez chaque comportement attendu avec des clients réels.",
      cliCommands: [
        R`# 1. Importer le script produit par le générateur (téléversé par glisser-déposer dans WinBox → Files)
# ⚠ Remplacez d'abord tous les <PLACEHOLDERS> du fichier : leurs lignes échouent tant qu'ils sont présents
/system backup save name=avant-lab1
/import file-name=mk-config.rsc verbose=yes`,

        R`# 2. Contrôler l'état du routeur après import
/interface bridge vlan print
/ip address print
/ip dhcp-server print
/ip firewall filter print stats
/system identity print`,

        R`# 3. Sur le client IT (Debian) : adresse, passerelle et Internet
# ip -br a
# ping -c3 192.168.10.1
# ping -c3 8.8.8.8
# curl -sI https://example.com | head -1
#
# Sur le client invité (Hotspot) : l'accès au VLAN IT doit ÉCHOUER
# ping -c3 192.168.10.1        (le routeur ne doit pas répondre depuis le Hotspot)
# ping -c3 192.168.10.x        (poste IT : aucune réponse attendue)`,

        R`# 4. Test de l'anti-brute force (depuis un poste du VLAN IT non présent dans la liste blanche)
# for i in 1 2 3 4 5 6; do ssh -o ConnectTimeout=3 test@192.168.10.1 exit; done
# Puis, sur le routeur :
/ip firewall address-list print where list~"ssh_"
/log print where message~"BF-SSH"`
      ],
      steps: [
        "Restaurer l'instantané <code>etat-initial</code> de <code>chr-siege</code> puis lui donner l'accès par câble (console série) — voir le <a href=\"#lab-infra\">lab 0</a>",
        "Ouvrir le <a href=\"#rsc-generator\">générateur .rsc</a> : WAN statique <code>10.100.0.11/24</code>, passerelle <code>10.100.0.1</code>, ether2 = accès VLAN 10, ether3 = accès VLAN 20, autres ports non utilisés, Wi-Fi décoché ; cochez pare-feu, Hotspot, anti-brute force, durcissement et NTP",
        "Télécharger le script, remplacer les placeholders, le téléverser dans <code>Files</code> et l'importer (étape 1) après avoir lu la <a href=\"#safemode\">sauvegarde de la section 11</a>",
        "Vérifier le routeur (étape 2), puis les clients : le poste IT obtient une adresse en 192.168.10.x et accède à Internet (étape 3)",
        "Vérifier l'isolation : le poste invité obtient une adresse en 192.168.20.x, sort sur Internet, mais n'atteint ni le routeur en administration ni le VLAN IT",
        "Provoquer l'anti-brute force (<a href=\"#bruteforce\">section 12</a>) depuis le poste IT et observer l'adresse inscrite dans <code>ssh_blacklist</code> (étape 4) ; la retirer ensuite",
        "Programmer la <a href=\"#backup-auto\">sauvegarde automatique</a> et compléter par la <a href=\"#raw-firewall\">table RAW</a> en travaillant en Safe Mode",
        "Exporter la configuration finale (<code>/export file=lab1-final</code>) et la comparer avec le fichier généré"
      ],
      checklist: [
        "Le script importé s'exécute sans erreur (hors placeholders volontairement conservés)",
        "Le poste IT obtient une adresse du VLAN 10 et accède à Internet",
        "Le poste invité obtient une adresse du VLAN 20 et accède à Internet",
        "Le poste invité ne peut pas joindre le VLAN IT ni administrer le routeur",
        "Cinq connexions SSH rapprochées inscrivent l'adresse de test dans <code>ssh_blacklist</code>",
        "Le compte <code>admin</code> par défaut est désactivé et l'accès SSH/WinBox est limité au réseau d'administration",
        "Une sauvegarde (<code>.backup</code> et <code>.rsc</code>) est présente avant et après les modifications",
        "Vous savez expliquer l'ordre d'exécution du script généré et pourquoi l'accès <code>admin</code> est désactivé en dernier"
      ],
      diagram: "lab-pme",
      terminology: ["VLAN", "Hotspot", "Fichier .rsc", "Import RouterOS", "Safe Mode", "Brute force"],
      concepts: [
        { term: "Objectif pédagogique", def: "Relier les sections du socle et de la sécurité dans un même scénario : générer, importer, vérifier, attaquer, durcir et sauvegarder. L'apprenant doit pouvoir justifier chaque règle par un risque ou un comportement attendu." },
        { term: "Vérifier, ne pas supposer", def: "Chaque exigence du scénario correspond à un test observable (ping, adresse obtenue, liste de blocage). Un lab réussi se prouve par des résultats, pas par la simple absence d'erreur d'import." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Gardez la console série ouverte pendant l'import : si une règle coupe l'accès réseau, c'est votre moyen de reprendre la main. En cas de blocage, revenez à l'instantané et recommencez." },
        { type: "info", icon: "fa-circle-info", text: "Le Hotspot sans portail personnalisé affiche la page par défaut du routeur. L'utilisateur de test est <code>invite-demo</code> ; son mot de passe est celui que vous avez défini dans le fichier généré." }
      ],
      table: {
        headers: ["Exigence du scénario", "Test", "Résultat attendu"],
        rows: [
          ["Réseaux séparés", "Adresse du poste IT et du poste invité", "192.168.10.x et 192.168.20.x"],
          ["Accès Internet", "ping 8.8.8.8 depuis chaque poste", "Réponses"],
          ["Isolation du Hotspot", "ping du VLAN IT depuis l'invité", "Aucune réponse"],
          ["Routeur protégé", "SSH depuis l'invité", "Connexion refusée"],
          ["Anti-brute force", "6 connexions SSH rapides", "Adresse listée dans ssh_blacklist"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "lab-sites",
      track: "labs",
      level: "avance",
      title: "Lab 2 : deux sites, VPN et bascule",
      icon: "fa-solid fa-network-wired",
      step: "38",
      requires: ["lab-pme", "site-to-site"],
      description: "Scénario : le siège et un site distant doivent partager leurs réseaux de façon chiffrée, rester joignables si un lien tombe et échanger leurs routes automatiquement. Vous reliez chr-siege et chr-siteB par WireGuard, ajoutez OSPF puis un second WAN avec bascule automatique, et vous mesurez ce qui se passe lors d'une panne.",
      cliCommands: [
        R`# 1. Préparer le site B : générer sa configuration avec un LAN différent (⚠ le LAN du site B ne doit pas chevaucher celui du siège)
# Générateur : WAN statique 10.100.0.12/24 passerelle 10.100.0.1, réseau IT 192.168.40.1/24, ether2 = accès VLAN 10
# Puis importer sur chr-siteB :
/import file-name=mk-config-siteB.rsc verbose=yes`,

        R`# 2. Contrôler le tunnel et la joignabilité de bout en bout (après la section 24)
/interface wireguard peers print detail
/ping 10.20.0.2 count=3
/ping 192.168.40.1 src-address=192.168.10.1 count=3
/tool traceroute 192.168.40.1`,

        R`# 3. Ajouter un second WAN au siège (carte réseau vmbr104 sur ether4), après la section 26
# SUR L'HÔTE PROXMOX : qm set 101 --net3 virtio,bridge=vmbr104
/interface list member add list=WAN interface=ether4
/ip address add address=10.104.0.11/24 interface=ether4
# Relever les passerelles puis appliquer les routes récursives de la section 26 (WAN1 = 10.100.0.1, WAN2 = 10.104.0.1)`,

        R`# 4. Simuler la panne du WAN1 et mesurer la bascule (depuis un poste IT : ping continu vers 8.8.8.8)
/interface ethernet disable ether1
/ip route print where active and dst-address=0.0.0.0/0
/log print where message~"WAN"
# Rétablir
/interface ethernet enable ether1`
      ],
      steps: [
        "Restaurer <code>chr-siege</code> à la fin du <a href=\"#lab-pme\">lab 1</a> et préparer <code>chr-siteB</code> à partir de son instantané ; générer sa configuration avec un LAN en 192.168.40.0/24 (étape 1)",
        "Monter le tunnel selon la <a href=\"#site-to-site\">section 24</a> et valider le ping de LAN à LAN (étape 2)",
        "Ajouter le routage dynamique de la <a href=\"#ospf\">section 33</a> : le voisin passe en <code>Full</code> et la route statique devient route de secours",
        "Ajouter le second WAN au siège (étape 3) puis la <a href=\"#failover-wan\">bascule de la section 26</a>",
        "Lancer un ping continu depuis le poste IT vers Internet, couper le WAN1 (étape 4) et noter le temps d'interruption",
        "Optionnel : remplacer WireGuard par le tunnel <a href=\"#ipsec-site\">IPsec de la section 25</a> et comparer la complexité de configuration",
        "Documenter le plan d'adressage final et les tests réalisés dans un court compte rendu"
      ],
      checklist: [
        "Le tunnel WireGuard est établi (poignée de main récente des deux côtés)",
        "Un poste du siège joint un poste du site B et inversement",
        "Aucun NAT n'est appliqué sur le trafic du tunnel (les adresses d'origine sont conservées)",
        "Le voisin OSPF est en état <code>Full</code> et la route du site B est apprise par OSPF",
        "La coupure du WAN1 fait basculer le trafic sur le WAN2 sans intervention",
        "Le retour du WAN1 rétablit automatiquement la route principale",
        "Le temps d'interruption mesuré lors de la bascule est noté dans votre compte rendu"
      ],
      diagram: "lab-sites",
      terminology: ["Site-à-site", "OSPF", "Failover", "Recursive routing", "Handshake WireGuard", "Distance administrative"],
      concepts: [
        { term: "Objectif pédagogique", def: "Comprendre qu'une interconnexion comporte trois couches indépendantes : le transport chiffré (tunnel), l'acheminement des réseaux (routes statiques ou OSPF) et la continuité (bascule WAN). Une panne se diagnostique couche par couche." },
        { term: "Mesurer la bascule", def: "Un ping continu pendant la panne donne le temps d'interruption réel (de 10 à 30 secondes avec check-gateway). Ce chiffre sert à décider si cette solution suffit pour les applications du site." }
      ],
      alerts: [
        { type: "warning", icon: "fa-gauge", text: "Avec la licence gratuite de CHR, les débits sont plafonnés : jugez la connectivité et les temps de bascule, pas les performances du tunnel." },
        { type: "info", icon: "fa-circle-info", text: "Dans ce laboratoire les deux WAN sont des réseaux privés : n'activez pas le drop des bogons de la section 13, ou déclarez 10.100.0.0/24 et 10.104.0.0/24 comme réseaux amont autorisés." }
      ],
      table: {
        headers: ["Couche", "Mécanisme", "Test"],
        rows: [
          ["Transport chiffré", "WireGuard (section 24)", "Poignée de main + ping du tunnel"],
          ["Acheminement", "OSPF (section 33)", "Voisin Full, route apprise"],
          ["Continuité", "Failover WAN (section 26)", "Ping continu pendant la coupure du WAN1"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "lab-ops",
      track: "labs",
      level: "avance",
      title: "Lab 3 : exploitation et supervision",
      icon: "fa-solid fa-chart-line",
      step: "39",
      requires: ["lab-pme", "logging-syslog"],
      description: "Scénario : l'exploitation doit voir ce qui se passe sur le routeur sans y être connectée en permanence. Vous préparez une machine « ops » dans le VLAN IT qui reçoit les journaux, interroge le routeur en SNMPv3, appelle son API REST et reçoit les alertes ; vous vérifiez chaque flux, puis vous provoquez des événements pour les voir apparaître.",
      cliCommands: [
        R`# 1. SUR LA MACHINE « ops » (Debian 12, 192.168.10.20 en réservation DHCP — section 20) : outils de base
# sudo apt update && sudo apt install -y rsyslog snmp curl python3-requests
# Zabbix : suivre la procédure officielle d'installation de la version de votre choix (zabbix.com/download)`,

        R`# 2. SUR LE ROUTEUR — réserver l'adresse de la machine « ops » puis appliquer, dans l'ordre : sections 28, 30 et 31
/ip dhcp-server lease add address=192.168.10.20 mac-address=<MAC_MACHINE_OPS> server=dhcp-vlan10 comment="Machine ops"`,

        R`# 3. Provoquer des événements et les retrouver
/system script run rapport-securite
# Depuis un poste IT : plusieurs connexions SSH rapides, un scan (nmap) du routeur, puis une connexion avec un mauvais compte
/log print where topics~"account"
# SUR « ops » :  tail -f /var/log/mikrotik/mk-cfp-cmd.log`,

        R`# 4. Lire l'état du routeur par SNMP et par REST (depuis « ops »)
# snmpwalk -v3 -l authPriv -u zbx-v3 -a SHA -A '<MDP_AUTH_SNMP>' -x AES -X '<MDP_CHIFFREMENT_SNMP>' 192.168.10.1 1.3.6.1.2.1.1
# curl -k -u svc-api:'<MOT_DE_PASSE_FORT>' https://192.168.10.1/rest/system/resource`
      ],
      steps: [
        "Créer la machine <code>ops</code> sur <code>vmbr101</code> et lui réserver <code>192.168.10.20</code> (<a href=\"#dhcp-advanced\">section 20</a>)",
        "Appliquer la <a href=\"#logging-syslog\">journalisation distante</a> et vérifier la réception du fichier de journaux avec <code>tail -f</code>",
        "Configurer les <a href=\"#alerts-notify\">alertes</a> : un e-mail de test, puis un Netwatch sur la machine ops (arrêtez-la pour déclencher l'alerte)",
        "Activer <a href=\"#snmp-zabbix\">SNMPv3</a>, valider avec <code>snmpwalk</code> puis déclarer l'hôte dans Zabbix",
        "Activer l'<a href=\"#rest-api\">API REST</a> avec le compte en lecture seule et lire <code>/rest/system/resource</code>",
        "Provoquer scan, rafale SSH et mauvais compte (étape 3) et retrouver chaque événement dans les journaux et le rapport de sécurité",
        "Rédiger la liste des indicateurs surveillés et des seuils choisis, avec une phrase de justification pour chacun"
      ],
      checklist: [
        "Les journaux du routeur arrivent sur le serveur central dans un fichier dédié",
        "Un e-mail de test est reçu et une alerte Netwatch est déclenchée par l'arrêt de la machine ops",
        "La lecture SNMPv3 fonctionne et la communauté « public » n'existe plus",
        "L'hôte est visible dans Zabbix avec des valeurs de charge et de trafic",
        "L'appel REST avec le compte en lecture seule renvoie les ressources du routeur en JSON",
        "Une tentative de modification par ce compte est refusée",
        "Les événements provoqués (scan, rafale SSH, mauvais compte) sont retrouvés dans les journaux",
        "Vous pouvez expliquer pourquoi chaque flux (syslog, SNMP, REST) est limité à la machine ops par le pare-feu"
      ],
      diagram: "lab-ops",
      terminology: ["Syslog", "SNMPv3", "Zabbix", "API REST", "Netwatch", "Moindre privilège API"],
      concepts: [
        { term: "Objectif pédagogique", def: "Faire comprendre que superviser, journaliser et automatiser sont trois besoins différents, chacun avec son canal (SNMP, syslog, REST) et sa règle de sécurité (limiter l'accès à une seule machine et au minimum de droits)." },
        { term: "Provoquer pour vérifier", def: "Une supervision qui n'a jamais vu d'incident n'est pas prouvée. Créer volontairement un scan, une panne ou une erreur d'identification permet de s'assurer que la chaîne d'alerte fonctionne avant le vrai incident." }
      ],
      alerts: [
        { type: "warning", icon: "fa-key", text: "Placeholders à remplacer dans ce lab : &lt;MAC_MACHINE_OPS&gt;, &lt;MDP_AUTH_SNMP&gt;, &lt;MDP_CHIFFREMENT_SNMP&gt; et &lt;MOT_DE_PASSE_FORT&gt;. Ne les saisissez jamais dans un document partagé ou un dépôt Git." },
        { type: "info", icon: "fa-circle-info", text: "Le laboratoire est local : l'envoi d'e-mails ou de messages exige un accès Internet depuis le CHR (via vmbr100) et un compte d'envoi dédié, jamais votre compte personnel." }
      ],
      table: {
        headers: ["Flux", "Section", "Limitation de sécurité"],
        rows: [
          ["Journaux (UDP 514)", "28", "Routeur vers machine ops uniquement"],
          ["Alertes e-mail", "29", "Compte d'envoi dédié"],
          ["SNMPv3 (UDP 161)", "30", "Port limité à l'adresse de la machine ops"],
          ["REST (HTTPS 443)", "31", "Compte en lecture seule, réseau restreint"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "quiz-final",
      track: "labs",
      level: "intermediaire",
      title: "Quiz final : évaluer vos connaissances",
      icon: "fa-solid fa-graduation-cap",
      step: "40",
      tool: "quiz-final",
      description: "Un tirage aléatoire de questions pris dans toute la banque du guide, par parcours ou sur l'ensemble. À la fin, le score et la liste des sections à revoir vous indiquent où retravailler. Les quiz de chaque section sont aussi disponibles en bas de leurs pages.",
      cliCommands: [],
      terminology: ["Évaluation formative"],
      concepts: [
        { term: "Évaluer pour apprendre", def: "Le quiz n'est pas noté pour sanctionner : il révèle les notions fragiles. Les explications s'affichent après chaque réponse, et les sections à revoir sont proposées en lien direct." },
        { term: "Seuil de réussite", def: "Un quiz est considéré comme réussi à partir de 70 % de bonnes réponses. Vos meilleurs scores par section sont mémorisés dans ce navigateur, sans être envoyés nulle part." }
      ],
      alerts: [
        { type: "info", icon: "fa-circle-info", text: "Les questions sont mélangées, ainsi que l'ordre des réponses, à chaque tirage. Refaire le quiz plusieurs fois est encouragé." }
      ]
    }
  ]);
})();

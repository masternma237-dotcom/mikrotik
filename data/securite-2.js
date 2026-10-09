// ═══════════════════════════════════════════════════════════════
// DATA — Parcours « Sécurité avancée » (lot v1.2) — partie 2/2
//   14 Anti-scan & DoS · 15 Durcissement complet · 16 Sauvegarde automatique
// ═══════════════════════════════════════════════════════════════
(function () {
  const R = String.raw;

  MK.addSections([
    // ───────────────────────────────────────────────────────────
    {
      id: "scan-dos",
      track: "securite",
      level: "avance",
      title: "Anti-scan de ports & protection DoS",
      icon: "fa-solid fa-satellite-dish",
      step: "14",
      requires: ["bruteforce", "raw-firewall"],
      description: "Détecter les scans de ports (PSD), limiter le nombre de nouvelles connexions par source, activer les SYN cookies et plafonner les ICMP. Les adresses détectées alimentent des listes noires jetées dès la table RAW (section 13).",
      cliCommands: [
        R`# 1. Détection de scan de ports TCP (PSD) → liste port_scanners pendant 2 semaines
# psd=seuil_de_poids, délai, poids_ports_bas(<1024), poids_ports_hauts
/ip firewall filter add chain=input protocol=tcp psd=21,3s,3,1 \
  action=add-src-to-address-list address-list=port_scanners address-list-timeout=2w \
  place-before=[find where comment="Accept ICMP"] comment="SCAN: PSD -> port_scanners"`,

        R`# 2. Trop de connexions TCP vers le routeur depuis le WAN → liste ddos_attackers (10 min)
# Limité à l'interface WAN : sur le LAN, des clients légitimes ouvrent beaucoup de connexions
/ip firewall filter add chain=input in-interface-list=WAN protocol=tcp tcp-flags=syn \
  connection-state=new connection-limit=30,32 action=add-src-to-address-list \
  address-list=ddos_attackers address-list-timeout=10m \
  place-before=[find where comment="Accept ICMP"] comment="DOS: >30 connexions/IP -> ddos_attackers"
/ip firewall filter add chain=input src-address-list=ddos_attackers action=drop \
  place-before=[find where comment="Accept ICMP"] comment="DOS: drop ddos_attackers"`,

        R`# 3. Plafonner les connexions d'un client Hotspot (anti-abus, ex. torrent ou machine infectée)
/ip firewall filter add chain=forward src-address=192.168.20.0/24 protocol=tcp \
  connection-state=new connection-limit=300,32 action=drop \
  place-before=[find where comment~"interdit"] comment="DOS: Hotspot max 300 connexions/client"`,

        R`# 4. SYN cookies et limitation du ping vers le routeur
/ip settings set tcp-syncookies=yes
/ip firewall filter set [find where comment="Accept ICMP"] limit=50,20:packet`,

        R`# 5. Journaliser les détections (préfixe repérable dans /log)
/ip firewall filter set [find where comment~"^SCAN"] log=yes log-prefix="SCAN "
/ip firewall filter set [find where comment~"^DOS: >30"] log=yes log-prefix="DOS "`,

        R`# 6. Tester (UNIQUEMENT sur votre propre labo, depuis un poste non whitelisté)
# Exemple depuis un poste de test : nmap -sS -T4 -p 1-2000 192.168.10.1
/ip firewall address-list print where list=port_scanners
/ip firewall filter print stats where comment~"SCAN" or comment~"DOS"
/log print where message~"SCAN" or message~"DOS"`,

        R`# 7. Lever un blocage (adresse d'exemple)
/ip firewall address-list remove [find where list=port_scanners address=203.0.113.50]
/ip firewall address-list remove [find where list=ddos_attackers address=203.0.113.50]`
      ],
      winboxSteps: [
        "<span class='wb-path'>IP → Firewall → Filter Rules → [+]</span> → Chain = <code>input</code>, Protocol = tcp, onglet Advanced → <code>PSD</code> = <code>21,3s,3,1</code>",
        "Onglet Action : <code>add src to address list</code>, Address List = <code>port_scanners</code>, Timeout = <code>14d 00:00:00</code> ; placer la règle au-dessus de « Accept ICMP »",
        "Règle SYN : Chain = <code>input</code>, In. Interface List = <code>WAN</code>, Protocol = tcp, TCP Flags = <code>syn</code>, Connection State = new, Connection Limit = <code>30</code> / netmask <code>32</code> → ajouter à <code>ddos_attackers</code> (10 min)",
        "Règle de drop : Chain = <code>input</code>, Src. Address List = <code>ddos_attackers</code>, Action = drop",
        "<span class='wb-path'>IP → Settings</span> → cocher <code>TCP SYN Cookie</code>",
        "Double-clic sur la règle « Accept ICMP » → onglet Extra → <code>Limit</code> = 50, Burst = 20, Mode = packet",
        "<span class='wb-path'>IP → Firewall → Address Lists</span> et <span class='wb-path'>Log</span> → surveiller les adresses ajoutées"
      ],
      diagram: "scan",
      terminology: ["Port scan", "PSD", "SYN flood", "SYN cookies", "Connection limit", "Rate limiting", "DoS / DDoS", "Faux positif"],
      concepts: [
        { term: "PSD (Port Scan Detection)", def: "Le paramètre psd attribue un poids à chaque port sondé (3 pour les ports < 1024, 1 pour les autres) et déclenche la règle si la somme dépasse 21 en moins de 3 secondes." },
        { term: "Connection limit", def: "Compte les connexions simultanées par adresse source (ou par réseau selon le masque). Utilisé avec connection-state=new, il repère les sources qui ouvrent anormalement de nombreuses connexions." },
        { term: "Limitation de débit (limit)", def: "Option limit=taux,rafale:mode : les paquets au-delà du taux ne correspondent plus à la règle et poursuivent la chaîne, où une règle suivante peut les rejeter." },
        { term: "Limite de la protection locale", def: "Un DoS volumétrique sature le lien WAN AVANT le routeur : aucune règle locale ne l'arrête. Seul l'opérateur (FAI) peut filtrer en amont. Le routeur protège contre les scans, les abus de connexions et les attaques de faible volume." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Faux positifs : un outil d'inventaire réseau (Zabbix, scanner interne) ressemble à un scan. Ajoutez ses adresses à la liste blanche (section 12) avant d'activer la détection." },
        { type: "warning", icon: "fa-user-shield", text: "Les jetons de blocage sont durables (2 semaines pour les scanners). Vérifiez régulièrement /ip firewall address-list et n'ajoutez jamais un VLAN entier à une liste noire." },
        { type: "info", icon: "fa-circle-info", text: "La règle SYN est volontairement limitée à l'interface WAN : dans notre topologie le WAN est fermé, elle protège donc les services que vous exposerez plus tard (VPN, portail). Les clients du LAN sont encadrés par la règle de plafonnement Hotspot." }
      ],
      table: {
        headers: ["Menace", "Détection", "Réaction", "Durée"],
        rows: [
          ["Scan de ports", "psd=21,3s,3,1", "port_scanners puis drop RAW", "2 semaines"],
          ["Rafale de connexions vers le routeur (WAN)", "connection-limit=30,32", "ddos_attackers puis drop", "10 minutes"],
          ["Abus de connexions d'un client Hotspot", "connection-limit=300,32", "Drop des nouvelles connexions excédentaires", "Tant que le seuil est dépassé"],
          ["Inondation ICMP", "limit=50,20:packet", "Paquets en excès non acceptés par la règle", "Continu"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "hardening",
      track: "securite",
      level: "intermediaire",
      title: "Durcissement complet du routeur",
      icon: "fa-solid fa-lock",
      step: "15",
      requires: ["securing", "safemode"],
      description: "Au-delà des services de la section 01 : réduire la découverte réseau, désactiver les serveurs MAC, proxy, SOCKS, UPnP et cloud, créer un compte en lecture seule, afficher une bannière légale et préparer le suivi des mises à jour. Un tableau de contrôle permet d'auditer le résultat.",
      cliCommands: [
        R`# 1. Interface d'administration : seule cette liste voit les outils de découverte/accès L2
/interface list add name=MGMT
/interface list member add list=MGMT interface=vlan10-IT`,

        R`# 2. Découverte de voisins (MNDP/CDP/LLDP) et serveurs MAC limités à MGMT
/ip neighbor discovery-settings set discover-interface-list=MGMT
/tool mac-server set allowed-interface-list=none
/tool mac-server mac-winbox set allowed-interface-list=MGMT
/tool mac-server ping set enabled=no`,

        R`# 3. Désactiver les services inutiles
/tool bandwidth-server set enabled=no
/ip proxy set enabled=no
/ip socks set enabled=no
/ip upnp set enabled=no
/ip cloud set ddns-enabled=no update-time=no
# ⚠ Si les clients utilisent le routeur comme serveur DNS, laissez =yes et filtrez le port 53 sur le WAN
/ip dns set allow-remote-requests=no`,

        R`# 4. SSH renforcé et IPv6 désactivé (si non utilisé)
/ip ssh set strong-crypto=yes forwarding-enabled=no
/ipv6 settings set disable-ipv6=yes`,

        R`# 5. Compte en lecture seule pour la supervision et les stagiaires
# ⚠ Remplacez <MOT_DE_PASSE_FORT> par un mot de passe robuste et unique
/user group add name=lecture policy=local,ssh,winbox,read,test,password
/user add name=superviseur group=lecture password=<MOT_DE_PASSE_FORT> \
  address=192.168.10.0/24 comment="Compte lecture seule"`,

        R`# 6. Bannière légale affichée à la connexion
/system note set show-at-login=yes note="Accès réservé aux personnes autorisées - CFP-CMD. Toute activité est journalisée."`,

        R`# 7. Mises à jour : canal long-term (stable dans le temps), vérification sans installer
/system package update set channel=long-term
/system package update check-for-updates`,

        R`# 8. Audit rapide du durcissement
/ip service print where disabled=no
/ip neighbor discovery-settings print
/tool mac-server print
/tool mac-server mac-winbox print
/ip upnp print
/ip proxy print
/ip socks print
/ip dns print
/user print
/system package print`
      ],
      winboxSteps: [
        "<span class='wb-path'>Interfaces → Interface List</span> → créer la liste <code>MGMT</code> et y ajouter <code>vlan10-IT</code>",
        "<span class='wb-path'>IP → Neighbors → Discovery Settings</span> → Discover Interface List = <code>MGMT</code>",
        "<span class='wb-path'>Tools → MAC Server</span> → Allowed Interface List = <code>none</code> ; bouton <code>MAC WinBox Server</code> → <code>MGMT</code> ; Ping désactivé",
        "<span class='wb-path'>Tools → BTest Server</span> → décocher Enabled ; <span class='wb-path'>IP → Web Proxy / Socks / UPnP / Cloud</span> → désactiver",
        "<span class='wb-path'>IP → DNS</span> → décocher <code>Allow Remote Requests</code> (si le routeur n'est pas le DNS des clients)",
        "<span class='wb-path'>System → Users → Groups → [+]</span> → <code>lecture</code> avec les droits local, ssh, winbox, read, test, password ; puis créer l'utilisateur <code>superviseur</code>",
        "<span class='wb-path'>System → Note</span> → cocher Show At Login et saisir la bannière",
        "<span class='wb-path'>System → Packages → Check For Updates</span> → Channel = <code>long-term</code>"
      ],
      diagram: "hardening",
      terminology: ["MNDP", "MAC-Server", "UPnP", "Interface list", "Service hardening", "Principe du moindre privilège"],
      concepts: [
        { term: "Réduction de la surface d'attaque", def: "Chaque service actif est un point d'entrée potentiel. On désactive tout ce qui n'est pas nécessaire et on limite le reste à l'interface d'administration (MGMT)." },
        { term: "Découverte de voisins (MNDP)", def: "Le routeur annonce son nom, sa version et ses adresses sur les interfaces où la découverte est active, ce qui renseigne un attaquant du même réseau. On la restreint à la liste MGMT." },
        { term: "Groupe de lecture seule", def: "Un groupe d'utilisateurs sans droit write, policy, reboot ni sensitive : il permet la supervision ou l'accompagnement de stagiaires sans risque de modification de la configuration." },
        { term: "Canal long-term", def: "Versions RouterOS maintenues plus longtemps avec uniquement des correctifs : adapté aux routeurs de production, contrairement au canal stable qui reçoit aussi des nouveautés." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "MAC-Server : le désactiver complètement supprime votre accès de secours si l'adressage IP est cassé. On le conserve donc pour MGMT (MAC-WinBox) et on coupe MAC-Telnet et MAC-Ping." },
        { type: "warning", icon: "fa-key", text: "Remplacez systématiquement &lt;MOT_DE_PASSE_FORT&gt; avant exécution. Si la commande /ip dns ou /ipv6 settings est inconnue, vérifiez la version de RouterOS (7.x attendu)." },
        { type: "info", icon: "fa-circle-info", text: "Appliquez ces changements en Safe Mode (section 11) puis validez-les. Désactiver un paquet inutile (/system package disable) est possible mais exige un redémarrage : à planifier hors heures de service." }
      ],
      table: {
        headers: ["Contrôle", "Commande de vérification", "Valeur attendue"],
        rows: [
          ["Services exposés", "/ip service print where disabled=no", "Uniquement ssh et winbox, restreints au réseau d'administration"],
          ["Découverte de voisins", "/ip neighbor discovery-settings print", "discover-interface-list = MGMT"],
          ["Serveurs MAC", "/tool mac-server print", "allowed-interface-list = none (mac-telnet)"],
          ["UPnP / Proxy / SOCKS", "/ip upnp print · /ip proxy print · /ip socks print", "enabled = no"],
          ["Utilisateurs", "/user print", "admin désactivé, compte lecture seule distinct"],
          ["SSH", "/ip ssh print", "strong-crypto = yes"],
          ["Mise à jour", "/system package update print", "channel = long-term, version à jour"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "backup-auto",
      track: "securite",
      level: "intermediaire",
      title: "Sauvegarde automatique & rotation",
      icon: "fa-solid fa-cloud-arrow-up",
      step: "16",
      requires: ["safemode", "validation"],
      description: "Planifier chaque nuit un backup binaire chiffré et un export .rsc, les envoyer par SFTP vers un serveur hors du routeur, puis supprimer les copies locales uniquement si l'envoi a réussi. L'horloge (fuseau et NTP) est un prérequis car les noms de fichiers portent la date.",
      cliCommands: [
        R`# 1. Fuseau horaire (Cameroun : UTC+1, pas d'heure d'été) et synchronisation NTP
/system clock set time-zone-name=Africa/Douala
/system ntp client set enabled=yes
/system ntp client servers add address=pool.ntp.org`,

        R`# 2. SUR LE SERVEUR DE SAUVEGARDE (Debian), pas sur le routeur : compte dédié
# sudo adduser mkbackup
# sudo mkdir -p /srv/backups/mikrotik && sudo chown mkbackup: /srv/backups/mikrotik`,

        R`# 3. Script de sauvegarde (voir l'alerte : de nombreux terminaux altèrent le collage ; privilégiez WinBox → System → Scripts)
# ⚠ Remplacez les 4 valeurs <...> avant exécution
/system script add name=backup-auto policy=ftp,read,write,policy,test,password,sensitive source={
  :local srv "<IP_SERVEUR_SFTP>"
  :local usr "mkbackup"
  :local pwd "<MOT_DE_PASSE_SFTP>"
  :local bpw "<MOT_DE_PASSE_BACKUP>"
  :local id [/system identity get name]
  :local stamp ([/system clock get date] . "_" . [/system clock get time])
  :local clean ""
  :for i from=0 to=([:len $stamp] - 1) do={
    :local ch [:pick $stamp $i ($i + 1)]
    :if ($ch = "/" || $ch = ":" || $ch = " ") do={ :set ch "-" }
    :set clean ($clean . $ch)
  }
  :local base ("auto-" . $id . "-" . $clean)
  /system backup save name=$base password=$bpw
  /export file=$base
  :delay 5s
  :local ok true
  :foreach ext in={".backup"; ".rsc"} do={
    :do {
      /tool fetch address=$srv mode=sftp user=$usr password=$pwd \
        src-path=($base . $ext) dst-path=("/srv/backups/mikrotik/" . $base . $ext) upload=yes
    } on-error={
      :set ok false
      :log error ("backup-auto: echec envoi " . $base . $ext)
    }
  }
  :if ($ok) do={
    /file remove [find where name=($base . ".backup")]
    /file remove [find where name=($base . ".rsc")]
    :log info ("backup-auto: envoye et supprime en local : " . $base)
  } else={
    :log warning ("backup-auto: fichiers conserves en local : " . $base)
  }
}`,

        R`# 4. Planification : tous les jours à 02:00
/system scheduler add name=sauvegarde-nocturne start-time=02:00:00 interval=1d \
  on-event="/system script run backup-auto" \
  policy=ftp,read,write,policy,test,password,sensitive comment="Sauvegarde auto + SFTP"`,

        R`# 5. Tester immédiatement et lire le résultat
/system script run backup-auto
/log print where message~"backup-auto"
/file print where name~"^auto-"`,

        R`# 6. Restaurer (tester la restauration au moins une fois par trimestre, sur un routeur de labo)
/system backup load name=<NOM_DU_FICHIER> password=<MOT_DE_PASSE_BACKUP>
# ou rejouer un export texte (fusion avec la configuration en place) :
/import file-name=<NOM_DU_FICHIER>.rsc`
      ],
      winboxSteps: [
        "<span class='wb-path'>System → Clock</span> → Time Zone Name = <code>Africa/Douala</code> ; <span class='wb-path'>System → NTP Client</span> → cocher Enabled et ajouter <code>pool.ntp.org</code>",
        "Sur le serveur Debian : créer le compte dédié et le dossier de destination des sauvegardes",
        "<span class='wb-path'>System → Scripts → [+]</span> → Name = <code>backup-auto</code>, Policy = ftp, read, write, policy, test, password, sensitive",
        "Coller le code dans le champ <code>Source</code> (méthode recommandée), remplacer les valeurs entre chevrons, puis OK",
        "<span class='wb-path'>System → Scheduler → [+]</span> → Name = <code>sauvegarde-nocturne</code>, Start Time = <code>02:00:00</code>, Interval = <code>1d 00:00:00</code>, On Event = <code>/system script run backup-auto</code>",
        "Sélectionner le script → bouton <code>Run Script</code> pour un premier essai ; contrôler <span class='wb-path'>Log</span> et <span class='wb-path'>Files</span>",
        "Sur le serveur SFTP : vérifier la présence des fichiers .backup et .rsc datés"
      ],
      diagram: "backup",
      terminology: ["Scheduler", "Script RouterOS", "SFTP", "NTP", "Backup", "Export", "Règle 3-2-1"],
      concepts: [
        { term: "Règle 3-2-1", def: "Trois copies des données, sur deux supports différents, dont une hors site. Ici : la configuration vivante du routeur, une copie sur le serveur de sauvegarde et, idéalement, une copie externe (cloud privé ou disque hors site)." },
        { term: "Suppression conditionnelle", def: "Les copies locales ne sont effacées que si les deux envois ont réussi. En cas d'échec, les fichiers restent sur le routeur et un message d'alerte est écrit dans le journal." },
        { term: "Secrets dans un script", def: "Le mot de passe SFTP est stocké en clair dans le script. Utilisez un compte dédié sans shell ni droits ailleurs, limité à son dossier, et ne partagez jamais de capture d'écran du script." },
        { term: "Sauvegarde non testée", def: "Une sauvegarde jamais restaurée n'est qu'une hypothèse. Planifiez un test de restauration sur un routeur de laboratoire pour valider la procédure." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Les valeurs entre chevrons (&lt;IP_SERVEUR_SFTP&gt;, &lt;MOT_DE_PASSE_SFTP&gt;, &lt;MOT_DE_PASSE_BACKUP&gt;) sont des PLACEHOLDERS : le script ne fonctionnera pas tant qu'elles ne sont pas remplacées." },
        { type: "warning", icon: "fa-terminal", text: "Coller un script multi-lignes dans un terminal SSH peut altérer l'indentation ou les caractères. La méthode la plus fiable est de coller le source dans le champ Source de WinBox (System → Scripts) ou de téléverser un fichier .rsc à importer." },
        { type: "info", icon: "fa-circle-info", text: "Autorisez le SFTP du routeur vers le serveur dans le pare-feu si le serveur est dans un autre VLAN. Une alerte e-mail en cas d'échec sera ajoutée avec le module Logs et supervision (parcours Exploitation)." }
      ],
      table: {
        headers: ["Fichier produit", "Format", "Usage"],
        rows: [
          ["auto-&lt;identité&gt;-&lt;date&gt;.backup", "Binaire chiffré (mot de passe)", "Restauration complète du routeur (même modèle)"],
          ["auto-&lt;identité&gt;-&lt;date&gt;.rsc", "Texte", "Relecture, comparaison entre dates, versionnement Git"],
          ["Journal /log", "Messages « backup-auto »", "Contrôle de réussite ou d'échec de chaque exécution"]
        ]
      }
    }
  ]);
})();

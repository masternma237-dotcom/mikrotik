// ═══════════════════════════════════════════════════════════════
// DIAGRAMMES — lot v2.0 (routage dynamique, CAPsMAN, labs)
// ═══════════════════════════════════════════════════════════════
MK.addDiagrams({
  ospf: () => `<div class="diagram-placeholder">
    <svg width="100%" height="210" viewBox="0 0 700 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Voisinage OSPF entre deux sites">
      ${svgBox(10,60,120,60,'#27ae60','#1a6a3e','LAN siège\n192.168.10.0/24\npassif')}
      ${svgArrow(130,90,185,90)}
      ${svgBox(185,40,130,100,'#3498db','#1a6a9e','Routeur A\nID 10.255.0.1\nzone 0')}
      ${svgArrow(315,80,385,80)}
      ${svgArrow(385,100,315,100,true)}
      <text x="322" y="70" font-family="JetBrains Mono" font-size="10" fill="#8badc8">Hello · LSA</text>
      ${svgBox(385,40,130,100,'#3498db','#1a6a9e','Routeur B\nID 10.255.0.2\nzone 0')}
      ${svgArrow(515,90,570,90)}
      ${svgBox(570,60,120,60,'#27ae60','#1a6a3e','LAN site B\n192.168.40.0/24\npassif')}
      ${svgBox(185,160,330,35,'#7f8c8d','#566573','Tunnel wg-site · auth sha256 · route statique distance 200 en secours')}
    </svg>
    <p>Les routes s'échangent seules ; la route statique reprend le relais si le voisin disparaît</p>
  </div>`,

  'bgp-intro': () => `<div class="diagram-placeholder">
    <svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Session eBGP entre deux systèmes autonomes">
      ${svgBox(10,30,260,140,'#1a3a5c','#3498db','AS 65001 · site A')}
      ${svgBox(30,70,100,50,'#27ae60','#1a6a3e','192.168.10.0/24\nbgp-nets')}
      ${svgArrow(130,95,170,95)}
      ${svgBox(170,70,90,50,'#3498db','#1a6a9e','Routeur A')}
      ${svgArrow(260,95,440,95)}
      <text x="285" y="85" font-family="JetBrains Mono" font-size="10" fill="#8badc8">eBGP · TCP 179</text>
      ${svgBox(430,30,260,140,'#1a3a5c','#9b59b6','AS 65002 · site B')}
      ${svgBox(440,70,90,50,'#3498db','#1a6a9e','Routeur B')}
      ${svgArrow(530,95,570,95)}
      ${svgBox(570,70,110,50,'#27ae60','#1a6a3e','192.168.40.0/24\nbgp-nets')}
      ${svgBox(270,150,160,35,'#e74c3c','#922b21','Laboratoire : pas de filtre')}
    </svg>
    <p>Chaque AS n'annonce que ses propres préfixes</p>
  </div>`,

  capsman: () => `<div class="diagram-placeholder">
    <svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CAPsMAN : contrôleur et borne">
      ${svgBox(10,70,130,65,'#3498db','#1a6a9e','Contrôleur CAPsMAN\nsec-cfp · dp-invites\ncfg-invites')}
      ${svgArrow(140,102,260,102)}
      <text x="150" y="92" font-family="JetBrains Mono" font-size="10" fill="#8badc8">port hybride</text>
      <text x="150" y="122" font-family="JetBrains Mono" font-size="10" fill="#8badc8">VLAN10 + VLAN20 tagged</text>
      ${svgBox(260,60,130,85,'#F39C12','#b8750d','Borne (CAP)\ngérée en VLAN 10\nCAPWAP 5246/5247')}
      ${svgArrow(390,90,470,60)}
      ${svgBox(470,30,130,50,'#9b59b6','#6c3483','SSID CFP-CMD-WiFi\nclients → VLAN 20')}
      ${svgArrow(390,120,470,155)}
      ${svgBox(470,130,130,50,'#27ae60','#1a6a3e','Autre borne\nmême configuration')}
      ${svgBox(10,155,250,40,'#7f8c8d','#566573','Un seul profil modifié → toutes les bornes à jour')}
    </svg>
    <p>La configuration Wi-Fi est définie une fois, au contrôleur</p>
  </div>`,

  'lab-infra': () => `<div class="diagram-placeholder">
    <svg width="100%" height="250" viewBox="0 0 700 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Topologie du laboratoire Proxmox VE">
      ${svgBox(10,10,680,230,'#0f2036','#2a4a6e','Hôte Proxmox VE')}
      ${svgBox(40,50,140,45,'#F39C12','#b8750d','vmbr100 · WAN simulé\nNAT 10.100.0.0/24')}
      ${svgArrow(110,95,110,125)}
      ${svgBox(40,125,140,60,'#3498db','#1a6a9e','chr-siege\nether1 · ether2 · ether3')}
      ${svgArrow(180,155,250,125)}
      ${svgBox(250,95,130,45,'#9b59b6','#6c3483','vmbr101 LAN IT\nposte Debian')}
      ${svgArrow(180,165,250,195)}
      ${svgBox(250,170,130,45,'#9b59b6','#6c3483','vmbr105 Hotspot\ninvité Debian')}
      ${svgArrow(180,72,450,72)}
      ${svgBox(450,50,140,45,'#3498db','#1a6a9e','chr-siteB\nether1 · ether2')}
      ${svgArrow(520,95,520,140)}
      ${svgBox(450,140,140,45,'#9b59b6','#6c3483','vmbr102 LAN site B')}
    </svg>
    <p>Un modèle CHR cloné en deux routeurs, reliés par des ponts isolés</p>
  </div>`,

  'lab-pme': () => `<div class="diagram-placeholder">
    <svg width="100%" height="210" viewBox="0 0 700 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lab 1 : centre de formation">
      ${svgBox(10,70,110,55,'#F39C12','#b8750d','Internet\nsimulé')}
      ${svgArrow(120,97,180,97)}
      ${svgBox(180,45,160,105,'#3498db','#1a6a9e','chr-siege\nNAT · pare-feu\nanti-brute force\nsauvegarde auto')}
      ${svgArrow(340,75,420,45)}
      ${svgBox(420,20,150,50,'#27ae60','#1a6a3e','VLAN 10 · IT\nposte admin')}
      ${svgArrow(340,125,420,155)}
      ${svgBox(420,130,150,50,'#9b59b6','#6c3483','VLAN 20 · Hotspot\nposte invité')}
      ${svgArrowRed(495,70,495,130)}
      <text x="505" y="105" font-family="JetBrains Mono" font-size="10" fill="#e74c3c">accès refusé</text>
    </svg>
    <p>Deux réseaux séparés, Internet pour tous, administration réservée au VLAN IT</p>
  </div>`,

  'lab-sites': () => `<div class="diagram-placeholder">
    <svg width="100%" height="230" viewBox="0 0 700 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lab 2 : deux sites et bascule">
      ${svgBox(10,20,130,50,'#27ae60','#1a6a3e','LAN siège\n192.168.10.0/24')}
      ${svgArrow(140,45,200,70)}
      ${svgBox(200,40,130,80,'#3498db','#1a6a9e','chr-siege\nWG · OSPF\nfailover')}
      ${svgArrow(330,60,430,60)}
      <text x="340" y="50" font-family="JetBrains Mono" font-size="10" fill="#8badc8">WireGuard 10.20.0.0/30</text>
      ${svgBox(430,40,130,80,'#3498db','#1a6a9e','chr-siteB\nWG · OSPF')}
      ${svgArrow(560,70,600,45)}
      ${svgBox(600,20,90,50,'#27ae60','#1a6a3e','LAN site B\n192.168.40.0/24')}
      ${svgBox(130,160,130,45,'#27ae60','#1a6a3e','WAN1 · vmbr100\nactif')}
      ${svgBox(300,160,130,45,'#e74c3c','#922b21','WAN2 · vmbr104\nsecours')}
      ${svgArrow(195,160,260,120)}
      ${svgArrowRed(365,160,300,120)}
    </svg>
    <p>Tunnel chiffré, routes dynamiques et second lien de secours</p>
  </div>`,

  'lab-ops': () => `<div class="diagram-placeholder">
    <svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lab 3 : exploitation">
      ${svgBox(10,60,130,80,'#3498db','#1a6a9e','chr-siege\nsyslog · SNMPv3\nREST · alertes')}
      ${svgArrow(140,80,250,45)}
      <text x="150" y="55" font-family="JetBrains Mono" font-size="10" fill="#8badc8">UDP 514</text>
      ${svgArrow(140,100,250,100)}
      <text x="150" y="94" font-family="JetBrains Mono" font-size="10" fill="#8badc8">SNMPv3 161</text>
      ${svgArrow(250,125,140,125,true)}
      ${svgArrow(140,135,250,170)}
      <text x="150" y="168" font-family="JetBrains Mono" font-size="10" fill="#8badc8">HTTPS 443</text>
      ${svgBox(250,20,150,45,'#27ae60','#1a6a3e','rsyslog\n/var/log/mikrotik')}
      ${svgBox(250,80,150,45,'#27ae60','#1a6a3e','Zabbix\nhôte supervisé')}
      ${svgBox(250,150,150,45,'#27ae60','#1a6a3e','curl · Python\ncompte lecture seule')}
      ${svgBox(450,60,240,85,'#1a3a5c','#9b59b6','Machine « ops »\n192.168.10.20\nseule autorisée par le pare-feu')}
    </svg>
    <p>Trois canaux, une seule machine d'exploitation autorisée</p>
  </div>`
});

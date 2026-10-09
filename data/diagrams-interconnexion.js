// ═══════════════════════════════════════════════════════════════
// DIAGRAMMES — Parcours « VPN & interconnexion » (SVG inline)
// ═══════════════════════════════════════════════════════════════
MK.addDiagrams({
  wireguard: () => `<div class="diagram-placeholder">
    <svg width="100%" height="210" viewBox="0 0 700 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Accès distant WireGuard">
      ${svgBox(10,65,120,55,'#9b59b6','#6c3483','Poste distant\n10.10.10.2')}
      ${svgArrow(130,92,205,92)}
      ${svgBox(205,50,160,85,'#F39C12','#b8750d','Internet\ntunnel chiffré\nUDP 51820')}
      ${svgArrow(365,92,430,92)}
      ${svgBox(430,40,130,105,'#3498db','#1a6a9e','Routeur\nwg-acces\n10.10.10.1')}
      ${svgArrow(560,92,610,92)}
      ${svgBox(610,65,80,55,'#27ae60','#1a6a3e','VLAN10\n192.168.10.0')}
      ${svgBox(205,155,160,40,'#7f8c8d','#566573','WinBox / SSH : jamais\nexposés sur Internet')}
    </svg>
    <p>Un seul port UDP visible ; l'administration passe dans le tunnel</p>
  </div>`,

  'site-to-site': () => `<div class="diagram-placeholder">
    <svg width="100%" height="210" viewBox="0 0 700 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tunnel site-à-site">
      ${svgBox(10,60,110,60,'#27ae60','#1a6a3e','LAN siège\n192.168.10.0/24')}
      ${svgArrow(120,90,165,90)}
      ${svgBox(165,45,110,90,'#3498db','#1a6a9e','Routeur A\nwg-site\n10.20.0.1')}
      ${svgArrow(275,90,425,90)}
      <text x="285" y="78" font-family="JetBrains Mono" font-size="10" fill="#8badc8">tunnel chiffré · UDP 51821</text>
      ${svgBox(425,45,110,90,'#3498db','#1a6a9e','Routeur B\nwg-site\n10.20.0.2')}
      ${svgArrow(535,90,580,90)}
      ${svgBox(580,60,110,60,'#27ae60','#1a6a3e','LAN site B\n192.168.40.0/24')}
      ${svgBox(165,155,370,40,'#7f8c8d','#566573','Route statique + allowed-address des deux côtés · pas de NAT')}
    </svg>
    <p>Deux réseaux distincts reliés comme s'ils étaient voisins</p>
  </div>`,

  'ipsec-site': () => `<div class="diagram-placeholder">
    <svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="IPsec IKEv2 site-à-site">
      ${svgBox(10,60,110,60,'#27ae60','#1a6a3e','LAN siège\n192.168.10.0/24')}
      ${svgArrow(120,90,165,90)}
      ${svgBox(165,40,120,100,'#3498db','#1a6a9e','Routeur A\npolicy + SA\nESP AES-256')}
      ${svgArrow(285,90,415,90)}
      <text x="295" y="78" font-family="JetBrains Mono" font-size="10" fill="#8badc8">IKE 500/4500 · ESP</text>
      ${svgBox(415,40,120,100,'#3498db','#1a6a9e','Routeur B\npolicy + SA\nESP AES-256')}
      ${svgArrow(535,90,580,90)}
      ${svgBox(580,60,110,60,'#27ae60','#1a6a3e','LAN site B\n192.168.40.0/24')}
      ${svgBox(165,160,150,45,'#F39C12','#b8750d','NAT : exception\navant masquerade')}
      ${svgBox(385,160,150,45,'#e74c3c','#922b21','RAW : exception\nbogons WAN')}
    </svg>
    <p>Politique symétrique, NAT contourné et bogons autorisés pour le trafic déchiffré</p>
  </div>`,

  'failover-wan': () => `<div class="diagram-placeholder">
    <svg width="100%" height="230" viewBox="0 0 700 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Failover WAN">
      ${svgBox(10,80,110,55,'#9b59b6','#6c3483','LAN\nVLAN10 · VLAN20')}
      ${svgArrow(120,107,185,107)}
      ${svgBox(185,60,150,95,'#3498db','#1a6a9e','Routeur\nroutes récursives\ncheck-gateway=ping')}
      ${svgArrow(335,90,430,50)}
      ${svgBox(430,20,140,55,'#27ae60','#1a6a3e','WAN1 · ether1\ndistance 1 (actif)')}
      ${svgArrow(335,125,430,170)}
      ${svgBox(430,145,140,55,'#F39C12','#b8750d','WAN2 · ether5\ndistance 2 (secours)')}
      ${svgArrow(570,47,620,95)}
      ${svgArrow(570,172,620,120)}
      ${svgBox(620,85,70,45,'#7f8c8d','#566573','Internet')}
      ${svgBox(185,185,150,35,'#e74c3c','#922b21','Netwatch : journal\nde chaque bascule')}
    </svg>
    <p>Si le ping échoue à travers le WAN1, la route de distance 2 devient active</p>
  </div>`,

  'load-balancing': () => `<div class="diagram-placeholder">
    <svg width="100%" height="230" viewBox="0 0 700 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Répartition PCC">
      ${svgBox(10,80,110,55,'#9b59b6','#6c3483','Connexions\ndu LAN')}
      ${svgArrow(120,107,180,107)}
      ${svgBox(180,50,160,115,'#d35400','#a04000','Mangle PCC\nboth-addresses:2\nreste 0 → wan1\nreste 1 → wan2')}
      ${svgArrow(340,85,430,50)}
      ${svgBox(430,20,140,55,'#27ae60','#1a6a3e','Table to-wan1\nWAN1 · secours WAN2')}
      ${svgArrow(340,135,430,175)}
      ${svgBox(430,150,140,55,'#27ae60','#1a6a3e','Table to-wan2\nWAN2 · secours WAN1')}
      ${svgArrow(570,47,620,100)}
      ${svgArrow(570,177,620,125)}
      ${svgBox(620,90,70,45,'#7f8c8d','#566573','Internet')}
      ${svgBox(180,185,160,35,'#e74c3c','#922b21','FastTrack : OFF')}
    </svg>
    <p>Chaque connexion garde son lien ; les réponses reviennent par le lien d'origine</p>
  </div>`
});

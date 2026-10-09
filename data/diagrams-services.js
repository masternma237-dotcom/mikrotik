// ═══════════════════════════════════════════════════════════════
// DIAGRAMMES — Parcours « Services réseau » (SVG inline)
// Helpers : svgBox / svgArrow / svgArrowRed (js/diagrams.js)
// ═══════════════════════════════════════════════════════════════
MK.addDiagrams({
  'nat-advanced': () => `<div class="diagram-placeholder">
    <svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Redirection de port et hairpin NAT">
      ${svgBox(10,30,110,50,'#F39C12','#b8750d','Internet\nclient externe')}
      ${svgArrow(120,55,170,55)}
      ${svgBox(170,15,150,80,'#3498db','#1a6a9e','Routeur\ndst-nat :8443\nvers :443')}
      ${svgArrow(320,55,390,55)}
      ${svgBox(390,30,130,50,'#27ae60','#1a6a3e','Serveur web\n192.168.10.50')}
      ${svgBox(10,140,110,50,'#9b59b6','#6c3483','Poste VLAN10\n192.168.10.x')}
      ${svgArrow(120,165,170,100,true)}
      ${svgBox(170,130,150,60,'#3498db','#1a6a9e','Hairpin\nIP publique + :8443')}
      ${svgArrow(320,160,390,85)}
      <text x="540" y="50" font-family="JetBrains Mono" font-size="10" fill="#8badc8">FORWARD : accepter</text>
      <text x="540" y="64" font-family="JetBrains Mono" font-size="10" fill="#8badc8">connection-nat-state=dstnat</text>
      <text x="540" y="170" font-family="JetBrains Mono" font-size="10" fill="#8badc8">masquerade interne :</text>
      <text x="540" y="184" font-family="JetBrains Mono" font-size="10" fill="#8badc8">la réponse repasse par le routeur</text>
    </svg>
    <p>Un service interne publié sur le WAN, et joignable aussi depuis le LAN par la même adresse</p>
  </div>`,

  'dns-local': () => `<div class="diagram-placeholder">
    <svg width="100%" height="210" viewBox="0 0 700 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Résolveur DNS du routeur">
      ${svgBox(10,70,110,55,'#9b59b6','#6c3483','Clients LAN\nDNS = routeur')}
      ${svgArrow(120,97,175,97)}
      ${svgBox(175,50,150,95,'#3498db','#1a6a9e','Routeur DNS\ncache 4 Mo\nstatiques / regexp')}
      ${svgArrow(325,75,400,40)}
      ${svgBox(400,10,150,50,'#27ae60','#1a6a3e','DNS publics\n1.1.1.1 / 9.9.9.9')}
      ${svgArrow(325,120,400,155)}
      ${svgBox(400,130,150,55,'#F39C12','#b8750d','Contrôleur de domaine\ntype FWD')}
      ${svgBox(575,70,115,55,'#e74c3c','#922b21','WAN : port 53\nFERMÉ')}
      ${svgArrowRed(575,97,330,97)}
      ${svgBox(10,150,130,40,'#d35400','#a04000','DNS tiers (53)\nredirect')}
      ${svgArrow(140,170,175,125,true)}
    </svg>
    <p>Un seul DNS pour les clients : le routeur résout, met en cache et redirige selon le domaine</p>
  </div>`,

  'ntp-server': () => `<div class="diagram-placeholder">
    <svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hiérarchie NTP">
      ${svgBox(10,60,130,55,'#27ae60','#1a6a3e','pool.ntp.org\nsource amont')}
      ${svgArrow(140,87,195,87)}
      ${svgBox(195,45,150,85,'#3498db','#1a6a9e','Routeur\nclient + serveur NTP\nUDP 123')}
      ${svgArrow(345,70,420,40)}
      ${svgBox(420,10,130,50,'#9b59b6','#6c3483','VLAN10\noption DHCP 42')}
      ${svgArrow(345,105,420,140)}
      ${svgBox(420,115,130,50,'#9b59b6','#6c3483','VLAN20\noption DHCP 42')}
      ${svgBox(575,10,115,50,'#7f8c8d','#566573','Postes + serveurs\nhorloge alignée')}
      ${svgArrow(550,35,575,35)}
    </svg>
    <p>Un seul équipement interroge Internet : tout le réseau s'aligne sur le routeur</p>
  </div>`,

  'dhcp-advanced': () => `<div class="diagram-placeholder">
    <svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="DHCP avancé : réservation, alerte, ARP">
      ${svgBox(10,20,130,50,'#27ae60','#1a6a3e','Équipement connu\nMAC réservée')}
      ${svgArrow(140,45,205,80)}
      ${svgBox(205,60,150,80,'#3498db','#1a6a9e','Serveur DHCP\nvlan10-IT\nARP reply-only')}
      ${svgArrow(355,100,430,100)}
      ${svgBox(430,75,130,50,'#27ae60','#1a6a3e','Bail + options\n42 · 66 · 121')}
      ${svgBox(10,150,130,50,'#e74c3c','#922b21','Faux serveur DHCP\nou IP fixe')}
      ${svgArrowRed(140,175,205,130)}
      ${svgBox(430,150,260,50,'#d35400','#a04000','Alerte DHCP (log) · pas de réponse ARP\naccès refusé')}
      ${svgArrowRed(355,125,430,165)}
      <text x="580" y="95" font-family="JetBrains Mono" font-size="10" fill="#8badc8">liste clients-vlan10</text>
    </svg>
    <p>Le VLAN IT n'accepte que les clients passés par le DHCP officiel</p>
  </div>`,

  'qos-simple': () => `<div class="diagram-placeholder">
    <svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hiérarchie de Simple Queues">
      ${svgBox(260,10,180,45,'#F39C12','#b8750d','Liaison WAN\nmesurée (90 %)')}
      ${svgArrow(310,55,170,90)}
      ${svgArrow(390,55,530,90)}
      ${svgBox(70,90,200,50,'#3498db','#1a6a9e','q-vlan10 · 10M/20M\npriorité 4')}
      ${svgBox(430,90,200,50,'#9b59b6','#6c3483','q-vlan20 · 5M/10M\npriorité 8')}
      ${svgArrow(130,140,90,170)}
      ${svgArrow(210,140,250,170)}
      ${svgBox(10,170,160,45,'#27ae60','#1a6a3e','client-demo\nburst 10M / 20 s')}
      ${svgBox(190,170,160,45,'#27ae60','#1a6a3e','poste-direction\npriorité 1')}
      ${svgBox(450,170,180,45,'#27ae60','#1a6a3e','Hotspot invite-5M\n2M/5M par compte')}
      ${svgArrow(530,140,540,170)}
    </svg>
    <p>Chaque enfant partage l'enveloppe de son parent ; les files prioritaires passent d'abord</p>
  </div>`,

  'qos-pcq': () => `<div class="diagram-placeholder">
    <svg width="100%" height="230" viewBox="0 0 700 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="PCQ et Queue Tree">
      ${svgBox(10,20,120,50,'#9b59b6','#6c3483','Clients Hotspot\nA · B · C')}
      ${svgArrow(130,45,185,45)}
      ${svgBox(185,10,170,70,'#3498db','#1a6a9e','PCQ 20M\nparts égales\npar client')}
      ${svgArrow(355,45,420,45)}
      ${svgBox(420,20,130,50,'#27ae60','#1a6a3e','A=B=C\nsi saturé')}
      ${svgBox(10,130,120,50,'#F39C12','#b8750d','Paquets VoIP\nmarque voip-pkt')}
      ${svgArrow(130,155,185,155)}
      ${svgBox(185,120,170,70,'#d35400','#a04000','Queue Tree ether1\nup-voip priorité 1')}
      ${svgArrow(355,155,420,155)}
      ${svgBox(420,130,130,50,'#27ae60','#1a6a3e','Voix servie\nen priorité')}
      ${svgBox(575,60,115,90,'#e74c3c','#922b21','FastTrack\nOFF si QoS\n(contourne\nles files)')}
    </svg>
    <p>PCQ répartit équitablement ; Queue Tree donne la priorité à la voix ; FastTrack doit rester désactivé</p>
  </div>`
});

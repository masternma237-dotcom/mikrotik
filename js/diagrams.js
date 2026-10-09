// ═══════════════════════════════════════════════════════════════
// DIAGRAMS (SVG inline) — schémas du parcours Socle + helpers SVG
// Les schémas des autres parcours vivent dans data/diagrams-*.js
// ═══════════════════════════════════════════════════════════════
function renderDiagram(type, section) {
  const diagrams = {
    intro: `<div class="diagram-placeholder">
      <svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
        ${svgBox(20,60,100,50,'#F39C12','#b8750d','Internet / WAN')}
        ${svgArrow(120,85,180,85)}
        ${svgBox(180,40,120,90,'#3498db','#1a6a9e','MikroTik\nRouter')}
        ${svgArrow(300,65,360,65)}
        ${svgArrow(300,105,360,105)}
        ${svgBox(360,30,120,50,'#27ae60','#1a6a3e','VLAN10 — IT\n192.168.10.0/24')}
        ${svgBox(360,90,120,50,'#9b59b6','#6c3483','VLAN20 — Hotspot\n192.168.20.0/24')}
        ${svgArrow(480,55,560,55)}
        ${svgArrow(480,115,560,115)}
        ${svgBox(560,30,120,50,'#2c3e50','#1a252f','Clients IT\n(ether3-5)')}
        ${svgBox(560,90,120,50,'#2c3e50','#1a252f','Invités\nHotspot')}
      </svg>
      <p>Architecture globale du réseau MikroTik CFP-CMD</p>
    </div>`,

    securing: `<div class="diagram-placeholder">
      <svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
        ${svgBox(20,75,100,50,'#e74c3c','#922b21','Attaquant\nInternet')}
        ${svgArrowRed(120,100,200,100)}
        ${svgBox(200,60,130,80,'#F39C12','#b8750d','MikroTik\nSSH/WinBox\n(Port Restreint)')}
        ${svgArrow(330,85,410,85,true)}
        ${svgArrowRed(330,115,410,115)}
        ${svgBox(410,60,130,80,'#27ae60','#1a6a3e','Admin\nadm_network\n(VLAN10 only)')}
        ${svgBox(410,150,130,40,'#e74c3c','#922b21','admin (Disabled)')}
        <text x="205" y="52" font-family="JetBrains Mono" font-size="11" fill="#F39C12">ACL: 192.168.10.0/24</text>
        <text x="335" y="95" font-family="JetBrains Mono" font-size="10" fill="#27ae60">✓ Autorisé</text>
        <text x="335" y="125" font-family="JetBrains Mono" font-size="10" fill="#e74c3c">✗ Bloqué</text>
      </svg>
      <p>Protection du routeur — accès admin limité au VLAN IT</p>
    </div>`,

    bridge: `<div class="diagram-placeholder">
      <svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
        ${svgBox(20,20,80,30,'#2c3e50','#1a252f','ether2')}
        ${svgBox(20,65,80,30,'#2c3e50','#1a252f','ether3')}
        ${svgBox(20,110,80,30,'#2c3e50','#1a252f','ether4')}
        ${svgBox(20,155,80,30,'#2c3e50','#1a252f','wlan1 (Wi-Fi)')}
        ${svgLine(100,35,280,85)}
        ${svgLine(100,80,280,90)}
        ${svgLine(100,125,280,95)}
        ${svgLine(100,170,280,105)}
        ${svgBox(280,55,140,80,'#3498db','#1a6a9e','bridge-local\n(Switch Logique)\nVLAN-aware')}
        ${svgArrow(420,90,510,90)}
        ${svgBox(510,60,140,60,'#F39C12','#b8750d','VLANs 10 & 20\n+ Routage IP')}
      </svg>
      <p>Bridge regroupe toutes les interfaces physiques et Wi-Fi</p>
    </div>`,

    vlan: `<div class="diagram-placeholder">
      <svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
        ${svgBox(20,80,100,40,'#2c3e50','#1a252f','bridge-local')}
        ${svgArrow(120,100,200,65)}
        ${svgArrow(120,100,200,135)}
        ${svgBox(200,40,160,50,'#27ae60','#1a6a3e','VLAN10 — IT\nvlan-id=10 | PVID=10')}
        ${svgBox(200,110,160,50,'#9b59b6','#6c3483','VLAN20 — Hotspot\nvlan-id=20 | PVID=20')}
        ${svgArrow(360,65,450,65)}
        ${svgArrow(360,135,450,135)}
        ${svgBox(450,40,220,50,'#2c3e50','#1a252f','192.168.10.0/24\nether3,4,5 (access ports)')}
        ${svgBox(450,110,220,50,'#2c3e50','#1a252f','192.168.20.0/24\nether5 / Wi-Fi Hotspot')}
        <text x="120" y="78" font-family="JetBrains Mono" font-size="9" fill="#F39C12">Tag 0x8100</text>
        <text x="120" y="148" font-family="JetBrains Mono" font-size="9" fill="#F39C12">Tag 0x8100</text>
      </svg>
      <p>Segmentation 802.1Q — VLAN10 IT isolé du VLAN20 Hotspot</p>
    </div>`,

    addressing: `<div class="diagram-placeholder">
      <svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
        ${svgBox(20,65,120,50,'#2c3e50','#1a252f','WAN ether1\nDHCP FAI')}
        ${svgArrow(140,90,220,90)}
        ${svgBox(220,40,180,40,'#27ae60','#1a6a3e','vlan10-IT\n192.168.10.1/24')}
        ${svgBox(220,100,180,40,'#9b59b6','#6c3483','vlan20-Hotspot\n192.168.20.1/24')}
        ${svgArrow(400,60,490,60)}
        ${svgArrow(400,120,490,120)}
        ${svgBox(490,40,190,40,'#2c3e50','#1a252f','Clients: .10.100-.200')}
        ${svgBox(490,100,190,40,'#2c3e50','#1a252f','Clients: .20.100-.250')}
        <text x="225" y="32" font-family="JetBrains Mono" font-size="10" fill="#27ae60">GW: 192.168.10.1</text>
        <text x="225" y="92" font-family="JetBrains Mono" font-size="10" fill="#9b59b6">GW: 192.168.20.1</text>
      </svg>
      <p>Plan d'adressage IP — gateways sur chaque interface VLAN</p>
    </div>`,

    dhcp: `<div class="diagram-placeholder">
      <svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
        ${svgBox(20,55,130,70,'#F39C12','#b8750d','MikroTik\nDHCP Server\nx2 instances')}
        <text x="25" y="48" font-family="JetBrains Mono" font-size="10" fill="#27ae60">pool-vlan10: .100-.200</text>
        <text x="25" y="142" font-family="JetBrains Mono" font-size="10" fill="#9b59b6">pool-vlan20: .100-.250</text>
        ${svgArrow(150,75,240,55)}
        ${svgArrow(150,105,240,125)}
        ${svgBox(240,30,200,50,'#27ae60','#1a6a3e','VLAN10 Client\nDiscover→Offer→Request→ACK\n192.168.10.x / lease=1d')}
        ${svgBox(240,100,200,50,'#9b59b6','#6c3483','VLAN20 Client\nDiscover→Offer→Request→ACK\n192.168.20.x / lease=2h')}
        ${svgArrow(440,55,540,55)}
        ${svgArrow(440,125,540,125)}
        ${svgBox(540,30,140,50,'#2c3e50','#1a252f','PC VLAN10\nGW:10.1 DNS:8.8.8.8')}
        ${svgBox(540,100,140,50,'#2c3e50','#1a252f','PC VLAN20\nGW:20.1 DNS:8.8.8.8')}
      </svg>
      <p>Distribution DHCP par VLAN — baux différenciés IT et Hotspot</p>
    </div>`,

    routing: `<div class="diagram-placeholder">
      <svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
        ${svgBox(20,65,120,50,'#e74c3c','#922b21','Internet\n0.0.0.0/0')}
        ${svgArrow(140,90,230,90)}
        ${svgBox(230,40,160,100,'#F39C12','#b8750d','MikroTik\nRoute: 0.0.0.0/0\n→ GW FAI\nNAT masquerade')}
        ${svgArrow(390,65,470,65)}
        ${svgArrow(390,115,470,115)}
        ${svgBox(470,40,200,50,'#27ae60','#1a6a3e','192.168.10.0/24 (IT)\nSrc NAT → IP WAN')}
        ${svgBox(470,100,200,50,'#9b59b6','#6c3483','192.168.20.0/24 (Hotspot)\nSrc NAT → IP WAN')}
        <text x="235" y="155" font-family="JetBrains Mono" font-size="10" fill="#F39C12">srcnat chain=masquerade out=ether1</text>
      </svg>
      <p>Routage par défaut + NAT masquerade vers Internet via WAN</p>
    </div>`,

    hotspot: `<div class="diagram-placeholder">
      <svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
        ${svgBox(20,80,120,40,'#2c3e50','#1a252f','Client VLAN20\nSmartphone')}
        ${svgArrow(140,100,220,100)}
        ${svgBox(220,60,160,80,'#F39C12','#b8750d','MikroTik Hotspot\nPortail Captif\nHTTP-CHAP Auth')}
        ${svgArrow(380,85,460,65)}
        ${svgArrowRed(380,115,460,135)}
        ${svgBox(460,40,200,50,'#27ae60','#1a6a3e','Authentifié → Internet\n(WAN ether1)')}
        ${svgBox(460,110,200,50,'#e74c3c','#922b21','Non-auth → Page login\nRedirection 302')}
        <text x="225" y="155" font-family="JetBrains Mono" font-size="10" fill="#e74c3c">TTL≤1 → DROP (anti-tethering)</text>
        <text x="225" y="170" font-family="JetBrains Mono" font-size="10" fill="#27ae60">TTL≥2 → VLAN20→WAN OK</text>
      </svg>
      <p>Portail captif Hotspot + blocage tethering par TTL filtering</p>
    </div>`,

    firewall: `<div class="diagram-placeholder">
      <svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
        ${svgBox(20,20,110,50,'#27ae60','#1a6a3e','VLAN10 IT\n192.168.10.x')}
        ${svgBox(20,90,110,50,'#9b59b6','#6c3483','VLAN20 Hotspot\n192.168.20.x')}
        ${svgBox(20,160,110,50,'#e74c3c','#922b21','Attaquant\nInternet')}
        ${svgArrow(130,45,240,80)}
        ${svgArrow(130,115,240,100)}
        ${svgArrowRed(130,185,240,120)}
        ${svgBox(240,55,160,110,'#F39C12','#b8750d','Firewall\nINPUT\nFORWARD\nNAT')}
        ${svgArrow(400,80,490,60)}
        ${svgArrow(400,100,490,100)}
        ${svgArrowRed(400,115,490,150)}
        ${svgBox(490,40,180,40,'#27ae60','#1a6a3e','✓ VLAN10 → ALL OK')}
        ${svgBox(490,90,180,30,'#27ae60','#1a6a3e','✓ VLAN20 → WAN OK')}
        ${svgBox(490,130,180,40,'#e74c3c','#922b21','✗ VLAN20→VLAN10 DROP')}
        <text x="245" y="48" font-family="JetBrains Mono" font-size="9" fill="#2c3e50">established/related: ACCEPT</text>
        <text x="245" y="180" font-family="JetBrains Mono" font-size="9" fill="#e74c3c">Attaque INPUT: DROP</text>
      </svg>
      <p>Politique de filtrage — isolation VLAN + protection routeur</p>
    </div>`,

    validation: `<div class="diagram-placeholder">
      <svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
        ${svgBox(20,30,140,50,'#27ae60','#1a6a3e','✓ VLAN10 Client\n→ Internet (ping OK)')}
        ${svgBox(20,100,140,50,'#9b59b6','#6c3483','✓ VLAN20 Client\n→ Portail Hotspot')}
        ${svgArrow(160,55,260,55)}
        ${svgArrow(160,125,260,125)}
        ${svgBox(260,30,180,50,'#F39C12','#b8750d','MikroTik\n/ping 8.8.8.8\n/log print follow')}
        ${svgBox(260,100,180,50,'#F39C12','#b8750d','Hotspot Server\nLeases actifs\n/ip dhcp-server lease print')}
        ${svgArrow(440,55,540,55)}
        ${svgArrowRed(330,95,330,85)}
        ${svgBox(540,30,140,50,'#27ae60','#1a6a3e','✓ Internet\n8.8.8.8 répond')}
        ${svgBox(540,100,140,50,'#e74c3c','#922b21','✗ VLAN20→VLAN10\nTimeout (isolé)')}
      </svg>
      <p>Checklist de validation — tous les scénarios testés</p>
    </div>`
  };

  // Schémas des modules ajoutés après la v1.1 : enregistrés via MK.addDiagrams()
  if (diagrams[type]) return diagrams[type];
  if (window.MK && typeof MK.diagrams[type] === 'function') return MK.diagrams[type](section);
  return `<div class="diagram-placeholder"><p>[Schéma: ${type}]</p></div>`;
}

// SVG helper functions
function svgBox(x, y, w, h, fill, stroke, text) {
  const lines = text.split('\n');
  const lineH = 14;
  const startY = y + h/2 - (lines.length * lineH)/2 + 10;
  let textSvg = lines.map((l, i) =>
    `<text x="${x+w/2}" y="${startY + i*lineH}" text-anchor="middle" font-family="JetBrains Mono" font-size="10" fill="white">${l}</text>`
  ).join('');
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>${textSvg}`;
}

function svgArrow(x1, y1, x2, y2, dashed = false) {
  const dashAttr = dashed ? 'stroke-dasharray="6,3"' : '';
  return `<defs><marker id="arr-g-${x1}-${x2}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#27ae60"/></marker></defs>
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#27ae60" stroke-width="2" ${dashAttr} marker-end="url(#arr-g-${x1}-${x2})"/>`;
}

function svgArrowRed(x1, y1, x2, y2) {
  return `<defs><marker id="arr-r-${x1}-${x2}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#e74c3c"/></marker></defs>
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e74c3c" stroke-width="2" stroke-dasharray="4,3" marker-end="url(#arr-r-${x1}-${x2})"/>`;
}

function svgLine(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#3498db" stroke-width="1.5" opacity="0.6"/>`;
}

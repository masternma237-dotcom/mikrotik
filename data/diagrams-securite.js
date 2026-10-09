// ═══════════════════════════════════════════════════════════════
// DIAGRAMMES — Parcours « Sécurité avancée » (SVG inline)
// Utilise les helpers de js/diagrams.js : svgBox / svgArrow / svgArrowRed
// ═══════════════════════════════════════════════════════════════
MK.addDiagrams({
  safemode: () => `<div class="diagram-placeholder">
    <svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Safe Mode : validation ou annulation automatique">
      ${svgBox(15,70,110,50,'#3498db','#1a6a9e','Admin\nWinBox / SSH')}
      ${svgArrow(125,95,175,95)}
      ${svgBox(175,70,120,50,'#F39C12','#b8750d','Safe Mode\nCtrl+X')}
      ${svgArrow(295,95,345,95)}
      ${svgBox(345,70,130,50,'#9b59b6','#6c3483','Modifications\ntemporaires')}
      ${svgArrow(475,85,545,45)}
      ${svgBox(545,15,140,50,'#27ae60','#1a6a3e','Ctrl+X : validé\nconservé')}
      ${svgArrowRed(475,105,545,145)}
      ${svgBox(545,120,140,55,'#e74c3c','#922b21','Connexion perdue\nrollback auto')}
    </svg>
    <p>Safe Mode — les changements ne deviennent définitifs qu'une fois validés</p>
  </div>`,

  bruteforce: () => `<div class="diagram-placeholder">
    <svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Paliers anti-brute force">
      ${svgBox(10,50,110,55,'#3498db','#1a6a9e','Nouvelle\nconnexion SSH')}
      ${svgArrow(120,77,150,77)}
      ${svgBox(150,50,110,55,'#F39C12','#b8750d','ssh_stage1\n1 min')}
      ${svgArrow(260,77,290,77)}
      ${svgBox(290,50,110,55,'#F39C12','#b8750d','ssh_stage2\n1 min')}
      ${svgArrow(400,77,430,77)}
      ${svgBox(430,50,110,55,'#d35400','#a04000','ssh_stage3\n1 min')}
      ${svgArrow(540,77,570,77)}
      ${svgBox(570,50,120,55,'#e74c3c','#922b21','ssh_blacklist\nDROP 1 jour')}
      ${svgBox(10,135,150,45,'#27ae60','#1a6a3e','Whitelist admin\ntoujours accepté')}
      ${svgArrow(160,157,215,157,true)}
      <text x="225" y="161" font-family="JetBrains Mono" font-size="10" fill="#8badc8">saute les paliers (règle placée en tête)</text>
    </svg>
    <p>Chaque nouvelle connexion rapprochée fait monter l'adresse source d'un palier</p>
  </div>`,

  raw: () => `<div class="diagram-placeholder">
    <svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ordre de traitement RAW puis filter">
      ${svgBox(10,60,100,55,'#F39C12','#b8750d','Paquet\nentrant')}
      ${svgArrow(110,87,150,87)}
      ${svgBox(150,45,160,85,'#e74c3c','#922b21','RAW prerouting\nlistes noires\nflags TCP\nanti-spoof')}
      ${svgArrow(310,87,350,87)}
      ${svgBox(350,60,130,55,'#3498db','#1a6a3e','Connection\ntracking')}
      ${svgArrow(480,87,520,87)}
      ${svgBox(520,45,170,85,'#27ae60','#1a6a3e','Filter\ninput / forward\nrègles stateful')}
      ${svgArrowRed(230,130,230,150)}
      ${svgBox(150,150,160,35,'#7f8c8d','#566573','Drop précoce : CPU économisé')}
    </svg>
    <p>La table RAW agit avant le suivi de connexions : les paquets hostiles ne coûtent presque rien</p>
  </div>`,

  scan: () => `<div class="diagram-placeholder">
    <svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Détection de scan et blocage RAW">
      ${svgBox(10,65,110,55,'#e74c3c','#922b21','Attaquant\nnmap / flood')}
      ${svgArrow(120,92,160,92)}
      ${svgBox(160,50,150,85,'#F39C12','#b8750d','Filter input\nPSD\nconnection-limit')}
      ${svgArrow(310,92,350,92)}
      ${svgBox(350,50,160,85,'#9b59b6','#6c3483','Address lists\nport_scanners\nddos_attackers')}
      ${svgArrow(510,92,550,92)}
      ${svgBox(550,65,140,55,'#e74c3c','#922b21','RAW prerouting\nDROP')}
      ${svgArrow(430,135,430,160,true)}
      <text x="440" y="175" font-family="JetBrains Mono" font-size="10" fill="#8badc8">expiration automatique (10 min / 2 sem.)</text>
    </svg>
    <p>Détecter, mémoriser dans une liste, puis jeter dès la table RAW</p>
  </div>`,

  hardening: () => `<div class="diagram-placeholder">
    <svg width="100%" height="210" viewBox="0 0 700 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Surface d'attaque réduite">
      ${svgBox(20,10,150,45,'#27ae60','#1a6a3e','Voisins MNDP\nlimités à MGMT')}
      ${svgBox(20,82,150,45,'#27ae60','#1a6a3e','MAC-Telnet / Ping\ndésactivés')}
      ${svgBox(20,154,150,45,'#27ae60','#1a6a3e','Proxy SOCKS UPnP\ncloud : off')}
      ${svgArrow(170,32,290,85)}
      ${svgArrow(170,104,290,104)}
      ${svgArrow(170,176,290,123)}
      ${svgBox(290,75,120,60,'#3498db','#1a6a9e','MikroTik\nRouterOS 7')}
      ${svgArrow(530,32,410,85)}
      ${svgArrow(530,104,410,104)}
      ${svgArrow(530,176,410,123)}
      ${svgBox(530,10,150,45,'#27ae60','#1a6a3e','SSH strong-crypto\nIPv6 off')}
      ${svgBox(530,82,150,45,'#27ae60','#1a6a3e','Compte lecture\nseule + bannière')}
      ${svgBox(530,154,150,45,'#27ae60','#1a6a3e','Mises à jour\ncanal long-term')}
    </svg>
    <p>Chaque service désactivé ou restreint retire un point d'entrée</p>
  </div>`,

  backup: () => `<div class="diagram-placeholder">
    <svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chaîne de sauvegarde automatique">
      ${svgBox(10,65,110,55,'#F39C12','#b8750d','Scheduler\n02:00 / jour')}
      ${svgArrow(120,92,155,92)}
      ${svgBox(155,65,120,55,'#3498db','#1a6a9e','Script\nbackup-auto')}
      ${svgArrow(275,92,310,92)}
      ${svgBox(310,65,130,55,'#9b59b6','#6c3483','.backup chiffré\n+ export .rsc')}
      ${svgArrow(440,80,505,45)}
      ${svgBox(505,15,185,50,'#27ae60','#1a6a3e','Serveur SFTP hors routeur\ncopie locale supprimée')}
      ${svgArrowRed(440,105,505,145)}
      ${svgBox(505,125,185,55,'#e74c3c','#922b21','Échec envoi\nfichiers gardés + log')}
    </svg>
    <p>Les copies locales ne sont supprimées qu'après un envoi réussi</p>
  </div>`
});

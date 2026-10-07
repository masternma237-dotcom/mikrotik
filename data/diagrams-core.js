// ═══════════════════════════════════════════════════════════════
// DIAGRAMMES — Parcours Socle : schémas ajoutés après la v1.1
// (le schéma « wifi » était référencé par la section 03 mais absent)
// ═══════════════════════════════════════════════════════════════
MK.addDiagrams({
  wifi: () => `<div class="diagram-placeholder">
    <svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wi-Fi rattaché au bridge">
      ${svgBox(10,70,110,55,'#9b59b6','#6c3483','Clients Wi-Fi\nSSID CFP-CMD-WiFi')}
      ${svgArrow(120,97,165,97)}
      ${svgBox(165,60,130,75,'#3498db','#1a6a9e','wlan1\nap-bridge\nWPA2-PSK (AES)')}
      ${svgArrow(295,97,345,97)}
      ${svgBox(345,70,120,55,'#F39C12','#b8750d','bridge-local\nvlan-filtering')}
      ${svgArrow(465,85,540,45)}
      ${svgBox(540,15,150,50,'#27ae60','#1a6a3e','ether2-5\nclients filaires')}
      ${svgArrow(465,110,540,150)}
      ${svgBox(540,125,150,50,'#27ae60','#1a6a3e','VLAN 10 / 20\nvers le routeur')}
    </svg>
    <p>L'interface sans fil rejoint le bridge : filaire et Wi-Fi partagent la même couche 2</p>
  </div>`
});

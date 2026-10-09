// ═══════════════════════════════════════════════════════════════
// OUTIL — Générateur de configuration .rsc (section 32)
// Produit un script RouterOS cohérent avec les sections du guide
// (mêmes noms d'objets et mêmes commentaires de règles, donc les commandes
// des autres sections — place-before=[find where comment=…] — continuent de fonctionner).
//
// Sécurité : 100 % local (aucun réseau, aucun stockage, rien n'est mémorisé).
//  • tous les champs texte sont validés par liste blanche de caractères ;
//  • les secrets saisis sont échappés (\\ \" \$ \?) avant d'entrer dans le script ;
//  • un secret laissé vide reste un placeholder NON QUOTÉ : la ligne échoue à
//    l'import au lieu de créer un mot de passe faible littéral.
// generate() est une fonction pure : elle est testée sous Node (tools/test-generator.js).
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const PORTS = ['ether2', 'ether3', 'ether4', 'ether5'];

  function defaults() {
    return {
      host: 'MK-CFP-CMD', tz: 'Africa/Douala',
      adminUser: 'adm_network', adminPass: '', disableAdmin: true, mgmtNet: '192.168.10.0/24',
      wanMode: 'dhcp', wanIp: '', wanGw: '',
      itGw: '192.168.10.1/24', hsGw: '192.168.20.1/24',
      ports: { ether2: 'trunk', ether3: 'it', ether4: 'hotspot', ether5: 'unused' },
      wifiOn: true, ssid: 'CFP-CMD-WiFi', wifiKey: '', wifiVlan: 'hotspot',
      mFirewall: true, mHotspot: true, hotspotUserPass: '',
      mAntiBf: false, bfAdminIp: '192.168.10.10',
      mHarden: true, mDns: false, mNtp: true
    };
  }

  // ── Validation (listes blanches) ─────────────────────────────
  const RE = {
    host: /^[A-Za-z0-9][A-Za-z0-9-]{0,31}$/,
    tz: /^[A-Za-z]+\/[A-Za-z_]+$/,
    user: /^[a-z][a-z0-9_-]{2,31}$/,
    ssid: /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,31}$/
  };

  function octets(s) {
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(String(s).trim());
    if (!m) return null;
    const o = m.slice(1).map(Number);
    return o.every((n) => n >= 0 && n <= 255) ? o : null;
  }
  function parseCidr(s, wantPrefix) {
    const parts = String(s).trim().split('/');
    if (parts.length !== 2 || !/^\d{1,2}$/.test(parts[1])) return null;
    const o = octets(parts[0]); const p = Number(parts[1]);
    if (!o || p < 0 || p > 32) return null;
    if (wantPrefix !== undefined && p !== wantPrefix) return null;
    return { o, p };
  }
  function secretOk(s) { return typeof s === 'string' && !/[\r\n\u0000]/.test(s); }

  function validate(c) {
    const e = [];
    if (!RE.host.test(c.host)) e.push('Nom d\'hôte : lettres, chiffres et tirets (32 max).');
    if (!RE.tz.test(c.tz)) e.push('Fuseau horaire : format Région/Ville (ex. Africa/Douala).');
    if (!RE.user.test(c.adminUser)) e.push('Utilisateur administrateur : minuscules, chiffres, _ ou - (3 à 32, commence par une lettre).');
    if (c.adminUser === 'admin') e.push('Utilisateur administrateur : choisissez un nom différent de « admin ».');
    if (c.adminPass && (!secretOk(c.adminPass) || c.adminPass.length < 12)) e.push('Mot de passe administrateur : 12 caractères minimum (ou laissez vide pour un placeholder).');
    if (!parseCidr(c.mgmtNet)) e.push('Réseau d\'administration : adresse CIDR valide (ex. 192.168.10.0/24).');

    const it = parseCidr(c.itGw, 24), hs = parseCidr(c.hsGw, 24);
    if (!it || it.o[3] < 1 || it.o[3] > 254) e.push('Passerelle VLAN IT : adresse en /24 (ex. 192.168.10.1/24).');
    if (!hs || hs.o[3] < 1 || hs.o[3] > 254) e.push('Passerelle VLAN Hotspot : adresse en /24 (ex. 192.168.20.1/24).');
    if (it && hs && it.o.slice(0, 3).join('.') === hs.o.slice(0, 3).join('.')) e.push('Les réseaux IT et Hotspot ne doivent pas se chevaucher.');

    if (c.wanMode === 'static') {
      if (!parseCidr(c.wanIp)) e.push('WAN statique : adresse CIDR valide (ex. 203.0.113.10/29).');
      if (!octets(c.wanGw)) e.push('WAN statique : passerelle IPv4 valide.');
    } else if (c.wanMode !== 'dhcp') e.push('Mode WAN inconnu.');

    PORTS.forEach((p) => { if (!['trunk', 'it', 'hotspot', 'unused'].includes(c.ports[p])) e.push('Rôle inconnu pour ' + p + '.'); });

    if (c.wifiOn) {
      if (!RE.ssid.test(c.ssid)) e.push('SSID : lettres, chiffres, espace . _ - (32 max).');
      if (c.wifiKey && (!secretOk(c.wifiKey) || c.wifiKey.length < 8 || c.wifiKey.length > 63)) e.push('Clé Wi-Fi : 8 à 63 caractères (ou vide pour un placeholder).');
      if (!['it', 'hotspot'].includes(c.wifiVlan)) e.push('VLAN du Wi-Fi inconnu.');
    }
    if (c.mHotspot && c.hotspotUserPass && (!secretOk(c.hotspotUserPass) || c.hotspotUserPass.length < 8)) e.push('Mot de passe invité : 8 caractères minimum (ou vide).');
    if (c.mAntiBf && !octets(c.bfAdminIp)) e.push('Anti-brute force : adresse IPv4 du poste admin invalide.');
    if (c.mAntiBf && !c.mFirewall) e.push('Anti-brute force : nécessite le pare-feu de base (règles « Accept ICMP »).');
    if ((c.mDns || c.mNtp) && !c.mFirewall) e.push('DNS local / NTP : nécessitent le pare-feu de base (règle « Drop tout autre INPUT »).');
    return e;
  }

  // Échappement d'une chaîne RouterOS entre guillemets
  function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/\?/g, '\\?'); }

  function secret(value, placeholder, state) {
    if (value) return '"' + esc(value) + '"';
    state.placeholders.add(placeholder);
    return '<' + placeholder + '>';   // volontairement NON quoté : erreur d'import tant qu'il n'est pas remplacé
  }

  function netInfo(cidr) {
    const c = parseCidr(cidr); const b = c.o.slice(0, 3).join('.');
    return { base: b, net: b + '.0/24', gw: c.o.join('.'), gwCidr: cidr.trim(), poolIt: b + '.100-' + b + '.200', poolHs: b + '.100-' + b + '.250' };
  }

  // ── Génération ───────────────────────────────────────────────
  function generate(c) {
    const errors = validate(c);
    if (errors.length) return { ok: false, errors, script: '', placeholders: [] };

    const st = { placeholders: new Set() };
    const L = [];
    const add = (...x) => x.forEach((l) => L.push(l));
    const sec = (t) => add('', '# ─── ' + t + ' ' + '─'.repeat(Math.max(3, 58 - t.length)));
    const it = netInfo(c.itGw), hs = netInfo(c.hsGw);
    const BEFORE_ICMP = 'place-before=[find where comment="Accept ICMP"]';
    const BEFORE_DROP_IN = 'place-before=[find where comment="Drop tout autre INPUT"]';

    add('# ════════════════════════════════════════════════════════════',
        '# Configuration générée par le Guide Interactif MikroTik (CFP-CMD) v' + (typeof MK !== 'undefined' ? MK.version : ''),
        '# Cible : RouterOS 7 (paquet wireless classique pour le Wi-Fi). À RELIRE avant import.',
        '#',
        '# Mode d\'emploi :',
        '#  1. Sauvegarder l\'existant :  /system backup save name=avant-import',
        '#  2. Idéalement sur un routeur remis à zéro, accès par câble (console / MAC-WinBox)',
        '#  3. Téléverser ce fichier puis :  /import file-name=mk-config.rsc verbose=yes',
        '#  4. Remplacer toute valeur <PLACEHOLDER> : la ligne correspondante échoue tant que ce n\'est pas fait',
        '# ════════════════════════════════════════════════════════════');

    sec('Identité et horloge');
    add('/system identity set name=' + c.host, '/system clock set time-zone-name=' + c.tz);

    sec('Listes d\'interfaces');
    add('/interface list add name=LAN', '/interface list add name=WAN');

    // Bridge / VLANs
    sec('Bridge, VLANs et ports');
    add('/interface bridge add name=bridge-local comment="Bridge LAN principal"');
    const active = PORTS.filter((p) => c.ports[p] !== 'unused');
    active.forEach((p) => add('/interface bridge port add bridge=bridge-local interface=' + p));
    add('/interface vlan add name=vlan10-IT vlan-id=10 interface=bridge-local comment="VLAN IT"',
        '/interface vlan add name=vlan20-Hotspot vlan-id=20 interface=bridge-local comment="VLAN Hotspot invités"');
    const trunks = active.filter((p) => c.ports[p] === 'trunk');
    const acc10 = active.filter((p) => c.ports[p] === 'it');
    const acc20 = active.filter((p) => c.ports[p] === 'hotspot');
    const tag = ['bridge-local'].concat(trunks).join(',');
    const un10 = acc10.concat(c.wifiOn && c.wifiVlan === 'it' ? ['wlan1'] : []);
    const un20 = acc20.concat(c.wifiOn && c.wifiVlan === 'hotspot' ? ['wlan1'] : []);
    add('/interface bridge vlan add bridge=bridge-local vlan-ids=10 tagged=' + tag + (un10.length ? ' untagged=' + un10.join(',') : ''),
        '/interface bridge vlan add bridge=bridge-local vlan-ids=20 tagged=' + tag + (un20.length ? ' untagged=' + un20.join(',') : ''));
    acc10.forEach((p) => add('/interface bridge port set [find interface=' + p + '] pvid=10'));
    acc20.forEach((p) => add('/interface bridge port set [find interface=' + p + '] pvid=20'));

    // Wi-Fi
    if (c.wifiOn) {
      sec('Wi-Fi (WPA2-PSK)');
      add('/interface wireless security-profiles add name=wifi-secure mode=dynamic-keys \\',
          '  wpa2-pre-shared-key=' + secret(c.wifiKey, 'CLE_WIFI_FORTE', st) + ' authentication-types=wpa2-psk',
          '/interface wireless set wlan1 ssid="' + esc(c.ssid) + '" mode=ap-bridge band=2ghz-b/g/n \\',
          '  channel-width=20/40mhz-XX frequency=auto security-profile=wifi-secure disabled=no',
          '/interface bridge port add bridge=bridge-local interface=wlan1 pvid=' + (c.wifiVlan === 'it' ? 10 : 20));
    }
    // VLAN filtering en dernier : évite de couper l'accès pendant la construction
    add('/interface bridge set bridge-local vlan-filtering=yes');

    sec('Adressage');
    add('/ip address add address=' + it.gwCidr + ' interface=vlan10-IT comment="GW VLAN IT"',
        '/ip address add address=' + hs.gwCidr + ' interface=vlan20-Hotspot comment="GW VLAN Hotspot"');
    add('/interface list member add list=LAN interface=vlan10-IT', '/interface list member add list=LAN interface=vlan20-Hotspot',
        '/interface list member add list=WAN interface=ether1');
    if (c.wanMode === 'dhcp') add('/ip dhcp-client add interface=ether1 disabled=no comment="WAN - FAI"');
    else add('/ip address add address=' + c.wanIp.trim() + ' interface=ether1 comment="WAN statique"',
             '/ip route add dst-address=0.0.0.0/0 gateway=' + c.wanGw.trim() + ' comment="Route par défaut WAN"');

    sec('DHCP');
    const dns = c.mDns ? null : '1.1.1.1,9.9.9.9';
    add('/ip pool add name=pool-vlan10 ranges=' + it.poolIt,
        '/ip dhcp-server add name=dhcp-vlan10 interface=vlan10-IT address-pool=pool-vlan10 lease-time=1d disabled=no',
        '/ip dhcp-server network add address=' + it.net + ' gateway=' + it.gw + ' dns-server=' + (dns || it.gw) + ' comment="Réseau VLAN IT"',
        '/ip pool add name=pool-vlan20 ranges=' + hs.poolHs,
        '/ip dhcp-server add name=dhcp-vlan20 interface=vlan20-Hotspot address-pool=pool-vlan20 lease-time=2h disabled=no',
        '/ip dhcp-server network add address=' + hs.net + ' gateway=' + hs.gw + ' dns-server=' + (dns || hs.gw) + ' comment="Réseau Hotspot invités"');

    sec('NAT (accès Internet)');
    add('/ip firewall nat add chain=srcnat out-interface-list=WAN action=masquerade comment="NAT - Accès Internet LAN"');

    if (c.mFirewall) {
      sec('Pare-feu de base (INPUT puis FORWARD)');
      add('/ip firewall filter add chain=input connection-state=established,related action=accept comment="Accept established/related"',
          '/ip firewall filter add chain=input connection-state=invalid action=drop comment="Drop invalides"',
          '/ip firewall filter add chain=input protocol=icmp action=accept comment="Accept ICMP"',
          '/ip firewall filter add chain=input src-address=' + it.net + ' action=accept comment="Admin depuis VLAN IT"',
          '/ip firewall filter add chain=input action=drop comment="Drop tout autre INPUT"',
          '/ip firewall filter add chain=forward connection-state=established,related action=accept comment="Accept forward established"',
          '/ip firewall filter add chain=forward src-address=' + it.net + ' action=accept comment="VLAN10 IT - accès complet"',
          '/ip firewall filter add chain=forward src-address=' + hs.net + ' dst-address=' + it.net + ' action=drop comment="VLAN20 → VLAN10 interdit"',
          '/ip firewall filter add chain=forward src-address=' + hs.net + ' out-interface-list=WAN action=accept comment="VLAN20 Hotspot → WAN uniquement"',
          '/ip firewall filter add chain=forward action=drop comment="Drop forward non autorisé"');
    }

    if (c.mHotspot) {
      sec('Hotspot sur le VLAN Hotspot (équivalent scripté de l\'assistant /ip hotspot setup)');
      add('/ip hotspot profile add name=hsprof-cfp hotspot-address=' + hs.gw + ' login-by=http-chap http-cookie-lifetime=1d',
          '/ip hotspot add name=hotspot-vlan20 interface=vlan20-Hotspot address-pool=pool-vlan20 profile=hsprof-cfp disabled=no',
          '/ip hotspot user add name=invite-demo password=' + secret(c.hotspotUserPass, 'MOT_DE_PASSE_INVITE', st) + ' comment="Utilisateur invité test"');
    }

    if (c.mAntiBf) {
      sec('Anti-brute force SSH et WinBox (section 12)');
      add('/ip firewall address-list add list=admin_whitelist address=' + c.bfAdminIp.trim() + ' comment="Poste admin IT"',
          '/ip firewall filter add chain=input src-address-list=admin_whitelist action=accept ' + BEFORE_ICMP + ' comment="BF: whitelist admin"');
      [['SSH', 22, 'ssh'], ['WINBOX', 8291, 'winbox']].forEach(([label, port, pre]) => {
        const base = 'chain=input protocol=tcp dst-port=' + port + ' connection-state=new';
        add('/ip firewall filter add ' + base + ' src-address-list=' + pre + '_blacklist action=drop ' + BEFORE_ICMP + ' comment="BF-' + label + ': drop blacklist"',
            '/ip firewall filter add ' + base + ' src-address-list=' + pre + '_stage3 action=add-src-to-address-list address-list=' + pre + '_blacklist address-list-timeout=1d ' + BEFORE_ICMP + ' comment="BF-' + label + ': stage3 -> blacklist (1 jour)"',
            '/ip firewall filter add ' + base + ' src-address-list=' + pre + '_stage2 action=add-src-to-address-list address-list=' + pre + '_stage3 address-list-timeout=1m ' + BEFORE_ICMP + ' comment="BF-' + label + ': stage2 -> stage3"',
            '/ip firewall filter add ' + base + ' src-address-list=' + pre + '_stage1 action=add-src-to-address-list address-list=' + pre + '_stage2 address-list-timeout=1m ' + BEFORE_ICMP + ' comment="BF-' + label + ': stage1 -> stage2"',
            '/ip firewall filter add ' + base + ' action=add-src-to-address-list address-list=' + pre + '_stage1 address-list-timeout=1m ' + BEFORE_ICMP + ' comment="BF-' + label + ': nouvelle connexion -> stage1"');
      });
    }

    if (c.mHarden) {
      sec('Durcissement (section 15)');
      add('/interface list add name=MGMT', '/interface list member add list=MGMT interface=vlan10-IT',
          '/ip neighbor discovery-settings set discover-interface-list=MGMT',
          '/tool mac-server set allowed-interface-list=none', '/tool mac-server mac-winbox set allowed-interface-list=MGMT',
          '/tool mac-server ping set enabled=no', '/tool bandwidth-server set enabled=no',
          '/ip proxy set enabled=no', '/ip socks set enabled=no', '/ip upnp set enabled=no',
          '/ip cloud set ddns-enabled=no update-time=no', '/ip ssh set strong-crypto=yes forwarding-enabled=no');
      if (!c.mDns) add('/ip dns set allow-remote-requests=no');
    }

    if (c.mDns) {
      sec('DNS local (section 18)');
      add('/ip dns set servers=1.1.1.1,9.9.9.9 allow-remote-requests=yes cache-size=4096KiB',
          '/ip firewall filter add chain=input in-interface-list=LAN protocol=udp dst-port=53 action=accept ' + BEFORE_DROP_IN + ' comment="DNS UDP depuis LAN"',
          '/ip firewall filter add chain=input in-interface-list=LAN protocol=tcp dst-port=53 action=accept ' + BEFORE_DROP_IN + ' comment="DNS TCP depuis LAN"');
    }

    if (c.mNtp) {
      sec('Synchronisation horaire et serveur NTP (section 19)');
      add('/system ntp client set enabled=yes', '/system ntp client servers add address=0.pool.ntp.org', '/system ntp client servers add address=1.pool.ntp.org');
      if (c.mFirewall) {
        add('/system ntp server set enabled=yes broadcast=no multicast=no manycast=no',
            '/ip firewall filter add chain=input in-interface-list=LAN protocol=udp dst-port=123 action=accept ' + BEFORE_DROP_IN + ' comment="NTP depuis LAN"');
      }
    }

    // Sécurisation en DERNIER : on ne désactive « admin » qu'une fois le reste en place
    sec('Sécurisation des accès (section 01) — volontairement en dernier');
    add('/user add name=' + c.adminUser + ' group=full password=' + secret(c.adminPass, 'MOT_DE_PASSE_FORT', st));
    if (c.disableAdmin) add('/user set admin disabled=yes');
    add('/ip service disable telnet,ftp,www,api,api-ssl',
        '/ip service set ssh address=' + c.mgmtNet.trim() + ' port=22',
        '/ip service set winbox address=' + c.mgmtNet.trim(),
        '/ip ssh set strong-crypto=yes');

    add('', '# ─── Fin — vérifier : /interface print · /ip address print · /ip firewall filter print stats ───');
    return { ok: true, errors: [], script: L.join('\n') + '\n', placeholders: [...st.placeholders] };
  }

  // ── Interface (DOM) ──────────────────────────────────────────
  function mount(host) {
    host.innerHTML = `
      <div class="tool-form" id="rg-form">
        <p class="tool-note"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
          Tout se passe dans votre navigateur : rien n'est envoyé ni mémorisé. Laissez les mots de passe vides pour obtenir des
          <strong>placeholders</strong> à remplacer vous-même (recommandé sur un ordinateur partagé).</p>

        <fieldset><legend>Identité et administration</legend>
          <label>Nom d'hôte <input id="rg-host" type="text" autocomplete="off" /></label>
          <label>Fuseau horaire <input id="rg-tz" type="text" autocomplete="off" /></label>
          <label>Utilisateur administrateur <input id="rg-adminUser" type="text" autocomplete="off" /></label>
          <label>Mot de passe administrateur <input id="rg-adminPass" type="password" autocomplete="new-password" placeholder="vide = placeholder" /></label>
          <label>Réseau d'administration (SSH/WinBox) <input id="rg-mgmtNet" type="text" autocomplete="off" /></label>
          <label class="chk"><input id="rg-disableAdmin" type="checkbox" /> Désactiver le compte « admin » par défaut</label>
        </fieldset>

        <fieldset><legend>WAN (ether1)</legend>
          <label>Mode <select id="rg-wanMode"><option value="dhcp">DHCP (opérateur)</option><option value="static">Adresse statique</option></select></label>
          <label class="wan-static">Adresse WAN (CIDR) <input id="rg-wanIp" type="text" autocomplete="off" placeholder="203.0.113.10/29" /></label>
          <label class="wan-static">Passerelle <input id="rg-wanGw" type="text" autocomplete="off" placeholder="203.0.113.9" /></label>
        </fieldset>

        <fieldset><legend>Réseaux locaux (/24)</legend>
          <label>Passerelle VLAN 10 — IT <input id="rg-itGw" type="text" autocomplete="off" /></label>
          <label>Passerelle VLAN 20 — Hotspot <input id="rg-hsGw" type="text" autocomplete="off" /></label>
          <div class="port-grid" id="rg-ports"></div>
        </fieldset>

        <fieldset><legend>Wi-Fi</legend>
          <label class="chk"><input id="rg-wifiOn" type="checkbox" /> Configurer le Wi-Fi (wlan1, WPA2-PSK)</label>
          <label>SSID <input id="rg-ssid" type="text" autocomplete="off" /></label>
          <label>Clé Wi-Fi <input id="rg-wifiKey" type="password" autocomplete="new-password" placeholder="vide = placeholder" /></label>
          <label>Réseau des clients Wi-Fi <select id="rg-wifiVlan"><option value="hotspot">VLAN 20 — Hotspot invités</option><option value="it">VLAN 10 — IT</option></select></label>
        </fieldset>

        <fieldset><legend>Modules</legend>
          <label class="chk"><input id="rg-mFirewall" type="checkbox" /> Pare-feu de base (section 09)</label>
          <label class="chk"><input id="rg-mHotspot" type="checkbox" /> Hotspot sur le VLAN 20</label>
          <label>Mot de passe invité de test <input id="rg-hotspotUserPass" type="password" autocomplete="new-password" placeholder="vide = placeholder" /></label>
          <label class="chk"><input id="rg-mAntiBf" type="checkbox" /> Anti-brute force SSH/WinBox (section 12)</label>
          <label>Poste d'administration (liste blanche) <input id="rg-bfAdminIp" type="text" autocomplete="off" /></label>
          <label class="chk"><input id="rg-mHarden" type="checkbox" /> Durcissement (section 15)</label>
          <label class="chk"><input id="rg-mDns" type="checkbox" /> DNS local (section 18)</label>
          <label class="chk"><input id="rg-mNtp" type="checkbox" /> Client et serveur NTP (section 19)</label>
        </fieldset>
      </div>

      <div id="rg-errors" class="alert alert-warning" role="alert" style="display:none"></div>
      <div id="rg-info" class="alert alert-info" role="status" style="display:none"></div>
      <div class="tool-actions">
        <button type="button" class="cli-all-btn" id="rg-copy"><i class="fa-solid fa-copy"></i> Copier le script</button>
        <button type="button" class="cli-all-btn" id="rg-download"><i class="fa-solid fa-download"></i> Télécharger mk-config.rsc</button>
        <button type="button" class="cli-all-btn" id="rg-reset"><i class="fa-solid fa-rotate-left"></i> Valeurs par défaut</button>
      </div>
      <label class="tool-out-label" for="rg-out">Script généré</label>
      <textarea id="rg-out" class="tool-out" readonly spellcheck="false" rows="18"></textarea>`;

    const $ = (id) => host.querySelector('#rg-' + id);
    const roles = [['trunk', 'Trunk (VLAN 10 et 20 tagués)'], ['it', 'Accès VLAN 10 — IT'], ['hotspot', 'Accès VLAN 20 — Hotspot'], ['unused', 'Non utilisé (hors bridge)']];
    const grid = $('ports');
    PORTS.forEach((p) => {
      const l = document.createElement('label');
      l.appendChild(document.createTextNode(p + ' '));
      const sel = document.createElement('select'); sel.id = 'rg-port-' + p;
      roles.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); });
      l.appendChild(sel); grid.appendChild(l);
    });

    const textIds = ['host', 'tz', 'adminUser', 'adminPass', 'mgmtNet', 'wanIp', 'wanGw', 'itGw', 'hsGw', 'ssid', 'wifiKey', 'hotspotUserPass', 'bfAdminIp'];
    const checkIds = ['disableAdmin', 'wifiOn', 'mFirewall', 'mHotspot', 'mAntiBf', 'mHarden', 'mDns', 'mNtp'];
    const selIds = ['wanMode', 'wifiVlan'];

    function fill(c) {
      textIds.forEach((k) => { $(k).value = c[k]; });
      checkIds.forEach((k) => { $(k).checked = !!c[k]; });
      selIds.forEach((k) => { $(k).value = c[k]; });
      PORTS.forEach((p) => { host.querySelector('#rg-port-' + p).value = c.ports[p]; });
    }
    function read() {
      const c = { ports: {} };
      textIds.forEach((k) => { c[k] = $(k).value; });
      checkIds.forEach((k) => { c[k] = $(k).checked; });
      selIds.forEach((k) => { c[k] = $(k).value; });
      PORTS.forEach((p) => { c.ports[p] = host.querySelector('#rg-port-' + p).value; });
      return c;
    }
    function render() {
      const c = read();
      host.querySelectorAll('.wan-static').forEach((el) => { el.style.display = c.wanMode === 'static' ? '' : 'none'; });
      const r = generate(c);
      const errBox = $('errors'), infoBox = $('info');
      errBox.style.display = r.ok ? 'none' : 'block';
      errBox.textContent = '';
      if (!r.ok) {
        const ul = document.createElement('ul'); ul.style.margin = '0 0 0 18px';
        r.errors.forEach((m) => { const li = document.createElement('li'); li.textContent = m; ul.appendChild(li); });
        errBox.appendChild(ul);
      }
      $('out').value = r.script;
      infoBox.style.display = r.ok && r.placeholders.length ? 'block' : 'none';
      infoBox.textContent = r.ok && r.placeholders.length
        ? 'Placeholders à remplacer avant import : ' + r.placeholders.map((p) => '<' + p + '>').join(', ') + '. Les lignes concernées échouent tant qu\'ils sont présents.'
        : '';
      $('copy').disabled = $('download').disabled = !r.ok;
      return r;
    }

    host.querySelector('#rg-form').addEventListener('input', render);
    host.querySelector('#rg-form').addEventListener('change', render);
    $('reset').addEventListener('click', () => { fill(defaults()); render(); });

    $('copy').addEventListener('click', async () => {
      const text = $('out').value;
      try { await navigator.clipboard.writeText(text); }
      catch (e) { $('out').select(); document.execCommand('copy'); }
      if (typeof showToast === 'function') showToast('Script copié', 'success');
    });
    $('download').addEventListener('click', () => {
      const blob = new Blob([$('out').value], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'mk-config.rsc';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (typeof showToast === 'function') showToast('Fichier mk-config.rsc téléchargé', 'success');
    });

    fill(defaults());
    render();
  }

  const tool = { title: 'Générateur de configuration .rsc', generate, defaults, validate, mount };
  if (typeof MK !== 'undefined' && MK.addTool) MK.addTool('rsc-generator', tool);
  if (typeof module !== 'undefined') module.exports = tool;
})();

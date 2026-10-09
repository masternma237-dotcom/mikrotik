// ═══════════════════════════════════════════════════════════════
// DATA — Parcours « Services réseau » (lot v2.0)
//   35 CAPsMAN : gestion centralisée des points d'accès
// ═══════════════════════════════════════════════════════════════
(function () {
  const R = String.raw;

  MK.addSections([
    {
      id: "capsman",
      track: "services",
      level: "intermediaire",
      title: "CAPsMAN : gestion centralisée des points d'accès",
      icon: "fa-solid fa-tower-broadcast",
      step: "35",
      requires: ["wifi", "vlans", "hardening"],
      description: "Avec plusieurs points d'accès, configurer chaque borne à la main devient ingérable. CAPsMAN centralise le SSID, la sécurité et le VLAN sur le contrôleur : les bornes (CAP) reçoivent leur configuration automatiquement. On prépare un port hybride pour la borne, le contrôleur, puis la borne elle-même.",
      cliCommands: [
        R`# 1. Port de la borne en mode « hybride » : gestion en VLAN 10 sans tag, Wi-Fi invités en VLAN 20 avec tag
# Exemple avec ether5 (⚠ réservé au WAN2 si vous avez appliqué la section 26 : prenez alors un autre port libre)
/interface bridge port set [find where interface=ether5] pvid=10
/interface bridge vlan set [find where vlan-ids=10 and dynamic=no] untagged=ether5
/interface bridge vlan set [find where vlan-ids=20 and dynamic=no] tagged=bridge-local,ether2,ether5`,

        R`# 2. CONTRÔLEUR — profils de sécurité, de trafic (datapath) et de configuration
# ⚠ Remplacez <CLE_WIFI_FORTE> par la clé WPA2 (placeholder non quoté : la ligne échoue tant qu'il est présent)
/caps-man security add name=sec-cfp authentication-types=wpa2-psk encryption=aes-ccm passphrase=<CLE_WIFI_FORTE>
/caps-man datapath add name=dp-invites local-forwarding=yes vlan-mode=use-tag vlan-id=20
/caps-man configuration add name=cfg-invites ssid="CFP-CMD-WiFi" security=sec-cfp datapath=dp-invites`,

        R`# 3. CONTRÔLEUR — provisionnement automatique des bornes qui se connectent, puis activation du gestionnaire
/caps-man provisioning add action=create-dynamic-enabled master-configuration=cfg-invites comment="Toutes les bornes"
/caps-man manager set enabled=yes`,

        R`# 4. CONTRÔLEUR — pare-feu : CAPsMAN utilise UDP 5246 et 5247 (CAPWAP), depuis le réseau de gestion uniquement
/ip firewall filter add chain=input protocol=udp dst-port=5246,5247 in-interface=vlan10-IT action=accept \
  place-before=[find where comment="Drop tout autre INPUT"] comment="CAPsMAN depuis VLAN IT"`,

        R`# 5. BORNE (CAP) — réinitialisée, branchée sur le port hybride : elle se déclare auprès du contrôleur
/interface wireless cap set enabled=yes interfaces=wlan1 discovery-interfaces=bridge \
  caps-man-addresses=192.168.10.1`,

        R`# 6. Vérifier sur le contrôleur
/caps-man remote-cap print
/caps-man interface print
/caps-man registration-table print
/interface bridge vlan print where vlan-ids=20`
      ],
      winboxSteps: [
        "<span class='wb-path'>Bridge → Ports</span> → port de la borne : PVID = <code>10</code> ; <span class='wb-path'>Bridge → VLANs</span> → VLAN 10 : ajouter le port en <code>untagged</code>, VLAN 20 : l'ajouter en <code>tagged</code>",
        "<span class='wb-path'>CAPsMAN → Security Cfg. → [+]</span> → Name = <code>sec-cfp</code>, WPA2 PSK, Encryption = aes ccm, Passphrase",
        "<span class='wb-path'>CAPsMAN → Datapaths → [+]</span> → Name = <code>dp-invites</code>, cocher Local Forwarding, VLAN Mode = <code>use tag</code>, VLAN ID = 20",
        "<span class='wb-path'>CAPsMAN → Configurations → [+]</span> → Name = <code>cfg-invites</code>, SSID, Security Cfg., Datapath",
        "<span class='wb-path'>CAPsMAN → Provisioning → [+]</span> → Action = <code>create dynamic enabled</code>, Master Configuration = <code>cfg-invites</code> ; bouton <code>Manager</code> → Enabled",
        "Sur la borne : <span class='wb-path'>Wireless → CAP</span> → cocher Enabled, Interfaces = <code>wlan1</code>, Discovery Interfaces = <code>bridge</code>, CAPsMAN Addresses = adresse du contrôleur",
        "Contrôleur : <span class='wb-path'>CAPsMAN → Remote CAP</span> puis <span class='wb-path'>Interfaces</span> → la borne et ses radios apparaissent ; tester la connexion d'un client Wi-Fi"
      ],
      diagram: "capsman",
      terminology: ["CAPsMAN", "CAP", "Datapath", "Provisionnement", "Port hybride", "Local forwarding", "CAPWAP"],
      concepts: [
        { term: "Contrôleur et bornes", def: "Le contrôleur (CAPsMAN) détient la configuration Wi-Fi ; les bornes (CAP) la reçoivent et appliquent. Pour changer un SSID ou une clé sur dix bornes, on modifie un seul profil." },
        { term: "Datapath et local forwarding", def: "Le datapath décrit comment le trafic des clients est traité. Avec le local forwarding, chaque borne place elle-même les clients dans le VLAN 20 en le balisant sur son câble, au lieu de renvoyer tout le trafic au contrôleur." },
        { term: "Port hybride", def: "Un port qui porte un VLAN sans tag (ici la gestion de la borne, VLAN 10) et un ou plusieurs VLANs avec tag (VLAN 20 des invités). C'est le branchement standard d'une borne qui diffuse plusieurs réseaux." },
        { term: "Provisionnement", def: "Règle qui dit quoi faire d'une borne qui se connecte : ici, créer ses interfaces radio à partir de la configuration maître. Elles apparaissent automatiquement sur le contrôleur." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Cette section suit le Wi-Fi du paquet « wireless » classique, comme la section 03 (série hAP ac). Les équipements avec le paquet « wifi » utilisent un autre menu (/interface wifi capsman) et d'autres noms de paramètres : reprenez alors les mêmes profils (sécurité, datapath, configuration, provisionnement) avec leur syntaxe." },
        { type: "warning", icon: "fa-lock", text: "Par défaut, la connexion borne-contrôleur n'est pas authentifiée par certificat : n'activez CAPsMAN que sur le VLAN de gestion (règle input de l'étape 4) et envisagez les certificats pour une installation définitive. Le placeholder &lt;CLE_WIFI_FORTE&gt; est à remplacer." },
        { type: "info", icon: "fa-circle-info", text: "Testez d'abord avec une seule borne. Si le client obtient bien une adresse du VLAN 20, le tag est correct ; sinon vérifiez les entrées de /interface bridge vlan (celle du VLAN 20 doit contenir le port de la borne en tagged)." }
      ],
      table: {
        headers: ["Élément", "Valeur", "Rôle"],
        rows: [
          ["Port de la borne", "PVID 10, VLAN 20 en tagged", "Gestion de la borne + Wi-Fi invités"],
          ["Sécurité", "sec-cfp (WPA2-PSK, AES-CCM)", "Clé unique gérée au contrôleur"],
          ["Datapath", "dp-invites (VLAN 20, local forwarding)", "Placement des clients dans le VLAN Hotspot"],
          ["Ports réseau", "UDP 5246 et 5247", "Dialogue borne ↔ contrôleur (CAPWAP)"]
        ]
      }
    }
  ]);
})();

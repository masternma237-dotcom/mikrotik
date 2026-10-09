// ═══════════════════════════════════════════════════════════════
// DATA — Parcours « VPN & interconnexion » (lot v2.0)
//   33 OSPF · 34 Introduction à BGP
// Hypothèse : le tunnel wg-site de la section 24 relie les deux sites (10.20.0.0/30).
// ═══════════════════════════════════════════════════════════════
(function () {
  const R = String.raw;

  MK.addSections([
    // ───────────────────────────────────────────────────────────
    {
      id: "ospf",
      track: "interconnexion",
      level: "avance",
      title: "Routage dynamique OSPF entre sites",
      icon: "fa-solid fa-sitemap",
      step: "33",
      requires: ["site-to-site", "raw-firewall"],
      description: "Les routes statiques de la section 24 ne s'adaptent pas toutes seules : ajouter un réseau ou un site oblige à retoucher chaque routeur. OSPF fait découvrir et échanger les réseaux automatiquement. On construit une zone unique (backbone), on annonce les LAN en mode passif, on authentifie les voisins et on garde les routes statiques comme secours.",
      cliCommands: [
        R`# 1. Adresse de bouclage : identifiant stable du routeur (bridge vide + adresse /32)
# Site A : 10.255.0.1 · Site B : 10.255.0.2
/interface bridge add name=lo comment="Loopback routeur"
/ip address add address=10.255.0.1/32 interface=lo comment="Router-ID"`,

        R`# 2. WireGuard ne transporte pas le multicast tant que les adresses OSPF ne sont pas autorisées
# Site A (sur le site B, même commande avec le commentaire de son pair, « Siège »)
/interface wireguard peers set [find where comment="Site B"] \
  allowed-address=10.20.0.2/32,192.168.40.0/24,224.0.0.5/32,224.0.0.6/32`,

        R`# 3. Instance et zone backbone (zone 0)
/routing ospf instance add name=ospf-cfp version=2 router-id=10.255.0.1
/routing ospf area add name=backbone area-id=0.0.0.0 instance=ospf-cfp`,

        R`# 4. Interfaces : le tunnel échange les routes ; les LAN sont annoncés mais en PASSIF (aucun paquet OSPF vers les clients)
# ⚠ Remplacez <CLE_OSPF> par une clé partagée (secret commun aux deux routeurs)
/routing ospf interface-template add area=backbone interfaces=wg-site type=ptp \
  auth=sha256 auth-id=1 auth-key=<CLE_OSPF> comment="Tunnel inter-sites"
/routing ospf interface-template add area=backbone networks=192.168.10.0/24 passive comment="LAN siège"
/routing ospf interface-template add area=backbone networks=10.255.0.1/32 passive comment="Loopback"`,

        R`# 5. Pare-feu : accepter le protocole OSPF uniquement depuis le tunnel
/ip firewall filter add chain=input protocol=ospf in-interface=wg-site action=accept \
  place-before=[find where comment="Drop tout autre INPUT"] comment="OSPF depuis tunnel"`,

        R`# 6. La route statique de la section 24 devient une route de SECOURS (distance supérieure à celle d'OSPF = 110)
/ip route set [find where comment="Vers site B"] distance=200`,

        R`# 7. Vérifier : voisin « Full », routes apprises et reachability
/routing ospf neighbor print
/routing ospf interface print
/ip route print where dst-address=192.168.40.0/24
/ping 192.168.40.1 src-address=192.168.10.1 count=3`
      ],
      winboxSteps: [
        "<span class='wb-path'>Bridge → [+]</span> → Name = <code>lo</code> (sans port) ; <span class='wb-path'>IP → Addresses → [+]</span> → <code>10.255.0.1/32</code> sur <code>lo</code>",
        "<span class='wb-path'>WireGuard → Peers</span> → pair du site distant → Allowed Address : ajouter <code>224.0.0.5/32</code> et <code>224.0.0.6/32</code>",
        "<span class='wb-path'>Routing → OSPF → Instances → [+]</span> → Name = <code>ospf-cfp</code>, Version = 2, Router ID = <code>10.255.0.1</code> ; onglet Areas → [+] <code>backbone</code> 0.0.0.0",
        "<span class='wb-path'>Routing → OSPF → Interface Templates → [+]</span> → Area = backbone, Interfaces = <code>wg-site</code>, Type = <code>ptp</code>, Auth = sha256, Auth ID, Auth Key",
        "Deux autres modèles : Networks = <code>192.168.10.0/24</code> puis <code>10.255.0.1/32</code>, tous deux avec <code>Passive</code> coché",
        "<span class='wb-path'>IP → Firewall → Filter Rules</span> → règle <code>input</code>, Protocol = <code>ospf</code>, In. Interface = <code>wg-site</code>, au-dessus du drop final",
        "<span class='wb-path'>Routing → OSPF → Neighbors</span> → état <code>Full</code> ; <span class='wb-path'>IP → Routes</span> → route 192.168.40.0/24 de type <code>o</code> (OSPF)"
      ],
      diagram: "ospf",
      terminology: ["OSPF", "Zone OSPF (area)", "Router-ID", "Interface passive", "Voisin OSPF", "Loopback", "Distance administrative", "Route statique"],
      concepts: [
        { term: "Principe", def: "Chaque routeur décrit ses réseaux et ses liens dans des annonces (LSA) échangées avec ses voisins. Tous construisent la même carte du réseau et calculent le meilleur chemin. Si un lien tombe, les routes se recalculent sans intervention." },
        { term: "Interface passive", def: "Un réseau annoncé en passif est inclus dans les routes mais aucun paquet OSPF n'est émis dessus. On protège ainsi les LAN : un poste malveillant ne peut pas devenir voisin OSPF ni injecter de fausses routes." },
        { term: "Router-ID et loopback", def: "L'identifiant du routeur doit être unique et stable. Une adresse de bouclage (interface qui ne tombe jamais) évite qu'il change quand un lien physique tombe." },
        { term: "Secours par route statique", def: "Une route OSPF a une distance de 110. En donnant 200 à la route statique, OSPF est préféré tant qu'il fonctionne, et la statique reprend automatiquement le relais si le voisin disparaît." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Les deux routeurs doivent être configurés avec des identifiants différents (10.255.0.1 puis 10.255.0.2) et la même clé d'authentification. Le placeholder &lt;CLE_OSPF&gt; est à remplacer avant exécution : sa présence fait échouer la ligne." },
        { type: "warning", icon: "fa-circle-question", text: "Si le voisin reste en état Init ou 2-Way, vérifiez d'abord les adresses 224.0.0.5 et 224.0.0.6 dans le pair WireGuard, puis le MTU de l'interface et l'authentification identique des deux côtés. La syntaxe OSPF de RouterOS 7 a évolué entre les versions : en cas d'erreur, tapez ? dans le menu pour voir les paramètres de votre version." },
        { type: "info", icon: "fa-circle-info", text: "OSPF devient utile à partir de trois sites ou quand les routes changent souvent. Pour deux sites stables, les routes statiques de la section 24 restent plus simples à diagnostiquer." }
      ],
      table: {
        headers: ["Élément", "Site A", "Site B"],
        rows: [
          ["Router-ID (loopback)", "10.255.0.1", "10.255.0.2"],
          ["Réseau LAN annoncé (passif)", "192.168.10.0/24", "192.168.40.0/24"],
          ["Interface de voisinage", "wg-site (ptp)", "wg-site (ptp)"],
          ["Zone", "backbone (0.0.0.0)", "backbone (0.0.0.0)"],
          ["Route statique de secours", "distance 200", "distance 200"]
        ]
      }
    },

    // ───────────────────────────────────────────────────────────
    {
      id: "bgp-intro",
      track: "interconnexion",
      level: "avance",
      title: "Introduction à BGP (eBGP en laboratoire)",
      icon: "fa-solid fa-globe",
      step: "34",
      requires: ["ospf"],
      description: "BGP est le protocole d'Internet : il échange les préfixes entre systèmes autonomes (AS). On en comprend les notions (AS, session, annonce, filtre) sur un laboratoire de deux routeurs en AS privés reliés par le tunnel, puis on voit ce qu'il faut filtrer avant de parler à un vrai opérateur. Cette section est une introduction, pas un guide de production.",
      cliCommands: [
        R`# 1. Réseaux à annoncer : une liste d'adresses nommée (site A ; sur le site B annoncer 192.168.40.0/24)
/ip firewall address-list add list=bgp-nets address=192.168.10.0/24 comment="Préfixes annoncés en BGP"`,

        R`# 2. Numéro d'AS local (plage privée 64512-65534) et session eBGP vers le site B
# Site A : AS 65001, voisin 10.20.0.2 en AS 65002 — sur le site B : AS 65002, voisin 10.20.0.1 en AS 65001
# Syntaxe de RouterOS 7 récent : vérifiez avec ? sur votre version
/routing bgp template set default as=65001 router-id=10.255.0.1
/routing bgp connection add name=vers-siteB remote.address=10.20.0.2 remote.as=65002 \
  local.role=ebgp output.network=bgp-nets comment="eBGP site B"`,

        R`# 3. Pare-feu : BGP utilise TCP 179, à n'accepter que depuis le voisin
/ip firewall filter add chain=input protocol=tcp dst-port=179 src-address=10.20.0.2 in-interface=wg-site action=accept \
  place-before=[find where comment="Drop tout autre INPUT"] comment="BGP depuis site B"`,

        R`# 4. Vérifier la session et les préfixes
/routing bgp session print
/routing bgp advertisements print
/ip route print where bgp
/log print where topics~"route"`
      ],
      winboxSteps: [
        "<span class='wb-path'>IP → Firewall → Address Lists → [+]</span> → List = <code>bgp-nets</code>, Address = le préfixe local à annoncer",
        "<span class='wb-path'>Routing → BGP → Templates</span> → modèle <code>default</code> → AS = <code>65001</code>, Router ID = <code>10.255.0.1</code>",
        "<span class='wb-path'>Routing → BGP → Connections → [+]</span> → Name, Remote Address = <code>10.20.0.2</code>, Remote AS = <code>65002</code>, Local Role = <code>ebgp</code>, Output Network = <code>bgp-nets</code>",
        "<span class='wb-path'>IP → Firewall → Filter Rules</span> → règle <code>input</code> TCP 179 depuis le voisin uniquement",
        "<span class='wb-path'>Routing → BGP → Sessions</span> → état <code>established</code> ; <span class='wb-path'>IP → Routes</span> → route de type <code>b</code> (BGP)",
        "<span class='wb-path'>Routing → BGP → Advertisements</span> → contrôler exactement ce qui est annoncé au voisin"
      ],
      diagram: "bgp-intro",
      terminology: ["BGP", "Système autonome (AS)", "eBGP / iBGP", "Préfixe", "Filtre de routes", "Session BGP"],
      concepts: [
        { term: "Système autonome (AS)", def: "Ensemble de réseaux sous une même administration, identifié par un numéro. Les opérateurs ont des AS publics ; un laboratoire utilise la plage privée 64512 à 65534." },
        { term: "eBGP et iBGP", def: "eBGP relie des AS différents (par exemple vous et un opérateur). iBGP relie des routeurs d'un même AS pour redistribuer les routes apprises. Les règles de propagation diffèrent." },
        { term: "On n'annonce que ce qui vous appartient", def: "Annoncer par erreur des préfixes qui ne sont pas les vôtres peut détourner du trafic d'autres réseaux (fuite de routes). C'est pourquoi la liste d'annonce est explicite (bgp-nets) plutôt qu'une redistribution générale." },
        { term: "Filtrage obligatoire en production", def: "Face à un vrai opérateur, on filtre en entrée (refuser la route par défaut, les plages privées, les préfixes trop longs) et en sortie (n'annoncer que ses propres préfixes), et on limite le nombre de préfixes acceptés." }
      ],
      alerts: [
        { type: "warning", icon: "fa-triangle-exclamation", text: "Laboratoire uniquement : cette configuration n'a aucun filtre d'entrée ni de sortie. Ne la connectez jamais à un opérateur ou à Internet. Une session BGP réelle exige un AS et des préfixes alloués, des chaînes de filtres et l'accord de l'opérateur." },
        { type: "warning", icon: "fa-circle-question", text: "La syntaxe BGP a changé entre les versions 7 de RouterOS (modèles, connexions, noms de paramètres). Les commandes ci-dessus correspondent à une version 7 récente ; si une ligne échoue, utilisez ? dans le menu /routing bgp pour obtenir les paramètres exacts de votre version." },
        { type: "info", icon: "fa-circle-info", text: "Pour relier des sites d'une PME, OSPF (section 33) suffit presque toujours. BGP se justifie pour du multi-opérateur avec adresses propres ou pour de très grands réseaux." }
      ],
      table: {
        headers: ["Notion", "OSPF (section 33)", "BGP (cette section)"],
        rows: [
          ["Portée", "À l'intérieur d'une organisation", "Entre organisations (Internet)"],
          ["Découverte des voisins", "Automatique (multicast)", "Manuelle (adresse du voisin)"],
          ["Critère de choix", "Coût des liens", "Politiques (attributs, filtres)"],
          ["Transport", "IP protocole 89", "TCP port 179"],
          ["Risque principal", "Fausse annonce interne", "Fuite de routes vers Internet"]
        ]
      }
    }
  ]);
})();

// Banque de questions — parcours VPN & interconnexion (y compris OSPF et BGP)
MK.addQuiz({
  wireguard: [
    ["Que partage-t-on avec le pair WireGuard ?", ["Sa clé publique uniquement", "Sa clé privée", "Son mot de passe administrateur", "Son adresse MAC"], 0, "La clé privée ne quitte jamais l'équipement qui la détient."],
    ["Pourquoi WireGuard ne répond-il pas à un scan de port ?", ["Il ignore les paquets qui ne viennent pas d'un pair dont il connaît la clé", "Il est désactivé", "Il utilise TCP", "Le NAT le protège"], 0, "Un port UDP muet est invisible pour un scanner."]
  ],
  "site-to-site": [
    ["Que doivent respecter les deux sites reliés par un tunnel ?", ["Des réseaux LAN différents, sans chevauchement", "Le même réseau LAN", "Le même SSID", "La même version de WinBox"], 0, "Sans réseaux distincts, aucune route ne peut décider où envoyer un paquet."],
    ["Pourquoi un persistent-keepalive côté site B ?", ["Garder le tunnel et la translation NAT ouverts", "Chiffrer plus fort", "Accélérer le débit", "Changer la clé régulièrement"], 0, "Un petit paquet régulier empêche le NAT d'oublier la session."]
  ],
  "ipsec-site": [
    ["Pourquoi une règle NAT accept avant le masquerade ?", ["Le trafic du tunnel ne doit pas voir son adresse source modifiée", "Pour accélérer le NAT", "Pour bloquer IPsec", "Pour ouvrir UDP 500"], 0, "Une adresse traduite ne correspondrait plus à la politique IPsec."],
    ["Quels éléments ouvrir en INPUT pour IPsec ?", ["UDP 500, UDP 4500 et ESP", "TCP 22", "TCP 80 et 443", "UDP 53"], 0, "IKE, NAT-T et le protocole ESP sont nécessaires."]
  ],
  "failover-wan": [
    ["Quelle route est utilisée tant que le WAN1 fonctionne ?", ["Celle de distance 1", "Celle de distance 2", "Les deux simultanément", "Aucune"], 0, "La distance la plus faible est préférée ; l'autre reste en attente."],
    ["Pourquoi tester un hôte public à travers chaque lien plutôt que pinguer le modem ?", ["On vérifie qu'Internet répond, pas seulement le modem", "Pour économiser du débit", "Parce que le modem n'a pas d'adresse", "RouterOS l'interdit"], 0, "Un modem peut répondre alors que l'accès Internet est coupé."]
  ],
  "load-balancing": [
    ["Que garantit both-addresses dans le classifieur PCC ?", ["Les connexions d'un même couple source/destination restent sur le même lien", "Une répartition parfaite par paquet", "Le chiffrement", "L'absence d'utilisation du CPU"], 0, "Les sessions restent stables, ce qui évite de casser certaines applications."],
    ["Pourquoi marquer aussi les connexions entrantes par interface ?", ["Pour que les réponses repartent par le lien d'où est venue la requête", "Pour accélérer le DNS", "Pour bloquer du trafic", "Pour activer FastTrack"], 0, "C'est le retour symétrique : sinon l'opérateur rejette les réponses."]
  ],
  ospf: [
    ["Que fait une interface OSPF passive ?", ["Elle annonce le réseau sans émettre de paquets OSPF dessus", "Elle désactive le réseau", "Elle chiffre les annonces", "Elle active BGP"], 0, "Les postes du LAN ne peuvent pas devenir voisins ni injecter de fausses routes."],
    ["Quelle est la distance administrative d'OSPF par défaut ?", ["110", "1", "200", "20"], 0, "Une route statique à 200 devient ainsi une route de secours."]
  ],
  "bgp-intro": [
    ["Que désigne un système autonome (AS) ?", ["Un ensemble de réseaux sous une même administration, identifié par un numéro", "Un type de VLAN", "Un algorithme de chiffrement", "Un serveur DNS"], 0, "Les AS sont les unités de routage d'Internet."],
    ["Quel port TCP utilise BGP ?", ["179", "22", "53", "8291"], 0, "Le pare-feu doit n'accepter ce port que depuis le voisin."]
  ]
});

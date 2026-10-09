// Banque de questions — parcours Services réseau (y compris CAPsMAN)
MK.addQuiz({
  "nat-advanced": [
    ["Après un dst-nat, quelles adresse et port voit la chaîne FORWARD ?", ["Les valeurs traduites (adresse interne et port du serveur)", "Les valeurs d'origine du WAN", "Aucune", "Celles du client"], 0, "La règle d'autorisation doit donc viser l'adresse interne du serveur."],
    ["À quoi sert le hairpin NAT ?", ["Permettre à des clients internes d'atteindre un serveur interne par l'adresse publique", "Accélérer Internet", "Créer un VPN", "Bloquer le DNS"], 0, "Le masquerade interne force la réponse à repasser par le routeur."]
  ],
  "dns-local": [
    ["Pourquoi ne pas ouvrir le DNS du routeur sur le WAN ?", ["Un résolveur ouvert peut être détourné pour des attaques par amplification", "DNS ne fonctionne pas sur le WAN", "Le WAN utilise un autre protocole", "RouterOS ne le permet pas"], 0, "Le port 53 reste limité à la liste LAN."],
    ["Quelles requêtes le DNS forcé sur le port 53 ne bloque-t-il pas ?", ["Les requêtes DNS-over-HTTPS d'un navigateur", "Les requêtes UDP 53 vers un DNS public", "Les requêtes TCP 53", "Les requêtes vers le routeur"], 0, "DoH passe par le port 443, comme du trafic web ordinaire."]
  ],
  "ntp-server": [
    ["Que contient l'option DHCP 42 ?", ["L'adresse du serveur de temps NTP", "La passerelle par défaut", "Le nom de domaine", "Le serveur de démarrage réseau"], 0, "Elle annonce aux clients où se synchroniser."],
    ["Pourquoi exclure les machines de domaine du NTP forcé ?", ["Elles prennent l'heure du contrôleur de domaine et pourraient dériver du domaine", "Elles n'ont pas d'horloge", "NTP ne fonctionne qu'en UDP 80", "Elles sont déjà bloquées"], 0, "Dans un domaine Active Directory, la hiérarchie de temps passe par les contrôleurs."]
  ],
  "dhcp-advanced": [
    ["Que fait ARP reply-only associé à add-arp=yes ?", ["Seuls les clients ayant un bail DHCP obtiennent des réponses ARP", "Il chiffre le DHCP", "Il désactive ARP", "Il accélère le routage"], 0, "Une adresse fixée à la main n'est plus jointe : le VLAN n'accepte que les baux officiels."],
    ["Qu'est-ce qu'un faux serveur DHCP (rogue) ?", ["Un équipement non autorisé qui distribue de mauvais paramètres aux clients", "Un serveur DHCP trop lent", "Un client DHCP", "Un relais légitime"], 0, "L'alerte DHCP signale tout serveur autre que celui déclaré valide."]
  ],
  "qos-simple": [
    ["Dans max-limit=10M/20M d'une queue ciblant un réseau LAN, que représente le premier chiffre ?", ["Le débit d'envoi des clients", "Le débit de téléchargement", "La priorité", "Le burst"], 0, "Pour une cible LAN : envoi (upload) puis réception (download)."],
    ["Qu'est-ce que le burst ?", ["Un dépassement temporaire autorisé du débit maximal", "Une panne de lien", "Un type de VLAN", "Un mot de passe"], 0, "Il accélère l'ouverture des pages sans permettre les gros transferts."]
  ],
  "qos-pcq": [
    ["Que garantit PCQ ?", ["Un partage équitable entre les clients actifs sans règle par client", "Un débit infini", "Le chiffrement", "L'accélération FastTrack"], 0, "Une sous-file est créée par adresse et le plafond est réparti à parts égales."],
    ["Pourquoi désactiver FastTrack lorsqu'on utilise le QoS ?", ["Les connexions fasttrackées contournent les queues et le marquage", "FastTrack consomme trop de mémoire", "FastTrack bloque le DNS", "FastTrack est obsolète"], 0, "Le trafic qui ne passe plus par les files n'est ni limité ni priorisé."]
  ],
  capsman: [
    ["Que centralise CAPsMAN ?", ["La configuration Wi-Fi (SSID, sécurité, VLAN) de plusieurs bornes", "Le routage BGP", "Les sauvegardes", "Le DHCP"], 0, "Un profil modifié au contrôleur met à jour toutes les bornes."],
    ["Qu'est-ce qu'un port hybride ?", ["Un port avec un VLAN sans tag et d'autres VLANs avec tag", "Un port Wi-Fi", "Un port WAN", "Un port désactivé"], 0, "Il porte ici la gestion de la borne (sans tag) et les invités (VLAN 20 taggé)."]
  ]
});

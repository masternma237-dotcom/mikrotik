// Banque de questions — parcours Socle (2 par section). Format : [question, [options], indexBonneRéponse, explication]
MK.addQuiz({
  introduction: [
    ["Quelle est l'adresse IP et le compte par défaut d'un routeur MikroTik neuf ?", ["192.168.88.1, utilisateur admin sans mot de passe", "10.0.0.1, utilisateur root", "192.168.1.1, utilisateur admin/admin", "192.168.0.1, utilisateur mikrotik"], 0, "Le guide part de 192.168.88.1 avec le compte admin sans mot de passe : c'est la première chose à sécuriser."],
    ["Quelle famille de versions de RouterOS le guide cible-t-il ?", ["RouterOS 7.x", "RouterOS 5.x uniquement", "SwOS", "Toutes les versions sans distinction"], 0, "Le guide vise RouterOS 7 ; certaines syntaxes diffèrent de la version 6."]
  ],
  securing: [
    ["Pourquoi désactive-t-on le compte « admin » par défaut ?", ["C'est un nom connu de tous les attaquants et il n'a pas de mot de passe à l'origine", "Il consomme de la mémoire", "Il empêche WinBox de fonctionner", "Il est réservé à l'usine"], 0, "Un nom de compte prévisible facilite les attaques par force brute : on le remplace par un compte nominatif."],
    ["Dans quel ordre procéder pour éviter de se verrouiller hors du routeur ?", ["Créer le nouvel administrateur et tester sa connexion avant de désactiver admin", "Désactiver admin puis créer un utilisateur", "Supprimer tous les utilisateurs puis redémarrer", "Désactiver SSH et WinBox en premier"], 0, "On vérifie toujours le nouvel accès avant de retirer l'ancien."]
  ],
  bridge: [
    ["Que fait un bridge sur un MikroTik ?", ["Il regroupe plusieurs interfaces pour qu'elles fonctionnent comme un seul commutateur logique", "Il route entre deux réseaux IP", "Il traduit les adresses (NAT)", "Il chiffre le trafic"], 0, "Le bridge travaille en couche 2 : ses ports se comportent comme les ports d'un switch."],
    ["Pourquoi active-t-on le vlan-filtering en dernier ?", ["Mal configuré, il peut couper l'accès au routeur : les VLANs doivent exister d'abord", "Il consomme beaucoup de CPU", "Il n'est utile qu'en fin de projet", "Il efface la configuration"], 0, "Le filtrage applique les règles VLAN à toutes les trames ; on l'active quand tout est prêt."]
  ],
  wifi: [
    ["Quel mode de sécurité Wi-Fi le guide met-il en place ?", ["WPA2-PSK (AES)", "WEP", "Réseau ouvert sans mot de passe", "WPS uniquement"], 0, "WPA2-PSK avec chiffrement AES est le minimum acceptable ; WEP est cassé."],
    ["Pourquoi ajoute-t-on wlan1 au bridge ?", ["Pour que les clients Wi-Fi partagent la même couche 2 que le réseau filaire", "Pour augmenter la puissance du signal", "Pour désactiver le DHCP", "Pour activer le NAT"], 0, "Dans le bridge, le Wi-Fi et le filaire forment un seul réseau local (et reçoivent le même VLAN)."]
  ],
  vlans: [
    ["Que fait le PVID d'un port d'accès ?", ["Il associe les trames non taggées entrantes à un VLAN", "Il chiffre les trames", "Il limite le débit du port", "Il désactive le spanning tree"], 0, "Le PVID (Port VLAN ID) est le VLAN attribué aux trames sans tag qui entrent par ce port."],
    ["Quelle norme définit le tag VLAN ?", ["IEEE 802.1Q", "IEEE 802.11", "IEEE 802.3af", "RFC 1918"], 0, "802.1Q insère le tag VLAN dans la trame Ethernet."]
  ],
  addressing: [
    ["Sur quelle interface porte-t-on l'adresse de passerelle d'un réseau VLAN ?", ["Sur l'interface VLAN (par exemple vlan10-IT)", "Sur le port physique d'accès", "Sur l'interface WAN", "Jamais : seul le bridge a une adresse"], 0, "L'adresse IP se place sur l'interface VLAN, qui devient la passerelle des clients du VLAN."],
    ["Que signifie /24 dans 192.168.10.1/24 ?", ["Les 24 premiers bits désignent le réseau (masque 255.255.255.0)", "24 hôtes au maximum", "Le VLAN numéro 24", "La passerelle numéro 24"], 0, "La notation CIDR indique le nombre de bits du préfixe réseau."]
  ],
  dhcp: [
    ["Que définit un pool DHCP ?", ["La plage d'adresses que le serveur peut attribuer aux clients", "Le nombre de VLANs", "Le mot de passe du réseau", "La passerelle du WAN"], 0, "Le pool borne les adresses distribuables (ex. .100 à .200)."],
    ["Pourquoi une durée de bail courte (2 h) pour le Hotspot ?", ["Les invités se renouvellent vite : les adresses se libèrent plus vite", "Pour accélérer le Wi-Fi", "Pour chiffrer le trafic", "Parce que le DHCP ne supporte pas plus"], 0, "Des baux courts évitent d'épuiser le pool avec des appareils partis."]
  ],
  routing: [
    ["Quelle destination désigne la route par défaut ?", ["0.0.0.0/0", "192.168.0.0/16", "255.255.255.255/32", "127.0.0.1/8"], 0, "0.0.0.0/0 correspond à toutes les destinations non connues plus précisément."],
    ["À quoi sert le masquerade sur ether1 ?", ["Traduire les adresses privées du LAN en l'adresse WAN pour sortir sur Internet", "Bloquer le trafic entrant", "Créer un VPN", "Mesurer le débit"], 0, "Sans NAT, les adresses privées ne seraient pas routées sur Internet."]
  ],
  hotspot: [
    ["Que fait un portail captif Hotspot ?", ["Il impose une authentification avant d'ouvrir l'accès Internet", "Il chiffre le trafic Wi-Fi", "Il attribue des adresses IP fixes", "Il remplace le pare-feu"], 0, "Le client est redirigé vers une page de connexion tant qu'il n'est pas authentifié."],
    ["Pourquoi isoler le Hotspot dans un VLAN dédié ?", ["Pour empêcher les invités d'atteindre le réseau IT", "Pour augmenter le débit", "Pour éviter le DHCP", "Parce que RouterOS l'exige"], 0, "La séparation en VLAN, complétée par le pare-feu, protège le réseau interne."]
  ],
  firewall: [
    ["Que protège la chaîne INPUT ?", ["Le trafic destiné au routeur lui-même", "Le trafic qui traverse le routeur", "Le trafic sortant du LAN uniquement", "Le trafic Wi-Fi"], 0, "INPUT concerne les paquets adressés au routeur ; FORWARD ceux qui le traversent."],
    ["Pourquoi l'ordre des règles est-il crucial ?", ["Elles sont évaluées de haut en bas : la première qui correspond s'applique", "Elles sont évaluées au hasard", "Seule la dernière compte", "L'ordre n'a pas d'importance"], 0, "Une règle drop placée trop haut peut bloquer du trafic que les règles suivantes devaient accepter."]
  ],
  validation: [
    ["Quelle commande enregistre la configuration sous forme de script texte ?", ["/export", "/system reboot", "/ping", "/ip address print"], 0, "/export produit un fichier .rsc lisible et rejouable."],
    ["Pourquoi tester l'accès VLAN20 vers VLAN10 depuis un poste Hotspot ?", ["Pour vérifier que l'isolation attendue fonctionne : l'accès doit échouer", "Pour mesurer le débit", "Pour obtenir une adresse DHCP", "Pour activer le NAT"], 0, "Un test négatif prouve qu'une interdiction est bien appliquée."]
  ]
});

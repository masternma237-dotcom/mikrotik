// Banque de questions — parcours Sécurité avancée
MK.addQuiz({
  safemode: [
    ["Que se passe-t-il en Safe Mode si la connexion est perdue avant validation ?", ["Les modifications sont annulées automatiquement", "Elles sont enregistrées définitivement", "Le routeur revient aux paramètres d'usine", "Les utilisateurs sont supprimés"], 0, "Le Safe Mode ne rend les changements définitifs qu'une fois validés (Ctrl+X)."],
    ["Quelle différence entre un fichier .backup et un fichier .rsc ?", ["Le .backup contient tout et se restaure sur le même modèle ; le .rsc est un script texte lisible et portable", "Le .rsc est chiffré et le .backup est du texte", "Ils sont identiques", "Le .backup ne contient que les utilisateurs"], 0, "Le binaire sert à la restauration complète, l'export à la lecture, la comparaison et le versionnement."]
  ],
  bruteforce: [
    ["Pourquoi une liste blanche doit-elle précéder les paliers anti-brute force ?", ["Pour ne pas bloquer par erreur le poste d'administration", "Pour accélérer le chiffrement", "Pour désactiver SSH", "Parce que RouterOS trie les listes alphabétiquement"], 0, "Sans liste blanche, quelques connexions rapides de l'administrateur peuvent suffire à le bloquer."],
    ["Avec les paliers du guide, quelle connexion est rejetée ?", ["La cinquième nouvelle connexion en moins d'une minute", "La toute première", "Toutes les connexions UDP", "Seulement celles du VLAN IT"], 0, "La quatrième inscrit l'adresse en liste noire ; la cinquième et les suivantes sont rejetées."]
  ],
  "raw-firewall": [
    ["Quel est l'avantage de la table RAW ?", ["Elle jette le trafic indésirable avant le suivi de connexions, ce qui économise du CPU", "Elle chiffre les paquets", "Elle ouvre des ports", "Elle remplace le NAT"], 0, "Le suivi de connexions coûte cher : mieux vaut rejeter tôt ce qui est manifestement hostile."],
    ["Pourquoi autoriser le DHCP Discover avant l'anti-spoofing ?", ["Un client sans adresse émet depuis 0.0.0.0 ; sans cette règle il ne pourrait plus obtenir d'adresse", "Pour accélérer le DHCP", "Parce que le DHCP utilise TCP", "Pour bloquer les clients"], 0, "L'anti-spoofing jette les sources hors du réseau du VLAN, dont 0.0.0.0."]
  ],
  "scan-dos": [
    ["Que détecte le critère psd ?", ["Un balayage de ports (scan)", "Une panne de DNS", "Un mot de passe faible", "Une coupure du WAN"], 0, "PSD (Port Scan Detection) pondère les ports sondés dans un laps de temps court."],
    ["Pourquoi limiter les connexions SYN au WAN et non au LAN ?", ["Des clients LAN légitimes ouvrent beaucoup de connexions et seraient bloqués à tort", "Le LAN n'utilise pas TCP", "RouterOS l'interdit", "Le WAN n'a pas de pare-feu"], 0, "Un navigateur ouvre des dizaines de connexions : le seuil serait vite franchi sur le LAN."]
  ],
  hardening: [
    ["Pourquoi conserver MAC-WinBox pour la liste MGMT plutôt que tout désactiver ?", ["Il reste un accès de secours si l'adressage IP est cassé", "Il est plus rapide", "Il est obligatoire pour le DHCP", "Il chiffre le trafic"], 0, "MAC-WinBox fonctionne sans configuration IP, depuis le réseau d'administration."],
    ["Quel est l'intérêt d'un compte en lecture seule ?", ["La supervision ou des stagiaires consultent sans pouvoir modifier la configuration", "Il double le débit", "Il remplace le pare-feu", "Il permet de redémarrer le routeur"], 0, "Principe du moindre privilège : chacun n'a que les droits nécessaires."]
  ],
  "backup-auto": [
    ["Pourquoi ne supprimer les copies locales qu'après un envoi réussi ?", ["Pour ne jamais perdre la seule sauvegarde en cas d'échec d'envoi", "Pour économiser du CPU", "Parce que SFTP l'exige", "Pour chiffrer les fichiers"], 0, "En cas d'échec, les fichiers restent sur le routeur et un message est journalisé."],
    ["Pourquoi configurer le NTP avant les sauvegardes planifiées ?", ["Les noms de fichiers et le planning dépendent de l'heure", "NTP chiffre les sauvegardes", "NTP envoie les fichiers", "RouterOS l'exige pour SFTP"], 0, "Sans horloge correcte, les fichiers datés et l'horaire de la tâche sont faux."]
  ]
});

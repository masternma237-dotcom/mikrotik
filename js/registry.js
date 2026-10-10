// ═══════════════════════════════════════════════════════════════
// REGISTRE GLOBAL — chargé EN PREMIER (avant data/*.js et app.js)
// Pourquoi : chaque fichier data/*.js « s'enregistre » ici ; app.js
// n'a plus à connaître la liste des sections → ajouter un module =
// ajouter un fichier + une balise <script>, sans toucher au moteur.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const MK = window.MK = {
    version: '2.0.1',

    // Parcours (ordre = ordre d'affichage dans la barre latérale).
    // Un parcours sans section n'est pas affiché.
    tracks: [
      { id: 'socle',          label: 'Socle',                         icon: 'fa-solid fa-layer-group' },
      { id: 'securite',       label: 'Sécurité avancée',              icon: 'fa-solid fa-shield-halved' },
      { id: 'services',       label: 'Services réseau',               icon: 'fa-solid fa-server' },
      { id: 'interconnexion', label: 'VPN & interconnexion',          icon: 'fa-solid fa-route' },
      { id: 'exploitation',   label: 'Exploitation & automatisation', icon: 'fa-solid fa-gears' },
      { id: 'labs',           label: 'Labs & évaluation',             icon: 'fa-solid fa-flask' }
    ],

    levels: {
      debutant:      { label: 'Débutant' },
      intermediaire: { label: 'Intermédiaire' },
      avance:        { label: 'Avancé' }
    },

    // Index historiques (v1.0/1.1) : permet de migrer mk-last-section / mk-visited
    // qui stockaient des positions numériques avant le passage aux identifiants.
    legacyIds: ['introduction', 'securing', 'bridge', 'wifi', 'vlans', 'addressing',
                'dhcp', 'routing', 'hotspot', 'firewall', 'validation'],

    sections: [],   // rempli par addSections()
    glossary: {},   // rempli par addGlossary()
    diagrams: {},   // rempli par addDiagrams() : { type: (section) => '<svg…>' }
    quiz: {},       // banque de questions par section : { idSection: [[question, [options], indexBonneReponse, explication], …] }
    tools: {},      // outils interactifs rattachés à une section (champ `tool`) : { id: { title, mount(host) } }

    addSections(list) {
      list.forEach((s) => {
        if (!s.track) s.track = 'socle';
        if (!s.level) s.level = 'debutant';
        MK.sections.push(s);
      });
    },
    addGlossary(obj)  { Object.assign(MK.glossary, obj); },
    addDiagrams(obj)  { Object.assign(MK.diagrams, obj); },
    addTool(id, def)  { MK.tools[id] = def; },
    addQuiz(obj)      { Object.keys(obj).forEach((k) => { MK.quiz[k] = (MK.quiz[k] || []).concat(obj[k]); }); }
  };
})();

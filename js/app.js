// ═══════════════════════════════════════════════════════════════
// MikroTik Interactive Guide — moteur applicatif (v1.2)
// Données : data/*.js (via MK.addSections / MK.addGlossary)
// Schémas : js/diagrams.js + data/diagrams-*.js
// Aucun gestionnaire inline (onclick=…) : tout passe par addEventListener
// → la CSP peut interdire 'unsafe-inline' pour les scripts.
// ═══════════════════════════════════════════════════════════════
'use strict';

// ═══════════════════════════════════════════════════════════════
// SAFE STORAGE — accès localStorage protégé (mode privé, cookies bloqués)
// Pourquoi : localStorage.getItem/setItem lève une exception si le stockage
// est désactivé ; sans garde, toute l'init SPA planterait.
// ═══════════════════════════════════════════════════════════════
const safeStorage = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; }
    catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (e) { return false; }
  }
};

// ═══════════════════════════════════════════════════════════════
// DONNÉES — agrégées depuis le registre MK (ordre : parcours, puis ordre de chargement)
// ═══════════════════════════════════════════════════════════════
const glossaryData = MK.glossary;
const appData = { sections: [] };

(function sortSections() {
  const order = MK.tracks.map((t) => t.id);
  appData.sections = MK.sections
    .map((s, i) => ({ s, i }))
    .sort((a, b) => (order.indexOf(a.s.track) - order.indexOf(b.s.track)) || (a.i - b.i))
    .map((x) => x.s);
})();

function sectionIndexById(id) { return appData.sections.findIndex((s) => s.id === id); }
function trackById(id) { return MK.tracks.find((t) => t.id === id); }
function trackLabel(id) { const t = trackById(id); return t ? t.label : id; }
function trackIcon(id)  { const t = trackById(id); return t ? t.icon : 'fa-solid fa-folder'; }
function levelLabel(l)  { return (MK.levels[l] && MK.levels[l].label) || l; }

// ═══════════════════════════════════════════════════════════════
// STATE
// Les sections sont mémorisées par IDENTIFIANT (et non par position) :
// ajouter des sections ne décale plus la progression des apprenants.
// Les anciennes valeurs numériques (v1.0/1.1) sont migrées à la lecture.
// ═══════════════════════════════════════════════════════════════
let currentSectionIndex = 0;
let visitedSections = new Set();      // ensemble d'identifiants
let levelFilter = 'all';              // all | debutant | intermediaire | avance
let collapsedTracks = new Set();
let searchTimeout = null;

function toStoredId(v) {
  if (v === null || v === undefined) return null;
  if (/^\d+$/.test(String(v))) return MK.legacyIds[parseInt(v, 10)] || null;
  return String(v);
}

function persistState() {
  safeStorage.set('mk-last-section', appData.sections[currentSectionIndex].id);
  safeStorage.set('mk-visited', JSON.stringify([...visitedSections]));
  safeStorage.set('mk-level', levelFilter);
  safeStorage.set('mk-collapsed', JSON.stringify([...collapsedTracks]));
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  if (!appData.sections.length) {
    document.getElementById('content-area').textContent = 'Aucune section chargée (vérifiez les balises <script> de data/).';
    return;
  }

  // Version affichée (une seule source de vérité : MK.version)
  const short = MK.version.split('.').slice(0, 2).join('.');
  const ver = document.getElementById('app-version');
  if (ver) ver.textContent = 'v' + short;
  const verFoot = document.getElementById('footer-version');
  if (verFoot) verFoot.textContent = 'v' + short;

  // Restore theme (protégé si stockage indisponible)
  const theme = safeStorage.get('mk-theme', 'dark');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);

  // Restore visited (IDs ou anciens index)
  try {
    JSON.parse(safeStorage.get('mk-visited', '[]')).forEach((v) => {
      const id = toStoredId(v);
      if (id && sectionIndexById(id) >= 0) visitedSections.add(id);
    });
  } catch (e) { /* stockage corrompu : on repart de zéro */ }

  const lf = safeStorage.get('mk-level', 'all');
  levelFilter = (lf === 'all' || MK.levels[lf]) ? lf : 'all';
  try { JSON.parse(safeStorage.get('mk-collapsed', '[]')).forEach((t) => collapsedTracks.add(t)); } catch (e) { /* ignore */ }

  // Section de départ : lien profond (#id) > dernière section > première
  const hashId = decodeURIComponent((location.hash || '').replace(/^#\/?/, ''));
  let start = sectionIndexById(hashId);
  if (start < 0) start = sectionIndexById(toStoredId(safeStorage.get('mk-last-section', null)));
  if (start < 0) start = 0;

  setupSearch();
  setupEvents();
  navigateTo(start, { silentHash: false });

  window.addEventListener('hashchange', () => {
    const i = sectionIndexById(decodeURIComponent(location.hash.replace(/^#\/?/, '')));
    if (i >= 0 && i !== currentSectionIndex) navigateTo(i);
  });
});

function setupEvents() {
  // Mobile menu / thème / PDF
  document.getElementById('mobile-menu-btn').addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('pdf-btn').addEventListener('click', exportPDF);

  // Retour en haut (apparition au scroll du panneau central)
  const backTop = document.getElementById('back-to-top');
  const mainEl = document.getElementById('main');
  if (backTop && mainEl) {
    mainEl.addEventListener('scroll', () => {
      backTop.style.display = mainEl.scrollTop > 400 ? 'flex' : 'none';
    });
    backTop.addEventListener('click', () => { mainEl.scrollTop = 0; if (mainEl.focus) mainEl.focus(); });
  }

  // Echap global : ferme sidebar mobile
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });

  // Filtre de niveau
  document.getElementById('level-filter').addEventListener('click', (e) => {
    const b = e.target.closest('[data-level]');
    if (!b) return;
    levelFilter = b.dataset.level;
    persistState();
    buildNav();
  });

  // Contenu central : délégation (remplace les onclick inline)
  document.getElementById('content-area').addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) { navigateTo(parseInt(nav.dataset.nav, 10)); return; }
    const go = e.target.closest('[data-goto]');
    if (go) { navigateTo(parseInt(go.dataset.goto, 10)); return; }
    const cp = e.target.closest('[data-copy]');
    if (cp) { copyCommand(cp.dataset.copy, cp); return; }
    const all = e.target.closest('[data-copy-all]');
    if (all) { copyAllCommands(parseInt(all.dataset.copyAll, 10)); return; }
    if (e.target.closest('[data-action="done"]')) showToast('🎉 Guide terminé — pensez à sauvegarder votre configuration !', 'success');
  });

  // Résultats de recherche : délégation
  document.getElementById('search-results').addEventListener('click', (e) => {
    const it = e.target.closest('[data-index]');
    if (!it) return;
    navigateTo(parseInt(it.dataset.index, 10));
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('search-input').value = '';
  });
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION (parcours repliables + filtre de niveau)
// ═══════════════════════════════════════════════════════════════
function buildNav() {
  const list = document.getElementById('nav-list');
  list.innerHTML = '';

  // Etat du filtre de niveau
  document.querySelectorAll('#level-filter [data-level]').forEach((b) => {
    b.setAttribute('aria-pressed', b.dataset.level === levelFilter ? 'true' : 'false');
  });

  const currentTrack = appData.sections[currentSectionIndex].track;

  MK.tracks.forEach((track) => {
    const all = appData.sections.map((s, i) => ({ s, i })).filter((x) => x.s.track === track.id);
    if (!all.length) return;

    const shown = all.filter((x) => levelFilter === 'all' || x.s.level === levelFilter || x.i === currentSectionIndex);
    if (!shown.length) return;

    const seen = all.filter((x) => visitedSections.has(x.s.id)).length;
    const isCollapsed = collapsedTracks.has(track.id) && track.id !== currentTrack;

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'nav-track';
    head.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
    head.innerHTML = `<i class="${track.icon}" aria-hidden="true"></i><span>${track.label}</span>` +
      `<span class="nav-track-count">${seen}/${all.length}</span><i class="fa-solid fa-chevron-down chev" aria-hidden="true"></i>`;
    head.addEventListener('click', () => {
      if (collapsedTracks.has(track.id)) collapsedTracks.delete(track.id); else collapsedTracks.add(track.id);
      persistState();
      buildNav();
    });
    list.appendChild(head);

    if (isCollapsed) return;

    shown.forEach(({ s, i }) => {
      const item = document.createElement('div');
      item.className = `nav-item ${i === currentSectionIndex ? 'active' : ''} ${visitedSections.has(s.id) && i !== currentSectionIndex ? 'visited' : ''}`;
      item.setAttribute('data-index', i);
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `Section ${s.step}: ${s.title} (${levelLabel(s.level)})`);
      if (i === currentSectionIndex) item.setAttribute('aria-current', 'page');
      item.innerHTML = `
        <i class="nav-icon ${s.icon}" aria-hidden="true"></i>
        <span style="flex:1;font-size:13px">${s.title}</span>
        <span class="level-dot level-${s.level}" title="${levelLabel(s.level)}" aria-hidden="true"></span>
        <span class="nav-step">${s.step}</span>
      `;
      item.addEventListener('click', () => { navigateTo(i); closeSidebar(); });
      item.addEventListener('keydown', (e) => {
        const items = [...list.querySelectorAll('.nav-item')];
        const pos = items.indexOf(item);
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateTo(i); closeSidebar(); }
        if (e.key === 'ArrowDown') { e.preventDefault(); const n = items[pos + 1]; if (n) n.focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); const pr = items[pos - 1]; if (pr) pr.focus(); }
      });
      list.appendChild(item);
    });
  });
}

function navigateTo(index, opts = {}) {
  if (!(index >= 0 && index < appData.sections.length)) return;
  currentSectionIndex = index;
  visitedSections.add(appData.sections[index].id);
  persistState();

  // Lien profond partageable (#id) sans empiler l'historique
  try { history.replaceState(null, '', '#' + appData.sections[index].id); } catch (e) { /* file:// restreint sur certains navigateurs */ }

  buildNav();
  renderSection(index);
  document.getElementById('main').scrollTop = 0;
  updateProgress();
}

function updateProgress() {
  const pct = (visitedSections.size / appData.sections.length) * 100;
  document.getElementById('progress-bar').style.width = Math.min(pct, 100) + '%';
}

// ═══════════════════════════════════════════════════════════════
// RENDER SECTION
// ═══════════════════════════════════════════════════════════════
function renderSection(index) {
  const s = appData.sections[index];
  const area = document.getElementById('content-area');
  let html = '';

  // Section header
  html += `
    <div class="section-header">
      <div class="section-meta">
        <div class="section-badge"><i class="${s.icon}"></i> Étape ${s.step}</div>
        <span class="track-badge"><i class="${trackIcon(s.track)}" aria-hidden="true"></i> ${trackLabel(s.track)}</span>
        <span class="level-badge level-${s.level}"><span class="level-dot level-${s.level}" aria-hidden="true"></span>${levelLabel(s.level)}</span>
      </div>
      <h1 class="section-title">${s.title}</h1>
      <p class="section-description">${s.description}</p>
    </div>
  `;

  // Prérequis (liens vers d'autres sections)
  if (s.requires && s.requires.length) {
    const chips = s.requires.map((rid) => {
      const ri = sectionIndexById(rid);
      return ri < 0 ? '' : `<button type="button" class="req-chip" data-goto="${ri}"><i class="fa-solid fa-link" aria-hidden="true"></i> ${appData.sections[ri].step} · ${appData.sections[ri].title}</button>`;
    }).join('');
    if (chips) html += `<div class="req-list"><span class="req-label"><i class="fa-solid fa-list-check" aria-hidden="true"></i> Prérequis :</span>${chips}</div>`;
  }

  // Alerts (before content)
  if (s.alerts) {
    s.alerts.forEach(a => {
      html += `<div class="alert alert-${a.type}"><i class="fa-solid ${a.icon}"></i><span>${a.text}</span></div>`;
    });
  }

  // Subsections (intro)
  if (s.subsections) {
    s.subsections.forEach(sub => {
      html += `<div class="card"><div class="card-header"><div class="card-header-icon icon-concept"><i class="fa-solid fa-circle-info"></i></div><span class="card-header-title">${sub.title}</span></div><div class="card-body">`;
      if (sub.content) html += `<p style="color:var(--txt-secondary);font-size:14px;line-height:1.7">${sub.content}</p>`;
      if (sub.table) html += renderTable(sub.table);
      html += `</div></div>`;
    });
  }

  // Concepts
  if (s.concepts && s.concepts.length > 0) {
    html += `<div class="card"><div class="card-header"><div class="card-header-icon icon-concept"><i class="fa-solid fa-lightbulb"></i></div><span class="card-header-title">Concepts Clés</span></div><div class="card-body">`;
    s.concepts.forEach(c => {
      html += `<div class="concept-box"><strong>${c.term}</strong> — ${c.def}</div>`;
    });
    html += `</div></div>`;
  }

  // CLI Commands
  if (s.cliCommands && s.cliCommands.length > 0) {
    html += `<div class="card"><div class="card-header"><div class="card-header-icon icon-cli"><i class="fa-solid fa-terminal"></i></div><span class="card-header-title" style="color:var(--green)">Commandes CLI — RouterOS</span></div><div class="card-body">`;
    s.cliCommands.forEach((cmd, ci) => {
      html += `
        <div class="cli-block">
          <pre class="cli-code"><code class="language-routeros" id="cli-${index}-${ci}">${escapeHtml(cmd)}</code></pre>
          <button class="cli-copy-btn" data-copy="cli-${index}-${ci}" title="Copier" aria-label="Copier la commande ${ci + 1} de la section ${escapeHtml(s.title)}">
            <i class="fa-regular fa-copy" aria-hidden="true"></i>
          </button>
        </div>
      `;
    });
    if (s.cliCommands.length > 1) {
      html += `<button class="cli-all-btn" data-copy-all="${index}"><i class="fa-solid fa-copy"></i> Copier toutes les commandes</button>`;
    }
    html += `</div></div>`;
  }

  // WinBox Steps
  if (s.winboxSteps && s.winboxSteps.length > 0) {
    html += `<div class="card"><div class="card-header"><div class="card-header-icon icon-winbox"><i class="fa-solid fa-display"></i></div><span class="card-header-title" style="color:var(--blue)">Équivalent WinBox (GUI)</span></div><div class="card-body">`;
    html += `<ol class="winbox-steps">`;
    s.winboxSteps.forEach(step => {
      html += `<li>${step}</li>`;
    });
    html += `</ol></div></div>`;
  }

  // Diagram
  if (s.diagram) {
    html += `<div class="card"><div class="card-header"><div class="card-header-icon icon-diagram"><i class="fa-solid fa-diagram-project"></i></div><span class="card-header-title" style="color:var(--accent)">Schéma Réseau</span></div><div class="card-body">`;
    html += renderDiagram(s.diagram, s);
    html += `</div></div>`;
  }

  // Table (section-level)
  if (s.table) {
    html += `<div class="card"><div class="card-header"><div class="card-header-icon icon-concept"><i class="fa-solid fa-table"></i></div><span class="card-header-title">Récapitulatif</span></div><div class="card-body">`;
    html += renderTable(s.table);
    html += `</div></div>`;
  }

  // Navigation buttons
  html += `<div class="nav-btns">`;
  if (index > 0) {
    html += `<button class="nav-btn prev" data-nav="${index-1}"><i class="fa-solid fa-arrow-left"></i> ${appData.sections[index-1].title}</button>`;
  } else {
    html += `<div></div>`;
  }
  if (index < appData.sections.length - 1) {
    html += `<button class="nav-btn next" data-nav="${index+1}">Suivant : ${appData.sections[index+1].title} <i class="fa-solid fa-arrow-right"></i></button>`;
  } else {
    html += `<button class="nav-btn next" style="background:var(--green);border-color:var(--green)" data-action="done"><i class="fa-solid fa-circle-check"></i> Terminé !</button>`;
  }
  html += `</div>`;

  area.innerHTML = html;
  updateGlossary(s.terminology || []);
  updateProgress();
  highlightCli();
}

// ═══════════════════════════════════════════════════════════════
// TABLE RENDER
// ═══════════════════════════════════════════════════════════════
function renderTable(table) {
  let html = `<div style="overflow-x:auto"><table class="data-table"><thead><tr>`;
  table.headers.forEach(h => html += `<th>${h}</th>`);
  html += `</tr></thead><tbody>`;
  table.rows.forEach(row => {
    html += `<tr>`;
    row.forEach(cell => html += `<td>${cell}</td>`);
    html += `</tr>`;
  });
  html += `</tbody></table></div>`;
  return html;
}

// ═══════════════════════════════════════════════════════════════
// GLOSSARY
// ═══════════════════════════════════════════════════════════════
function updateGlossary(terms) {
  const gc = document.getElementById('glossary-content');
  if (!terms || terms.length === 0) {
    gc.innerHTML = `<div class="glossary-empty"><i class="fa-solid fa-book-open" style="font-size:24px;color:var(--txt-muted);display:block;margin-bottom:8px"></i>Sélectionnez une section pour voir le glossaire contextuel.</div>`;
    return;
  }

  let html = '';
  terms.forEach(term => {
    const def = glossaryData[term] || 'Définition à venir.';
    html += `<div class="glossary-term"><div class="gt-name">${term}</div><div class="gt-def">${def}</div></div>`;
  });
  gc.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// COPY COMMANDS
// ═══════════════════════════════════════════════════════════════
function copyCommand(id, btn) {
  const el = document.getElementById(id);
  const text = el ? el.textContent : '';
  navigator.clipboard.writeText(text).then(() => {
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    btn.classList.add('copied');
    showToast('Commande copiée !', 'success');
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i>';
      btn.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Commande copiée !', 'success');
  });
}

function copyAllCommands(sectionIndex) {
  const s = appData.sections[sectionIndex];
  const text = s.cliCommands.join('\n\n');
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${s.cliCommands.length} commandes copiées !`, 'success');
  });
}

// ═══════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════
function setupSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  input.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const q = sanitizeInput(e.target.value.trim());

    if (q.length < 2) {
      results.style.display = 'none';
      return;
    }

    searchTimeout = setTimeout(() => {
      const matches = searchContent(q);
      if (matches.length === 0) {
        results.innerHTML = `<div class="sr-item"><div class="sr-title" style="color:var(--txt-muted)">Aucun résultat pour "${q}"</div></div>`;
      } else {
        results.innerHTML = matches.map(m => `
          <div class="sr-item" data-index="${m.index}">
            <div class="sr-title"><i class="${appData.sections[m.index].icon}" style="color:var(--accent);margin-right:6px;font-size:12px"></i>${m.title}</div>
            <div class="sr-snippet">${m.snippet}</div>
          </div>
        `).join('');
      }
      results.style.display = 'block';
    }, 200);
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.style.display = 'none';
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      results.style.display = 'none';
      input.blur();
    }
  });
}

function escapeRegExp(str) {
  // Pourquoi : la requête utilisateur est injectée dans new RegExp() ;
  // sans échappement, des caractères comme [.*+ provoquent une erreur
  // ou un comportement inattendu (ReDoS / exception SyntaxError).
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function searchContent(query) {
  const q = query.toLowerCase();
  const qSafe = escapeRegExp(q);
  const results = [];

  appData.sections.forEach((s, i) => {
    const haystack = [
      s.title, s.description,
      ...(s.cliCommands || []),
      ...(s.winboxSteps || []),
      ...(s.terminology || []),
      ...(s.concepts ? s.concepts.map(c => c.term + ' ' + c.def) : [])
    ].join(' ').toLowerCase();

    if (haystack.includes(q)) {
      // Find snippet
      const idx = haystack.indexOf(q);
      const start = Math.max(0, idx - 40);
      const raw = haystack.substring(start, idx + q.length + 60);
      const snippet = '...' + escapeHtml(raw).replace(new RegExp(qSafe, 'gi'), m => `<mark>${m}</mark>`) + '...';
      results.push({ index: i, title: s.title, snippet });
    }
  });

  // Also search glossary
  Object.entries(glossaryData).forEach(([term, def]) => {
    if (term.toLowerCase().includes(q) || def.toLowerCase().includes(q)) {
      // Find which section uses this term
      appData.sections.forEach((s, i) => {
        if (s.terminology && s.terminology.includes(term)) {
          if (!results.find(r => r.index === i)) {
            results.push({ index: i, title: s.title + ` — ${term}`, snippet: def.substring(0, 80) + '...' });
          }
        }
      });
    }
  });

  return results.slice(0, 8);
}

function sanitizeInput(str) {
  return str.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
}

// ═══════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  safeStorage.set('mk-theme', next);
  updateThemeIcon(next);
  showToast(`Mode ${next === 'dark' ? 'sombre' : 'clair'} activé`, 'info');
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.innerHTML = theme === 'dark'
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  }
}

// ═══════════════════════════════════════════════════════════════
// MOBILE SIDEBAR
// ═══════════════════════════════════════════════════════════════
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-circle-info';
  const color = type === 'success' ? 'var(--green)' : 'var(--blue)';
  toast.innerHTML = `<i class="fa-solid ${icon}" style="color:${color}"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ═══════════════════════════════════════════════════════════════
// PDF EXPORT
// ═══════════════════════════════════════════════════════════════
function buildExportHtml() {
  // Pourquoi : factorisé pour réutilisation popup ET fallback in-page.
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>MikroTik Config Guide — CFP-CMD</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; color: #111; }
    h1 { color: #0B2B40; border-bottom: 3px solid #F39C12; padding-bottom: 10px; }
    h2 { color: #0B2B40; margin-top: 30px; border-left: 4px solid #F39C12; padding-left: 10px; page-break-before: always; }
    h2:first-of-type { page-break-before: auto; }
    pre { background: #1a2535; color: #abb2bf; padding: 14px; border-radius: 6px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 12px; page-break-inside: avoid; }
    .badge { background: #F39C12; color: #000; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; }
    .section-desc { color: #555; margin-bottom: 16px; }
    .winbox-section { background: #f0f7ff; border-left: 3px solid #3498db; padding: 12px; margin: 16px 0; }
    .winbox-section h3 { color: #3498db; margin: 0 0 10px; font-size: 14px; }
    ol { padding-left: 20px; }
    li { margin-bottom: 6px; font-size: 13px; color: #444; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; color: #999; font-size: 12px; text-align: center; }
    @media print { h2 { page-break-before: always; } }
  </style></head><body>
  <h1>MikroTik Configuration Guide</h1>
  <p style="color:#666">CFP-CMD — Centre de Formation Professionnelle Commerce et du Monde Digital<br>
  Généré le : ${new Date().toLocaleDateString('fr-FR', {year:'numeric',month:'long',day:'numeric'})}</p>
  <hr>`;

  appData.sections.forEach((s, i) => {
    if (s.cliCommands && s.cliCommands.length === 0 && !s.subsections) return;
    html += `<h2><span class="badge">Étape ${escapeHtml(s.step)}</span> ${escapeHtml(s.title)} <small style="font-weight:normal;color:#777">— ${escapeHtml(trackLabel(s.track))} · ${escapeHtml(levelLabel(s.level))}</small></h2>`;
    html += `<p class="section-desc">${escapeHtml(s.description)}</p>`;

    if (s.cliCommands && s.cliCommands.length > 0) {
      html += `<h3>Commandes CLI RouterOS</h3>`;
      s.cliCommands.forEach(cmd => {
        html += `<pre>${escapeHtml(cmd)}</pre>`;
      });
    }

    if (s.winboxSteps && s.winboxSteps.length > 0) {
      html += `<div class="winbox-section"><h3>Équivalent WinBox</h3><ol>`;
      s.winboxSteps.forEach(step => {
        html += `<li>${escapeHtml(step.replace(/<[^>]*>/g, ''))}</li>`;
      });
      html += `</ol></div>`;
    }
  });

  html += `<div class="footer">MikroTik Interactive Guide — CFP-CMD v${escapeHtml(MK.version)} — MASTER NMA</div></body></html>`;
  return html;
}

function exportPDF() {
  // Pourquoi : window.open() est bloqué par les bloqueurs de popup ;
  // sans fallback, le bouton semble ne rien faire. On bascule alors sur
  // l'impression de la page courante (styles @media print déjà prévus).
  let printWin = null;
  try { printWin = window.open('', '_blank'); } catch (e) { printWin = null; }

  if (!printWin) {
    showToast('Popup bloquée — utilisez le dialogue d\u2019impression du navigateur (Ctrl+P)', 'info');
    window.print();
    return;
  }

  printWin.document.write(buildExportHtml());
  printWin.document.close();
  printWin.focus();
  setTimeout(() => {
    printWin.print();
  }, 500);

  showToast('Génération PDF en cours...', 'info');
}

// ═══════════════════════════════════════════════════════════════
// HIGHLIGHT CLI — coloration syntaxique des blocs RouterOS
// ═══════════════════════════════════════════════════════════════
function highlightCli() {
  // Pourquoi : la lib Highlight.js etait chargee mais jamais appelee ;
  // sans cet appel, ~30 Ko de JS restaient inutiles. Fallback silencieux
  // si le CDN est indisponible (mode offline).
  try {
    if (window.hljs) {
      document.querySelectorAll('pre.cli-code code').forEach((el) => {
        try { hljs.highlightElement(el); } catch (e) { /* bloc suivant */ }
      });
    }
  } catch (e) { /* highlight optionnel */ }
}

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

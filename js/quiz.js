// ═══════════════════════════════════════════════════════════════
// QUIZ — QCM par section + quiz final (section 40)
// Banque : MK.quiz[idSection] = [[question, [options], indexBonneReponse, explication], …]
// Les textes sont affichés avec textContent (jamais innerHTML) : aucune injection possible.
// Les options sont mélangées à chaque passage pour éviter de mémoriser une position.
// Meilleurs scores mémorisés dans localStorage (clé mk-quiz) : uniquement des nombres.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const PASS_RATIO = 0.7;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const norm = (item, id) => ({ q: item[0], o: item[1], a: item[2], e: item[3] || '', id });

  function loadScores() {
    try { return JSON.parse(safeStorage.get('mk-quiz', '{}')) || {}; } catch (e) { return {}; }
  }
  function saveScore(id, score, total) {
    const all = loadScores();
    if (!all[id] || score >= all[id].best) all[id] = { best: score, total };
    safeStorage.set('mk-quiz', JSON.stringify(all));
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // ── Exécution d'une série de questions dans `host` ───────────
  function run(host, questions, onFinish) {
    let i = 0, score = 0;
    const wrong = [];

    function showQuestion() {
      host.textContent = '';
      const q = questions[i];
      const box = el('div', 'quiz-box');
      box.appendChild(el('div', 'quiz-progress', 'Question ' + (i + 1) + ' / ' + questions.length));
      box.appendChild(el('p', 'quiz-q', q.q));

      const order = shuffle(q.o.map((txt, idx) => ({ txt, idx })));
      const list = el('div', 'quiz-opts');
      list.setAttribute('role', 'group');
      list.setAttribute('aria-label', 'Réponses possibles');
      const status = el('div', 'quiz-feedback');
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      const next = el('button', 'cli-all-btn quiz-next', i + 1 < questions.length ? 'Question suivante' : 'Voir le résultat');
      next.type = 'button';
      next.style.display = 'none';

      order.forEach((opt) => {
        const b = el('button', 'quiz-opt', opt.txt);
        b.type = 'button';
        b.addEventListener('click', () => {
          if (list.dataset.done) return;
          list.dataset.done = '1';
          const good = opt.idx === q.a;
          if (good) score++; else wrong.push(q.id);
          [...list.children].forEach((c, k) => {
            c.disabled = true;
            if (order[k].idx === q.a) c.classList.add('correct');
            else if (c === b) c.classList.add('wrong');
          });
          status.textContent = (good ? 'Bonne réponse. ' : 'Réponse incorrecte. ') + q.e;
          status.className = 'quiz-feedback ' + (good ? 'ok' : 'ko');
          next.style.display = '';
          next.focus();
        });
        list.appendChild(b);
      });

      box.appendChild(list); box.appendChild(status); box.appendChild(next);
      host.appendChild(box);
      next.addEventListener('click', () => { i++; if (i < questions.length) showQuestion(); else finish(); });
    }

    function finish() {
      host.textContent = '';
      const total = questions.length;
      const ok = score / total >= PASS_RATIO;
      const box = el('div', 'quiz-box');
      box.appendChild(el('p', 'quiz-result ' + (ok ? 'ok' : 'ko'), 'Score : ' + score + ' / ' + total + (ok ? ' — objectif atteint' : ' — à revoir')));
      onFinish(score, total, [...new Set(wrong)], box);
      host.appendChild(box);
    }

    showQuestion();
  }

  // ── Quiz d'une section ───────────────────────────────────────
  function mountSection(host, id) {
    const bank = (MK.quiz[id] || []).map((x) => norm(x, id));
    if (!bank.length) return;

    function home() {
      host.textContent = '';
      const prev = loadScores()[id];
      const box = el('div', 'quiz-box');
      box.appendChild(el('p', 'quiz-intro', bank.length + ' questions pour vérifier l\'essentiel de cette section.' +
        (prev ? ' Meilleur score : ' + prev.best + ' / ' + prev.total + '.' : '')));
      const go = el('button', 'cli-all-btn', 'Commencer le quiz');
      go.type = 'button';
      go.addEventListener('click', () => run(host, shuffle(bank), (score, total, wrong, resBox) => {
        saveScore(id, score, total);
        const again = el('button', 'cli-all-btn', 'Recommencer');
        again.type = 'button';
        again.addEventListener('click', home);
        resBox.appendChild(again);
      }));
      box.appendChild(go);
      host.appendChild(box);
    }
    home();
  }

  // ── Quiz final (outil de la section 40) ──────────────────────
  function mountFinal(host) {
    host.textContent = '';
    const form = el('div', 'quiz-box');
    form.appendChild(el('p', 'quiz-intro', 'Un tirage aléatoire de questions pris dans toute la banque, par parcours ou sur l\'ensemble du guide. À la fin, les sections à revoir sont proposées.'));

    const row = el('div', 'quiz-final-form');
    const lt = el('label', null, 'Parcours ');
    const selT = document.createElement('select'); selT.id = 'qf-track';
    const optAll = el('option', null, 'Tous les parcours'); optAll.value = 'all'; selT.appendChild(optAll);
    MK.tracks.forEach((t) => {
      if (t.id === 'labs') return;
      const o = el('option', null, t.label); o.value = t.id; selT.appendChild(o);
    });
    lt.appendChild(selT);
    const ln = el('label', null, 'Nombre de questions ');
    const selN = document.createElement('select'); selN.id = 'qf-count';
    [10, 20, 30].forEach((n) => { const o = el('option', null, String(n)); o.value = String(n); selN.appendChild(o); });
    ln.appendChild(selN);
    const go = el('button', 'cli-all-btn', 'Lancer le quiz'); go.type = 'button'; go.id = 'qf-go';
    row.appendChild(lt); row.appendChild(ln); row.appendChild(go);
    form.appendChild(row);
    const msg = el('p', 'quiz-intro'); msg.setAttribute('role', 'status'); form.appendChild(msg);
    const scores = loadScores();
    const doneCount = Object.keys(scores).filter((k) => scores[k].best / scores[k].total >= PASS_RATIO).length;
    const totalSections = Object.keys(MK.quiz).length;
    form.appendChild(el('p', 'quiz-intro', 'Quiz de section réussis (70 % ou plus) : ' + doneCount + ' / ' + totalSections + '.'));
    host.appendChild(form);

    go.addEventListener('click', () => {
      const pool = [];
      appData.sections.forEach((s) => {
        if (selT.value !== 'all' && s.track !== selT.value) return;
        (MK.quiz[s.id] || []).forEach((x) => pool.push(norm(x, s.id)));
      });
      if (!pool.length) { msg.textContent = 'Aucune question disponible pour ce parcours.'; return; }
      const picked = shuffle(pool).slice(0, Math.min(parseInt(selN.value, 10), pool.length));
      run(host, picked, (score, total, wrong, resBox) => {
        if (wrong.length) {
          resBox.appendChild(el('p', 'quiz-intro', 'Sections à revoir :'));
          const wrap = el('div', 'req-list');
          wrong.forEach((sid) => {
            const idx = sectionIndexById(sid);
            if (idx < 0) return;
            const b = el('button', 'req-chip', appData.sections[idx].step + ' · ' + appData.sections[idx].title);
            b.type = 'button'; b.dataset.goto = String(idx);
            wrap.appendChild(b);
          });
          resBox.appendChild(wrap);
        } else {
          resBox.appendChild(el('p', 'quiz-intro', 'Aucune erreur : excellent travail.'));
        }
        const again = el('button', 'cli-all-btn', 'Nouveau tirage'); again.type = 'button';
        again.addEventListener('click', () => mountFinal(host));
        resBox.appendChild(again);
      });
    });
  }

  MK.quizUI = { mountSection, mountFinal, run };
  MK.addTool('quiz-final', { title: 'Quiz final', mount: mountFinal });
})();

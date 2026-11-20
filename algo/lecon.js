/* Shared lesson engine for unit 2 (algorithms and Python).
   Each lecon-N/index.html defines LECON = {num, titre, stages, questions, labels};
   a stage is either a multiple-choice analysis (like unit 1) or a Python exercise checked by tests.
   The globals step, answers, labels and render() are also used by telecharger.js. */
const {num: NUM, titre: TITRE, stages, questions} = LECON;
const labels = LECON.labels;
const ACT = 'homework' + NUM;
let step = 0, answers = {}, quizAnswers = {}, submitted = false, corrected = false, oldVersion = false;
const codes = {}, entrees = {}, echecs = {};

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); }
// Lesson points: escaped text, **word** in bold and `code` in a code font.
const fmt = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');

// Small colouring for pseudocode and Python listings.
const MOTS = new Set(['LIRE', 'AFFICHER', 'mod', 'NON', 'SI', 'ALORS', 'SINON', 'FIN', 'TANT', 'QUE', 'FAIRE', 'RÉPÉTER', 'FOIS', 'ET', 'OU',
  'if', 'elif', 'else', 'for', 'in', 'while', 'and', 'or', 'not', 'True', 'False', 'print', 'input', 'int', 'len', 'range', 'round', 'str', 'pass', 'float', 'def', 'return']);
function colorer(src) {
  let out = '', last = 0;
  const re = /(#.*$)|("[^"\n]*"|«[^»\n]*»)|\b(\d+)\b|([A-Za-zÀ-ÿ_]+)/gm;
  let m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index));
    if (m[1]) out += '<span class="com">' + esc(m[1]) + '</span>';
    else if (m[2]) out += '<span class="str">' + esc(m[2]) + '</span>';
    else if (m[3]) out += '<span class="num">' + m[3] + '</span>';
    else out += MOTS.has(m[4]) ? '<span class="kw">' + esc(m[4]) + '</span>' : esc(m[4]);
    last = re.lastIndex;
  }
  return out + esc(src.slice(last));
}
const listing = s => `<pre class="algo">${colorer(s)}</pre>`;

// Each student sees the homework options in a different order; answers are stored with the original option numbers.
const mix = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const order = questions.map(q => mix(q[1].map((_, j) => j)));
const nbBonnes = () => questions.filter((q, i) => quizAnswers[i] === q[2]).length;
// Written part of the homework (pseudocode): sent with the answers, compared with the model once the answer key is published.
const ECR = LECON.ecrire || [];
const ecrits = ECR.map((_, j) => { try { return localStorage.getItem('tej2o-' + document.body.dataset.activity + '-devoir-' + j) || ''; } catch (e) { return ''; } });
const ecritsOk = () => ecrits.filter(x => x.trim().length >= 10).length;
const pretAEnvoyer = () => Object.keys(quizAnswers).length === 10 && ecritsOk() === ECR.length;
const enonceHtml = txt => { const out = [], code = []; const vider = () => { if (code.length) { out.push(listing(code.join('\n'))); code.length = 0; } };
  for (const l of txt.split('\n')) { if (l.startsWith('    ')) code.push(l.slice(4)); else { vider(); out.push(`<p>${fmt(l)}</p>`); } } vider(); return out.join(''); };
function partieEcrite(cor) {
  if (!ECR.length) return '';
  return `<h3 style="margin-top:22px">Partie 2 — Écris l’algorithme</h3><p class="hint">${cor ? 'Compare ton algorithme avec la liste et le corrigé : coche ce que tu as réussi.' : `Écris chaque algorithme en pseudocode (LIRE, AFFICHER, ←, SI, TANT QUE…). Ils sont envoyés avec le devoir ; quand le corrigé sera publié, tu pourras t’autocorriger.`}</p>
  ${ECR.map((e, j) => `<div class="mini" style="margin:12px 0"><b>Algorithme ${j + 1} – ${esc(e.titre)}</b>${enonceHtml(e.enonce)}
   ${corrected ? `${cor && cor.prof ? '' : `<p class="sit-titre" style="margin-top:8px">Ton algorithme</p><pre class="algo mine">${esc(ecrits[j] || '(aucune réponse gardée)')}</pre>`}
     <div class="feedback good"><b>Vérifie que ton algorithme :</b><ul class="verif">${e.verif.map(v => `<li><label><input type="checkbox"> ${fmt(v)}</label></li>`).join('')}</ul><p><b>Un corrigé possible</b> (il y en a souvent d’autres) :</p>${listing(e.modele)}</div>`
   : `<label class="hint" for="dev-ecr-${j}">Ton algorithme :</label><textarea class="pseudo" id="dev-ecr-${j}" data-j="${j}" spellcheck="false" placeholder="LIRE …" ${submitted ? 'disabled' : ''}>${esc(ecrits[j])}</textarea>`}</div>`).join('')}`;
}
function brancherDevoirEcrit() {
  document.querySelectorAll('textarea[id^="dev-ecr-"]').forEach(t => {
    t.onkeydown = (e) => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); const a = t.selectionStart; t.value = t.value.slice(0, a) + '    ' + t.value.slice(t.selectionEnd); t.selectionStart = t.selectionEnd = a + 4; t.oninput(); } };
    t.oninput = () => { const j = +t.dataset.j; ecrits[j] = t.value; try { localStorage.setItem('tej2o-' + document.body.dataset.activity + '-devoir-' + j, t.value); } catch (e) { /* storage unavailable */ } majEnvoi(); };
  });
}
function majEnvoi() {
  const b = document.getElementById('btnEnvoyer'), c = document.getElementById('compteDevoir');
  if (b) b.disabled = !pretAEnvoyer();
  if (c) c.textContent = compteTexte();
}
const compteTexte = () => `${Object.keys(quizAnswers).length} / 10 réponses` + (ECR.length ? ` · ${ecritsOk()} / ${ECR.length} algorithme${ECR.length > 1 ? 's' : ''} écrit${ECR.length > 1 ? 's' : ''}` : '');

// Code and "exercise passed" are kept in this browser, so a student can come back to an exercise.
const cle = (k, i) => 'tej2o-' + document.body.dataset.activity + '-' + k + '-' + i;
const lire = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const garder = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } };
stages.forEach((s, i) => {
  if (s.type !== 'code') return;
  codes[i] = lire(cle('code', i)) ?? s.starter;
  entrees[i] = (s.inputs || []).join('\n');
  if (lire(cle('ok', i)) === '1') answers[i] = 'ok';
});

// Worked examples shown under the lesson points: a list, a listing, or a wrong/right pair.
function exemples(s) {
  if (!s.exemples) return '';
  return `<h3>Exemples</h3><div class="ex-grid">${s.exemples.map(e => `<div class="ex-card"><b>${fmt(e.t)}</b>${e.desc ? `<p class="ex-desc">${fmt(e.desc)}</p>` : ''}${e.lignes ? `<ul>${e.lignes.map(l => `<li>${fmt(l)}</li>`).join('')}</ul>` : ''}${e.code ? listing(e.code) : ''}${e.entrees ? `<p class="ex-sortie-t">L’utilisateur tape : ${e.entrees.map(x => `<code>${esc(x)}</code>`).join(' puis ')}</p>` : ''}${e.sortie !== undefined ? `<p class="ex-sortie-t">À l’écran :</p><pre class="ex-sortie">${esc(e.sortie)}</pre>` : ''}${e.faux ? `<p class="ex-faux">✗ ${esc(e.fauxT || 'Mauvais ordre')}</p>${listing(e.faux)}${e.pourquoi ? `<p class="ex-pourquoi">Pourquoi ? ${fmt(e.pourquoi)}</p>` : ''}<p class="ex-bon">✓ ${esc(e.bonT || 'Bon ordre')}</p>${listing(e.bon)}${e.fauxT ? '' : '<p class="ex-pourquoi">LIRE les entrées → calculer → AFFICHER le résultat.</p>'}` : ''}${e.note ? `<p class="ex-pourquoi">${fmt(e.note)}</p>` : ''}</div>`).join('')}</div>`;
}
// "How to write it": one model line, then each of its parts explained on its own row.
function syntaxe(s) {
  if (!s.syntaxe) return '';
  return [].concat(s.syntaxe).map(x => `<div class="syntaxe"><h3>${esc(x.t || 'Comment l’écrire')}</h3>${listing(x.code)}<table>${x.parties.map(p => `<tr><td><code>${esc(p[0])}</code></td><td>${fmt(p[1])}</td></tr>`).join('')}</table></div>`).join('');
}

// Writing workshop: the student writes the algorithm, then compares with a possible answer (kept in this browser).
function carteEcrire(s) {
  return `<div class="card"><h2>${esc(s.title)}</h2><div class="callout"><b>Méthode</b><ul class="points">${s.lead.map(x => `<li>${fmt(x)}</li>`).join('')}</ul></div><p class="hint">${fmt(s.tip)}</p>
  ${s.exercices.map((e, j) => `<div class="mini ecrire" style="margin:14px 0"><b>Exercice ${j + 1} – ${esc(e.titre)}</b><p>${fmt(e.enonce)}</p>
   <label class="hint" for="ecr-${j}">Ton algorithme (pseudocode) :</label>
   <textarea class="pseudo" id="ecr-${j}" data-j="${j}" spellcheck="false" placeholder="LIRE …">${esc(lire(cle('ecr', step + '-' + j)) || '')}</textarea>
   <div class="aide"><button type="button" data-voir="${j}">👀 Comparer avec le corrigé (après sa publication)</button></div><div id="cor-${j}"></div></div>`).join('')}</div>`;
}
function brancherEcrire(i) {
  const s = stages[i];
  document.querySelectorAll('textarea.pseudo').forEach(t => {
    t.onkeydown = (e) => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); const a = t.selectionStart; t.value = t.value.slice(0, a) + '    ' + t.value.slice(t.selectionEnd); t.selectionStart = t.selectionEnd = a + 4; t.oninput(); } };
    t.oninput = () => garder(cle('ecr', i + '-' + t.dataset.j), t.value);
  });
  document.querySelectorAll('[data-voir]').forEach(b => b.onclick = () => {
    const j = +b.dataset.voir, e = s.exercices[j], box = document.getElementById('cor-' + j);
    // The model answer stays hidden until the teacher publishes this lesson's answer key.
    if (!(window.TEJ2O?.teacher || window.TEJ2O?.corrigeOuvert)) { box.innerHTML = '<div class="feedback no"><b>Le corrigé n’est pas encore publié.</b><p>Ton algorithme est gardé dans ce navigateur. Tu pourras le comparer quand ton enseignant(e) publiera le corrigé de cette leçon.</p></div>'; return; }
    if (document.getElementById('ecr-' + j).value.trim().length < 10) { box.innerHTML = '<div class="feedback no"><b>Écris d’abord ton algorithme.</b><p>Essaie avant de regarder : c’est en cherchant qu’on apprend.</p></div>'; return; }
    box.innerHTML = `<div class="feedback good"><b>Vérifie que ton algorithme :</b><ul class="points">${e.verif.map(v => `<li>${fmt(v)}</li>`).join('')}</ul><p><b>Un corrigé possible</b> (il y en a souvent d’autres) :</p>${listing(e.modele)}</div>`;
  });
}

// Multiple-choice activity, in reading order: explanation, examples, then the situation and, right under it, its question.
function carteQcm(s) {
  const sel = answers[step];
  const visuel = s.svg ? s.svg : s.code ? listing(s.code) : `<div class="email">${s.sample.map(x => `<p>${esc(x)}</p>`).join('')}</div>`;
  return `<div class="card"><h2>${esc(s.title)}</h2><ul class="points">${s.lead.map(x => `<li>${fmt(x)}</li>`).join('')}</ul>${syntaxe(s)}${exemples(s)}<div class="callout"><b>À retenir :</b> ${fmt(s.tip)}</div>
  <div class="defi"><h3>À toi de décider</h3><div class="situation"><p class="sit-titre">🔎 ${esc(s.doc)}</p>${visuel}</div>
  <p class="question">${fmt(s.consigne)}</p><div class="choices">${s.opts.map((o, j) => `<button class="choice ${sel === j ? 'selected' : ''}" onclick="choose(${step},${j})">${String.fromCharCode(65 + j)}. ${fmt(o)}</button>`).join('')}</div>${sel === undefined ? '' : `<div class="feedback ${sel === s.correct ? 'good' : 'no'}"><b>${sel === s.correct ? '✓ Bonne analyse !' : '↻ Observe encore'}</b><p>${fmt(s.why)}</p></div>`}</div></div>`;
}

function carteCode(s) {
  const fait = answers[step] === 'ok';
  return `<div class="card"><h2>${esc(s.title)}</h2><ul class="points">${s.lead.map(x => `<li>${fmt(x)}</li>`).join('')}</ul>${syntaxe(s)}${exemples(s)}<div class="callout"><b>À retenir :</b> ${fmt(s.tip)}</div>
  <h3>À toi de coder${fait ? '<span class="reussi">✓ Exercice réussi</span>' : ''}</h3><p>${fmt(s.consigne)}</p>
  <div class="ide"><div class="ide-bar"><span class="fichier">programme.py</span><button type="button" id="btnRun">▶ Exécuter</button><button type="button" class="sec" id="btnCheck">✓ Vérifier</button><button type="button" class="sec" id="btnReset" title="Remettre le programme de départ">↺ Recommencer</button></div>
  <div class="ed"><div class="gutter" id="gutter" aria-hidden="true"></div><textarea class="code" id="code" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Ton programme Python"></textarea></div>
  ${s.inputs ? `<div class="entrees"><label for="entrees">Entrées : ce que l’utilisateur tape, une réponse par ligne</label><textarea id="entrees" spellcheck="false"></textarea></div>` : ''}
  <pre class="console" id="console" aria-live="polite"><span class="vide">Clique sur ▶ Exécuter : la sortie de ton programme s’affichera ici.</span></pre></div>
  <div id="verif"></div>
  <div class="aide"><button type="button" id="btnIndice">💡 Indice</button><button type="button" id="btnSolution" ${(echecs[step] || 0) >= 2 || fait ? '' : 'hidden'}>👀 Voir une solution</button></div><div id="aideBox"></div>
  <p class="hint">Touche Tab : 4 espaces. Échap puis Tab : sortir de l’éditeur.</p></div>`;
}

function render() {
  document.getElementById('tabs').innerHTML = labels.map((s, i) => `<button class="tab ${i === step ? 'active' : ''} ${i < 4 && stages[i].type === 'code' && answers[i] === 'ok' ? 'fait' : ''}" onclick="go(${i})">${s}</button>`).join('');
  document.getElementById('fill').style.width = ((step + 1) * 20) + '%';
  document.getElementById('stepLabel').textContent = step === 4 ? 'Devoir — 10 questions' : `Étape ${step + 1} sur 4`;
  let html = '';
  if (step < 4) html = stages[step].type === 'code' ? carteCode(stages[step]) : stages[step].type === 'ecrire' ? carteEcrire(stages[step]) : carteQcm(stages[step]);
  else if (window.TEJ2O?.devoirFait && !submitted && !window.TEJ2O.corrige) html = window.TEJ2O.carteDevoirFait();
  else {
    const cor = window.TEJ2O?.corrige;
    html = `<div class="card">${cor ? window.TEJ2O_BANDEAU_CORRIGE(oldVersion ? {score: cor.score} : cor) : ''}${oldVersion ? '<div class="oldv"><b>Ce devoir a été modifié après ton envoi.</b> Ton score reste celui de l’ancienne version. Voici les nouvelles questions avec leurs bonnes réponses.</div>' : ''}<h2>Devoir ${LECON.aff || NUM} — ${esc(TITRE)}</h2>${cor ? '' : `<p>${ECR.length ? `<b>Partie 1</b> : 10 questions, 1 point chacune (c’est ta note). <b>Partie 2</b> : écris ${ECR.length} algorithme${ECR.length > 1 ? 's' : ''} en pseudocode. ` : '10 questions · 1 point chacune. '}Lis bien chaque question : plusieurs réponses peuvent sembler correctes, une seule est la bonne. Clique ensuite sur <b>Envoyer le devoir</b>. Le corrigé sera disponible dans ton compte quand ton enseignant(e) le publiera.</p>`}${ECR.length ? '<h3>Partie 1 — 10 questions</h3>' : ''}${questions.map((q, i) => `<div class="mini" style="margin:12px 0"><b>Question ${i + 1}</b><p>${fmt(q[0])}</p>${q[4] ? listing(q[4]) : ''}<div class="choices">${order[i].map((j, pos) => `<button class="choice ${quizAnswers[i] === j ? 'selected' : ''}" onclick="quizChoose(${i},${j})" ${submitted ? 'disabled' : ''}>${String.fromCharCode(65 + pos)}. ${fmt(q[1][j])}</button>`).join('')}</div>${corrected ? `<div class="feedback ${quizAnswers[i] === q[2] || quizAnswers[i] === undefined ? 'good' : 'no'}"><b>${quizAnswers[i] === undefined ? 'Bonne réponse : ' + fmt(q[1][q[2]]) : quizAnswers[i] === q[2] ? '✓ Bonne réponse' : '✗ Réponse attendue : ' + fmt(q[1][q[2]])}</b><p>${fmt(q[3])}</p></div>` : ''}</div>`).join('')}${partieEcrite(cor)}<div class="nav"><span id="compteDevoir">${compteTexte()}</span>${cor ? '<a href="../index.html?compte" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#e8c77c;color:#08231b;font-weight:800;text-decoration:none">Retour à mon compte</a>' : submitted ? '' : `<button id="btnEnvoyer" onclick="submitQuiz()" ${pretAEnvoyer() ? '' : 'disabled'}>Envoyer le devoir</button>`}</div>${corrected && Object.keys(quizAnswers).length === 10 ? `<div class="callout"><div class="score">${nbBonnes()}/10</div><b>Résultat : ${nbBonnes() * 10} %</b>${cor ? '' : '<p>Ton résultat est enregistré dans ton compte et transmis à ton enseignant(e).</p>'}</div>` : ''}</div>`;
  }
  document.getElementById('content').innerHTML = html;
  if (step < 4 && stages[step].type === 'code') brancherEditeur(step);
  if (step < 4 && stages[step].type === 'ecrire') brancherEcrire(step);
  if (step === 4) brancherDevoirEcrit();
  document.getElementById('prev').disabled = step === 0;
  document.getElementById('next').disabled = step === 4;
  document.getElementById('next').textContent = step === 3 ? 'Passer au devoir →' : 'Suivant →';
  document.getElementById('navHint').textContent = step === 4 ? '10 questions' : `${step + 1} / 4 activités`;
}

/* ---------- Python editor ---------- */
function brancherEditeur(i) {
  const s = stages[i], ta = document.getElementById('code'), gut = document.getElementById('gutter'), con = document.getElementById('console');
  const ent = document.getElementById('entrees');
  let sortir = false, ligneErreur = null;
  ta.value = codes[i];
  if (ent) { ent.value = entrees[i]; ent.oninput = () => { entrees[i] = ent.value; }; }
  const ajuster = () => {
    const n = ta.value.split('\n').length;
    ta.rows = Math.max(n + 1, 8);
    gut.innerHTML = Array.from({length: n}, (_, k) => k + 1 === ligneErreur ? `<span class="err">${k + 1}</span>` : String(k + 1)).join('\n');
  };
  ajuster();
  ta.oninput = () => { codes[i] = ta.value; garder(cle('code', i), ta.value); ligneErreur = null; ajuster(); };
  // Tab inserts 4 spaces; Enter keeps the indentation (and adds 4 spaces after a line ending with ':').
  ta.onkeydown = (e) => {
    if (e.key === 'Escape') { sortir = true; return; }
    if (e.key === 'Tab' && !sortir) {
      e.preventDefault();
      const a = ta.selectionStart, b = ta.selectionEnd, v = ta.value;
      if (e.shiftKey) {
        const debut = v.lastIndexOf('\n', a - 1) + 1, n = (v.slice(debut).match(/^ {1,4}/) || [''])[0].length;
        ta.value = v.slice(0, debut) + v.slice(debut + n); ta.selectionStart = ta.selectionEnd = Math.max(debut, a - n);
      } else { ta.value = v.slice(0, a) + '    ' + v.slice(b); ta.selectionStart = ta.selectionEnd = a + 4; }
      ta.oninput(); return;
    }
    sortir = false;
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const a = ta.selectionStart, v = ta.value, debut = v.lastIndexOf('\n', a - 1) + 1, ligne = v.slice(debut, a);
      let ind = (ligne.match(/^ */) || [''])[0];
      if (/:\s*$/.test(ligne)) ind += '    ';
      ta.value = v.slice(0, a) + '\n' + ind + v.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = a + 1 + ind.length;
      ta.oninput();
    }
  };
  const montrer = (txt, cls) => { con.innerHTML = cls ? `<span class="${cls}">${esc(txt)}</span>` : esc(txt); };
  const chargement = () => { con.innerHTML = '<span class="info">⏳ Démarrage de Python… (quelques secondes la première fois)</span>'; };
  const boutons = (on) => ['btnRun', 'btnCheck', 'btnReset'].forEach(id => { const b = document.getElementById(id); if (b) b.disabled = !on; });

  document.getElementById('btnRun').onclick = async () => {
    boutons(false); chargement();
    try {
      const inputs = ent ? ent.value.split('\n').filter((l, k, t) => k < t.length - 1 || l !== '') : [];
      const r = await PYTHON.run(ta.value, inputs, true);
      if (!document.body.contains(con)) return;
      if (r.stopped) { montrer('⏱ Ton programme a été arrêté : il tournait trop longtemps. As-tu une boucle qui ne s’arrête jamais ?', 'erreur'); return; }
      const ex = PYTHON.explain(r.error);
      con.innerHTML = (r.out ? esc(r.out) : '') + (ex ? `${r.out && !r.out.endsWith('\n') ? '\n' : ''}<span class="erreur">⚠ ${esc(ex.text)}</span>` : '') + (!r.out && !ex ? '<span class="vide">(Ton programme n’a rien affiché.)</span>' : '');
      ligneErreur = ex ? ex.line : null; ajuster();
    } catch (err) {
      montrer('Python n’a pas pu démarrer. Vérifie ta connexion Internet, puis réessaie.', 'erreur');
    } finally { boutons(true); }
  };

  document.getElementById('btnCheck').onclick = async () => {
    const box = document.getElementById('verif');
    for (const r of (s.require || [])) {
      if (!new RegExp(r.re, "m").test(ta.value)) { box.innerHTML = `<div class="feedback no"><b>↻ Presque…</b><p>${fmt(r.msg)}</p></div>`; return; }
    }
    boutons(false); chargement();
    const res = [];
    try {
      for (const t of s.tests) {
        const r = await PYTHON.run(ta.value, t.in, false);
        const ex = PYTHON.explain(r.error);
        const ok = !r.stopped && !ex && norm(r.out) === norm(t.out);
        res.push({t, r, ex, ok});
        if (r.stopped) break;
      }
    } catch (err) { montrer('Python n’a pas pu démarrer. Vérifie ta connexion Internet, puis réessaie.', 'erreur'); boutons(true); return; }
    boutons(true);
    if (!document.body.contains(box)) return;
    con.innerHTML = '<span class="vide">Vérification terminée : les résultats sont sous l’éditeur.</span>';
    const tous = res.length === s.tests.length && res.every(x => x.ok);
    if (tous) {
      answers[i] = 'ok'; garder(cle('ok', i), '1');
      box.innerHTML = `<div class="feedback good"><b>✓ Bravo ! Ton programme réussit ${s.tests.length > 1 ? 'les ' + s.tests.length + ' tests' : 'le test'}.</b><p>${fmt(s.bravo || 'Tu peux passer à l’activité suivante.')}</p></div>`;
      document.querySelectorAll('.tab')[i].classList.add('fait');
      document.getElementById('btnSolution').hidden = false;
      return;
    }
    echecs[i] = (echecs[i] || 0) + 1;
    if (echecs[i] >= 2) document.getElementById('btnSolution').hidden = false;
    const avec = t => t.in.length ? 'Avec les entrées ' + t.in.map(x => '« ' + x + ' »').join(', ') : 'Sans entrée';
    box.innerHTML = `<div class="feedback no"><b>↻ ${res.filter(x => x.ok).length} test${res.filter(x => x.ok).length > 1 ? 's' : ''} réussi${res.filter(x => x.ok).length > 1 ? 's' : ''} sur ${s.tests.length}</b><ul class="tests">${res.map(x => x.ok
      ? `<li class="ok">✓ ${esc(avec(x.t))}</li>`
      : `<li class="ko">✗ ${esc(avec(x.t))}${x.r.stopped ? ' : le programme a été arrêté (trop long, boucle sans fin ?)' : x.ex ? ' : ' + esc(x.ex.text) : ''}${!x.r.stopped && !x.ex ? `<pre>Attendu :\n${esc(x.t.out)}\n\nObtenu :\n${esc(x.r.out.trim() || '(rien)')}</pre>` : ''}</li>`).join('')}</ul></div>`;
  };

  document.getElementById('btnReset').onclick = () => {
    if (!confirmerReset()) return;
    codes[i] = s.starter; ta.value = s.starter; garder(cle('code', i), s.starter); ligneErreur = null; ajuster();
    con.innerHTML = '<span class="vide">Programme de départ remis.</span>';
  };
  document.getElementById('btnIndice').onclick = () => { document.getElementById('aideBox').innerHTML = `<div class="callout"><b>💡 Indice :</b> ${fmt(s.hint)}</div>`; };
  document.getElementById('btnSolution').onclick = () => { document.getElementById('aideBox').innerHTML = `<div class="callout"><b>👀 Une solution possible</b> (il y en a souvent d’autres) :${listing(s.solution)}</div>`; };
  PYTHON.prepare().catch(() => {});
}
// The reset button asks once more on a second click (no browser dialog).
let resetArme = 0;
function confirmerReset() {
  const b = document.getElementById('btnReset');
  if (Date.now() - resetArme < 4000) { resetArme = 0; b.textContent = '↺ Recommencer'; return true; }
  resetArme = Date.now(); b.textContent = 'Effacer ton code ? Clique encore';
  setTimeout(() => { if (b.isConnected) b.textContent = '↺ Recommencer'; }, 4000);
  return false;
}
// Output comparison: spaces, letter case and accents are ignored; empty lines too.
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/×/g, 'x').toLowerCase()
  .split('\n').map(l => l.replace(/\s+/g, '')).filter(Boolean).join('\n');

function choose(i, j) { answers[i] = j; render(); }
function quizChoose(i, j) { if (submitted) return; quizAnswers[i] = j; render(); }
async function submitQuiz() {
  if (!pretAEnvoyer() || submitted) return;
  if (!window.TEJ2O?.saveScore) { alert('Connecte-toi avec ton compte élève pour envoyer le devoir.'); return; }
  const saved = await window.TEJ2O.saveScore(ACT, nbBonnes() * 10, {v: 2, r: questions.map((q, i) => quizAnswers[i] ?? null), ...(ECR.length ? {ecrits: ecrits.slice()} : {})});
  if (!saved) { alert("Le devoir n'a pas été envoyé. Vérifie le message d'erreur puis réessaie."); return; }
  // Once sent, the page shows the homework as done; the answer key waits for the teacher.
  render(); window.scrollTo({top: 0, behavior: 'smooth'});
}
// Answer key: the student's answers are shown against the questions.
function openCorrige(c) { const r = c.reponses; if (r && r.v === 2 && Array.isArray(r.r)) { r.r.forEach((v, i) => { if (v != null) quizAnswers[i] = v; }); if (Array.isArray(r.ecrits)) r.ecrits.forEach((t, j) => { ecrits[j] = t || ''; }); } else if (Array.isArray(r)) { oldVersion = true; } submitted = true; corrected = true; step = 4; render(); window.scrollTo(0, 0); }
async function go(i) {
  if (i === 4) {
    // Opened from a file on the computer: the sign-in check cannot run, only the online site can open the homework.
    if (location.protocol === 'file:') { alert('Le devoir s’ouvre seulement sur le site en ligne (adresse https://…), après la connexion. Ouvert depuis un fichier de l’ordinateur, la connexion ne peut pas être vérifiée.'); return; }
    if (!window.TEJ2O) {
      try { await window.tej2oAccessReady; } catch (e) { console.error('access.js', e); alert('Erreur JavaScript dans le contrôle d’accès : ' + e.message); return; }
      if (!window.TEJ2O) { alert(window.TEJ2O_ACCESS_ERROR || 'Session non reconnue. Retourne à la page de connexion, connecte-toi, puis rouvre la leçon.'); return; }
    }
    if (!window.TEJ2O.teacher) {
      const ctx = window.TEJ2O;
      const {data, error} = await ctx.db.from('tej2o_releases').select('activity_id').eq('class_id', ctx.classId).eq('activity_id', ACT);
      if (error) { alert('Impossible de vérifier la publication du devoir : ' + error.message); return; }
      ctx.homeworkOpen = !!data?.length;
      if (!ctx.homeworkOpen) { alert("Le devoir n'est pas accessible à ce compte. Vérifie que tu es inscrit dans la bonne classe."); return; }
    }
  }
  step = i; render(); window.scrollTo({top: 0, behavior: 'smooth'});
}
document.getElementById('prev').onclick = () => go(Math.max(0, step - 1));
document.getElementById('next').onclick = () => go(Math.min(4, step + 1));
render();

/* Pseudocode toolbox (symbols and keywords above the algorithm boxes). */
(function () { const s = document.createElement('script'); s.src = new URL('outils-pseudo.js', document.currentScript.src).href; document.head.appendChild(s); })();

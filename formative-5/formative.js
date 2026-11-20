// Unit 5 formative, online version: renders the parts, keeps answers in this browser,
// and checks the objective parts without revealing the expected answers.
(() => {
  const KEY = 'tej2o-formative5';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KW = /\b(Lire|Afficher|Si|Sinon|FinSi|Pour|de|à|FinPour|TantQue|FinTantQue|ET|OU|mod)\b/g;
  const algo = src => `<pre class="algo">${esc(src).replace(KW, '<span class="kw">$1</span>')}</pre>`;
  // Accents, spaces and case do not matter when comparing answers.
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[«»"“”]/g, '"').replace(/\s+/g, '').toLowerCase();
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* storage unavailable */ } };

  const part = (n, titre, consigne, corps, verif) => `<section class="card part"><h2><span class="n">${n}</span>${titre}</h2><p class="consigne">${consigne}</p>${corps}${verif ? `<div class="check-row"><button type="button" data-verif="${n}">Vérifier la partie ${n}</button><span class="res" id="res${n}"></span></div>` : ''}</section>`;
  const input = (id, cls = '') => `<input type="text" class="${cls}" data-k="${id}" autocomplete="off" spellcheck="false">`;
  const area = (id, ph, rows = 3) => `<textarea class="rep" data-k="${id}" rows="${rows}" placeholder="${ph}"></textarea>`;
  let q = 0;

  let h = '';
  // Part 1: matching
  h += part(1, 'Le vocabulaire', 'Choisis la lettre de la définition qui correspond à chaque mot.',
    `<div class="two"><table class="f"><tr><th>Mot</th><th style="width:110px">Lettre</th></tr>${F.mots.map((m, i) => `<tr><td><code>${esc(m[0])}</code></td><td><select data-k="m${i}"><option value="">—</option>${'ABCDEFGH'.split('').map(l => `<option>${l}</option>`).join('')}</select></td></tr>`).join('')}</table>
     <table class="f"><tr><th>Définitions</th></tr>${F.defs.map((t, i) => `<tr><td><b>${'ABCDEFGH'[i]})</b> ${esc(t)}</td></tr>`).join('')}</table></div>`, true);
  // Part 2: true / false
  h += part(2, 'Vrai ou faux ?', 'Choisis V ou F. Si c’est faux, corrige la phrase en quelques mots.',
    `<table class="f"><tr><th>Affirmation</th><th style="width:120px">V ou F</th><th>Si c’est faux : la bonne version</th></tr>${F.vf.map((v, i) => `<tr><td>${esc(v[0])}</td><td><div class="radio" data-grp="v${i}"><label><input type="radio" name="v${i}" value="V" data-k="v${i}">V</label><label><input type="radio" name="v${i}" value="F" data-k="v${i}">F</label></div></td><td>${input('vc' + i)}</td></tr>`).join('')}</table>`, true);
  // Part 3: trace tables
  h += part(3, 'Je suis l’ordinateur', 'Exécute l’algorithme à la main. Remplis le tableau, puis écris ce qui s’affiche.',
    F.traces.map((t, j) => `<div class="q"><p>${++q}. ${esc(t.t)}</p><div class="two"><div>${algo(t.code)}</div><div><table class="f"><tr>${t.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${t.rows.map((r, i) => `<tr><td>${esc(r[0])}</td>${r.slice(1).map((_, k) => `<td>${input(`t${j}-${i}-${k}`)}</td>`).join('')}</tr>`).join('')}</table>${t.sortie !== null ? `<p style="margin-top:8px"><b>Ce qui s’affiche :</b> ${input('ts' + j, 'trou')}</p>` : ''}</div></div></div>`).join(''), true);
  // Part 4: find and fix the error (corrected in class)
  h += part(4, 'Trouve et corrige l’erreur', 'Chaque algorithme contient une erreur. Explique-la en une phrase, puis réécris la ou les lignes corrigées. Cette partie sera corrigée en classe.',
    F.erreurs.map((e, j) => `<div class="q"><p>${++q}. ${esc(e.t)}</p><div class="two"><div>${algo(e.code)}</div><div><label class="small">L’erreur :</label>${area('e' + j, 'Explique l’erreur…', 2)}<label class="small">Ma correction :</label><textarea class="rep pseudo" data-k="ec${j}" rows="3" placeholder="Réécris la ou les lignes corrigées…"></textarea></div></div></div>`).join(''), false);
  // Part 5: fill in the blanks
  h += part(5, 'Complète l’algorithme', 'Écris ce qui manque dans chaque case pointillée.',
    F.trous.map((t, j) => `<div class="q"><p>${++q}. ${esc(t.t)}</p><pre class="algo">${t.lignes.map((l, i) => esc(l[0]) + (l[1] ? `<input type="text" class="trou" data-k="b${j}-${i}" autocomplete="off" spellcheck="false" size="${Math.max(6, Math.max(...l[1].map(x => x.length)))}">` : '') + esc(l[2])).join('\n')}</pre></div>`).join(''), true);
  // Part 6: write an algorithm (corrected in class)
  h += part(6, 'À toi d’écrire', 'Écris l’algorithme en pseudocode. Indente les lignes qui sont dans un bloc (touche Tab). Cette partie sera corrigée en classe.',
    `<div class="q"><p>${++q}. ${esc(F.ecrire)}</p><textarea class="pseudo" data-k="ecrire" rows="10" placeholder="Lire X, Y&#10;…"></textarea></div>`, false);
  // Part 7: two Python programs, a little harder than the summative ones (run and check with tests, model never shown).
  const PY = [
    { k: 'py1', titre: 'Le plus grand nombre', enonce: 'Écris un programme Python qui demande 5 nombres, puis affiche le plus grand des 5. Attention : les nombres peuvent être négatifs.',
      indice: 'Garde le plus grand dans une variable. Pour chaque nouveau nombre, compare-le avec cette variable. Par quoi commencer ? Pense au premier nombre lu.', exemple: '3\n9\n2\n7\n5',
      modele: 'grand = int(input("Nombre ? "))\nfor i in range(4):\n    n = int(input("Nombre ? "))\n    if n > grand:\n        grand = n\nprint("Le plus grand :", grand)',
      tests: [{ in: ['3', '9', '2', '7', '5'], fin: '9' }, { in: ['-4', '-1', '-8', '-3', '-6'], fin: '-1' }, { in: ['10', '10', '4', '1', '10'], fin: '10' }] },
    { k: 'py2', titre: 'La moyenne de la classe', enonce: 'Écris un programme Python qui demande combien il y a d’élèves, puis la note de chaque élève. Il affiche la moyenne, puis « Groupe fort » si la moyenne est de 70 ou plus, « Groupe moyen » si elle est de 50 ou plus, sinon « Groupe à aider ».',
      indice: 'Le nombre d’élèves sert à la fois pour range(…) et pour diviser la somme. Calcule la moyenne APRÈS la boucle, puis utilise if / elif / else.', exemple: '3\n80\n70\n90',
      modele: 'n = int(input("Combien d’élèves ? "))\nsomme = 0\nfor i in range(n):\n    note = int(input("Note ? "))\n    somme = somme + note\nmoyenne = somme / n\nprint("Moyenne :", moyenne)\nif moyenne >= 70:\n    print("Groupe fort")\nelif moyenne >= 50:\n    print("Groupe moyen")\nelse:\n    print("Groupe à aider")',
      tests: [{ in: ['3', '80', '70', '90'], contient: '80', fin: 'Groupe fort' }, { in: ['4', '50', '60', '40', '50'], contient: '50', fin: 'Groupe moyen' }, { in: ['2', '30', '45'], contient: '37.5', fin: 'Groupe à aider' }] }
  ];
  h += part(7, 'Programmer en Python', 'Écris chaque programme dans l’éditeur. ▶ Exécuter montre ce qu’il affiche avec tes entrées ; ✓ Vérifier le teste avec d’autres nombres. Touche Tab = 4 espaces.',
    PY.map((x, i) => `<div class="q"><p>${++q}. ${esc(x.titre)} — ${esc(x.enonce)}</p>
      <div class="two"><div><textarea class="pseudo" data-k="${x.k}" rows="10" spellcheck="false" placeholder="# Ton programme Python"></textarea>
      <div class="check-row"><button type="button" data-py-run="${i}">▶ Exécuter</button><button type="button" data-py-check="${i}">✓ Vérifier</button><span class="res" id="pyres${i}"></span></div>
      <pre class="algo" id="pyout${i}" style="white-space:pre-wrap;min-height:48px;margin-top:8px">Clique sur ▶ Exécuter pour voir ce que ton programme affiche.</pre></div>
      <div><p class="small">Entrées pour tester (une par ligne) :</p><textarea class="rep" id="pyin${i}" rows="6" spellcheck="false">${esc(x.exemple)}</textarea>
      <details style="margin-top:8px"><summary class="small">💡 Indice</summary><p class="small">${esc(x.indice)}</p></details></div></div></div>`).join(''), false);
  // Part 8: self-assessment
  h += part(8, 'Mon bilan', 'Choisis une case par ligne. Sois honnête : ça t’aide à savoir quoi revoir.',
    `<table class="f"><tr><th>Je suis capable de…</th><th>Je maîtrise</th><th>Presque</th><th>J’ai besoin d’aide</th></tr>${F.bilan.map((b, i) => `<tr><td>${esc(b)}</td>${['3', '2', '1'].map(v => `<td style="text-align:center"><input type="radio" name="bil${i}" value="${v}" data-k="bil${i}" aria-label="${v}"></td>`).join('')}</tr>`).join('')}</table>
     <p style="margin-top:12px"><b>Une question que j’ai encore :</b></p>${area('question', 'Écris ta question…', 2)}`, false);
  document.getElementById('contenu').innerHTML = h;

  // Restore and save answers
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    if (el.type === 'radio') { el.checked = saved[k] === el.value; el.addEventListener('change', () => { saved[k] = el.value; keep(); }); }
    else { if (saved[k] !== undefined) el.value = saved[k]; el.addEventListener('input', () => { saved[k] = el.value; keep(); el.classList.remove('ok-mark', 'ko-mark'); }); }
  });
  // Tab inserts 4 spaces in the pseudocode boxes
  document.querySelectorAll('textarea.pseudo').forEach(t => t.addEventListener('keydown', ev => {
    if (ev.key !== 'Tab') return; ev.preventDefault();
    const a = t.selectionStart; t.setRangeText('    ', a, t.selectionEnd, 'end'); t.dispatchEvent(new Event('input'));
  }));

  // Expected answers for the checkable parts: [field key, accepted answers]
  const attendu = { 1: F.mots.map((m, i) => [`m${i}`, [m[1]]]), 2: F.vf.map((v, i) => [`v${i}`, [v[1] ? 'V' : 'F']]), 3: [], 5: [] };
  F.traces.forEach((t, j) => { t.rows.forEach((r, i) => r.slice(1).forEach((v, k) => attendu[3].push([`t${j}-${i}-${k}`, [v]]))); if (t.sortie !== null) attendu[3].push([`ts${j}`, [t.sortie]]); });
  F.trous.forEach((t, j) => t.lignes.forEach((l, i) => { if (l[1]) attendu[5].push([`b${j}-${i}`, l[1]]); }));

  const champ = k => document.querySelector(`[data-k="${k}"]:not([type=radio])`) || document.querySelector(`.radio[data-grp="${k}"]`);
  const valeur = k => { const r = document.querySelector(`input[type=radio][data-k="${k}"]:checked`); return r ? r.value : (document.querySelector(`[data-k="${k}"]:not([type=radio])`)?.value || ''); };
  function verifier(n) {
    let bons = 0, vides = 0;
    attendu[n].forEach(([k, ok]) => {
      const v = valeur(k), el = champ(k);
      el.classList.remove('ok-mark', 'ko-mark');
      if (!v.trim()) { vides++; return; }
      const juste = ok.some(a => norm(a) === norm(v));
      if (juste) bons++;
      el.classList.add(juste ? 'ok-mark' : 'ko-mark');
    });
    const tot = attendu[n].length, res = document.getElementById('res' + n);
    res.className = 'res ' + (bons === tot ? 'bon' : 'pas');
    res.textContent = bons === tot ? `Bravo : ${bons} / ${tot}, tout est juste !` : `${bons} / ${tot} juste${vides ? ` · ${vides} case${vides > 1 ? 's' : ''} vide${vides > 1 ? 's' : ''}` : ''}. Revois les cases en rouge et vérifie encore.`;
  }
  document.querySelectorAll('[data-verif]').forEach(b => b.onclick = () => verifier(+b.dataset.verif));
  document.getElementById('btnImprimer').onclick = () => window.print();
  // Python part: run with the student's inputs, or check with the test inputs (the expected answers are shown only for the failed tests).
  const sansAccent = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const executer = async (i, entrees, echo) => {
    if (!window.PYTHON) return { error: 'Python n’a pas pu être chargé. Vérifie Internet.' };
    try { return await window.PYTHON.run(valeur(PY[i].k), entrees, echo); } catch (e) { return { error: String(e.message || e) }; }
  };
  const erreur = r => r.stopped ? 'Arrêté : le programme tournait trop longtemps (boucle sans fin ?).' : (window.PYTHON ? (x => (x.line ? 'Ligne ' + x.line + ' : ' : '') + (x.text || r.error))(window.PYTHON.explain(r.error)) : r.error);
  document.querySelectorAll('[data-py-run]').forEach(b => b.onclick = async () => {
    const i = +b.dataset.pyRun, out = document.getElementById('pyout' + i);
    b.disabled = true; out.textContent = 'Exécution… (la première fois, Python met quelques secondes à se charger)';
    const r = await executer(i, document.getElementById('pyin' + i).value.split('\n').filter(x => x !== ''), true);
    out.textContent = (r.out || '') + (r.error || r.stopped ? (r.out ? '\n' : '') + '⚠ ' + erreur(r) : (r.out ? '' : '(Le programme n’affiche rien.)'));
    b.disabled = false;
  });
  document.querySelectorAll('[data-py-check]').forEach(b => b.onclick = async () => {
    const i = +b.dataset.pyCheck, res = document.getElementById('pyres' + i), out = document.getElementById('pyout' + i);
    b.disabled = true; res.className = 'res'; res.textContent = 'Vérification…';
    let bons = 0; const lignes = [];
    for (const t of PY[i].tests) {
      const r = await executer(i, t.in, false);
      const sortie = (r.out || '').split('\n').map(x => x.trim()).filter(Boolean), der = sansAccent(sortie[sortie.length - 1] || '');
      const finOk = /^-?\d+$/.test(t.fin) ? new RegExp('(^|[^0-9-])' + t.fin.replace('-', '\\-') + '([^0-9]|$)').test(der) : der.includes(sansAccent(t.fin));
      const contientOk = !t.contient || new RegExp('(^|[^0-9.])' + t.contient.replace('.', '\\.') + '(\\.0)?([^0-9]|$)').test(sortie.join(' '));
      const ok = !r.error && !r.stopped && finOk && contientOk;
      if (ok) bons++;
      lignes.push(`${ok ? '✓' : '✗'} Avec ${t.in.join(', ')} : ${ok ? 'juste' : r.error || r.stopped ? erreur(r) : 'attendu ' + (t.contient ? t.contient + ' puis ' : '') + '« ' + t.fin + ' », ton programme affiche « ' + (sortie.join(' / ') || 'rien') + ' »'}`);
    }
    out.textContent = lignes.join('\n');
    res.className = 'res ' + (bons === PY[i].tests.length ? 'bon' : 'pas');
    res.textContent = bons === PY[i].tests.length ? `Bravo : ${bons} / ${bons} tests réussis !` : `${bons} / ${PY[i].tests.length} tests réussis. Corrige et vérifie encore.`;
    b.disabled = false;
  });
  if (window.PYTHON) window.PYTHON.prepare().catch(() => {});

  // Answer key for the students, shown only after they sent the formative in exam mode AND the teacher published it
  // (called by ../sommative-5/verrou.js). Objective parts: marks + the expected answer next to each mistake.
  const CORR = {
    vf: { 1: '« age != 10 » veut dire que age est différent de 10.', 2: 'Avec OU, il suffit qu’une des deux conditions soit vraie.', 4: 'Le Sinon n’a pas de condition : il s’exécute quand aucune condition avant lui n’est vraie.' },
    erreurs: [
      ['On additionne N, qui n’a pas de valeur : il faut additionner i.', 'somme ← somme + i'],
      ['A et B sont lus après la comparaison : il faut les lire avant le Si.', 'Lire A, B\nSi A < B\n    Afficher(A)\nSinon\n    Afficher(B)\nFinSi'],
      ['Un âge ne peut pas être à la fois plus petit que 0 ET plus grand que 120 : il faut OU.', 'Si age < 0 OU age > 120'],
      ['N n’est jamais relu dans la boucle (elle ne s’arrête jamais), et un TantQue se ferme par FinTantQue.', 'TantQue N != 0\n    total ← total + N\n    Lire N\nFinTantQue']],
    ecrire: 'Lire X, Y\nSi X > Y\n    Afficher("X est plus grand")\nSinon Si Y > X\n    Afficher("Y est plus grand")\nSinon\n    Afficher("Les deux sont égaux")\nFinSi'
  };
  const boite = (titre, html) => `<div class="corr-box" style="margin-top:10px;border:1px solid #85c99b;background:#13321f;border-radius:10px;padding:10px 12px"><b style="color:#9fe5b7">${titre}</b>${html}</div>`;
  window.FORMATIVE_CORRIGE = () => {
    if (document.querySelector('.corr-banniere')) return;
    [1, 2, 3, 5].forEach(verifier);
    Object.values(attendu).flat().forEach(([k, ok]) => {
      if (norm(valeur(k)) === norm(ok[0]) || ok.some(a => norm(a) === norm(valeur(k)))) return;
      const el = document.querySelector(`.radio[data-grp="${k}"]`) || champ(k);
      if (!el) return;
      const s = document.createElement('span'); s.className = 'corr-rep'; s.style.cssText = 'display:inline-block;color:#9fe5b7;font-weight:700;font-size:13px;margin:2px 4px';
      s.textContent = '→ ' + ok[0]; el.after(s);
    });
    F.vf.forEach((v, i) => { if (CORR.vf[i]) { const g = document.querySelector(`.radio[data-grp="v${i}"]`); const td = g && g.closest('tr').lastElementChild; if (td) td.insertAdjacentHTML('beforeend', `<div class="small" style="color:#9fe5b7">Bonne version : ${esc(CORR.vf[i])}</div>`); } });
    const qs = [...document.querySelectorAll('section.part')];
    const qDe = n => [...qs[n - 1].querySelectorAll('.q')];
    qDe(4).forEach((q, j) => q.insertAdjacentHTML('beforeend', boite('Corrigé', `<p class="small">${esc(CORR.erreurs[j][0])}</p>${algo(CORR.erreurs[j][1])}`)));
    qDe(6).forEach(q => q.insertAdjacentHTML('beforeend', boite('Un algorithme possible', algo(CORR.ecrire))));
    qDe(7).forEach((q, i) => q.insertAdjacentHTML('beforeend', boite('Un programme possible', `<pre class="algo">${esc(PY[i].modele)}</pre><p class="small">D’autres programmes sont justes aussi : utilise ✓ Vérifier pour tester le tien.</p>`)));
    document.getElementById('contenu').insertAdjacentHTML('afterbegin', '<div class="card corr-banniere" style="border-color:#85c99b"><h2 style="color:#9fe5b7;margin:0">📖 Corrigé</h2><p style="margin:6px 0 0">Les cases justes sont en vert, les erreurs en rouge, avec la bonne réponse à côté. Pour les parties 4, 6 et 7, compare avec la solution proposée.</p></div>');
    window.scrollTo(0, 0);
  };


  // Teacher only: fill in the expected answers to project them in class.
  document.getElementById('btnProf').onclick = () => {
    Object.values(attendu).flat().forEach(([k, ok]) => {
      const r = [...document.querySelectorAll(`input[type=radio][data-k="${k}"]`)].find(x => x.value === ok[0]);
      if (r) r.checked = true; else { const el = document.querySelector(`[data-k="${k}"]`); if (el) el.value = ok[0]; }
    });
    [1, 2, 3, 5].forEach(verifier);
  };
})();

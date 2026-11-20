// Unit 5 review: eighteen practice exercises (part A: read, trace and translate; part B: write algorithms). Nothing is sent: answers stay in this
// browser, "Vérifier" marks the objective answers, and each exercise has its own answer key.
// ?corrige shows every answer key (used for the printable answer key).
(() => {
  const KEY = 'tej2o-revision5';
  const params = new URLSearchParams(location.search);
  const MODE_CORRIGE = params.has('corrige');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KW = /(LIRE|AFFICHER|SINON SI|SINON|SI|ALORS|FIN SI|FIN RÉPÉTER|RÉPÉTER|FOIS|FIN TANT QUE|TANT QUE|FAIRE|ET|OU|NON)(?![A-Za-zÀ-ÿ])/g;
  const algo = src => `<pre class="algo">${esc(src).replace(KW, '<span class="kw">$1</span>')}</pre>`;
  const py = src => `<pre class="algo">${esc(src)}</pre>`;
  // Accents, spaces, quotes and case do not matter when comparing answers.
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[«»"“”']/g, '').replace(/\s+/g, '').toLowerCase();
  // For printed output, commas and semicolons between values do not matter either.
  const normSortie = s => norm(s).replace(/[,;]/g, '');
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* storage unavailable */ } };

  const LETTRES = 'ABCDEFGH';
  const sel = (k, opts) => `<select data-k="${k}"><option value="">—</option>${opts.map(o => `<option>${esc(o)}</option>`).join('')}</select>`;
  const inp = (k, cls = '') => `<input type="text" class="${cls}" data-k="${k}" autocomplete="off" spellcheck="false">`;
  const corr = (n, html) => `<div class="corr-box" id="corr${n}" hidden><b>📖 Corrigé de l’exercice ${n}</b>${html}</div>`;
  const ex = (n, titre, etiq, consigne, corps, verif, corrHtml) => `<section class="card part" id="ex${n}"><h2><span class="n">${n}</span>${titre}<span class="etiq">${etiq}</span></h2><p class="consigne">${consigne}</p>${corps}
    <div class="check-row">${verif ? `<button type="button" data-verif="${n}">Vérifier</button>` : ''}<button type="button" data-corr="${n}">📖 Voir le corrigé</button><span class="res" id="res${n}"></span></div>${corr(n, corrHtml)}</section>`;

  // Expected answers for "Vérifier": n -> [[field key, accepted answers, compare function]]
  const attendu = {};
  const ajoute = (n, k, ok, f = norm) => (attendu[n] = attendu[n] || []).push([k, ok, f]);

  /* ---------- Exercise 1: vocabulary ---------- */
  const MOTS = [
    ['algorithme', 'Une suite d’étapes précises, dans le bon ordre, pour résoudre un problème.'],
    ['affectation', 'Donner une valeur à une variable (← en pseudocode, = en Python).'],
    ['booléen', 'Une valeur qui ne peut être que vraie ou fausse.'],
    ['accumulateur', 'Une variable qui commence à 0 et à laquelle on ajoute une valeur à chaque tour.'],
    ['boucle infinie', 'Une boucle dont la condition reste toujours vraie : elle ne s’arrête jamais.'],
    ['bogue', 'Une erreur dans un algorithme ou un programme.'],
    ['indentation', 'Les espaces au début d’une ligne, qui montrent qu’elle fait partie d’un bloc.'],
    ['paramètre', 'Une variable entre les parenthèses de def, qui reçoit une valeur à chaque appel.']
  ];
  const ORDRE_DEFS = [5, 2, 7, 0, 3, 6, 1, 4]; // definition shown at letter i = MOTS[ORDRE_DEFS[i]]
  const lettreDe = i => LETTRES[ORDRE_DEFS.indexOf(i)];
  MOTS.forEach((m, i) => ajoute(1, 'm' + i, [lettreDe(i)]));

  /* ---------- Exercise 2: data types ---------- */
  const TYPES = [['17', 'int'], ['2.5', 'float'], ['"17"', 'str'], ['False', 'bool'], ['"Vrai"', 'str'], ['-4', 'int'], ['0.75', 'float'], ['True', 'bool']];
  const NOMS_TYPES = ['int (entier)', 'float (décimal)', 'str (texte)', 'bool (booléen)'];
  TYPES.forEach((t, i) => ajoute(2, 'ty' + i, [NOMS_TYPES.find(x => x.startsWith(t[1]))]));
  const POURQUOI_TYPE = { int: 'nombre sans virgule', float: 'nombre avec un point décimal', str: 'entre guillemets : c’est du texte, même s’il contient un nombre ou le mot « Vrai »', bool: 'True ou False, sans guillemets' };

  /* ---------- Exercises 3 and 5: trace tables ---------- */
  const T3 = { code: 'a ← 6\nb ← 2\nb ← a + b\na ← b × 2\nb ← a + b\na ← a ÷ 4\nAFFICHER a, b',
    cols: ['Après la ligne', 'a', 'b'], rows: [['b ← a + b', '6', '8'], ['a ← b × 2', '16', '8'], ['b ← a + b', '16', '24'], ['a ← a ÷ 4', '4', '24']], sortie: '4 24' };
  const T5 = [
    { t: 'a) Une boucle RÉPÉTER avec un accumulateur.', code: 'total ← 0\nn ← 1\nRÉPÉTER 4 FOIS\n    total ← total + n\n    n ← n + 2\nFIN RÉPÉTER\nAFFICHER total',
      cols: ['Tour', 'total après le tour', 'n après le tour'], rows: [['1', '1', '3'], ['2', '4', '5'], ['3', '9', '7'], ['4', '16', '9']], sortie: '16' },
    { t: 'b) Une boucle TANT QUE avec un compteur.', code: 'x ← 50\nc ← 0\nTANT QUE x > 5 FAIRE\n    x ← x − 12\n    c ← c + 1\nFIN TANT QUE\nAFFICHER c',
      cols: ['Tour', 'x après le tour', 'c après le tour'], rows: [['1', '38', '1'], ['2', '26', '2'], ['3', '14', '3'], ['4', '2', '4']], sortie: '4' }
  ];
  const tableTrace = (t, id) => `<table class="f"><tr>${t.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${t.rows.map((r, i) => `<tr><td>${t.cols[0] === 'Après la ligne' ? `<code>${esc(r[0])}</code>` : esc(r[0])}</td>${r.slice(1).map((_, k) => `<td>${inp(`${id}-${i}-${k}`)}</td>`).join('')}</tr>`).join('')}</table><p style="margin-top:8px"><b>Ce qui s’affiche :</b> ${inp(id + '-s', 'trou')}</p>`;
  const tableTraceCorr = t => `<table class="f"><tr>${t.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${t.rows.map(r => `<tr>${r.map((v, k) => `<td>${k === 0 && t.cols[0] === 'Après la ligne' ? `<code>${esc(v)}</code>` : esc(v)}</td>`).join('')}</tr>`).join('')}</table><p><b>Affiche :</b> <code>${esc(t.sortie)}</code></p>`;
  const ajouteTrace = (n, t, id) => { t.rows.forEach((r, i) => r.slice(1).forEach((v, k) => ajoute(n, `${id}-${i}-${k}`, [v]))); ajoute(n, id + '-s', [t.sortie], normSortie); };
  ajouteTrace(3, T3, 't3');
  T5.forEach((t, j) => ajouteTrace(5, t, 't5' + j));

  /* ---------- Exercise 4: conditions ---------- */
  const C4 = { code: 'LIRE age\nSI age < 12 OU age ≥ 65 ALORS\n    AFFICHER « Tarif réduit »\nSINON SI age ≥ 13 ET age ≤ 17 ALORS\n    AFFICHER « Tarif ado »\nSINON\n    AFFICHER « Tarif normal »\nFIN SI',
    cas: [['8', 'Tarif réduit', '8 < 12 : la première condition est vraie.'], ['12', 'Tarif normal', 'Piège ! 12 < 12 est faux, et 12 ≥ 13 est faux aussi : on arrive au SINON.'], ['15', 'Tarif ado', '15 ≥ 13 ET 15 ≤ 17 : les deux parties sont vraies.'], ['65', 'Tarif réduit', '65 ≥ 65 est vrai : avec OU, une seule partie vraie suffit.'], ['30', 'Tarif normal', 'Aucune condition n’est vraie : on fait le SINON.']] };
  const TARIFS = ['Tarif réduit', 'Tarif ado', 'Tarif normal'];
  C4.cas.forEach((c, i) => ajoute(4, 'c' + i, [c[1]]));

  /* ---------- Exercise 6: put the lines in order ---------- */
  const O6 = ['LIRE n1, n2, n3', 'total ← n1 + n2 + n3', 'moyenne ← total ÷ 3', 'SI moyenne ≥ 50 ALORS', '    AFFICHER « Réussi »', 'SINON', '    AFFICHER « À reprendre »', 'FIN SI'];
  const MELANGE6 = [3, 6, 1, 7, 0, 4, 2, 5]; // line shown in position p = O6[MELANGE6[p]]
  MELANGE6.forEach((l, p) => ajoute(6, 'o' + p, [String(l + 1)]));

  /* ---------- Exercise 7: find and fix the error ---------- */
  const E7 = [
    { t: 'a) Pseudocode : cet algorithme doit afficher 10, 9, 8, … jusqu’à 1.', code: 'n ← 10\nTANT QUE n > 0 FAIRE\n    AFFICHER n\n    n ← n + 1\nFIN TANT QUE', pyth: false,
      err: 'n augmente au lieu de diminuer : il s’éloigne de 0, la condition n > 0 reste toujours vraie. C’est une boucle infinie.', fix: 'n ← n − 1' },
    { t: 'b) Python : ce programme doit dire si on peut travailler (16 ans ou plus).', code: 'age = input("Ton âge ? ")\nif age >= 16:\n    print("Tu peux travailler")', pyth: true,
      err: 'input donne toujours du texte : on ne peut pas comparer un texte avec 16 (TypeError). Il faut le transformer en nombre avec int(…).', fix: 'age = int(input("Ton âge ? "))' },
    { t: 'c) Python : ce programme doit additionner les nombres de 1 à 5, puis afficher le total une seule fois.', code: 'total = 0\nfor i in range(1, 5):\n    total = total + i\n    print(total)', pyth: true,
      err: 'Deux erreurs : range(1, 5) s’arrête à 4 (le 5 n’est jamais inclus), et print est dans la boucle, donc le total s’affiche à chaque tour.', fix: 'total = 0\nfor i in range(1, 6):\n    total = total + i\nprint(total)' },
    { t: 'd) Python : ce programme doit afficher « Ado » seulement pour un âge entre 13 et 17 ans.', code: 'age = int(input("Ton âge ? "))\nif age >= 13 or age <= 17:\n    print("Ado")', pyth: true,
      err: 'Avec or, tous les âges passent (40 ≥ 13 est vrai). « Entre 13 et 17 » veut dire que les DEUX conditions doivent être vraies : il faut and.', fix: 'if age >= 13 and age <= 17:' }
  ];

  /* ---------- Exercise 8: from pseudocode to Python (fill in) ---------- */
  // Each line is a list of pieces: a string is shown as is, an array is a blank with its accepted answers.
  const P8 = [
    { t: 'a) Une condition à trois cas.', pseudo: 'LIRE note\nSI note ≥ 80 ALORS\n    AFFICHER « Excellent »\nSINON SI note ≥ 60 ALORS\n    AFFICHER « Bien »\nSINON\n    AFFICHER « Continue tes efforts »\nFIN SI',
      lignes: [['note = ', ['int'], '(input("Ta note ? "))'], [['if'], ' note ', ['>='], ' 80:'], ['    print("Excellent")'], [['elif'], ' note >= 60:'], ['    print("Bien")'], [['else'], ':'], ['    print("Continue tes efforts")']] },
    { t: 'b) Une boucle qui additionne les nombres de 1 à 10.', pseudo: 'somme ← 0\ni ← 1\nRÉPÉTER 10 FOIS\n    somme ← somme + i\n    i ← i + 1\nFIN RÉPÉTER\nAFFICHER somme',
      lignes: [['somme = ', ['0']], ['for i in ', ['range'], '(1, ', ['11'], '):'], ['    somme = ', ['somme + i', 'i + somme']], [['print'], '(somme)']] }
  ];
  const ligneTrous = (lignes, j) => {
    let c = 0;
    return lignes.map(l => l.map(m => {
      if (typeof m === 'string') return esc(m);
      const k = `p${j}-${c++}`; ajoute(8, k, m);
      return `<input type="text" class="trou" data-k="${k}" autocomplete="off" spellcheck="false" size="${Math.max(5, ...m.map(x => x.length))}">`;
    }).join('')).join('\n');
  };
  // Python solutions for the answer key
  const P8_SOL = ['note = int(input("Ta note ? "))\nif note >= 80:\n    print("Excellent")\nelif note >= 60:\n    print("Bien")\nelse:\n    print("Continue tes efforts")',
    'somme = 0\nfor i in range(1, 11):\n    somme = somme + i\nprint(somme)'];

  /* ---------- Exercise 9: what does this Python program print? ---------- */
  const S9 = [
    { code: 'x = 7\ny = x * 2\nx = y - 3\nprint(x, y)', rep: ['11 14'], why: 'y = 7 × 2 = 14, puis x = 14 − 3 = 11. print met un espace entre les deux valeurs.' },
    { code: 'for i in range(10, 0, -3):\n    print(i)', rep: ['10 7 4 1'], why: 'On part de 10 et on recule de 3 : 10, 7, 4, 1. Le suivant serait −2, qui dépasse la fin (0).' },
    { code: 'def aire(longueur, largeur):\n    return longueur * largeur\n\na = aire(4, 3)\nprint(a + aire(2, 5))', rep: ['22'], why: 'aire(4, 3) renvoie 12 et aire(2, 5) renvoie 10 : 12 + 10 = 22.' },
    { code: 'mot = "python"\nif len(mot) >= 6 and mot != "Python":\n    print("Accepté")\nelse:\n    print("Refusé")', rep: ['Accepté', 'Accepte'], why: 'len("python") vaut 6, donc 6 >= 6 est vrai. "python" != "Python" est vrai aussi, car Python fait la différence entre majuscules et minuscules. Les deux parties sont vraies.' }
  ];
  S9.forEach((s, i) => ajoute(9, 's' + i, s.rep, normSortie));

  /* ---------- Exercise 10: write it (pseudocode, then Python) ---------- */
  const PY10 = {
    k: 'py10', exemple: '3\n8\n40\n70',
    modele: 'def prix_billet(age):\n    if age < 12 or age >= 65:\n        return 6\n    else:\n        return 10\n\nn = int(input("Combien de personnes ? "))\ntotal = 0\nfor i in range(n):\n    age = int(input("Âge ? "))\n    total = total + prix_billet(age)\nprint("Prix total :", total)',
    tests: [{ in: ['3', '8', '40', '70'], fin: '22' }, { in: ['2', '12', '64'], fin: '20' }, { in: ['1', '65'], fin: '6' }, { in: ['4', '11', '12', '65', '64'], fin: '32' }]
  };
  const PSEUDO10 = 'LIRE n\ntotal ← 0\nRÉPÉTER n FOIS\n    LIRE age\n    SI age < 12 OU age ≥ 65 ALORS\n        total ← total + 6\n    SINON\n        total ← total + 10\n    FIN SI\nFIN RÉPÉTER\nAFFICHER total';

  /* ---------- Build the page ---------- */
  let h = '';
  h += `<section class="card part partie-titre"><h2 style="margin:0">Partie A — Je révise les notions</h2></section>`;
  h += ex(1, 'Le vocabulaire de l’unité', 'Leçons 1 à 12', 'Choisis la lettre de la définition qui correspond à chaque mot.',
    `<div class="two"><table class="f"><tr><th>Mot</th><th style="width:110px">Lettre</th></tr>${MOTS.map((m, i) => `<tr><td>${esc(m[0])}</td><td>${sel('m' + i, LETTRES.split(''))}</td></tr>`).join('')}</table>
     <table class="f"><tr><th>Définitions</th></tr>${ORDRE_DEFS.map((d, i) => `<tr><td><b>${LETTRES[i]})</b> ${esc(MOTS[d][1])}</td></tr>`).join('')}</table></div>`, true,
    `<table class="f"><tr><th>Mot</th><th>Lettre</th><th>Définition</th></tr>${MOTS.map((m, i) => `<tr><td>${esc(m[0])}</td><td><b>${lettreDe(i)}</b></td><td>${esc(m[1])}</td></tr>`).join('')}</table>`);

  h += ex(2, 'Quel est le type ?', 'Leçons 2 et 7', 'Pour chaque valeur, choisis son type en Python.',
    `<table class="f"><tr><th>Valeur</th><th>Type</th></tr>${TYPES.map((t, i) => `<tr><td><code>${esc(t[0])}</code></td><td>${sel('ty' + i, NOMS_TYPES)}</td></tr>`).join('')}</table>`, true,
    `<table class="f"><tr><th>Valeur</th><th>Type</th><th>Pourquoi</th></tr>${TYPES.map(t => `<tr><td><code>${esc(t[0])}</code></td><td><b>${t[1]}</b></td><td>${esc(POURQUOI_TYPE[t[1]])}</td></tr>`).join('')}</table>`);

  h += ex(3, 'Je suis l’ordinateur : les variables', 'Leçon 2', 'Exécute l’algorithme à la main. Écris la valeur de a et de b après chaque ligne, puis ce qui s’affiche.',
    `<div class="two"><div>${algo(T3.code)}</div><div>${tableTrace(T3, 't3')}</div></div>`, true,
    `<div class="two"><div>${algo(T3.code)}</div><div>${tableTraceCorr(T3)}</div></div><p class="small">Une variable ne garde qu’une valeur à la fois : à chaque affectation, l’ancienne valeur est remplacée. On utilise toujours la valeur la plus récente.</p>`);

  h += ex(4, 'Les conditions', 'Leçon 3', 'Pour chaque âge lu, choisis ce que l’algorithme affiche.',
    `<div class="two"><div>${algo(C4.code)}</div><div><table class="f"><tr><th>Âge lu</th><th>Ce qui s’affiche</th></tr>${C4.cas.map((c, i) => `<tr><td>${c[0]}</td><td>${sel('c' + i, TARIFS)}</td></tr>`).join('')}</table></div></div>`, true,
    `${algo(C4.code)}<table class="f"><tr><th>Âge</th><th>Affiche</th><th>Pourquoi</th></tr>${C4.cas.map(c => `<tr><td>${c[0]}</td><td><b>${c[1]}</b></td><td>${esc(c[2])}</td></tr>`).join('')}</table><p class="small">Les conditions sont testées dans l’ordre : on s’arrête à la première qui est vraie.</p>`);

  h += ex(5, 'Les boucles', 'Leçon 4', 'Remplis le tableau tour par tour, puis écris ce qui s’affiche.',
    T5.map((t, j) => `<div class="q"><p>${esc(t.t)}</p><div class="two"><div>${algo(t.code)}</div><div>${tableTrace(t, 't5' + j)}</div></div></div>`).join(''), true,
    T5.map(t => `<p><b>${esc(t.t)}</b></p><div class="two"><div>${algo(t.code)}</div><div>${tableTraceCorr(t)}</div></div>`).join('') + '<p class="small">b) Avant le 5e tour, x vaut 2 : 2 > 5 est faux, donc la boucle s’arrête après 4 tours.</p>');

  h += ex(6, 'Remets l’algorithme en ordre', 'Leçon 5', 'Cet algorithme lit trois notes, calcule la moyenne et dit si l’élève a réussi (50 ou plus). Les lignes sont mélangées : donne à chaque ligne son numéro (1 = la première).',
    MELANGE6.map((l, p) => `<div class="ordre-l">${sel('o' + p, ['1', '2', '3', '4', '5', '6', '7', '8'])}${algo(O6[l])}</div>`).join(''), true,
    `${algo(O6.join('\n'))}<p class="small">L’ordre : LIRE avant de calculer, calculer avant de décider, et chaque AFFICHER à l’intérieur de son bloc.</p>`);

  h += ex(7, 'Trouve et corrige l’erreur', 'Leçons 4, 5, 8, 10 et 11', 'Chaque algorithme ou programme contient une erreur (le c en a deux). Explique-la en une phrase, puis réécris la ou les lignes corrigées.',
    E7.map((e, j) => `<div class="q"><p>${esc(e.t)}</p><div class="two"><div>${e.pyth ? py(e.code) : algo(e.code)}</div><div><label class="small">L’erreur :</label><textarea class="rep" data-k="e${j}" rows="2" placeholder="Explique l’erreur…"></textarea><label class="small">Ma correction :</label><textarea class="rep${e.pyth ? '' : ' pseudo'}" data-k="ec${j}" rows="3" spellcheck="false" placeholder="Réécris la ou les lignes corrigées…"></textarea></div></div></div>`).join(''), false,
    E7.map(e => `<p><b>${esc(e.t)}</b></p><div class="two"><div><p class="small">Avant</p>${e.pyth ? py(e.code) : algo(e.code)}</div><div><p class="small">Corrigé</p>${e.pyth ? py(e.fix) : algo(e.fix)}</div></div><p class="small">${esc(e.err)}</p>`).join(''));

  h += ex(8, 'Du pseudocode au Python', 'Leçons 9 et 11', 'Traduis le pseudocode en Python : écris ce qui manque dans chaque case pointillée.',
    P8.map((p, j) => `<div class="q"><p>${esc(p.t)}</p><div class="two"><div><p class="small">Pseudocode</p>${algo(p.pseudo)}</div><div><p class="small">Python</p><pre class="algo">${ligneTrous(p.lignes, j)}</pre></div></div></div>`).join(''), true,
    P8.map((p, j) => `<p><b>${esc(p.t)}</b></p>${py(P8_SOL[j])}`).join('') + '<p class="small">RÉPÉTER 10 FOIS en commençant à 1 devient range(1, 11) : le 11 n’est jamais inclus.</p>');

  h += ex(9, 'Qu’affiche ce programme ?', 'Leçons 7, 8, 10, 11 et 12', 'Exécute chaque programme dans ta tête. S’il affiche plusieurs valeurs, sépare-les par des espaces.',
    `<div class="two">${S9.map((s, i) => `<div class="q"><p>${String.fromCharCode(97 + i)})</p>${py(s.code)}<p><b>Affiche :</b> ${inp('s' + i, 'sortie')}</p></div>`).join('')}</div>`, true,
    `<div class="two">${S9.map((s, i) => `<div><p><b>${String.fromCharCode(97 + i)})</b> affiche <code>${esc(s.rep[0])}</code></p>${py(s.code)}<p class="small">${esc(s.why)}</p></div>`).join('')}</div>`);

  h += ex(10, 'À toi d’écrire : le cinéma', 'Toute l’unité', 'Au cinéma, un billet coûte 6 $ pour les moins de 12 ans et pour les 65 ans et plus, et 10 $ pour les autres. On lit le nombre de personnes, puis l’âge de chacune, et on affiche le prix total.',
    `<div class="q"><p>a) Écris l’algorithme en pseudocode. Indente les lignes qui sont dans un bloc (touche Tab).</p><textarea class="pseudo" data-k="pseudo10" rows="10" spellcheck="false" placeholder="LIRE n&#10;…"></textarea></div>
     <div class="q"><p>b) Écris le programme en Python, avec une fonction <code>prix_billet(age)</code> qui renvoie (return) le prix d’un billet.</p>
      <div class="two"><div><textarea class="pseudo" data-k="${PY10.k}" rows="12" spellcheck="false" placeholder="# Ton programme Python"></textarea>
      <div class="check-row" style="display:flex"><button type="button" id="pyRun">▶ Exécuter</button><button type="button" id="pyCheck">✓ Vérifier</button><span class="res" id="pyres"></span></div>
      <pre class="algo" id="pyout" style="white-space:pre-wrap;min-height:48px;margin-top:8px">Clique sur ▶ Exécuter pour voir ce que ton programme affiche.</pre></div>
      <div><p class="small">Entrées pour tester (une par ligne : le nombre de personnes, puis les âges) :</p><textarea class="rep" id="pyin" rows="6" spellcheck="false">${esc(PY10.exemple)}</textarea>
      <details style="margin-top:8px"><summary class="small">💡 Indice</summary><p class="small">Écris d’abord la fonction avec def, if / else et deux return. Ensuite : total = 0 avant la boucle, for i in range(n), et dans la boucle total = total + prix_billet(age). Affiche le total après la boucle.</p></details></div></div></div>`, false,
    `<p><b>a) Un algorithme possible</b></p>${algo(PSEUDO10)}<p><b>b) Un programme possible</b></p>${py(PY10.modele)}<p class="small">Avec 3 personnes de 8, 40 et 70 ans : 6 + 10 + 6 = 22 $. Teste aussi les cas limites : 12 ans paie 10 $, 65 ans paie 6 $. D’autres programmes sont justes aussi : utilise ✓ Vérifier pour tester le tien.</p>`);

  /* ---------- Part B (exercises 11 to 18): the student writes the algorithm ---------- */
  // ex: [inputs, what is displayed]; sol: a model algorithm; verif: how to check it with one example.
  const ECRIRE = [
    { titre: 'L’aire et le périmètre', etiq: 'Leçon 2', enonce: 'Lis la longueur et la largeur d’un rectangle. Calcule son aire (longueur × largeur) et son périmètre (2 × (longueur + largeur)), puis affiche les deux.',
      ex: [['5 et 3', 'Aire : 15 · Périmètre : 16'], ['10 et 4', 'Aire : 40 · Périmètre : 28']],
      indice: 'Il te faut 2 LIRE, 2 affectations (aire ← …, perimetre ← …) et 2 AFFICHER. Pas besoin de condition ni de boucle.',
      sol: 'LIRE longueur\nLIRE largeur\naire ← longueur × largeur\nperimetre ← 2 × (longueur + largeur)\nAFFICHER « Aire : », aire\nAFFICHER « Périmètre : », perimetre',
      verif: 'Avec 5 et 3 : aire ← 5 × 3 = 15 et perimetre ← 2 × (5 + 3) = 16.' },
    { titre: 'Le plus grand de deux nombres', etiq: 'Leçon 3', enonce: 'Lis deux nombres a et b. Affiche le plus grand. S’ils sont égaux, affiche « Les deux nombres sont égaux ».',
      ex: [['8 et 3', '8'], ['4 et 11', '11'], ['6 et 6', 'Les deux nombres sont égaux']],
      indice: 'Trois cas possibles : utilise SI … ALORS, SINON SI … ALORS, SINON, puis FIN SI.',
      sol: 'LIRE a\nLIRE b\nSI a > b ALORS\n    AFFICHER a\nSINON SI b > a ALORS\n    AFFICHER b\nSINON\n    AFFICHER « Les deux nombres sont égaux »\nFIN SI',
      verif: 'Avec 6 et 6 : 6 > 6 est faux, 6 > 6 est faux encore, donc on fait le SINON. N’oublie pas ce troisième cas !' },
    { titre: 'L’inscription au club de robotique', etiq: 'Leçon 3', enonce: 'Lis l’âge de l’élève, puis sa réponse (« oui » ou « non ») à la question « As-tu l’autorisation d’un parent ? ». L’inscription est acceptée si l’élève a 18 ans ou plus, ou s’il a l’autorisation. Sinon, elle est refusée.',
      ex: [['19 et « non »', 'Inscription acceptée'], ['15 et « oui »', 'Inscription acceptée'], ['15 et « non »', 'Inscription refusée']],
      indice: 'Une seule des deux raisons suffit : quel mot relie les deux conditions, ET ou OU ?',
      sol: 'LIRE age\nLIRE autorisation\nSI age ≥ 18 OU autorisation = « oui » ALORS\n    AFFICHER « Inscription acceptée »\nSINON\n    AFFICHER « Inscription refusée »\nFIN SI',
      verif: 'Avec 15 et « oui » : 15 ≥ 18 est faux, mais autorisation = « oui » est vrai. Avec OU, ça suffit. Avec ET, l’inscription serait refusée : ce serait une erreur.' },
    { titre: 'La table de multiplication', etiq: 'Leçon 4', enonce: 'Lis un nombre n. Affiche sa table de multiplication, de n × 1 jusqu’à n × 10.',
      ex: [['7', '7, 14, 21, 28, 35, 42, 49, 56, 63, 70'], ['3', '3, 6, 9, … , 30']],
      indice: 'Tu sais combien de tours il faut (10) : utilise RÉPÉTER 10 FOIS. Il te faut aussi une variable i qui commence à 1 et augmente de 1 à chaque tour.',
      sol: 'LIRE n\ni ← 1\nRÉPÉTER 10 FOIS\n    AFFICHER n × i\n    i ← i + 1\nFIN RÉPÉTER',
      verif: 'Avec n = 7 : au 1er tour i vaut 1 (affiche 7), au 2e tour i vaut 2 (affiche 14)… au 10e tour i vaut 10 (affiche 70).' },
    { titre: 'Le compte à rebours', etiq: 'Leçon 4', enonce: 'Lis un nombre n. Affiche n, puis n − 1, et ainsi de suite jusqu’à 1. À la fin, affiche « Décollage ! ».',
      ex: [['5', '5, 4, 3, 2, 1, Décollage !'], ['2', '2, 1, Décollage !']],
      indice: 'Utilise TANT QUE n > 0 FAIRE. Dans la boucle, n doit diminuer, sinon la boucle ne s’arrête jamais. « Décollage ! » s’affiche une seule fois : après FIN TANT QUE.',
      sol: 'LIRE n\nTANT QUE n > 0 FAIRE\n    AFFICHER n\n    n ← n − 1\nFIN TANT QUE\nAFFICHER « Décollage ! »',
      verif: 'Avec n = 2 : 2 > 0 (affiche 2, n devient 1), 1 > 0 (affiche 1, n devient 0), 0 > 0 est faux : on sort de la boucle et on affiche « Décollage ! ».' },
    { titre: 'La moyenne de cinq notes', etiq: 'Leçons 4 et 5', enonce: 'Lis cinq notes, une à la fois, avec une boucle. Calcule la moyenne et affiche-la.',
      ex: [['70, 80, 65, 90, 75', '76'], ['50, 60, 40, 55, 45', '50']],
      indice: 'Un accumulateur total commence à 0 avant la boucle. Dans la boucle : LIRE note, puis total ← total + note. La division se fait après la boucle.',
      sol: 'total ← 0\nRÉPÉTER 5 FOIS\n    LIRE note\n    total ← total + note\nFIN RÉPÉTER\nmoyenne ← total ÷ 5\nAFFICHER moyenne',
      verif: 'Avec 70, 80, 65, 90, 75 : total vaut 70, 150, 215, 305, puis 380. 380 ÷ 5 = 76. Si la division est dans la boucle, on divise 5 fois : c’est une erreur.' },
    { titre: 'Le mot de passe : trois essais', etiq: 'Leçons 3, 4 et 5', enonce: 'L’utilisateur tape un mot de passe. Le bon mot de passe est « tej2o ». Tant que c’est faux, on affiche « Mot de passe incorrect » et on redemande, mais au maximum 3 essais en tout. À la fin, affiche « Bienvenue ! » si le mot de passe est bon, sinon « Compte bloqué ».',
      ex: [['tej2o', 'Bienvenue !'], ['abc, puis tej2o', 'Mot de passe incorrect, Bienvenue !'], ['abc, 123, x', 'Mot de passe incorrect (2 fois), Compte bloqué']],
      indice: 'Il te faut un compteur essais. La boucle continue tant que le mot de passe est faux ET qu’il reste des essais. Après la boucle, un SI vérifie pourquoi on est sorti.',
      sol: 'LIRE mdp\nessais ← 1\nTANT QUE mdp ≠ « tej2o » ET essais < 3 FAIRE\n    AFFICHER « Mot de passe incorrect »\n    LIRE mdp\n    essais ← essais + 1\nFIN TANT QUE\nSI mdp = « tej2o » ALORS\n    AFFICHER « Bienvenue ! »\nSINON\n    AFFICHER « Compte bloqué »\nFIN SI',
      verif: 'Avec abc, 123, x : après le 3e essai, essais vaut 3 et 3 < 3 est faux, donc la boucle s’arrête. mdp vaut « x », donc on affiche « Compte bloqué ».' },
    { titre: 'La tirelire', etiq: 'Leçons 4 et 5', enonce: 'Chaque semaine, tu mets 15 $ dans ta tirelire. Lis ton objectif (en dollars). Affiche le nombre de semaines qu’il faut pour atteindre ou dépasser l’objectif.',
      ex: [['100', '7'], ['45', '3'], ['15', '1']],
      indice: 'Tu ne sais pas combien de tours il faut : utilise TANT QUE. Deux variables commencent à 0 : l’épargne (accumulateur, + 15) et les semaines (compteur, + 1).',
      sol: 'LIRE objectif\nepargne ← 0\nsemaines ← 0\nTANT QUE epargne < objectif FAIRE\n    epargne ← epargne + 15\n    semaines ← semaines + 1\nFIN TANT QUE\nAFFICHER semaines',
      verif: 'Avec 100 : epargne vaut 15, 30, 45, 60, 75, 90, puis 105. Il a fallu 7 tours, donc 7 semaines. 105 < 100 est faux : la boucle s’arrête.' }
  ];
  const tableEx = e => `<table class="f"><tr><th>Si on entre…</th><th>L’algorithme affiche…</th></tr>${e.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>`;
  h += `<section class="card part partie-titre"><h2 style="margin:0">Partie B — J’écris des algorithmes</h2><p class="consigne" style="margin-bottom:0">Pour chaque problème, écris l’algorithme en pseudocode. Ensuite, teste-le à la main avec les exemples du tableau : ton algorithme doit afficher la même chose. Le corrigé montre une solution possible ; la tienne peut être différente et quand même juste.</p></section>`;
  ECRIRE.forEach((p, i) => {
    const n = 11 + i;
    // "bloc": keep each short problem on one printed page
    h += ex(n, p.titre, p.etiq, p.enonce,
      `<div class="two"><div>${tableEx(p.ex)}<details style="margin-top:8px"><summary class="small">💡 Indice</summary><p class="small">${esc(p.indice)}</p></details></div>
       <div><textarea class="pseudo" data-k="b${n}" rows="${Math.max(7, p.sol.split('\n').length + 1)}" spellcheck="false" placeholder="Écris ton algorithme ici…"></textarea></div></div>`, false,
      `<div class="two"><div>${algo(p.sol)}</div><div><p><b>Je teste avec un exemple</b></p><p class="small">${esc(p.verif)}</p><p class="small"><b>Vérifie aussi :</b> chaque bloc est fermé (FIN SI, FIN RÉPÉTER, FIN TANT QUE) et les lignes à l’intérieur d’un bloc sont indentées.</p></div></div>`).replace('class="card part"', 'class="card part bloc"');
  });

  const contenu = document.getElementById('contenu');
  contenu.innerHTML = h;
  if (MODE_CORRIGE) {
    document.body.classList.add('mode-corrige');
    document.querySelectorAll('.corr-box').forEach(b => { b.hidden = false; });
    contenu.insertAdjacentHTML('afterbegin', '<div class="card" style="border-color:#85c99b"><h2 style="color:#9fe5b7;margin:0">📖 Corrigé de la révision</h2><p style="margin:6px 0 0">Les réponses de chaque exercice sont dans les encadrés verts. Pour les exercices 7 et 10, d’autres réponses peuvent être justes.</p></div>');
  }

  // Restore and save answers
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    if (saved[k] !== undefined && !MODE_CORRIGE) el.value = saved[k];
    const maj = () => { saved[k] = el.value; keep(); el.classList.remove('ok-mark', 'ko-mark'); };
    el.addEventListener('input', maj); el.addEventListener('change', maj);
  });
  // Tab inserts 4 spaces in the pseudocode and Python boxes
  document.querySelectorAll('textarea.pseudo').forEach(t => t.addEventListener('keydown', ev => {
    if (ev.key !== 'Tab') return; ev.preventDefault();
    const a = t.selectionStart; t.setRangeText('    ', a, t.selectionEnd, 'end'); t.dispatchEvent(new Event('input'));
  }));

  const valeur = k => document.querySelector(`[data-k="${k}"]`)?.value || '';
  function verifier(n) {
    let bons = 0, vides = 0;
    attendu[n].forEach(([k, ok, f]) => {
      const el = document.querySelector(`[data-k="${k}"]`), v = valeur(k);
      el.classList.remove('ok-mark', 'ko-mark');
      if (!v.trim()) { vides++; return; }
      const juste = ok.some(a => f(a) === f(v));
      if (juste) bons++;
      el.classList.add(juste ? 'ok-mark' : 'ko-mark');
    });
    const tot = attendu[n].length, res = document.getElementById('res' + n);
    res.className = 'res ' + (bons === tot ? 'bon' : 'pas');
    res.textContent = bons === tot ? `Bravo : ${bons} / ${tot}, tout est juste !` : `${bons} / ${tot} juste${vides ? ` · ${vides} case${vides > 1 ? 's' : ''} vide${vides > 1 ? 's' : ''}` : ''}. Revois les cases en rouge, puis vérifie encore.`;
  }
  document.querySelectorAll('[data-verif]').forEach(b => b.onclick = () => verifier(+b.dataset.verif));
  document.querySelectorAll('[data-corr]').forEach(b => b.onclick = () => {
    const box = document.getElementById('corr' + b.dataset.corr);
    box.hidden = !box.hidden;
    b.textContent = box.hidden ? '📖 Voir le corrigé' : '📖 Cacher le corrigé';
  });
  document.getElementById('btnImprimer').onclick = () => window.print();
  // Erase all answers: a second click within 3 s confirms.
  const be = document.getElementById('btnEffacer'); let attente = null;
  be.onclick = () => {
    if (!attente) { be.textContent = 'Tout effacer ? Clique encore'; attente = setTimeout(() => { attente = null; be.textContent = '🧽 Tout effacer'; }, 3000); return; }
    clearTimeout(attente); attente = null; be.textContent = '🧽 Tout effacer';
    saved = {}; keep();
    document.querySelectorAll('[data-k]').forEach(el => { el.value = ''; el.classList.remove('ok-mark', 'ko-mark'); });
    document.querySelectorAll('.res').forEach(r => { r.textContent = ''; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Exercise 10 b: run with the student's inputs, or check with the test inputs.
  const executer = async (entrees, echo) => {
    if (!window.PYTHON) return { error: 'Python n’a pas pu être chargé. Vérifie Internet.' };
    try { return await window.PYTHON.run(valeur(PY10.k), entrees, echo); } catch (e) { return { error: String(e.message || e) }; }
  };
  const erreur = r => r.stopped ? 'Arrêté : le programme tournait trop longtemps (boucle sans fin ?).' : (window.PYTHON ? (x => x ? x.text : r.error)(window.PYTHON.explain(r.error)) : r.error);
  const out = document.getElementById('pyout'), res10 = document.getElementById('pyres');
  document.getElementById('pyRun').onclick = async ev => {
    const b = ev.currentTarget; b.disabled = true;
    out.textContent = 'Exécution… (la première fois, Python met quelques secondes à se charger)';
    const r = await executer(document.getElementById('pyin').value.split('\n').filter(x => x !== ''), true);
    out.textContent = (r.out || '') + (r.error || r.stopped ? (r.out ? '\n' : '') + '⚠ ' + erreur(r) : (r.out ? '' : '(Le programme n’affiche rien.)'));
    b.disabled = false;
  };
  document.getElementById('pyCheck').onclick = async ev => {
    const b = ev.currentTarget; b.disabled = true; res10.className = 'res'; res10.textContent = 'Vérification…';
    let bons = 0; const lignes = [];
    for (const t of PY10.tests) {
      const r = await executer(t.in, false);
      const sortie = (r.out || '').split('\n').map(x => x.trim()).filter(Boolean), der = sortie[sortie.length - 1] || '';
      const ok = !r.error && !r.stopped && new RegExp('(^|[^0-9.-])' + t.fin + '(\\.0)?([^0-9]|$)').test(der);
      if (ok) bons++;
      lignes.push(`${ok ? '✓' : '✗'} ${t.in[0]} personne${t.in[0] === '1' ? '' : 's'} (${t.in.slice(1).join(', ')} ans) : ${ok ? 'juste' : r.error || r.stopped ? erreur(r) : `attendu ${t.fin}, ton programme affiche « ${sortie.join(' / ') || 'rien'} »`}`);
    }
    out.textContent = lignes.join('\n');
    res10.className = 'res ' + (bons === PY10.tests.length ? 'bon' : 'pas');
    res10.textContent = bons === PY10.tests.length ? `Bravo : ${bons} / ${bons} tests réussis !` : `${bons} / ${PY10.tests.length} tests réussis. Corrige et vérifie encore.`;
    b.disabled = false;
  };
  if (window.PYTHON) window.PYTHON.prepare().catch(() => {});
})();

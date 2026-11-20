import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm';
// ?reprise=1 : the make-up version for absent students (the teacher authorizes each student).
const {EXAMEN, LETTRES} = await import(new URLSearchParams(location.search).has('reprise') ? './questions-reprise.js' : './questions.js');
/* Locked summative test, student side.
   - The test only runs in full screen. Leaving it (Esc, other tab, other window, reload, closing) blocks the test
     on the server; only the teacher can unlock it from the follow-up page (suivi.html).
   - Answers are saved on the server while the student works, and kept when the test is blocked.
   - The answer key never reaches this page: multiple choice and ordering are marked by the server on submission. */
const URL_SB = 'https://dcnfxwtszqeqfaxlbfbl.supabase.co', KEY = 'sb_publishable_UTy7pKbk6xnw6mjRoy08GQ_5OuU1ymE';
const db = createClient(URL_SB, KEY);
const app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const RETOUR = '<a href="../site.html#unite-5">← Retour au site TEJ2O</a>';

let etat = 'chargement';          // chargement | accueil | examen | bloquee | soumise | fermee | apercu
let classe = null, nom = '', jeton = null;
let rep = {qcm: {}, ordre: {}, ecrit: {}};
let minuterie = null, sondage = null, enCoursEnvoi = false;

db.auth.onAuthStateChange((_e, s) => { jeton = s?.access_token || jeton; });

function ecran(html) { app.innerHTML = `<div class="ecran">${html}</div>`; }

/* ---------- Rendering the questions ---------- */
function rendreQuestion(q, lecture) {
  let h = `<div class="question card" id="q${q.n}"><p class="enonce">${q.n}. ${esc(q.texte)}</p>`;
  if (q.code) h += `<pre class="algo">${esc(q.code)}</pre>`;
  if (q.type === 'qcm') {
    h += `<div class="choix">${q.opts.map((o, j) => `<label><input type="radio" name="q${q.n}" value="${LETTRES[j]}" ${rep.qcm[q.n] === LETTRES[j] ? 'checked' : ''} ${lecture ? 'disabled' : ''}><b>${LETTRES[j]})</b><span>${esc(o)}</span></label>`).join('')}</div>`;
  } else if (q.type === 'ordre') {
    const choisi = rep.ordre[q.n] || [];
    const liste = q.etapes.map((e, j) => `<tr><td><b>${LETTRES[j]})</b> <code>${esc(e)}</code></td><td>${j + 1}</td><td><input class="lettre" data-ordre="${q.n}" data-rang="${j}" maxlength="1" autocomplete="off" aria-label="Lettre de l’étape au rang ${j + 1}" value="${esc(choisi[j] || '')}" ${lecture ? 'readonly' : ''}></td></tr>`).join('');
    h += `<table class="ordre"><thead><tr><th>Les étapes (dans le désordre)</th><th>Rang</th><th>Lettre</th></tr></thead><tbody>${liste}</tbody></table>`;
  } else if (q.type === 'pseudo') {
    h += `<textarea class="code" data-ecrit="${q.n}" spellcheck="false" aria-label="Ton algorithme en pseudocode" placeholder="Écris ton algorithme ici…" ${lecture ? 'readonly' : ''}>${esc(rep.ecrit[q.n] || '')}</textarea>`;
  } else if (q.type === 'python') {
    h += `<div class="py-grille"><div><textarea class="code" data-ecrit="${q.n}" spellcheck="false" aria-label="Ton programme Python" placeholder="# Écris ton programme Python ici" ${lecture ? 'readonly' : ''}>${esc(rep.ecrit[q.n] || '')}</textarea>
      <div class="outils"><button type="button" data-executer="${q.n}">▶ Exécuter</button><span class="small">Teste ton programme : ce qu’il affiche apparaît en dessous.</span></div>
      <pre class="sortie" id="sortie${q.n}">Clique sur ▶ Exécuter pour voir ce que ton programme affiche.</pre></div>
      <div><label class="small" for="entrees${q.n}">Entrées pour tester (une réponse par ligne, utilisées par input) :</label><textarea class="entrees" id="entrees${q.n}">${esc(q.exemple || '')}</textarea></div></div>`;
  }
  return h + '</div>';
}

function rendreExamen(lecture) {
  const parties = EXAMEN.parties.map(p => `<section class="partie"><h2><span class="n">${p.id}</span>${esc(p.titre)}</h2><p class="consigne">${esc(p.consigne)}</p>${p.questions.map(q => rendreQuestion(q, lecture)).join('')}</section>`).join('');
  app.innerHTML = `<div class="entete"><span><b>Évaluation sommative</b> · ${esc(EXAMEN.titre)} · ${esc(nom)}</span><span class="etat" id="etatSauvegarde">${lecture ? 'Aperçu enseignante : rien n’est enregistré.' : 'Réponses enregistrées automatiquement.'}</span></div>
    <div class="card"><h3>Consignes</h3><ul>${EXAMEN.consignes.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>
    ${parties}
    <div class="fin"><span class="small" id="resteRep"></span>${lecture ? RETOUR : '<button type="button" class="grand" id="envoyer">Envoyer ma sommative</button>'}</div>`;
  brancherChamps(lecture);
  compterReponses();
}

const QUESTIONS = EXAMEN.parties.flatMap(p => p.questions);
function nbSansReponse() {
  return QUESTIONS.filter(q => q.type === 'qcm' ? !rep.qcm[q.n] : q.type === 'ordre' ? (rep.ordre[q.n] || []).filter(Boolean).length < q.etapes.length : !(rep.ecrit[q.n] || '').trim()).length;
}
function compterReponses() {
  const n = nbSansReponse(), el = document.getElementById('resteRep');
  if (el) el.textContent = n ? `${n} question${n > 1 ? 's' : ''} sans réponse complète.` : 'Toutes les questions ont une réponse.';
}

function brancherChamps(lecture) {
  app.querySelectorAll('input[type=radio]').forEach(r => r.onchange = () => { rep.qcm[r.name.slice(1)] = r.value; modifie(); });
  // Ordering: one letter per rank (a text box rather than a drop-down list, whose pop-up could count as leaving the page).
  app.querySelectorAll('input[data-ordre]').forEach(s => s.oninput = () => {
    const n = s.dataset.ordre, max = LETTRES[QUESTIONS.find(q => q.n == n).etapes.length - 1];
    let v = s.value.toUpperCase().replace(/[^A-I]/g, ''); if (v > max) v = '';
    s.value = v; const a = rep.ordre[n] || []; a[+s.dataset.rang] = v; rep.ordre[n] = a; modifie();
  });
  app.querySelectorAll('textarea[data-ecrit]').forEach(t => {
    t.oninput = () => { rep.ecrit[t.dataset.ecrit] = t.value; modifie(); };
    t.onkeydown = e => tabulation(e, t);
  });
  app.querySelectorAll('textarea.entrees').forEach(t => t.onkeydown = e => tabulation(e, t));
  app.querySelectorAll('[data-executer]').forEach(b => b.onclick = () => executer(b.dataset.executer, b));
  const env = document.getElementById('envoyer'); if (env) env.onclick = confirmerEnvoi;
  if (lecture) return;
}

// Tab inserts 4 spaces in the code boxes (the indentation used in the course).
function tabulation(e, t) {
  if (e.key !== 'Tab' || t.readOnly) return;
  e.preventDefault();
  const d = t.selectionStart, f = t.selectionEnd;
  t.value = t.value.slice(0, d) + '    ' + t.value.slice(f);
  t.selectionStart = t.selectionEnd = d + 4;
  t.dispatchEvent(new Event('input'));
}

async function executer(n, bouton) {
  const sortie = document.getElementById('sortie' + n);
  const code = rep.ecrit[n] || '';
  const entrees = (document.getElementById('entrees' + n).value || '').split('\n').filter(x => x !== '');
  if (!window.PYTHON) { sortie.textContent = 'Python n’a pas pu être chargé. Vérifie Internet.'; return; }
  bouton.disabled = true; sortie.className = 'sortie'; sortie.textContent = 'Exécution…';
  try {
    const r = await window.PYTHON.run(code, entrees, true);
    if (r.stopped) { sortie.className = 'sortie err'; sortie.textContent = (r.out || '') + '\nLe programme a été arrêté : il tournait trop longtemps (boucle sans fin ?).'; }
    else if (r.error) { const x = window.PYTHON.explain(r.error); sortie.className = 'sortie err'; sortie.textContent = (r.out || '') + (r.out ? '\n' : '') + '⚠ ' + (x.line ? 'Ligne ' + x.line + ' : ' : '') + (x.text || r.error); }
    else sortie.textContent = r.out || '(Le programme n’affiche rien.)';
  } catch (e) { sortie.className = 'sortie err'; sortie.textContent = 'Impossible d’exécuter : ' + (e.message || e); }
  bouton.disabled = false;
}

/* ---------- Saving ---------- */
function etatSauvegarde(t, cls) { const el = document.getElementById('etatSauvegarde'); if (el) { el.textContent = t; el.className = 'etat ' + (cls || ''); } }
function modifie() {
  compterReponses();
  if (etat !== 'examen') return;
  etatSauvegarde('Modifications non enregistrées…');
  clearTimeout(minuterie); minuterie = setTimeout(sauver, 1500);
}
async function sauver() {
  if (etat !== 'examen') return;
  const {data, error} = await db.rpc('tej2o_exam_save', {p_class: classe, p_exam: EXAMEN.id, p_answers: rep});
  if (error) { etatSauvegarde('⚠ Pas enregistré (connexion ?). Nouvel essai dans quelques secondes.', 'ko'); clearTimeout(minuterie); minuterie = setTimeout(sauver, 5000); return; }
  if (data === 'en_cours') etatSauvegarde('✓ Réponses enregistrées.', 'ok');
  else versEtat(data);
}

/* ---------- Locking ---------- */
// Sent with keepalive so that it reaches the server even when the page is being closed or reloaded.
function bloquer(raison) {
  if (etat !== 'examen' || enCoursEnvoi) return;
  etat = 'bloquee';
  clearTimeout(minuterie);
  try {
    fetch(URL_SB + '/rest/v1/rpc/tej2o_exam_block', {method: 'POST', keepalive: true,
      headers: {apikey: KEY, Authorization: 'Bearer ' + jeton, 'Content-Type': 'application/json'},
      body: JSON.stringify({p_class: classe, p_exam: EXAMEN.id, p_answers: rep, p_reason: raison})});
  } catch (e) { /* the page is closing */ }
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  afficherBloquee();
}
function surveiller() {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') bloquer('onglet ou fenêtre'); });
  window.addEventListener('blur', () => { if (etat === 'examen') setTimeout(() => { if (!document.hasFocus()) bloquer('autre fenêtre'); }, 150); });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) bloquer('sortie du plein écran'); });
  window.addEventListener('pagehide', () => bloquer('page fermée ou rechargée'));
  document.addEventListener('contextmenu', e => { if (etat === 'examen') e.preventDefault(); });
}

function afficherBloquee() {
  ecran(`<div class="alerte"><h1>🔒 Ta sommative est bloquée</h1><p>Tu es sorti de la sommative (plein écran, onglet ou fenêtre). Tes réponses sont gardées.</p><p><b>Lève la main : seule ton enseignante peut la débloquer.</b></p><p class="small">Cette page se mettra à jour toute seule quand elle sera débloquée.</p></div>`);
  clearInterval(sondage);
  sondage = setInterval(async () => {
    const {data} = await db.from('tej2o_exams').select('status').eq('class_id', classe).eq('exam_id', EXAMEN.id).maybeSingle();
    if (data && data.status !== 'bloquee') { clearInterval(sondage); versEtat(data.status); }
  }, 4000);
}

/* ---------- Screens ---------- */
function afficherAccueil(reprise) {
  ecran(`<div class="card"><h1>${reprise ? 'Ta sommative est débloquée' : 'Évaluation sommative'}</h1><p><b>${esc(EXAMEN.titre)}</b> · durée prévue : ${EXAMEN.duree} minutes · ${esc(nom)}</p>
    <h3>Avant de commencer</h3><ul class="regles">
    <li>La sommative se fait <b>en plein écran</b>.</li>
    <li>Si tu sors du plein écran, changes d’onglet ou de fenêtre, ou fermes la page, <b>ta sommative est bloquée</b>. Seule ton enseignante peut la débloquer.</li>
    <li>Tes réponses sont <b>enregistrées automatiquement</b>, même si la sommative est bloquée.</li>
    <li>Pour les questions Python, utilise <b>▶ Exécuter</b> pour tester ton programme : tu restes dans la sommative.</li>
    <li>Quand tu as fini, clique sur <b>Envoyer ma sommative</b>. Après l’envoi, tu ne peux plus la modifier.</li></ul>
    <p style="text-align:center"><button type="button" class="grand" id="commencer">${reprise ? 'Reprendre en plein écran' : 'Commencer en plein écran'}</button></p>
    <p class="small" id="msgPlein"></p></div>`);
  document.getElementById('commencer').onclick = async () => {
    try { await document.documentElement.requestFullscreen(); }
    catch (e) { document.getElementById('msgPlein').textContent = 'Le plein écran a été refusé par le navigateur. Réessaie, ou demande de l’aide à ton enseignante.'; return; }
    etat = 'examen';
    rendreExamen(false);
    window.scrollTo(0, 0);
  };
}

function confirmerEnvoi() {
  const n = nbSansReponse();
  const v = document.createElement('div'); v.className = 'voile';
  v.innerHTML = `<div class="card"><h2>Envoyer ta sommative ?</h2>${n ? `<p><b>${n} question${n > 1 ? 's' : ''} n’${n > 1 ? 'ont' : 'a'} pas de réponse complète.</b></p>` : '<p>Toutes les questions ont une réponse.</p>'}<p>Après l’envoi, tu ne pourras plus modifier tes réponses.</p><div class="outils"><button type="button" id="ouiEnvoyer">Oui, envoyer</button><button type="button" class="secondaire" id="nonEnvoyer">Non, je continue</button></div><p class="small" id="msgEnvoi"></p></div>`;
  document.body.append(v);
  v.querySelector('#nonEnvoyer').onclick = () => v.remove();
  v.querySelector('#ouiEnvoyer').onclick = async () => {
    v.querySelector('#ouiEnvoyer').disabled = true;
    const {data, error} = await db.rpc('tej2o_exam_submit', {p_class: classe, p_exam: EXAMEN.id, p_answers: rep});
    if (error) { v.querySelector('#msgEnvoi').textContent = '⚠ Pas envoyé : ' + error.message + ' Réessaie.'; v.querySelector('#ouiEnvoyer').disabled = false; return; }
    v.remove();
    versEtat(data);
  };
}

function versEtat(st) {
  clearTimeout(minuterie);
  if (st === 'soumise') {
    enCoursEnvoi = true; etat = 'soumise';
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    ecran(`<div class="card"><h1>✓ Sommative envoyée</h1><p>Merci ! Ta sommative est bien arrivée. Ton enseignante la corrigera.</p><p>${RETOUR}</p></div>`);
  } else if (st === 'bloquee') { etat = 'bloquee'; afficherBloquee(); }
  else if (st === 'fermee') {
    etat = 'fermee'; enCoursEnvoi = true;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    ecran(`<div class="card"><h1>Sommative fermée</h1><p>Ton enseignante a fermé la sommative. Tes dernières réponses enregistrées sont gardées.</p><p>${RETOUR}</p></div>`);
  } else if (st === 'en_cours') { etat = 'accueil'; afficherAccueil(true); }
}

/* ---------- Start ---------- */
async function demarrer() {
  const {data: {session}} = await db.auth.getSession();
  jeton = session?.access_token;
  if (!session) { ecran(`<div class="card"><h1>Connexion</h1><p>Connecte-toi avec ton prénom, ton nom et ton mot de passe, puis reviens à la sommative.</p><p><a href="../index.html">Aller à la connexion</a></p></div>`); return; }
  const {data: me, error} = await db.rpc('tej2o_me');
  if (error || !me?.role) { ecran(`<div class="card"><h1>Accès</h1><p>Impossible de vérifier ton compte${error ? ' : ' + esc(error.message) : ''}.</p><p>${RETOUR}</p></div>`); return; }
  nom = [me.first_name, me.last_name].filter(Boolean).join(' ');
  if (me.role === 'teacher') { etat = 'apercu'; rendreExamen(true); return; }
  const ids = (me.classes || []).map(c => c.id);
  const [{data: pubs}, {data: miennes}] = await Promise.all([
    db.from('tej2o_releases').select('class_id').eq('activity_id', EXAMEN.id).in('class_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']),
    db.from('tej2o_exams').select('class_id,status').eq('exam_id', EXAMEN.id)
  ]);
  classe = (miennes || [])[0]?.class_id || (pubs || [])[0]?.class_id || null;
  if (!classe) { ecran(`<div class="card"><h1>Pas encore ouverte</h1><p>La sommative n’est pas encore ouverte pour ta classe. Attends la consigne de ton enseignante.</p><p>${RETOUR}</p></div>`); return; }
  const {data: d, error: e2} = await db.rpc('tej2o_exam_start', {p_class: classe, p_exam: EXAMEN.id});
  if (e2) { ecran(`<div class="card"><h1>Sommative</h1><p>${esc(e2.message)}</p><p>${RETOUR}</p></div>`); return; }
  rep = Object.assign({qcm: {}, ordre: {}, ecrit: {}}, d.answers || {});
  if (window.PYTHON) window.PYTHON.prepare().catch(() => {});
  surveiller();
  if (d.status === 'en_cours' && !d.open) versEtat('fermee');
  else if (d.status === 'en_cours') { etat = 'accueil'; afficherAccueil(false); }
  else versEtat(d.status);
}
demarrer().catch(e => ecran(`<div class="card"><h1>Erreur</h1><p>${esc(e.message || e)}</p><p>${RETOUR}</p></div>`));

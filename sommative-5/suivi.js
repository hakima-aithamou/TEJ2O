import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm';
const PARAM_EXAM = new URLSearchParams(location.search).get('exam');
// ?exam=sommative5r : the make-up summative (absent students), authorized student by student.
const {EXAMEN: SOMMATIVE, LETTRES} = await import(PARAM_EXAM === 'sommative5r' ? './questions-reprise.js' : './questions.js');
const REPRISE = SOMMATIVE.id === 'sommative5r';
/* Teacher follow-up of the locked summative test:
   open / close it for a class, see live who is working, blocked or done, unlock, reopen for one student,
   and read each copy with the automatic marking (multiple choice, ordering, Python tests). */
const URL_SB = 'https://dcnfxwtszqeqfaxlbfbl.supabase.co', KEY = 'sb_publishable_UTy7pKbk6xnw6mjRoy08GQ_5OuU1ymE';
const FN_A = URL_SB + '/functions/v1/assiduite';
const db = createClient(URL_SB, KEY);
const app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
// ?exam=formative5 : the formative used as a rehearsal in locked mode (no copy view: its answers stay in the page).
const FORMATIVE = {id: 'formative5', titre: 'Formative de l’unité 5 en mode examen (répétition)', duree: 60, parties: [], repetition: true};
const EXAMEN = PARAM_EXAM === 'formative5' ? FORMATIVE : SOMMATIVE;
const QUESTIONS = EXAMEN.parties.flatMap(p => p.questions);
let T = null, classe = new URLSearchParams(location.search).get('classe'), copies = [], rel = null, cle = null, ouverte = null, sondage = null;

async function api(body) {
  const {data: {session}} = await db.auth.getSession();
  const r = await fetch(FN_A, {method: 'POST', headers: {'content-type': 'application/json', apikey: KEY, authorization: 'Bearer ' + session.access_token}, body: JSON.stringify(body)});
  const d = await r.json().catch(() => ({error: 'Réponse illisible du serveur.'}));
  if (!r.ok || d.error) throw new Error(d.error || 'Action impossible.');
  return d;
}
const heure = t => t ? new Date(t).toLocaleTimeString('fr-CA', {hour: '2-digit', minute: '2-digit'}) : '';
const eleves = () => {
  const ids = new Set(T.members.filter(m => m.class_id === classe).map(m => m.student_id));
  return T.students.filter(s => ids.has(s.id)).sort((a, b) => (a.last_name + a.first_name).localeCompare(b.last_name + b.first_name, 'fr'));
};
const nomDe = id => { const s = T.students.find(x => x.id === id); return s ? s.first_name + ' ' + s.last_name : 'Élève'; };
function message(t, ok) { const m = document.getElementById('msg'); if (m) { m.textContent = t; m.className = 'etat ' + (ok ? 'ok' : 'ko'); } }

async function charger() {
  const [{data: c, error: e1}, {data: r, error: e2}] = await Promise.all([
    db.from('tej2o_exams').select('*').eq('class_id', classe).eq('exam_id', EXAMEN.id),
    db.from('tej2o_releases').select('enabled,available_at').eq('class_id', classe).eq('activity_id', EXAMEN.id).maybeSingle()]);
  if (e1 || e2) throw (e1 || e2);
  copies = c || []; rel = r;
  // Rehearsal: the answer key of the formative is published for the whole class ("corrige" + id).
  if (EXAMEN.repetition) {
    const {data: k} = await db.from('tej2o_releases').select('enabled').eq('class_id', classe).eq('activity_id', 'corrige' + EXAMEN.id).maybeSingle();
    corrigeOuvert = !!(k && k.enabled);
  }
}
let corrigeOuvert = false;

function autoTexte(a) {
  if (!a || EXAMEN.repetition) return '';
  return `A–B : ${a.qcm}/${a.qcm_total} · C14 : ${a.ordre_14}/${a.ordre_14_total} · C15 : ${a.ordre_15}/${a.ordre_15_total}`;
}

function afficher() {
  const ouvert = !!(rel && rel.enabled && (!rel.available_at || new Date(rel.available_at) <= new Date()));
  const lignes = eleves().map(s => {
    const c = copies.find(x => x.student_id === s.id);
    // A row created only by an authorization (no answer, no exit yet) is shown as "not started".
    const autorise = c && c.status === 'en_cours' && c.exception && !c.exits && !Object.keys(c.answers || {}).length;
    const st = !c || autorise ? 'aucune' : c.status;
    const lib = autorise ? 'Pas commencée' : {aucune: 'Pas commencée', en_cours: 'En cours', bloquee: '🔒 Bloquée', soumise: EXAMEN.repetition ? '✓ Terminée' : '✓ Envoyée'}[st];
    const dernier = c && c.exit_log.length ? c.exit_log[c.exit_log.length - 1] : null;
    const sorties = c ? `${c.exits}${dernier ? ` <span class="small">(dernière : ${heure(dernier.t)}, ${esc(dernier.raison)})</span>` : ''}` : '';
    const actions = [
      st === 'bloquee' ? `<button data-debloquer="${s.id}">Débloquer</button>` : '',
      !EXAMEN.repetition && (st === 'soumise' || (c && st !== 'aucune')) ? `<button class="secondaire" data-voir="${s.id}">Voir la copie</button>` : '',
      !ouvert && st !== 'soumise' ? `<button class="secondaire" data-exception="${s.id}" data-on="${c && c.exception ? 0 : 1}">${REPRISE ? (c && c.exception ? 'Retirer l’autorisation' : '✓ Autoriser la reprise') : (c && c.exception ? 'Retirer la reprise' : 'Rouvrir pour cet élève')}</button>` : ''
    ].join(' ');
    return `<tr><td>${esc(s.first_name)} ${esc(s.last_name)}</td><td><span class="st ${st}">${lib}</span>${c && c.exception ? ' <span class="small">reprise permise</span>' : ''}</td><td>${sorties}</td><td>${c && c.status === 'soumise' ? autoTexte(c.auto) + ` <span class="small">${heure(c.submitted_at)}</span>` : ''}</td><td>${actions}</td></tr>`;
  }).join('');
  const nb = st => copies.filter(c => c.status === st).length;
  const tab = document.getElementById('tableau');
  tab.innerHTML = `<div class="intro"><div><h1>${EXAMEN.repetition ? 'Répétition : formative en mode examen' : REPRISE ? 'Sommative de reprise (élèves absents)' : 'Suivi de la sommative'}</h1>${REPRISE ? '<p class="small">Laisse la sommative fermée et clique sur « ✓ Autoriser la reprise » pour chaque élève absent : lui seul pourra la faire.</p>' : ''}<p class="small">${esc(EXAMEN.titre)} · ${EXAMEN.duree} minutes · page mise à jour toutes les 5 secondes</p></div></div>
    <div class="card"><div class="outils" style="flex-wrap:wrap">
      <label>Classe : <select id="classe">${T.classes.map(c => `<option value="${c.id}" ${c.id === classe ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <span class="st ${ouvert ? 'en_cours' : 'aucune'}">${ouvert ? 'Ouverte' : 'Fermée'}${EXAMEN.repetition ? ' en mode examen' : ''}</span>
      <button id="basculer">${EXAMEN.repetition ? (ouvert ? 'Fermer le mode examen' : 'Ouvrir en mode examen') : (ouvert ? 'Fermer la sommative' : 'Ouvrir la sommative')}</button>
      ${EXAMEN.repetition ? '<a href="../formative-5/index.html" target="_blank" rel="noopener" style="color:var(--gold)">Voir la formative ↗</a>' : '<a href="index.html' + (REPRISE ? '?reprise=1' : '') + '" target="_blank" rel="noopener" style="color:var(--gold)">Aperçu des questions ↗</a> <a href="' + (REPRISE ? 'sommative-unite5-reprise.pdf' : 'sommative-unite5.pdf') + '" target="_blank" rel="noopener" style="color:var(--gold)">🖨 Version imprimable (PDF) ↗</a>\n      <button class="secondaire" id="exporter">⬇ Exporter les copies (CSV)</button>'}
      ${EXAMEN.repetition ? `<button class="secondaire" id="corrige">${corrigeOuvert ? '📖 Corrigé publié — le retirer' : '📖 Publier le corrigé'}</button>` : ''}
      <span id="msg" class="etat"></span></div>
      <p class="small">En cours : ${nb('en_cours')} · Bloquées : ${nb('bloquee')} · Envoyées : ${nb('soumise')} · Élèves : ${eleves().length}</p></div>
    <table class="suivi"><thead><tr><th>Élève</th><th>État</th><th>Sorties</th><th>Correction automatique</th><th>Actions</th></tr></thead><tbody>${lignes || '<tr><td colspan="5">Aucun élève dans cette classe.</td></tr>'}</tbody></table>`;
  document.getElementById('classe').onchange = e => { classe = e.target.value; ouvreCopie = null; document.getElementById('copie').innerHTML = ''; history.replaceState(null, '', '?' + (PARAM_EXAM ? 'exam=' + PARAM_EXAM + '&' : '') + 'classe=' + classe); rafraichir(); };
  document.getElementById('basculer').onclick = () => basculer(!ouvert);
  if (document.getElementById('exporter')) document.getElementById('exporter').onclick = exporter;
  if (document.getElementById('corrige')) document.getElementById('corrige').onclick = async () => {
    const {error} = await db.from('tej2o_releases').upsert({class_id: classe, activity_id: 'corrige' + EXAMEN.id, enabled: !corrigeOuvert, available_at: null}, {onConflict: 'class_id,activity_id'});
    if (error) message('Impossible : ' + error.message); else { message(corrigeOuvert ? 'Corrigé retiré.' : 'Corrigé publié : les élèves qui ont terminé peuvent le voir.', true); rafraichir(); }
  };
  tab.querySelectorAll('[data-debloquer]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    const {error} = await db.rpc('tej2o_exam_unlock', {p_class: classe, p_student: b.dataset.debloquer, p_exam: EXAMEN.id});
    if (error) message('Impossible : ' + error.message); else { message(nomDe(b.dataset.debloquer) + ' peut reprendre.', true); rafraichir(); }
  });
  tab.querySelectorAll('[data-exception]').forEach(b => b.onclick = async () => {
    const {error} = await db.rpc('tej2o_exam_exception', {p_class: classe, p_student: b.dataset.exception, p_exam: EXAMEN.id, p_on: b.dataset.on === '1'});
    if (error) message('Impossible : ' + error.message); else rafraichir();
  });
  tab.querySelectorAll('[data-voir]').forEach(b => b.onclick = () => voirCopie(b.dataset.voir));
}

async function basculer(on) {
  const {error} = await db.from('tej2o_releases').upsert({class_id: classe, activity_id: EXAMEN.id, enabled: on, available_at: null}, {onConflict: 'class_id,activity_id'});
  if (error) message('Impossible : ' + error.message); else rafraichir();
}

/* ---------- One student's copy ---------- */
let ouvreCopie = null;
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
function testReussi(sortie, attendu) {
  const lignes = String(sortie || '').split('\n').map(x => x.trim()).filter(Boolean);
  const der = norm(lignes[lignes.length - 1] || '');
  return /^\d+$/.test(attendu) ? new RegExp('(^|[^0-9])' + attendu + '([^0-9]|$)').test(der) : der.includes(norm(attendu));
}

async function voirCopie(id, silencieux) {
  ouvreCopie = id;
  const c = copies.find(x => x.student_id === id); if (!c) return;
  if (!cle) { const {data, error} = await db.rpc('tej2o_exam_key', {p_exam: EXAMEN.id}); if (error) { message('Corrigé illisible : ' + error.message); return; } cle = data; }
  const r = Object.assign({qcm: {}, ordre: {}, ecrit: {}}, c.answers);
  let h = `<div class="card copie"><div class="outils" style="justify-content:space-between"><h2 style="margin:0">Copie de ${esc(nomDe(id))}</h2><button class="secondaire" id="fermerCopie">Fermer la copie</button></div>
    <p class="small">${{en_cours: 'En cours', bloquee: 'Bloquée', soumise: 'Envoyée à ' + heure(c.submitted_at)}[c.status]} · sorties : ${c.exits} · déblocages : ${c.unlocks}</p>`;
  for (const p of EXAMEN.parties) {
    h += `<h3 style="margin-top:18px">Partie ${p.id} — ${esc(p.titre)}</h3>`;
    for (const q of p.questions) {
      if (q.type === 'qcm') {
        const donne = r.qcm[q.n], bon = cle.qcm[q.n];
        h += `<p><b>${q.n}.</b> ${esc(q.texte)}<br>Réponse : <span class="${donne === bon ? 'bon' : 'faux'}">${donne ? donne + ') ' + esc(q.opts[LETTRES.indexOf(donne)]) : '(aucune)'} ${donne === bon ? '✓' : '✗'}</span>${donne === bon ? '' : ` · bonne réponse : <b>${bon}) ${esc(q.opts[LETTRES.indexOf(bon)])}</b>`}<br><span class="small">${esc(cle.why[q.n] || '')}</span></p>`;
      } else if (q.type === 'ordre') {
        const donne = r.ordre[q.n] || [], bons = cle.ordre[q.n];
        const meilleur = bons.reduce((m, o) => { const n = o.filter((x, i) => x === donne[i]).length; return n > m.n ? {n, o} : m; }, {n: -1, o: bons[0]});
        h += `<p><b>${q.n}.</b> ${esc(q.texte)}<br>Ordre donné : ${q.etapes.map((_, i) => `<span class="${donne[i] === meilleur.o[i] ? 'bon' : 'faux'}">${donne[i] || '—'}</span>`).join(', ')} · ${meilleur.n}/${q.etapes.length}<br><span class="small">${esc(cle.ordre_note[q.n])}</span></p>`;
      } else {
        const e = cle.ecrit[q.n], txt = r.ecrit[q.n] || '';
        h += `<div style="margin:12px 0"><p><b>${q.n}.</b> ${esc(q.texte)}</p><div class="py-grille"><div><p class="small">Réponse de l’élève :</p><pre class="algo">${esc(txt) || '(vide)'}</pre>`;
        if (q.type === 'python') h += `<div class="outils"><button data-tests="${q.n}">▶ Lancer les tests</button></div><ul class="tests" id="tests${q.n}"></ul>`;
        h += `</div><div><p class="small">Modèle :</p><pre class="algo">${esc(e.modele)}</pre><div class="verif"><p class="small"><b>À vérifier :</b></p>${e.verif.map(v => `<label><input type="checkbox"> ${esc(v)}</label>`).join('')}</div></div></div></div>`;
      }
    }
  }
  if (c.auto) h += `<p><b>Correction automatique :</b> ${autoTexte(c.auto)}. Les questions 16 à 18 sont à corriger avec le modèle et la grille.</p>`;
  h += '</div>';
  const zone = document.getElementById('copie'); zone.innerHTML = h;
  document.getElementById('fermerCopie').onclick = () => { ouvreCopie = null; zone.innerHTML = ''; };
  zone.querySelectorAll('[data-tests]').forEach(b => b.onclick = () => lancerTests(b.dataset.tests, r.ecrit[b.dataset.tests] || '', b));
  if (!silencieux) zone.scrollIntoView({behavior: 'smooth'});
}

async function lancerTests(n, code, bouton) {
  const ul = document.getElementById('tests' + n);
  if (!window.PYTHON) { ul.innerHTML = '<li>Python n’a pas pu être chargé.</li>'; return; }
  bouton.disabled = true; ul.innerHTML = '<li>Chargement de Python et exécution…</li>';
  const res = [];
  for (const t of cle.ecrit[n].tests) {
    let r; try { r = await window.PYTHON.run(code, t.in, false); } catch (e) { r = {error: String(e.message || e)}; }
    const ok = !r.error && !r.stopped && testReussi(r.out, t.attendu);
    res.push(`<li class="${ok ? 'bon' : 'faux'}">${ok ? '✓' : '✗'} entrées ${esc(t.in.join(', '))} → attendu « ${esc(t.attendu)} » ; affiché : « ${esc((r.out || '').trim().split('\n').pop() || '')} »${r.error ? ' — erreur : ' + esc(window.PYTHON.explain(r.error).text || r.error) : ''}${r.stopped ? ' — arrêté (trop long)' : ''}</li>`);
  }
  const nb = res.filter(x => x.includes('class="bon"')).length;
  ul.innerHTML = res.join('') + `<li><b>${nb}/${res.length} tests réussis</b></li>`;
  bouton.disabled = false;
}

/* ---------- CSV export of all copies ---------- */
function exporter() {
  const cel = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const tete = ['Élève', 'État', 'Sorties', 'A-B (sur 13)', 'C14 (sur 6)', 'C15 (sur 9)', ...QUESTIONS.filter(q => q.type === 'qcm').map(q => 'Q' + q.n), 'Q14', 'Q15', 'Q16 pseudocode', 'Q17 Python', 'Q18 Python'];
  const lignes = eleves().map(s => {
    const c = copies.find(x => x.student_id === s.id); const r = Object.assign({qcm: {}, ordre: {}, ecrit: {}}, c?.answers); const a = c?.auto || {};
    return [s.first_name + ' ' + s.last_name, c ? c.status : 'pas commencée', c?.exits ?? '', a.qcm ?? '', a.ordre_14 ?? '', a.ordre_15 ?? '',
      ...QUESTIONS.filter(q => q.type === 'qcm').map(q => r.qcm[q.n] || ''), (r.ordre[14] || []).join(''), (r.ordre[15] || []).join(''), r.ecrit[16] || '', r.ecrit[17] || '', r.ecrit[18] || ''].map(cel).join(';');
  });
  const blob = new Blob(['﻿' + [tete.map(cel).join(';'), ...lignes].join('\r\n')], {type: 'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = (REPRISE ? 'sommative-reprise-unite5-' : 'sommative-unite5-') + (T.classes.find(c => c.id === classe)?.name || 'classe').replace(/[^\w-]+/g, '_') + '.csv';
  document.body.append(a); a.click(); a.remove();
}

async function rafraichir() {
  try { await charger(); afficher(); } catch (e) { message('Erreur : ' + (e.message || e)); }
}

async function demarrer() {
  const {data: {session}} = await db.auth.getSession();
  if (!session) { app.innerHTML = '<div class="card"><p>Connecte-toi avec ton compte enseignante, puis rouvre cette page.</p><p><a href="../index.html" style="color:var(--gold)">Aller à la connexion</a></p></div>'; return; }
  const {data: me} = await db.rpc('tej2o_me');
  if (me?.role !== 'teacher') { app.innerHTML = '<div class="card"><p>Cette page est réservée à l’enseignante.</p></div>'; return; }
  T = await api({action: 'participation_teacher'});
  const {data: hid} = await db.from('tej2o_hidden_classes').select('class_id');
  const masquees = new Set((hid || []).map(h => h.class_id));
  T.classes = (T.classes || []).filter(c => !masquees.has(c.id));
  if (!classe || !T.classes.some(c => c.id === classe)) classe = T.classes[0]?.id;
  if (!classe) { app.innerHTML = '<div class="card"><p>Aucune classe.</p></div>'; return; }
  app.innerHTML = '<div id="tableau"></div><div id="copie"></div>';
  await rafraichir();
  // Live view: only the table is redrawn, so an open copy keeps its ticks and test results.
  sondage = setInterval(rafraichir, 5000);
}
demarrer().catch(e => { app.innerHTML = `<div class="card"><p>Erreur : ${esc(e.message || e)}</p></div>`; });

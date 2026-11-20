import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm';
/* Locked mode for an existing activity page (used by the unit 5 formative as a rehearsal of the summative).
   Usage: <script type="module" src="../sommative-5/verrou.js?exam=formative5&cle=tej2o-formative5"></script>
   When the teacher opens the activity in locked mode for the class (release "formative5"), the student must work
   in full screen; leaving it blocks the activity until the teacher unlocks it from sommative-5/suivi.html.
   The answers kept by the page in this browser (localStorage key "cle") are sent with each block and at the end.
   When the locked mode is not open, the page works as before. */
const params = new URL(import.meta.url).searchParams;
const EXAM = params.get('exam'), CLE = params.get('cle');
const URL_SB = 'https://dcnfxwtszqeqfaxlbfbl.supabase.co', KEY = 'sb_publishable_UTy7pKbk6xnw6mjRoy08GQ_5OuU1ymE';
const db = createClient(URL_SB, KEY);
let classe = null, jeton = null, etat = 'libre', sondage = null, fini = false, corrigePublie = false;
async function corrigeEstPublie() {
  const {data} = await db.from('tej2o_releases').select('class_id').eq('activity_id', 'corrige' + EXAM).eq('class_id', classe);
  return !!(data && data.length);
}
// The page shows its own answer key (window.FORMATIVE_CORRIGE, defined by formative.js).
function voirCorrige() { document.querySelector('.verrou-corr')?.remove(); if (window.FORMATIVE_CORRIGE) window.FORMATIVE_CORRIGE(); }
function boutonCorrige() {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'verrou-fin verrou-corr'; b.textContent = '📖 Voir le corrigé';
  b.onclick = voirCorrige; document.body.append(b);
}
db.auth.onAuthStateChange((_e, s) => { jeton = s?.access_token || jeton; });

const reponses = () => { try { return {page: JSON.parse(localStorage.getItem(CLE) || '{}')}; } catch (e) { return {}; } };
const css = document.createElement('style');
css.textContent = `.verrou-voile{position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at 90% 0%,#20523e,#071d18 60%);display:grid;place-items:center;padding:16px;overflow:auto}
.verrou-voile .boite{max-width:620px;width:100%;background:linear-gradient(145deg,#123c30,#0d2b23);border:1px solid #376456;border-radius:17px;padding:22px;color:#f2f7f2}
.verrou-voile .boite.alerte{border:2px solid #e8ac88;background:#3a2018}.verrou-voile h1{color:#e9c77c;margin-top:0}.verrou-voile .alerte h1{color:#ffc6a5}
.verrou-voile li{margin:6px 0}.verrou-fin{position:fixed;right:16px;bottom:16px;z-index:9000;font-size:16px;padding:12px 18px;box-shadow:0 4px 14px #0008}
body.verrouille .barre,body.verrouille .tej-nav a{display:none!important}`;
document.head.append(css);

function voile(html) {
  let v = document.querySelector('.verrou-voile');
  if (!v) { v = document.createElement('div'); v.className = 'verrou-voile'; document.body.append(v); }
  v.innerHTML = html; return v;
}
const retirerVoile = () => document.querySelector('.verrou-voile')?.remove();

function accueil(reprise) {
  const v = voile(`<div class="boite"><h1>${reprise ? 'Ton activité est débloquée' : 'Mode examen'}</h1>
    <p>Ton enseignante a ouvert cette activité <b>en mode examen</b>, comme pour la sommative.</p><ul>
    <li>Tu travailles <b>en plein écran</b>.</li>
    <li>Si tu sors du plein écran, changes d’onglet ou de fenêtre, ou fermes la page, <b>l’activité est bloquée</b>. Seule ton enseignante peut la débloquer.</li>
    <li>Tes réponses sont gardées.</li>
    <li>Quand tu as fini, clique sur <b>✓ J’ai terminé</b>, en bas à droite.</li></ul>
    <p style="text-align:center"><button type="button" id="verrouGo" style="font-size:18px;padding:14px 24px">${reprise ? 'Reprendre en plein écran' : 'Commencer en plein écran'}</button></p><p id="verrouMsg" style="color:#bdd1c8;font-size:13px"></p></div>`);
  v.querySelector('#verrouGo').onclick = async () => {
    try { await document.documentElement.requestFullscreen(); }
    catch (e) { v.querySelector('#verrouMsg').textContent = 'Le plein écran a été refusé. Réessaie, ou demande de l’aide à ton enseignante.'; return; }
    etat = 'actif'; retirerVoile(); boutonFin();
  };
}

function boutonFin() {
  if (document.querySelector('.verrou-fin')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'verrou-fin'; b.textContent = '✓ J’ai terminé';
  b.onclick = () => {
    const v = voile(`<div class="boite"><h1>Tu as terminé ?</h1><p>Après l’envoi, l’activité est finie et tu ne pourras plus la modifier en mode examen.</p><p><button type="button" id="verrouOui">Oui, j’ai terminé</button> <button type="button" id="verrouNon" style="background:transparent;color:#e9c77c;border:1px solid #e9c77c">Non, je continue</button></p><p id="verrouMsg"></p></div>`);
    v.querySelector('#verrouNon').onclick = retirerVoile;
    v.querySelector('#verrouOui').onclick = async () => {
      const {data, error} = await db.rpc('tej2o_exam_submit', {p_class: classe, p_exam: EXAM, p_answers: reponses()});
      if (error) { v.querySelector('#verrouMsg').textContent = '⚠ Pas envoyé : ' + error.message; return; }
      versEtat(data);
    };
  };
  document.body.append(b);
}

function bloquer(raison) {
  if (etat !== 'actif' || fini) return;
  // A drop-down list being opened is not leaving the page.
  if (raison === 'autre fenêtre' && document.activeElement && document.activeElement.tagName === 'SELECT') return;
  etat = 'bloque';
  try {
    fetch(URL_SB + '/rest/v1/rpc/tej2o_exam_block', {method: 'POST', keepalive: true,
      headers: {apikey: KEY, Authorization: 'Bearer ' + jeton, 'Content-Type': 'application/json'},
      body: JSON.stringify({p_class: classe, p_exam: EXAM, p_answers: reponses(), p_reason: raison})});
  } catch (e) { /* the page is closing */ }
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  afficherBloque();
}

function afficherBloque() {
  document.querySelector('.verrou-fin')?.remove();
  voile(`<div class="boite alerte"><h1>🔒 Ton activité est bloquée</h1><p>Tu es sorti du mode examen (plein écran, onglet ou fenêtre). Tes réponses sont gardées.</p><p><b>Lève la main : seule ton enseignante peut la débloquer.</b></p><p style="font-size:13px">Cette page se mettra à jour toute seule quand elle sera débloquée.</p></div>`);
  clearInterval(sondage);
  sondage = setInterval(async () => {
    const {data} = await db.from('tej2o_exams').select('status').eq('class_id', classe).eq('exam_id', EXAM).maybeSingle();
    if (data && data.status !== 'bloquee') { clearInterval(sondage); versEtat(data.status); }
  }, 4000);
}

function versEtat(st) {
  if (st === 'bloquee') { etat = 'bloque'; afficherBloque(); }
  else if (st === 'en_cours') { etat = 'accueil'; accueil(true); }
  else if (st === 'soumise') {
    fini = true; etat = 'fini'; document.querySelector('.verrou-fin')?.remove();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    const v = voile(`<div class="boite"><h1>✓ Activité terminée</h1><p>Merci ! Ton enseignante sait que tu as terminé.</p><p id="verrouCorr">${corrigePublie ? '' : 'Le corrigé sera disponible ici quand ton enseignante le publiera.'}</p><p><a href="../site.html#unite-5" style="color:#e9c77c">← Retour au site TEJ2O</a></p></div>`);
    const montrer = () => { v.querySelector('#verrouCorr').innerHTML = '<button type="button" id="verrouVoirCorr">📖 Voir le corrigé</button>'; v.querySelector('#verrouVoirCorr').onclick = () => { retirerVoile(); document.body.classList.remove('verrouille'); voirCorrige(); }; };
    if (corrigePublie) montrer();
    else { clearInterval(sondage); sondage = setInterval(async () => { if (await corrigeEstPublie()) { clearInterval(sondage); corrigePublie = true; montrer(); } }, 15000); }
  } else if (st === 'fermee') { fini = true; etat = 'libre'; document.body.classList.remove('verrouille'); retirerVoile(); document.querySelector('.verrou-fin')?.remove(); }
}

async function demarrer() {
  const {data: {session}} = await db.auth.getSession();
  if (!session) return;
  jeton = session.access_token;
  const {data: me} = await db.rpc('tej2o_me');
  if (!me || me.role !== 'student') return;
  const ids = (me.classes || []).map(c => c.id);
  if (!ids.length) return;
  // Exam mode only while the teacher keeps it open; afterwards the activity is free again.
  // A student who sent the activity sees the answer key once the teacher publishes it ("corrige" + EXAM).
  const [{data: pubs}, {data: miennes}] = await Promise.all([
    db.from('tej2o_releases').select('class_id,activity_id').in('activity_id', [EXAM, 'corrige' + EXAM]).in('class_id', ids),
    db.from('tej2o_exams').select('class_id,status').eq('exam_id', EXAM)]);
  const envoyee = (miennes || []).find(m => m.status === 'soumise');
  if (envoyee) {
    classe = envoyee.class_id;
    corrigePublie = (pubs || []).some(r => r.activity_id === 'corrige' + EXAM && r.class_id === classe);
    if (corrigePublie) boutonCorrige();
    else if ((pubs || []).some(r => r.activity_id === EXAM && r.class_id === classe)) versEtat('soumise');
    return;
  }
  classe = (pubs || []).find(r => r.activity_id === EXAM)?.class_id;
  if (!classe) return;
  const {data: d, error} = await db.rpc('tej2o_exam_start', {p_class: classe, p_exam: EXAM});
  if (error || !d) return;
  if (d.status === 'soumise') { versEtat('soumise'); return; }
  if (!d.open) return;                       // locked mode closed: the page stays free
  document.body.classList.add('verrouille');
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') bloquer('onglet ou fenêtre'); });
  window.addEventListener('blur', () => { if (etat === 'actif') setTimeout(() => { if (!document.hasFocus()) bloquer('autre fenêtre'); }, 150); });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) bloquer('sortie du plein écran'); });
  window.addEventListener('pagehide', () => bloquer('page fermée ou rechargée'));
  document.addEventListener('contextmenu', e => { if (etat === 'actif') e.preventDefault(); });
  if (d.status === 'en_cours') { etat = 'accueil'; accueil(false); } else versEtat(d.status);
}
demarrer().catch(e => console.error('Mode examen', e));

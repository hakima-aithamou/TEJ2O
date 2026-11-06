import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm';
/* Access control for TEJ2O activity pages.
   Accounts are shared with Assiduité: tej2o_me() returns whether the signed-in user is a teacher or a student, and their classes. */
const db=createClient('https://dcnfxwtszqeqfaxlbfbl.supabase.co','sb_publishable_UTy7pKbk6xnw6mjRoy08GQ_5OuU1ymE');
const activity=document.body.dataset.activity;
const ouvert=r=>r.enabled&&(!r.available_at||new Date(r.available_at)<=new Date());
const showError=(s)=>{window.TEJ2O_ACCESS_ERROR=s;document.body.innerHTML='<main style="max-width:650px;margin:15vh auto;padding:30px;background:#123a2f;color:white;border-radius:18px;font:18px system-ui"><h1>Accès TEJ2O</h1><p>'+s+'</p><p><a style="color:#e8c77c" href="../index.html">Retour à la connexion</a></p></main>';document.documentElement.style.visibility='visible'};
try{
 const {data:{session}}=await db.auth.getSession();
 const {data:me,error}=session?await db.rpc('tej2o_me'):{data:null,error:null};
 if(!session||error||!me?.role){showError(error?'Impossible de vérifier ton compte : '+error.message:'Session absente ou expirée. Connecte-toi avec ton prénom, ton nom et ton mot de passe.')}
 else if(me.role==='teacher'){window.TEJ2O={db,teacher:true,homeworkOpen:true,corrige:new URLSearchParams(location.search).has('corrige')?{reponses:null,prof:true}:null};document.documentElement.style.visibility='visible'}
 else{
  const ids=(me.classes||[]).map(c=>c.id);
  if(!ids.length){showError('Ton compte ne figure dans aucune classe TEJ2O. Demande à ton enseignant(e) de t’ajouter.')}
  else{
   const {data:releases,error:relError}=await db.from('tej2o_releases').select('class_id,activity_id,enabled,available_at').in('class_id',ids);
   const active=(releases||[]).filter(ouvert);
   let lesson=active.find(r=>r.activity_id===activity);
   // Final challenge: open only for the students the teacher checked in the class list.
   if(lesson&&activity==='final'){const {data:coche}=await db.from('tej2o_final_students').select('class_id').eq('student_id',session.user.id);if(!(coche||[]).some(x=>x.class_id===lesson.class_id)){lesson=null;var defiFerme=true}}
   const hw=activity?.startsWith('lesson')?'homework'+activity.slice(6):null;
   const devoir=hw?active.find(r=>r.activity_id===hw):null;
   const params=new URLSearchParams(location.search),voulu=params.has('devoir'),veutCorrige=params.has('corrige');
   const corrigeRel=hw?active.find(r=>r.activity_id==='corrige'+activity.slice(6)):activity==='final'?active.find(r=>r.activity_id==='corrigefinal'):null;
   const ok=lesson||(voulu&&devoir)||(veutCorrige&&corrigeRel);
   if(relError||!ok){showError(relError?'Erreur de lecture des publications : '+relError.message:defiFerme&&!veutCorrige?'Le défi final n’est pas ouvert pour toi aujourd’hui. Demande à ton enseignant(e).':'Cette activité n’est pas publiée pour ta classe.')}
   else{
    const classId=(lesson||devoir||corrigeRel).class_id;
    window.TEJ2O={db,teacher:false,user:{id:session.user.id},classId,homeworkOpen:!!devoir,corrigeOuvert:!!corrigeRel};
    // A homework can be sent only once: if it was already sent, the lesson page shows it as done and locked.
    if(devoir||corrigeRel){
     const {data:fait}=await db.from('tej2o_results').select('score,completed_at,answers').eq('class_id',classId).eq('activity_id',hw||activity).maybeSingle();
     if(fait)window.TEJ2O.devoirFait=fait;
     // Answer key: only once the teacher has published it and the homework was sent; it shows the student's own answers.
     if(veutCorrige&&corrigeRel&&fait)window.TEJ2O.corrige={reponses:fait.answers||null,score:fait.score};
    }
    if(veutCorrige&&!window.TEJ2O.corrige&&!lesson&&!devoir){delete window.TEJ2O;showError(corrigeRel?(activity==='final'?'Le corrigé s’ouvre une fois ton défi envoyé.':'Le corrigé s’ouvre une fois ton devoir envoyé.'):'Ce corrigé n’est pas encore publié.')}
    else document.documentElement.style.visibility='visible';
   }
  }
 }
}catch(e){console.error('TEJ2O access:',e);showError('Impossible de vérifier ton accès : '+(e?.message||String(e)))}

if(window.TEJ2O && !window.TEJ2O.teacher){
 // Locked card shown instead of the questions of a homework already sent.
 window.TEJ2O.carteDevoirFait=()=>{
  const f=window.TEJ2O.devoirFait,quand=new Date(f.completed_at).toLocaleString('fr-CA',{dateStyle:'long',timeStyle:'short'});
  return '<div class="card" style="text-align:center;padding:28px"><div style="display:inline-grid;place-items:center;width:64px;height:64px;border-radius:50%;background:#2e9e5b;color:#fff;font-size:36px;font-weight:900">✓</div>'+
   '<h2 style="margin:14px 0 6px">Devoir déjà envoyé</h2><p style="font-size:18px">Tu as envoyé ce devoir le <b>'+quand+'</b>.</p>'+
   '<p style="font-size:28px;font-weight:900;color:#e8c77c;margin:8px 0">Ton score : '+f.score+' %</p>'+
   '<p>Un devoir ne peut être envoyé qu’une seule fois. Si tu dois le refaire, demande à ton enseignant(e).</p>'+
   (window.TEJ2O.corrigeOuvert?'':'<p>Le corrigé sera dans ton compte quand ton enseignant(e) le publiera.</p>')+
   '<p style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'+(window.TEJ2O.corrigeOuvert?'<a href="?corrige=1" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#2e9e5b;color:#fff;font-weight:800;text-decoration:none">📝 Voir le corrigé</a>':'')+
   '<a href="../index.html?compte" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#e8c77c;color:#08231b;font-weight:800;text-decoration:none">Voir mes devoirs</a></p></div>';
 };
 window.TEJ2O.saveScore=async (activityId,score,answers)=>{
  const {db,user,classId}=window.TEJ2O;
  const {error}=await db.from('tej2o_results').insert({class_id:classId,student_id:user.id,activity_id:activityId,score,answers:answers||null});
  // Once sent, the page shows the homework as done (no answer key until the teacher publishes it).
  if(!error)window.TEJ2O.devoirFait={score,completed_at:new Date().toISOString(),answers:answers||null};
  let notice=document.getElementById('tej2o-save-notice');if(!notice){notice=document.createElement('p');notice.id='tej2o-save-notice';notice.style='background:#123a2f;color:#e8c77c;padding:14px;border-radius:10px;margin:12px';document.body.append(notice)}
  notice.textContent=error?(error.code==='23505'?'Ce devoir a déjà été envoyé. Ton enseignant(e) peut te permettre de le refaire.':'La note n’a pas pu être enregistrée : '+error.message):'Résultat enregistré dans ton compte.';
  return !error;
 };
}

// Banner at the top of an answer key.
window.TEJ2O_BANDEAU_CORRIGE=(c)=>'<div style="background:#2e9e5b;color:#fff;border-radius:12px;padding:14px 18px;margin:0 0 14px;font-weight:700">📝 Corrigé'+(c&&c.prof?' (vue enseignante : bonnes réponses)':c&&c.reponses?' — tes réponses sont comparées aux bonnes réponses'+(c.score!=null?' · ton score : '+c.score+' %':''):c&&c.score!=null?' — tes réponses n’ont pas été gardées : voici les bonnes réponses · ton score : '+c.score+' %':' — voici les bonnes réponses')+'</div>';

// Links to the account page and the portal on every activity page.
const nav=document.querySelector('.tej-nav');if(nav&&window.TEJ2O){const a=document.createElement('a');a.href='../index.html?compte';a.textContent='Mon compte';nav.append(a);const out=document.createElement('a');out.href='../site.html';out.textContent='Leçons et devoirs';nav.append(out)}

/* "Download the lesson" tab for TEJ2O lesson pages.
   Each lesson step is rendered by the page itself, its text is read from the DOM,
   and a text-based PDF is built with jsPDF. Homework questions are never included. */
(function(){
 const JSPDF='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
 const isL6=typeof renderStep==='function'&&document.getElementById('lesson');
 const BLOCK=/^(DIV|P|H1|H2|H3|H4|LI|SECTION|SMALL|BUTTON|UL|OL|TABLE|TR|HEADER|ASIDE)$/;

 // Load jsPDF only when the student asks for the file.
 let loading=null;
 function loadPdf(){
  if(window.jspdf)return Promise.resolve();
  if(loading)return loading;
  loading=new Promise((ok,ko)=>{const s=document.createElement('script');s.src=JSPDF;s.onload=ok;s.onerror=()=>{loading=null;ko(new Error('load'))};document.head.append(s)});
  return loading;
 }

 // Keep only characters the built-in PDF fonts can draw (French accents are kept, emojis are removed).
 const clean=t=>t.replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/ | /g,' ')
  .replace(/[^\x09\x0A\x20-\x7E -ÿ–—•…€Œœ]/g,'').replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').trim();

 // Turn a rendered step into a list of text blocks with a style.
 function blocks(root){
  const out=[];
  (function walk(el){
   if(el.nodeType!==1)return;
   if(el.hidden||el.classList.contains('hidden')||el.classList.contains('nav')||el.classList.contains('feedback')||el.id==='feedback')return;
   const kids=[...el.children].filter(c=>BLOCK.test(c.tagName));
   if(el.tagName==='BUTTON'||!kids.length){
    const c=el.cloneNode(true);c.querySelectorAll('br').forEach(b=>b.replaceWith('\n'));
    const t=clean(c.textContent);if(!t)return;
    let k='p';
    if(/^H[12]$/.test(el.tagName))k='h2';else if(/^H[34]$/.test(el.tagName))k='h3';
    else if(el.tagName==='BUTTON')k='choice';
    else if(el.closest('.callout'))k='box';
    else if(el.closest('.case,.sample,.mail,.from,.phone,.message,.device,.paper'))k='case';
    out.push({k,t});return;
   }
   for(const c of el.children)walk(c);
  })(root);
  return out;
 }

 // Render every lesson step once (without answers) and read its text.
 function readSteps(){
  const res=[];
  if(isL6){
   const keep=step;
   for(let i=0;i<steps.length;i++){step=i;renderStep();res.push({label:'Enquête '+(i+1)+' sur '+steps.length,b:blocks(document.getElementById('lesson'))})}
   step=keep;renderStep();
  }else{
   const keep=step,keepAnswers=typeof answers==='object'?{...answers}:null;
   if(keepAnswers)for(const k in answers)delete answers[k];
   const names=typeof labels!=='undefined'?labels:(typeof steps!=='undefined'&&Array.isArray(steps)&&typeof steps[0]==='string'?steps:null);
   for(let i=0;i<4;i++){step=i;render();res.push({label:names?names[i]:'Étape '+(i+1),b:blocks(document.getElementById('content'))})}
   if(keepAnswers)Object.assign(answers,keepAnswers);
   step=keep;render();
  }
  return res;
 }

 async function download(btn){
  const label=btn.textContent;btn.disabled=true;btn.textContent='⏳ Préparation…';
  try{
   await loadPdf();
   const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'letter'});
   const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),M=18,TW=W-2*M;let y=M;
   const space=h=>{if(y+h>H-M){doc.addPage();y=M}};
   const write=(t,{size=11,bold=false,color=[30,30,30],indent=0,gap=2.2,box=null}={})=>{
    doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);
    const lines=doc.splitTextToSize(t,TW-indent-(box?6:0)),lh=size*0.43;
    if(box){const h=lines.length*lh+5;space(h);doc.setFillColor(...box);doc.rect(M+indent,y-1,TW-indent,h,'F');y+=3;doc.text(lines,M+indent+3,y+lh*0.7);y+=lines.length*lh+gap+2;return}
    for(const l of lines){space(lh);doc.text(l,M+indent,y+lh*0.7);y+=lh}y+=gap;
   };
   const title=clean((document.querySelector('h1')||{}).textContent||document.title);
   const sub=clean(((document.querySelector('.top .small')||{}).textContent)||'');
   write('TEJ2O · Cyberdétectives',{size:10,color:[120,100,40],bold:true,gap:1});
   if(sub)write(sub,{size:12,bold:true,gap:1});
   write(title,{size:18,bold:true,gap:5});
   const parts=readSteps();
   parts.forEach((p,i)=>{
    space(16);doc.setDrawColor(200,170,90);doc.setLineWidth(0.6);doc.line(M,y,W-M,y);y+=4;
    write(clean(p.label),{size:13,bold:true,color:[20,80,60],gap:3});
    for(const b of p.b){
     if(b.k==='h2')write(b.t,{size:13,bold:true,gap:2});
     else if(b.k==='h3')write(b.t,{size:11.5,bold:true,gap:1.5});
     else if(b.k==='choice')write('-  '+b.t,{indent:4,gap:1.2});
     else if(b.k==='box')write(b.t,{box:[245,236,210],gap:2});
     else if(b.k==='case')write(b.t,{size:10,box:[238,242,240],color:[50,50,50],gap:2});
     else write(b.t,{gap:2});
    }
    y+=3;
   });
   const n=doc.getNumberOfPages();
   for(let i=1;i<=n;i++){doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(130,130,130);doc.text('TEJ2O · Cyberdétectives — '+title+' — page '+i+' / '+n,W/2,H-8,{align:'center'})}
   const num=(document.body.dataset.activity||'').replace('lesson','');
   doc.save('TEJ2O_Lecon_'+num+'.pdf');
   btn.textContent='✓ Leçon téléchargée';setTimeout(()=>{btn.textContent=label;btn.disabled=false},2500);
  }catch(e){console.error('Lesson download',e);btn.textContent=label;btn.disabled=false;alert('Le téléchargement n’a pas pu se faire. Vérifie Internet et réessaie.')}
 }

 // Add the tab after the lesson tabs (lessons 1-5) or after the step counter (lesson 6).
 function addTab(){
  if(document.getElementById('dlLesson'))return;
  const b=document.createElement('button');b.id='dlLesson';b.type='button';b.className='tab dl-tab';b.textContent='⬇️ Télécharger la leçon';
  b.title='Télécharger la leçon en PDF (sans le devoir)';b.onclick=()=>download(b);
  const tabs=document.getElementById('tabs');
  if(tabs)tabs.append(b);else{const c=document.getElementById('counter');if(!c)return;b.className='tag dl-tab';b.style.marginLeft='8px';c.after(b)}
 }
 const st=document.createElement('style');
 st.textContent='.dl-tab{cursor:pointer;background:transparent!important;color:#e8c77c!important;border:1px dashed #e8c77c!important;font-weight:700}.dl-tab:hover{background:#e8c77c!important;color:#1b2b22!important}.dl-tab:disabled{opacity:.7;cursor:wait}';
 document.head.append(st);
 const tabs=document.getElementById('tabs');
 if(tabs)new MutationObserver(addTab).observe(tabs,{childList:true});
 addTab();
})();

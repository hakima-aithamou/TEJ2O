/* Mini-project guide: page navigation and the version published by the teacher.
   Teacher: download the guide as a Word file, edit it on the computer, then put the file back on the site.
   Everyone: printable version / PDF (imprimer.html). */
(function () {
  'use strict';
  const DOC_ID = 'mini-projet';
  const $ = id => document.getElementById(id);
  const doc = $('doc'), dotsBox = document.querySelector('.dots'), prev = $('prev'), next = $('next');
  const ORIGINE = doc.innerHTML;          // version shipped with the site
  let i = 0, avantApercu = null, aPublier = null;

  // ---------- Page navigation ----------
  const pages = () => [...doc.querySelectorAll(':scope > .page')];
  function show(defile) {
    const p = pages();
    if (i >= p.length) i = p.length - 1;
    if (i < 0) i = 0;
    p.forEach((el, j) => el.classList.toggle('active', i === j));
    dotsBox.innerHTML = p.map((_, j) => `<span class="dot${i === j ? ' on' : ''}"></span>`).join('');
    prev.disabled = i === 0;
    next.textContent = i === p.length - 1 ? 'Recommencer ↻' : 'Suivant →';
    if (defile) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  prev.onclick = () => { if (i > 0) { i--; show(true); } };
  next.onclick = () => { i = i === pages().length - 1 ? 0 : i + 1; show(true); };
  show(false);

  // ---------- Cleaning (saved content may only contain text and layout) ----------
  const INTERDITS = 'script,iframe,object,embed,style,link,meta,base,form,input,textarea,select,frame,frameset,svg,math';
  function nettoyer(html) {
    const t = document.createElement('template');
    t.innerHTML = html;
    t.content.querySelectorAll(INTERDITS).forEach(n => n.remove());
    t.content.querySelectorAll('*').forEach(n => {
      [...n.attributes].forEach(a => {
        const nom = a.name.toLowerCase(), v = a.value.trim().toLowerCase();
        if (nom.startsWith('on') || nom === 'contenteditable' || nom === 'srcdoc') n.removeAttribute(a.name);
        else if ((nom === 'href' || nom === 'src' || nom === 'xlink:href' || nom === 'action') && !/^(https?:|mailto:|#|\.\.?\/|[a-z0-9_-]+\.(html|png|jpe?g|gif|webp)$)/.test(v)) n.removeAttribute(a.name);
      });
      if (n.tagName === 'A') { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer'); }
    });
    // Keep the page structure: loose content is placed in a page of its own.
    const frag = t.content, sortie = document.createElement('div');
    let libre = null;
    [...frag.childNodes].forEach(n => {
      if (n.nodeType === 1 && n.classList.contains('page')) { libre = null; sortie.append(n); }
      else if (n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim())) {
        if (!libre) { libre = document.createElement('div'); libre.className = 'page'; sortie.append(libre); }
        libre.append(n);
      }
    });
    if (!sortie.querySelector('.page')) return null;
    return sortie.innerHTML;
  }
  function placer(html) { doc.innerHTML = html; doc.querySelectorAll('.page').forEach(p => p.classList.remove('active')); show(false); }


  // ---------- Version published by the teacher (called once access.js has run) ----------
  window.miniProjetPret = async function () {
    const t = window.TEJ2O;
    if (!t?.db) return;
    const { data, error } = await t.db.from('tej2o_documents').select('html,updated_at').eq('id', DOC_ID).maybeSingle();
    if (error) console.error('Document TEJ2O', error);
    else if (data?.html) { const propre = nettoyer(data.html); if (propre) placer(propre); }
    if (t.teacher) {
      $('dlWord').hidden = false;
      $('televerser').hidden = false;
      $('origine').hidden = !data?.html;
      if (data?.updated_at) $('televerser').title = 'Dernière mise à jour : ' + new Date(data.updated_at).toLocaleString('fr-CA');
    }
  };

  // ---------- Download as Word ----------
  const WORD_CSS = 'body{font-family:Calibri,Arial,sans-serif;font-size:12pt;color:#111}h1{font-size:20pt;color:#0e3b30;margin:6pt 0}h2,h3{color:#0e3b30}small{font-size:9pt;color:#7a5c1e;text-transform:uppercase;letter-spacing:1px;font-weight:bold}strong{color:#000}.number{font-weight:bold;color:#7a5c1e}.step,.example,.tool{border:1px solid #999;padding:8pt;margin:6pt 0}.note{border-left:4px solid #d6b66e;padding:6pt 10pt;margin:8pt 0;background:#f7f1e1}table{border-collapse:collapse;width:100%}th,td{border:1px solid #666;padding:5pt;vertical-align:top}th{background:#e8dcbc}a{color:#0b5ed7}.saut{page-break-before:always}';
  $('dlWord').onclick = () => {
    const copie = document.createElement('div');
    copie.innerHTML = nettoyer(doc.innerHTML) || ORIGINE;
    copie.querySelectorAll('.page').forEach((p, j) => { p.removeAttribute('class'); if (j) p.insertAdjacentHTML('beforebegin', '<br clear="all" style="page-break-before:always">'); });
    // Colours chosen for the dark site are unreadable on white paper.
    copie.querySelectorAll('.page [style]').forEach(n => { n.style.removeProperty('color'); n.style.removeProperty('background'); });
    copie.querySelectorAll('br + br').forEach(b => b.remove());
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Mini-projet TEJ2O</title><style>' + WORD_CSS + '</style></head><body>' + copie.innerHTML + '</body></html>';
    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Mini-projet TEJ2O.doc';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  // ---------- Put a file edited on the computer back on the site ----------
  // ---------- Replace the guide with a file edited on the computer ----------
  // Accepted: .docx (Word), and the .doc / .htm file downloaded from this page and saved again by Word.
  const CLASSES = ['page', 'intro', 'steps', 'step', 'number', 'example', 'tool', 'note', 'pill', 'rubric-wrap', 'rubric', 'level'];
  const ESC = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Minimal zip reader (a .docx file is a zip archive).
  async function lireZip(buf) {
    const v = new DataView(buf), u8 = new Uint8Array(buf), fichiers = {};
    let e = buf.byteLength - 22;
    while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('zip');
    let n = v.getUint16(e + 10, true), o = v.getUint32(e + 16, true);
    for (; n > 0; n--) {
      const methode = v.getUint16(o + 10, true), taille = v.getUint32(o + 20, true);
      const ln = v.getUint16(o + 28, true), lx = v.getUint16(o + 30, true), lc = v.getUint16(o + 32, true), local = v.getUint32(o + 42, true);
      const nom = new TextDecoder().decode(u8.subarray(o + 46, o + 46 + ln));
      fichiers[nom] = { methode, taille, local };
      o += 46 + ln + lx + lc;
    }
    return async nom => {
      const f = fichiers[nom];
      if (!f) return null;
      const debut = f.local + 30 + v.getUint16(f.local + 26, true) + v.getUint16(f.local + 28, true);
      const brut = u8.subarray(debut, debut + f.taille);
      if (f.methode === 0) return new TextDecoder().decode(brut);
      const flux = new Blob([brut]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return await new Response(flux).text();
    };
  }

  // Word document.xml → simple HTML (headings, bold/italic/underline, links, lists, tables, page breaks).
  async function docxVersHtml(buf) {
    const lire = await lireZip(buf);
    const xml = await lire('word/document.xml');
    if (!xml) throw new Error('docx');
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const P = s => new DOMParser().parseFromString(s, 'application/xml');
    const d = P(xml);
    const kids = (n, nom) => [...n.childNodes].filter(c => c.namespaceURI === W && c.localName === nom);
    const kid = (n, nom) => kids(n, nom)[0];
    const val = n => n && (n.getAttributeNS(W, 'val') ?? n.getAttribute('w:val'));
    const liens = {};
    const rels = await lire('word/_rels/document.xml.rels');
    if (rels) [...P(rels).getElementsByTagName('Relationship')].forEach(r => { liens[r.getAttribute('Id')] = r.getAttribute('Target'); });
    const ordonnee = {};
    const numXml = await lire('word/numbering.xml');
    if (numXml) {
      const nd = P(numXml), abs = {};
      [...nd.getElementsByTagNameNS(W, 'abstractNum')].forEach(a => {
        const l0 = [...a.getElementsByTagNameNS(W, 'lvl')].find(l => (l.getAttributeNS(W, 'ilvl') ?? '0') === '0');
        abs[a.getAttributeNS(W, 'abstractNumId')] = val(l0 && l0.getElementsByTagNameNS(W, 'numFmt')[0]) !== 'bullet';
      });
      [...nd.getElementsByTagNameNS(W, 'num')].forEach(nm => { ordonnee[nm.getAttributeNS(W, 'numId')] = abs[val(nm.getElementsByTagNameNS(W, 'abstractNumId')[0])]; });
    }
    function runs(n) {
      let h = '';
      [...n.childNodes].forEach(c => {
        if (c.namespaceURI !== W) return;
        if (c.localName === 'r') {
          const pr = kid(c, 'rPr');
          const on = nom => { const x = pr && kid(pr, nom); return x && !['0', 'false', 'none'].includes(val(x) ?? 'true'); };
          let t = '';
          [...c.childNodes].forEach(x => {
            if (x.localName === 't') t += ESC(x.textContent);
            else if (x.localName === 'tab') t += ' ';
            else if (x.localName === 'br') t += x.getAttributeNS(W, 'type') === 'page' ? '\u0000' : '<br>';
          });
          if (!t) return;
          const rs = val(pr && kid(pr, 'rStyle')) || '';
          if (on('b') || /strong|bold|gras|fort/i.test(rs)) t = '<strong>' + t + '</strong>';
          if (on('i') || /^(emphasis|accentuation|italic)/i.test(rs)) t = '<em>' + t + '</em>';
          if (on('u')) t = '<u>' + t + '</u>';
          h += t;
        } else if (c.localName === 'hyperlink') {
          const cible = liens[c.getAttributeNS(R, 'id')];
          h += cible ? '<a href="' + ESC(cible) + '">' + runs(c) + '</a>' : runs(c);
        } else if (['smartTag', 'ins', 'sdt', 'sdtContent', 'fldSimple'].includes(c.localName)) h += runs(c);
      });
      return h;
    }
    function bloc(n, sortie, liste) {
      if (n.localName === 'p') {
        const pr = kid(n, 'pPr'), style = val(pr && kid(pr, 'pStyle')) || '';
        let txt = runs(n);
        if (pr && kid(pr, 'pageBreakBefore')) sortie.push('\u0000');
        if (txt.includes('\u0000')) { const [a, b] = txt.split('\u0000', 2); if (a.trim()) sortie.push('<p>' + a + '</p>'); sortie.push('\u0000'); txt = txt.slice(txt.indexOf('\u0000') + 1).replace(/\u0000/g, ''); }
        if (!txt.replace(/<br>|&nbsp;|\s/g, '')) return;
        const num = pr && kid(pr, 'numPr');
        if (num) {
          const ol = !!ordonnee[val(kid(num, 'numId'))], tag = ol ? 'ol' : 'ul';
          if (!liste.cur || liste.cur.tag !== tag) { liste.cur = { tag, items: [] }; sortie.push(liste.cur); }
          liste.cur.items.push(txt); return;
        }
        liste.cur = null;
        const m = /^(?:heading|titre|berschrift)\s*(\d)$/i.exec(style.replace(/[^a-z0-9]/gi, ''));
        sortie.push(m ? '<h' + Math.min(+m[1], 3) + '>' + txt + '</h' + Math.min(+m[1], 3) + '>' : /^title$/i.test(style) ? '<h1>' + txt + '</h1>' : '<p>' + txt + '</p>');
      } else if (n.localName === 'tbl') {
        liste.cur = null;
        const lignes = kids(n, 'tr').map(tr => '<tr>' + kids(tr, 'tc').map(tc => { const s = []; [...tc.childNodes].forEach(x => bloc(x, s, {})); return '<td>' + aplatir(s).join('<br>') + '</td>'; }).join('') + '</tr>');
        sortie.push('<table>' + lignes.join('') + '</table>');
      } else if (n.localName === 'sdt') { const c = kid(n, 'sdtContent'); if (c) [...c.childNodes].forEach(x => bloc(x, sortie, liste)); }
    }
    const aplatir = s => s.filter(x => x !== '\u0000').map(x => typeof x === 'string' ? x.replace(/^<p>|<\/p>$/g, '') : '<' + x.tag + '>' + x.items.map(i => '<li>' + i + '</li>').join('') + '</' + x.tag + '>');
    const corps = d.getElementsByTagNameNS(W, 'body')[0], sortie = [], liste = {};
    [...corps.childNodes].forEach(x => bloc(x, sortie, liste));
    return sortie.map(x => x === '\u0000' ? '<hr data-saut>' : typeof x === 'string' ? x : '<' + x.tag + '>' + x.items.map(i => '<li>' + i + '</li>').join('') + '</' + x.tag + '>').join('');
  }

  // Word's own HTML: drop its extra markup, mark page breaks.
  function wordHtmlVersHtml(texte) {
    const d = new DOMParser().parseFromString(texte, 'text/html');
    d.querySelectorAll('[style*="page-break-before"]').forEach(n => {
      if (!/always|page/i.test(n.getAttribute('style'))) return;
      let haut = n;
      while (haut.parentElement && haut.parentElement !== d.body && !(haut.parentElement.className || '').match(/WordSection/i)) haut = haut.parentElement;
      const saut = d.createElement('hr');
      saut.setAttribute('data-saut', '');
      haut.before(saut);
      if (n.tagName === 'BR') n.remove();
    });
    const marcheur = d.createTreeWalker(d.body, NodeFilter.SHOW_COMMENT);
    const commentaires = []; while (marcheur.nextNode()) commentaires.push(marcheur.currentNode);
    commentaires.forEach(c => c.remove());
    d.body.querySelectorAll('*').forEach(n => {
      if (n.tagName.includes(':')) { n.replaceWith(...n.childNodes); return; }
      const cl = (n.getAttribute('class') || '').split(/\s+/).filter(c => CLASSES.includes(c));
      [...n.attributes].forEach(a => { if (!['href', 'colspan', 'rowspan', 'data-saut'].includes(a.name)) n.removeAttribute(a.name); });
      if (cl.length) n.className = cl.join(' ');
    });
    d.body.querySelectorAll('span,font').forEach(n => n.replaceWith(...n.childNodes));
    d.body.querySelectorAll('b').forEach(n => { const s = d.createElement('strong'); s.append(...n.childNodes); n.replaceWith(s); });
    // Unwrap layout-only containers (Word's section divs) so the content sits at the top level.
    let fini = false;
    while (!fini) { fini = true; d.body.querySelectorAll('div:not([class])').forEach(n => { n.replaceWith(...n.childNodes); fini = false; }); }
    d.body.querySelectorAll('p,h1,h2,h3,li').forEach(n => { if (!n.textContent.replace(/ |\s/g, '') && !n.querySelector('img,br+br')) n.remove(); });
    return d.body.innerHTML;
  }

  // Split into site pages at the page breaks (or at the "Page n / m" labels), and restore the page labels.
  function enPages(html) {
    const t = document.createElement('template');
    t.innerHTML = html;
    const racine = t.content;
    // Already in site form (pages kept their structure)?
    if (racine.querySelector(':scope > .page')) return [...racine.children].filter(n => n.classList.contains('page')).map(n => n.outerHTML).join('');
    let groupes = [[]];
    [...racine.childNodes].forEach(n => {
      if (n.nodeType === 1 && n.tagName === 'HR' && n.hasAttribute('data-saut')) { groupes.push([]); return; }
      if (n.nodeType === 1 || n.textContent.trim()) groupes.at(-1).push(n);
    });
    groupes = groupes.filter(g => g.length);
    if (groupes.length < 2) {
      const etiquette = n => n.nodeType === 1 && /^\s*page\s+\d+\s*\/\s*\d+/i.test(n.textContent) && n.textContent.length < 90;
      const g2 = [[]];
      (groupes[0] || []).forEach(n => { if (etiquette(n) && g2.at(-1).length) g2.push([]); g2.at(-1).push(n); });
      groupes = g2.filter(g => g.length);
    }
    return groupes.map(g => {
      const p = document.createElement('div');
      p.className = 'page';
      g.forEach(n => p.append(n));
      const premier = p.firstElementChild;
      if (premier && /^\s*page\s+\d+/i.test(premier.textContent) && premier.textContent.length < 90 && premier.tagName !== 'SMALL') {
        const s = document.createElement('small'); s.textContent = premier.textContent.trim(); premier.replaceWith(s);
      }
      const h = p.querySelector('h1,h2');
      const apres = h && h.nextElementSibling;
      if (apres && apres.tagName === 'P' && !apres.className) apres.className = 'intro';
      p.querySelectorAll('table').forEach(tb => {
        if (!tb.closest('.rubric-wrap')) { const w = document.createElement('div'); w.className = 'rubric-wrap'; tb.before(w); w.append(tb); }
        tb.classList.add('rubric');
      });
      return p.outerHTML;
    }).join('');
  }

  async function fichierVersHtml(f) {
    const buf = await f.arrayBuffer(), u8 = new Uint8Array(buf);
    if (u8[0] === 0x50 && u8[1] === 0x4b) return enPages(await docxVersHtml(buf));
    if (u8[0] === 0xd0 && u8[1] === 0xcf) throw new Error('ancien');
    let texte = new TextDecoder('utf-8').decode(buf);
    const jeu = /charset=["']?([\w-]+)/i.exec(texte.slice(0, 3000));
    if (jeu && !/utf-?8/i.test(jeu[1])) { try { texte = new TextDecoder(jeu[1]).decode(buf); } catch (e) { } }
    if (!/<(html|body|p|div|h1)\b/i.test(texte)) throw new Error('format');
    return enPages(wordHtmlVersHtml(texte));
  }


  $('televerser').onclick = () => { $('fichier').value = ''; $('fichier').click(); };
  function fermerApercu() { document.body.classList.remove('voir-tout'); $('apercu').hidden = true; aPublier = null; show(true); }
  $('fichier').onchange = async () => {
    const f = $('fichier').files[0];
    if (!f) return;
    if (f.size > 15e6) { alert('Ce fichier est trop gros (plus de 15 Mo).'); return; }
    let html;
    try { html = nettoyer(await fichierVersHtml(f)); }
    catch (e) {
      console.error('Import du fichier', e);
      alert(e.message === 'ancien'
        ? 'Ce fichier est au format Word 97-2003. Dans Word, choisis Fichier › Enregistrer sous › « Document Word (.docx) », puis recommence.'
        : 'Impossible de lire ce fichier. Utilise un fichier Word (.docx) ou le fichier .doc téléchargé depuis cette page.');
      return;
    }
    if (!html) { alert('Le fichier semble vide : rien n’a été remplacé.'); return; }
    if (html.length > 300000) { alert('Ce document est trop long pour être mis sur le site.'); return; }
    // Preview: every page shown one under the other; nothing is published before "Publier".
    avantApercu = doc.innerHTML; aPublier = html;
    placer(html);
    document.body.classList.add('voir-tout');
    $('apercuInfo').textContent = '(' + pages().length + ' page' + (pages().length > 1 ? 's' : '') + ') : vérifie-le, puis publie-le.';
    $('apercu').hidden = false;
    $('apercu').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $('annuler').onclick = () => { if (avantApercu !== null) placer(avantApercu); fermerApercu(); };
  $('publier').onclick = async () => {
    const t = window.TEJ2O;
    if (!aPublier || !t?.db) return;
    $('publier').disabled = true;
    const { data: { user } } = await t.db.auth.getUser();
    const { error } = await t.db.from('tej2o_documents').upsert({ id: DOC_ID, html: aPublier, updated_at: new Date().toISOString(), updated_by: user?.id || null });
    $('publier').disabled = false;
    if (error) { alert(/row-level|permission/i.test(error.message) ? 'Seul le compte administrateur peut mettre ce document sur le site.' : 'Erreur : ' + error.message); return; }
    fermerApercu();
    $('origine').hidden = false;
    alert('C’est publié : les élèves voient maintenant ta version, et la version imprimable aussi.');
  };
  $('origine').onclick = async () => {
    if (!confirm('Remettre la version d’origine du mini-projet ? Ta version publiée sera retirée du site.')) return;
    const { error } = await window.TEJ2O.db.from('tej2o_documents').delete().eq('id', DOC_ID);
    if (error) { alert('Erreur : ' + error.message); return; }
    placer(ORIGINE);
    $('origine').hidden = true;
    alert('La version d’origine est remise.');
  };
  window.addEventListener('beforeunload', e => { if (aPublier) { e.preventDefault(); e.returnValue = ''; } });
})();

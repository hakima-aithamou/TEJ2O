/* Pseudocode toolbox: a row of buttons above every box where students write an algorithm.
   - symbols (←, ×, ÷, −, ≠, ≤, ≥, « ») are inserted at the cursor;
   - keyword buttons insert a whole block (IF … END IF, WHILE …) with the right indentation;
   - typing "<-" becomes "←";
   - the "Effacer" button erases the selected text, or the whole box after a second click (to avoid accidents).
   Lessons use the course style (SI … ALORS / FIN SI); the formative and summative tests use
   their own style (Si / FinSi, TantQue / FinTantQue, Pour / FinPour). Python boxes are left alone. */
(function () {
  'use strict';
  if (window.TEJ2O_OUTILS_PSEUDO) return; window.TEJ2O_OUTILS_PSEUDO = true;

  const EVAL = /\/(sommative|formative)-\d/.test(location.pathname);
  /* "¦" marks where the cursor goes after the insertion. */
  const SYMBOLES = [
    ['←', ' ← ¦', 'Ranger une valeur dans une variable (x ← 5). Tu peux aussi taper <-'],
    ['+', ' + ¦', 'Plus'], ['−', ' − ¦', 'Moins'], ['×', ' × ¦', 'Multiplié par'], ['÷', ' ÷ ¦', 'Divisé par'],
    ['=', ' = ¦', 'Égal à'], ['≠', ' ≠ ¦', 'Différent de'], ['<', ' < ¦', 'Plus petit que'], ['>', ' > ¦', 'Plus grand que'],
    ['≤', ' ≤ ¦', 'Plus petit ou égal à'], ['≥', ' ≥ ¦', 'Plus grand ou égal à'],
    ['« »', EVAL ? '"¦"' : '« ¦ »', 'Un texte à afficher, entre guillemets']
  ];
  const MOTS = EVAL ? [
    ['Lire', '\nLire ¦', 'Lire une valeur tapée par l’utilisateur'],
    ['Afficher', '\nAfficher(¦)', 'Afficher un message ou une valeur'],
    ['Si', '\nSi ¦\n    \nFinSi', 'Une condition'],
    ['Si / Sinon', '\nSi ¦\n    \nSinon\n    \nFinSi', 'Une condition avec deux chemins'],
    ['TantQue', '\nTantQue ¦\n    \nFinTantQue', 'Répéter tant que la condition est vraie'],
    ['Pour', '\nPour i de 1 à ¦\n    \nFinPour', 'Répéter un nombre de fois connu'],
    ['ET', ' ET ¦', 'Les deux conditions doivent être vraies'], ['OU', ' OU ¦', 'Une des deux conditions suffit'], ['NON', 'NON ¦', 'Le contraire d’une condition']
  ] : [
    ['LIRE', '\nLIRE ¦', 'Lire une valeur tapée par l’utilisateur'],
    ['AFFICHER', '\nAFFICHER ¦', 'Afficher un message ou une valeur'],
    ['SI', '\nSI ¦ ALORS\n    \nFIN SI', 'Une condition'],
    ['SI / SINON', '\nSI ¦ ALORS\n    \nSINON\n    \nFIN SI', 'Une condition avec deux chemins'],
    ['TANT QUE', '\nTANT QUE ¦ FAIRE\n    \nFIN TANT QUE', 'Répéter tant que la condition est vraie'],
    ['RÉPÉTER', '\nRÉPÉTER ¦ FOIS\n    \nFIN RÉPÉTER', 'Répéter un nombre de fois connu'],
    ['ET', ' ET ¦', 'Les deux conditions doivent être vraies'], ['OU', ' OU ¦', 'Une des deux conditions suffit'], ['NON', 'NON ¦', 'Le contraire d’une condition']
  ];

  const css = document.createElement('style');
  css.textContent = `
.op-boite{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin:6px 0 5px;padding:6px 7px;border:1px solid #9fb8ad;border-radius:10px;background:#eef5f1}
.op-boite .op-titre{font:700 13px system-ui;color:#21463a;margin-right:4px}
.op-boite button{font:600 15px/1 system-ui;min-width:34px;height:32px;padding:0 8px;border:1px solid #9fb8ad;border-radius:7px;background:#fff;color:#123;cursor:pointer}
.op-boite button.op-mot{font-size:13px;background:#dff0e8;color:#0f3d2e}
.op-boite button:hover,.op-boite button:focus-visible{background:#ffe9a8;border-color:#b8860b;outline:none}
.op-boite .op-sep{width:1px;height:24px;background:#9fb8ad;margin:0 3px}
.op-boite button.op-effacer{font-size:13px;background:#fde7e4;color:#8a1f12;border-color:#d79b92;margin-left:auto}
.op-boite button.op-effacer.op-sur{background:#c0392b;color:#fff;border-color:#c0392b}
@media print{.op-boite{display:none}}`;
  document.head.appendChild(css);

  /* Is this box for pseudocode (not Python, not read-only)? */
  function pourPseudo(t) {
    if (t.dataset.opBoite) return false;
    if ((t.placeholder || '').trim().startsWith('#')) return false;
    if (/python/i.test(t.getAttribute('aria-label') || '')) return false;
    return t.classList.contains('pseudo') || /pseudocode/i.test(t.getAttribute('aria-label') || '');
  }

  function inserer(t, modele) {
    if (t.readOnly || t.disabled) return;
    const debut = t.selectionStart, fin = t.selectionEnd, v = t.value;
    const avant = v.slice(0, debut), ligne = avant.slice(avant.lastIndexOf('\n') + 1);
    const retrait = (ligne.match(/^ */) || [''])[0];
    let txt = modele;
    if (txt.startsWith('\n')) {
      // A block: start on a new line unless the current line is empty; keep the line's indentation.
      txt = (ligne.trim() === '' ? txt.slice(1) : txt);
      txt = txt.replace(/\n/g, '\n' + retrait);
    } else if (txt.startsWith(' ') && (avant === '' || /[\s(]$/.test(avant))) txt = txt.slice(1); // no double space
    const choisi = v.slice(debut, fin);
    if (choisi && txt.includes('¦')) txt = txt.replace('¦', choisi + '¦');
    const pos = txt.indexOf('¦'); txt = txt.replace('¦', '');
    t.focus();
    t.setRangeText(txt, debut, fin, 'end');
    const c = debut + (pos < 0 ? txt.length : pos);
    t.selectionStart = t.selectionEnd = c;
    t.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function boite(t) {
    t.dataset.opBoite = '1';
    const b = document.createElement('div'); b.className = 'op-boite'; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', 'Boîte à outils du pseudocode');
    const titre = document.createElement('span'); titre.className = 'op-titre'; titre.textContent = '🧰'; titre.title = 'Boîte à outils : clique pour écrire le symbole ou le mot dans ton algorithme'; b.append(titre);
    const ajoute = (liste, cls) => liste.forEach(([lab, modele, aide]) => {
      const x = document.createElement('button'); x.type = 'button'; x.textContent = lab; x.title = aide; x.setAttribute('aria-label', lab + ' : ' + aide);
      if (cls) x.className = cls;
      x.addEventListener('mousedown', e => e.preventDefault()); // keep the cursor in the box
      x.addEventListener('click', () => inserer(t, modele));
      b.append(x);
    });
    ajoute(SYMBOLES);
    const sep = document.createElement('span'); sep.className = 'op-sep'; b.append(sep);
    ajoute(MOTS, 'op-mot');
    // Erase button: a selection is erased at once; the whole box needs a second click within 3 s.
    const ef = document.createElement('button'); ef.type = 'button'; ef.className = 'op-effacer';
    const EF_TXT = '🧽 Effacer', EF_AIDE = 'Effacer le texte choisi, ou tout l’algorithme';
    ef.textContent = EF_TXT; ef.title = EF_AIDE; ef.setAttribute('aria-label', 'Effacer : ' + EF_AIDE);
    let minuterie = null;
    const remettre = () => { clearTimeout(minuterie); minuterie = null; ef.classList.remove('op-sur'); ef.textContent = EF_TXT; };
    ef.addEventListener('mousedown', e => e.preventDefault());
    ef.addEventListener('click', () => {
      if (t.readOnly || t.disabled) return;
      if (t.selectionEnd > t.selectionStart) {
        remettre(); t.focus(); t.setRangeText('', t.selectionStart, t.selectionEnd, 'end');
        t.dispatchEvent(new Event('input', { bubbles: true })); return;
      }
      if (!t.value) return;
      if (!minuterie) {
        ef.classList.add('op-sur'); ef.textContent = 'Tout effacer ? Clique encore';
        minuterie = setTimeout(remettre, 3000); return;
      }
      remettre();
      t.focus(); t.select(); t.setRangeText('', 0, t.value.length, 'end');
      t.dispatchEvent(new Event('input', { bubbles: true }));
    });
    b.append(ef);
    t.before(b);
    // "<-" typed by the student becomes "←"
    t.addEventListener('input', () => {
      const p = t.selectionStart;
      if (p >= 2 && t.value.slice(p - 2, p) === '<-') { t.setRangeText('←', p - 2, p, 'end'); t.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    const maj = () => { b.hidden = t.readOnly || t.disabled; };
    maj(); new MutationObserver(maj).observe(t, { attributes: true, attributeFilter: ['readonly', 'disabled'] });
  }

  function chercher() { document.querySelectorAll('textarea').forEach(t => { if (pourPseudo(t)) boite(t); }); }
  const lancer = () => { chercher(); new MutationObserver(chercher).observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lancer); else lancer();
})();

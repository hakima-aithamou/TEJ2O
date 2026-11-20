/* Python runner for the unit 2 lessons.
   The code runs in a worker (python-worker.js); a run that lasts too long is stopped and the worker is restarted. */
window.PYTHON = (function () {
  const LIMIT = 5000;          // ms allowed for one run, once Python is loaded
  let worker = null, loaded = null, waiting = new Map(), nextId = 1;

  const scriptSrc = document.currentScript ? document.currentScript.src : null;

  function restart() {
    if (worker) worker.terminate();
    worker = null; loaded = null;
    for (const done of waiting.values()) done({ out: '', error: null, stopped: true });
    waiting.clear();
  }

  // Loads Python (a few seconds the first time; the browser keeps it in cache afterwards).
  function prepare() {
    if (!worker) {
      worker = new Worker(new URL('python-worker.js', scriptSrc || location.href));
      loaded = new Promise((ok, ko) => {
        worker.onmessage = (e) => {
          const m = e.data;
          if (m.type === 'ready') ok();
          else if (m.type === 'loadError') ko(new Error(m.message));
          else if (m.type === 'done' && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
        };
        worker.onerror = (e) => ko(new Error(e.message || 'worker'));
      });
      loaded.catch(() => { worker && worker.terminate(); worker = null; loaded = null; });
    }
    return loaded;
  }

  // Runs code; resolves with {out, error, stopped}.
  async function run(code, inputs, echo) {
    await prepare();
    const id = nextId++;
    return new Promise((resolve) => {
      const timer = setTimeout(() => { if (waiting.has(id)) { waiting.delete(id); restart(); resolve({ out: '', error: null, stopped: true }); } }, LIMIT);
      waiting.set(id, (m) => { clearTimeout(timer); resolve(m); });
      worker.postMessage({ id, code, inputs: inputs || [], echo: !!echo });
    });
  }

  // Turns a Python traceback into a short message in French, with the line number.
  function explain(raw) {
    if (!raw) return null;
    const lines = raw.trim().split('\n');
    let line = null;
    for (const l of lines) { const m = l.match(/File "<exec>", line (\d+)/); if (m) line = +m[1]; }
    const last = lines[lines.length - 1] || '';
    const at = line ? 'Ligne ' + line + ' : ' : '';
    let text;
    if (/^IndentationError|^TabError/.test(last)) text = at + 'erreur d’indentation. Les lignes d’un bloc (après if, else, for, while) doivent être décalées de 4 espaces, toutes pareilles.';
    else if (/^SyntaxError/.test(last)) {
      text = at + 'erreur de syntaxe. Vérifie les deux-points (:) à la fin de if, else, for et while, les parenthèses et les guillemets.';
      if (/expected ':'/.test(last)) text = at + 'il manque les deux-points (:) à la fin de la ligne.';
      else if (/unterminated string/.test(last)) text = at + 'un guillemet n’est pas fermé.';
      else if (/'\(' was never closed|never closed/.test(last)) text = at + 'une parenthèse n’est pas fermée.';
      else if (/invalid syntax\. Maybe you meant '==' or ':=' instead of '='/.test(last)) text = at + 'pour comparer, écris == (deux signes égal).';
    }
    else if (/^NameError/.test(last)) { const n = (last.match(/name '(.+?)' is not defined/) || [])[1]; text = at + 'le nom « ' + (n || '?') + ' » est inconnu. Vérifie l’orthographe (majuscules comprises) ou crée la variable avant de l’utiliser.'; }
    else if (/^TypeError/.test(last) && /str/.test(last) && /int/.test(last)) text = at + 'tu mélanges du texte et un nombre. Utilise int(...) pour transformer un texte en nombre.';
    else if (/^TypeError/.test(last)) text = at + 'opération impossible avec ces valeurs (' + last.replace(/^TypeError:\s*/, '') + ').';
    else if (/^ValueError/.test(last) && /int\(\)/.test(last)) text = at + 'int(...) a reçu un texte qui n’est pas un nombre entier. Vérifie la case Entrées.';
    else if (/^ZeroDivisionError/.test(last)) text = at + 'division par zéro.';
    else if (/^EOFError/.test(last)) text = 'Le programme demande plus de réponses qu’il n’y en a dans la case Entrées.';
    else text = at + last;
    return { line, text, raw: last };
  }

  return { prepare, run, explain };
})();

/* Runs the students' Python code with Pyodide, in a worker so that an endless loop
   can be stopped by the page without freezing it. */
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');

const ready = loadPyodide().then(py => {
  postMessage({ type: 'ready' });
  return py;
}).catch(err => {
  postMessage({ type: 'loadError', message: String(err && err.message || err) });
  throw err;
});

// input() reads the next line of the "Entrées" box; with echo on, the question and the answer are shown like in a terminal.
const PRELUDE = `
def input(question=""):
    if __echo__:
        print(question, end="")
    if not __entrees__:
        raise EOFError("plus d'entrées")
    valeur = str(__entrees__.pop(0))
    if __echo__:
        print(valeur)
    return valeur
`;

onmessage = async (event) => {
  const { id, code, inputs, echo } = event.data;
  let py;
  try { py = await ready; } catch (e) { return; }
  let out = '';
  const decoder = new TextDecoder();
  const write = buffer => { out += decoder.decode(buffer, { stream: true }); return buffer.length; };
  py.setStdout({ write });
  py.setStderr({ write });
  const scope = py.globals.get('dict')();
  const flush = () => { try { py.runPython('import sys\nsys.stdout.flush()\nsys.stderr.flush()'); } catch (e) { /* nothing to flush */ } };
  let error = null;
  try {
    scope.set('__entrees__', py.toPy(inputs || []));
    scope.set('__echo__', !!echo);
    py.runPython(PRELUDE, { globals: scope });
    await py.runPythonAsync(code, { globals: scope });
  } catch (err) {
    error = String(err && err.message || err);
  } finally {
    flush();
    scope.destroy();
  }
  postMessage({ type: 'done', id, out, error });
};

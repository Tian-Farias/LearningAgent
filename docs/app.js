// Página de evolución del agente: los datos vienen de data.js (ver scripts/build_site.py).
(function () {
  "use strict";

  const data = window.LAGENT_DATA;
  const stops = data.stops;
  const versions = data.versions;
  const versionById = Object.fromEntries(versions.map((v) => [v.id, v]));
  const stopIndexById = Object.fromEntries(stops.map((s, i) => [s.id, i]));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const $ = (id) => document.getElementById(id);
  const code = $("code");
  const mini = $("mini");
  const plan = $("plan");

  const state = {
    index: 0,
    path: null, // archivo seleccionado
    shown: null, // último código dibujado: {path, text, hash}
    hunks: [],
    run: 0, // cada navegación invalida la animación anterior
    speed: 1,
    playing: false,
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  const isAgent = (path) => /^lagent-v\d+\.py$/.test(path);
  // Todos los lagent-vXXX.py son el mismo agente: entre ellos se puede hacer la transición.
  const family = (path) => (isAgent(path) ? "agente" : path);

  function linesOf(text) {
    if (!text) return [];
    const lines = text.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    return lines;
  }

  // ---------- Diff ----------

  // Subsecuencia común más larga. Devuelve operaciones [tipo, índice en a, índice en b].
  function lcs(a, b) {
    const n = a.length;
    const m = b.length;
    const w = m + 1;
    const table = new Uint16Array((n + 1) * w);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        table[i * w + j] = a[i] === b[j]
          ? table[(i + 1) * w + j + 1] + 1
          : Math.max(table[(i + 1) * w + j], table[i * w + j + 1]);
      }
    }
    const ops = [];
    let i = 0;
    let j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) ops.push(["eq", i++, j++]);
      else if (j >= m || (i < n && table[(i + 1) * w + j] >= table[i * w + j + 1])) ops.push(["del", i++, -1]);
      else ops.push(["add", -1, j++]);
    }
    return ops;
  }

  // Compara dos líneas por palabras. Devuelve los rangos que cambiaron y qué tan parecidas son.
  function wordDiff(x, y) {
    const split = (s) => s.match(/[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu) || [];
    const a = split(x);
    const b = split(y);
    const ra = [];
    const rb = [];
    let pa = 0;
    let pb = 0;
    let same = 0;
    for (const [op, i, j] of lcs(a, b)) {
      if (op === "eq") {
        same += a[i].length;
        pa += a[i].length;
        pb += b[j].length;
      } else if (op === "del") {
        ra.push([pa, pa + a[i].length]);
        pa += a[i].length;
      } else {
        rb.push([pb, pb + b[j].length]);
        pb += b[j].length;
      }
    }
    return { ra, rb, ratio: (2 * same) / Math.max(1, x.length + y.length) };
  }

  const TRIVIAL = /^\s*[\[\](){},]*\s*$/;

  // Convierte dos textos en una lista de filas {type, text, n, hunk, marks}.
  // Las filas eq/add llevan número de línea; add y del comparten "hunk" si son del mismo cambio.
  function buildRows(fromText, toText) {
    const a = linesOf(fromText);
    const b = linesOf(toText);
    let start = 0;
    while (start < a.length && start < b.length && a[start] === b[start]) start++;
    let endA = a.length;
    let endB = b.length;
    while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
      endA--;
      endB--;
    }
    const middle = lcs(a.slice(start, endA), b.slice(start, endB)).map(([op, i, j]) => ({
      type: op,
      text: op === "add" ? b[start + j] : a[start + i],
    }));

    // Una línea en blanco suelta entre dos cambios no es un punto en común real:
    // unirlos deja bloques legibles en vez de cambios picados.
    const cleaned = [];
    for (let i = 0; i < middle.length; i++) {
      const row = middle[i];
      if (row.type === "eq" && TRIVIAL.test(row.text)) {
        let end = i;
        while (end < middle.length && middle[end].type === "eq" && TRIVIAL.test(middle[end].text)) end++;
        if (i > 0 && end < middle.length && middle[i - 1].type !== "eq" && middle[end].type !== "eq" && end - i <= 2) {
          for (let k = i; k < end; k++) {
            cleaned.push({ type: "del", text: middle[k].text }, { type: "add", text: middle[k].text });
          }
          i = end - 1;
          continue;
        }
      }
      cleaned.push(row);
    }

    const rows = a.slice(0, start).map((text) => ({ type: "eq", text }));
    let hunk = -1;
    for (let i = 0; i < cleaned.length; ) {
      if (cleaned[i].type === "eq") {
        rows.push(cleaned[i++]);
        continue;
      }
      const dels = [];
      const adds = [];
      while (i < cleaned.length && cleaned[i].type !== "eq") {
        (cleaned[i].type === "del" ? dels : adds).push(cleaned[i]);
        i++;
      }
      hunk++;
      pairLines(dels, adds);
      for (const row of dels.concat(adds)) rows.push(Object.assign(row, { hunk }));
    }
    for (const text of a.slice(endA)) rows.push({ type: "eq", text });

    let n = 0;
    for (const row of rows) if (row.type !== "del") row.n = ++n;
    // La última eliminada de cada bloque lleva la marca del margen.
    rows.forEach((row, i) => {
      if (row.type === "del" && (!rows[i + 1] || rows[i + 1].type !== "del")) row.last = true;
    });
    return { rows, hunks: hunk + 1 };
  }

  // Empareja líneas parecidas de un bloque para resaltar solo las palabras que cambiaron.
  function pairLines(dels, adds) {
    if (dels.length * adds.length > 900) return;
    let from = 0;
    for (const del of dels) {
      if (!del.text.trim() || del.text.length > 700) continue;
      let best = null;
      let bestAt = -1;
      for (let k = from; k < adds.length; k++) {
        if (adds[k].text.length > 700) continue;
        const d = wordDiff(del.text, adds[k].text);
        if (d.ratio >= 0.5 && (!best || d.ratio > best.ratio)) {
          best = d;
          bestAt = k;
        }
      }
      if (best) {
        del.marks = best.ra;
        adds[bestAt].marks = best.rb;
        from = bestAt + 1;
      }
    }
  }

  // ---------- Resaltado de sintaxis ----------

  const PY = new RegExp(
    [
      "(#.*$)",
      "((?:[rRbBfF]{1,2})?\"(?:\\\\.|[^\"\\\\])*\"|(?:[rRbBfF]{1,2})?'(?:\\\\.|[^'\\\\])*')",
      "\\b(def|class|return|if|elif|else|for|while|try|except|finally|with|as|import|from|in|not|and|or|is|continue|break|pass|raise|lambda)\\b",
      "\\b(None|True|False|\\d+)\\b",
      "\\b([A-Za-z_]\\w*)(?=\\()",
    ].join("|"),
    "g"
  );
  const MD = /(^#{1,6} .*$)|(^>.*$)|(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]*\]\([^)]*\))/g;

  function tokens(text, lang) {
    const found = [];
    if (lang === "py") {
      for (const m of text.matchAll(PY)) {
        const cls = m[1] ? "t-c" : m[2] ? "t-s" : m[3] ? "t-k" : m[4] ? "t-n" : "t-f";
        found.push([m.index, m.index + m[0].length, cls]);
      }
    } else if (lang === "md") {
      for (const m of text.matchAll(MD)) {
        const cls = m[1] ? "t-h" : m[2] ? "t-c" : m[3] ? "t-s" : m[4] ? "t-h" : "t-f";
        found.push([m.index, m.index + m[0].length, cls]);
      }
    } else if (/^\s*#/.test(text)) {
      found.push([0, text.length, "t-c"]);
    }
    return found;
  }

  function langOf(path) {
    if (path.endsWith(".py")) return "py";
    if (path.endsWith(".md")) return "md";
    return "plain";
  }

  // Dibuja una línea combinando las clases de sintaxis con las palabras marcadas.
  function paint(text, lang, marks) {
    if (!text) return "";
    const cuts = new Set([0, text.length]);
    const toks = tokens(text, lang);
    for (const [s, e] of toks) cuts.add(s).add(e);
    for (const [s, e] of marks || []) cuts.add(s).add(e);
    const points = [...cuts].sort((x, y) => x - y);
    let html = "";
    for (let i = 0; i + 1 < points.length; i++) {
      const s = points[i];
      const e = points[i + 1];
      const cls = [];
      const tok = toks.find((t) => t[0] <= s && e <= t[1]);
      if (tok) cls.push(tok[2]);
      if ((marks || []).some((r) => r[0] <= s && e <= r[1])) cls.push("wd");
      const part = esc(text.slice(s, e));
      html += cls.length ? `<span class="${cls.join(" ")}">${part}</span>` : part;
    }
    return html;
  }

  // ---------- Código y transición ----------

  // Dibuja las filas. Si animated es true, deja el texto de origen a la vista
  // (lo agregado todavía colapsado) para que la transición parta desde ahí.
  function renderRows(rows, path, animated) {
    const lang = langOf(path);
    const html = rows.map((row) => {
      const classes = ["line", row.type];
      if (row.last) classes.push("last");
      if ((row.type === "add") === animated && row.type !== "eq") classes.push("collapsed");
      const hunk = row.hunk === undefined ? "" : ` data-h="${row.hunk}"`;
      return `<div class="${classes.join(" ")}"${hunk}><div class="in"><span class="ln">${row.n || ""}</span><span class="tx">${paint(row.text, lang, row.marks)}</span></div></div>`;
    });
    code.innerHTML = html.join("");
  }

  function collectHunks(count) {
    const hunks = Array.from({ length: count }, () => ({ dels: [], adds: [] }));
    for (const el of code.querySelectorAll("[data-h]")) {
      const hunk = hunks[Number(el.dataset.h)];
      (el.classList.contains("add") ? hunk.adds : hunk.dels).push(el);
    }
    return hunks;
  }

  // Mantiene a la vista el cambio en curso. Se suelta si la persona hace scroll a mano.
  function followScroll(run) {
    const follow = { el: null, active: true };
    const release = () => { follow.active = false; };
    code.addEventListener("wheel", release, { once: true, passive: true });
    code.addEventListener("touchstart", release, { once: true, passive: true });
    const step = () => {
      if (!follow.active || run !== state.run) return;
      if (follow.el) {
        const target = Math.max(0, follow.el.offsetTop - code.clientHeight * 0.28);
        code.scrollTop += (target - code.scrollTop) * 0.14;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    follow.stop = () => {
      follow.active = false;
      code.removeEventListener("wheel", release);
      code.removeEventListener("touchstart", release);
    };
    return follow;
  }

  // Reproduce los cambios en orden: primero se va lo eliminado y luego entra lo nuevo.
  async function playHunks(hunks, run) {
    if (!hunks.length) return;
    const budget = Math.min(900 + hunks.length * 380, 6500) / state.speed;
    const each = Math.max(130, budget / hunks.length);
    code.style.setProperty("--dur", `${Math.round(Math.min(each * 0.7, 380))}ms`);
    void code.offsetHeight; // aplica el estado inicial antes de empezar las transiciones
    const follow = followScroll(run);
    for (const hunk of hunks) {
      if (run !== state.run) return;
      follow.el = hunk.dels[0] || hunk.adds[0];
      if (hunk.dels.length) {
        hunk.dels.forEach((el) => el.classList.add("fresh"));
        await wait(each * 0.3);
        if (run !== state.run) return;
        hunk.dels.forEach((el) => el.classList.add("collapsed"));
      }
      hunk.adds.forEach((el, i) => {
        el.style.transitionDelay = `${Math.min(i * 14, each * 0.5)}ms`;
        el.classList.remove("collapsed");
        el.classList.add("fresh");
      });
      await wait(hunk.dels.length ? each * 0.7 : each);
    }
    if (run !== state.run) return;
    await wait(260);
    follow.stop();
    if (run !== state.run) return;
    for (const el of code.querySelectorAll(".fresh")) {
      el.classList.remove("fresh");
      el.style.transitionDelay = "";
    }
    drawMinimap();
  }

  // Marcas de los cambios a lo largo del archivo, como un mapa para saltar a ellos.
  function drawMinimap() {
    mini.textContent = "";
    const lastLine = code.lastElementChild;
    if (!state.hunks.length || !lastLine || code.classList.contains("whole-new")) return;
    const total = lastLine.offsetTop + lastLine.offsetHeight;
    for (const hunk of state.hunks) {
      const parts = [["m-del", hunk.dels], ["m-add", hunk.adds]];
      for (const [cls, els] of parts) {
        if (!els.length) continue;
        const mark = document.createElement("button");
        mark.type = "button";
        mark.tabIndex = -1;
        mark.className = cls;
        const top = els[0].offsetTop;
        const height = els[els.length - 1].offsetTop + els[els.length - 1].offsetHeight - top;
        mark.style.top = `${(top / total) * 100}%`;
        mark.style.height = `${(height / total) * 100}%`;
        mark.addEventListener("click", () => {
          code.scrollTop = Math.max(0, top - code.clientHeight * 0.28);
        });
        mini.appendChild(mark);
      }
    }
  }

  // Lo que había antes de este paso: el mismo archivo en el commit anterior,
  // o el archivo de la versión anterior si este es el primer commit de una versión.
  function naturalBase(index, path) {
    const stop = stops[index];
    const change = stop.changes.find((c) => c.path === path);
    const previous = stops[index - 1];
    if (!change) return { text: data.blobs[stop.files[path]], hash: null, unchanged: true };
    if (change.status === "added" && !change.base) return { text: "", hash: null, isNew: true };
    const basePath = change.base || path;
    return { text: data.blobs[previous.files[basePath]], hash: previous.hash };
  }

  function showFile(index, path, run, animate) {
    const stop = stops[index];
    const target = data.blobs[stop.files[path]];
    const base = naturalBase(index, path);
    const related = state.shown && family(state.shown.path) === family(path);

    // Dentro del mismo archivo se parte de lo que está en pantalla, aunque se salten pasos.
    // Si no hay nada que transformar, se muestra el cambio propio de este paso sin animar.
    let source = base.text;
    let sourceHash = base.hash;
    let canAnimate = animate && !reducedMotion.matches;
    if (related && state.shown.text !== target) {
      source = state.shown.text;
      sourceHash = state.shown.hash;
    } else if (related) {
      canAnimate = false;
    }

    const { rows, hunks: count } = buildRows(source, target);
    plan.hidden = true;
    code.hidden = false;
    mini.hidden = false;
    mini.textContent = "";
    code.classList.toggle("whole-new", source === "" && target !== "");
    state.shown = { path, text: target, hash: stop.hash };

    renderHeader(stop, path, base, rows, sourceHash);

    if (!target) {
      code.innerHTML = '<p class="empty-file">Este archivo está vacío: solo sirve para que git conserve la carpeta.</p>';
      state.hunks = [];
      return Promise.resolve();
    }

    const scrollBefore = code.scrollTop;
    const samePlace = related && canAnimate;
    renderRows(rows, path, canAnimate);
    state.hunks = collectHunks(count);
    code.scrollTop = samePlace ? scrollBefore : 0;

    if (canAnimate && count) return playHunks(state.hunks, run);
    const first = state.hunks[0];
    if (first && source !== "") {
      const el = first.adds[0] || first.dels[0];
      code.scrollTop = Math.max(0, el.offsetTop - code.clientHeight * 0.28);
    }
    drawMinimap();
    return Promise.resolve();
  }

  function renderHeader(stop, path, base, rows, sourceHash) {
    const added = rows.filter((r) => r.type === "add").length;
    const removed = rows.filter((r) => r.type === "del").length;
    const total = rows.length - removed;
    const change = stop.changes.find((c) => c.path === path);
    const parts = [`<strong>${esc(path)}</strong>`];
    if (change && change.base) parts.push(`<span>evoluciona desde ${esc(change.base)}</span>`);
    else if (change && change.status === "added") parts.push("<span>archivo nuevo</span>");
    else if (!change) parts.push("<span>sin cambios en este paso</span>");
    if (added || removed) {
      if (!base.isNew) parts.push(`<span class="stat"><span class="plus">+${added}</span> <span class="minus">−${removed}</span></span>`);
      if (sourceHash) parts.push(`<span>respecto de ${esc(sourceHash)}</span>`);
    }
    if (total) parts.push(`<span>${total} líneas</span>`);
    $("vhead").innerHTML = parts.join("");
  }

  // ---------- Plan de versiones futuras ----------

  function piecesOf(versionId) {
    return data.lanes.flatMap((lane) => lane.pieces.filter((p) => p.version === versionId));
  }

  function taskList(tasks) {
    return `<ul class="task-list">${tasks.map((t) => `<li class="task${t.done ? " done" : ""}"><span class="box"></span><span>${inline(t.text)}</span></li>`).join("")}</ul>`;
  }

  function showPlan(stop) {
    const version = versionById[stop.version];
    const done = version.tasks.filter((t) => t.done).length;
    const lastCode = stops.filter((s) => s.kind === "commit").pop();
    $("vhead").innerHTML = "<strong>TODO.md</strong><span>hoja de ruta, esta versión todavía no tiene código</span>";
    code.hidden = true;
    mini.hidden = true;
    plan.hidden = false;
    plan.innerHTML = `
      <h2>Qué va a tener ${version.id}</h2>
      <div class="plan-pieces">${piecesOf(version.id).map((p) => `<span>${esc(p.name)}</span>`).join("")}</div>
      <div>${taskList(version.tasks)}</div>
      <p class="plan-count">${done} de ${version.tasks.length} tareas hechas</p>
      <button type="button" class="link-btn" id="back-to-code">Ver el último código (${lastCode.hash})</button>`;
    plan.scrollTop = 0;
    $("back-to-code").addEventListener("click", () => { pause(); go(stopIndexById[lastCode.id]); });
    return Promise.resolve();
  }

  // ---------- Panel de la historia ----------

  function fileRows(index) {
    const stop = stops[index];
    const changeOf = Object.fromEntries(stop.changes.map((c) => [c.path, c]));
    const paths = Object.keys(stop.files).sort((a, b) => Number(isAgent(b)) - Number(isAgent(a)) || a.localeCompare(b));
    const rows = paths.map((path) => {
      const change = changeOf[path];
      const selected = path === state.path;
      let stat = "";
      if (change) {
        if (change.status === "added" && !change.base) {
          stat = '<span class="tag">nuevo</span>';
        } else {
          const { rows: r } = buildRows(naturalBase(index, path).text, data.blobs[stop.files[path]]);
          stat = `<span class="file-stat"><span class="plus">+${r.filter((x) => x.type === "add").length}</span> <span class="minus">−${r.filter((x) => x.type === "del").length}</span></span>`;
        }
      }
      const cls = ["file", selected ? "selected" : "", change ? "" : "same"].join(" ");
      return `<li><button type="button" class="${cls}" data-path="${esc(path)}"${selected ? ' aria-current="true"' : ""}><span class="file-name">${esc(path)}</span>${stat}</button></li>`;
    });
    for (const c of stop.changes.filter((x) => x.status === "deleted")) {
      rows.push(`<li><span class="file gone"><span class="file-name">${esc(c.path)}</span><span class="file-stat">eliminado</span></span></li>`);
    }
    return rows.join("");
  }

  function renderStory(index) {
    const stop = stops[index];
    const version = versionById[stop.version];
    const isPlan = stop.kind === "plan";
    const siblings = stops.filter((s) => s.version === stop.version);
    let html = `
      <div class="story-head">
        <div class="story-ver${isPlan ? " is-plan" : ""}">${version.id}</div>
        <h2 class="story-title">${esc(version.title)}</h2>
        <p class="story-arc">${isPlan ? "Planificada" : "Implementada"}${version.arc ? ` · ${esc(version.arc)}` : ""}</p>
      </div>`;
    // Primero lo propio de este paso, que es lo que cambia al avanzar.
    if (!isPlan) {
      const position = siblings.indexOf(stop) + 1;
      const hash = stop.published && data.repository
        ? `<a href="${data.repository}/commit/${stop.sha}" target="_blank" rel="noopener">${stop.hash}</a>`
        : `<span class="hash">${stop.hash}</span>`;
      html += `
        <div class="commit">
          <span class="label">Commit ${position} de ${siblings.length} en ${version.id}</span>
          <span class="commit-msg">${esc(stop.message)}</span>
          <span class="commit-meta">${hash} · ${stop.date}</span>
        </div>
        <div class="story-block"><span class="label">Archivos</span><ul class="files">${fileRows(index)}</ul></div>`;
    }
    if (version.solves) html += `<div class="story-block"><span class="label">Resuelve</span><p>${inline(version.solves)}</p></div>`;
    if (version.adds) html += `<div class="story-block"><span class="label">Qué agrega</span><p>${inline(version.adds)}</p></div>`;
    if (version.leaves) html += `<div class="story-block leaves"><span class="label">Deja sin resolver</span><p>${inline(version.leaves)}</p></div>`;
    if (!isPlan && version.tasks.length) {
      html += `<details class="tasks story-block"><summary class="label">Tareas de la hoja de ruta</summary>${taskList(version.tasks)}</details>`;
    }
    $("story").innerHTML = html;
    $("story").scrollTop = 0;
  }

  // ---------- Mapa ----------

  function buildMap() {
    const map = $("map");
    map.style.setProperty("--cols", versions.length);
    const col = (versionId) => versions.findIndex((v) => v.id === versionId) + 2;
    let html = "";

    // Arcos: las versiones contiguas del mismo arco comparten una etiqueta.
    for (let i = 0; i < versions.length; ) {
      let end = i;
      while (end + 1 < versions.length && versions[end + 1].arc === versions[i].arc) end++;
      html += `<div class="arc" style="grid-column:${i + 2} / ${end + 3}">${esc(versions[i].arc || "Punto de partida")}</div>`;
      i = end + 1;
    }

    html += '<div class="legend">Cada cuadro es un paso</div>';
    for (const version of versions) {
      const own = stops.filter((s) => s.version === version.id);
      const ticks = own.map((s) => {
        const label = s.kind === "plan" ? `${s.id}: planificada` : `${s.hash}: ${s.message}`;
        return `<button type="button" class="tick${s.kind === "plan" ? " planned" : ""}" data-stop="${s.id}" title="${esc(label)}" aria-label="${esc(label)}"></button>`;
      }).join("");
      const target = own[own.length - 1];
      const lines = version.lines ? `<small>${version.lines} líneas</small>` : "";
      html += `<div class="ver-head${version.state === "plan" ? " plan-col" : ""}" data-version="${version.id}" style="grid-column:${col(version.id)}">
        <button type="button" class="ver-btn" data-stop="${target.id}">${version.id}${lines}</button>
        <div class="ticks">${ticks}</div>
      </div>`;
    }

    data.lanes.forEach((lane, i) => {
      const row = i + 3;
      html += `<div class="lane-name" style="grid-row:${row}">${esc(lane.name)}</div>`;
      html += `<div class="rail" style="grid-row:${row};grid-column:${col(lane.pieces[0].version)} / -1"><i></i></div>`;
      for (const piece of lane.pieces) {
        const target = stops.filter((s) => s.version === piece.version).pop();
        html += `<button type="button" class="chip" data-version="${piece.version}" data-stop="${target.id}" style="grid-row:${row};grid-column:${col(piece.version)}">${esc(piece.name)}</button>`;
      }
    });
    html += '<div class="cursor" id="cursor"></div>';
    map.innerHTML = html;

    map.addEventListener("click", (event) => {
      const target = event.target.closest("[data-stop]");
      if (!target) return;
      pause();
      go(stopIndexById[target.dataset.stop]);
    });
  }

  function updateMap(index) {
    const stop = stops[index];
    const number = versions.findIndex((v) => v.id === stop.version);
    const map = $("map");
    for (const chip of map.querySelectorAll(".chip")) {
      const at = versions.findIndex((v) => v.id === chip.dataset.version);
      chip.classList.toggle("past", at < number);
      chip.classList.toggle("now", at === number);
      chip.classList.toggle("future", at > number);
    }
    for (const head of map.querySelectorAll(".ver-head")) {
      head.classList.toggle("current", head.dataset.version === stop.version);
    }
    let currentTick = null;
    for (const tick of map.querySelectorAll(".tick")) {
      const at = stopIndexById[tick.dataset.stop];
      tick.classList.toggle("done", at < index);
      tick.classList.toggle("current", at === index);
      if (at === index) {
        tick.setAttribute("aria-current", "step");
        currentTick = tick;
      } else {
        tick.removeAttribute("aria-current");
      }
    }
    placeCursor(currentTick);
  }

  function placeCursor(tick) {
    const map = $("map");
    const box = map.getBoundingClientRect();
    const rect = tick.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - box.left;
    $("cursor").style.left = `${x}px`;
    $("cursor").style.top = `${rect.bottom - box.top - 4}px`; // nace en el cuadro, no tapa la etiqueta
    for (const rail of map.querySelectorAll(".rail")) {
      const r = rail.getBoundingClientRect();
      rail.firstElementChild.style.width = `${clamp(rect.left + rect.width / 2 - r.left, 0, r.width)}px`;
    }
    const scroller = $("map-scroll");
    if (scroller.scrollWidth > scroller.clientWidth) {
      const left = x - scroller.clientWidth / 2;
      scroller.scrollTo({ left, behavior: reducedMotion.matches ? "auto" : "smooth" });
    }
  }

  // ---------- Navegación ----------

  // Elige qué archivo mostrar: se queda en el actual si cambió en este paso,
  // y si no, va a lo que sí cambió, con el agente primero.
  function pickFile(stop) {
    const changed = stop.changes.filter((c) => c.status !== "deleted").map((c) => c.path);
    if (state.path && changed.includes(state.path)) return state.path;
    const agent = changed.find(isAgent);
    if (agent) return agent;
    if (changed.length) return changed[0];
    if (state.path && stop.files[state.path]) return state.path;
    return stop.agent || Object.keys(stop.files)[0];
  }

  function go(index, options = {}) {
    const next = clamp(index, 0, stops.length - 1);
    const stop = stops[next];
    const run = ++state.run;
    state.index = next;
    if (stop.kind === "commit") state.path = options.path || pickFile(stop);

    renderStory(next);
    updateMap(next);
    updateTransport();
    try { history.replaceState(null, "", `#${stop.id}`); } catch (e) { /* algunos navegadores lo bloquean en file:// */ }

    if (stop.kind === "plan") return showPlan(stop);
    return showFile(next, state.path, run, options.animate !== false);
  }

  function updateTransport() {
    const stop = stops[state.index];
    const where = stop.kind === "plan" ? `${stop.id} planificada` : `${stop.version} · ${stop.hash}`;
    $("position").textContent = `Paso ${state.index + 1} de ${stops.length} · ${where}`;
    $("first-btn").disabled = state.index === 0;
    $("prev-btn").disabled = state.index === 0;
    $("next-btn").disabled = state.index === stops.length - 1;
  }

  function setPlaying(playing) {
    state.playing = playing;
    $("play-label").textContent = playing ? "Pausar" : "Reproducir";
    $("play-icon").setAttribute("d", playing ? "M3 2h4v12H3zM9 2h4v12H9z" : "M4 2v12l10-6z");
  }

  function pause() { setPlaying(false); }

  async function play() {
    if (state.index === stops.length - 1) await go(0, { animate: false });
    setPlaying(true);
    await wait(500);
    while (state.playing && state.index < stops.length - 1) {
      const run = state.run + 1;
      await go(state.index + 1);
      if (!state.playing || run !== state.run) return;
      await wait((stops[state.index].kind === "plan" ? 3400 : 1500) / state.speed);
      if (run !== state.run) return;
    }
    pause();
  }

  // ---------- Inicio ----------

  function applyShowDeleted() {
    code.classList.toggle("show-del", $("show-deleted").checked);
    requestAnimationFrame(drawMinimap);
  }

  function bindControls() {
    $("first-btn").addEventListener("click", () => { pause(); go(0); });
    $("prev-btn").addEventListener("click", () => { pause(); go(state.index - 1); });
    $("next-btn").addEventListener("click", () => { pause(); go(state.index + 1); });
    $("play-btn").addEventListener("click", () => { state.playing ? pause() : play(); });
    $("show-deleted").addEventListener("change", applyShowDeleted);

    for (const button of document.querySelectorAll("[data-speed]")) {
      button.addEventListener("click", () => {
        state.speed = Number(button.dataset.speed);
        for (const other of document.querySelectorAll("[data-speed]")) {
          other.setAttribute("aria-pressed", String(other === button));
        }
      });
    }

    $("story").addEventListener("click", (event) => {
      const file = event.target.closest("[data-path]");
      if (!file) return;
      pause();
      state.shown = null; // cambiar de archivo muestra el cambio de este paso, no una mezcla
      go(state.index, { path: file.dataset.path });
    });

    document.addEventListener("keydown", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const tag = event.target.tagName;
      if (event.key === "ArrowRight") { pause(); go(state.index + 1); }
      else if (event.key === "ArrowLeft") { pause(); go(state.index - 1); }
      else if (event.key === " " && tag !== "BUTTON" && tag !== "INPUT" && tag !== "A" && tag !== "SUMMARY") {
        event.preventDefault();
        state.playing ? pause() : play();
      }
    });

    window.addEventListener("hashchange", () => {
      const at = stopIndexById[location.hash.slice(1)];
      if (at !== undefined && at !== state.index) { pause(); go(at); }
    });

    window.addEventListener("resize", () => {
      const tick = document.querySelector(".tick.current");
      if (tick) placeCursor(tick);
      drawMinimap();
    });

    if (data.repository) {
      const link = $("repo-link");
      link.href = data.repository;
      link.target = "_blank";
      link.rel = "noopener";
      link.hidden = false;
    }

    $("theme-btn").addEventListener("click", () => {
      const root = document.documentElement;
      const dark = root.dataset.theme
        ? root.dataset.theme === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      try { localStorage.setItem("lagent-theme", root.dataset.theme); } catch (e) { /* sin almacenamiento, el tema dura lo que la visita */ }
    });
  }

  try {
    const saved = localStorage.getItem("lagent-theme");
    if (saved) document.documentElement.dataset.theme = saved;
  } catch (e) { /* sin almacenamiento se usa el tema del sistema */ }

  buildMap();
  bindControls();
  const fromHash = stopIndexById[location.hash.slice(1)];
  go(fromHash === undefined ? 0 : fromHash, { animate: false });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      const tick = document.querySelector(".tick.current");
      if (tick) placeCursor(tick);
      drawMinimap();
    });
  }
})();

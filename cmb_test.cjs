
const stubEl = () => ({ innerHTML:"", children:[], textContent:"", className:"", style:{}, classList:{_s:new Set(),add(...c){c.forEach(x=>this._s.add(x))},remove(...c){c.forEach(x=>this._s.delete(x))},toggle(c,o){if(o===undefined)o=!this._s.has(c);o?this._s.add(c):this._s.delete(c);return o},contains(c){return this._s.has(c)}}, appendChild(c){this.children.push(c);return c}, addEventListener(){}, dataset:{}, offsetWidth:0 });
const els={};
globalThis.document={getElementById(id){return els[id]||(els[id]=stubEl())},querySelectorAll(){return []},querySelector(){return null},createElement(){return stubEl()}};
globalThis.window={addEventListener(){}};
globalThis.localStorage={getItem(){return null},setItem(){}};
const logs=[];
globalThis.console={log:(...a)=>logs.push(a.join(" ")), warn(){}, error(){}};

"use strict";

/* ================= Deutsch-Tipp-Trainer =================
   Einfacher Tipp-Trainer für die deutsche Sprache (QWERTZ).
   Modes: Anfänger-Wörter, Fortgeschrittene Wörter, Sätze.
   Statistiken: WPM, Genauigkeit, Fehler, Zeit.
   Rekorde werden pro Modus im localStorage gespeichert.
*/

/* ---------- Wortschatz ---------- */
const WORDS = {
  anfaenger: [
    "der","die","das","und","ich","du","er","es","man","sie","wir","ein","für","mit","auf","aus","an","in","zu","bei",
    "nach","vor","von","wie","was","wo","hier","da","nur","auch","schon","sehr","gut","mal","neu","kein","zwei","drei","vier","fünf",
    "Haus","Auto","Zeit","Tag","Nacht","Woche","Monat","Jahr","Kind","Vater","Mutter","Freund","Brot","Käse","Milch","Wasser",
    "Kaffee","Tee","Tisch","Stuhl","Fenster","Tür","Buch","Seite","Wort","Name","Stadt","Land","Schule","Arbeit","Spiel","Musik",
    "Film","Foto","Hand","Kopf","Auge","Bein","Herz","Platz","Weg","Straße","Sonne","Mond","Stern","Wetter","Frühling","Sommer","Herbst","Winter"
  ],
  fortgeschritten: [
    "wichtig","besonders","vielleicht","zusammen","überhaupt","Geschichte","Wissen","lernen","schreiben","tippen","Übung","Tastatur","Bildschirm","Programm","Internet","Telefon","Kamera","Manager","Kollege","Beruf",
    "Karriere","Gehalt","Rechnung","Zahlung","Preis","Markt","Bibliothek","Universität","Krankenhaus","Restaurant","Ergebnis","Erfahrung","Verantwortung","Geduld","Mühe","Freude","Meinung","Sprache","Übersetzung","Wörterbuch",
    "Rechtschreibung","Tippfehler","Fortschritt","Erfolg","Zukunft","Vergangenheit","Wochenende","Geburtstag","Jahreszeit","Landschaft","Theater","Konzert","Reise","Koffer","Bahnhof","Flughafen","Verbindung","Fahrzeug","Verkehr","Erklärung",
    "Frage","Antwort","Beweis","Ursache","Wirkung","Entscheidung","Begrenzung","Möglichkeit","Tatsache","Aufmerksamkeit"
  ]
};

const SENTENCES = [
  "Der schnelle braune Fuchs springt über den faulen Hund.",
  "Die Straße ist nachts ruhig und fast leer.",
  "Zwei Mädchen spielen im Park bei schönem Wetter.",
  "Übung macht den Meister, also tippe jeden Tag.",
  "Die Größe des Hauses hängt von der Familie ab.",
  "Die Übersetzung der Wörter war schwierig, aber möglich.",
  "Wenn du regelmäßig übst, wird dein Tempo schneller.",
  "Das Ergebnis der letzten Prüfung war sehr zufriedenstellend.",
  "Heißes Wetter macht das Tippen manchmal schwer.",
  "Meine Schwester wohnt in einer großen Stadt im Norden.",
  "Die Geschichte erzählt von einem müden Wanderer.",
  "Rechtschreibung ist mehr als eine Liste von Regeln.",
  "Zwanzig Wörter pro Minute sind ein realistisches Ziel.",
  "Am Wochenende lese ich Bücher über Geschichte und Technik.",
  "Deutsches Tippen gelingt besser, wenn man jeden Tag übt."
];

const MODES = [
  { id: "anfaenger",       label: "Anfänger",       hint: "Kurze, häufige Wörter" },
  { id: "fortgeschritten", label: "Fortgeschritten", hint: "Längere Wörter, Umlaute & ß" },
  { id: "saetze",          label: "Sätze",           hint: "Komplette Sätze" }
];

/* ---------- Tastatur (QWERTZ, deutsch) ---------- */
const KEY_ROWS = [
  ["Q","W","E","R","T","Z","U","I","O","P","ü"],
  ["A","S","D","F","G","H","J","K","L","ß","Ö","ä"],
  ["Y","X","C","V","B","N","M",",",".","-"],
  ["SHIFT","ALT","SPACE","ENTER"]
];

/* ---------- Zustand ---------- */
const state = {
  mode: "anfaenger",
  target: "",
  chars: [],
  pos: 0,
  correct: 0,
  mistakes: 0,
  startTime: 0,
  elapsed: 0,
  running: false,
  finished: false,
  timer: null
};

const $ = (id) => document.getElementById(id);

/* ---------- Tastatur zeichnen ---------- */
function buildKeyboard(){
  const kb = $("keyboard");
  kb.innerHTML = "";
  KEY_ROWS.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "krow";
    row.forEach((k) => {
      const key = document.createElement("div");
      key.className = "key";
      key.dataset.key = normKey(k);
      if (k === "SPACE"){ key.classList.add("xwide"); key.textContent = "Leertaste"; }
      else if (k === "SHIFT"){ key.classList.add("wide"); key.textContent = "⇧"; }
      else if (k === "ALT"){ key.classList.add("wide"); key.textContent = "Alt"; }
      else if (k === "ENTER"){ key.classList.add("wide"); key.textContent = "⏎"; }
      else { key.textContent = k; }
      rowEl.appendChild(key);
    });
    kb.appendChild(rowEl);
  });
}

function normKey(ch){
  if (ch === " ") return "SPACE";
  if (ch === "ß" || ch === "ẞ") return "SS";
  return String(ch).toUpperCase();
}

function keyEl(ch){
  const nk = normKey(ch);
  return document.querySelector('.key[data-key="' + nk + '"]');
}

function highlightNext(){
  document.querySelectorAll(".key.target").forEach((k) => k.classList.remove("target"));
  const ch = state.chars[state.pos];
  if (ch === undefined) return;
  const el = keyEl(ch);
  if (el) el.classList.add("target");
}

function flashKey(ch, ok){
  const el = keyEl(ch);
  if (!el) return;
  if (ok) el.classList.add("hit");
  else {
    el.classList.add("hit");
    el.style.background = "var(--key-err)";
    setTimeout(() => { el.style.background = ""; }, 180);
  }
  setTimeout(() => el.classList.remove("hit"), 140);
}

/* ---------- Zieltext ---------- */
function pickTarget(){
  if (state.mode === "saetze"){
    return SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
  }
  const bank = WORDS[state.mode];
  const pool = bank.slice();
  const picked = [];
  const count = Math.min(15, pool.length);
  while (picked.length < count){
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked.join(" ");
}

function renderDisplay(){
  const d = $("display");
  d.innerHTML = "";
  state.chars.forEach((ch, i) => {
    const s = document.createElement("span");
    s.className = "ch";
    s.textContent = ch === " " ? "\u00A0" : ch;
    d.appendChild(s);
  });
  updateClasses();
}

function updateClasses(){
  const spans = $("display").children;
  for (let i = 0; i < spans.length; i++){
    const s = spans[i];
    s.classList.remove("cur","done","wrong");
    if (i < state.pos) s.classList.add("done");
    else if (i === state.pos) s.classList.add("cur");
  }
  highlightNext();
}

function updateProgress(){
  const pct = state.chars.length ? (state.pos / state.chars.length) * 100 : 0;
  $("progress-fill").style.width = pct.toFixed(1) + "%";
}

/* ---------- Statistik ---------- */
function currentStats(){
  const minutes = state.elapsed / 60;
  const wpm = minutes > 0 ? Math.round(state.correct / 5 / minutes) : 0;
  const total = state.correct + state.mistakes;
  const acc = total > 0 ? Math.round((state.correct / total) * 100) : 100;
  return { wpm, acc, mistakes: state.mistakes, time: state.elapsed };
}

function renderStats(){
  const s = currentStats();
  $("stat-wpm").textContent = s.wpm;
  $("stat-acc").textContent = s.acc + " %";
  $("stat-mistakes").textContent = s.mistakes;
  $("stat-time").textContent = fmtTime(s.time);
}

function fmtTime(sec){
  sec = Math.floor(sec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ":" + String(s).padStart(2, "0");
}

function setStatus(text, cls){
  const el = $("status");
  el.textContent = text;
  el.className = "status" + (cls ? " " + cls : "");
}

/* ---------- Ablauf ---------- */
function startTimer(){
  if (state.timer) return;
  state.startTime = performance.now();
  state.timer = setInterval(() => {
    state.elapsed = (performance.now() - state.startTime) / 1000;
    renderStats();
  }, 200);
}

function stopTimer(){
  if (state.timer){ clearInterval(state.timer); state.timer = null; }
}

function resetRound(message){
  stopTimer();
  state.pos = 0; state.correct = 0; state.mistakes = 0; state.elapsed = 0;
  state.running = false; state.finished = false;
  $("overlay").classList.add("hidden");
  renderDisplay(); updateProgress(); renderStats();
  setStatus(message || "Drücke eine beliebige Taste, um zu beginnen.");
}

function newRound(){
  state.target = pickTarget();
  state.chars = Array.from(state.target);
  resetRound();
}

function finishRound(){
  stopTimer();
  state.elapsed = (performance.now() - state.startTime) / 1000;
  state.running = false; state.finished = true;
  renderStats(); updateProgress();
  const s = currentStats();
  const rec = loadRecord(state.mode);
  const isRecord = !rec || s.wpm > rec.wpm;
  if (isRecord) saveRecord(state.mode, s);
  $("res-wpm").textContent = s.wpm;
  $("res-acc").textContent = s.acc + " %";
  $("res-mistakes").textContent = s.mistakes;
  $("res-time").textContent = fmtTime(s.time);
  $("record-badge").classList.toggle("hidden", !isRecord);
  $("overlay").classList.remove("hidden");
  setStatus("Fertig!", "ok");
}

/* ---------- Rekorde ---------- */
function recKey(mode){ return "typtrainer-de:" + mode; }
function loadRecord(mode){
  try { const raw = localStorage.getItem(recKey(mode)); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
function saveRecord(mode, s){
  try { localStorage.setItem(recKey(mode), JSON.stringify(s)); } catch (e) {}
}

/* ---------- Tasteneingabe ---------- */
function processKey(key){
  const expected = state.chars[state.pos];
  if (key === expected){
    state.correct++;
    state.pos++;
    flashKey(key, true);
    if (state.pos >= state.chars.length){
      renderDisplay(); updateProgress(); finishRound(); return;
    }
    updateClasses(); renderStats();
  } else {
    state.mistakes++;
    flashKey(key, false);
    const pos = state.pos;
    const expected = state.chars[pos];
    // Erwartete Tastenkombination darstellen (Großbuchstaben → Shift+...)
    let needShift = false;
    let needAlt = false;
    let base = expected;
    if (/^[A-ZÄÖÜ]$/.test(expected)){ needShift = true; base = expected.toLowerCase(); }
    else if (expected === "ß"){ needShift = true; base = "ß"; }
    else if (expected === "Ä"){ needShift = true; needAlt = true; base = "a"; }
    else if (expected === "Ö"){ needShift = true; needAlt = true; base = "o"; }
    else if (expected === "Ü"){ needShift = true; needAlt = true; base = "u"; }
    // Mac: Umlaute meist mit gedrücktem Alt (Option) + Vokal, ß = Alt+s.
    // Zusätzliche Mac-Methode: Alt+u (Trema) loslassen, dann Vokal (äöü).
    let combo = (needShift ? "Shift+" : "") + (needAlt ? "Alt+" : "") + base;
    let tip = "";
    if (expected === "ä" || expected === "Ä") tip = " (Mac-Alternative: Alt+u loslassen, dann a)";
    else if (expected === "ö" || expected === "Ö") tip = " (Mac-Alternative: Alt+u loslassen, dann o)";
    else if (expected === "ü" || expected === "Ü") tip = " (Mac-Alternative: Alt+u loslassen, dann u)";
    else if (expected === "ß" || expected === "ẞ") tip = " (Mac: Alt+s bzw. Shift+Alt+s)";
    // Typfehler-Details in die Konsole schreiben (F12 → Konsole)
    console.log(
      "[Tippfehler]",
      "erwartet:", "»", expected, "«", "(" + combo + ")" + tip,
      "| gedrückt:", "»", key, "«",
      "| Position:", pos,
      "| Fehler-Nr.:", state.mistakes,
      "| Wort:", "»", state.target.split(" ").find(w => {
        let i = state.target.indexOf(w);
        return i <= pos && pos < i + w.length;
      }) || "?", "«",
      "| Ziel:", "»", state.target, "«"
    );
    const cur = $("display").children[state.pos];
    if (cur){
      cur.classList.remove("wrong");
      void cur.offsetWidth;
      cur.classList.add("wrong");
      setTimeout(() => cur.classList.remove("wrong"), 180);
    }
    renderStats();
  }
  updateProgress();
}

function onKeyDown(e){
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const key = e.key;

  // Tastenwiederholung ignorieren, damit gehaltene Tasten nicht mehrfach feuern
  if (e.repeat && !state.finished) return;

  if (key === "Escape"){
    if (state.running){ e.preventDefault(); resetRound("Abgebrochen — drücke eine Taste, um von vorn zu beginnen."); }
    else if (state.finished){ newRound(); }
    return;
  }

  if (state.finished){
    if (key === "Enter" || key === "r" || key === "R"){ e.preventDefault(); newRound(); }
    return;
  }

  if ((key === "r" || key === "R") && state.running){
    e.preventDefault();
    resetRound("Von vorn — drücke eine Taste, um zu beginnen.");
    return;
  }

  if (key.length > 1) return;

  if (key === " ") e.preventDefault();
  if (!state.running){ startTimer(); state.running = true; }
  processKey(key);
}

/* ---------- Modus ---------- */
function setMode(id){
  state.mode = id;
  document.querySelectorAll(".mode").forEach((b) => b.classList.toggle("active", b.dataset.mode === id));
  newRound();
}

function buildModes(){
  const nav = $("modes");
  MODES.forEach((m) => {
    const b = document.createElement("button");
    b.className = "mode" + (m.id === state.mode ? " active" : "");
    b.dataset.mode = m.id;
    b.type = "button";
    b.innerHTML = m.label + '<span style="display:block;font-size:10.5px;opacity:.7;margin-top:2px">' + m.hint + "</span>";
    b.addEventListener("click", () => setMode(m.id));
    nav.appendChild(b);
  });
}

/* ---------- Init ---------- */



let fail=0;
function assert(c,m){if(!c){console.log("FAIL:",m);fail++}else console.success?0:0;}

// Test combo computation by injecting expected chars
function calc(exp){
  let needShift=false, needAlt=false, base=exp;
  if(/^[A-ZÄÖÜ]$/.test(exp)){needShift=true;base=exp.toLowerCase()}
  else if(exp==="ß"){needShift=true;base="ß"}
  else if(exp==="Ä"){needShift=true;needAlt=true;base="a"}
  else if(exp==="Ö"){needShift=true;needAlt=true;base="o"}
  else if(exp==="Ü"){needShift=true;needAlt=true;base="u"}
  let combo=(needShift?"Shift+":"")+(needAlt?"Alt+":"")+base;
  return {combo, needAlt, needShift};
}

const rS=calc("S");  const rÄ=calc("Ä"); const rü=calc("ü");
console.log("S ->", rS.combo, need=false);
console.log("Ä ->", rÄ.combo);
console.log("ü ->", rü.combo);

// processKey: test the ERROR branch logs (uses real expected char)
state.mode="anfaenger"; state.target="Sonne"; state.chars=Array.from("Sonne");
state.pos=0; state.correct=0; state.mistakes=0; state.running=true; state.finished=false;
processKey("e"); // wrong (expected S)
console.log("--- logged error ---");
console.log(logs.join("
"));
const ok = logs.some(l=>l.includes("Shift+s") && l.includes("Sonne"));
console.log(ok ? "PASS: log includes Shift+s + Wort" : "FAIL: combo not in log");

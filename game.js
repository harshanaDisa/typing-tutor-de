"use strict";

/* ================= Regen-Spiel (Tipp-Spiel) =================
   Deutsche Wörter fallen von oben. Tippe sie korrekt ab,
   um sie abzuschießen, bevor sie den Boden erreichen!
*/

/* ---------- Wortschatz (deutsche Wörter zum Abschießen) ---------- */
// Einzelwörter (ohne Leerzeichen), damit sie sich flüssig tippen lassen.
// Die Wörter sind in Themen-Pakete gruppiert; der Nutzer kann per Dropdown
// wählen, aus welchem Paket die fallenden Wörter kommen („Alle“ = alles).
const RAIN_WORDS_PACKAGES = {
  alltag: [
    "Tag","Zeit","Haus","Nacht","Auto","Stadt","Buch","Schule","Straße","Fenster","Tisch","Stuhl",
    "Woche","Jahr","Monat","Freund","Familie","Computer","Telefon","Kamera","Musik","Sprache",
    "Erfolg","Zukunft","Reise","Bahnhof","Flugzeug"
  ],
  natur: [
    "Mond","Sonne","Baum","Wasser","Wald","Fluss","Meer","Berg","Wolke","Stern","Wetter",
    "Frühling","Sommer","Herbst","Winter","Blume","Feuer","Boot","Hund","Katze"
  ],
  essen: [
    "Kaffee","Brot","Milch","Käse","Apfel","Kuchen","Salat","Suppe","Honig","Butter","Ei","Fisch"
  ],
  familienkoerper: [
    "Mutter","Vater","Kind","Bruder","Schwester","Hand","Kopf","Auge","Bein","Herz","Nase","Mund"
  ],
  verben: [
    "lernen","schreiben","tippen","lesen","spielen","singen","tanzen","lachen","rennen",
    "springen","schwimmen","essen","trinken","schlafen","gehen","kommen","machen","sehen"
  ],
  adjektive: [
    "schnell","langsam","groß","klein","schön","wichtig","neu","gut","böse","klug","warm",
    "kalt","hell","dunkel","leicht","schwer","laut","leise","bunt","frisch"
  ]
};

// Gesamte Wortliste = Vereinigung aller Pakete (hintere Kompatibilität)
const RAIN_WORDS = Object.values(RAIN_WORDS_PACKAGES).reduce((a, b) => a.concat(b), []);

// Pakete für das Dropdown („Alle“ zuerst)
const RAIN_WORDS_OPTIONS = [
  { id: "alle",                 label: "Alle Wörter" },
  { id: "this-week-from-logo",  label: "logo! – diese Woche" },
  { id: "alltag",               label: "Alltag" },
  { id: "natur",                label: "Natur & Tiere" },
  { id: "essen",                label: "Essen & Trinken" },
  { id: "familienkoerper",      label: "Familie & Körper" },
  { id: "verben",               label: "Aktionen (Verben)" },
  { id: "adjektive",            label: "Adjektive" }
];

// aktuell gewähltes Paket (Standard: alle)
let rainWordSet = "alle";

// Wörter aus der aktuellen logo!-Sendung extrahieren.
// LOGO_SENTENCES liegt in app.js (wird erst nach game.js geladen) –
// deshalb erst bei Bedarf berechnen und cachen.
let _logoWordsCache = null;
function rainLogoWords(){
  if (_logoWordsCache) return _logoWordsCache;
  const src = (typeof LOGO_SENTENCES !== "undefined") ? LOGO_SENTENCES : [];
  const found = new Set();
  const re = /[A-Za-zÄÖÜäöüß'][A-Za-zÄÖÜäöüß'-]*/g;
  for (const s of src){
    const toks = (s.match(re) || []);
    for (const t of toks){
      const w = t.replace(/'/g, "").replace(/-/g, "").toLowerCase();
      if (w.length >= 3) found.add(w);
    }
  }
  _logoWordsCache = Array.from(found);
  return _logoWordsCache;
}

// Liefert die Wortliste des gewählten Pakets (für Zustandsschutz)
function rainCurrentWords(){
  if (rainWordSet === "this-week-from-logo") return rainLogoWords();
  const bank = RAIN_WORDS_PACKAGES[rainWordSet] || RAIN_WORDS;
  return bank.length ? bank : RAIN_WORDS;
}


/* ---------- Spielzustand ---------- */
const RainGame = {
  words: [],        // fallende Wörter
  particles: [],    // Explosions-Partikel
  score: 0,
  lives: 5,
  level: 1,
  wordsShot: 0,
  activeIdx: -1,    // Index des aktuell zu tippenden Wortes (Auswahl)
  difficulty: "medium", // leicht/mittel/schwer
  speedMult: 1,
  running: false,
  ready: false,
  picking: false,
  over: false,
  startedAt: 0,
  spawnTimer: 0,
  rafId: null,
  lastTs: 0,
  // wird pro Runde gesetzt
  canvas: null,
  ctx: null,
  W: 0, H: 0
};

function rainReset(){
  const g = RainGame;
  g.words = []; g.particles = []; g.score = 0; g.lives = 5; g.level = 1;
  g.wordsShot = 0; g.activeIdx = -1; g.running = false; g.ready = false; g.picking = false; g.over = false;
  g.difficulty = "medium"; g.speedMult = 1;
  g.spawnTimer = 0;
  g.resizeCount = 0;
  g.startedAt = performance.now();
}

// Startbildschirm: Demo-Animation simuliert das Spielgeschehen,
// bis der Nutzer "Starten" (oder eine Taste) drückt.
function rainStart(){
  const g = RainGame;
  rainReset();
  g.ready = true;
  const cv = document.getElementById("rain-canvas");
  g.canvas = cv;
  g.ctx = cv.getContext("2d");
  rainSetupCanvasEvents();
  rainResizeCanvas();
  g.lastTs = performance.now();
  g.demoTypeTimer = 0;
  g.demoSpawnTimer = 0.4;
  // Sofort sichtbare Wörter für die Demo-Animation einblenden
  for (let i = 0; i < 4; i++) rainDemoSpawn();
  // Demo-Loop starten (simuliert fallende + abgeschossene Wörter)
  g.rafId = requestAnimationFrame(rainDemoLoop);
  // Nameingabe für die Bestenliste zurücksetzen
  const nameEl = document.getElementById("rain-lb-name");
  if (nameEl){ nameEl.value = ""; nameEl.blur(); }
  const qEl = document.getElementById("rain-lb-qualified");
  if (qEl) qEl.classList.add("hidden");
  rainUpdateHud();
  const btn = document.getElementById("rain-start-btn");
  if (btn) btn.classList.remove("hidden");
  setStatus("Bereit? Drücke Starten oder eine beliebige Taste!", "warn");
}

// Demo: Wörter fallen und werden wie von selbst getippt und abgeschossen.
// Läuft nur auf dem Startbildschirm; keine Punkte/Leben.
function rainDemoLoop(ts){
  const g = RainGame;
  if (!g.ready){ g.rafId = null; return; }
  g.rafId = requestAnimationFrame(rainDemoLoop);
  let dt = Math.min((ts - g.lastTs) / 1000, 0.05);
  if (!(dt > 0)) dt = 0.016;
  g.lastTs = ts;

  // Wörter regelmäßig spawnen (max. 5 gleichzeitig fürs Demo)
  g.demoSpawnTimer -= dt;
  if (g.demoSpawnTimer <= 0 && g.words.length < 5){
    rainDemoSpawn();
    g.demoSpawnTimer = 0.8;
  }

  // fallen lassen
  for (const w of g.words) w.y += w.speed * dt;

  // Wörter simulieren: automatisch Zeichen tippen (gemächliches Tempo,
  // damit die Wörter sichtbar herunterfallen und abgeschossen werden)
  g.demoTypeTimer -= dt;
  if (g.demoTypeTimer <= 0){
    const idx = rainActiveIdx();
    if (idx >= 0){
      const w = g.words[idx];
      // erst tippen, wenn das Wort sichtbar ist (im Canvas)
      if (w.y >= 4){
        w.typed++;
        g.activeIdx = idx;
        if (w.typed >= w.text.length){
          rainBurst(w);
          g.words.splice(idx, 1);
          g.activeIdx = -1;
        }
        g.demoTypeTimer = 0.28;
      } else {
        g.demoTypeTimer = 0.05; // kurz warten, bis das Wort im Bild ist
      }
    } else {
      g.demoTypeTimer = 0.2;
    }
  }

  // untere Wörter entfernen (ohne Leben zu kosten) und Partikel bewegen
  for (let i = g.words.length - 1; i >= 0; i--){
    if (g.words[i].y >= g.H - 40){
      g.words.splice(i, 1);
      if (i === g.activeIdx) g.activeIdx = -1;
    }
  }
  for (const p of g.particles){
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy += 160 * dt;
    p.life -= dt;
  }
  g.particles = g.particles.filter(p => p.life > 0);

  rainDraw();
}

// Schwierigkeitsauswahl zeigen (nach Klick auf "Starten")
function rainShowDifficulty(){
  const g = RainGame;
  g.picking = true;
  $("rain-diff-overlay").classList.remove("hidden");
  setStatus("Wähle die Schwierigkeit (1 / 2 / 3).", "warn");
}
function rainHideDifficulty(){
  const g = RainGame;
  g.picking = false;
  $("rain-diff-overlay").classList.add("hidden");
}

// Schwierigkeit anwenden: bestimmt Fallgeschwindigkeit & Anzahl Leben
function rainSetDifficulty(d){
  const g = RainGame;
  g.difficulty = d;
  if (d === "easy"){ g.lives = 7; g.speedMult = 0.7; }
  else if (d === "hard"){ g.lives = 3; g.speedMult = 1.5; }
  else { g.lives = 5; g.speedMult = 1; }
}

// Eigentlicher Spielbeginn: Wörter spawnen und der Loop läuft.
function rainBegin(difficulty){
  const g = RainGame;
  if (g.ready === false) return;
  if (difficulty) rainSetDifficulty(difficulty);
  else rainSetDifficulty("medium"); // Sicherheit: ohne Auswahl = mittel
  rainHideDifficulty();
  g.ready = false;
  g.running = true;
  g.lastTs = performance.now();
  g.spawnTimer = 0.6;
  g.wordsShot = 0;
  // Demo-Wörter verwerfen und mit einem sauberen Spiel beginnen
  g.words = [];
  g.particles = [];
  rainResetKeepDifficulty();
  for (let i = 0; i < 3; i++) rainSpawn();
  // Loop über requestAnimationFrame starten (nicht direkt aufrufen –
  // sonst ist ts undefined und dt wird NaN)
  g.rafId = requestAnimationFrame(rainLoop);
  const btn = document.getElementById("rain-start-btn");
  if (btn) btn.classList.add("hidden");
  rainUpdateHud();
  setStatus("Los! Tippe die Wörter ab, bevor sie unten ankommen!", "ok");
}

// Reset, der die gewählte Schwierigkeit nicht überschreibt
function rainResetKeepDifficulty(){
  const g = RainGame;
  g.words = []; g.particles = []; g.score = 0; g.level = 1;
  g.wordsShot = 0; g.activeIdx = -1; g.spawnTimer = 0; g.resizeCount += 1;
}

function rainStop(){
  const g = RainGame;
  g.running = false;
  g.ready = false;
  if (g.rafId){ cancelAnimationFrame(g.rafId); g.rafId = null; }
}

// Canvas auf die tatsächliche Größe setzen; fällt auf die Attribut-Maße
// (800x380) zurück, falls das Layout noch nicht berechnet wurde.
function rainResizeCanvas(){
  const g = RainGame;
  const cv = g.canvas;
  if (!cv) return;
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth || 800;
  const h = cv.clientHeight || 380;
  // Spiellogik arbeitet in CSS-Pixeln (g.W/g.H),
  // nur der Backing-Store des Canvas wird in Gerätepixeln angelegt.
  g.W = w;
  g.H = h;
  cv.width = w * dpr;
  cv.height = h * dpr;
  g.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function rainSpawn(){
  const g = RainGame;
  if (g.words.length >= 6) return;
  const words = rainCurrentWords();
  const txt = words[Math.floor(Math.random() * words.length)];
  // ruhigere Fallgeschwindigkeit (ca. halb so schnell wie vorher);
  // Schwierigkeit skaliert die Geschwindigkeit
  const speed = (16 + g.level * 2.5 + Math.random() * 10) * g.speedMult;
  const w = g.ctx ? g.ctx.measureText(txt).width : txt.length * 12;
  const x = Math.random() * Math.max(40, g.W - w - 60) + 20;
  g.words.push({
    text: txt,
    x, y: -30,
    speed,
    typed: 0,       // pro Wort: korrekt getippte Zeichen
    done: false
  });
}

// Demo-Spawn: Wörter kommen bereits sichtbar ins Bild (gestaffelte y-Positionen)
function rainDemoSpawn(){
  const g = RainGame;
  if (g.words.length >= 5) return;
  const words = rainCurrentWords();
  const txt = words[Math.floor(Math.random() * words.length)];
  const speed = 34 + g.level * 3 + Math.random() * 18;
  const w = g.ctx ? g.ctx.measureText(txt).width : txt.length * 12;
  const x = Math.random() * Math.max(40, g.W - w - 60) + 20;
  // gestaffelte Startposition: je mehr Wörter schon da sind, desto tiefer
  const y = -10 + g.words.length * 34;
  g.words.push({
    text: txt,
    x, y,
    speed,
    typed: 0,
    done: false
  });
}

function rainLoop(ts){
  const g = RainGame;
  if (!g.running) return;
  g.rafId = requestAnimationFrame(rainLoop);
  // Größe in den ersten Frames nachziehen, falls das Layout nach dem
  // Umschalten der Ansicht erst später fertig war
  if (g.resizeCount === undefined || g.resizeCount < 5){
    rainResizeCanvas();
    g.resizeCount = (g.resizeCount || 0) + 1;
  }
  let dt = Math.min((ts - g.lastTs) / 1000, 0.05);
  if (!(dt > 0)) dt = 0.016; // Schutz gegen NaN/undefined beim ersten Frame
  g.lastTs = ts;

  // Spawn
  g.spawnTimer -= dt;
  if (g.spawnTimer <= 0){
    rainSpawn();
    g.spawnTimer = Math.max(0.4, 1.8 - g.level * 0.15);
  }

  // Wörter fallen
  for (const w of g.words) w.y += w.speed * dt;

  // Partikel bewegen
  for (const p of g.particles){
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy += 160 * dt;
    p.life -= dt;
  }
  g.particles = g.particles.filter(p => p.life > 0);

  // Wörter am Boden entfernen -> Leben verlieren
  for (let i = g.words.length - 1; i >= 0; i--){
    if (g.words[i].y >= g.H - 40){
      if (i === g.activeIdx) g.activeIdx = -1;
      g.words.splice(i, 1);
      g.lives--;
      g.wordsShot = Math.max(0, g.wordsShot - 1);
      rainUpdateHud();
      setStatus("Ein Wort ist unten angekommen – ein Leben verloren!", "err");
      if (g.lives <= 0){ rainGameOver(); return; }
    }
  }

  rainUpdateHud();
  rainDraw();
}

// Aktives Wort: das unterste (größte y) – immer hervorgehoben
function rainActiveIdx(){
  const g = RainGame;
  let best = -1;
  for (let i = 0; i < g.words.length; i++){
    if (best < 0 || g.words[i].y > g.words[best].y) best = i;
  }
  return best;
}

function rainDraw(){
  const g = RainGame;
  if (!g.ctx) return;
  const ctx = g.ctx;
  ctx.clearRect(0, 0, g.W, g.H);

  // Auswahl: zuletzt ausgewähltes Wort; sonst das unterste (dringendste)
  if (g.activeIdx < 0 || !g.words[g.activeIdx]){
    g.activeIdx = rainActiveIdx();
  }

  // Bodenlinie
  ctx.strokeStyle = "rgba(255,196,107,.35)";
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, g.H - 40);
  ctx.lineTo(g.W, g.H - 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // Wörter
  for (let i = 0; i < g.words.length; i++){
    const w = g.words[i];
    const isActive = (i === g.activeIdx);
    ctx.font = (isActive ? "700 " : "500 ") + Math.min(26, 18 + g.level) + "px ui-monospace, Menlo, monospace";
    const tw = ctx.measureText(w.text).width;
    if (isActive){
      // aktives Wort: getippte Zeichen grün, Rest hell
      const typed = w.text.slice(0, w.typed);
      const rest = w.text.slice(w.typed);
      const tw1 = ctx.measureText(typed).width;
      ctx.fillStyle = "#3ecf8e";
      ctx.fillText(typed, w.x, w.y);
      ctx.fillStyle = "#e8ecf4";
      ctx.fillText(rest, w.x + tw1, w.y);
      // Umrandung / Glow
      ctx.strokeStyle = "rgba(62,207,142,.55)";
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x - 6, w.y - 22, tw + 12, 30);
      ctx.lineWidth = 1;
    } else {
      ctx.fillStyle = "#8b93a7";
      ctx.fillText(w.text, w.x, w.y);
    }
  }

  // Partikel
  for (const p of g.particles){
    ctx.globalAlpha = Math.max(0, p.life / 0.8);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Partikelexplosion an einem Wort (wird beim Abschießen und in der Demo genutzt)
function rainBurst(w){
  const g = RainGame;
  const cx = w.x + (g.ctx ? g.ctx.measureText(w.text).width / 2 : 0);
  for (let i = 0; i < 24; i++){
    g.particles.push({
      x: cx,
      y: w.y,
      vx: (Math.random() - 0.5) * 220,
      vy: (Math.random() - 0.7) * 220,
      life: 0.4 + Math.random() * 0.5,
      color: ["#3ecf8e", "#ffc46b", "#6ea8fe"][Math.floor(Math.random() * 3)],
      size: 2 + Math.random() * 3
    });
  }
}

function rainShoot(idx){
  const g = RainGame;
  const w = g.words[idx];
  if (!w) return;
  rainBurst(w);
  g.words.splice(idx, 1);
  g.wordsShot++;
  g.score += 10 + w.text.length * 2 + g.level * 2;
  if (g.wordsShot % 10 === 0) g.level++;
  g.activeIdx = -1; // Auswahl zurücksetzen – nächster Tastendruck wählt neu
  rainUpdateHud();
  setStatus("Getroffen! " + g.wordsShot + " Wörter abgeschossen", "ok");
}

function rainGameOver(){
  const g = RainGame;
  g.running = false;
  g.over = true;
  if (g.rafId){ cancelAnimationFrame(g.rafId); g.rafId = null; }
  const rec = rainLoadBest();
  const isRecord = g.score > rec;
  if (isRecord) rainSaveBest(g.score);
  // Prüfen, ob der Score in die Bestenliste kommt → Namenseingabe anzeigen
  if (rainScoreQualifies(g.score)){
    $("rain-lb-qualified").classList.remove("hidden");
    $("rain-lb-msg").textContent = "Rang " + (rainRankOf(g.score) >= 0 ? rainRankOf(g.score) : Math.min(rainGetLeaderboard().length + 1, RAIN_LB_MAX)) +
      " von " + RAIN_LB_MAX + " – Name eingeben oder " + RAIN_LB_MAX + " wählen:";
  } else {
    $("rain-lb-qualified").classList.add("hidden");
  }
  $("rain-res-score").textContent = g.score;
  $("rain-res-words").textContent = g.wordsShot;
  $("rain-res-level").textContent = g.level;
  $("rain-res-best").textContent = Math.max(rec, g.score);
  $("rain-record-badge").classList.toggle("hidden", !isRecord);
  rainRenderLeaderboard($("rain-lb-list"), g.score);
  $("rain-overlay").classList.remove("hidden");
  setStatus("Spiel vorbei!", "err");
}

// Bestenliste in ein Element rendern; hebt den Score des aktuellen Spiels hervor.
function rainRenderLeaderboard(el, highlightScore){
  if (!el) return;
  const lb = rainGetLeaderboard();
  const heads = "<table class='lb-table'><thead><tr><th>#</th><th>Name</th><th>Punkte</th><th>Level</th></tr></thead><tbody>";
  const tails = "</tbody></table>";
  if (lb.length === 0){
    el.innerHTML = heads + "<tr><td colspan='4' class='lb-empty'>Bisher keine Einträge – sei die/der Erste!</td></tr>" + tails;
    return;
  }
  const rows = lb.map(function(e, i){
    const me = (highlightScore !== undefined && e.score === highlightScore) ? " class='lb-me'" : "";
    return "<tr" + me + "><td>" + (i + 1) + "</td><td>" + escapeHtml(String(e.name || "Spieler").substring(0, 16)) + "</td><td>" + e.score + "</td><td>" + escapeHtml(String(e.difficulty || "mittel")) + "</td></tr>";
  }).join("");
  el.innerHTML = heads + rows + tails;
}

// Name des Gewinners speichern und Bestenliste aktualisieren
function rainSubmitScore(name){
  const g = RainGame;
  const safe = (name || "Spieler").trim().substring(0, 16) || "Spieler";
  rainSaveLeaderboard({
    name: safe,
    score: g.score,
    words: g.wordsShot,
    level: g.level,
    difficulty: g.difficulty
  });
  rainRenderLeaderboard($("rain-lb-list"), g.score);
  $("rain-lb-qualified").classList.add("hidden");
  setStatus("In der Bestenliste gespeichert!", "ok");
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, function(c){
    return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
  });
}

function rainUpdateHud(){
  const g = RainGame;
  $("rain-score").textContent = g.score;
  $("rain-lives").textContent = "♥".repeat(Math.max(0, g.lives));
  $("rain-level").textContent = g.level;
}

/* ---------- Tasteneingabe ---------- */
function rainKey(key){
  const g = RainGame;
  if (g.over){
    if (key === "Enter" || key === "r" || key === "R" || key === " "){
      $("rain-overlay").classList.add("hidden");
      rainStart(); // zurück zum Startbildschirm
    }
    return true;
  }
  if (g.picking){
    // Schwierigkeit per Taste wählen: 1=leicht, 2=mittel, 3=schwer
    const d = key === "1" ? "easy" : key === "2" ? "medium" : key === "3" ? "hard" : null;
    if (d){ rainBegin(d); }
    return true;
  }
  if (g.ready){
    // beliebige Taste öffnet die Schwierigkeitsauswahl
    rainShowDifficulty();
    return true;
  }
  if (!g.running) return false;

  if (key.length > 1) return false; // keine Sondertasten
  if (key === " ") { return true; } // Leertaste: nichts, aber verbrauchen

  // Steuerung: der getippte Buchstabe wählt das Wort aus, dessen nächster
  // Buchstabe passt. Bevorzugt das aktuell ausgewählte Wort; sonst das
  // dringendste (unterste) Wort, dessen nächster Buchstabe dem Tastendruck
  // entspricht.
  let target = -1;
  for (let i = 0; i < g.words.length; i++){
    const w = g.words[i];
    const expected = w.text[w.typed];
    if (expected === key){
      if (i === g.activeIdx){ target = i; break; } // aktuelles Wort weiterführen
      if (target < 0) target = i;
      else if (w.y > g.words[target].y) target = i; // dringenderes Wort
    }
  }
  if (target < 0){
    // kein Wort passt auf diesen Buchstaben
    const cur = g.activeIdx >= 0 ? g.words[g.activeIdx] : null;
    setStatus("Kein Wort beginnt mit " + displayKeyRain(key) +
      (cur ? " – " + cur.text + " erwartet " + displayKeyRain(cur.text[cur.typed]) : ""), "err");
    return true;
  }

  const w = g.words[target];
  w.typed++;
  g.activeIdx = target;
  if (w.typed >= w.text.length){
    rainShoot(target);
  } else {
    rainUpdateHud();
    setStatus("Weiter: " + w.text.slice(w.typed) + " (" + g.words.filter(x=>!x.done).length + " Wörter)", "ok");
  }
  return true;
}

// Für die Anzeige in Meldungen
function displayKeyRain(k){
  if (k === " ") return "␣ (Leertaste)";
  return String(k);
}

/* ---------- Rekord ---------- */
function rainLoadBest(){
  try { const raw = localStorage.getItem("typtrainer-de-rain-best"); return raw ? parseInt(raw, 10) || 0 : 0; }
  catch (e) { return 0; }
}
function rainSaveBest(s){
  try { localStorage.setItem("typtrainer-de-rain-best", String(s)); } catch (e) {}
}

/* ---------- Bestenliste (Leaderboard) ---------- */
const RAIN_LB_KEY = "typtrainer-de-rain-leaderboard";
const RAIN_LB_MAX = 10;

function rainGetLeaderboard(){
  try {
    const raw = localStorage.getItem(RAIN_LB_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter(e => e && typeof e.score === "number").slice(0, RAIN_LB_MAX);
  } catch (e) { return []; }
}

function rainSaveLeaderboard(entry){
  try {
    const list = rainGetLeaderboard();
    list.push({
      name: entry.name || "Spieler",
      score: entry.score | 0,
      words: entry.words | 0,
      level: entry.level | 0,
      difficulty: entry.difficulty || "mittel",
      date: entry.date || new Date().toISOString()
    });
    list.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
    const trimmed = list.slice(0, RAIN_LB_MAX);
    localStorage.setItem(RAIN_LB_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch (e) { return rainGetLeaderboard(); }
}

// Liefert die Breite (Anzahl an Punkten), die ein Score mindestens braucht,
// um in die Bestenliste zu kommen.
function rainScoreQualifies(score){
  const lb = rainGetLeaderboard();
  if (lb.length < RAIN_LB_MAX) return true;
  return score > lb[lb.length - 1].score;
}

// Aktuellen Score als Platz (1-basiert) in die Bestenliste zurückliefern,
// oder -1 wenn er nicht reinkommt.
function rainRankOf(score){
  const lb = rainGetLeaderboard();
  for (let i = 0; i < lb.length; i++){
    if (score >= lb[i].score) return i + 1;
  }
  return -1; // nicht in den Top-10
}

/* ---------- Maussteuerung: Wort per Klick auswählen ---------- */
function rainSetupCanvasEvents(){
  const cv = document.getElementById("rain-canvas");
  if (!cv || cv._rainEvents) return;
  cv._rainEvents = true;
  cv.addEventListener("click", (e) => {
    const g = RainGame;
    if (!g.running || g.over) return;
    const rect = cv.getBoundingClientRect();
    // Zeichenkoordinaten sind CSS-Pixel (Kontext ist um dpr skaliert)
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Wort auswählen, dessen Zeichenbereich getroffen wurde
    let best = -1, bestDist = Infinity;
    for (let i = 0; i < g.words.length; i++){
      const w = g.words[i];
      const tw = g.ctx.measureText(w.text).width;
      const x0 = w.x, x1 = w.x + tw;
      const y0 = w.y - 24, y1 = w.y + 4;
      if (mx >= x0 && mx <= x1 && my >= y0 && my <= y1){
        const d = Math.abs(my - w.y);
        if (d < bestDist){ bestDist = d; best = i; }
      }
    }
    if (best >= 0){
      g.activeIdx = best;
      setStatus("Ausgewählt: " + g.words[best].text, "ok");
    }
  });
}

/* ---------- Init ---------- */
// Die Tasteneingabe wird über app.js geroutet (state.mode === "regen"),
// damit sich die Handler nicht doppelt in die Quere kommen.

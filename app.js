"use strict";

/* ================= Deutsch-Tipp-Trainer =================
   Einfacher Tipp-Trainer für die deutsche Sprache (QWERTZ).
   Modes: Anfänger-Wörter, Fortgeschrittene Wörter, Sätze.
   Statistiken: WPM, Genauigkeit, Fehler, Zeit.
   Rekorde werden pro Modus im localStorage gespeichert.
*/

/* ---------- Wortschatz ---------- */
const WORDS = {
  // Anfänger: grammatikalisch korrekte Nominalphrasen (Artikel + Nomen),
  // damit der Tipp-Text lesbar ist statt zufälliger Wortsalat.
  anfaenger: [
    "der Tag","der Mond","der Stern","der Weg","der Tisch","der Stuhl","der Kopf","der Kaffee","der Tee","der Name",
    "der Platz","der Sommer","der Herbst","der Winter","der Frühling","der Freund","der Film","der Kuchen","der Hafen","der Wald",
    "die Zeit","die Nacht","die Woche","die Stadt","die Schule","die Arbeit","die Musik","die Hand","die Straße","die Sonne",
    "die Tür","die Seite","die Milch","die Mutter","die Blume","die Insel","die Tasche","die Lampe","die Wolke","die Brücke",
    "das Haus","das Auto","das Jahr","das Kind","das Brot","das Wasser","das Fenster","das Buch","das Wort","das Land",
    "das Spiel","das Foto","das Auge","das Bein","das Herz","das Wetter","das Meer","das Feuer","das Boot","das Papier"
  ],
  // Fortgeschritten: grammatikalisch korrekte Adjektiv-Nomen-Phrasen
  // mit korrekter Endung (die wichtig-e Frage, der schnelle Zug …).
  fortgeschritten: [
    "wichtige Frage","wichtiger Termin","wichtiges Ergebnis","interessante Geschichte","interessanter Beruf","interessantes Buch",
    "schnelle Verbindung","schneller Zug","schnelles Internet","neue Tastatur","neuer Computer","neues Programm",
    "deutsche Sprache","deutscher Text","deutsches Wörterbuch","lange Reise","langer Brief","langes Gespräch",
    "große Stadt","großer Erfolg","großes Projekt","kleine Bibliothek","kleiner Markt","kleines Dorf",
    "schöne Landschaft","schöner Urlaub","schönes Wetter","freundliche Kollegin","freundlicher Kollege","freundliches Team",
    "spannende Geschichte","spannender Film","spannendes Spiel","gute Erfahrung","guter Fortschritt","gutes Ergebnis",
    "schwierige Entscheidung","schwieriger Weg","schwieriges Thema","klare Antwort","klarer Beweis","klares Ziel",
    "starke Verbindung","starker Erfolg","starkes Team","ruhige Straße","ruhiger Bahnhof","ruhiges Dorf"
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

const LOGO_SENTENCES = [
  "Er kann es kaum glauben: Johannes Liebmann hat am Wochenende etwas geschafft, das wirklich außergewöhnlich ist.",
  "Und nicht nur er.",
  "Viele deutsche Sportlerinnen und Sportler waren total erfolgreich.",
  "Und damit hallo bei \"logo!\".",
  "Manche Menschen kommen nach Deutschland, um Schutz zu suchen.",
  "Zum Beispiel, weil in ihrem Heimatland Krieg herrscht und sie dort nicht sicher sind.",
  "Doch nicht alle dürfen dauerhaft hier bleiben.",
  "Wenn entschieden wird, dass sie in ihr Heimatland zurückkehren müssen, bekommen sie dabei manchmal Unterstützung.",
  "Und dazu gibt es jetzt neue Zahlen: In den ersten sechs Monaten dieses Jahres sind fast 9300 Menschen mit dieser Hilfe freiwillig in ihr Heimatland zurückgereist.",
  "Und das sind mehr als davor.",
  "12 Jahre lang herrschte Krieg in Syrien.",
  "Mehrere Millionen Menschen verließen das Land in dieser Zeit, viele kamen nach Deutschland, um in Sicherheit zu leben.",
  "Vor rund anderthalb Jahren endete der Krieg in Syrien.",
  "Auch wenn ein Leben in dem zerstörten Land schwierig ist, ist es zumindest sehr viel sicherer geworden.",
  "Viele Geflüchtete aus Syrien sollen deshalb wieder zurückkehren.",
  "Das gleiche gilt für Geflüchtete aus anderen Ländern.",
  "Ein Teil von ihnen will trotzdem so lange wie möglich oder für immer in Deutschland bleiben.",
  "Unter bestimmten Umständen müssten sie dann irgendwann dazu gezwungen werden, Deutschland zu verlassen.",
  "Damit diese Geflüchteten Deutschland freiwillig verlassen, bezahlt die Bundesregierung ihnen seit einiger Zeit die Ausreise aus Deutschland.",
  "Außerdem bekommen sie noch weiteres Geld als Starthilfe.",
  "Immer mehr Geflüchtete verlassen so Deutschland.",
  "Sand, so weit man gucken kann.",
  "Das hier ist die Sahara, die größte heiße, trockene Wüste der Welt.",
  "Und die ist etwas größer geworden.",
  "Es gibt einige extrem trockene Gebiete weltweit.",
  "Und das kann ein Problem sein.",
  "Und deswegen treffen sich ab heute Fachleute und Politikerinnen und Politiker, um nach Lösungen zu suchen.",
  "Und zwar in der Mongolei in Asien.",
  "Dort gibt es ein Projekt, das dabei helfen soll, die Ausbreitung von Wüsten zu stoppen.",
  "Chantsal kümmert sich hier um das Wassermelonenfeld.",
  "Dabei ist es für Menschen in der Mongolei eher unüblich Obst und Gemüse anzubauen.",
  "Denn der Großteil hier sind Nomaden - sie ziehen mit Vieh-Herden immer wieder von einem Ort zum nächsten.",
  "Wüstenbildung ist ein zentrales Problem unseres Landes.",
  "Die Bäume und Sträucher sollen helfen, das zu verhindern.",
  "Und deshalb wurde hier schon vor 20 Jahren ein Projekt gestartet.",
  "Es wurden erfolgreich super viele Bäume gepflanzt.",
  "Um zu verhindern, dass Wüsten immer größer werden, gibt es verschiedene Möglichkeiten.",
  "Eine ist eben: An den Rändern von Wüsten Bäume oder Sträucher anzupflanzen, um die Ausbreitung der Wüsten durch diese sogenannten \"grünen Mauern\" aufzuhalten.",
  "Als sie hier 2008 die ersten Bäume pflanzten, glaubte niemand, dass die überleben würden.",
  "Doch sie waren erfolgreich: Und jetzt testet Forstexperte Ganzorig weiter, welche Setzlinge bei -40 bis +30 Grad Celsius am besten klarkommen.",
  "Die Mongolei ist besonders gefährdet.",
  "Andere Länder schauen immer aufmerksamer zu uns.",
  "Denn Wüstenbildung ist nicht nur ein Problem der Mongolei, sondern ein weltweites Problem.",
  "Ein Problem das die nächsten Tage auf der Klimakonferenz in der Mongolei angegangen werden soll.",
  "Wo es so richtig trocken ist, da ist es schwierig zu leben, was anzubauen und Tiere weiden zu lassen.",
  "Aber heißt das jetzt, dass Wüsten wie die Sahara völlig nutzlose Gebiete sind?",
  "Nee, überhaupt nicht.",
  "Eigentlich sind Wüsten sogar sehr wichtig für unseren Planeten.",
  "Sand, Felsen, Steine.",
  "Na, nicht nur.",
  "Schau'n wir mal genauer hin: Klar, Kamele.",
  "Aber die sind längst nicht die einzigen Tiere, die wirklich extrem gut angepasst sind an ein Leben in krasser Trockenheit.",
  "Und Pflanzen gibt's natürlich auch in der Wüste.",
  "Manche überdauern auch die trockensten Phasen.",
  "Andere kommen immer nur zum Vorschein, wenn's dann doch mal geregnet hat.",
  "Also: Wüsten sind wichtige Lebensräume.",
  "Und damit sind sie auch wichtig für die Forschung: an Pflanzen und Tieren hier können Fachleute erforschen, was es braucht, damit Leben in extremer Hitze überhaupt funktioniert.",
  "Deshalb wichtig, weil es insgesamt ja immer wärmer wird auf der Erde.",
  "Noch was: viele Wüsten haben Bodenschätz.",
  "Stoffe, die Menschen abbauen, um daraus superwichtige Sachen herzustellen.",
  "Achso, Sonne und Wind, sind in Wüstenregionen auch reichlich vorhanden.",
  "Genutzt werden können sie für Solar- und Windenergieanlagen.",
  "Und wo wir gerade beim Wind sind: In der Sahara beispielsweise bläst er jedes Jahr unfassbare Mengen Staub in die Luft.",
  "Im Staub: wichtige Nährstoffe für Pflanzen.",
  "Der Wind trägt die Nährstoffe weit fort – zum Beispiel bis in den Amazonas-Regenwald in Südamerika.",
  "Verrückt: eine der trockensten Regionen der Welt hilft einem Regenwald beim Wachsen.",
  "Auch Meeresalgen brauchen die Stoffe aus dem Saharastaub.",
  "Lebensraum, Bodenschätze, Energiequelle und Nährstofflieferant: An sich sind Wüsten also alles andere als nutzlos.",
  "An alle Kinder in Baden-Württemberg, Bayern, Berlin, Brandenburg, Hamburg, Nordrhein-Westfalen und Mecklenburg-Vorpommern: Ihr habt noch Sommerferien.",
  "Wie schön.",
  "Genießt die freie Zeit und die vielen spannenden Ferienerlebnisse.",
  "Und natürlich gehen auch liebe Grüße an alle in Bremen, Hessen, Niedersachsen, Rheinland-Pfalz, Sachsen, Sachsen-Anhalt, Schleswig- Holstein, Thüringen und im Saarland.",
  "Für euch hat die Schule zwar schon wieder begonnen, aber ihr hattet hoffentlich tolle Ferien und konntet viel erleben.",
  "So wie die Kinder aus dem Saarland, die jetzt kommen: Wasser und Erde.",
  "Ich hab eine bessere Idee.",
  "Für Emma und Mila die perfekte Kombination.",
  "Beim Staudamm-Bauen können sie richtig kreativ sein.",
  "Die Älteren helfen mit, damit alles gut klappt.",
  "Das Wasser ist vorher nur nach da gelaufen.",
  "Wir bauen jetzt noch einen 2. Weg, damit wir hier einen kleinen See bauen können.",
  "Für sie alle heißt es heute, raus aus der Stadt, ab ins Grüne.",
  "Auf die Kinder- und Jugendfarm in Saarlouis.",
  "In den Ferien organisiert das Jugendamt viele Ausflüge.",
  "Die kosten nur wenig, jeder kann dabei sein.",
  "Ich war jetzt bei drei anderen verschiedenen Ferienbetreuungen und die waren alle richtig cool.",
  "Ich und meine Eltern und mein Bruder waren im Schwimmbad.",
  "Ich habe mit meinen Freunden gespielt und schlafe bei einer Freundin morgen.",
  "Und heute bin ich froh hier zu sein.",
  "Zeit für neue Begegnungen.",
  "Auf der Farm lernen die Kinder den Umgang mit den Tieren.",
  "Die Gruppe darf selbst mit anpacken.",
  "Für die Esel ein super Wellness-Programm.",
  "Ist nicht so einfach, ne?",
  "Die Hufe sind richtig schwer.",
  "Zeit für eine Stärkung.",
  "Alle helfen mit.",
  "Es gibt Gurkensalat und Spaghetti mit Tomatensauce.",
  "Das schmeckt.",
  "Nicht nur die Kinder brauchen was zu futtern.",
  "Auch die Tiere müssen versorgt werden.",
  "Ziege Moritz scheint es zu schmecken.",
  "So schnell werden die Kinder den Tag auf der Farm nicht vergessen.",
  "Jetzt ist erst mal Abkühlung angesagt.",
  "Und jetzt seid ihr dran: Was fandet ihr in den Sommerferien besonders toll?",
  "Was hat euch am meisten Spaß gemacht?",
  "Oder gibt es etwas, auf das ihr euch noch total freut?",
  "Auf logo.de könnt ihr uns gerne eure Sommerferien-Highlights schreiben.",
  "Und wenn wir schon bei Highlights sind, dann schauen wir jetzt auf das große Sportwochenende zurück.",
  "Bei den Europameisterschaften im Schwimmen, den Weltmeisterschaften im Reiten, der Leichtathletik-EM und der WM in der Rhythmischen Sportgymnastik wurde um Medaillen gekämpft.",
  "Und für Deutschland lief es richtig gut.",
  "So gut, dass man bei all den Erfolgen den Überblick verlieren konnte.",
  "Aber keine Sorge: Wir bringen wir jetzt Ordnung ins Medaillen-Chaos.",
  "Deutschland gewinnt da, wo es erwartet wird.",
  "Und auch da, wo Erfolge zuletzt nicht so normal waren.",
  "Da wundert sich selbst so mancher Sportler.",
  "Bei der Reit-WM in Aachen zeigen die deutschen Reiterinnen und Reiter einmal mehr, warum sie seit Jahren zur Weltspitze gehören.",
  "Isabell Werth holt in der Dressur Bronze.",
  "Und Vielseitigkeits-Reiter Michael Jung sichert sich Gold im Einzel und Silber im Team.",
  "Richtig krass ist auch ihre Leistung: Darja Varfolomeev holt sich bei der Heim-WM in der Rhythmischen Sportgymnastik nach dem Titel im Mehrkampf auch Gold mit Ball und Band.",
  "Mit 19 Jahren kommt sie damit schon auf 14 WM-Titel - unfassbar.",
  "Besonders spannend sind die Erfolge in Sportarten, in denen Deutschland zuletzt nicht immer ganz vorne mitmischt.",
  "Bei der Leichtathletik-EM holt Frederik Ruppert Gold über 3000 Meter Hindernis.",
  "Dazu kommt Silber für die deutsche 4x100-Meter-Mixed-Staffel.",
  "Insgesamt holen die Leichtathletinnen und -athleten 21 Medaillen.",
  "Und auch im Schwimmbecken gibt es Grund zum Jubeln.",
  "Das deutsche Team sammelt bei der EM in Paris starke 32 Medaillen.",
  "Für den Höhepunkt sorgt Johannes Liebmann: Der 19-Jährige gewinnt Gold über 1500 Meter Freistil und stellt dabei sogar einen neuen Weltrekord auf.",
  "Für Deutschlands Sportlerinnen und Sportler hätte dieses Wochenende kaum besser laufen können.",
  "Und damit ist \"logo!\" auch schon wieder vorbei.",
  "Ich freue mich, wenn wir uns morgen wiedersehen.",
  "Jetzt kommen noch das Wetter und der Witz, heute von Sephie - danke dir.",
  "Macht es alle gut, bis dann und tschüss.",
  "Am Dienstag ist es fast überall in Deutschland bewölkt.",
  "Ab und zu kann es auch regnen – also packt den Regenschirm ein.",
  "Die Höchsttemperaturen liegen bei 19 bis 28 Grad.",
  "Was ist süß und lebt in der Wüste?",
  "Ein Karamell."
];

/* ---------- logo!-Pakete ----------
   Die logo!-Sendung besteht aus mehreren Themenblöcken (Paketen).
   Der Nutzer kann wählen, aus welchem Paket die Sätze kommen.
   „alle“ = alle Sätze aus der Sendung.
   Die Paket-Grenzen werden über die Anfangswörter der ersten Sätze
   bestimmt — so bleibt der Code auch bei kleinen Textänderungen stabil.
*/
const LOGO_PACKAGES = (() => {
  const all = LOGO_SENTENCES;
  const find = (prefix) => all.findIndex((s) => s.startsWith(prefix));
  const cut = (a, b) => all.slice(a, b);
  const iFlucht   = find("Manche Menschen kommen nach Deutschland");
  const iWueste   = find("Sand, so weit man gucken kann");
  const iFerien   = find("An alle Kinder in Baden-Württemberg");
  const iMedaillen= find("Und wenn wir schon bei Highlights sind");
  const iAbschied = find("Und damit ist");
  return {
    sport:       cut(0, iFlucht),
    gefluechtete: cut(iFlucht, iWueste),
    wueste:      cut(iWueste, iFerien),
    ferien:      cut(iFerien, iMedaillen),
    medaillen:   cut(iMedaillen, iAbschied),
    abschied:    cut(iAbschied, all.length)
  };
})();

// Pakete für die Auswahl im Dropdown („alle“ zuerst)
const LOGO_PACKAGE_OPTIONS = [
  { id: "alle",          label: "Alle (ganze Sendung)" },
  { id: "sport",         label: "Sport-Erfolge" },
  { id: "gefluechtete",  label: "Geflüchtete & Syrien" },
  { id: "wueste",        label: "Wüste & Mongolei" },
  { id: "ferien",        label: "Sommerferien" },
  { id: "medaillen",     label: "Medaillen-Rekord" },
  { id: "abschied",      label: "Wetter, Witz & Abschied" }
];

const MODES = [
  { id: "anfaenger",       label: "Anfänger",       hint: "Artikel + Nomen (korrekte Phrasen)" },
  { id: "fortgeschritten", label: "Fortgeschritten", hint: "Adjektiv + Nomen (korrekte Phrasen)" },
  { id: "saetze",          label: "Sätze",           hint: "Komplette Sätze" },
  { id: "logo",            label: "logo!",           hint: "Sätze aus der aktuellen logo!-Sendung" },
  { id: "regen",           label: "Regen-Spiel",      hint: "Wörter abschießen, bevor sie unten ankommen!" }
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
  logoPackage: "alle",
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

// Für die Konsole: unsichtbare/mehrdeutige Tasten klar darstellen
function displayKey(k){
  if (k === " ") return "␣ (Leertaste)";
  if (k === "Enter") return "⏎ (Enter)";
  if (k === "Tab") return "⇥ (Tab)";
  return String(k);
}

function keyEl(ch){
  const nk = normKey(ch);
  return document.querySelector('.key[data-key="' + nk + '"]');
}

function highlightNext(){
  document.querySelectorAll(".key.target, .key.mod").forEach((k) => k.classList.remove("target", "mod"));
  const ch = state.chars[state.pos];
  if (ch === undefined) return;
  const el = keyEl(ch);
  if (el) el.classList.add("target");

  // Großbuchstaben/Umlaute brauchen Shift bzw. Alt — das auch auf der Tastatur zeigen
  if (/[A-ZÄÖÜ]/.test(ch) || ch === "ß" || ch === "ẞ"){
    const shift = keyEl("SHIFT");
    if (shift) shift.classList.add("target", "mod");
  }
  if (/[ÄÖÜ]/.test(ch)){
    const alt = keyEl("ALT");
    if (alt) alt.classList.add("target", "mod");
  }
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
  if (state.mode === "logo"){
    const bank = state.logoPackage === "alle"
      ? LOGO_SENTENCES
      : LOGO_PACKAGES[state.logoPackage] || LOGO_SENTENCES;
    return bank[Math.floor(Math.random() * bank.length)];
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
    s.className = "ch" + (ch === " " ? " space" : "");
    s.textContent = ch === " " ? "\u00A0" : ch;
    d.appendChild(s);
  });
  updateClasses();
}

function updateClasses(){
  const spans = $("display").children;
  // Bereich des aktuellen Wortes bestimmen (für bessere Orientierung)
  let wStart = state.pos, wEnd = state.pos;
  if (state.chars[state.pos] === " "){
    wStart = wEnd = state.pos + 1;
  }
  while (wStart > 0 && state.chars[wStart - 1] !== " ") wStart--;
  while (wEnd < state.chars.length && state.chars[wEnd] !== " ") wEnd++;
  for (let i = 0; i < spans.length; i++){
    const s = spans[i];
    s.classList.remove("cur","done","wrong","wcur");
    if (i >= wStart && i < wEnd && i >= state.pos) s.classList.add("wcur");
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
    // nach korrekter Eingabe ggf. Hinweis-Status zurücksetzen
    const st = $("status");
    if (st.className.includes("warn") || st.className.includes("err")){
      st.textContent = "Weiter so – tippe weiter!";
      st.className = "status ok";
    }
    updateClasses(); renderStats();
  } else {
    const pos = state.pos;
    const expected = state.chars[pos];
    // Leertaste am Wortanfang (Position 0 oder direkt nach einem Leerzeichen):
    // Dort kann NIE eine Leertaste richtig sein → nicht als Fehler zählen, nur Hinweis.
    if (key === " " && (pos === 0 || state.chars[pos - 1] === " ")){
      console.log(
        "%cLeertaste am Wortanfang (ignoriert)","color:#ffc46b;font-weight:bold",
        "Hier beginnt ein neues Wort (" + displayKey(expected) + ").",
        "Tippe erst den Buchstaben, dann die Leertaste zwischen den Wörtern."
      );
      const sp = keyEl(" ");
      if (sp){
        sp.classList.add("hit");
        sp.style.background = "var(--warn)";
        setTimeout(() => { sp.style.background = ""; sp.classList.remove("hit"); }, 180);
      }
      return; // KEIN Fehler, KEIN Fortschritt — nur Hinweis
    }
    state.mistakes++;
    flashKey(key, false);
    // Erwartete Tastenkombination darstellen (Großbuchstaben → Shift+...)
    let needShift = false;
    let needAlt = false;
    let base = expected;
    if (expected === "Ä"){ needShift = true; needAlt = true; base = "a"; }
    else if (expected === "Ö"){ needShift = true; needAlt = true; base = "o"; }
    else if (expected === "Ü"){ needShift = true; needAlt = true; base = "u"; }
    else if (/^[A-Z]$/.test(expected)){ needShift = true; base = expected.toLowerCase(); }
    else if (expected === "ß"){ needShift = true; base = "ß"; }
    // Mac: Umlaute meist mit gedrücktem Alt (Option) + Vokal, ß = Alt+s.
    // Zusätzliche Mac-Methode: Alt+u (Trema) loslassen, dann Vokal (äöü).
    let combo = (needShift ? "Shift+" : "") + (needAlt ? "Alt+" : "") + base;
    let tip = "";
    if (expected === "ä" || expected === "Ä") tip = " (Mac-Alternative: Alt+u loslassen, dann a)";
    else if (expected === "ö" || expected === "Ö") tip = " (Mac-Alternative: Alt+u loslassen, dann o)";
    else if (expected === "ü" || expected === "Ü") tip = " (Mac-Alternative: Alt+u loslassen, dann u)";
    else if (expected === "ß" || expected === "ẞ") tip = " (Mac: Alt+s bzw. Shift+Alt+s)";
    // Nur Groß-/Kleinschreibung weicht ab? Dann Hinweis (z. B. Caps Lock / versehentl. Shift)
    const onlyCase = (expected.toLowerCase() === key.toLowerCase() || expected.toUpperCase() === key.toUpperCase())
                   && !(expected.toLowerCase() === expected.toUpperCase());
    if (onlyCase && new RegExp(expected, "i").test(key)){
      console.log(
        "%cNur Groß-/Kleinschreibung weicht ab!","color:#ffc46b;font-weight:bold",
        "Erwartet:", "»", displayKey(expected), "«", "| Gedrückt:", "»", displayKey(key), "«",
        "→ Caps Lock aus? Oder Shift nicht (falsch) gedrückt."
      );
      // Sichtbarer Hinweis im Status + Shift-Taste kurz aufleuchten lassen
      setStatus("Großbuchstabe erwartet: " + displayKey(expected) + " — drücke " + combo + "!", "warn");
      const shiftEl = keyEl("SHIFT");
      if (shiftEl && needShift){
        shiftEl.classList.add("hit");
        shiftEl.style.background = "var(--warn)";
        setTimeout(() => { shiftEl.style.background = ""; shiftEl.classList.remove("hit"); }, 260);
      }
      const lc = $("display").children[state.pos];
      if (lc){
        lc.classList.remove("wrong");
        void lc.offsetWidth;
        lc.classList.add("wrong");
        setTimeout(() => lc.classList.remove("wrong"), 260);
      }
    }
    // Typfehler-Details in die Konsole schreiben (F12 → Konsole)
    console.log(
      "[Tippfehler]",
      "erwartet:", "»", displayKey(expected), "«", "(" + combo + ")" + tip,
      "| gedrückt:", "»", displayKey(key), "«",
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

  // Regen-Spiel: Tasten direkt an das Spiel weiterleiten –
  // außer, es wird gerade in ein Eingabefeld getippt (z. B. Name).
  const tag = (e.target && e.target.tagName) || "";
  if (state.mode === "regen" && tag !== "INPUT" && tag !== "TEXTAREA"){
    if (rainKey(key)) e.preventDefault();
    return;
  }
  if (state.mode === "regen") return; // sonst Eingabefeld normal reagieren lassen

  // Tastenwiederholung ignorieren, damit gehaltene Tasten nicht mehrfach feuern
  if (e.repeat && !state.finished) return;

  // Caps Lock-Erkennung: wenn an und ein Kleinbuchstabe erwartet wird, Hinweis geben
  if (typeof e.getModifierState === "function" && e.getModifierState("CapsLock")){
    const expected = state.chars[state.pos];
    if (expected && /[a-zäöü]/.test(expected)){
      console.log(
        "%cCaps Lock ist AN!","color:#ffc46b;font-weight:bold",
        "Erwartet wird Kleinbuchstabe:", "»", displayKey(expected), "«",
        "→ schalte Caps Lock aus, sonst werden Großbuchstaben als Fehler gewertet."
      );
    }
  }

  if (key === "Escape"){
    if (state.running){ e.preventDefault(); resetRound("Abgebrochen — drücke eine Taste, um von vorn zu beginnen."); }
    else if (state.finished){ newRound(); }
    return;
  }

  if (state.finished){
    if (key === "Enter" || key === "r" || key === "R" || key === " "){ e.preventDefault(); newRound(); }
    return;
  }

  // ACHTUNG: kein R/r-Shortcut während des Tippens!
  // "r" ist ein häufiger deutscher Buchstabe (Arbeit, für, Wort …)
  // und würde sonst die ganze Runde neu starten.

  if (key.length > 1) return;

  if (key === " ") e.preventDefault();
  if (!state.running){ startTimer(); state.running = true; }
  processKey(key);
}

/* ---------- Regen-Wortpaket-Auswahl ---------- */
function buildRainPackages(){
  const sel = $("rain-pkg-select");
  if (!sel) return;
  sel.innerHTML = "";
  RAIN_WORDS_OPTIONS.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.label;
    sel.appendChild(opt);
  });
  // Gespeicherte Auswahl wiederherstellen
  try {
    const saved = localStorage.getItem("typtrainer-de:rain-word-set");
    if (saved && RAIN_WORDS_OPTIONS.some((o) => o.id === saved)) rainWordSet = saved;
  } catch (e) { /* ignore */ }
  sel.value = rainWordSet || "alle";
  sel.addEventListener("change", () => {
    rainWordSet = sel.value;
    try { localStorage.setItem("typtrainer-de:rain-word-set", rainWordSet); } catch (e) {}
    // Neue Runde / Auswahl wirkt sofort
    if (state.mode === "regen"){ setMode("regen"); } // Regen-Spiel sauber neu starten
  });
}

/* ---------- Modus ---------- */
function setMode(id){
  state.mode = id;
  const sel = $("mode-select");
  if (sel && sel.value !== id) sel.value = id; // Dropdown synchron halten
  // Paket-Auswahl nur im logo!-Modus zeigen
  const pkgWrap = $("pkg-wrap");
  if (pkgWrap) pkgWrap.classList.toggle("hidden", id !== "logo");
  // Wortpaket-Auswahl nur im Regen-Modus zeigen
  const rainPkgWrap = $("rain-pkg-wrap");
  if (rainPkgWrap) rainPkgWrap.classList.toggle("hidden", id !== "regen");
  if (id === "regen"){
    // Spielansicht zeigen, Tipp-Ansicht ausblenden
    $("game-card").classList.remove("hidden");
    $("card-typing").classList.add("hidden");
    rainStop();
    rainStart();
  } else {
    // Tipp-Ansicht zeigen, Spiel beenden
    $("game-card").classList.add("hidden");
    $("card-typing").classList.remove("hidden");
    rainStop();
    newRound();
  }
}

function buildModes(){
  const sel = $("mode-select");
  sel.innerHTML = ""; // keine veralteten Einträge
  MODES.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.label + " — " + m.hint;
    opt.dataset.group = m.group || "tippen";
    sel.appendChild(opt);
  });
  sel.value = state.mode; // aktuelle Auswahl setzen
  sel.addEventListener("change", () => setMode(sel.value));
}

/* ---------- logo!-Paket-Auswahl ---------- */
function buildLogoPackages(){
  const sel = $("pkg-select");
  if (!sel) return;
  sel.innerHTML = "";
  LOGO_PACKAGE_OPTIONS.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.label;
    sel.appendChild(opt);
  });
  // Gespeicherte Auswahl wiederherstellen
  try {
    const saved = localStorage.getItem("typtrainer-de:logo-package");
    if (saved && LOGO_PACKAGES[saved]) state.logoPackage = saved;
  } catch (e) { /* ignore */ }
  sel.value = state.logoPackage;
  sel.addEventListener("change", () => {
    state.logoPackage = sel.value;
    try { localStorage.setItem("typtrainer-de:logo-package", state.logoPackage); } catch (e) {}
    // neue Runde mit dem gewählten Paket starten
    if (state.mode === "logo") newRound();
  });
}

/* ---------- Init ---------- */
buildKeyboard();
buildModes();
buildLogoPackages();
buildRainPackages();
window.addEventListener("keydown", onKeyDown);
$("btn-again").addEventListener("click", () => newRound());
$("rain-again").addEventListener("click", () => {
  $("rain-overlay").classList.add("hidden");
  rainStart();
});
$("rain-start-btn").addEventListener("click", () => rainShowDifficulty());
document.querySelectorAll(".difficulty").forEach((b) => {
  b.addEventListener("click", () => rainBegin(b.dataset.difficulty));
});
// Bestenliste
$("rain-lb-submit").addEventListener("click", () => {
  rainSubmitScore($("rain-lb-name").value);
});
$("rain-lb-name").addEventListener("keydown", (e) => {
  if (e.key === "Enter"){ e.preventDefault(); rainSubmitScore($("rain-lb-name").value); }
});
$("rain-lb-show-btn").addEventListener("click", () => {
  rainRenderLeaderboard($("rain-lb-list"));
  $("rain-lb-overlay").classList.remove("hidden");
});
$("rain-lb-close").addEventListener("click", () => {
  $("rain-lb-overlay").classList.add("hidden");
});
// Das Regen-Spiel ist die Standardansicht
setMode("regen");

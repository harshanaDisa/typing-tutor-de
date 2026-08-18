"use strict";
// Playwright-Test: Prüft das Dropdown zum Umschalten zwischen den Modi.
// Start: node e2e/menu.test.js
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://127.0.0.1:8000/index.html";
const expected = ["anfaenger", "fortgeschritten", "saetze", "logo", "regen"];

(async () => {
  let browser;
  let failed = 0;
  function assert(cond, msg){
    if (cond){ console.log("  ok: " + msg); }
    else { console.log("  FAIL: " + msg); failed++; }
  }

  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", err => errors.push("PAGEERROR: " + err.message));

    console.log("Lade " + BASE);
    await page.goto(BASE, { waitUntil: "load" });
    await page.waitForTimeout(600);

    console.log("\n[1] Dropdown ist sichtbar:");
    const dd = page.locator("#mode-select");
    const ddCount = await dd.count();
    assert(ddCount === 1, "select#mode-select existiert");
    if (ddCount === 1) assert(await dd.isVisible(), "select ist sichtbar");

    console.log("\n[2] Enthält alle 5 Modi:");
    for (const m of expected){
      const optCount = await page.locator('#mode-select option[value="' + m + '"]').count();
      assert(optCount === 1, "Option '" + m + "' vorhanden");
    }
    const optionCount = await page.locator("#mode-select option").count();
    assert(optionCount === 5, "genau 5 Optionen (gefunden " + optionCount + ")");

    console.log("\n[3] Standardauswahl ist regen:");
    const val = await dd.inputValue();
    assert(val === "regen", "Dropdown-Wert ist regen (ist '" + val + "')");

    console.log("\n[4] Auswahl 'anfaenger' wechselt zur Tipp-Ansicht:");
    await dd.selectOption("anfaenger");
    await page.waitForTimeout(300);
    const typingHidden = await page.locator("#card-typing").evaluate(el => !el.classList.contains("hidden"));
    assert(typingHidden, "#card-typing nicht versteckt (Tipp-Ansicht sichtbar)");
    const gameHidden = await page.locator("#game-card").evaluate(el => el.classList.contains("hidden"));
    assert(gameHidden, "#game-card versteckt");
    const val2 = await dd.inputValue();
    assert(val2 === "anfaenger", "Dropdown zeigt anfaenger");

    console.log("\n[5] Anzeige zeigt Zieltext:");
    const disp = await page.locator("#display").innerText().catch(() => "");
    assert(disp.length > 0, "#display enthält Zieltext (Länge " + disp.length + ")");

    console.log("\n[6] Zurück zu 'regen' (Spielansicht):");
    await dd.selectOption("regen");
    await page.waitForTimeout(300);
    const gameShown = await page.locator("#game-card").evaluate(el => !el.classList.contains("hidden"));
    assert(gameShown, "#game-card sichtbar");
    assert(await page.locator("#rain-start-btn").isVisible(), "Starten-Button im Spiel sichtbar");

    console.log("\n[7] Keine JS-Fehler:");
    assert(errors.length === 0, "keine Fehler (" + errors.length + (errors.length ? ": " + errors.join(" | ") : "") + ")");

    console.log("\n\n===== ERGEBNIS: " + (failed === 0 ? "ALLES BESTANDEN" : failed + " FEHLGESCHLAGEN") + " =====");
  } catch (err) {
    console.error("TEST ABGEBROCHEN: " + err.message);
    failed++;
  } finally {
    if (browser) await browser.close();
    process.exit(failed === 0 ? 0 : 1);
  }
})();

"use strict";
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:8000/index.html", { waitUntil: "load" });
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const nav = document.getElementById("modes");
    const firstBtn = document.querySelector(".mode");
    const navRect = nav.getBoundingClientRect();
    const winH = window.innerHeight;
    const body = document.body;
    return {
      navTop: navRect.top,
      navBottom: navRect.bottom,
      winH,
      navVisible: navRect.top >= 0 && navRect.bottom <= winH,
      firstBtnText: firstBtn ? firstBtn.textContent.trim() : null,
      bodyScrollHeight: body.scrollHeight,
      wrapOverflow: (() => { const w = document.querySelector(".wrap"); return w ? {h: w.getBoundingClientRect().height, win: winH} : null; })()
    };
  });
  console.log(JSON.stringify(info, null, 2));
  console.log("pageerrors:", errors);
  await browser.close();
  process.exit(0);
})();

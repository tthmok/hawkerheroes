// Run the CPU demo and verify the dish-washing economy stays healthy:
// plates conserved, dirty pile builds, bots wash, clean never stuck at 0, score flows.
const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const url = pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?demo';
  const errors = [];
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE.ERROR: ' + m.text()); });

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 25000 });
    await page.waitForFunction(
      () => { const g = window.HC.game.scene.getScene('Game'); return g && g.scene.isActive() && g.state && g.state.running; },
      { timeout: 12000 });

    const PLATES = await page.evaluate(() => window.HC.Config.KITCHEN.PLATES);
    let maxDirty = 0, conserved = true, score0 = null, lastScore = 0, lastClean = null, lastDirty = null;
    for (let i = 0; i < 9; i++) {
      await new Promise(r => setTimeout(r, 4000));
      const s = await page.evaluate(() => {
        const g = window.HC.game.scene.getScene('Game');
        if (!g || !g.scene.isActive() || !g.kitchen) return null;
        return { clean: g.kitchen.clean, dirty: g.kitchen.dirty, score: g.state.score };
      });
      if (!s) continue;
      if (score0 === null) score0 = s.score;
      lastScore = s.score; lastClean = s.clean; lastDirty = s.dirty;
      maxDirty = Math.max(maxDirty, s.dirty);
      if (s.clean + s.dirty > PLATES) conserved = false;   // held = PLATES-clean-dirty >= 0
      if (s.clean < 0 || s.dirty < 0) conserved = false;
    }

    console.log(JSON.stringify({
      ok: errors.length === 0,
      PLATES, conserved,
      scoreClimbed: lastScore > (score0 || 0),       // cooking still flows with the plate gate
      dirtyBuilt: maxDirty > 0,                       // washing was actually needed
      endClean: lastClean, endDirty: lastDirty,
      notStuckEmpty: lastClean > 0,                   // bots recovered clean plates
      errors
    }, null, 2));
  } catch (e) { console.log('EXCEPTION ' + e.message + '\n' + JSON.stringify(errors)); }
  finally { await browser.close(); }
})();

// Launch the CPU demo and verify the bots actually cook & serve over ~35s.
const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const url = process.argv[2] || (pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?demo');
  const errors = [];
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE.ERROR: ' + m.text()); });

  const snap = () => page.evaluate(() => {
    const g = window.HC.game.scene.getScene('Game');
    if (!g || !g.scene.isActive()) return null;
    return {
      running: !!(g.state && g.state.running),
      demo: g.demo,
      botTypes: g.players.map(p => p.input && p.input.constructor === window.HC.BotController ? 'bot' : 'other'),
      score: g.state.score, served: g.stats.served, angry: g.stats.angry,
      held: g.players.map(p => p.held.length),
      customers: g.tables.filter(t => t.customer).length
    };
  });

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 25000 });
    await page.waitForFunction(
      () => { const g = window.HC.game.scene.getScene('Game'); return g && g.scene.isActive() && g.state && g.state.running; },
      { timeout: 12000 });

    const timeline = [];
    for (let i = 0; i < 7; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const s = await snap();
      timeline.push(s);
      if (i === 3 && s) await page.screenshot({ path: path.join(__dirname, 'shot-demo.png') });
    }

    const last = timeline.filter(Boolean).pop() || {};
    console.log(JSON.stringify({
      ok: errors.length === 0,
      botsActive: last.botTypes,
      finalScore: last.score,
      served: last.served,
      angry: last.angry,
      scoreProgression: timeline.filter(Boolean).map(s => s.score),
      servedProgression: timeline.filter(Boolean).map(s => s.served),
      errors
    }, null, 2));
  } catch (e) {
    console.log('EXCEPTION: ' + e.message + '\n' + JSON.stringify(errors, null, 2));
  } finally {
    await browser.close();
  }
})();

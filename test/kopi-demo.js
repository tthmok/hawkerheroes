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
  await page.goto(url, { waitUntil: 'load', timeout: 25000 });
  await page.waitForFunction(() => { const g = window.HC.game.scene.getScene('Game'); return g && g.state && g.state.running; }, { timeout: 12000 });
  let sawCup = false, kopiOrdersSeen = false, s0 = null, last = {};
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 4500));
    const s = await page.evaluate(() => {
      const g = window.HC.game.scene.getScene('Game'); const D = window.HC.Data;
      if (!g || !g.scene.isActive()) return null;
      const cups = g.players.some(p => p.held.some(id => D.isCup(id)));
      const kopiOrders = g.tables.some(t => t.customer && t.customer.order.some(o => D.kopi.byId(o)));
      return { score: g.state.score, served: g.stats.served, angry: g.stats.angry, cups, kopiOrders };
    });
    if (!s) continue;
    if (s0 === null) s0 = s.score;
    if (s.cups) sawCup = true;
    if (s.kopiOrders) kopiOrdersSeen = true;
    last = s;
  }
  console.log(JSON.stringify({
    ok: errors.length === 0, kopiOrdersSeen, botsAssembledCup: sawCup,
    finalScore: last.score, served: last.served, angry: last.angry,
    scoreClimbed: last.score > (s0 || 0), errors
  }, null, 2));
  await browser.close();
})();
